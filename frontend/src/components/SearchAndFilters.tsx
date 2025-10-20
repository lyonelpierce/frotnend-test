import { ChevronDown, DollarSign, Filter, Search } from 'lucide-react'
import type { ProductType } from '../lib/api'

interface SearchAndFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedProduct: string
  onProductChange: (value: string) => void
  minAmount: string
  onMinAmountChange: (value: string) => void
  maxAmount: string
  onMaxAmountChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (value: 'asc' | 'desc') => void
}

const PRODUCT_TYPES: Array<ProductType> = [
  'TermLoan',
  'LineOfCredit',
  'SBA7a',
  'Equipment',
  'CRE',
]

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'requestedAmount', label: 'Amount' },
  { value: 'riskScore', label: 'Risk Score' },
  { value: 'createdAt', label: 'Created Date' },
]

export function SearchAndFilters({
  searchTerm,
  onSearchChange,
  selectedProduct,
  onProductChange,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
}: SearchAndFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by borrower name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Product Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedProduct}
            onChange={(e) => onProductChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">All Products</option>
            {PRODUCT_TYPES.map((product) => (
              <option key={product} value={product}>
                {product.replace(/([A-Z])/g, ' $1').trim()}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Amount Range */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              placeholder="Min"
              value={minAmount}
              onChange={(e) => onMinAmountChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative flex-1">
            <input
              type="number"
              placeholder="Max"
              value={maxAmount}
              onChange={(e) => onMaxAmountChange(e.target.value)}
              className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')
            }
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
    </div>
  )
}
