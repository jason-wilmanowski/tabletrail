import { apiClient } from './client'
import type { DatabaseStructureResponse } from '../types/database'
import type { ConnectionFields } from '../types/common'

/**
 * POST /scanner
 *
 * Request payload mirrors backend `CreateDatabase` schema — identical
 * field set to `ConnectionFields` (types/common.ts), reused here rather
 * than duplicated as a separate interface.
 *
 * Response is the full `DatabaseStructureResponse`, confirmed from the
 * actual endpoint code: the scan endpoint runs the scan, then immediately
 * fetches and returns the complete nested structure so the frontend can
 * render right after scanning without a second request.
 */
export function scanDatabase(payload: ConnectionFields): Promise<DatabaseStructureResponse> {
  return apiClient.post<DatabaseStructureResponse>('/scanner', payload)
}

/**
 * PATCH /scanner/{db_id} — rescans an already-connected database.
 *
 * No request body: the backend loads the stored connection details by id
 * and decrypts the stored password itself. Response is the full
 * `DatabaseStructureResponse`, same as the initial scan.
 */
export function rescanDatabase(id: number): Promise<DatabaseStructureResponse> {
  return apiClient.patch<DatabaseStructureResponse>(`/scanner/${id}`)
}
