import { apiClient } from './client'
import type { SearchResponse } from '../types/database'

/**
 * GET /database/{db_id}/search?q=
 * Confirmed from actual endpoint code: `q` is a required query param
 * (not optional on the backend), so `query` is required here too.
 */
export function searchDatabase(id: number, query: string): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query })
  return apiClient.get<SearchResponse>(`/database/${id}/search?${params.toString()}`)
}
