import { STORE_APP_SETTINGS } from '@flowcanvas/core'
import { create } from 'zustand'

import { getStorage } from '../adapters/storage'

const APP_SETTINGS_ID = 'app-settings'

interface AppSettings {
  sidebarCollapsed: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  sidebarCollapsed: false,
}

interface AppSettingsStore extends AppSettings {
  hydrated: boolean
  hydrate: () => Promise<void>
  setSidebarCollapsed: (collapsed: boolean) => void
}

/**
 * 侧栏收起态**存 appSettings 跨会话记忆**（08 §2.3）。
 * 仅手动触发，不做窄屏自动收起。
 */
export const useAppSettings = create<AppSettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return
    const stored = await getStorage().get<AppSettings>(STORE_APP_SETTINGS, APP_SETTINGS_ID)
    set({ ...DEFAULT_SETTINGS, ...stored, hydrated: true })
  },

  setSidebarCollapsed: (sidebarCollapsed) => {
    set({ sidebarCollapsed })
    // ⚠️ 只落**数据字段**。此处曾写成 `...get()`，把 store 的方法一并展开进去，
    // IndexedDB 无法结构化克隆函数 → DataCloneError，收起态静默丢失。
    const settings: AppSettings = { sidebarCollapsed }
    void getStorage().put(STORE_APP_SETTINGS, APP_SETTINGS_ID, settings)
  },
}))
