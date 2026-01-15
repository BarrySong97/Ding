import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  IconUpload,
  IconRefresh,
  IconSearch,
  IconDownload,
  IconTrash,
  IconFile,
  IconDatabase,
  IconClock
} from '@tabler/icons-react'
import { trpc } from '@renderer/lib/trpc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { format } from 'date-fns'
import { cn, formatFileSize } from '@/lib/utils'
import { getFileIcon } from '@/lib/file-utils'
import { PageLayout } from '@/components/layout/page-layout'
import { StatCard } from '@/components/dashboard/status-card'

export const Route = createFileRoute('/my-uploads')({
  component: MyUploadsPage
})

function MyUploadsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50

  // Fetch upload history
  const { data, isLoading, isFetching, refetch } = trpc.uploadHistory.list.useQuery({
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

  // Loading state
  if (isLoading) {
    return (
      <PageLayout>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
        </div>
        <div>
          <Skeleton className="mb-4 h-7 w-40" />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Name
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bucket
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Size
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Uploaded
                  </TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </PageLayout>
    )
  }
  console.log(isFetching)
  return (
    <PageLayout>
      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Files"
          value={stats?.totalFiles.toLocaleString() ?? '0'}
          icon={<IconFile size={20} />}
        />
        <StatCard
          title="Total Size"
          value={formatFileSize(stats?.totalSize ?? 0)}
          icon={<IconDatabase size={20} />}
        />
        <StatCard
          title="Recent Upload"
          value={
            stats?.recentUploads[0]
              ? format(new Date(stats.recentUploads[0].uploadedAt), 'MMM dd')
              : 'N/A'
          }
          icon={<IconClock size={20} />}
        />
      </div>

      {/* Upload History Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Upload History</h2>
            <Badge variant="secondary" className="rounded-full">
              {data?.total ?? 0}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <IconSearch
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()} className="h-9 w-9">
              <IconRefresh size={16} className={cn(isFetching ? 'animate-spin' : '')} />
            </Button>
          </div>
        </div>

        {data && data.data.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Bucket
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Size
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Uploaded
                    </TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                      <TableRow key={item.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">{fileIcon}</div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              {item.isCompressed && (
                                <Badge variant="secondary" className="text-xs">
                                  Compressed
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.bucket}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.size ? formatFileSize(item.size) : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(item.uploadedAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            {item.type === 'file' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  handleDownload(item.providerId, item.bucket, item.key)
                                }
                              >
                                <IconDownload size={16} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                'h-7 w-7 text-muted-foreground',
                                'hover:bg-red-50 hover:text-red-500',
                                'dark:hover:bg-red-900/20'
                              )}
                              onClick={() => handleDelete(item.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <IconTrash size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
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
          <div className="flex flex-col items-center justify-center rounded-md border py-16">
            <IconUpload size={48} className="mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No uploads yet</p>
            <p className="text-sm text-muted-foreground">
              Files uploaded through this app will appear here
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
