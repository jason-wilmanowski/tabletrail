import { useMutation } from '@tanstack/react-query'
import { scanDatabase } from '../api/scanner'

/**
 * Wraps `scanDatabase()` from the Step 3 API layer in a TanStack Query
 * mutation. No fetch logic lives here — this hook only manages
 * loading/error/success state around the existing API function.
 */
export function useScan() {
  return useMutation({
    mutationFn: scanDatabase,
  })
}
