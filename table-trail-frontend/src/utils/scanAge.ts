const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * The backend stores timestamps as naive UTC (`TIMESTAMP` without time
 * zone), so they arrive without an offset — and `new Date()` would read
 * such a string as *local* time. An explicit `Z` pins it to UTC; strings
 * that already carry `Z` or `±hh:mm` are left alone.
 */
export function parseBackendTimestamp(value: string): Date {
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/.test(value)
  return new Date(hasOffset ? value : `${value}Z`)
}

/**
 * Full days elapsed since `timestamp` — a database's `updated_at`, which
 * every successful scan bumps. Editing a connection bumps it too, so this
 * is "at most this old", never older than the real scan.
 */
export function getDaysSince(timestamp: string, now: Date = new Date()): number {
  const elapsed = now.getTime() - parseBackendTimestamp(timestamp).getTime()
  return Math.max(0, Math.floor(elapsed / MS_PER_DAY))
}
