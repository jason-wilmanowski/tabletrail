import { create } from 'zustand'

interface FilterState {
  activeSchemaFilter: string | null

  setActiveSchemaFilter: (schema: string | null) => void
}

/**
 * Central filter state store, kept separate from uiStore because filter
 * state (which schema is active) is conceptually distinct from general
 * interface state (selection, focus, sidebar, zoom) and will grow its own
 * fields (e.g. search term) in later steps without bloating uiStore.
 */
export const useFilterStore = create<FilterState>((set) => ({
  activeSchemaFilter: null,

  setActiveSchemaFilter: (schema) => set({ activeSchemaFilter: schema }),
}))
