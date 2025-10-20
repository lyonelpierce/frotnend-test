import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RiskInsightsProps {
  riskScore?: number | null
  flags: Array<string>
  docsProgress: number | null
}

export function RiskInsights({
  riskScore,
  flags,
  docsProgress,
}: RiskInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk & Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {riskScore && (
            <Badge
              variant={
                riskScore > 7
                  ? 'destructive'
                  : riskScore > 4
                    ? 'warning'
                    : 'success'
              }
            >
              Risk Score: {riskScore}/10
            </Badge>
          )}
          {flags.map((flag, index) => (
            <Badge key={index} variant="warning">
              {flag}
            </Badge>
          ))}
          {docsProgress !== null && (
            <Badge variant={docsProgress === 100 ? 'success' : 'info'}>
              Docs: {docsProgress}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
