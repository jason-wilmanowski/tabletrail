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

  it('offsets points that land in the same cell', () => {
    const offsets = computeCollisionOffsets([
      { id: 'a', point: { x: 100, y: 100 } },
      { id: 'b', point: { x: 102, y: 101 } },
    ])

    expect(offsets.size).toBe(2)
    expect(offsets.get('a')).not.toEqual(offsets.get('b'))
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
