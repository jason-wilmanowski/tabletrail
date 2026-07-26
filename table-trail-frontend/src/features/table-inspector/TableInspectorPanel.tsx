import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { groupConstraintsByType } from '../../utils/constraintGrouping'
import type { TableResponse } from '../../types/table'
import type { ConstraintResponse } from '../../types/constraint'

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
 * added the column list. Step 23 adds a constraints section below it,
 * grouped by `constraint_type` via `groupConstraintsByType()`
 * (src/utils/constraintGrouping.ts) — the same utility file that already
 * held `buildColumnConstraintMap` for Step 16's PK/FK icons, extended
 * rather than duplicated. Step 24 wraps both sections in tabs without
 * touching this open/close/selection wiring.
 *
 * Deliberately compact rows (name + type on one line, nullable + default
 * on a smaller muted line below) rather than a card per column — this is
 * meant to be scanned quickly, not browsed like a dashboard list. Same
 * principle applied to constraint groups: a small muted type heading
 * followed by a tight list, not a card per constraint.
 *
 * Step 30 switches every ad-hoc `font-mono` class here to the shared
 * typography classes from index.css. One correction along the way: empty
 * states ("No columns"/"No constraints") moved from a mono class to
 * `.text-body` — they're UI prose describing an app state, not literal
 * database data, so they shouldn't have been monospace in the first
 * place. Data type badges also stopped forcing `uppercase`, matching the
 * same fix in `TableNode`.
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

  const groupedConstraints = selectedTable
    ? groupConstraintsByType(selectedTable.constraints)
    : new Map<string, ConstraintResponse[]>()

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
      className={`absolute right-0 top-0 flex h-full w-72 flex-col border-l border-border bg-panel text-foreground shadow-none transition-transform duration-200 ease-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {selectedTable && (
        <>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
            <span className="text-section">{selectedTable.name}</span>

            <button
              type="button"
              onClick={() => setSelectedTableId(null)}
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Close inspector"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-y-auto">
            <p className="text-label px-3 pt-2">Columns</p>

            {sortedColumns.length === 0 ? (
              <p className="text-body px-3 py-3">No columns</p>
            ) : (
              sortedColumns.map((column) => (
                <div
                  key={column.id}
                  className="flex items-start gap-2 border-b border-border px-3 py-2"
                >
                  <span className="text-technical-muted w-4 shrink-0 pt-0.5 text-right">
                    {column.ordinal_position}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-technical truncate">{column.name}</span>
                      <span className="text-technical-muted shrink-0 rounded-sm border border-border px-1">
                        {column.data_type}
                      </span>
                    </div>

                    <div className="text-technical-muted mt-0.5 flex items-center gap-3">
                      <span>{column.is_nullable ? 'NULL' : 'NOT NULL'}</span>
                      <span>Default: {column.default_value ?? '—'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            <p className="text-label px-3 pt-3">Constraints</p>

            {groupedConstraints.size === 0 ? (
              <p className="text-body px-3 py-3">No constraints</p>
            ) : (
              Array.from(groupedConstraints.entries()).map(([type, constraints]) => (
                <div key={type} className="border-b border-border px-3 py-2">
                  <p className="text-technical-muted">{type}</p>

                  <div className="mt-1 space-y-1">
                    {constraints.map((constraint) => {
                      const referencedTable =
                        constraint.constraint_type === 'FOREIGN KEY'
                          ? tables.find(
                              (table) => table.id === constraint.references_table_id
                            )
                          : undefined

                      return (
                        <div key={constraint.id} className="text-technical">
                          <span>{constraint.constraint_name}</span>
                          {referencedTable && (
                            <span className="ml-1.5 text-muted-foreground">
                              → {referencedTable.name}
                            </span>
                          )}
                        </div>
                      )
                    })}
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