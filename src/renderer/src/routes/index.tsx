import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  IconCloud,
  IconFolder,
  IconWorld,
  IconChevronRight,
  IconUpload
} from '@tabler/icons-react'
import { format } from 'date-fns'
import { type ProviderType } from '@renderer/db'
import { EmptyState } from '@/components/provider/empty-state'
import { AddProviderDialog } from '@/components/provider/add-provider-dialog'
import { ProviderCard } from '@/components/provider/provider-card'
import { AddProviderCard } from '@/components/provider/add-provider-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { trpc } from '@renderer/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/dashboard/status-card'
import { PageLayout } from '@/components/layout/page-layout'
import { formatFileSize } from '@/lib/utils'
import { getFileIcon } from '@/lib/file-utils'

export const Route = createFileRoute('/')({
  component: Index
})

// Maximum number of providers to show on dashboard
const MAX_DASHBOARD_PROVIDERS = 5

function Index() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<ProviderType | undefined>()
  const { data: providers, isLoading } = trpc.provider.list.useQuery()
  const { data: globalStats } = trpc.provider.getGlobalStats.useQuery()

  // Fetch recent uploads
  const { data: recentUploads } = trpc.uploadHistory.list.useQuery({
    page: 1,
    pageSize: 20,
    sortBy: 'uploadedAt',
    sortDirection: 'desc'
  })

  const handleAddProvider = (type?: ProviderType) => {
    setSelectedType(type)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setSelectedType(undefined)
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-32 rounded-md" />
            <Skeleton className="h-32 rounded-md" />
          </div>
        </div>
      </PageLayout>
    )
  }

  // Empty state - show onboarding
  if (!providers || providers.length === 0) {
    return (
      <PageLayout>
        <EmptyState onAddProvider={handleAddProvider} />
        <AddProviderDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          defaultType={selectedType}
        />
      </PageLayout>
    )
  }

  // Limit providers shown on dashboard
  const displayedProviders = providers.slice(0, MAX_DASHBOARD_PROVIDERS)
  const hasMoreProviders = providers.length > MAX_DASHBOARD_PROVIDERS

  // Has providers - show list
  return (
    <PageLayout>
      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Providers"
          value={String(globalStats?.providersCount ?? 0)}
          icon={<IconCloud size={20} />}
        />
        <StatCard
          title="Buckets"
          value={String(globalStats?.bucketsCount ?? 0)}
          icon={<IconFolder size={20} />}
        />
        <StatCard
          title="Regions"
          value={String(globalStats?.regionsCount ?? 0)}
          icon={<IconWorld size={20} />}
        />
      </div>

      {/* Connected Providers */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Connected Providers</h2>
            <Badge variant="secondary" className="rounded-full">
              {providers.length}
            </Badge>
          </div>
          <Link to="/providers">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All
              <IconChevronRight size={16} />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
          {!hasMoreProviders && <AddProviderCard onClick={() => handleAddProvider()} />}
        </div>
        {hasMoreProviders && (
          <Link to="/providers" className="mt-4 block">
            <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              View all {providers.length} providers
              <IconChevronRight size={16} />
            </div>
          </Link>
        )}
      </div>

      {/* Recently Uploaded */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Recently Uploaded</h2>
            <Badge variant="secondary" className="rounded-full">
              {recentUploads?.total ?? 0}
            </Badge>
          </div>
          <Link to="/my-uploads">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All
              <IconChevronRight size={16} />
            </Button>
          </Link>
        </div>

        {recentUploads && recentUploads.data.length > 0 ? (
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUploads.data.map((item) => {
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
                    <TableRow key={item.id}>
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
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
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

      <AddProviderDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        defaultType={selectedType}
      />
    </PageLayout>
  )
}
