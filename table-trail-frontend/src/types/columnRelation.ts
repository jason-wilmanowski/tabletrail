/** Mirrors backend `ColumnRelationColor` enum values exactly. */
export type ColumnRelationColor = 'green' | 'red' | 'yellow' | 'blue' | 'magenta' | 'white'

/**
 * Mirrors backend `ColumnRelationResponse` schema exactly.
 * A manually-drawn column-to-column relation, independent of real
 * foreign keys — see `constraintsToEdges.ts` for those.
 */
export interface ColumnRelationResponse {
  id: number
  database_id: number
  column_id_1: number
  column_id_2: number
  relation_color: ColumnRelationColor
  description: string | null
}
