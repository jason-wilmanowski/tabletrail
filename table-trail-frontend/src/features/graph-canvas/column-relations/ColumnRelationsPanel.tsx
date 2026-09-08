import { useState } from 'react'
import { Route, X } from 'lucide-react'
import { useColumnRelationStore } from '../../../store/columnRelationStore'

/**
 * Small floating trigger, top-right of the canvas (outside React Flow's
 * own pane, same absolute-overlay pattern as `TableInspectorPanel`), that
 * opens an inline panel for manually-drawn column relations.
 *
 * Deliberately not a modal: the panel is a plain absolutely-positioned
 * sibling of `<ReactFlow>`, so it never intercepts pan/zoom/node clicks
 * on the canvas underneath it, and stays open while the user keeps
 * interacting with the graph.
 */
export function ColumnRelationsPanel() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const isEditMode = useColumnRelationStore((state) => state.isEditMode)
  const pendingColumn = useColumnRelationStore((state) => state.pendingColumn)
  const toggleEditMode = useColumnRelationStore((state) => state.toggleEditMode)

  return (
    <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setIsPanelOpen((prev) => !prev)}
        className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
          isEditMode
            ? 'border-accent bg-accent text-accent-foreground'
            : 'border-border bg-panel text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Custom-Relationen"
      >
        <Route className="h-4 w-4" />
      </button>

      {isPanelOpen && (
        <div className="w-56 rounded-md border border-border bg-panel p-2.5 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-label">Custom-Relationen</span>
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Panel schließen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleEditMode}
            className={`w-full rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
              isEditMode
                ? 'border-accent bg-accent text-accent-foreground'
                : 'border-border bg-surface text-foreground hover:bg-surface-hover'
            }`}
          >
            Relation ziehen{isEditMode ? ' (aktiv)' : ''}
          </button>

          {isEditMode && (
            <p className="mt-2 text-body">
              {pendingColumn ? 'Zweite Spalte auswählen …' : 'Erste Spalte auswählen.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
