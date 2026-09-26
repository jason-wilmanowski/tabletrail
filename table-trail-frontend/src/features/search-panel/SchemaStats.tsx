import { useMemo } from 'react'
import { useFilterStore } from '../../store/filterStore'
import type { TableResponse } from '../../types/table'
import { countColumns, filterTablesByName } from '../../utils/filterTables'

interface SchemaStatsProps {
  tables: TableResponse[]
  /** While a search is active, show "matches of total" instead of just the totals. */
  showMatchCount: boolean
}

function formatCount(count: number, total: number | null, singular: string, plural: string): string {
  const noun = (total ?? count) === 1 ? singular : plural
  const value = count.toLocaleString('en-US')
  return total === null ? `${value} ${noun}` : `${value} of ${total.toLocaleString('en-US')} ${noun}`
}

/**
 * Slim summary row below `SearchInput` showing the database's table and
 * column count — a quick sense of the schema's size while searching.
 * With `showMatchCount`, an active search switches to "5 of 24 tables",
 * using the same `filterTablesByName` as `VirtualizedTableList` so the
 * counts always match the list below.
 *
 * Sits on `bg-surface` (one step lighter than the sidebar's `bg-panel`)
 * so it reads as a separate info strip rather than part of the input or
 * the table list.
 */
export function SchemaStats({ tables, showMatchCount }: SchemaStatsProps) {
  const searchQuery = useFilterStore((state) => state.searchQuery)
  const isSearching = showMatchCount && searchQuery.trim() !== ''

  const totalColumnCount = useMemo(() => countColumns(tables), [tables])
  const matchedTables = useMemo(
    () => (isSearching ? filterTablesByName(tables, searchQuery) : tables),
    [tables, searchQuery, isSearching]
  )
  const matchedColumnCount = useMemo(() => countColumns(matchedTables), [matchedTables])

  return (
    <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-2 py-1">
      <span className="text-technical-muted">
        {formatCount(matchedTables.length, isSearching ? tables.length : null, 'table', 'tables')}
      </span>
      <span className="text-technical-muted">
        {formatCount(matchedColumnCount, isSearching ? totalColumnCount : null, 'column', 'columns')}
      </span>
    </div>
  )
}
