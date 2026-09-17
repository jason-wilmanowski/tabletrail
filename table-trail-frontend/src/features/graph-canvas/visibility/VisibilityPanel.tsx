import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useGraphVisibilityStore } from '../../../store/graphVisibilityStore'
import { GRAPH_VISIBILITY_TOGGLES } from './visibilityToggles'

/**
 * Small floating trigger for the graph's visibility settings — same
 * absolute-overlay pattern, panel behavior (inline, not modal, canvas
 * stays interactive underneath) and trigger styling as
 * `ColumnRelationsPanel`, stacked directly below it. Position is a fixed
 * pixel offset rather than a shared flex wrapper (`top-3` + that icon's
 * `h-8` + this list's `gap-2` = 52px) so this component stays a
 * self-contained sibling, same as `ColumnRelationsPanel` itself.
 */
export function VisibilityPanel() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const hiddenLayerIds = useGraphVisibilityStore((state) => state.hiddenLayerIds)
  const toggleLayer = useGraphVisibilityStore((state) => state.toggleLayer)

  const hiddenCount = hiddenLayerIds.size

  return (
    <div className="absolute right-3 top-[52px] z-30 flex flex-col items-end gap-2">
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
        className={`relative h-4 w-7 shrink-0 rounded-full border transition-colors ${
          isOn ? 'border-accent bg-accent' : 'border-border bg-surface'
        }`}
      >
        <span
          className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-panel transition-transform ${
            isOn ? 'translate-x-[14px]' : 'translate-x-[2px]'
          }`}
        />
      </button>
    </div>
  )
}
