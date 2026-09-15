import { describe, expect, it } from 'vitest'
import type { Edge } from '@xyflow/react'
import type { TableResponse } from '../types/table'
import { layoutAlgorithm } from './layoutAlgorithm'
import { tablesToNodes } from './tablesToNodes'

function makeTable(id: number, columnCount: number): TableResponse {
  return {
    id,
    name: `table_${id}`,
    schema_name: null,
    columns: Array.from({ length: columnCount }, (_, i) => ({
      id: i,
      name: `col_${i}`,
      data_type: 'text',
      is_nullable: true,
      default_value: null,
      ordinal_position: i,
    })),
    constraints: [],
  }
}

describe('layoutAlgorithm', () => {
  it('returns the same number of nodes it was given', () => {
    const nodes = tablesToNodes([makeTable(1, 2), makeTable(2, 3)])

    const laidOut = layoutAlgorithm(nodes)

    expect(laidOut).toHaveLength(2)
    expect(laidOut.map((n) => n.id)).toEqual(nodes.map((n) => n.id))
  })

  it('preserves each node\'s data while updating its position', () => {
    const nodes = tablesToNodes([makeTable(1, 2)])

    const [laidOut] = layoutAlgorithm(nodes)

    expect(laidOut.data).toBe(nodes[0].data)
    expect(laidOut.position).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }))
  })

  it('does not mutate the input nodes', () => {
    const nodes = tablesToNodes([makeTable(1, 2)])
    const originalPosition = { ...nodes[0].position }

    layoutAlgorithm(nodes)

    expect(nodes[0].position).toEqual(originalPosition)
  })

  it('handles an empty node list without throwing', () => {
    expect(layoutAlgorithm([])).toEqual([])
  })

  it('positions nodes connected by an edge apart from each other (no overlap)', () => {
    const nodes = tablesToNodes([makeTable(1, 2), makeTable(2, 2)])
    const edges: Edge[] = [{ id: 'e1', source: 'table-1', target: 'table-2' }]

    const [a, b] = layoutAlgorithm(nodes, edges)

    expect(a.position).not.toEqual(b.position)
  })

  it('spaces nodes further apart vertically as their column count (and therefore height) grows', () => {
    const nodesFewColumns = layoutAlgorithm(tablesToNodes([makeTable(1, 2), makeTable(2, 2)]), [
      { id: 'e1', source: 'table-1', target: 'table-2' },
    ])
    const nodesManyColumns = layoutAlgorithm(tablesToNodes([makeTable(1, 20), makeTable(2, 20)]), [
      { id: 'e1', source: 'table-1', target: 'table-2' },
    ])

    const gapFew = Math.abs(nodesFewColumns[1].position.y - nodesFewColumns[0].position.y)
    const gapMany = Math.abs(nodesManyColumns[1].position.y - nodesManyColumns[0].position.y)

    expect(gapMany).toBeGreaterThan(gapFew)
  })
})
