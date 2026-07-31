import { create } from 'zustand'

interface UiState {
  selectedTableId: string | null
  focusMode: boolean
  sidebarCollapsed: boolean
  zoomLevel: number
  previewDatabaseId: number | null

  setSelectedTableId: (id: string | null) => void
  setFocusMode: (value: boolean) => void
  setSidebarCollapsed: (value: boolean) => void
  setZoomLevel: (value: number) => void
  setPreviewDatabaseId: (id: number | null) => void
}

/**
 * Central UI state store. Holds only ephemeral interface state — no
 * server data, no API calls. Backend data continues to flow exclusively
 * through TanStack Query (see hooks/useDatabases.ts).
 */
export const useUiStore = create<UiState>((set) => ({
  selectedTableId: null,
  focusMode: false,
  sidebarCollapsed: false,
  zoomLevel: 1,
  previewDatabaseId: null,

  setSelectedTableId: (id) => set({ selectedTableId: id }),
  setFocusMode: (value) => set({ focusMode: value }),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setZoomLevel: (value) => set({ zoomLevel: value }),
  setPreviewDatabaseId: (id) => set({ previewDatabaseId: id }),
}))
