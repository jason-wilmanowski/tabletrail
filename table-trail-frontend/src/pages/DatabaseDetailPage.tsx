import { useParams } from 'react-router-dom'
import { useDatabase } from '../hooks/useDatabases'

/**
 * Route `/database/:id`. Loads the full nested database structure via
 * `useDatabase(id)` and renders it as a plain, temporary representation —
 * this validates the data flow end-to-end before Step 11 replaces the
 * body with the React Flow canvas.
 */
export function DatabaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const databaseId = Number(id)

  const { data, isLoading, error } = useDatabase(databaseId)

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
