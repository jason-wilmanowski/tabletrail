/**
 * Mirrors backend `ColumnResponse` schema exactly.
 * Fields confirmed from actual scan output.
 */
export interface ColumnResponse {
  id: number
  name: string
  data_type: string
  is_nullable: boolean
  default_value: string | null
  ordinal_position: number
}
