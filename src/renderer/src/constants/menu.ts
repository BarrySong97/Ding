import {
  IconLayoutDashboard,
  IconSettings,
  IconFolder,
  IconPhoto,
  IconUpload
} from '@tabler/icons-react'

// 菜单项类型定义
export interface MenuItem {
  id: string
  path: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

// 主菜单项（用于 sidebar 和 breadcrumb）
export const MENU_ITEMS = {
  dashboard: {
    id: 'dashboard',
    path: '/',
    label: 'Dashboard',
    icon: IconLayoutDashboard
  },
  myUploads: {
    id: 'my-uploads',
    path: '/my-uploads',
    label: 'My Uploads',
    icon: IconUpload
  },
  settings: {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    icon: IconSettings
  }
} as const satisfies Record<string, MenuItem>

// Settings 子路由（仅用于 breadcrumb）
export const SETTINGS_SUB_ROUTES: MenuItem[] = [
  { id: 'providers', path: '/settings/providers', label: 'Providers', icon: IconFolder },
  { id: 'compression', path: '/settings/compression', label: 'Image Compression', icon: IconPhoto }
]

// 辅助函数：根据路径查找菜单项
export function findMenuItemByPath(path: string): MenuItem | undefined {
  // 先查主菜单
  const mainItem = Object.values(MENU_ITEMS).find((item) => item.path === path)
  if (mainItem) return mainItem

  // 再查 settings 子路由
  return SETTINGS_SUB_ROUTES.find((item) => item.path === path)
}
