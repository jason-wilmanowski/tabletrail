/**
 * Persists manually-dragged node positions per database to `localStorage`,
 * so a user's custom graph layout survives closing and reopening the same
 * database. Purely client-side — no backend involvement.
 */

export interface SavedPosition {
  x: number
  y: number
}

export type SavedLayout = Record<string, SavedPosition>

function storageKey(databaseId: number): string {
  return `tabletrail:layout:${databaseId}`
}

/**
 * Reads the saved layout for a database. Returns an empty object (never
 * throws) if `localStorage` is unavailable, nothing has been saved yet, or
 * the stored value isn't valid JSON — callers can treat a missing entry for
 * a given table id as "no saved position, fall back to Dagre".
 */
export function getSavedLayout(databaseId: number): SavedLayout {
  try {
    const raw = localStorage.getItem(storageKey(databaseId))
    if (!raw) {
      return {}
    }

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return {}
    }

    return parsed as SavedLayout
  } catch {
    return {}
  }
}

/**
 * Writes the current node positions for a database back to `localStorage`.
 * Silently no-ops on failure (e.g. private-browsing storage restrictions or
 * quota errors) rather than crashing the app.
 */
export function saveLayout(databaseId: number, positions: SavedLayout): void {
  try {
    localStorage.setItem(storageKey(databaseId), JSON.stringify(positions))
  } catch {
    // localStorage unavailable — the graph still works, just without persistence.
  }
}
