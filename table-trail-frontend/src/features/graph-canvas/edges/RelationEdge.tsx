import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useInternalNode } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import type { RelationEdgeType } from '../../../utils/constraintsToEdges'
import { getFloatingEdgeParams } from '../../../utils/floatingEdgeGeometry'

/**
 * Custom edge representing a Foreign-Key relation between two tables.
 *
 * Step 18 added the base line. Step 19 adds an optional label showing
 * `on_delete`/`on_update` rules — only rendered when at least one of them
 * is present, via `EdgeLabelRenderer` so it stays correctly positioned
 * and scaled during zoom/pan (React Flow owns that transform, no manual
 * absolute positioning here).
 *
 * Still rendering only — `on_delete`/`on_update` arrive pre-resolved in
 * `data` from `constraintsToEdges()`, nothing is analyzed or derived here.
 *
 * Styled as a small technical annotation (monospace, muted, thin border)
 * rather than a diagram badge, per the design constraints — the relation
 * line itself stays the primary piece of information.
 *
 * Step 30 switches the label to the shared `.text-technical-muted` class
 * instead of a one-off `text-[9px]` — that size was smaller than the
 * 10px floor established everywhere else once the typography system
 * existed, which the accessibility requirements for this step flag as a
 * concern ("keine zu kleinen technischen Texte").
 *
 * `data.offsetX`/`data.offsetY` (graph coordinate px, default 0) apply on
 * top of the computed `labelX`/`labelY` the same way `ColumnRelationEdge`'s
 * note applies its own offset — both come out of the same collision pass
 * in `GraphCanvas` (`utils/collisionOffset.ts`) run over FK labels and
 * custom-relation notes together, so this label never overlaps another FK
 * label *or* a custom-relation note, not just other FK labels.
 */
export function RelationEdge({
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<RelationEdgeType>) {
  // Table-to-table, so all four sides are candidates: this recomputes
  // source/target anchor + side from the tables' actual rectangles (React
  // Flow's documented "Floating Edges" technique — see
  // `utils/floatingEdgeGeometry.ts`) instead of the fixed Top/Bottom pair
  // `TableNode`'s "table" handle declares, which forced every FK line into
  // a vertical exit/entry even when the two tables end up side by side
  // (dragged, or laid out on the same Dagre rank). Falls back to the
  // handle-resolved props for the one frame before both nodes have been
  // measured (`sourceNode`/`targetNode` briefly undefined on mount).
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)
  const floating =
    sourceNode && targetNode
      ? getFloatingEdgeParams(
          {
            x: sourceNode.internals.positionAbsolute.x,
            y: sourceNode.internals.positionAbsolute.y,
            width: sourceNode.measured.width ?? 0,
            height: sourceNode.measured.height ?? 0,
          },
          {
            x: targetNode.internals.positionAbsolute.x,
            y: targetNode.internals.positionAbsolute.y,
            width: targetNode.measured.width ?? 0,
            height: targetNode.measured.height ?? 0,
          }
        )
      : null

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: floating?.sourceX ?? sourceX,
    sourceY: floating?.sourceY ?? sourceY,
    sourcePosition: floating?.sourcePosition ?? sourcePosition,
    targetX: floating?.targetX ?? targetX,
    targetY: floating?.targetY ?? targetY,
    targetPosition: floating?.targetPosition ?? targetPosition,
  })

  const labelLines = [
    data?.onDelete ? `ON DELETE ${data.onDelete}` : null,
    data?.onUpdate ? `ON UPDATE ${data.onUpdate}` : null,
  ].filter((line): line is string => line !== null)

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: 'hsl(var(--border))', strokeWidth: 1.25 }}
      />

      {labelLines.length > 0 && (
        <EdgeLabelRenderer>
          <div
            className="text-technical-muted nodrag nopan absolute rounded-sm border border-border bg-panel px-1.5 py-0.5 leading-tight"
            style={{
              transform: `translate(${labelX + (data?.offsetX ?? 0)}px, ${labelY + (data?.offsetY ?? 0)}px) translate(-50%, -50%)`,
            }}
          >
            {labelLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}