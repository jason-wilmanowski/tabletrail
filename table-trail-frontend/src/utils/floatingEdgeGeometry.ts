import { Position } from '@xyflow/react'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface FloatingPoint {
  x: number
  y: number
  position: Position
}

/**
 * Where the ray from `from`'s center towards `to`'s center crosses
 * `from`'s own rectangular boundary, and which side of the rectangle
 * that crossing falls on.
 *
 * This is the standard "floating edge" technique React Flow documents
 * for exactly this problem (an edge picking whichever side is actually
 * closest instead of a hardcoded direction) — see their "Floating
 * Edges" example — computed here as an explicit ray/rectangle
 * intersection (compare how far along the ray each axis's boundary is
 * reached, the smaller one wins) rather than the curve-fitted
 * approximation in that example, so the result is exact for a rectangle
 * and easy to verify by inspection.
 */
export function getRectIntersection(from: Rect, to: Rect): FloatingPoint {
  const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
  const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 }

  const dx = toCenter.x - fromCenter.x
  const dy = toCenter.y - fromCenter.y

  if (dx === 0 && dy === 0) {
    return { ...fromCenter, position: Position.Right }
  }

  const halfWidth = from.width / 2
  const halfHeight = from.height / 2
  // How far along the ray (in "reaches the boundary" units, 1 = exactly
  // at the boundary) each axis's edge is hit — whichever is smaller is
  // the edge the ray actually exits through first.
  const scaleX = dx !== 0 ? halfWidth / Math.abs(dx) : Number.POSITIVE_INFINITY
  const scaleY = dy !== 0 ? halfHeight / Math.abs(dy) : Number.POSITIVE_INFINITY
  const scale = Math.min(scaleX, scaleY)

  const point = { x: fromCenter.x + dx * scale, y: fromCenter.y + dy * scale }
  const position =
    scaleX < scaleY ? (dx > 0 ? Position.Right : Position.Left) : dy > 0 ? Position.Bottom : Position.Top

  return { ...point, position }
}

export interface FloatingEdgeParams {
  sourceX: number
  sourceY: number
  sourcePosition: Position
  targetX: number
  targetY: number
  targetPosition: Position
}

/**
 * The shortest-path anchor points and directions for a straight-line-
 * style edge between two node rectangles — used by both `RelationEdge`
 * (FK edges) and `ColumnRelationEdge` (custom relations, via
 * `pickHorizontalSide` below for the column-row case) so a connection
 * between two tables always exits/enters through whichever side actually
 * faces the other table, instead of a fixed direction that can force the
 * line all the way around both nodes.
 */
export function getFloatingEdgeParams(source: Rect, target: Rect): FloatingEdgeParams {
  const sourcePoint = getRectIntersection(source, target)
  const targetPoint = getRectIntersection(target, source)
  return {
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    sourcePosition: sourcePoint.position,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
    targetPosition: targetPoint.position,
  }
}

/**
 * Left/right-only variant for column-to-column relations: a column's
 * anchor Y is fixed by its row inside the table (not something a
 * geometry formula should move), so only the horizontal side — does
 * this column face left or right towards the other table — is decided
 * here, using each table's horizontal center.
 */
export function pickHorizontalSide(
  sourceTableCenterX: number,
  targetTableCenterX: number
): { sourcePosition: Position; targetPosition: Position } {
  const sourceIsLeftOfTarget = sourceTableCenterX <= targetTableCenterX
  return {
    sourcePosition: sourceIsLeftOfTarget ? Position.Right : Position.Left,
    targetPosition: sourceIsLeftOfTarget ? Position.Left : Position.Right,
  }
}
