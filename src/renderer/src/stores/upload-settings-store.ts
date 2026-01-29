import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface UploadSettings {
  defaultGenerateBlurhash: boolean
  rememberLastUploadTarget: boolean
  lastUploadTarget?: {
    providerId: string
    bucket: string
    prefix: string
  }
}

export const UPLOAD_SETTINGS_KEY = 'upload-settings'

export const DEFAULT_UPLOAD_SETTINGS: UploadSettings = {
  defaultGenerateBlurhash: false,
  rememberLastUploadTarget: false
}

interface UploadSettingsState extends UploadSettings {
  setDefaultGenerateBlurhash: (value: boolean) => void
  setRememberLastUploadTarget: (value: boolean) => void
  setLastUploadTarget: (target?: UploadSettings['lastUploadTarget']) => void
  resetUploadSettings: () => void
}

export const useUploadSettingsStore = create<UploadSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_UPLOAD_SETTINGS,
      lastUploadTarget: undefined,
      setDefaultGenerateBlurhash: (value) => set({ defaultGenerateBlurhash: value }),
      setRememberLastUploadTarget: (value) =>
        set((state) => ({
          rememberLastUploadTarget: value,
          lastUploadTarget: value ? state.lastUploadTarget : undefined
        })),
      setLastUploadTarget: (target) => set({ lastUploadTarget: target }),
      resetUploadSettings: () =>
        set({
          ...DEFAULT_UPLOAD_SETTINGS,
          lastUploadTarget: undefined
        })
    }),
    {
      name: UPLOAD_SETTINGS_KEY,
      storage: createJSONStorage(() => localStorage)
    }
  )
)
