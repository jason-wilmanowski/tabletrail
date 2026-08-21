import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllDatabases, getDatabase, updateDatabase, deleteDatabase } from '../api/databases'
import { rescanDatabase } from '../api/scanner'
import type { UpdateDatabaseRequest } from '../api/databases'
import type { DatabaseOverviewResponse, DatabaseStructureResponse } from '../types/database'
import type { ConnectionFields } from '../types/common'

/**
 * Wraps `getAllDatabases()` from the Step 3 API layer in a TanStack Query
 * hook. No fetch logic lives here — this hook only manages query key,
 * caching and loading/error/data state around the existing API function.
 */
export function useDatabases() {
  return useQuery<DatabaseOverviewResponse[]>({
    queryKey: ['databases'],
    queryFn: getAllDatabases,
  })
}

/**
 * Wraps `getDatabase(id)` from the Step 3 API layer. Loads a single
 * database's full nested structure (tables, columns, constraints) for
 * the detail page. `enabled: Boolean(id)` avoids firing a request with
 * an invalid/undefined id (e.g. while the route param is still resolving).
 */
export function useDatabase(id: number) {
  return useQuery<DatabaseStructureResponse>({
    queryKey: ['database', id],
    queryFn: () => getDatabase(id),
    enabled: Boolean(id),
  })
}

/**
 * Wraps `updateDatabase(id, data)`. The endpoint returns only connection
 * fields (`DatabaseResponse`, no `tables`), so on success those fields are
 * merged into the existing `['database', id]` cache entry directly — the
 * detail page updates immediately without waiting for a refetch and
 * without losing the already-loaded `tables`. `['databases']` (shared by
 * the overview page and the global sidebar) is invalidated so both pick
 * up the change from a single shared query, not a duplicated request.
 */
export function useUpdateDatabase(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateDatabaseRequest) => updateDatabase(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<DatabaseStructureResponse>(['database', id], (old) =>
        old ? { ...old, ...updated } : old
      )
      queryClient.invalidateQueries({ queryKey: ['databases'] })
    },
  })
}

/**
 * Wraps `deleteDatabase(id)`. On success the removed database's own
 * `['database', id]` cache entry is dropped and `['databases']` is
 * invalidated so the sidebar and overview page drop it immediately.
 */
export function useDeleteDatabase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteDatabase(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ['database', id] })
      queryClient.invalidateQueries({ queryKey: ['databases'] })
    },
  })
}

/**
 * Wraps `rescanDatabase(payload)`. The endpoint returns the full
 * `DatabaseStructureResponse` (including refreshed `tables`), which is
 * written directly into the `['database', id]` cache entry so the graph
 * and sidebar re-render with the new structure without a refetch.
 * `['databases']` is invalidated too since scan status/timestamps change.
 */
export function useRescanDatabase(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ConnectionFields) => rescanDatabase(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<DatabaseStructureResponse>(['database', id], updated)
      queryClient.invalidateQueries({ queryKey: ['databases'] })
    },
  })
}
