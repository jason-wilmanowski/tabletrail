import type { ColumnResponse } from './column'
import type { ConstraintResponse } from './constraint'

/**
 * Mirrors backend `TableResponse` schema exactly.
 */
export interface TableResponse {
  id: number
  name: string
  schema_name: string | null
  columns: ColumnResponse[]
  constraints: ConstraintResponse[]
}
