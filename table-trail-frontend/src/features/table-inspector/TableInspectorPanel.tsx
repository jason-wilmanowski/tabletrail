import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import type { TableResponse } from '../../types/table'

interface TableInspectorPanelProps {
  /** Already-loaded tables (same data GraphCanvas renders) — this panel
   * does not fetch anything itself, it only looks up the table matching
   * the currently selected id. */
  tables: TableResponse[]
}

/**
 * Slide-in panel showing details for the currently selected table.
 *
 * Step 21 added the foundation (open/close, header with name). Step 22
 * adds a full column list below it — name, data type, nullability and
 * default value per column, sorted by `ordinal_position` (same ordering
 * rule as `TableNode`'s column list, kept consistent across the app).
 * Step 23 adds a constraints section the same way, Step 24 wraps both
 * sections in tabs without touching this open/close/selection wiring.
 *
 * Deliberately compact rows (name + type on one line, nullable + default
 * on a smaller muted line below) rather than a card per column — this is
 * meant to be scanned quickly, not browsed like a dashboard list.
 */
export function TableInspectorPanel({ tables }: TableInspectorPanelProps) {
  const selectedTableId = useUiStore((state) => state.selectedTableId)
  const setSelectedTableId = useUiStore((state) => state.setSelectedTableId)

  const isOpen = selectedTableId !== null
  const selectedTable = tables.find((table) => String(table.id) === selectedTableId)

  const isVisible = isOpen && Boolean(selectedTable)

  const sortedColumns = selectedTable
    ? [...selectedTable.columns].sort((a, b) => a.ordinal_position - b.ordinal_position)
    : []

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelectedTableId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setSelectedTableId])

  return (
    <aside
      className={`absolute right-0 top-0 flex h-full w-72 flex-col border-l border-neutral-700 bg-neutral-900 text-neutral-100 shadow-none transition-transform duration-200 ease-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {selectedTable && (
        <>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-700 px-3 py-2">
            <span className="text-sm font-medium">{selectedTable.name}</span>

            <button
              type="button"
              onClick={() => setSelectedTableId(null)}
              className="rounded-sm p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
              aria-label="Close inspector"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-y-auto">
            {sortedColumns.length === 0 ? (
              <p className="px-3 py-3 font-mono text-[11px] text-neutral-600">
                No columns
              </p>
            ) : (
              sortedColumns.map((column) => (
                <div
                  key={column.id}
                  className="flex items-start gap-2 border-b border-neutral-800 px-3 py-2"
                >
                  <span className="w-4 shrink-0 pt-0.5 text-right font-mono text-[10px] text-neutral-600">
                    {column.ordinal_position}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs text-neutral-200">
                        {column.name}
                      </span>
                      <span className="shrink-0 rounded-sm border border-neutral-700 px-1 font-mono text-[10px] uppercase text-neutral-500">
                        {column.data_type}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-3 font-mono text-[10px] text-neutral-500">
                      <span>{column.is_nullable ? 'NULL' : 'NOT NULL'}</span>
                      <span>Default: {column.default_value ?? '—'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </aside>
  )
}
