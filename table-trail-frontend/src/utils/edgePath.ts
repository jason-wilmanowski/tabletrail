import { getBezierPath, getSmoothStepPath, getStraightPath } from '@xyflow/react'
import type { Position } from '@xyflow/react'

/** How relation lines are drawn, set by the `graph.edgeStyle` setting. */
export type EdgeStyle = 'smoothstep' | 'bezier' | 'straight'

export const DEFAULT_EDGE_STYLE: EdgeStyle = 'smoothstep'

export interface EdgePathParams {
  sourceX: number
  sourceY: number
  sourcePosition: Position
  targetX: number
  targetY: number
  targetPosition: Position
}

/**
 * Builds an edge's SVG path in the given style. Returns React Flow's
 * `[path, labelX, labelY, offsetX, offsetY]` tuple in every case, so edge
 * components can swap styles without touching their label placement.
 * Unknown values (e.g. an outdated stored setting) fall back to the default.
 */
export function getEdgePath(style: string, params: EdgePathParams): [string, number, number, number, number] {
  switch (style) {
    case 'bezier':
      return getBezierPath(params)
    case 'straight':
      return getStraightPath(params)
    default:
      return getSmoothStepPath(params)
  }
}
