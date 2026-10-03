import { describe, expect, it } from 'vitest'
import type { TableResponse } from '../types/table'
import { countColumns, countMatchedTables, filterColumnsByName, filterTablesByName } from './filterTables'

function makeTable(id: number, name: string, columnCount: number): TableResponse {
  return {
    id,
    name,
    schema_name: 'public',
    columns: Array.from({ length: columnCount }, (_, index) => ({
      id: id * 100 + index,
      name: `column_${index}`,
      data_type: 'integer',
      is_nullable: false,
      default_value: null,
      ordinal_position: index + 1,
    })),
    constraints: [],
  }
}

const tables = [makeTable(1, 'users', 3), makeTable(2, 'orders', 5), makeTable(3, 'order_items', 4)]

describe('filterTablesByName', () => {
  it('returns all tables for an empty or whitespace-only query', () => {
    expect(filterTablesByName(tables, '')).toBe(tables)
    expect(filterTablesByName(tables, '   ')).toBe(tables)
  })

  it('matches case-insensitive substrings of the table name', () => {
    expect(filterTablesByName(tables, 'ORDER').map((table) => table.name)).toEqual(['orders', 'order_items'])
  })

  it('ignores surrounding whitespace in the query', () => {
    expect(filterTablesByName(tables, '  users ').map((table) => table.name)).toEqual(['users'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterTablesByName(tables, 'payments')).toEqual([])
  })
})

describe('countColumns', () => {
  it('sums the columns of all tables', () => {
    expect(countColumns(tables)).toBe(12)
  })

  it('returns 0 for no tables', () => {
    expect(countColumns([])).toBe(0)
  })
})

function makeNamedTable(id: number, name: string, columnNames: string[]): TableResponse {
  return {
    ...makeTable(id, name, 0),
    columns: columnNames.map((columnName, index) => ({
      id: id * 100 + index,
      name: columnName,
      data_type: 'integer',
      is_nullable: false,
      default_value: null,
      ordinal_position: index + 1,
    })),
  }
}

const namedTables = [
  makeNamedTable(1, 'users', ['id', 'email', 'created_at']),
  makeNamedTable(2, 'orders', ['id', 'user_id', 'created_at']),
  makeNamedTable(3, 'invoices', ['id', 'total']),
]

describe('filterColumnsByName', () => {
  it('matches nothing for an empty or whitespace-only query', () => {
    expect(filterColumnsByName(namedTables, '')).toEqual([])
    expect(filterColumnsByName(namedTables, '   ')).toEqual([])
  })

  it('matches case-insensitive substrings of the column name across all tables, in table order', () => {
    const matches = filterColumnsByName(namedTables, 'CREATED')

    expect(matches.map((match) => `${match.table.name}.${match.column.name}`)).toEqual([
      'users.created_at',
      'orders.created_at',
    ])
  })

  it('keeps the table each matched column belongs to', () => {
    const [match] = filterColumnsByName(namedTables, 'user_id')

    expect(match.table).toBe(namedTables[1])
    expect(match.column).toBe(namedTables[1].columns[1])
  })

  it('ignores surrounding whitespace in the query', () => {
    expect(filterColumnsByName(namedTables, '  total ').map((match) => match.column.name)).toEqual(['total'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterColumnsByName(namedTables, 'payment')).toEqual([])
  })
})

describe('countMatchedTables', () => {
  it('counts each table once, however many of its columns match', () => {
    // "id" matches users.id, orders.id, orders.user_id and invoices.id
    expect(countMatchedTables(filterColumnsByName(namedTables, 'id'))).toBe(3)
  })

  it('returns 0 for no matches', () => {
    expect(countMatchedTables([])).toBe(0)
  })
})
