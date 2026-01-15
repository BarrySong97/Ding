import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { IconPlus } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { trpc } from '@renderer/lib/trpc'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator
} from '@/components/ui/sidebar'
import { AddProviderDialog } from '@/components/provider/add-provider-dialog'
import { MENU_ITEMS } from '@renderer/constants/menu'
import { ProviderBrandIcon, getProviderIconKey } from '@/components/provider/brand-icon'

// Maximum number of providers to show in sidebar
const MAX_RECENT_PROVIDERS = 5

export function AppSidebar() {
  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const { data: providers, isLoading } = trpc.provider.list.useQuery()
  const router = useRouterState()
  const currentPath = router.location.pathname

  const isProviderActive = (providerId: string) => {
    return currentPath.includes(`/provider/${providerId}`)
  }

  const isDashboardActive = currentPath === '/'
  const isUploadHistoryActive = currentPath.startsWith('/my-uploads')
  const isProvidersActive = currentPath === '/providers'
  const isSettingsActive = currentPath.startsWith('/settings')

  // Find active provider
  const activeProviderId = providers?.find((p) => isProviderActive(p.id))?.id

  // Get recent providers (limit to MAX_RECENT_PROVIDERS)
  const recentProviders = providers?.slice(0, MAX_RECENT_PROVIDERS) ?? []

  return (
    <>
      <Sidebar collapsible="icon" className="border-r-0">
        {/* Mac drag area */}
        <SidebarHeader
          className={cn('p-0', window.api.platform.isMac && 'h-[30px] draggable')}
        />

        <SidebarContent className="bg-[#f2f8f3bf] dark:bg-[#1E1F22]">
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={MENU_ITEMS.dashboard.label}
                  isActive={isDashboardActive}
                >
                  <Link to={MENU_ITEMS.dashboard.path}>
                    <MENU_ITEMS.dashboard.icon size={18} />
                    <span>{MENU_ITEMS.dashboard.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={MENU_ITEMS.providers.label}
                  isActive={isProvidersActive}
                >
                  <Link to={MENU_ITEMS.providers.path}>
                    <MENU_ITEMS.providers.icon size={18} />
                    <span>{MENU_ITEMS.providers.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={MENU_ITEMS.uploadHistory.label}
                  isActive={isUploadHistoryActive}
                >
                  <Link to={MENU_ITEMS.uploadHistory.path}>
                    <MENU_ITEMS.uploadHistory.icon size={18} />
                    <span>{MENU_ITEMS.uploadHistory.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Recent Providers */}
          <SidebarGroup className="flex-1">
            <SidebarGroupLabel>Recent Providers</SidebarGroupLabel>
            <SidebarMenu>
              {isLoading ? (
                <>
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                </>
              ) : (
                recentProviders.map((provider) => {
                  const iconKey = getProviderIconKey(provider)
                  const isActive = provider.id === activeProviderId

                  return (
                    <SidebarMenuItem key={provider.id}>
                      <SidebarMenuButton
                        asChild
                        tooltip={provider.name}
                        isActive={isActive}
                      >
                        <Link
                          to="/provider/$providerId"
                          params={{ providerId: provider.id }}
                        >
                          <ProviderBrandIcon
                            iconKey={iconKey}
                            size={20}
                            showBackground={false}
                          />
                          <span>{provider.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              )}

              {/* Add Provider Button */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Add Provider"
                  onClick={() => setAddProviderOpen(true)}
                  className="text-muted-foreground"
                >
                  <IconPlus size={18} />
                  <span>Add Provider</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* Settings at bottom */}
        <SidebarFooter className="bg-[#f2f8f3bf] dark:bg-[#1E1F22]">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={MENU_ITEMS.settings.label}
                isActive={isSettingsActive}
              >
                <Link to={MENU_ITEMS.settings.path}>
                  <MENU_ITEMS.settings.icon size={18} />
                  <span>{MENU_ITEMS.settings.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Add Provider Dialog */}
      <AddProviderDialog open={addProviderOpen} onOpenChange={setAddProviderOpen} />
    </>
  )
}
