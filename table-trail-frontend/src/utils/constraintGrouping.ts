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
