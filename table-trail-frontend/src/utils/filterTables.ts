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
