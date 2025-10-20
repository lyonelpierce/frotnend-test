import { Calendar, DollarSign, FileText, TrendingUp, User } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { Deal } from '../lib/api'

interface DealCardProps {
  deal: Deal
  onDragStart?: (e: React.DragEvent, deal: Deal) => void
  onDragEnd?: (e: React.DragEvent) => void
  isDragging?: boolean
}

export function DealCard({
  deal,
  onDragStart,
  onDragEnd,
  isDragging,
}: DealCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRiskScoreColor = (riskScore: number | null) => {
    if (!riskScore) return 'text-gray-400'
    if (riskScore >= 0.8) return 'text-red-500'
    if (riskScore >= 0.6) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getDocsProgressColor = (progress: number | null) => {
    if (!progress) return 'bg-gray-200'
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Link
      to="/deals/$id"
      params={{ id: deal.id }}
      className={`
        block bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer
        hover:shadow-md transition-shadow duration-200
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
      `}
      draggable
      onDragStart={(e) => onDragStart?.(e, deal)}
      onDragEnd={onDragEnd}
    >
      {/* Header with borrower name and risk score */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900 truncate max-w-[180px]">
            {deal.name}
          </h3>
        </div>
        {deal.riskScore && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${getRiskScoreColor(deal.riskScore)}`}
          >
            <TrendingUp className="w-3 h-3" />
            {Math.round(deal.riskScore * 100)}
          </div>
        )}
      </div>

      {/* Amount and Product */}
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-gray-500" />
        <span className="font-semibold text-gray-900">
          {formatCurrency(deal.requestedAmount)}
        </span>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {deal.product}
        </span>
      </div>

      {/* Documents Progress */}
      {deal.docsProgress !== null && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Docs Progress</span>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(deal.docsProgress * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getDocsProgressColor(deal.docsProgress)}`}
              style={{ width: `${deal.docsProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Owner */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-gray-500">Owner:</span>
        <span className="text-sm font-medium text-gray-900">
          {deal.owner.name}
        </span>
      </div>

      {/* Last Updated */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Calendar className="w-3 h-3" />
        <span>Updated {formatDate(deal.updatedAt)}</span>
      </div>

      {/* Flags */}
      {deal.flags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {deal.flags.slice(0, 3).map((flag, index) => (
            <span
              key={index}
              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
            >
              {flag}
            </span>
          ))}
          {deal.flags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{deal.flags.length - 3} more
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
