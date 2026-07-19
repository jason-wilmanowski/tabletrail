import { apiClient } from './client'
import type {
  DatabaseOverviewResponse,
  DatabaseStructureResponse,
  DatabaseResponse,
} from '../types/database'
import type { DBType, DBStatus } from '../types/common'

/**
 * Mirrors backend `UpdateDatabase` schema — all fields optional, matches
 * the Pydantic model confirmed during backend work exactly.
 */
export interface UpdateDatabaseRequest {
  name?: string
  db_type?: DBType
  host?: string
  port?: string
  db_name?: string
  username?: string
  password?: string
  status?: DBStatus
}

/**
 * GET /database/all
 *
 * NOTE: the backend code shown during development had
 * `response_model=List[DatabaseStructureResponse]` on this endpoint, which
 * caused a `MissingGreenlet` error because `tables` is lazy-loaded outside
 * an active session for a plain (non-joinedload) query. A fix using
 * `DatabaseOverviewResponse` instead was proposed but not confirmed as
 * applied. Typed against `DatabaseOverviewResponse` here since that is the
 * intended correct shape — verify against the live endpoint in Step 4.
 */
export function getAllDatabases(): Promise<DatabaseOverviewResponse[]> {
  return apiClient.get<DatabaseOverviewResponse[]>('/database/all')
}

/** GET /database/{db_id} — full nested structure, confirmed from actual scan output. */
export function getDatabase(id: number): Promise<DatabaseStructureResponse> {
  return apiClient.get<DatabaseStructureResponse>(`/database/${id}`)
}

/** PUT /database/{db_id} — backend response_model is `DatabaseResponse` (no tables). */
export function updateDatabase(
  id: number,
  data: UpdateDatabaseRequest
): Promise<DatabaseResponse> {
  return apiClient.put<DatabaseResponse>(`/database/${id}`, data)
}

/**
 * DELETE /database/{db_id}
 * Backend returns a plain `{ message: string }` dict, confirmed from
 * actual endpoint code (`return { "message": f"Database with ID: ... " }`).
 */
export function deleteDatabase(id: number): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`/database/${id}`)
}
