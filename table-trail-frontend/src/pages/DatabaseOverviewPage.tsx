import { useNavigate } from 'react-router-dom'
import { Database, Network, Layers } from 'lucide-react'
import { useDatabases } from '../hooks/useDatabases'
import { EmptyState } from '../components/ui/EmptyState'

const FEATURES = [
  { icon: Database, label: 'Database schema visualization' },
  { icon: Network, label: 'Relationship exploration' },
  { icon: Layers, label: 'Legacy system analysis' },
]

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

  const hasDatabases = data && data.length > 0

  return (
    <div className="p-6">
      {!hasDatabases && (
        <div className="mx-auto max-w-lg py-12">
          <EmptyState
            icon={Database}
            title="Connect your first database"
            description="Understand your database architecture. Explore tables, relations and dependencies through an interactive database map."
            actionLabel="Connect Database"
            actionTo="/connect"
          />

          <ul className="mt-8 space-y-2">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-body">
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasDatabases && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-display">Connected Databases</h1>
            <button
              type="button"
              onClick={() => navigate('/connect')}
              className="rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Connect Database
            </button>
          </div>

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
        </>
      )}
    </div>
  )
}
