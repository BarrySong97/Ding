import { IconCloudPlus, IconBrandAws, IconCloud, IconServer } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { S3Variant } from '@renderer/db'

interface EmptyStateProps {
  onAddProvider: (variant?: S3Variant) => void
}

const quickProviders: {
  variant: S3Variant
  name: string
  description: string
  icon: React.ReactNode
  color: string
}[] = [
  {
    variant: 'aws-s3',
    name: 'AWS S3',
    description: 'Amazon Simple Storage Service',
    icon: <IconBrandAws size={28} />,
    color: 'bg-orange-500/10 text-orange-600'
  },
  {
    variant: 'aliyun-oss',
    name: 'Aliyun OSS',
    description: 'Alibaba Cloud Object Storage',
    icon: <IconCloud size={28} />,
    color: 'bg-orange-500/10 text-orange-500'
  },
  {
    variant: 'cloudflare-r2',
    name: 'Cloudflare R2',
    description: 'Zero egress fee storage',
    icon: <IconCloud size={28} />,
    color: 'bg-amber-500/10 text-amber-600'
  },
  {
    variant: 'minio',
    name: 'MinIO',
    description: 'Self-hosted S3 compatible',
    icon: <IconServer size={28} />,
    color: 'bg-red-500/10 text-red-600'
  }
]

export function EmptyState({ onAddProvider }: EmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex max-w-2xl flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <IconCloudPlus size={40} className="text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold">Get Started</h2>
        <p className="mb-8 text-muted-foreground">
          Add your first cloud storage provider to start managing and uploading files.
        </p>

        {/* Quick Provider Cards */}
        <div className="mb-8 grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {quickProviders.map((provider) => (
            <button
              key={provider.variant}
              onClick={() => onAddProvider(provider.variant)}
              className="group flex flex-col items-center rounded-md border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${provider.color}`}
              >
                {provider.icon}
              </div>
              <span className="font-medium">{provider.name}</span>
              <span className="mt-1 text-xs text-muted-foreground">{provider.description}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button size="lg" variant="outline" className="mt-6" onClick={() => onAddProvider()}>
          <IconCloudPlus size={20} className="mr-2" />
          Add Other Provider
        </Button>
      </div>
    </div>
  )
}
