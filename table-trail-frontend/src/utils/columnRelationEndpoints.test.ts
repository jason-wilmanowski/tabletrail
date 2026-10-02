import { describe, expect, it } from 'vitest'
import type { ColumnRelationResponse } from '../types/columnRelation'
import type { TableResponse } from '../types/table'
import { buildColumnIndex, columnNameKey, resolveRelationEndpoints } from './columnRelationEndpoints'

function makeTable(id: number, schemaName: string | null, name: string, columnNames: string[]): TableResponse {
  return {
    id,
    name,
    schema_name: schemaName,
    columns: columnNames.map((columnName, index) => ({
      id: id * 100 + index,
      name: columnName,
      data_type: 'integer',
      is_nullable: false,
      default_value: null,
      ordinal_position: index + 1,
    })),
    constraints: [],
  }
}

function makeRelation(overrides: Partial<ColumnRelationResponse> = {}): ColumnRelationResponse {
  return {
    id: 1,
    database_id: 42,
    schema_name_1: 'public',
    schema_name_2: 'public',
    table_name_1: 'users',
    table_name_2: 'orders',
    column_name_1: 'id',
    column_name_2: 'user_id',
    relation_color: 'green',
    description: null,
    ...overrides,
  }
}

const tables = [
  makeTable(1, 'public', 'users', ['id', 'email']),
  makeTable(2, 'public', 'orders', ['id', 'user_id']),
  makeTable(3, 'billing', 'users', ['id']),
]

describe('buildColumnIndex', () => {
  it('indexes every column by id and by schema, table and column name', () => {
    const index = buildColumnIndex(tables)

    expect(index.byId.get(201)).toEqual({
      tableId: 2,
      columnId: 201,
      schemaName: 'public',
      tableName: 'orders',
      columnName: 'user_id',
    })
    expect(index.byName.get(columnNameKey('public', 'orders', 'user_id'))).toBe(index.byId.get(201))
  })

  it('keeps same-named tables in different schemas apart', () => {
    const index = buildColumnIndex(tables)

    expect(index.byName.get(columnNameKey('public', 'users', 'id'))?.tableId).toBe(1)
    expect(index.byName.get(columnNameKey('billing', 'users', 'id'))?.tableId).toBe(3)
  })

  it('skips tables without a schema', () => {
    const index = buildColumnIndex([makeTable(4, null, 'legacy', ['id'])])

    expect(index.byId.size).toBe(0)
    expect(index.byName.size).toBe(0)
  })
})

describe('resolveRelationEndpoints', () => {
  const index = buildColumnIndex(tables)

  it('resolves both sides of a relation to their columns', () => {
    const endpoints = resolveRelationEndpoints(makeRelation(), index)

    expect(endpoints?.map((column) => column.columnId)).toEqual([100, 201])
  })

  it('resolves a relation across schemas', () => {
    const endpoints = resolveRelationEndpoints(
      makeRelation({ schema_name_1: 'billing', table_name_1: 'users', column_name_1: 'id' }),
      index
    )

    expect(endpoints?.map((column) => column.tableId)).toEqual([3, 2])
  })

  it('returns null when a column no longer exists', () => {
    expect(resolveRelationEndpoints(makeRelation({ column_name_2: 'buyer_id' }), index)).toBeNull()
  })

  it('returns null when the column exists only in another schema', () => {
    expect(resolveRelationEndpoints(makeRelation({ schema_name_2: 'billing' }), index)).toBeNull()
  })
})
