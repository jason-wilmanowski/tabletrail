import { describe, expect, it } from 'vitest'
import { Position } from '@xyflow/react'
import { getEdgePath } from './edgePath'

const params = {
  sourceX: 0,
  sourceY: 0,
  sourcePosition: Position.Bottom,
  targetX: 100,
  targetY: 200,
  targetPosition: Position.Top,
}

describe('getEdgePath', () => {
  it('draws a straight line as a single segment', () => {
    const [path] = getEdgePath('straight', params)

    expect(path).toBe('M 0,0L 100,200')
  })

  it('draws a bezier curve with a cubic command', () => {
    const [path] = getEdgePath('bezier', params)

    expect(path).toMatch(/^M0,0 C/)
  })

  it('falls back to smooth step for unknown styles', () => {
    expect(getEdgePath('unknown', params)).toEqual(getEdgePath('smoothstep', params))
  })

  it('gives every style a label position between the endpoints', () => {
    for (const style of ['smoothstep', 'bezier', 'straight']) {
      const [, labelX, labelY] = getEdgePath(style, params)

      expect(labelX).toBe(50)
      expect(labelY).toBe(100)
    }
  })
})
