import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useState } from 'react'

import type { TermSheetSuggestionsQuery } from '@/lib/api'
import { dealsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { BorrowerFacts } from '@/components/BorrowerFacts'
import { FinancialSummary } from '@/components/FinancialSummary'
import { RequestedTerms } from '@/components/RequestedTerms'
import { RiskInsights } from '@/components/RiskInsights'
import { DocumentsChecklist } from '@/components/DocumentsChecklist'
import { ActivityTimeline } from '@/components/ActivityTimeline'
import { TermSheetPlayground } from '@/components/TermSheetPlayground'

export const Route = createFileRoute('/deals/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()

  // Term sheet playground state
  const [termSheetInputs, setTermSheetInputs] =
    useState<TermSheetSuggestionsQuery>({
      amount: undefined,
      rate: undefined,
      amort: undefined,
      term: undefined,
    })

  const { data: deal, isLoading: dealLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => dealsApi.getDeal(id),
  })

  const { data: borrower, isLoading: borrowerLoading } = useQuery({
    queryKey: ['borrower', deal?.borrowerId],
    queryFn: () => dealsApi.getBorrower(deal!.borrowerId),
    enabled: !!deal?.borrowerId,
  })

  const { data: financials, isLoading: financialsLoading } = useQuery({
    queryKey: ['financials', deal?.borrowerId],
    queryFn: () =>
      dealsApi.getBorrowerFinancials(deal!.borrowerId, {
        fromYear: 2022,
        toYear: 2024,
      }),
    enabled: !!deal?.borrowerId,
  })

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => dealsApi.getDealDocuments(id),
  })

  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
  } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => dealsApi.getDealActivity(id),
  })

  const { data: termSheet, isLoading: termSheetLoading } = useQuery({
    queryKey: ['termSheet', id],
    queryFn: () => dealsApi.getTermSheet(id),
  })

  const { data: termSheetSuggestions, isLoading: suggestionsLoading } =
    useQuery({
      queryKey: ['termSheetSuggestions', id, termSheetInputs],
      queryFn: () => dealsApi.getTermSheetSuggestions(id, termSheetInputs),
      enabled: Object.values(termSheetInputs).some(
        (value) => value !== undefined,
      ),
    })

  const requestDocumentMutation = useMutation({
    mutationFn: (document: {
      label: string
      type: string
      requiredBy?: string
    }) => dealsApi.requestDocument(id, document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', id] })
    },
  })

  const handleRequestDocument = (doc: {
    label: string
    type: string
    requiredBy?: string
  }) => {
    requestDocumentMutation.mutate(doc)
  }

  const handleTermSheetInputChange = (
    field: keyof TermSheetSuggestionsQuery,
    value: string,
  ) => {
    setTermSheetInputs((prev) => ({
      ...prev,
      [field]: value ? parseFloat(value) : undefined,
    }))
  }

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }, [])

  const generateTermSheetSummary = () => {
    if (!termSheet) return ''

    const inputs = Object.entries(termSheetInputs)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')

    return `Term Sheet Summary
Deal: ${deal?.name || 'N/A'}
Amount: $${termSheetInputs.amount?.toLocaleString() || 'Not specified'}
Rate: ${termSheetInputs.rate ? `${termSheetInputs.rate}%` : 'Not specified'}
Amortization: ${termSheetInputs.amort ? `${termSheetInputs.amort} months` : 'Not specified'}
Term: ${termSheetInputs.term ? `${termSheetInputs.term} months` : 'Not specified'}

Current Term Sheet:
Base Rate: ${termSheet.baseRate}
Margin: ${termSheet.marginBps} bps
Amortization: ${termSheet.amortMonths} months
Interest Only: ${termSheet.interestOnlyMonths} months
Origination Fee: ${termSheet.originationFeeBps} bps
${termSheet.prepayPenalty ? `Prepay Penalty: ${termSheet.prepayPenalty}` : ''}
${termSheet.collateral ? `Collateral: ${termSheet.collateral}` : ''}

${inputs ? `Input Parameters: ${inputs}` : ''}`
  }

  if (dealLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-5 w-5" />
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Tabs Skeleton */}
            <div className="grid w-full grid-cols-4 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-28 mb-2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-36" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-12 mb-1" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!deal) {
    return <div className="p-6">Deal not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {deal.name}
                </h1>
                <p className="text-sm text-gray-500">Deal ID: {deal.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  deal.stage === 'Approved'
                    ? 'success'
                    : deal.stage === 'Declined'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {deal.stage}
              </Badge>
              <Badge variant="outline">{deal.product}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="term-sheet">Term-Sheet Playground</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Borrower Facts */}
              <BorrowerFacts borrower={borrower} isLoading={borrowerLoading} />

              {/* Financial Summary */}
              <FinancialSummary
                financials={financials}
                isLoading={financialsLoading}
              />
            </div>

            {/* Requested Terms */}
            <RequestedTerms
              deal={deal}
              termSheet={termSheet}
              termSheetLoading={termSheetLoading}
            />

            {/* Risk & Insights */}
            <RiskInsights
              riskScore={deal.riskScore}
              flags={deal.flags}
              docsProgress={deal.docsProgress}
            />
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-6">
            <DocumentsChecklist
              documents={documents}
              isLoading={documentsLoading}
              onRequestDocument={handleRequestDocument}
              isRequesting={requestDocumentMutation.isPending}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <ActivityTimeline
              activity={activity}
              isLoading={activityLoading}
              error={activityError}
            />
          </TabsContent>

          {/* Term-Sheet Playground Tab */}
          <TabsContent value="term-sheet" className="space-y-6">
            <TermSheetPlayground
              termSheet={termSheet}
              termSheetLoading={termSheetLoading}
              termSheetInputs={termSheetInputs}
              onTermSheetInputChange={handleTermSheetInputChange}
              onResetToDealAmount={() =>
                setTermSheetInputs({
                  amount: deal.requestedAmount,
                  rate: undefined,
                  amort: undefined,
                  term: undefined,
                })
              }
              onCopySummary={() => copyToClipboard(generateTermSheetSummary())}
              termSheetSuggestions={termSheetSuggestions}
              suggestionsLoading={suggestionsLoading}
              summaryText={generateTermSheetSummary()}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
