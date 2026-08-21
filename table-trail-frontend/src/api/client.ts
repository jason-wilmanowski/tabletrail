const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

/**
 * Thrown for any non-2xx response. Carries the HTTP status so callers
 * (later: TanStack Query hooks, UI error states) can branch on it if needed.
 */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
}

/**
 * FastAPI's HTTPException returns `{ "detail": string }` for the
 * ScanningSystemError / DatabaseSystemError style errors used throughout
 * this backend. For request
 * validation errors (e.g. a malformed path param), FastAPI instead returns
 * `{ "detail": [{ msg: string, ... }, ...] }` — both shapes are handled here.
 */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    const detail = (data as { detail?: unknown } | null)?.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (Array.isArray(detail)) {
      return detail
        .map((entry) => (entry as { msg?: string })?.msg ?? JSON.stringify(entry))
        .join(', ')
    }

    return response.statusText
  } catch {
    return response.statusText
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Auth header can be added here once auth exists — single place to extend.
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const message = await extractErrorMessage(response)
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

/**
 * Central HTTP client used by all API modules (databases.ts, scanner.ts,
 * search.ts). No UI dependencies — safe to import from hooks or plain
 * TypeScript modules alike.
 */
export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
}
