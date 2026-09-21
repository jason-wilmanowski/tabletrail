import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SettingValue } from '../features/settings/settingsRegistry'

interface SettingsState {
  /** Only values the user has changed; unset keys fall back to their registry default. */
  values: Record<string, SettingValue>
  setValue: (key: string, value: SettingValue) => void
  resetAll: () => void
}

/**
 * Persisted client-side preferences (localStorage). Defaults live with the
 * setting definitions in `settingsRegistry`, not here, so adding a setting
 * never touches this store.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      values: {},
      setValue: (key, value) => set((state) => ({ values: { ...state.values, [key]: value } })),
      resetAll: () => set({ values: {} }),
    }),
    { name: 'tabletrail-settings' }
  )
)

export function useSettingValue<T extends SettingValue>(key: string, defaultValue: T): T {
  return useSettingsStore((state) => (state.values[key] as T | undefined) ?? defaultValue)
}
