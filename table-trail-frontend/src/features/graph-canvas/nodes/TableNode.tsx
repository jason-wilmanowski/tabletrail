import type { NodeProps } from '@xyflow/react'
import type { TableNodeType } from '../../../utils/tablesToNodes'

/**
 * Custom React Flow node representing a single database table.
 *
 * Step 14 added the header (table name + schema badge). Step 15 adds the
 * column list below it — name and data type per column, sorted by
 * `ordinal_position` to match the real database structure (not
 * alphabetical). Still no PK/FK icons, constraints, or collapse/expand —
 * those are Steps 16/17.
 *
 * Visual style follows the TableTrail design constraints: dense but not
 * cluttered, thin dividers between rows instead of a card per column,
 * monospace for the technical values (name + type), no icons or color
 * yet.
 */
export function TableNode({ data }: NodeProps<TableNodeType>) {
  const { table } = data

  const sortedColumns = [...table.columns].sort(
    (a, b) => a.ordinal_position - b.ordinal_position
  )

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
        {sortedColumns.map((column) => (
          <div
            key={column.id}
            className="flex items-center justify-between gap-3 px-3 py-1.5"
          >
            <span className="font-mono text-xs text-neutral-200">{column.name}</span>
            <span className="shrink-0 rounded-sm border border-neutral-700 px-1 font-mono text-[10px] uppercase text-neutral-500">
              {column.data_type}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
