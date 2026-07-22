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
 * Step 21 scope: foundation only — open/close behavior and the table
 * name. Steps 22/23 add column and constraint detail sections below the
 * header established here; Step 24 (tabs) will build on top of that
 * without changing this open/close/selection wiring.
 *
 * Visually a flat technical panel (thin border, dark surface) rather
 * than a Material-style drawer with heavy shadow — consistent with the
 * TableTrail design constraints and the rest of the graph UI.
 */
export function TableInspectorPanel({ tables }: TableInspectorPanelProps) {
  const selectedTableId = useUiStore((state) => state.selectedTableId)
  const setSelectedTableId = useUiStore((state) => state.setSelectedTableId)

  const isOpen = selectedTableId !== null
  const selectedTable = tables.find((table) => String(table.id) === selectedTableId)

  const isVisible = isOpen && Boolean(selectedTable)

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
      className={`absolute right-0 top-0 h-full w-72 border-l border-neutral-700 bg-neutral-900 text-neutral-100 shadow-none transition-transform duration-200 ease-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {selectedTable && (
        <div className="flex items-center justify-between gap-2 border-b border-neutral-700 px-3 py-2">
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
      )}
    </aside>
  )
}
