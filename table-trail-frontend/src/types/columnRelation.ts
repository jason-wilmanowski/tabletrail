/** Mirrors backend `ColumnRelationColor` enum values exactly. */
export type ColumnRelationColor = 'green' | 'red' | 'yellow' | 'blue' | 'magenta' | 'white'

/**
 * Mirrors backend `ColumnRelationResponse` schema exactly.
 * A manually-drawn column-to-column relation, independent of real
 * foreign keys — see `constraintsToEdges.ts` for those. Each side is
 * referenced by schema, table and column name (not column id), so a
 * relation survives a rescan, which recreates every column with a new id.
 */
export interface ColumnRelationResponse {
  id: number
  database_id: number
  schema_name_1: string
  schema_name_2: string
  table_name_1: string
  table_name_2: string
  column_name_1: string
  column_name_2: string
  relation_color: ColumnRelationColor
  description: string | null
}
