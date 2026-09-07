import { apiClient } from './client'
import type { ColumnRelationResponse, ColumnRelationColor } from '../types/columnRelation'

/** Mirrors backend `CreateColumnRelation` schema — `relation_color` is optional, backend defaults to green. */
export interface CreateColumnRelationRequest {
  column_id_1: number
  column_id_2: number
  relation_color?: ColumnRelationColor
  description?: string | null
}

/** Mirrors backend `UpdateColumnRelation` schema — all fields optional. */
export interface UpdateColumnRelationRequest {
  column_id_1?: number
  column_id_2?: number
  relation_color?: ColumnRelationColor
  description?: string | null
}

/** GET /column-relation/{db_id} — all custom relations for a database. */
export function getColumnRelations(databaseId: number): Promise<ColumnRelationResponse[]> {
  return apiClient.get<ColumnRelationResponse[]>(`/column-relation/${databaseId}`)
}

/** POST /column-relation/{db_id} */
export function createColumnRelation(
  databaseId: number,
  data: CreateColumnRelationRequest
): Promise<ColumnRelationResponse> {
  return apiClient.post<ColumnRelationResponse>(`/column-relation/${databaseId}`, data)
}

/** PUT /column-relation/{db_id}/{column_relation_id} — backend uses PUT, not PATCH, for updates. */
export function updateColumnRelation(
  databaseId: number,
  relationId: number,
  data: UpdateColumnRelationRequest
): Promise<ColumnRelationResponse> {
  return apiClient.put<ColumnRelationResponse>(`/column-relation/${databaseId}/${relationId}`, data)
}

/** DELETE /column-relation/{db_id}/{column_relation_id} — backend returns a plain `{ message: string }` dict. */
export function deleteColumnRelation(databaseId: number, relationId: number): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`/column-relation/${databaseId}/${relationId}`)
}
