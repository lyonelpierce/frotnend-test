import { Loader2 } from 'lucide-react'
import { DealCard } from './DealCard'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import type { Deal } from '../lib/api'

interface StageColumnProps {
  title: string
  deals: Array<Deal>
  onDealDragStart: (e: React.DragEvent, deal: Deal) => void
  onDealDragEnd: (e: React.DragEvent) => void
  onDealDrop: (e: React.DragEvent, targetStage: string) => void
  onDealDragOver: (e: React.DragEvent, targetStage: string) => void
  onDealDragLeave: (e: React.DragEvent) => void
  isDragOver?: boolean
  draggedDeal?: Deal | null
  updatingDeals?: Set<string>
}

export function StageColumn({
  title,
  deals,
  onDealDragStart,
  onDealDragEnd,
  onDealDrop,
  onDealDragOver,
  onDealDragLeave,
  isDragOver,
  draggedDeal,
  updatingDeals = new Set(),
}: StageColumnProps) {
  return (
    <div className="flex-1 min-w-0">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex items-center gap-2">
              {updatingDeals.size > 0 && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
              <Badge variant="secondary">{deals.length}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Drop Zone */}
          <div
            className={`
              min-h-[400px] p-2 rounded-lg border-2 border-dashed transition-all duration-300 ease-in-out
              ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg'
                  : 'border-dashed border-muted-foreground/25 bg-muted/5'
              }
            `}
            onDragOver={(e) => onDealDragOver(e, title)}
            onDragLeave={onDealDragLeave}
            onDrop={(e) => onDealDrop(e, title)}
          >
            {/* Deal Cards */}
            <div className="space-y-3">
              {deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onDragStart={onDealDragStart}
                  onDragEnd={onDealDragEnd}
                  isDragging={draggedDeal?.id === deal.id}
                  isUpdating={updatingDeals.has(deal.id)}
                />
              ))}

              {deals.length === 0 && (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-sm">
                      {isDragOver ? 'Drop here!' : 'Drop deals here'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
