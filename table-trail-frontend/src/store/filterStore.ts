import { create } from 'zustand'

interface FilterState {
  activeSchemaFilter: string | null
  searchQuery: string

  setActiveSchemaFilter: (schema: string | null) => void
  setSearchQuery: (query: string) => void
}

/**
 * Central filter state store, kept separate from uiStore because filter
 * state (schema filter, search term) is conceptually distinct from
 * general interface state (selection, focus, sidebar, zoom). `searchQuery`
 * (Step 26) is the search term typed into `SearchInput` — `filterStore`
 * only holds the raw string, it does not filter anything itself; that
 * happens in `VirtualizedTableList`, which reads this value.
 */
export const useFilterStore = create<FilterState>((set) => ({
  activeSchemaFilter: null,
  searchQuery: '',

  setActiveSchemaFilter: (schema) => set({ activeSchemaFilter: schema }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
