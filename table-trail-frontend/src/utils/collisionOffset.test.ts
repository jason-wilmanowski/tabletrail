import { describe, expect, it } from 'vitest'
import { computeCollisionOffsets } from './collisionOffset'

describe('computeCollisionOffsets', () => {
  it('returns no offsets when every point is far apart', () => {
    const offsets = computeCollisionOffsets([
      { id: 'a', point: { x: 0, y: 0 } },
      { id: 'b', point: { x: 500, y: 500 } },
      { id: 'c', point: { x: -500, y: 500 } },
    ])

    expect(offsets.size).toBe(0)
  })

  it('nudges two colliding points a small, equal distance apart in opposite directions', () => {
    const offsets = computeCollisionOffsets([
      { id: 'a', point: { x: 100, y: 100 } },
      { id: 'b', point: { x: 102, y: 101 } },
    ])

    const a = offsets.get('a')
    const b = offsets.get('b')
    expect(a).toBeDefined()
    expect(b).toBeDefined()
    expect(Math.hypot(a!.x, a!.y)).toBeCloseTo(18, 5)
    expect(Math.hypot(b!.x, b!.y)).toBeCloseTo(18, 5)
    // Opposite directions, not stacked on top of each other.
    expect(a!.x).toBeCloseTo(-b!.x, 5)
    expect(a!.y).toBeCloseTo(-b!.y, 5)
  })

  it('detects a collision across a spatial-hash cell boundary', () => {
    // 2 graph units apart — well within COLLISION_DISTANCE — but on
    // opposite sides of a cell boundary. A single-cell lookup would put
    // these in different buckets and miss the collision entirely; the
    // 3x3 neighbor check must still catch it.
    const offsets = computeCollisionOffsets([
      { id: 'a', point: { x: 129, y: 0 } },
      { id: 'b', point: { x: 131, y: 0 } },
    ])

    expect(offsets.has('b')).toBe(true)
  })

  it('leaves a single point in an otherwise-empty area alone', () => {
    const offsets = computeCollisionOffsets([{ id: 'a', point: { x: 0, y: 0 } }])
    expect(offsets.has('a')).toBe(false)
  })

  it('spreads more than two overlapping points around distinct angles', () => {
    const offsets = computeCollisionOffsets([
      { id: 'a', point: { x: 0, y: 0 } },
      { id: 'b', point: { x: 1, y: 0 } },
      { id: 'c', point: { x: 0, y: 1 } },
      { id: 'd', point: { x: 1, y: 1 } },
    ])

    const values = (['a', 'b', 'c', 'd'] as const).map((id) => offsets.get(id))
    const unique = new Set(values.map((v) => `${v?.x}:${v?.y}`))
    expect(unique.size).toBe(4)
  })

  it('is deterministic for the same input', () => {
    const items = [
      { id: 'a', point: { x: 10, y: 10 } },
      { id: 'b', point: { x: 12, y: 9 } },
    ]

    expect(computeCollisionOffsets(items)).toEqual(computeCollisionOffsets(items))
  })
})
