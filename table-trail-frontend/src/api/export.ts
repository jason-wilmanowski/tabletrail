import { ApiError, BASE_URL, extractErrorMessage } from './client'
import type { ExportFormat } from '../types/common'

export interface ExportResult {
  blob: Blob
  filename: string
}

/**
 * POST /export
 *
 * Returns the raw exported file as a `Blob`, not JSON, so this bypasses
 * `apiClient` (which always parses the response body as JSON). The
 * filename comes from the backend's `Content-Disposition` response header
 * (`api/export.py`) — reading it cross-origin requires the backend to list
 * it in `CORSMiddleware(expose_headers=...)`, which is set in `main.py`.
 */
export async function exportDatabase(
  databaseId: number,
  exportType: ExportFormat
): Promise<ExportResult> {
  const response = await fetch(`${BASE_URL}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ database_id: databaseId, export_type: exportType }),
  })

  if (!response.ok) {
    const message = await extractErrorMessage(response)
    throw new ApiError(response.status, message)
  }

  const blob = await response.blob()
  const filename = parseFilename(response.headers.get('Content-Disposition')) ?? `export.${exportType}`

  return { blob, filename }
}

/**
 * Backend sends both an ASCII `filename=` fallback and an RFC 5987
 * `filename*=UTF-8''...` value (see `api/export.py::_content_disposition`)
 * — prefer the UTF-8 one since it survives non-ASCII database names.
 */
function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match) {
    return decodeURIComponent(utf8Match[1])
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return asciiMatch ? asciiMatch[1] : null
}
