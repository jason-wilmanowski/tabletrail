import { describe, expect, it } from 'vitest'
import type { TableResponse } from '../types/table'
import { countColumns, filterTablesByName } from './filterTables'

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
