/**
 * Timing for "focus a table, then flash one of its columns" — shared by
 * the store (which clears the highlight), `GraphCanvas` (which animates
 * the viewport) and `TableNode` (which plays the highlight animation), so
 * the three can't drift apart.
 */

/** How long the viewport animation to a selected table takes. */
export const FOCUS_ZOOM_DURATION_MS = 400

/** How long a highlighted column stays visibly highlighted. */
export const COLUMN_HIGHLIGHT_DURATION_MS = 2000

/**
 * The highlight starts once the zoom has landed, so the user actually
 * sees it play instead of it running out mid-pan.
 */
export const COLUMN_HIGHLIGHT_DELAY_MS = FOCUS_ZOOM_DURATION_MS
