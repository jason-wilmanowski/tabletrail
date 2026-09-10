import { describe, expect, it } from 'vitest'
import type { TableResponse } from '../types/table'
import { tablesToNodes } from './tablesToNodes'

function makeTable(id: number, name: string): TableResponse {
  return {
    id,
    name,
    schema_name: 'public',
    columns: [],
    constraints: [],
  }
}

describe('tablesToNodes', () => {
  it('returns an empty array for no tables', () => {
    expect(tablesToNodes([])).toEqual([])
  })

  it('maps each table to a node carrying its id, label and full table data', () => {
    const table = makeTable(7, 'users')

    const [node] = tablesToNodes([table])

    expect(node.id).toBe('table-7')
    expect(node.type).toBe('table')
    expect(node.data.label).toBe('users')
    expect(node.data.table).toBe(table)
  })

  it('arranges nodes in a 4-column grid by index', () => {
    const tables = Array.from({ length: 5 }, (_, i) => makeTable(i, `table_${i}`))

    const nodes = tablesToNodes(tables)

    // First row: indices 0-3
    expect(nodes[0].position).toEqual({ x: 0, y: 0 })
    expect(nodes[1].position).toEqual({ x: 250, y: 0 })
    expect(nodes[2].position).toEqual({ x: 500, y: 0 })
    expect(nodes[3].position).toEqual({ x: 750, y: 0 })
    // Wraps to a second row at index 4
    expect(nodes[4].position).toEqual({ x: 0, y: 150 })
  })

  it('produces one node per table, preserving order', () => {
    const tables = [makeTable(1, 'a'), makeTable(2, 'b'), makeTable(3, 'c')]

    const nodes = tablesToNodes(tables)

    expect(nodes.map((n) => n.id)).toEqual(['table-1', 'table-2', 'table-3'])
  })
})
