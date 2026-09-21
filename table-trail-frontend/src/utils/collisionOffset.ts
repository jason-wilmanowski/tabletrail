export interface Point {
  x: number
  y: number
}

/** Two label centers within this distance (graph coordinate px) are treated as colliding. */
const COLLISION_DISTANCE = 48

/**
 * How far a colliding label gets nudged away from its true position —
 * small and fixed, regardless of how many other labels share the same
 * spot, so a label always stays visually anchored to its own relation
 * instead of drifting away from it.
 */
const OFFSET_STEP = 18

/**
 * Groups points into clusters where every point is within
 * `COLLISION_DISTANCE` of at least one other point in the same cluster
 * (transitively), then spreads each cluster's points a small, fixed
 * distance (`OFFSET_STEP`) apart around their shared spot — same simple
 * "nudge along a circle" idea as before, just with the detection fixed:
 * it now checks each point's own grid cell plus its 8 neighbors (a
 * spatial hash sized to `COLLISION_DISTANCE`), not just its own cell, so
 * a pair of points that straddle a cell boundary is never missed the way
 * a single-cell lookup used to miss it.
 *
 * Points in a cluster alone get no entry in the returned map at all — the
 * caller's default (zero offset, i.e. dead center on the relation) is
 * left untouched for the common case of no collision.
 *
 * Caller-agnostic on purpose: `GraphCanvas` feeds this one combined list
 * of both FK relation labels and custom-relation notes together, so a
 * label never overlaps another label regardless of whether either side
 * is a real FK constraint or a manually-drawn relation.
 */
export function computeCollisionOffsets<Id extends string>(
  items: { id: Id; point: Point }[]
): Map<Id, Point> {
  const cellOf = (value: number) => Math.floor(value / COLLISION_DISTANCE)
  const keyOf = (cx: number, cy: number) => `${cx}:${cy}`

  const grid = new Map<string, { id: Id; point: Point }[]>()
  for (const item of items) {
    const key = keyOf(cellOf(item.point.x), cellOf(item.point.y))
    const bucket = grid.get(key)
    if (bucket) {
      bucket.push(item)
    } else {
      grid.set(key, [item])
    }
  }

  const parent = new Map<Id, Id>()
  for (const item of items) {
    parent.set(item.id, item.id)
  }
  const find = (id: Id): Id => {
    const p = parent.get(id)!
    if (p === id) {
      return id
    }
    const root = find(p)
    parent.set(id, root)
    return root
  }
  const union = (a: Id, b: Id) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) {
      parent.set(ra, rb)
    }
  }

  const distanceSquared = COLLISION_DISTANCE * COLLISION_DISTANCE
  for (const item of items) {
    const cx = cellOf(item.point.x)
    const cy = cellOf(item.point.y)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighbors = grid.get(keyOf(cx + dx, cy + dy))
        if (!neighbors) {
          continue
        }
        for (const other of neighbors) {
          if (other.id === item.id) {
            continue
          }
          const ddx = other.point.x - item.point.x
          const ddy = other.point.y - item.point.y
          if (ddx * ddx + ddy * ddy <= distanceSquared) {
            union(item.id, other.id)
          }
        }
      }
    }
  }

  const clusters = new Map<Id, { id: Id; point: Point }[]>()
  for (const item of items) {
    const root = find(item.id)
    const cluster = clusters.get(root)
    if (cluster) {
      cluster.push(item)
    } else {
      clusters.set(root, [item])
    }
  }

  const offsets = new Map<Id, Point>()
  for (const cluster of clusters.values()) {
    if (cluster.length < 2) {
      continue
    }
    // Stable order so a given label doesn't jump to a different slot
    // between recomputations (e.g. every drag frame) purely because of
    // iteration order.
    const sorted = [...cluster].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    sorted.forEach((item, index) => {
      const angle = (index / sorted.length) * Math.PI * 2
      offsets.set(item.id, {
        x: Math.cos(angle) * OFFSET_STEP,
        y: Math.sin(angle) * OFFSET_STEP,
      })
    })
  }

  return offsets
}
