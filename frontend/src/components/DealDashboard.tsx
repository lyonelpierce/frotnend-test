import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { dealsApi } from '../lib/api'
import { StageColumn } from './StageColumn'
import { SearchAndFilters } from './SearchAndFilters'
import { Skeleton } from './ui/skeleton'
import { Alert, AlertDescription } from './ui/alert'
import type { Deal, DealStage } from '../lib/api'

// Map the backend stages to the requested stages
const STAGE_MAPPING: Record<string, string> = {
  Prospect: 'Intake',
  Application: 'Intake',
  Underwriting: 'Underwriting',
  CreditMemo: 'Credit Memo',
  Docs: 'Docs',
  Approved: 'Funded',
  Closed: 'Funded',
  Declined: 'Funded',
}

const STAGES = ['Intake', 'Underwriting', 'Credit Memo', 'Docs', 'Funded']

export function DealDashboard() {
  const queryClient = useQueryClient()

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Drag and drop state
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [updatingDeals, setUpdatingDeals] = useState<Set<string>>(new Set())

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch deals with current filters
  const {
    data: dealsData,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: [
      'deals',
      {
        searchTerm: debouncedSearchTerm,
        selectedProduct,
        minAmount,
        maxAmount,
        sortBy,
        sortOrder,
      },
    ],
    queryFn: () =>
      dealsApi.getDeals({
        search: debouncedSearchTerm || undefined,
        product: selectedProduct || undefined,
        minAmt: minAmount ? parseFloat(minAmount) : undefined,
        maxAmt: maxAmount ? parseFloat(maxAmount) : undefined,
        sort: sortBy,
        order: sortOrder,
        limit: 100, // Get more deals for the dashboard
      }),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
  })

  // Update deal mutation with optimistic updates
  const updateDealMutation = useMutation({
    mutationFn: ({
      dealId,
      updates,
    }: {
      dealId: string
      updates: { stage: DealStage }
    }) => dealsApi.updateDeal(dealId, updates),
    onMutate: async ({ dealId, updates }) => {
      // Add to updating deals set for visual feedback
      setUpdatingDeals((prev) => new Set(prev).add(dealId))

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['deals'] })

      // Snapshot the previous value
      const previousDeals = queryClient.getQueryData(['deals'])

      // Optimistically update to the new value
      queryClient.setQueryData(['deals'], (old: any) => {
        if (!old?.items) return old

        return {
          ...old,
          items: old.items.map((deal: Deal) =>
            deal.id === dealId
              ? {
                  ...deal,
                  stage: updates.stage,
                  updatedAt: new Date().toISOString(),
                }
              : deal,
          ),
        }
      })

      // Return a context object with the snapshotted value
      return { previousDeals }
    },
    onError: (err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals'], context.previousDeals)
      }

      // Show error message (you could add a toast notification here)
      console.error('Failed to update deal:', err)
    },
    onSettled: (_, __, variables) => {
      // Remove from updating deals set
      setUpdatingDeals((prev) => {
        const newSet = new Set(prev)
        newSet.delete(variables.dealId)
        return newSet
      })

      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: ['deals'] })
    },
  })

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    if (!dealsData?.items) return {}

    const grouped: Record<string, Array<Deal>> = {}
    STAGES.forEach((stage) => (grouped[stage] = []))

    dealsData.items.forEach((deal) => {
      const mappedStage = STAGE_MAPPING[deal.stage] || 'Funded'
      grouped[mappedStage].push(deal)
    })

    return grouped
  }, [dealsData])

  // Handle drag start
  const handleDealDragStart = useCallback((e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', deal.id)

    // Create a custom drag image for better visual feedback
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.transform = 'rotate(5deg) scale(1.05)'
    dragImage.style.opacity = '0.8'
    dragImage.style.border = '2px solid #3b82f6'
    dragImage.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)'
    dragImage.style.borderRadius = '8px'
    dragImage.style.pointerEvents = 'none'
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    dragImage.style.left = '-1000px'
    dragImage.style.zIndex = '1000'

    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)

    // Clean up the drag image after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage)
      }
    }, 0)
  }, [])

  // Handle drag end
  const handleDealDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedDeal(null)
    setDragOverStage(null)
    e.dataTransfer.clearData()
  }, [])

  // Handle drop
  const handleDealDrop = useCallback(
    (e: React.DragEvent, targetStage: string) => {
      e.preventDefault()
      setDragOverStage(null)

      if (!draggedDeal) return

      // Map the target stage back to backend stage
      const backendStage = Object.entries(STAGE_MAPPING).find(
        ([_, mappedStage]) => mappedStage === targetStage,
      )?.[0] as DealStage

      if (backendStage === draggedDeal.stage) return

      // Update the deal with optimistic update
      updateDealMutation.mutate({
        dealId: draggedDeal.id,
        updates: { stage: backendStage },
      })
    },
    [draggedDeal, updateDealMutation],
  )

  // Handle drag over
  const handleDealDragOver = useCallback(
    (e: React.DragEvent, targetStage: string) => {
      e.preventDefault()
      setDragOverStage(targetStage)
    },
    [],
  )

  // Handle drag leave
  const handleDealDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStage(null)
    }
  }, [])

  if (error instanceof Error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-screen-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading deals: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const groupedDeals = dealsByStage

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-screen-2xl mx-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Deal Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage and track deals through the pipeline
            </p>
          </div>
          {isFetching && !isLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Updating...
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <SearchAndFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          minAmount={minAmount}
          onMinAmountChange={setMinAmount}
          maxAmount={maxAmount}
          onMaxAmountChange={setMaxAmount}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />

        {/* Stage Columns */}
        {isLoading ? (
          <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <div key={stage} className="flex-1 min-w-[280px] sm:min-w-0">
                <div className="mb-4">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="min-h-[400px] p-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <StageColumn
                key={stage}
                title={stage}
                deals={groupedDeals[stage] ?? []}
                onDealDragStart={handleDealDragStart}
                onDealDragEnd={handleDealDragEnd}
                onDealDrop={handleDealDrop}
                onDealDragOver={handleDealDragOver}
                onDealDragLeave={handleDealDragLeave}
                isDragOver={dragOverStage === stage}
                draggedDeal={draggedDeal}
                updatingDeals={updatingDeals}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
