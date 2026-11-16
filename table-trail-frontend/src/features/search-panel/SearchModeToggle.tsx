import { useMemo } from 'react'
import { useFilterStore } from '../../store/filterStore'
import type { SearchMode } from '../../store/filterStore'
import type { TableResponse } from '../../types/table'
import { countSearchMatches } from '../../utils/filterTables'

interface SearchModeToggleProps {
  tables: TableResponse[]
}

const SEARCH_MODES: { value: SearchMode; label: string }[] = [
  { value: 'tables', label: 'Tables' },
  { value: 'columns', label: 'Columns' },
]

/**
 * Slim two-option switch below `SearchInput` choosing what the sidebar
 * search matches: table names or column names. Like `SearchInput`, it
 * only writes `filterStore.searchMode` — the lists and `SchemaStats`
 * read it and decide what to show. While searching, each button shows
 * its hit count (`[ Tables 3 ] [ Columns 12 ]`), so it's visible where the
 * matches are before switching modes.
 */
export function SearchModeToggle({ tables }: SearchModeToggleProps) {
  const searchMode = useFilterStore((state) => state.searchMode)
  const setSearchMode = useFilterStore((state) => state.setSearchMode)
  const searchQuery = useFilterStore((state) => state.searchQuery)
  const matchCounts = useMemo(() => countSearchMatches(tables, searchQuery), [tables, searchQuery])

  return (
    <div className="flex gap-1 border-b border-border px-2 py-1" aria-label="Search in">
      {SEARCH_MODES.map((mode) => {
        const isActive = mode.value === searchMode
        const count = matchCounts?.[mode.value]
        return (
          <button
            key={mode.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => setSearchMode(mode.value)}
            className={`text-label flex flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-0.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
              isActive ? 'bg-surface-hover text-foreground' : 'hover:bg-surface-hover/60'
            }`}
          >
            {mode.label}
            {count !== undefined && (
              <span className={`font-mono tabular-nums ${count === 0 ? 'opacity-50' : ''}`}>
                {count.toLocaleString('en-US')}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
