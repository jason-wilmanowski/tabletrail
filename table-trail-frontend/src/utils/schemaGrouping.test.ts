import { describe, expect, it } from 'vitest'
import type { TableResponse } from '../types/table'
import type { TableNodeType } from './tablesToNodes'
import { arrangeSchemaGroup, listSchemas } from './schemaGrouping'

function makeTable(id: number, schemaName: string | null, name = `table_${id}`): TableResponse {
  return { id, name, schema_name: schemaName, columns: [], constraints: [] }
}

function makeNode(
  table: TableResponse,
  x: number,
  y: number,
  size: { width: number; height: number } = { width: 200, height: 100 }
): TableNodeType {
  return {
    id: `table-${table.id}`,
    type: 'table',
    position: { x, y },
    measured: size,
    data: { label: table.name, table },
  }
}

describe('listSchemas', () => {
  it('counts tables per schema, sorted alphabetically with no-schema last', () => {
    const tables = [makeTable(1, 'sales'), makeTable(2, null), makeTable(3, 'auth'), makeTable(4, 'sales')]

    expect(listSchemas(tables)).toEqual([
      { schemaName: 'auth', tableCount: 1 },
      { schemaName: 'sales', tableCount: 2 },
      { schemaName: null, tableCount: 1 },
    ])
  })

  it('returns an empty list for no tables', () => {
    expect(listSchemas([])).toEqual([])
  })
})

describe('arrangeSchemaGroup', () => {
  it('places the group right of all other tables, top-aligned with them', () => {
    const nodes = [
      makeNode(makeTable(1, 'public'), 0, 50),
      makeNode(makeTable(2, 'public'), 300, 400),
      makeNode(makeTable(3, 'sales'), -500, -500),
    ]

    const arranged = arrangeSchemaGroup(nodes, 'sales')

    // Rightmost other table ends at 300 + 200, plus the 200px group offset.
    expect(arranged[2].position).toEqual({ x: 700, y: 50 })
  })

  it('leaves tables of other schemas untouched', () => {
    const nodes = [makeNode(makeTable(1, 'public'), 10, 20), makeNode(makeTable(2, 'sales'), 0, 0)]

    const arranged = arrangeSchemaGroup(nodes, 'sales')

    expect(arranged[0]).toBe(nodes[0])
  })

  it('lays the group out as a spaced grid sorted by table name without overlap', () => {
    const others = [makeNode(makeTable(1, 'public'), 0, 0)]
    const group = [
      makeNode(makeTable(2, 'sales', 'd'), 0, 0),
      makeNode(makeTable(3, 'sales', 'b'), 0, 0, { width: 300, height: 100 }),
      makeNode(makeTable(4, 'sales', 'a'), 0, 0, { width: 200, height: 250 }),
      makeNode(makeTable(5, 'sales', 'c'), 0, 0),
    ]

    const arranged = arrangeSchemaGroup([...others, ...group], 'sales')
    const byName = new Map(arranged.map((node) => [node.data.label, node.position]))

    // 4 tables → 2x2 grid, origin x = 200 + 200. Column 0 holds a/c (max
    // width 200), row 0 holds a/b (max height 250).
    expect(byName.get('a')).toEqual({ x: 400, y: 0 })
    expect(byName.get('b')).toEqual({ x: 400 + 200 + 80, y: 0 })
    expect(byName.get('c')).toEqual({ x: 400, y: 250 + 60 })
    expect(byName.get('d')).toEqual({ x: 400 + 200 + 80, y: 250 + 60 })
  })

  it('handles tables without a schema as their own group', () => {
    const nodes = [makeNode(makeTable(1, 'public'), 0, 0), makeNode(makeTable(2, null), -900, 900)]

    const arranged = arrangeSchemaGroup(nodes, null)

    expect(arranged[1].position).toEqual({ x: 400, y: 0 })
  })

  it('keeps the group at its own top-left corner when it is the only schema', () => {
    const nodes = [makeNode(makeTable(1, 'sales', 'a'), 100, 300), makeNode(makeTable(2, 'sales', 'b'), 50, 500)]

    const arranged = arrangeSchemaGroup(nodes, 'sales')

    expect(arranged[0].position).toEqual({ x: 50, y: 300 })
    expect(arranged[1].position).toEqual({ x: 50 + 200 + 80, y: 300 })
  })

  it('returns the input unchanged for an unknown schema', () => {
    const nodes = [makeNode(makeTable(1, 'public'), 0, 0)]

    expect(arrangeSchemaGroup(nodes, 'missing')).toBe(nodes)
  })
})
