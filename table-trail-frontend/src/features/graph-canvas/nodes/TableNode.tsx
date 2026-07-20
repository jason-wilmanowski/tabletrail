import { useState } from 'react'
import { KeyRound, Link2, ChevronDown, ChevronUp } from 'lucide-react'
import type { NodeProps } from '@xyflow/react'
import type { TableNodeType } from '../../../utils/tablesToNodes'
import { buildColumnConstraintMap } from '../../../utils/constraintGrouping'

/**
 * Tables with more columns than this are collapsed to the first N by
 * default. Chosen to match the layout estimate in `layoutAlgorithm.ts`,
 * which already reserves space for the *full* column count regardless of
 * collapse state — so expanding a node never causes it to overlap its
 * neighbors.
 */
const COLLAPSE_THRESHOLD = 15

/**
 * Custom React Flow node representing a single database table.
 *
 * Step 14 added the header. Step 15 added the column list. Step 16 added
 * PK/FK indicators. Step 17 adds collapse/expand for tables with more
 * than `COLLAPSE_THRESHOLD` columns — a small text+chevron toggle, not an
 * accordion card, kept consistent with the dense, technical style of the
 * rest of the node.
 *
 * Expand state is local `useState`, not global (Zustand) or per-app
 * state: it only ever affects this one node's own rendering, nothing
 * else in the application needs to know or react to it.
 */
export function TableNode({ data }: NodeProps<TableNodeType>) {
  const { table } = data
  const [isExpanded, setIsExpanded] = useState(false)

  const sortedColumns = [...table.columns].sort(
    (a, b) => a.ordinal_position - b.ordinal_position
  )

  const columnConstraints = buildColumnConstraintMap(table.constraints)

  const hasMore = sortedColumns.length > COLLAPSE_THRESHOLD
  const visibleColumns =
    hasMore && !isExpanded ? sortedColumns.slice(0, COLLAPSE_THRESHOLD) : sortedColumns
  const hiddenCount = sortedColumns.length - COLLAPSE_THRESHOLD

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
        {visibleColumns.map((column) => {
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

      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="nodrag flex w-full items-center justify-center gap-1 border-t border-neutral-800 py-1 font-mono text-[10px] text-neutral-500 transition-colors hover:text-neutral-300"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />+{hiddenCount} more
            </>
          )}
        </button>
      )}
    </div>
  )
}
