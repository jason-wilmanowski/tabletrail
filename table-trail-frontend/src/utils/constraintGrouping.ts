import type { ConstraintResponse } from '../types/constraint'

export interface ColumnConstraintFlags {
  isPrimaryKey: boolean
  isForeignKey: boolean
}

/**
 * Builds a column-name → constraint-flags lookup from a table's
 * constraints. Grouped by column name (not by constraint) because that's
 * exactly what a column row needs to answer: "am I a PK and/or FK
 * column?" A single column can be both (e.g. a composite PK that is also
 * a FK), so the two flags are independent, not mutually exclusive.
 *
 * Only inspects `PRIMARY KEY` and `FOREIGN KEY` constraint types — other
 * types (UNIQUE, CHECK) are ignored here since this step only concerns
 * PK/FK icons.
 *
 * Pure data analysis, no UI — `TableNode` calls this once per table and
 * looks up flags per column, it does not group constraints itself.
 */
export function buildColumnConstraintMap(
  constraints: ConstraintResponse[]
): Map<string, ColumnConstraintFlags> {
  const map = new Map<string, ColumnConstraintFlags>()

  for (const constraint of constraints) {
    const isPrimaryKey = constraint.constraint_type === 'PRIMARY KEY'
    const isForeignKey = constraint.constraint_type === 'FOREIGN KEY'

    if (!isPrimaryKey && !isForeignKey) {
      continue
    }

    for (const columnName of constraint.column_names) {
      const existing = map.get(columnName) ?? {
        isPrimaryKey: false,
        isForeignKey: false,
      }

      map.set(columnName, {
        isPrimaryKey: existing.isPrimaryKey || isPrimaryKey,
        isForeignKey: existing.isForeignKey || isForeignKey,
      })
    }
  }

  return map
}

/**
 * Preferred display order for constraint type groups — anything not
 * listed here (uncommon/custom types) is appended afterwards in the
 * order first encountered. Purely cosmetic ordering, not a data concern.
 */
const CONSTRAINT_TYPE_ORDER = ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK']

/**
 * Groups a table's constraints by `constraint_type`, for
 * `TableInspectorPanel`'s constraint list (Step 23). This is a different
 * grouping shape than `buildColumnConstraintMap` above — that one answers
 * "which flags apply to this column", this one answers "which constraints
 * exist, grouped by type" — so it lives alongside it in the same utility
 * file rather than being reimplemented inline in the panel component.
 *
 * Order of groups follows `CONSTRAINT_TYPE_ORDER` so the list reads
 * consistently across different tables regardless of the order
 * constraints happen to arrive from the backend.
 */
export function groupConstraintsByType(
  constraints: ConstraintResponse[]
): Map<string, ConstraintResponse[]> {
  const byType = new Map<string, ConstraintResponse[]>()

  for (const constraint of constraints) {
    const group = byType.get(constraint.constraint_type) ?? []
    group.push(constraint)
    byType.set(constraint.constraint_type, group)
  }

  const ordered = new Map<string, ConstraintResponse[]>()

  for (const type of CONSTRAINT_TYPE_ORDER) {
    const group = byType.get(type)
    if (group) {
      ordered.set(type, group)
      byType.delete(type)
    }
  }

  for (const [type, group] of byType) {
    ordered.set(type, group)
  }

  return ordered
}
