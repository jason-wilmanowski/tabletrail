import { describe, expect, it } from 'vitest'
import type { ConstraintResponse } from '../types/constraint'
import type { TableResponse } from '../types/table'
import { constraintsToEdges } from './constraintsToEdges'

function makeConstraint(overrides: Partial<ConstraintResponse> = {}): ConstraintResponse {
  return {
    id: 1,
    constraint_name: 'fk_orders_customer',
    constraint_type: 'FOREIGN KEY',
    references_table_id: 2,
    column_names: ['customer_id'],
    on_delete: null,
    on_update: null,
    ...overrides,
  }
}

function makeTable(id: number, constraints: ConstraintResponse[] = []): TableResponse {
  return {
    id,
    name: `table_${id}`,
    schema_name: null,
    columns: [],
    constraints,
  }
}

describe('constraintsToEdges', () => {
  it('returns no edges when there are no tables', () => {
    expect(constraintsToEdges([])).toEqual([])
  })

  it('creates one edge per FOREIGN KEY constraint, connecting table nodes', () => {
    const constraint = makeConstraint({ id: 42, references_table_id: 2 })
    const tables = [makeTable(1, [constraint]), makeTable(2)]

    const edges = constraintsToEdges(tables)

    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({
      id: 'edge-42',
      type: 'relation',
      source: 'table-1',
      target: 'table-2',
      sourceHandle: 'table',
      targetHandle: 'table',
    })
  })

  it('ignores non-FOREIGN KEY constraints (e.g. PRIMARY KEY, UNIQUE)', () => {
    const primaryKey = makeConstraint({
      constraint_type: 'PRIMARY KEY',
      // Known backend scanner quirk: references_table_id can be set even
      // on a PRIMARY KEY, pointing back at the table's own id.
      references_table_id: 1,
    })
    const tables = [makeTable(1, [primaryKey])]

    expect(constraintsToEdges(tables)).toEqual([])
  })

  it('skips FOREIGN KEY constraints with no references_table_id', () => {
    const danglingFk = makeConstraint({ references_table_id: null })
    const tables = [makeTable(1, [danglingFk])]

    expect(constraintsToEdges(tables)).toEqual([])
  })

  it('carries on_delete/on_update through to edge data', () => {
    const constraint = makeConstraint({ on_delete: 'CASCADE', on_update: 'SET NULL' })
    const tables = [makeTable(1, [constraint]), makeTable(2)]

    const [edge] = constraintsToEdges(tables)

    expect(edge.data).toEqual({ onDelete: 'CASCADE', onUpdate: 'SET NULL' })
  })

  it('produces multiple edges across multiple tables', () => {
    const fkToB = makeConstraint({ id: 1, references_table_id: 2 })
    const fkToC = makeConstraint({ id: 2, references_table_id: 3 })
    const tables = [makeTable(1, [fkToB, fkToC]), makeTable(2), makeTable(3)]

    const edges = constraintsToEdges(tables)

    expect(edges.map((e) => e.id)).toEqual(['edge-1', 'edge-2'])
    expect(edges.map((e) => e.target)).toEqual(['table-2', 'table-3'])
  })
})
