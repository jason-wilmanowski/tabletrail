import { useMutation } from '@tanstack/react-query'
import { exportDatabase } from '../api/export'
import type { ExportFormat } from '../types/common'

/**
 * Wraps `exportDatabase()`. The download itself is a client-only side
 * effect (no server state to cache/invalidate), so triggering the browser
 * save via a temporary anchor element lives in `onSuccess` here rather
 * than in the component.
 */
export function useExportDatabase(databaseId: number) {
  return useMutation({
    mutationFn: (exportType: ExportFormat) => exportDatabase(databaseId, exportType),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    },
  })
}
