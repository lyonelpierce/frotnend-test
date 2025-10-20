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
    <Card className="mb-6" role="search" aria-label="Deal search and filters">
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative">
            <label htmlFor="search-input" className="sr-only">
              Search deals by borrower name
            </label>
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="search-input"
              type="text"
              placeholder="Search by borrower name..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              aria-describedby="search-description"
            />
            <div id="search-description" className="sr-only">
              Enter a borrower name to filter deals
            </div>
          </div>

          {/* Product Filter */}
          <div className="relative">
            <label htmlFor="product-filter" className="sr-only">
              Filter deals by product type
            </label>
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10"
              aria-hidden="true"
            />
            <Select
              value={selectedProduct || 'all'}
              onValueChange={(value) =>
                onProductChange(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger
                className="pl-10"
                id="product-filter"
                aria-label="Product type filter"
              >
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
              <label htmlFor="min-amount" className="sr-only">
                Minimum loan amount
              </label>
              <DollarSign
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="min-amount"
                type="number"
                placeholder="Min"
                value={minAmount}
                onChange={(e) => onMinAmountChange(e.target.value)}
                className="pl-10"
                aria-label="Minimum loan amount"
              />
            </div>
            <div className="relative flex-1">
              <label htmlFor="max-amount" className="sr-only">
                Maximum loan amount
              </label>
              <Input
                id="max-amount"
                type="number"
                placeholder="Max"
                value={maxAmount}
                onChange={(e) => onMaxAmountChange(e.target.value)}
                aria-label="Maximum loan amount"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <label htmlFor="sort-select" className="sr-only">
              Sort deals by
            </label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger
                className="flex-1"
                id="sort-select"
                aria-label="Sort deals by"
              >
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
              aria-label={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <span aria-hidden="true">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
