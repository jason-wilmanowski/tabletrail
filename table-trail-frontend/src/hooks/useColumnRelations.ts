import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getColumnRelations,
  createColumnRelation,
  updateColumnRelation,
  deleteColumnRelation,
} from '../api/columnRelations'
import type { CreateColumnRelationRequest, UpdateColumnRelationRequest } from '../api/columnRelations'
import type { ColumnRelationResponse } from '../types/columnRelation'

/** GET /column-relation/{db_id} — custom relations for the graph currently shown. */
export function useColumnRelations(databaseId: number) {
  return useQuery<ColumnRelationResponse[]>({
    queryKey: ['columnRelations', databaseId],
    queryFn: () => getColumnRelations(databaseId),
    enabled: Boolean(databaseId),
  })
}

/**
 * Wraps `createColumnRelation`. On success, appends the returned relation
 * (with its real numeric `id`) straight into the `['columnRelations', databaseId]`
 * cache so the new edge renders immediately without a refetch.
 */
export function useCreateColumnRelation(databaseId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateColumnRelationRequest) => createColumnRelation(databaseId, data),
    onSuccess: (created) => {
      queryClient.setQueryData<ColumnRelationResponse[]>(['columnRelations', databaseId], (old) =>
        old ? [...old, created] : [created]
      )
    },
  })
}

/** Wraps `updateColumnRelation`. On success, replaces the matching entry in the cache. */
export function useUpdateColumnRelation(databaseId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateColumnRelationRequest }) =>
      updateColumnRelation(databaseId, id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<ColumnRelationResponse[]>(['columnRelations', databaseId], (old) =>
        old?.map((relation) => (relation.id === updated.id ? updated : relation))
      )
    },
  })
}

/** Wraps `deleteColumnRelation`. On success, drops the matching entry from the cache. */
export function useDeleteColumnRelation(databaseId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteColumnRelation(databaseId, id),
    onSuccess: (_response, id) => {
      queryClient.setQueryData<ColumnRelationResponse[]>(['columnRelations', databaseId], (old) =>
        old?.filter((relation) => relation.id !== id)
      )
    },
  })
}
