import { useNavigate } from 'react-router-dom'
import { Database, Network, History, Sparkles, ArrowRight } from 'lucide-react'
import { useDatabases } from '../hooks/useDatabases'

const FEATURES = [
  {
    icon: Database,
    title: 'Database Visualization',
    description: 'Explore tables, schemas and relationships visually.',
  },
  {
    icon: Network,
    title: 'Dependency Mapping',
    description: 'Understand foreign keys and system dependencies.',
  },
  {
    icon: History,
    title: 'Legacy Analysis',
    description: 'Analyze complex existing systems faster.',
  },
  {
    icon: Sparkles,
    title: 'AI Assistance',
    description: 'Future AI-powered explanations and database insights.',
  },
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

  if (!hasDatabases) {
    return (
      <div className="flex h-full items-center justify-center overflow-y-auto p-6">
        <div className="max-w-md">
          <h1 className="text-display">Understand your databases visually</h1>
          <p className="text-body mt-3">
            Explore database schemas, relationships and dependencies through an
            interactive visual map. Understand complex systems faster and onboard
            developers efficiently.
          </p>

          <button
            type="button"
            onClick={() => navigate('/connect')}
            className="mt-5 flex items-center gap-1.5 rounded-md border border-border bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Connect your first database
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-section">{title}</p>
                  <p className="text-body">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-display">Connected Databases</h1>

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
    </div>
  )
}
