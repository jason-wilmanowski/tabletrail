import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { TableResponse } from '../../types/table'

interface VirtualizedTableListProps {
  tables: TableResponse[]
  /**
   * Optional callback fired when a row is clicked. Deliberately a plain
   * prop, not a direct `useUiStore` call inside this component — this
   * list has no opinion on what "selecting a table" should do (open the
   * inspector? center the graph? both, later in Step 27?). That decision
   * stays with whoever mounts this list, keeping this component free of
   * global state per the architecture rules for this step.
   */
  onSelectTable?: (tableId: number) => void
}

/** Estimated row height in px — used by the virtualizer to compute
 * scroll offsets before rows are actually measured. Rows are simple
 * single-line entries in this step (name + schema), so a fixed estimate
 * is accurate enough; no per-row measurement needed. */
const ESTIMATED_ROW_HEIGHT = 32

/**
 * Performant, virtualized list of a database's tables — only the rows
 * currently in the scroll viewport (plus a small overscan buffer) exist
 * in the DOM, regardless of how many tables the database actually has.
 *
 * Step 24 scope: rendering + virtualization only, no search or filter
 * logic (Steps 25/26), no keyboard navigation, no store wiring. Receives
 * `tables` as a prop — no data fetching, no API calls, consistent with
 * every other presentational component in this codebase (`TableNode`,
 * `TableInspectorPanel`).
 *
 * Built on `@tanstack/react-virtual` rather than a hand-rolled windowing
 * implementation — virtualization has enough edge cases (scroll sync,
 * resize handling, overscan tuning) that reimplementing it would be
 * exactly the kind of "Eigenimplementierung" this step explicitly avoids.
 */
export function VirtualizedTableList({ tables, onSelectTable }: VirtualizedTableListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: tables.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 8,
  })

  if (tables.length === 0) {
    return (
      <div className="px-3 py-3 font-mono text-[11px] text-neutral-600">No tables</div>
    )
  }

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div
        style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const table = tables[virtualRow.index]

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => onSelectTable?.(table.id)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex items-center gap-2 border-b border-neutral-800 px-3 text-left font-mono text-xs text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              <span className="truncate">{table.name}</span>

              {table.schema_name && (
                <span className="ml-auto shrink-0 text-[10px] text-neutral-600">
                  {table.schema_name}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
