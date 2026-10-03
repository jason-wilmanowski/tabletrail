import { useFilterStore } from '../../store/filterStore'
import type { SearchMode } from '../../store/filterStore'

const SEARCH_MODES: { value: SearchMode; label: string }[] = [
  { value: 'tables', label: 'Tables' },
  { value: 'columns', label: 'Columns' },
]

/**
 * Slim two-option switch below `SearchInput` choosing what the sidebar
 * search matches: table names or column names. Like `SearchInput`, it
 * only writes `filterStore.searchMode` — the lists and `SchemaStats`
 * read it and decide what to show.
 */
export function SearchModeToggle() {
  const searchMode = useFilterStore((state) => state.searchMode)
  const setSearchMode = useFilterStore((state) => state.setSearchMode)

  return (
    <div className="flex gap-1 border-b border-border px-2 py-1" aria-label="Search in">
      {SEARCH_MODES.map((mode) => {
        const isActive = mode.value === searchMode
        return (
          <button
            key={mode.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => setSearchMode(mode.value)}
            className={`text-label flex-1 rounded-sm px-2 py-0.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
              isActive ? 'bg-surface-hover text-foreground' : 'hover:bg-surface-hover/60'
            }`}
          >
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
