import { useEffect, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position, useInternalNode, useViewport } from '@xyflow/react'
import type { Edge, EdgeProps } from '@xyflow/react'
import { Eye, EyeOff, Trash2, X } from 'lucide-react'
import { useColumnRelationStore } from '../../../store/columnRelationStore'
import type { ColumnRelationColor } from '../../../types/columnRelation'
import { COLUMN_RELATION_COLORS, COLUMN_RELATION_COLOR_OPTIONS } from '../column-relations/relationColors'
import { pickHorizontalSide } from '../../../utils/floatingEdgeGeometry'
import { useClampedNoteText } from './useClampedNoteText'

const TEXTAREA_CLASSES =
  'w-full resize-none rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Reference size: roughly the width of `RelationEdge`'s FK "ON DELETE
 * .../ON UPDATE ..." label, so custom-relation notes stay the same order
 * of magnitude of annotation on the canvas — not a noticeably bigger box,
 * even though the note text itself renders ~15% larger (see
 * `.text-technical-muted-lg`) so custom relations stand out over FK ones.
 */
const NOTE_MAX_WIDTH_REM = 8.4
const NOTE_MAX_WIDTH_PX = NOTE_MAX_WIDTH_REM * 16

export interface ColumnRelationEdgeData extends Record<string, unknown> {
  color: ColumnRelationColor
  description: string | null
  /**
   * Small nudge (graph coordinate px) away from the relation's true
   * midpoint, set by `GraphCanvas` when this note's midpoint lands too
   * close to another currently-visible note's — see
   * `utils/collisionOffset.ts`. Absent (or zero) for the common case of
   * no nearby collision, in which case the note sits exactly centered.
   */
  offsetX?: number
  offsetY?: number
}

export type ColumnRelationEdgeType = Edge<ColumnRelationEdgeData, 'columnRelation'>

/**
 * Custom edge for manually-drawn, column-to-column relations — distinct
 * from real FK relations (`RelationEdge.tsx`): dashed stroke in the
 * relation's own color, plus a note window (like `RelationEdge`'s ON
 * DELETE/ON UPDATE label, sized to content up to the same order of
 * magnitude — see `ColumnRelationNote`) whenever a description is set and
 * its visibility hasn't been toggled off, so the two never look alike at
 * a glance.
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
  source,
  target,
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

  // A column's anchor Y is fixed by its row inside the table — `sourceY`/
  // `targetY` as resolved by React Flow from the column's handle are
  // already correct regardless of which side is picked (the Left and
  // Right handles for the same column sit on the same row). Only the
  // horizontal side is recomputed here, from the two tables' actual
  // positions (`pickHorizontalSide`, same floating-edge technique as
  // `RelationEdge`) — otherwise a relation always exits its source
  // column's fixed Right handle and enters the target's fixed Left one,
  // which sends the line the long way around whenever the target table
  // is actually to the *left* of the source.
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  const horizontalSides =
    sourceNode && targetNode
      ? pickHorizontalSide(
          sourceNode.internals.positionAbsolute.x + (sourceNode.measured.width ?? 0) / 2,
          targetNode.internals.positionAbsolute.x + (targetNode.measured.width ?? 0) / 2
        )
      : null

  // A handle's X sits at its node's left boundary (Position.Left) or right
  // boundary (Position.Right) — recompute whichever boundary the picked
  // side now points at, since the node only ever registers a source handle
  // on the right and a target handle on the left (see TableNode.tsx).
  const resolvedSourceX =
    horizontalSides && sourceNode
      ? sourceNode.internals.positionAbsolute.x +
        (horizontalSides.sourcePosition === Position.Right ? (sourceNode.measured.width ?? 0) : 0)
      : sourceX
  const resolvedTargetX =
    horizontalSides && targetNode
      ? targetNode.internals.positionAbsolute.x +
        (horizontalSides.targetPosition === Position.Right ? (targetNode.measured.width ?? 0) : 0)
      : targetX

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: resolvedSourceX,
    sourceY,
    sourcePosition: horizontalSides?.sourcePosition ?? sourcePosition,
    targetX: resolvedTargetX,
    targetY,
    targetPosition: horizontalSides?.targetPosition ?? targetPosition,
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
          <ColumnRelationNote
            labelX={labelX + (data?.offsetX ?? 0)}
            labelY={labelY + (data?.offsetY ?? 0)}
            description={description}
          />
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
 * Unlike `ColumnRelationPopover` below, this note deliberately does
 * *not* counter-scale against zoom (no `useViewport()`/`scale(1/zoom)`)
 * — it lives inside `EdgeLabelRenderer`'s pan/zoom-transformed space with
 * no counter-transform applied, same as `RelationEdge`'s FK label and
 * every table node, so it grows/shrinks with the rest of the canvas on
 * zoom instead of staying a fixed screen size while everything around it
 * scales. `NOTE_MAX_WIDTH_PX` is a fixed size in that same graph
 * coordinate space, so it doesn't grow unbounded on zoom-in either — it
 * just becomes visually larger together with the rest of the canvas, the
 * same way a table node does.
 *
 * Width: `shrinkToFit` sizes the box to short text instead of always
 * reserving the full max width (see `useClampedNoteText`); text longer
 * than that gets pre-truncated with an ellipsis by the same hook, via
 * real DOM measurement rather than CSS `-webkit-line-clamp` (which
 * turned out unreliable here — see that hook's docstring).
 *
 * Text sized via `.text-technical-muted-lg` (~15% larger than
 * `RelationEdge`'s FK label) so custom notes read as the more prominent
 * annotation on the canvas — `noteMeasurement.ts`'s measurer mirrors this
 * class so wrap/truncation math stays accurate for the actual rendered size.
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
  const { text, shrinkToFit } = useClampedNoteText(description, NOTE_MAX_WIDTH_PX)

  return (
    // Styled to match RelationEdge's ON DELETE/ON UPDATE label
    // (border/padding/type scale) so real and custom relations read as
    // the same kind of annotation on the canvas.
    <div
      className="nodrag nopan text-technical-muted-lg absolute rounded-sm border border-border bg-panel px-1.5 py-0.5 leading-tight break-words"
      style={{
        width: shrinkToFit ? 'fit-content' : `${NOTE_MAX_WIDTH_REM}rem`,
        maxWidth: `${NOTE_MAX_WIDTH_REM}rem`,
        transform: `translate(${labelX}px, ${labelY}px) translate(-50%, -50%)`,
        pointerEvents: 'none',
      }}
    >
      {text}
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
