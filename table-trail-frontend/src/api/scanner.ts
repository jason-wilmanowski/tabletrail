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
 * PATCH /scanner — rescans an already-connected database.
 *
 * Confirmed from backend `rescan_database` (table_trail_backend/api/scanner.py):
 * request body is the full `CreateDatabase` shape (no id) — the backend
 * matches the existing row by host/port/db_name. Response is the full
 * `DatabaseStructureResponse`, same as the initial scan.
 */
export function rescanDatabase(payload: ConnectionFields): Promise<DatabaseStructureResponse> {
  return apiClient.patch<DatabaseStructureResponse>('/scanner', payload)
}
