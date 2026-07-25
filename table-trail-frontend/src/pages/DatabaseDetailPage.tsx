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
 */
export function DatabaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const databaseId = Number(id)

  const { data, isLoading, error } = useDatabase(databaseId)
  const setSelectedTableId = useUiStore((state) => state.setSelectedTableId)

  if (isLoading) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Database Detail</h1>
        <p className="text-sm text-neutral-500">Loading database...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Database Detail</h1>
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">{data.name}</h1>
      <p className="text-sm text-neutral-500">
        Type: {data.db_type} · Host: {data.host}:{data.port} · DB: {data.db_name}
      </p>

      <p className="text-sm text-neutral-500">Tables: {data.tables.length}</p>

      <div className="flex h-[500px] w-full border">
        <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-800">
          <SearchInput />
          <div className="flex-1 overflow-hidden">
            <VirtualizedTableList
              tables={data.tables}
              onSelectTable={(tableId) => setSelectedTableId(String(tableId))}
            />
          </div>
        </aside>

        <div className="relative flex-1 overflow-hidden">
          <GraphCanvas tables={data.tables} />
          <TableInspectorPanel tables={data.tables} />
        </div>
      </div>

      <ul>
        {data.tables.map((table) => (
          <li key={table.id}>
            <h2 className="font-medium">
              {table.schema_name ? `${table.schema_name}.` : ''}
              {table.name}
            </h2>

            <p className="text-sm text-neutral-500">Columns: {table.columns.length}</p>
            <ul>
              {table.columns.map((column) => (
                <li key={column.id} className="text-sm">
                  {column.name} — {column.data_type}
                  {column.is_nullable ? '' : ' · NOT NULL'}
                </li>
              ))}
            </ul>

            <p className="text-sm text-neutral-500">
              Constraints: {table.constraints.length}
            </p>
            <ul>
              {table.constraints.map((constraint) => (
                <li key={constraint.id} className="text-sm">
                  {constraint.constraint_type} — {constraint.constraint_name}
                  {constraint.references_table_id !== null
                    ? ` → table #${constraint.references_table_id}`
                    : ''}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
