import { useNavigate } from 'react-router-dom'
import { useDatabases } from '../hooks/useDatabases'

/**
 * First functional page of the frontend. Loads all previously scanned
 * databases via the existing `useDatabases()` hook (Step 4) and lets the
 * user pick one to open. Deliberately simple markup — this will be
 * replaced by real design work later without changing the data flow here.
 */
export function DatabaseOverviewPage() {
  const { data, isLoading, error } = useDatabases()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Database Overview</h1>
        <p className="text-sm text-muted-foreground">Loading databases...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Database Overview</h1>
        <p className="text-sm text-danger">{error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Database Overview</h1>

      {data && data.length === 0 && (
        <p className="text-sm text-muted-foreground">No databases scanned yet.</p>
      )}

      <ul>
        {data?.map((database) => (
          <li key={database.id}>
            <button
              type="button"
              onClick={() => navigate(`/database/${database.id}`)}
              className="flex w-full items-center justify-between border-b border-border py-2 text-left"
            >
              <span>{database.name}</span>
              <span className="text-sm text-muted-foreground">{database.db_type}</span>
              <span className="text-sm text-muted-foreground">{database.status}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
