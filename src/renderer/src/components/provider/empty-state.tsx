import { IconCloudUpload, IconBrandAws, IconCloud, IconPlus } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import type { S3Variant } from '@renderer/db'

interface EmptyStateProps {
  onAddProvider: (variant?: S3Variant) => void
}

const quickProviders: {
  variant: S3Variant
  name: string
  subtitle: string
  icon: React.ReactNode
  iconBgColor: string
  borderColor: string
}[] = [
  {
    variant: 'cloudflare-r2',
    name: 'Cloudflare R2',
    subtitle: 'S3 Compatible',
    icon: <IconCloud size={36} />,
    iconBgColor: 'bg-orange-50 dark:bg-orange-900/20 text-orange-500 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30',
    borderColor: 'hover:border-orange-400 dark:hover:border-orange-500'
  },
  {
    variant: 'aws-s3',
    name: 'AWS S3',
    subtitle: 'Standard',
    icon: <IconBrandAws size={36} />,
    iconBgColor: 'bg-[#FF9900]/10 dark:bg-[#FF9900]/20 text-[#FF9900] group-hover:bg-[#FF9900]/20 dark:group-hover:bg-[#FF9900]/30',
    borderColor: 'hover:border-[#FF9900]'
  },
  {
    variant: 'tencent-cos',
    name: 'Tencent COS',
    subtitle: 'Cloud Storage',
    icon: <IconCloud size={36} />,
    iconBgColor: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30',
    borderColor: 'hover:border-blue-500 dark:hover:border-blue-400'
  },
  {
    variant: 'aliyun-oss',
    name: 'Aliyun OSS',
    subtitle: 'Object Storage',
    icon: <IconCloud size={36} />,
    iconBgColor: 'bg-orange-50 dark:bg-orange-900/20 text-orange-500 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30',
    borderColor: 'hover:border-orange-400 dark:hover:border-orange-500'
  }
]

export function EmptyState({ onAddProvider }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-1 overflow-y-auto p-8 flex-col items-center justify-center">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
        {/* Cloud Icon with Glow */}
        <div className="mb-10 relative">
          <div className="w-40 h-40 rounded-full bg-white dark:bg-[#1E1E1E] border border-gray-100 dark:border-[#333] shadow-sm flex items-center justify-center relative z-10">
            <IconCloudUpload size={80} className="text-blue-500/80 dark:text-blue-400" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-60 z-0" />
        </div>

        {/* Title and Description */}
        <div className="text-center mb-16 max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Get Started with OSS Upload
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
            No providers are currently connected. Connect your storage provider to begin managing
            your buckets and assets in one unified dashboard.
          </p>
        </div>

        {/* Provider Section */}
        <div className="w-full">
          {/* Section Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
            <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Connect a Provider
            </h2>
            <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
          </div>

          {/* Provider Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {quickProviders.map((provider) => (
              <button
                key={provider.variant}
                onClick={() => onAddProvider(provider.variant)}
                className={cn(
                  'group bg-white dark:bg-[#1E1E1E] p-6 rounded-xl border border-gray-200 dark:border-[#333]',
                  'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
                  'flex flex-col items-center gap-4',
                  provider.borderColor
                )}
              >
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
                    provider.iconBgColor
                  )}
                >
                  {provider.icon}
                </div>
                <div className="text-center">
                  <span className="block font-semibold text-gray-900 dark:text-white mb-0.5">
                    {provider.name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {provider.subtitle}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Add Custom Provider Button */}
          <button
            onClick={() => onAddProvider()}
            className="w-full bg-gray-50/50 dark:bg-[#1E1E1E]/40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-[#1E1E1E] hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white hover:shadow-sm transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
              <IconPlus size={18} />
            </div>
            <span className="font-medium text-lg">Add Custom Provider</span>
          </button>
        </div>
      </div>
    </div>
  )
}
