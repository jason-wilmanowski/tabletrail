import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useGraphVisibilityStore } from '../../../store/graphVisibilityStore'
import { GRAPH_VISIBILITY_TOGGLES } from './visibilityToggles'

/**
 * Small floating trigger for the graph's visibility settings — same
 * panel behavior (inline, not modal, canvas stays interactive underneath)
 * and trigger styling as `ColumnRelationsPanel`, stacked directly below it
 * inside `GraphCanvas`'s shared `flex flex-col` overlay. Not absolutely
 * positioned itself, and no hardcoded pixel offset, for the same reason
 * documented on `ColumnRelationsPanel`: normal flex flow is what lets this
 * component get pushed down when the panel above it opens, instead of a
 * fixed offset that only accounted for the trigger button's own height.
 */
export function VisibilityPanel() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const hiddenLayerIds = useGraphVisibilityStore((state) => state.hiddenLayerIds)
  const toggleLayer = useGraphVisibilityStore((state) => state.toggleLayer)

  const hiddenCount = hiddenLayerIds.size

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setIsPanelOpen((prev) => !prev)}
        className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
          hiddenCount > 0
            ? 'border-accent bg-accent text-accent-foreground'
            : 'border-border bg-panel text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Sichtbarkeits-Einstellungen"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>

      {isPanelOpen && (
        <div className="w-56 rounded-md border border-border bg-panel p-2.5 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-label">Sichtbarkeit</span>
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Panel schließen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {GRAPH_VISIBILITY_TOGGLES.map((toggle) => (
              <VisibilityToggleRow
                key={toggle.id}
                label={toggle.label}
                isOn={!hiddenLayerIds.has(toggle.id)}
                onToggle={() => toggleLayer(toggle.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Knob is explicitly anchored at `left-[2px]` and only ever moves via
 * `translate-x` from that fixed anchor — the previous version set no
 * `left`/`right` at all and relied on the browser's "auto" static-position
 * fallback for an absolutely-positioned span, which is exactly what put
 * the knob outside the track. Same knob size in both states (no more
 * shrinking off/growing on) so the anchor math is a single fixed offset
 * pair, not something that shifts with the knob's own size.
 *
 * Off: unfilled track (`bg-surface`), knob at the left anchor in
 * `muted-foreground` — distinctly lighter than the `panel`-colored knob
 * this used before, which sat only ~3% lightness apart from the
 * `surface` track and was nearly invisible.
 *
 * On: track fills with `accent` (the app's one muted slate-blue accent —
 * used for every other selection/active state), knob slides right to sit
 * inside the track (not past its edge) and turns `accent-foreground`
 * (white) for contrast, track fill and knob slide animating together.
 */
function VisibilityToggleRow({
  label,
  isOn,
  onToggle,
}: {
  label: string
  isOn: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-body">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        onClick={onToggle}
        className={`relative h-4 w-7 shrink-0 rounded-full border transition-colors duration-200 ${
          isOn ? 'border-accent bg-accent' : 'border-border bg-surface'
        }`}
      >
        <span
          className={`absolute left-[2px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-all duration-200 ease-out ${
            isOn ? 'translate-x-[12px] bg-accent-foreground' : 'translate-x-0 bg-muted-foreground'
          }`}
        />
      </button>
    </div>
  )
}
