import { KeyRound, Link2 } from 'lucide-react'
import type { NodeProps } from '@xyflow/react'
import type { TableNodeType } from '../../../utils/tablesToNodes'
import { buildColumnConstraintMap } from '../../../utils/constraintGrouping'

/**
 * Custom React Flow node representing a single database table.
 *
 * Step 14 added the header (table name + schema badge). Step 15 added the
 * column list (name + data type, sorted by `ordinal_position`). Step 16
 * adds PK/FK indicators per column, driven by `buildColumnConstraintMap()`
 * (src/utils/constraintGrouping.ts) — this component only looks flags up
 * and renders an icon, it does not analyze constraints itself.
 *
 * Icons are small, muted and shape-differentiated (key vs link) rather
 * than color-differentiated — a formal accent-color system doesn't exist
 * yet (that's Step 28), so introducing ad-hoc colors here would work
 * against the "no AI dashboard look" constraint instead of the shared
 * neutral palette already used elsewhere in this node.
 */
export function TableNode({ data }: NodeProps<TableNodeType>) {
  const { table } = data

  const sortedColumns = [...table.columns].sort(
    (a, b) => a.ordinal_position - b.ordinal_position
  )

  const columnConstraints = buildColumnConstraintMap(table.constraints)

  return (
    <div className="min-w-[220px] rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-700 px-3 py-2">
        <span className="text-sm font-medium">{table.name}</span>

        {table.schema_name && (
          <span className="rounded border border-neutral-600 px-1.5 py-0.5 font-mono text-[11px] text-neutral-400">
            {table.schema_name}
          </span>
        )}
      </div>

      <div className="divide-y divide-neutral-800">
        {sortedColumns.map((column) => {
          const flags = columnConstraints.get(column.name)

          return (
            <div
              key={column.id}
              className="flex items-center justify-between gap-3 px-3 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs text-neutral-200">
                {flags?.isPrimaryKey && (
                  <KeyRound
                    className="h-3 w-3 shrink-0 text-neutral-400"
                    aria-label="Primary key"
                  />
                )}
                {flags?.isForeignKey && (
                  <Link2
                    className="h-3 w-3 shrink-0 text-neutral-400"
                    aria-label="Foreign key"
                  />
                )}
                <span className="truncate">{column.name}</span>
              </span>

              <span className="shrink-0 rounded-sm border border-neutral-700 px-1 font-mono text-[10px] uppercase text-neutral-500">
                {column.data_type}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
