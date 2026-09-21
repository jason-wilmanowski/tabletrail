import { Position } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { getFloatingEdgeParams, getRectIntersection, pickHorizontalSide } from './floatingEdgeGeometry'
import type { Rect } from './floatingEdgeGeometry'

function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height }
}

describe('getRectIntersection', () => {
  it('exits to the right when the other rect is directly to the right', () => {
    const a = rect(0, 0, 100, 50)
    const b = rect(300, 0, 100, 50)
    const result = getRectIntersection(a, b)
    expect(result.position).toBe(Position.Right)
    expect(result.x).toBeCloseTo(100)
    expect(result.y).toBeCloseTo(25)
  })

  it('exits to the left when the other rect is directly to the left', () => {
    const a = rect(300, 0, 100, 50)
    const b = rect(0, 0, 100, 50)
    const result = getRectIntersection(a, b)
    expect(result.position).toBe(Position.Left)
    expect(result.x).toBeCloseTo(300)
  })

  it('exits downward when the other rect is directly below', () => {
    const a = rect(0, 0, 100, 50)
    const b = rect(0, 300, 100, 50)
    const result = getRectIntersection(a, b)
    expect(result.position).toBe(Position.Bottom)
    expect(result.y).toBeCloseTo(50)
  })

  it('exits upward when the other rect is directly above', () => {
    const a = rect(0, 300, 100, 50)
    const b = rect(0, 0, 100, 50)
    const result = getRectIntersection(a, b)
    expect(result.position).toBe(Position.Top)
  })

  it('picks the horizontally-facing side for a wide, shallow offset (mostly-sideways neighbor)', () => {
    const a = rect(0, 0, 100, 50)
    const b = rect(300, 10, 100, 50)
    const result = getRectIntersection(a, b)
    expect(result.position).toBe(Position.Right)
  })

  it('does not throw for two rects at the same center', () => {
    const a = rect(0, 0, 100, 50)
    expect(() => getRectIntersection(a, a)).not.toThrow()
  })
})

describe('getFloatingEdgeParams', () => {
  it('returns matching opposite-facing sides for two side-by-side rects', () => {
    const source = rect(0, 0, 100, 50)
    const target = rect(300, 0, 100, 50)
    const params = getFloatingEdgeParams(source, target)

    expect(params.sourcePosition).toBe(Position.Right)
    expect(params.targetPosition).toBe(Position.Left)
    // the line stays within each rect's own boundary — never crosses
    // through the other node's body
    expect(params.sourceX).toBeLessThanOrEqual(target.x)
    expect(params.targetX).toBeGreaterThanOrEqual(source.x + source.width)
  })
})

describe('pickHorizontalSide', () => {
  it('exits right/enters left when source is to the left of target', () => {
    expect(pickHorizontalSide(0, 500)).toEqual({
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    })
  })

  it('exits left/enters right when source is to the right of target', () => {
    expect(pickHorizontalSide(500, 0)).toEqual({
      sourcePosition: Position.Left,
      targetPosition: Position.Right,
    })
  })
})
