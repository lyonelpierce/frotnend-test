import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface Deal {
  requestedAmount: number
  probability: number
  dscr?: number | null
  ltv?: number | null
}

interface RequestedTermsProps {
  deal: Deal
  termSheet?: TermSheet
  termSheetLoading: boolean
}

export function RequestedTerms({
  deal,
  termSheet,
  termSheetLoading,
}: RequestedTermsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Requested Terms</CardTitle>
      </CardHeader>
      <CardContent>
        {termSheetLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
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
              <p className="text-sm font-medium text-gray-500">Base Rate</p>
              <p className="text-lg font-semibold">{termSheet.baseRate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Amortization</p>
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
              <p className="text-sm font-medium text-gray-500">Probability</p>
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
  )
}
