import { DollarSign } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Financial {
  period: string
  periodEnd: string
  revenue: number
  ebitda: number
}

interface FinancialSummaryProps {
  financials?: Array<Financial>
  isLoading: boolean
}

export function FinancialSummary({
  financials,
  isLoading,
}: FinancialSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Financial Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
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
            ))}
          </div>
        ) : financials && financials.length > 0 ? (
          <div className="space-y-4">
            {financials.slice(0, 3).map((financial, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    {financial.period}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {financial.periodEnd}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-medium">
                      ${financial.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">EBITDA</p>
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
  )
}
