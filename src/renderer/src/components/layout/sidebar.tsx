import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  IconPlus,
  IconSettings,
  IconCloud,
  IconBrandAws,
  IconLayoutDashboard
} from '@tabler/icons-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { trpc } from '@renderer/lib/trpc'
import { Skeleton } from '@/components/ui/skeleton'
import { AddProviderDialog } from '@/components/provider/add-provider-dialog'

// Active indicator component
function ActiveIndicator({ height = 'h-9' }: { height?: string }) {
  return (
    <motion.div
      layoutId="sidebar-indicator"
      className={cn('absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-[#20a64b]', height)}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  )
}

// Provider icon colors based on variant
function getProviderIconColor(variant?: string): string {
  switch (variant) {
    case 'aws-s3':
      return 'text-orange-500'
    case 'cloudflare-r2':
      return 'text-orange-400'
    case 'aliyun-oss':
      return 'text-orange-500'
    case 'tencent-cos':
      return 'text-blue-500'
    case 'minio':
      return 'text-red-500'
    default:
      return 'text-slate-600 dark:text-slate-300'
  }
}

function getProviderIcon(variant?: string) {
  if (variant === 'aws-s3') {
    return <IconBrandAws size={24} />
  }
  return <IconCloud size={24} />
}

export function Sidebar() {
  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const { data: providers, isLoading } = trpc.provider.list.useQuery()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const isProviderActive = (providerId: string) => {
    return currentPath.includes(`/provider/${providerId}`)
  }

  const isDashboardActive = currentPath === '/'
  const isSettingsActive = currentPath.startsWith('/settings')

  // Find active provider
  const activeProviderId = providers?.find((p) => isProviderActive(p.id))?.id

  return (
    <div
      id="sidebar"
      className="relative overflow-hidden flex min-h-screen h-full w-[72px] flex-col items-center  bg-[#f2f8f3bf] dark:bg-[#1E1F22] overflow-x-hidden no-draggable py-3 gap-2"
    >
      {/* Dashboard Button */}
      <div className="relative group flex items-center justify-center w-full">
        {isDashboardActive && <ActiveIndicator />}
        <Link
          to="/"
          className="w-12 h-12 rounded-md transition-all overflow-hidden shadow-sm flex items-center justify-center bg-white text-slate-700 hover:bg-accent"
        >
          <IconLayoutDashboard size={24} />
        </Link>
        {/* Tooltip */}
        <div className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md group-hover:block z-50">
          Dashboard
        </div>
      </div>

      {/* Separator */}
      <div className="h-[2px] w-8 bg-gray-300 rounded-lg mx-auto my-1 opacity-50" />

      {/* Provider List */}
      <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto overflow-x-hidden w-full">
        {isLoading ? (
          <>
            <Skeleton className="w-12 h-12 rounded-md" />
            <Skeleton className="w-12 h-12 rounded-md" />
          </>
        ) : (
          providers?.map((provider) => {
            const variant = provider.type === 's3-compatible' ? provider.variant : undefined
            const iconColor = getProviderIconColor(variant)
            const isActive = provider.id === activeProviderId

            return (
              <div
                key={provider.id}
                className="relative group flex items-center justify-center w-full"
              >
                {isActive && <ActiveIndicator />}
                <Link
                  to="/provider/$providerId"
                  params={{ providerId: provider.id }}
                  className={cn(
                    'w-12 h-12 rounded-md transition-all overflow-hidden shadow-sm flex items-center justify-center',
                    'bg-white hover:bg-accent',
                    iconColor
                  )}
                >
                  {getProviderIcon(variant)}
                </Link>
                {/* Tooltip */}
                <div className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md group-hover:block z-50">
                  {provider.name}
                </div>
              </div>
            )
          })
        )}

        {/* Add Provider Button */}
        <div className="relative group flex items-center justify-center mt-2">
          <button
            onClick={() => setAddProviderOpen(true)}
            className="w-12 h-12 rounded-md bg-white dark:bg-[#1E1E1E] text-slate-500 dark:text-slate-400 hover:bg-accent transition-all overflow-hidden shadow-sm flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600"
          >
            <IconPlus size={24} />
          </button>
          {/* Tooltip */}
          <div className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md group-hover:block z-50">
            Add Provider
          </div>
        </div>
      </div>

      {/* Bottom Settings */}
      <div className="mt-auto mb-4 w-full">
        <div className="relative group flex items-center justify-center w-full">
          {isSettingsActive && <ActiveIndicator height="h-7" />}
          <Link
            to="/settings"
            className="w-10 h-10 rounded-md transition-colors flex items-center justify-center bg-white text-gray-500 dark:text-gray-400 hover:bg-accent"
          >
            <IconSettings size={20} />
          </Link>
          {/* Tooltip */}
          <div className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md group-hover:block z-50">
            Settings
          </div>
        </div>
      </div>

      {/* Add Provider Dialog */}
      <AddProviderDialog open={addProviderOpen} onOpenChange={setAddProviderOpen} />
    </div>
  )
}
