import { useLayoutEffect, useState } from 'react'
import { truncateWithEllipsis } from '../../../utils/textClamp'
import { fitsWithinLines, measureNaturalWidth } from './noteMeasurement'

const MAX_LINES = 2

export interface ClampedNote {
  /** The text to actually render — unchanged, or truncated with a trailing "…". */
  text: string
  /**
   * Whether the box should size to its own (short) content (`true`) or
   * sit at the fixed max width because it needs to wrap (`false`).
   */
  shrinkToFit: boolean
}

/**
 * Decides how a column-relation note should render at `maxWidthPx`:
 * short text gets a box sized to just that text, longer text wraps
 * across up to two lines at the fixed max width, and only once two full
 * lines still aren't enough does the text get truncated with a trailing
 * "…".
 *
 * This used to be attempted with pure CSS (`width: fit-content` capped
 * by `max-width`, combined with `-webkit-line-clamp: 2` for the 2-line
 * ellipsis) — that combination turned out unreliable in Chrome (the
 * shrink-to-fit width calculation doesn't reliably respect `max-width`
 * once `-webkit-line-clamp` is involved, so long notes could render
 * wider than intended). Measuring against the real DOM layout here
 * instead sidesteps that Chrome-specific quirk entirely, at the cost of
 * a one-time (not per-render) layout measurement whenever the note text
 * actually changes.
 *
 * `useLayoutEffect` (not `useEffect`) so the correction happens before
 * paint — the initial, unmeasured guess (full text, shrink-to-fit) is
 * never actually visible to the user.
 */
export function useClampedNoteText(text: string, maxWidthPx: number): ClampedNote {
  const [result, setResult] = useState<ClampedNote>(() => ({ text, shrinkToFit: true }))

  useLayoutEffect(() => {
    if (measureNaturalWidth(text) <= maxWidthPx) {
      setResult({ text, shrinkToFit: true })
      return
    }

    if (fitsWithinLines(text, maxWidthPx, MAX_LINES)) {
      setResult({ text, shrinkToFit: false })
      return
    }

    setResult({
      text: truncateWithEllipsis(text, (candidate) => fitsWithinLines(candidate, maxWidthPx, MAX_LINES)),
      shrinkToFit: false,
    })
  }, [text, maxWidthPx])

  return result
}
