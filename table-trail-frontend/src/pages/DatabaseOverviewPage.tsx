import { useNavigate } from 'react-router-dom'
import { Database } from 'lucide-react'
import { useDatabases } from '../hooks/useDatabases'
import { EmptyState } from '../components/ui/EmptyState'

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
      <div className="p-6">
        <h1 className="text-display">Database Overview</h1>
        <p className="text-body mt-2">Loading databases...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-display">Database Overview</h1>
        <p className="mt-2 text-sm text-danger">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-display">Database Overview</h1>

      {data && data.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={Database}
            title="Connect your first database"
            description="Analyze schemas, tables and relations in an interactive database map."
            actionLabel="Connect Database"
            actionTo="/connect"
          />
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="mt-4">
          {data.map((database) => (
            <li key={database.id}>
              <button
                type="button"
                onClick={() => navigate(`/database/${database.id}`)}
                className="flex w-full items-center justify-between border-b border-border py-2 text-left transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span className="text-section">{database.name}</span>
                <span className="text-technical-muted">{database.db_type}</span>
                <span className="text-technical-muted">{database.status}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
