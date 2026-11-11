import { create } from 'zustand'

/** What the sidebar search matches against — table names (default) or column names. */
export type SearchMode = 'tables' | 'columns'

interface FilterState {
  searchQuery: string
  searchMode: SearchMode

  setSearchQuery: (query: string) => void
  setSearchMode: (mode: SearchMode) => void
}

/**
 * Central filter state store, kept separate from uiStore because filter
 * state (search term, search mode) is conceptually distinct from general
 * interface state (selection, focus, sidebar, zoom). `searchQuery` is the
 * search term typed into `SearchInput`, `searchMode` the tables/columns
 * choice from `SearchModeToggle` — `filterStore` only holds these raw
 * values, it does not filter anything itself; that happens in the sidebar
 * lists and `SchemaStats`, which read them.
 */
export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: '',
  searchMode: 'tables',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchMode: (mode) => set({ searchMode: mode }),
}))
