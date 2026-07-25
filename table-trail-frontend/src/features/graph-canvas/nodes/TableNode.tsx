import { useState } from 'react'
import { KeyRound, Link2, ChevronDown, ChevronUp } from 'lucide-react'
import type { NodeProps } from '@xyflow/react'
import type { TableNodeType } from '../../../utils/tablesToNodes'
import { buildColumnConstraintMap } from '../../../utils/constraintGrouping'
import { useUiStore } from '../../../store/uiStore'

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
 * PK/FK indicators. Step 17 added collapse/expand. Step 21 adds selection:
 * clicking the node body sets `selectedTableId` in the shared `uiStore`,
 * which `TableInspectorPanel` reacts to — this component only *triggers*
 * that selection, it doesn't know anything about the inspector itself.
 *
 * Expand state stays local `useState` (only affects this node's own
 * rendering), while selection goes through the global store (affects a
 * different part of the UI entirely) — same distinction the store
 * architecture was designed around back in Step 5.
 */
export function TableNode({ data }: NodeProps<TableNodeType>) {
  const { table } = data
  const [isExpanded, setIsExpanded] = useState(false)
  const setSelectedTableId = useUiStore((state) => state.setSelectedTableId)

  const sortedColumns = [...table.columns].sort(
    (a, b) => a.ordinal_position - b.ordinal_position
  )

  const columnConstraints = buildColumnConstraintMap(table.constraints)

  const hasMore = sortedColumns.length > COLLAPSE_THRESHOLD
  const visibleColumns =
    hasMore && !isExpanded ? sortedColumns.slice(0, COLLAPSE_THRESHOLD) : sortedColumns
  const hiddenCount = sortedColumns.length - COLLAPSE_THRESHOLD

  return (
    <div
      onClick={() => setSelectedTableId(String(table.id))}
      className="min-w-[220px] rounded-md border border-border bg-surface text-foreground"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-medium">{table.name}</span>

        {table.schema_name && (
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {table.schema_name}
          </span>
        )}
      </div>

      <div className="divide-y divide-border">
        {visibleColumns.map((column) => {
          const flags = columnConstraints.get(column.name)

          return (
            <div
              key={column.id}
              className="flex items-center justify-between gap-3 px-3 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs text-foreground">
                {flags?.isPrimaryKey && (
                  <KeyRound
                    className="h-3 w-3 shrink-0 text-muted-foreground"
                    aria-label="Primary key"
                  />
                )}
                {flags?.isForeignKey && (
                  <Link2
                    className="h-3 w-3 shrink-0 text-muted-foreground"
                    aria-label="Foreign key"
                  />
                )}
                <span className="truncate">{column.name}</span>
              </span>

              <span className="shrink-0 rounded-sm border border-border px-1 font-mono text-[10px] uppercase text-muted-foreground">
                {column.data_type}
              </span>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={(event) => {
            // Stop propagation so toggling columns doesn't also trigger
            // node selection (the outer div's onClick above).
            event.stopPropagation()
            setIsExpanded((prev) => !prev)
          }}
          className="nodrag flex w-full items-center justify-center gap-1 border-t border-border py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground"
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
