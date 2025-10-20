import { Download, FileText } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface Document {
  id: string
  label: string
  type: string
  status: string
  requiredBy?: string | null
  link?: string | null
}

interface DocumentsChecklistProps {
  documents?: { items: Array<Document> }
  isLoading: boolean
  onRequestDocument: (doc: {
    label: string
    type: string
    requiredBy?: string | undefined
  }) => void
  isRequesting: boolean
}

export function DocumentsChecklist({
  documents,
  isLoading,
  onRequestDocument,
  isRequesting,
}: DocumentsChecklistProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Required Documents</CardTitle>
        <CardDescription>
          Track the status of required documents for this deal
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-5 w-5" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : documents?.items && documents.items.length > 0 ? (
          <div className="space-y-4">
            {documents.items.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 sm:gap-0"
              >
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium wrap-break-word">{doc.label}</p>
                    <p className="text-sm text-gray-500 wrap-break-word">
                      {doc.type}
                    </p>
                    {doc.requiredBy && (
                      <p className="text-xs text-gray-400">
                        Due: {new Date(doc.requiredBy).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <Badge
                    variant={
                      doc.status === 'received' || doc.status === 'verified'
                        ? 'success'
                        : doc.status === 'rejected'
                          ? 'destructive'
                          : doc.status === 'requested'
                            ? 'warning'
                            : 'secondary'
                    }
                  >
                    {doc.status}
                  </Badge>
                  {doc.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onRequestDocument({
                          label: doc.label,
                          type: doc.type,
                          requiredBy: doc.requiredBy || undefined,
                        })
                      }
                      disabled={isRequesting}
                    >
                      {isRequesting ? 'Requesting...' : 'Request'}
                    </Button>
                  )}
                  {doc.link && (
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No documents required for this deal
          </div>
        )}
      </CardContent>
    </Card>
  )
}
