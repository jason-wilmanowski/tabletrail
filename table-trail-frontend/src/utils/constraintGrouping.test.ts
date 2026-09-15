import { describe, expect, it } from 'vitest'
import type { ConstraintResponse } from '../types/constraint'
import { buildColumnConstraintMap, groupConstraintsByType } from './constraintGrouping'

function makeConstraint(overrides: Partial<ConstraintResponse> = {}): ConstraintResponse {
  return {
    id: 1,
    constraint_name: 'pk_users',
    constraint_type: 'PRIMARY KEY',
    references_table_id: null,
    column_names: ['id'],
    on_delete: null,
    on_update: null,
    ...overrides,
  }
}

describe('buildColumnConstraintMap', () => {
  it('returns an empty map for no constraints', () => {
    expect(buildColumnConstraintMap([])).toEqual(new Map())
  })

  it('flags a column referenced by a PRIMARY KEY constraint', () => {
    const map = buildColumnConstraintMap([
      makeConstraint({ constraint_type: 'PRIMARY KEY', column_names: ['id'] }),
    ])

    expect(map.get('id')).toEqual({ isPrimaryKey: true, isForeignKey: false })
  })

  it('flags a column referenced by a FOREIGN KEY constraint', () => {
    const map = buildColumnConstraintMap([
      makeConstraint({ constraint_type: 'FOREIGN KEY', column_names: ['customer_id'] }),
    ])

    expect(map.get('customer_id')).toEqual({ isPrimaryKey: false, isForeignKey: true })
  })

  it('merges flags when a column is both a PK and FK (composite key)', () => {
    const map = buildColumnConstraintMap([
      makeConstraint({ constraint_type: 'PRIMARY KEY', column_names: ['id'] }),
      makeConstraint({ id: 2, constraint_type: 'FOREIGN KEY', column_names: ['id'] }),
    ])

    expect(map.get('id')).toEqual({ isPrimaryKey: true, isForeignKey: true })
  })

  it('ignores non PK/FK constraint types such as UNIQUE and CHECK', () => {
    const map = buildColumnConstraintMap([
      makeConstraint({ constraint_type: 'UNIQUE', column_names: ['email'] }),
      makeConstraint({ id: 2, constraint_type: 'CHECK', column_names: ['age'] }),
    ])

    expect(map.size).toBe(0)
  })

  it('applies a constraint to every column it covers (composite constraint)', () => {
    const map = buildColumnConstraintMap([
      makeConstraint({ constraint_type: 'PRIMARY KEY', column_names: ['tenant_id', 'user_id'] }),
    ])

    expect(map.get('tenant_id')).toEqual({ isPrimaryKey: true, isForeignKey: false })
    expect(map.get('user_id')).toEqual({ isPrimaryKey: true, isForeignKey: false })
  })
})

describe('groupConstraintsByType', () => {
  it('returns an empty map for no constraints', () => {
    expect(groupConstraintsByType([])).toEqual(new Map())
  })

  it('groups constraints by their constraint_type', () => {
    const pk = makeConstraint({ id: 1, constraint_type: 'PRIMARY KEY' })
    const fk = makeConstraint({ id: 2, constraint_type: 'FOREIGN KEY' })
    const unique = makeConstraint({ id: 3, constraint_type: 'UNIQUE' })

    const grouped = groupConstraintsByType([pk, fk, unique])

    expect(grouped.get('PRIMARY KEY')).toEqual([pk])
    expect(grouped.get('FOREIGN KEY')).toEqual([fk])
    expect(grouped.get('UNIQUE')).toEqual([unique])
  })

  it('orders known types as PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK regardless of input order', () => {
    const check = makeConstraint({ id: 1, constraint_type: 'CHECK' })
    const unique = makeConstraint({ id: 2, constraint_type: 'UNIQUE' })
    const fk = makeConstraint({ id: 3, constraint_type: 'FOREIGN KEY' })
    const pk = makeConstraint({ id: 4, constraint_type: 'PRIMARY KEY' })

    const grouped = groupConstraintsByType([check, unique, fk, pk])

    expect([...grouped.keys()]).toEqual(['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK'])
  })

  it('appends unknown constraint types after the known ones, in first-seen order', () => {
    const pk = makeConstraint({ id: 1, constraint_type: 'PRIMARY KEY' })
    const custom = makeConstraint({ id: 2, constraint_type: 'EXCLUSION' })

    const grouped = groupConstraintsByType([custom, pk])

    expect([...grouped.keys()]).toEqual(['PRIMARY KEY', 'EXCLUSION'])
  })
})
