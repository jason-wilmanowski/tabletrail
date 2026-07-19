import type { NodeProps } from '@xyflow/react'
import type { TableNodeType } from '../../../utils/tablesToNodes'

/**
 * Custom React Flow node representing a single database table.
 *
 * Step 14 scope: header only (table name + schema badge). Deliberately
 * built as a technical diagram element, not a dashboard card — thin
 * border, flat dark surface, no shadow, no heavy rounding, per the
 * TableTrail design constraints (Developer Tool aesthetic, Dark Theme
 * First, borders over shadows).
 *
 * Body content (columns, PK/FK icons, collapse/expand) is added in
 * Steps 15–17 below this header without changing the header markup.
 */
export function TableNode({ data }: NodeProps<TableNodeType>) {
  const { table } = data

  return (
    <div className="min-w-[180px] rounded-md border border-neutral-700 bg-neutral-900 text-neutral-100">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-700 px-3 py-2">
        <span className="text-sm font-medium">{table.name}</span>

        {table.schema_name && (
          <span className="rounded border border-neutral-600 px-1.5 py-0.5 font-mono text-[11px] text-neutral-400">
            {table.schema_name}
          </span>
        )}
      </div>
    </div>
  )
}
