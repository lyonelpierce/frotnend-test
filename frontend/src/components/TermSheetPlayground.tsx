import { Calculator, Copy, RefreshCw } from 'lucide-react'

import type { TermSheetSuggestionsQuery } from '@/lib/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

interface TermSheet {
  baseRate: string
  marginBps: number
  amortMonths: number
  interestOnlyMonths: number
  originationFeeBps: number
  prepayPenalty?: string | null
  collateral?: string | null
}

interface TermSheetPlaygroundProps {
  termSheet?: TermSheet
  termSheetLoading: boolean
  termSheetInputs: TermSheetSuggestionsQuery
  onTermSheetInputChange: (
    field: keyof TermSheetSuggestionsQuery,
    value: string,
  ) => void
  onResetToDealAmount: () => void
  onCopySummary: () => void
  termSheetSuggestions?: {
    suggestions: Array<{
      id: string
      text: string
      severity: string
      inputs?: Record<string, any>
    }>
  }
  suggestionsLoading: boolean
  summaryText: string
}

export function TermSheetPlayground({
  termSheet,
  termSheetLoading,
  termSheetInputs,
  onTermSheetInputChange,
  onResetToDealAmount,
  onCopySummary,
  termSheetSuggestions,
  suggestionsLoading,
  summaryText,
}: TermSheetPlaygroundProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Interactive Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Term Sheet Inputs</span>
            </CardTitle>
            <CardDescription>
              Adjust parameters to see real-time suggestions and trade-offs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="amount-input"
                  className="text-sm font-medium text-foreground"
                >
                  Amount ($)
                </label>
                <Input
                  id="amount-input"
                  type="number"
                  placeholder="Enter amount"
                  value={termSheetInputs.amount || ''}
                  onChange={(e) =>
                    onTermSheetInputChange('amount', e.target.value)
                  }
                  className="mt-1"
                  aria-describedby="amount-help"
                  min="0"
                  step="1"
                />
                <div id="amount-help" className="sr-only">
                  Enter the loan amount in dollars
                </div>
              </div>
              <div>
                <label
                  htmlFor="rate-input"
                  className="text-sm font-medium text-foreground"
                >
                  Rate (%)
                </label>
                <Input
                  id="rate-input"
                  type="number"
                  step="0.01"
                  placeholder="Enter rate"
                  value={termSheetInputs.rate || ''}
                  onChange={(e) =>
                    onTermSheetInputChange('rate', e.target.value)
                  }
                  className="mt-1"
                  aria-describedby="rate-help"
                  min="0"
                  max="100"
                />
                <div id="rate-help" className="sr-only">
                  Enter the interest rate as a percentage
                </div>
              </div>
              <div>
                <label
                  htmlFor="amortization-input"
                  className="text-sm font-medium text-foreground"
                >
                  Amortization (months)
                </label>
                <Input
                  id="amortization-input"
                  type="number"
                  placeholder="Enter amortization"
                  value={termSheetInputs.amort || ''}
                  onChange={(e) =>
                    onTermSheetInputChange('amort', e.target.value)
                  }
                  className="mt-1"
                  aria-describedby="amortization-help"
                  min="1"
                />
                <div id="amortization-help" className="sr-only">
                  Enter the amortization period in months
                </div>
              </div>
              <div>
                <label
                  htmlFor="term-input"
                  className="text-sm font-medium text-foreground"
                >
                  Term (months)
                </label>
                <Input
                  id="term-input"
                  type="number"
                  placeholder="Enter term"
                  value={termSheetInputs.term || ''}
                  onChange={(e) =>
                    onTermSheetInputChange('term', e.target.value)
                  }
                  className="mt-1"
                  aria-describedby="term-help"
                  min="1"
                />
                <div id="term-help" className="sr-only">
                  Enter the loan term in months
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={onResetToDealAmount}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset to Deal Amount
              </Button>
              <Button
                onClick={onCopySummary}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
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
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ) : termSheet ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Base Rate:</span>
                    <span className="ml-2 font-medium">
                      {termSheet.baseRate}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Margin:</span>
                    <span className="ml-2 font-medium">
                      {termSheet.marginBps} bps
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amortization:</span>
                    <span className="ml-2 font-medium">
                      {termSheet.amortMonths} months
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Interest Only:
                    </span>
                    <span className="ml-2 font-medium">
                      {termSheet.interestOnlyMonths} months
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Origination Fee:
                    </span>
                    <span className="ml-2 font-medium">
                      {termSheet.originationFeeBps} bps
                    </span>
                  </div>
                  {termSheet.prepayPenalty && (
                    <div>
                      <span className="text-muted-foreground">
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
                    <span className="text-muted-foreground">Collateral:</span>
                    <span className="ml-2 font-medium">
                      {termSheet.collateral}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">
                No term sheet available
              </div>
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
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-6 w-16" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : termSheetSuggestions?.suggestions &&
            termSheetSuggestions.suggestions.length > 0 ? (
            <div className="space-y-4">
              {termSheetSuggestions.suggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-4 border rounded-lg">
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
                      <p className="text-sm text-foreground">
                        {suggestion.text}
                      </p>
                      {suggestion.inputs &&
                        Object.keys(suggestion.inputs).length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
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
            <div className="text-center py-8 text-muted-foreground">
              Enter some parameters above to see AI suggestions and trade-offs
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
            value={summaryText}
            readOnly
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={onCopySummary} variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-1" />
              Copy to Clipboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
