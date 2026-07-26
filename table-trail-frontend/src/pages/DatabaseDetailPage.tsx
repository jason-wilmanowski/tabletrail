import { useParams } from 'react-router-dom'
import { useDatabase } from '../hooks/useDatabases'
import { GraphCanvas } from '../features/graph-canvas/GraphCanvas'
import { TableInspectorPanel } from '../features/table-inspector/TableInspectorPanel'
import { SearchInput } from '../features/search-panel/SearchInput'
import { VirtualizedTableList } from '../features/search-panel/VirtualizedTableList'
import { useUiStore } from '../store/uiStore'

/**
 * Route `/database/:id`. Loads the full nested database structure via
 * `useDatabase(id)` and renders it as a plain, temporary representation.
 * As of Step 27, a sidebar (`SearchInput` + `VirtualizedTableList`) is
 * mounted alongside `GraphCanvas`/`TableInspectorPanel` — both of those
 * components existed since Steps 24/26 but were never actually rendered
 * anywhere until now, since no step had explicitly required wiring them
 * in before this one needed a working sidebar-to-graph connection.
 * Clicking a sidebar entry writes `uiStore.selectedTableId`, the same
 * field `TableNode` already writes on click — `GraphCanvas` centers on
 * it and `TableInspectorPanel` opens for it, with no new logic in either.
 *
 * Step 29 removes the raw Tables/Columns/Constraints text dump that lived
 * here since Step 10 — it was always meant as a temporary way to validate
 * the data flow before the graph existed, and now duplicates exactly what
 * the graph, sidebar and inspector already show, in a plain bullet-list
 * form that doesn't belong in the finished dark theme.
 */
export function DatabaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const databaseId = Number(id)

  const { data, isLoading, error } = useDatabase(databaseId)
  const setSelectedTableId = useUiStore((state) => state.setSelectedTableId)

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-display">Database Detail</h1>
        <p className="text-body mt-2">Loading database...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-display">Database Detail</h1>
        <p className="mt-2 text-sm text-danger">{error.message}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="p-6">
      <h1 className="text-display">{data.name}</h1>
      <p className="text-body mt-1">
        Type: <span className="text-technical-muted">{data.db_type}</span> · Host:{' '}
        <span className="text-technical-muted">
          {data.host}:{data.port}
        </span>{' '}
        · DB: <span className="text-technical-muted">{data.db_name}</span>
      </p>

      <p className="text-body mb-4 mt-1">Tables: {data.tables.length}</p>

      <div className="flex h-[500px] w-full rounded-md border border-border">
        <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-panel">
          <SearchInput />
          <div className="flex-1 overflow-hidden">
            <VirtualizedTableList
              tables={data.tables}
              onSelectTable={(tableId) => setSelectedTableId(String(tableId))}
            />
          </div>
        </aside>

        <div className="relative flex-1 overflow-hidden bg-background">
          <GraphCanvas tables={data.tables} />
          <TableInspectorPanel tables={data.tables} />
        </div>
      </div>
    </div>
  )
}