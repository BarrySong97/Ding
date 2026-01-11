import { Link, useRouterState, useParams } from '@tanstack/react-router'
import {
  IconLayoutDashboard,
  IconSettings,
  IconCloud,
  IconBrandAws,
  IconFolder
} from '@tabler/icons-react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb'
import { trpc } from '@renderer/lib/trpc'

// Provider icon based on variant
function getProviderIcon(variant?: string, size: number = 16) {
  if (variant === 'aws-s3') {
    return <IconBrandAws size={size} />
  }
  return <IconCloud size={size} />
}

export function Header() {
  const router = useRouterState()
  const currentPath = router.location.pathname

  // Get provider ID from URL if on provider page
  const params = useParams({ strict: false }) as { providerId?: string }
  const providerId = params.providerId

  // Fetch provider data if on provider page
  const { data: provider } = trpc.provider.getById.useQuery(
    { id: providerId! },
    { enabled: !!providerId }
  )

  const renderBreadcrumb = () => {
    // Dashboard
    if (currentPath === '/') {
      return (
        <BreadcrumbItem>
          <BreadcrumbPage className="flex items-center gap-2">
            <IconLayoutDashboard size={16} />
            <span>Dashboard</span>
          </BreadcrumbPage>
        </BreadcrumbItem>
      )
    }

    // Provider page
    if (currentPath.startsWith('/provider/') && provider) {
      const variant = provider.type === 's3-compatible' ? provider.variant : undefined
      return (
        <BreadcrumbItem>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-gray-500">{getProviderIcon(variant)}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{provider.name}</span>
          </div>
        </BreadcrumbItem>
      )
    }

    // Settings pages
    if (currentPath.startsWith('/settings')) {
      // Settings root only
      if (currentPath === '/settings') {
        return (
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-2">
              <IconSettings size={16} />
              <span>Settings</span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        )
      }

      // Settings sub-pages
      if (currentPath === '/settings/providers') {
        return (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings" className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                  <IconSettings size={16} />
                  <span>Settings</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm border border-gray-200 dark:border-gray-700">
                <IconFolder size={16} className="text-gray-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Providers</span>
              </div>
            </BreadcrumbItem>
          </>
        )
      }

      if (currentPath === '/settings/compression') {
        return (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings" className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                  <IconSettings size={16} />
                  <span>Settings</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm border border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white">Image Compression</span>
              </div>
            </BreadcrumbItem>
          </>
        )
      }

      return null
    }

    // Default fallback
    return null
  }

  return (
    <header className="h-12 px-4 pr-[140px] flex items-center shrink-0 bg-[#f2f8f3bf] dark:bg-[#1E1F22] border-b border-[#f2f8f7bf] dark:border-[#333333] draggable">
      <Breadcrumb>
        <BreadcrumbList>
          {renderBreadcrumb()}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
