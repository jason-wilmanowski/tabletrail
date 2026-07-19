import { useQuery } from '@tanstack/react-query'
import { getAllDatabases } from '../api/databases'
import type { DatabaseOverviewResponse } from '../types/database'

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
