import { useEffect, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useViewport } from '@xyflow/react'
import type { Edge, EdgeProps } from '@xyflow/react'
import { Eye, EyeOff, Trash2, X } from 'lucide-react'
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
 * relation's own color, plus a fixed-size note window (like
 * `RelationEdge`'s ON DELETE/ON UPDATE label) whenever a description is
 * set and its visibility hasn't been toggled off, so the two never look
 * alike at a glance.
 *
 * Clicking the edge (wired via `onEdgeClick` in `GraphCanvas`) opens a
 * small inline popover at the edge midpoint via `EdgeLabelRenderer` —
 * never a modal, so the rest of the graph stays interactive. The popover
 * is always editable (color swatches + note field): earlier this was
 * gated behind the global "Relation ziehen" edit mode, which meant a
 * relation became edit-only-at-creation-time and permanently
 * read-only+deletable after a page reload (edit mode always starts
 * off). Editing an existing relation has nothing to do with drawing new
 * ones, so it's no longer tied to that toggle.
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
  // Selecting the derived boolean directly (not the raw `activePopoverId`,
  // compared afterwards) — same reasoning as `TableNode`'s `isSelected`:
  // every relation edge subscribes to this store independently, so an
  // unaffected edge's selector output stays the same across an update and
  // zustand skips re-rendering it, instead of every edge re-rendering
  // whenever any popover opens/closes anywhere on the canvas.
  const isPopoverOpen = useColumnRelationStore((state) => state.activePopoverId === id)
  const setActivePopover = useColumnRelationStore((state) => state.setActivePopover)
  const requestUpdate = useColumnRelationStore((state) => state.requestUpdate)
  const requestDelete = useColumnRelationStore((state) => state.requestDelete)
  const isNoteHidden = useColumnRelationStore((state) => state.hiddenNoteIds.has(Number(id)))
  const toggleNoteVisibility = useColumnRelationStore((state) => state.toggleNoteVisibility)

  const activeColor = data?.color ?? 'green'
  const description = data?.description ?? null

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
      // Always send the raw string, including "" — the backend's update
      // endpoint drops `None` fields entirely (`exclude_none=True`) and
      // rejects an update where every field ends up `None` ("No update
      // data provided"), so sending `null` here can never actually clear
      // an existing note. An empty string is a real, sent value that
      // does clear it.
      requestUpdate(relationId, { description: descriptionDraft })
    }
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{ stroke: strokeColor, strokeWidth: 1.5, strokeDasharray: '6 4' }}
      />

      <EdgeLabelRenderer>
        {description && !isNoteHidden && !isPopoverOpen && (
          <ColumnRelationNote labelX={labelX} labelY={labelY} description={description} />
        )}

        {isPopoverOpen && (
          <ColumnRelationPopover
            labelX={labelX}
            labelY={labelY}
            activeColor={activeColor}
            isNoteHidden={isNoteHidden}
            descriptionDraft={descriptionDraft}
            onDescriptionDraftChange={setDescriptionDraft}
            onDescriptionCommit={commitDescription}
            onToggleNoteVisibility={() => toggleNoteVisibility(relationId)}
            onDelete={() => {
              requestDelete(relationId)
              setActivePopover(null)
            }}
            onClose={() => setActivePopover(null)}
            onColorSelect={(color) => requestUpdate(relationId, { color })}
          />
        )}
      </EdgeLabelRenderer>
    </>
  )
}

/**
 * `EdgeLabelRenderer` content lives inside React Flow's own pan/zoom
 * transform, so a plain fixed-width overlay would shrink/grow with the
 * canvas zoom. Countering the ancestor's `scale(zoom)` with `scale(1/zoom)`
 * (the same technique React Flow's own zoom-independent overlays use)
 * keeps it a constant, always-legible size regardless of zoom level.
 *
 * `useViewport()` re-renders its subscriber on every pan/zoom tick, so
 * this is split out from `ColumnRelationEdge` into its own component that
 * only mounts (and therefore only subscribes) while a note is actually
 * visible for this edge — with many column relations on a large graph,
 * most edges show no note at any given time, and previously all of them
 * still re-rendered on every zoom/pan frame regardless.
 */
function ColumnRelationNote({
  labelX,
  labelY,
  description,
}: {
  labelX: number
  labelY: number
  description: string
}) {
  const { zoom } = useViewport()

  return (
    // Fixed at the max width (not shrink-to-fit): a shrink-to-fit width
    // paired with `line-clamp`'s `display: -webkit-box` does not reliably
    // re-clamp to `max-width` once text wraps onto a second line (observed
    // overflowing past it in Chrome) — a definite `w-[8.4rem]` sidesteps
    // that entirely, and is what makes `line-clamp-2` correctly cap the
    // text at two lines with a trailing "…" once it doesn't fit.
    // `translate(-50%, -50%)` then centers this fixed, predictable box on
    // the edge midpoint. Styled to match `RelationEdge`'s ON DELETE/ON
    // UPDATE label (border/padding/type scale) so real and custom
    // relations read as the same kind of annotation on the canvas.
    <div
      className="nodrag nopan text-technical-muted absolute w-[8.4rem] rounded-sm border border-border bg-panel px-1.5 py-0.5 leading-tight"
      style={{
        transform: `translate(${labelX}px, ${labelY}px) scale(${1 / zoom}) translate(-50%, -50%)`,
        pointerEvents: 'none',
      }}
    >
      <div className="line-clamp-2 break-words">{description}</div>
    </div>
  )
}

/** Same `useViewport()`-isolation reasoning as `ColumnRelationNote` above. */
function ColumnRelationPopover({
  labelX,
  labelY,
  activeColor,
  isNoteHidden,
  descriptionDraft,
  onDescriptionDraftChange,
  onDescriptionCommit,
  onToggleNoteVisibility,
  onDelete,
  onClose,
  onColorSelect,
}: {
  labelX: number
  labelY: number
  activeColor: ColumnRelationColor
  isNoteHidden: boolean
  descriptionDraft: string
  onDescriptionDraftChange: (value: string) => void
  onDescriptionCommit: () => void
  onToggleNoteVisibility: () => void
  onDelete: () => void
  onClose: () => void
  onColorSelect: (color: ColumnRelationColor) => void
}) {
  const { zoom } = useViewport()

  return (
    <div
      // Stops clicks anywhere in the popover (swatches, textarea,
      // close/delete buttons) from bubbling up to React Flow's Pane, whose
      // own click handler would otherwise fire right after and
      // immediately clear this popover.
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
            onClick={onToggleNoteVisibility}
            className="text-muted-foreground hover:text-foreground"
            aria-label={isNoteHidden ? 'Notiz einblenden' : 'Notiz ausblenden'}
            aria-pressed={!isNoteHidden}
          >
            {isNoteHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-muted-foreground hover:text-danger"
            aria-label="Relation löschen"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Schließen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-1.5">
        {COLUMN_RELATION_COLOR_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            aria-label={option}
            onClick={() => onColorSelect(option)}
            className={`h-4 w-4 rounded-full border transition-transform ${
              activeColor === option ? 'scale-110 border-foreground' : 'border-border'
            }`}
            style={{ backgroundColor: COLUMN_RELATION_COLORS[option] }}
          />
        ))}
      </div>
      <textarea
        value={descriptionDraft}
        onChange={(event) => onDescriptionDraftChange(event.target.value)}
        onBlur={onDescriptionCommit}
        placeholder="Notiz (optional)"
        rows={2}
        className={TEXTAREA_CLASSES}
      />
    </div>
  )
}
