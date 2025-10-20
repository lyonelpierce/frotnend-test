import { Building2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Borrower {
  legalName: string
  industry?: string | null
  naics?: string | null
  existingRelationship: boolean
  address?: string | null
}

interface BorrowerFactsProps {
  borrower?: Borrower
  isLoading: boolean
}

export function BorrowerFacts({ borrower, isLoading }: BorrowerFactsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Borrower Facts</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div>
              <Skeleton className="h-4 w-12 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ) : borrower ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Legal Name</p>
                <p className="text-sm">{borrower.legalName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Industry</p>
                <p className="text-sm">{borrower.industry || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">NAICS</p>
                <p className="text-sm">{borrower.naics || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Existing Relationship
                </p>
                <p className="text-sm">
                  {borrower.existingRelationship ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
            {borrower.address && (
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-sm">{borrower.address}</p>
              </div>
            )}
          </>
        ) : (
          <div>No borrower information available</div>
        )}
      </CardContent>
    </Card>
  )
}
