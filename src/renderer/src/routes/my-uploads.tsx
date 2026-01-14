import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  IconUpload,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconDownload,
  IconTrash
} from '@tabler/icons-react'
import { trpc } from '@renderer/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { formatFileSize } from '@/lib/utils'
import { getFileIcon } from '@/lib/file-utils'

export const Route = createFileRoute('/my-uploads')({
  component: MyUploadsPage
})

function MyUploadsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Fetch upload history
  const { data, isLoading, refetch } = trpc.uploadHistory.list.useQuery({
    query: searchQuery || undefined,
    page,
    pageSize,
    sortBy: 'uploadedAt',
    sortDirection: 'desc'
  })

  // Fetch statistics
  const { data: stats } = trpc.uploadHistory.getStats.useQuery({})

  // Delete mutation
  const deleteMutation = trpc.uploadHistory.deleteRecord.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  const handleDelete = async (id: string) => {
    if (confirm('Delete this record? The file will remain in cloud storage.')) {
      await deleteMutation.mutateAsync({ id })
    }
  }

  const trpcUtils = trpc.useUtils()

  const handleDownload = async (providerId: string, bucket: string, key: string) => {
    try {
      // Get provider first
      const provider = await trpcUtils.provider.getById.fetch({ id: providerId })
      if (!provider) return

      const result = await trpcUtils.provider.getObjectUrl.fetch({
        provider,
        bucket,
        key
      })
      window.open(result.url, '_blank')
    } catch (error) {
      console.error('Failed to download:', error)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">My Uploads</h1>
            <p className="text-sm text-muted-foreground">
              Files and folders uploaded through this application
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <IconRefresh size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="border-b border-border px-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="rounded-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFiles.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="rounded-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
              </CardContent>
            </Card>
            <Card className="rounded-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recent Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.recentUploads[0]
                    ? format(new Date(stats.recentUploads[0].uploadedAt), 'MMM dd')
                    : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="border-b border-border px-6 py-3">
        <div className="relative w-full max-w-md">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1) // Reset to first page on search
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Upload List */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i} className="rounded-md">
                <CardContent className="flex items-center gap-4 py-4">
                  <Skeleton className="h-10 w-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-96" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <div className="space-y-3">
              {data.data.map((item) => {
                const fileIcon = getFileIcon(
                  {
                    name: item.name,
                    type: item.type as 'file' | 'folder',
                    id: item.id,
                    modified: new Date(),
                    size: item.size || 0
                  },
                  'small'
                )

                return (
                  <Card key={item.id} className="rounded-md transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center gap-4 py-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">{fileIcon}</div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{item.name}</span>
                          {item.isCompressed && (
                            <Badge variant="secondary" className="text-xs">
                              Compressed
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.bucket}</span>
                          <span>•</span>
                          <span>{format(new Date(item.uploadedAt), 'MMM dd, yyyy HH:mm')}</span>
                          {item.size && (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(item.size)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {item.type === 'file' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item.providerId, item.bucket, item.key)}
                          >
                            <IconDownload size={16} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <IconTrash size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <IconUpload size={48} className="mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No uploads yet</p>
            <p className="text-sm text-muted-foreground">
              Files uploaded through this app will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
