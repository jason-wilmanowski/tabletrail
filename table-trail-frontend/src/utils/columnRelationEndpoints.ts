import type { ColumnRelationResponse } from '../types/columnRelation'
import type { TableResponse } from '../types/table'

/** A column of the loaded structure, with both its ids and its names. */
export interface ColumnRef {
  tableId: number
  columnId: number
  schemaName: string
  tableName: string
  columnName: string
}

export interface ColumnIndex {
  byId: Map<number, ColumnRef>
  byName: Map<string, ColumnRef>
}

/** Map key for a column by name — JSON-encoded so no name can collide with a separator. */
export function columnNameKey(schemaName: string, tableName: string, columnName: string): string {
  return JSON.stringify([schemaName, tableName, columnName])
}

/**
 * Indexes every column of `tables` by id (what the graph's handles and the
 * relation selection use) and by name (what a column relation stores).
 * Tables without a schema are skipped: a relation needs schema names on
 * both sides, so their columns can't be part of one.
 */
export function buildColumnIndex(tables: TableResponse[]): ColumnIndex {
  const byId = new Map<number, ColumnRef>()
  const byName = new Map<string, ColumnRef>()
  for (const table of tables) {
    if (table.schema_name === null) {
      continue
    }
    for (const column of table.columns) {
      const ref: ColumnRef = {
        tableId: table.id,
        columnId: column.id,
        schemaName: table.schema_name,
        tableName: table.name,
        columnName: column.name,
      }
      byId.set(column.id, ref)
      byName.set(columnNameKey(table.schema_name, table.name, column.name), ref)
    }
  }
  return { byId, byName }
}

/**
 * Finds both columns of a relation in the loaded structure. Returns `null`
 * when either side no longer exists — the relation is then simply not
 * drawn (the backend removes such relations on the next rescan).
 */
export function resolveRelationEndpoints(
  relation: ColumnRelationResponse,
  index: ColumnIndex
): [ColumnRef, ColumnRef] | null {
  const column1 = index.byName.get(columnNameKey(relation.schema_name_1, relation.table_name_1, relation.column_name_1))
  const column2 = index.byName.get(columnNameKey(relation.schema_name_2, relation.table_name_2, relation.column_name_2))
  if (column1 === undefined || column2 === undefined) {
    return null
  }
  return [column1, column2]
}
