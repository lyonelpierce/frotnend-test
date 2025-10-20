import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  Calculator,
  Clock,
  Copy,
  DollarSign,
  Download,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { useCallback, useState } from 'react'

import type { TermSheetSuggestionsQuery } from '@/lib/api'
import { dealsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

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
    return <div className="p-6">Loading deal...</div>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Borrower Facts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {borrowerLoading ? (
                    <div>Loading borrower info...</div>
                  ) : borrower ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Legal Name
                          </p>
                          <p className="text-sm">{borrower.legalName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Industry
                          </p>
                          <p className="text-sm">
                            {borrower.industry || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            NAICS
                          </p>
                          <p className="text-sm">{borrower.naics || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Existing Relationship
                          </p>
                          <p className="text-sm">
                            {borrower.existingRelationship ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                      {borrower.address && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Address
                          </p>
                          <p className="text-sm">{borrower.address}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>No borrower information available</div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Financial Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {financialsLoading ? (
                    <div>Loading financials...</div>
                  ) : financials && financials.length > 0 ? (
                    <div className="space-y-4">
                      {financials.slice(0, 3).map((financial, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">
                              {financial.period}
                            </span>
                            <span className="text-xs text-gray-500">
                              {financial.periodEnd}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Revenue</p>
                              <p className="font-medium">
                                ${financial.revenue.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">EBITDA</p>
                              <p className="font-medium">
                                ${financial.ebitda.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>No financial data available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Requested Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Requested Terms</CardTitle>
              </CardHeader>
              <CardContent>
                {termSheetLoading ? (
                  <div>Loading term sheet...</div>
                ) : termSheet ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Requested Amount
                      </p>
                      <p className="text-lg font-semibold">
                        ${deal.requestedAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Base Rate
                      </p>
                      <p className="text-lg font-semibold">
                        {termSheet.baseRate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Amortization
                      </p>
                      <p className="text-lg font-semibold">
                        {termSheet.amortMonths} months
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Origination Fee
                      </p>
                      <p className="text-lg font-semibold">
                        {termSheet.originationFeeBps} bps
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Requested Amount
                      </p>
                      <p className="text-lg font-semibold">
                        ${deal.requestedAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Probability
                      </p>
                      <p className="text-lg font-semibold">
                        {(deal.probability * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">DSCR</p>
                      <p className="text-lg font-semibold">
                        {deal.dscr ? deal.dscr.toFixed(2) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">LTV</p>
                      <p className="text-lg font-semibold">
                        {deal.ltv ? (deal.ltv * 100).toFixed(1) + '%' : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk & Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Risk & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {deal.riskScore && (
                    <Badge
                      variant={
                        deal.riskScore > 7
                          ? 'destructive'
                          : deal.riskScore > 4
                            ? 'warning'
                            : 'success'
                      }
                    >
                      Risk Score: {deal.riskScore}/10
                    </Badge>
                  )}
                  {deal.flags.map((flag, index) => (
                    <Badge key={index} variant="warning">
                      {flag}
                    </Badge>
                  ))}
                  {deal.docsProgress !== null && (
                    <Badge
                      variant={deal.docsProgress === 100 ? 'success' : 'info'}
                    >
                      Docs: {deal.docsProgress}%
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>
                  Track the status of required documents for this deal
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div>Loading documents...</div>
                ) : documents?.items && documents.items.length > 0 ? (
                  <div className="space-y-4">
                    {documents.items.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.label}</p>
                            <p className="text-sm text-gray-500">{doc.type}</p>
                            {doc.requiredBy && (
                              <p className="text-xs text-gray-400">
                                Due:{' '}
                                {new Date(doc.requiredBy).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge
                            variant={
                              doc.status === 'received' ||
                              doc.status === 'verified'
                                ? 'success'
                                : doc.status === 'rejected'
                                  ? 'destructive'
                                  : doc.status === 'requested'
                                    ? 'warning'
                                    : 'secondary'
                            }
                          >
                            {doc.status}
                          </Badge>
                          {doc.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleRequestDocument({
                                  label: doc.label,
                                  type: doc.type,
                                  requiredBy: doc.requiredBy || undefined,
                                })
                              }
                              disabled={requestDocumentMutation.isPending}
                            >
                              {requestDocumentMutation.isPending
                                ? 'Requesting...'
                                : 'Request'}
                            </Button>
                          )}
                          {doc.link && (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No documents required for this deal
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>
                  Recent events and updates for this deal
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div>Loading activity...</div>
                ) : activityError ? (
                  <div className="text-red-500">
                    Error loading activity: {activityError.message}
                  </div>
                ) : activity?.items && activity.items.length > 0 ? (
                  <div className="space-y-4">
                    {activity.items.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-start space-x-4"
                      >
                        <div className="shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {event.type}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(event.at).toLocaleString()}
                            </p>
                          </div>
                          {Object.keys(event.payload).length > 0 && (
                            <div className="mt-1 text-sm text-gray-600">
                              <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded">
                                {JSON.stringify(event.payload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No activity recorded for this deal
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Term-Sheet Playground Tab */}
          <TabsContent value="term-sheet" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Interactive Inputs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5" />
                    <span>Term Sheet Inputs</span>
                  </CardTitle>
                  <CardDescription>
                    Adjust parameters to see real-time suggestions and
                    trade-offs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Amount ($)
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={termSheetInputs.amount || ''}
                        onChange={(e) =>
                          handleTermSheetInputChange('amount', e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter rate"
                        value={termSheetInputs.rate || ''}
                        onChange={(e) =>
                          handleTermSheetInputChange('rate', e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Amortization (months)
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter amortization"
                        value={termSheetInputs.amort || ''}
                        onChange={(e) =>
                          handleTermSheetInputChange('amort', e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Term (months)
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter term"
                        value={termSheetInputs.term || ''}
                        onChange={(e) =>
                          handleTermSheetInputChange('term', e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() =>
                        setTermSheetInputs({
                          amount: deal.requestedAmount,
                          rate: undefined,
                          amort: undefined,
                          term: undefined,
                        })
                      }
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reset to Deal Amount
                    </Button>
                    <Button
                      onClick={() =>
                        copyToClipboard(generateTermSheetSummary())
                      }
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Current Term Sheet */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Term Sheet</CardTitle>
                </CardHeader>
                <CardContent>
                  {termSheetLoading ? (
                    <div>Loading term sheet...</div>
                  ) : termSheet ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Base Rate:</span>
                          <span className="ml-2 font-medium">
                            {termSheet.baseRate}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Margin:</span>
                          <span className="ml-2 font-medium">
                            {termSheet.marginBps} bps
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Amortization:</span>
                          <span className="ml-2 font-medium">
                            {termSheet.amortMonths} months
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Interest Only:</span>
                          <span className="ml-2 font-medium">
                            {termSheet.interestOnlyMonths} months
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Origination Fee:
                          </span>
                          <span className="ml-2 font-medium">
                            {termSheet.originationFeeBps} bps
                          </span>
                        </div>
                        {termSheet.prepayPenalty && (
                          <div>
                            <span className="text-gray-500">
                              Prepay Penalty:
                            </span>
                            <span className="ml-2 font-medium">
                              {termSheet.prepayPenalty}
                            </span>
                          </div>
                        )}
                      </div>
                      {termSheet.collateral && (
                        <div className="text-sm">
                          <span className="text-gray-500">Collateral:</span>
                          <span className="ml-2 font-medium">
                            {termSheet.collateral}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500">No term sheet available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle>AI Suggestions & Trade-offs</CardTitle>
                <CardDescription>
                  Real-time analysis based on your input parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                {suggestionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Loading suggestions...
                  </div>
                ) : termSheetSuggestions?.suggestions &&
                  termSheetSuggestions.suggestions.length > 0 ? (
                  <div className="space-y-4">
                    {termSheetSuggestions.suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-start space-x-3">
                          <Badge
                            variant={
                              suggestion.severity === 'critical'
                                ? 'destructive'
                                : suggestion.severity === 'warning'
                                  ? 'warning'
                                  : 'info'
                            }
                          >
                            {suggestion.severity}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              {suggestion.text}
                            </p>
                            {suggestion.inputs &&
                              Object.keys(suggestion.inputs).length > 0 && (
                                <div className="mt-2 text-xs text-gray-500">
                                  Based on:{' '}
                                  {Object.entries(suggestion.inputs)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(', ')}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Enter some parameters above to see AI suggestions and
                    trade-offs
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formatted Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Formatted Summary</CardTitle>
                <CardDescription>
                  Copy this summary to share with stakeholders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generateTermSheetSummary()}
                  readOnly
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => copyToClipboard(generateTermSheetSummary())}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy to Clipboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
