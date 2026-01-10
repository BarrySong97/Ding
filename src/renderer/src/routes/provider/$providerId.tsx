import { createFileRoute, Link } from '@tanstack/react-router'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { providersCollection } from '@renderer/db'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/provider/$providerId')({
  component: ProviderDetail
})

function ProviderDetail() {
  const { providerId } = Route.useParams()
  const { data: providers } = useLiveQuery((q) =>
    q.from({ provider: providersCollection }).where(({ provider }) => eq(provider.id, providerId))
  )

  const provider = providers?.[0]

  if (!provider) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">Provider not found</p>
          <Link to="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getProviderTypeLabel = () => {
    if (provider.type === 's3-compatible') {
      const labels: Record<string, string> = {
        'aws-s3': 'AWS S3',
        'aliyun-oss': 'Aliyun OSS',
        'tencent-cos': 'Tencent COS',
        'cloudflare-r2': 'Cloudflare R2',
        minio: 'MinIO',
        'backblaze-b2': 'Backblaze B2'
      }
      return labels[provider.variant] || provider.variant
    }
    return 'Supabase Storage'
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{provider.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{getProviderTypeLabel()}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Provider Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{getProviderTypeLabel()}</span>
            </div>
            {provider.type === 's3-compatible' && (
              <>
                {provider.region && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Region:</span>
                    <span>{provider.region}</span>
                  </div>
                )}
                {provider.endpoint && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Endpoint:</span>
                    <span>{provider.endpoint}</span>
                  </div>
                )}
              </>
            )}
            {provider.type === 'supabase-storage' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project URL:</span>
                <span>{provider.projectUrl}</span>
              </div>
            )}
            {provider.bucket && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bucket:</span>
                <span>{provider.bucket}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/50 p-12 text-center">
          <p className="text-muted-foreground">
            File browser coming soon...
          </p>
        </div>
      </div>
    </div>
  )
}
