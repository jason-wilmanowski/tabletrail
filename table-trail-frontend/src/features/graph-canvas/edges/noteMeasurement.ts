/**
 * Classes mirroring the real note box's font/box-model (padding, border,
 * line-height, word-break) — not its color/position/background, which
 * don't affect layout metrics. Kept in sync with the classes actually
 * used on the rendered note in `ColumnRelationEdge.tsx`.
 */
const MEASURER_CLASSES = 'text-technical-muted-lg border px-1.5 py-0.5 leading-tight break-words'

let measurerEl: HTMLDivElement | null = null

/**
 * A single hidden, off-screen, reused measuring element rather than one
 * per note — with many column relations on a large graph, this keeps
 * DOM-measurement cost bounded to "one shared node measured a few times",
 * not "one node per visible relation".
 */
function getMeasurer(): HTMLDivElement {
  if (measurerEl) {
    return measurerEl
  }
  const el = document.createElement('div')
  el.className = MEASURER_CLASSES
  el.style.position = 'fixed'
  el.style.visibility = 'hidden'
  el.style.pointerEvents = 'none'
  el.style.top = '-9999px'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  measurerEl = el
  return el
}

/** The width the text would take up laid out on a single, unwrapped line. */
export function measureNaturalWidth(text: string): number {
  const el = getMeasurer()
  el.style.whiteSpace = 'nowrap'
  el.style.width = 'max-content'
  el.textContent = text
  return el.getBoundingClientRect().width
}

/**
 * Whether `text`, wrapped normally at `maxWidthPx`, renders within
 * `maxLines` lines — measured via the real layout engine (actual
 * wrapping/break behavior for whatever font is actually resolved),
 * rather than an approximated character/word-width calculation in JS.
 */
export function fitsWithinLines(text: string, maxWidthPx: number, maxLines: number): boolean {
  const el = getMeasurer()
  el.style.whiteSpace = 'normal'
  el.style.width = `${maxWidthPx}px`
  el.textContent = text
  const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight)
  // +1px guards against sub-pixel rounding making an exact 2-line fit
  // register as a hair over the threshold.
  return el.scrollHeight <= lineHeight * maxLines + 1
}
