import { useQuery } from '@tanstack/react-query'
import { getAllDatabases, getDatabase } from '../api/databases'
import type { DatabaseOverviewResponse, DatabaseStructureResponse } from '../types/database'

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
