import type { ColumnResponse } from '../types/column'
import type { TableResponse } from '../types/table'

/**
 * Sidebar table search: case-insensitive substring match on the table
 * name. An empty or whitespace-only query returns `tables` unchanged.
 * Shared by `VirtualizedTableList` and `SchemaStats` so the list and the
 * match counts can never disagree.
 */
export function filterTablesByName(tables: TableResponse[], searchQuery: string): TableResponse[] {
  const query = searchQuery.trim().toLowerCase()
  if (query === '') {
    return tables
  }
  return tables.filter((table) => table.name.toLowerCase().includes(query))
}

/** Total number of columns across `tables`. */
export function countColumns(tables: TableResponse[]): number {
  return tables.reduce((sum, table) => sum + table.columns.length, 0)
}

/** A column matched by the sidebar column search, together with the table it belongs to. */
export interface ColumnMatch {
  table: TableResponse
  column: ColumnResponse
}

/**
 * Sidebar column search: case-insensitive substring match on the column
 * name across all `tables`, in table order. Unlike `filterTablesByName`,
 * an empty or whitespace-only query matches nothing — listing every
 * column of a database isn't useful, so the column list stays empty
 * until something is typed.
 */
export function filterColumnsByName(tables: TableResponse[], searchQuery: string): ColumnMatch[] {
  const query = searchQuery.trim().toLowerCase()
  if (query === '') {
    return []
  }
  return tables.flatMap((table) =>
    table.columns.filter((column) => column.name.toLowerCase().includes(query)).map((column) => ({ table, column }))
  )
}

/** Number of distinct tables among `matches` — the table count shown while searching columns. */
export function countMatchedTables(matches: ColumnMatch[]): number {
  return new Set(matches.map((match) => match.table.id)).size
}
