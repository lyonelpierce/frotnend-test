import { Clock } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ActivityEvent {
  id: string
  type: string
  at: string
  payload: Record<string, any>
}

interface ActivityTimelineProps {
  activity?: { items: Array<ActivityEvent> }
  isLoading: boolean
  error?: Error | null
}

export function ActivityTimeline({
  activity,
  isLoading,
  error,
}: ActivityTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>
          Recent events and updates for this deal
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="shrink-0">
                  <Skeleton className="w-8 h-8 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500">
            Error loading activity: {error.message}
          </div>
        ) : activity?.items && activity.items.length > 0 ? (
          <div className="space-y-4">
            {activity.items.map((event) => (
              <div key={event.id} className="flex items-start space-x-4">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {event.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.at).toLocaleString()}
                    </p>
                  </div>
                  {Object.keys(event.payload).length > 0 && (
                    <div className="mt-1 text-sm text-foreground">
                      <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No activity recorded for this deal
          </div>
        )}
      </CardContent>
    </Card>
  )
}
