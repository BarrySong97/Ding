import { Link } from '@tanstack/react-router'
import { IconChevronRight, IconCloud, IconBrandAws, IconServer } from '@tabler/icons-react'
import type { TRPCProvider } from '@renderer/lib/trpc'
import { useProviderStatus } from '@renderer/hooks/use-provider-status'
import { cn } from '@/lib/utils'

interface ProviderCardProps {
  provider: TRPCProvider
}

const variantLabels: Record<string, string> = {
  'aws-s3': 'AWS S3',
  'aliyun-oss': 'Aliyun OSS',
  'tencent-cos': 'Tencent COS',
  'cloudflare-r2': 'Cloudflare R2',
  minio: 'MinIO',
  'backblaze-b2': 'Backblaze B2'
}

function getProviderIcon(provider: TRPCProvider) {
  if (provider.type === 'supabase-storage') {
    return <IconCloud size={24} />
  }

  switch (provider.variant) {
    case 'aws-s3':
      return <IconBrandAws size={24} />
    case 'minio':
      return <IconServer size={24} />
    default:
      return <IconCloud size={24} />
  }
}

function getProviderIconBgColor(provider: TRPCProvider): string {
  if (provider.type === 'supabase-storage') {
    return 'bg-emerald-100 text-emerald-600'
  }

  switch (provider.variant) {
    case 'aws-s3':
      return 'bg-orange-100 text-orange-600'
    case 'cloudflare-r2':
      return 'bg-orange-50 text-orange-500'
    case 'aliyun-oss':
      return 'bg-orange-100 text-orange-600'
    case 'tencent-cos':
      return 'bg-blue-100 text-blue-600'
    case 'minio':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function getProviderTypeLabel(provider: TRPCProvider): string {
  if (provider.type === 'supabase-storage') {
    return 'Supabase Storage'
  }
  return variantLabels[provider.variant] || provider.variant
}

function formatLastOperation(date: Date | string | null | undefined): string {
  if (!date) return 'Never'

  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return dateObj.toLocaleDateString()
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const { isLoading, isConnected, stats } = useProviderStatus(provider)

  const region =
    provider.type === 's3-compatible' ? provider.region : new URL(provider.projectUrl).hostname

  const statusText = isLoading ? 'Checking...' : isConnected ? 'Connected' : 'Paused'

  return (
    <Link to="/provider/$providerId" params={{ providerId: provider.id }} className="block">
      <div className="rounded-md border border-border bg-white dark:bg-[#1E1E1E] p-4 transition-colors hover:bg-accent/30">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                getProviderIconBgColor(provider)
              )}
            >
              {getProviderIcon(provider)}
            </div>
            <div>
              <div className="font-medium">{getProviderTypeLabel(provider)}</div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span
                  className={cn(
                    'inline-block h-1.5 w-1.5 rounded-full',
                    isLoading
                      ? 'bg-yellow-500 animate-pulse'
                      : isConnected
                        ? 'bg-green-500'
                        : 'bg-muted-foreground'
                  )}
                />
                <span>{statusText}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono">
              {region || 'Region:auto'}
            </span>
            <IconChevronRight size={16} />
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-border/50" />

        {/* Stats */}
        <div className="flex gap-8">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Buckets
            </div>
            <div className="mt-0.5 text-lg font-semibold">{stats?.bucketCount ?? 0}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Last Operation
            </div>
            <div className="mt-0.5 text-lg font-semibold">
              {formatLastOperation(provider.lastOperationAt)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
