import { DealCard } from './DealCard'
import type { Deal } from '../lib/api'

interface StageColumnProps {
  title: string
  deals: Array<Deal>
  onDealDragStart: (e: React.DragEvent, deal: Deal) => void
  onDealDragEnd: (e: React.DragEvent) => void
  onDealDrop: (e: React.DragEvent, targetStage: string) => void
  isDragOver?: boolean
}

export function StageColumn({
  title,
  deals,
  onDealDragStart,
  onDealDragEnd,
  onDealDrop,
  isDragOver,
}: StageColumnProps) {
  return (
    <div className="flex-1 min-w-0">
      {/* Column Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{deals.length} deals</span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`
          min-h-[400px] p-2 rounded-lg border-2 border-dashed transition-colors duration-200
          ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 bg-gray-50'
          }
        `}
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.classList.add('border-blue-400', 'bg-blue-50')
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
          onDealDrop(e, title)
        }}
      >
        {/* Deal Cards */}
        <div className="space-y-3">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onDragStart={onDealDragStart}
              onDragEnd={onDealDragEnd}
            />
          ))}

          {deals.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">Drop deals here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
