const ELLIPSIS = '…'

/**
 * Finds the longest prefix of `text` (plus a trailing "…") that still
 * satisfies `fits`, via binary search over prefix length — O(log n)
 * calls to `fits` instead of trying every length one by one.
 *
 * `fits` is injected rather than baked in so this search stays a pure,
 * DOM-free function: the caller decides what "fits" means (e.g. "renders
 * within two lines at a given pixel width"), which is what makes this
 * unit-testable without a real layout engine — see `textClamp.test.ts`.
 */
export function truncateWithEllipsis(text: string, fits: (candidate: string) => boolean): string {
  if (fits(text)) {
    return text
  }

  let low = 0
  let high = text.length
  let best = ELLIPSIS

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const candidate = `${text.slice(0, mid).trimEnd()}${ELLIPSIS}`
    if (fits(candidate)) {
      best = candidate
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return best
}
