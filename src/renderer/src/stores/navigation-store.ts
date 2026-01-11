import { create } from 'zustand'

export interface ProviderInfo {
  id: string
  name: string
  variant?: string
}

interface NavigationState {
  // 当前导航上下文
  currentProvider: ProviderInfo | null
  currentBucket: string | null
  currentPath: string[] // 文件夹路径数组 ['folder1', 'subfolder2']

  // Actions
  setProvider: (provider: ProviderInfo | null) => void
  setBucket: (bucket: string | null) => void
  setPath: (path: string[]) => void
  navigateToFolder: (index: number) => void // 点击面包屑导航到特定文件夹，-1 表示 bucket 根目录
  reset: () => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentProvider: null,
  currentBucket: null,
  currentPath: [],

  setProvider: (provider) =>
    set({
      currentProvider: provider,
      currentBucket: null,
      currentPath: []
    }),

  setBucket: (bucket) =>
    set({
      currentBucket: bucket,
      currentPath: []
    }),

  setPath: (path) => set({ currentPath: path }),

  navigateToFolder: (index) =>
    set((state) => ({
      currentPath: index === -1 ? [] : state.currentPath.slice(0, index + 1)
    })),

  reset: () =>
    set({
      currentProvider: null,
      currentBucket: null,
      currentPath: []
    })
}))
