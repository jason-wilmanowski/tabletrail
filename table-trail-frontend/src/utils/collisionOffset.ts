export interface Point {
  x: number
  y: number
}

/** Points closer together than this (in graph coordinate units) are treated as overlapping. */
const BUCKET_SIZE = 48

/** How far apart overlapping points are nudged from their true position. */
const OFFSET_STEP = 16

/**
 * Groups points into a coarse grid (cheap O(n) bucketing, not O(n²)
 * pairwise distance checks — this has to stay fast with many
 * simultaneously-visible column-relation notes) and assigns every point
 * that shares a crowded cell with others a small radial offset, so
 * their on-canvas labels don't render exactly on top of each other.
 *
 * Points in a cell alone get no entry in the returned map at all — the
 * caller's default (zero offset, i.e. dead center on the relation) is
 * left untouched for the common case of no collision.
 */
export function computeCollisionOffsets<Id extends string>(
  items: { id: Id; point: Point }[]
): Map<Id, Point> {
  const buckets = new Map<string, { id: Id; point: Point }[]>()

  for (const item of items) {
    const key = `${Math.round(item.point.x / BUCKET_SIZE)}:${Math.round(item.point.y / BUCKET_SIZE)}`
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(item)
    } else {
      buckets.set(key, [item])
    }
  }

  const offsets = new Map<Id, Point>()

  for (const bucket of buckets.values()) {
    if (bucket.length < 2) {
      continue
    }

    bucket.forEach((item, index) => {
      const angle = (index / bucket.length) * Math.PI * 2
      offsets.set(item.id, {
        x: Math.cos(angle) * OFFSET_STEP,
        y: Math.sin(angle) * OFFSET_STEP,
      })
    })
  }

  return offsets
}
