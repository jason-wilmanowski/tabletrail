import { create } from 'zustand'
import { COLUMN_HIGHLIGHT_DELAY_MS, COLUMN_HIGHLIGHT_DURATION_MS } from '../utils/graphFocus'

/**
 * A column briefly flashed in the graph after it was picked in the column
 * search. `token` is unique per request, so picking the same column again
 * restarts the animation instead of being a no-op.
 */
export interface ColumnHighlight {
  columnId: number
  token: number
}

interface UiState {
  selectedTableId: string | null
  focusMode: boolean
  sidebarCollapsed: boolean
  zoomLevel: number
  previewDatabaseId: number | null
  columnHighlight: ColumnHighlight | null
  /**
   * Bumped on every explicit "focus this table" request, so the graph
   * re-centers even when the table is already selected (e.g. a second
   * column of the same table is picked after panning away). Never reset,
   * unlike `columnHighlight`, so clearing the highlight doesn't re-zoom.
   */
  focusRequest: number

  setSelectedTableId: (id: string | null) => void
  setFocusMode: (value: boolean) => void
  setSidebarCollapsed: (value: boolean) => void
  setZoomLevel: (value: number) => void
  setPreviewDatabaseId: (id: number | null) => void
  /**
   * Selects the column's table, re-centers the graph on it and flashes the
   * column. The highlight clears itself once its animation is over, so
   * it can never stick around.
   */
  focusColumn: (tableId: number, columnId: number) => void
}

let highlightTimeout: ReturnType<typeof setTimeout> | undefined
let nextHighlightToken = 1

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
  columnHighlight: null,
  focusRequest: 0,

  setSelectedTableId: (id) => set({ selectedTableId: id }),
  setFocusMode: (value) => set({ focusMode: value }),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setZoomLevel: (value) => set({ zoomLevel: value }),
  setPreviewDatabaseId: (id) => set({ previewDatabaseId: id }),
  focusColumn: (tableId, columnId) => {
    const token = nextHighlightToken++
    clearTimeout(highlightTimeout)
    set((state) => ({
      selectedTableId: String(tableId),
      focusRequest: state.focusRequest + 1,
      columnHighlight: { columnId, token },
    }))
    highlightTimeout = setTimeout(() => {
      // Only clear our own highlight — a newer one may have replaced it.
      if (useUiStore.getState().columnHighlight?.token === token) {
        set({ columnHighlight: null })
      }
    }, COLUMN_HIGHLIGHT_DELAY_MS + COLUMN_HIGHLIGHT_DURATION_MS)
  },
}))
