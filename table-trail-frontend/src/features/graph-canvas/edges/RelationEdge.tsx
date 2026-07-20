import { BaseEdge, getSmoothStepPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'

/**
 * Custom edge representing a Foreign-Key relation between two tables.
 *
 * Step 18 scope: base line only — no label, no on_delete/on_update text,
 * no hover interactions (that's Step 19+). Rendering only, no constraint
 * analysis lives here; `constraintsToEdges()` (src/utils/) already
 * decided which edges exist and what they connect.
 *
 * Deliberately a thin, muted, orthogonal (smoothstep) line rather than a
 * bold colored curve — per the design constraints, this should read as a
 * professional database diagram connector, not a colorful flowchart arrow.
 */
export function RelationEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{ stroke: '#52525b', strokeWidth: 1.25 }}
    />
  )
}
