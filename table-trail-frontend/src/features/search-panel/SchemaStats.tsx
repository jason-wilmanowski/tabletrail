import { useMemo } from 'react'
import { useFilterStore } from '../../store/filterStore'
import type { TableResponse } from '../../types/table'
import { countColumns, countMatchedTables, filterColumnsByName, filterTablesByName } from '../../utils/filterTables'

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
 * using the same filter functions as the lists below so the counts always
 * match them: in tables mode the matching tables and their columns, in
 * columns mode the tables containing a matching column and the matching
 * columns themselves.
 *
 * Sits on `bg-surface` (one step lighter than the sidebar's `bg-panel`)
 * so it reads as a separate info strip rather than part of the input or
 * the table list.
 */
export function SchemaStats({ tables, showMatchCount }: SchemaStatsProps) {
  const searchQuery = useFilterStore((state) => state.searchQuery)
  const searchMode = useFilterStore((state) => state.searchMode)
  const isSearching = showMatchCount && searchQuery.trim() !== ''

  const totalColumnCount = useMemo(() => countColumns(tables), [tables])
  const { matchedTableCount, matchedColumnCount } = useMemo(() => {
    if (!isSearching) {
      return { matchedTableCount: tables.length, matchedColumnCount: totalColumnCount }
    }
    if (searchMode === 'columns') {
      const columnMatches = filterColumnsByName(tables, searchQuery)
      return { matchedTableCount: countMatchedTables(columnMatches), matchedColumnCount: columnMatches.length }
    }
    const matchedTables = filterTablesByName(tables, searchQuery)
    return { matchedTableCount: matchedTables.length, matchedColumnCount: countColumns(matchedTables) }
  }, [tables, searchQuery, searchMode, isSearching, totalColumnCount])

  return (
    <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-2 py-1">
      <span className="text-technical-muted">
        {formatCount(matchedTableCount, isSearching ? tables.length : null, 'table', 'tables')}
      </span>
      <span className="text-technical-muted">
        {formatCount(matchedColumnCount, isSearching ? totalColumnCount : null, 'column', 'columns')}
      </span>
    </div>
  )
}
