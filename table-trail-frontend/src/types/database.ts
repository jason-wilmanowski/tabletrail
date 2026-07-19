import type { ConnectionFields, DBStatus } from './common'
import type { TableResponse } from './table'
import type { ColumnResponse } from './column'

/**
 * Mirrors backend `DatabaseOverviewResponse` schema.
 *
 * NOTE: this schema was proposed during backend work to fix a lazy-load
 * error (`GET /database/all` must not touch the `tables` relationship
 * outside an active session). The exact final field set was not directly
 * re-confirmed from a live response afterward — treat this as the intended
 * shape, not a directly observed one. Verify against the real response
 * before relying on it in Step 3+.
 */
export interface DatabaseOverviewResponse {
  id: number
  name: string
  db_type: ConnectionFields['db_type']
  status: DBStatus
  host: string
  port: string
  db_name: string
}

/**
 * Mirrors backend `DatabaseStructureResponse` schema, confirmed from actual
 * scan output. Extends the same connection fields as `CreateDatabase` on
 * the backend (see note in common.ts regarding `password` exposure).
 */
export interface DatabaseStructureResponse extends ConnectionFields {
  id: number
  tables: TableResponse[]
}

/**
 * Mirrors backend `SearchResponse` schema.
 * All three fields are optional/nullable on the backend (Pydantic
 * `| None = None`), reflected here as optional.
 */
export interface SearchResponse {
  tables?: TableResponse[] | null
  columns?: ColumnResponse[] | null
  schema_tables?: TableResponse[] | null
}
