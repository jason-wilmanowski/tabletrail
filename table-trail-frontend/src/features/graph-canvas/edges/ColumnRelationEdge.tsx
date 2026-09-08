import { useEffect, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useViewport } from '@xyflow/react'
import type { Edge, EdgeProps } from '@xyflow/react'
import { StickyNote, Trash2, X } from 'lucide-react'
import { useColumnRelationStore } from '../../../store/columnRelationStore'
import type { ColumnRelationColor } from '../../../types/columnRelation'
import { COLUMN_RELATION_COLORS, COLUMN_RELATION_COLOR_OPTIONS } from '../column-relations/relationColors'

const TEXTAREA_CLASSES =
  'w-full resize-none rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export interface ColumnRelationEdgeData extends Record<string, unknown> {
  color: ColumnRelationColor
  description: string | null
}

export type ColumnRelationEdgeType = Edge<ColumnRelationEdgeData, 'columnRelation'>

/**
 * Custom edge for manually-drawn, column-to-column relations — distinct
 * from real FK relations (`RelationEdge.tsx`): dashed stroke in the
 * relation's own color, plus a small note icon whenever a description is
 * set, so the two never look alike at a glance.
 *
 * Clicking the edge (wired via `onEdgeClick` in `GraphCanvas`) opens a
 * small inline popover at the edge midpoint via `EdgeLabelRenderer` —
 * never a modal, so the rest of the graph stays interactive. It's
 * editable (color swatches + note field) right after the relation is
 * drawn or whenever edit mode is active, and read-only otherwise.
 *
 * This edge's `id` is always the relation's real, numeric backend id
 * (as a string) — `requestUpdate`/`requestDelete` just record the intent
 * in `columnRelationStore`; `GraphCanvas` owns the actual PUT/DELETE
 * call since it's the one holding `databaseId` and the mutation hooks.
 */
export function ColumnRelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<ColumnRelationEdgeType>) {
  const isEditMode = useColumnRelationStore((state) => state.isEditMode)
  const activePopoverId = useColumnRelationStore((state) => state.activePopoverId)
  const setActivePopover = useColumnRelationStore((state) => state.setActivePopover)
  const requestUpdate = useColumnRelationStore((state) => state.requestUpdate)
  const requestDelete = useColumnRelationStore((state) => state.requestDelete)
  // `EdgeLabelRenderer` content lives inside React Flow's own pan/zoom
  // transform, so a plain fixed-width popover would shrink/grow with the
  // canvas zoom. Countering the ancestor's `scale(zoom)` with `scale(1/zoom)`
  // (the same technique React Flow's own zoom-independent overlays use)
  // keeps it a constant, always-legible size regardless of zoom level.
  const { zoom } = useViewport()

  const activeColor = data?.color ?? 'green'
  const description = data?.description ?? null
  const isPopoverOpen = activePopoverId === id

  // Local draft for the note field so a PUT only fires on blur, not on
  // every keystroke. Re-synced from the real value each time the
  // popover opens (not on every `description` change) so a stale value
  // never lingers once reopened, without fighting the user mid-typing.
  const [descriptionDraft, setDescriptionDraft] = useState(description ?? '')
  useEffect(() => {
    if (isPopoverOpen) {
      setDescriptionDraft(description ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopoverOpen])

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const strokeColor = COLUMN_RELATION_COLORS[activeColor]
  const relationId = Number(id)

  const commitDescription = () => {
    if (descriptionDraft !== (description ?? '')) {
      requestUpdate(relationId, { description: descriptionDraft || null })
    }
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{ stroke: strokeColor, strokeWidth: 1.5, strokeDasharray: '6 4' }}
      />

      <EdgeLabelRenderer>
        {description && !isPopoverOpen && (
          <div
            className="nodrag nopan absolute flex h-4 w-4 items-center justify-center rounded-full border border-border bg-panel"
            style={{
              transform: `translate(${labelX}px, ${labelY}px) scale(${1 / zoom}) translate(-50%, -50%)`,
              pointerEvents: 'none',
            }}
          >
            <StickyNote className="h-2.5 w-2.5" style={{ color: strokeColor }} />
          </div>
        )}

        {isPopoverOpen && (
          <div
            // Stops clicks anywhere in the popover (swatches, textarea,
            // close/delete buttons) from bubbling up to React Flow's
            // Pane, whose own click handler would otherwise fire right
            // after and immediately clear this popover.
            onClick={(event) => event.stopPropagation()}
            className="nodrag nopan absolute z-40 w-56 rounded-md border border-border bg-panel p-2.5 shadow-lg"
            style={{
              transform: `translate(${labelX}px, ${labelY}px) scale(${1 / zoom}) translate(-50%, 8px)`,
              pointerEvents: 'auto',
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-label">Relation</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    requestDelete(relationId)
                    setActivePopover(null)
                  }}
                  className="text-muted-foreground hover:text-danger"
                  aria-label="Relation löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePopover(null)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Schließen"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {isEditMode ? (
              <>
                <div className="mb-2 flex items-center gap-1.5">
                  {COLUMN_RELATION_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-label={option}
                      onClick={() => requestUpdate(relationId, { color: option })}
                      className={`h-4 w-4 rounded-full border transition-transform ${
                        activeColor === option ? 'scale-110 border-foreground' : 'border-border'
                      }`}
                      style={{ backgroundColor: COLUMN_RELATION_COLORS[option] }}
                    />
                  ))}
                </div>
                <textarea
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  onBlur={commitDescription}
                  placeholder="Notiz (optional)"
                  rows={2}
                  className={TEXTAREA_CLASSES}
                />
              </>
            ) : (
              <div className="text-body">{description ?? 'Keine Notiz'}</div>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
