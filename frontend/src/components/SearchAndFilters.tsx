import { DollarSign, Filter, Search } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Card, CardContent } from './ui/card'
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
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by borrower name..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Product Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <Select
              value={selectedProduct || 'all'}
              onValueChange={(value) =>
                onProductChange(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {PRODUCT_TYPES.map((product) => (
                  <SelectItem key={product} value={product}>
                    {product.replace(/([A-Z])/g, ' $1').trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Range */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Min"
                value={minAmount}
                onChange={(e) => onMinAmountChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative flex-1">
              <Input
                type="number"
                placeholder="Max"
                value={maxAmount}
                onChange={(e) => onMaxAmountChange(e.target.value)}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')
              }
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
