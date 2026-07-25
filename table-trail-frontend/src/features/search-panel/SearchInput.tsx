import { Search } from 'lucide-react'
import { useFilterStore } from '../../store/filterStore'

/**
 * Compact search field for the sidebar table list. Only renders the
 * input and writes keystrokes into `filterStore.searchQuery` — it does
 * not filter anything itself, that happens in `VirtualizedTableList`,
 * which reads the same store value.
 *
 * Styled as a small, quiet utility field (thin border, muted icon, no
 * accent color) rather than a prominent hero search bar — this is a tool
 * living above a table list, not the focal point of the interface.
 */
export function SearchInput() {
  const searchQuery = useFilterStore((state) => state.searchQuery)
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery)

  return (
    <div className="flex items-center gap-1.5 border-b border-neutral-800 px-2 py-1.5">
      <Search className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
      <input
        type="text"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Filter tables..."
        className="w-full bg-transparent font-mono text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none"
      />
    </div>
  )
}
