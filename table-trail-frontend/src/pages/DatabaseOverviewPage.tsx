import { useNavigate } from 'react-router-dom'
import {
  Database,
  Network,
  Layers,
  Sparkles,
  Download,
  Boxes,
  ArrowRight,
} from 'lucide-react'
import { useDatabases } from '../hooks/useDatabases'

const FEATURES = [
  {
    icon: Database,
    title: 'Database Visualization',
    description: 'Explore tables, schemas and relationships visually.',
  },
  {
    icon: Layers,
    title: 'Schema Explorer',
    description: 'Browse tables, columns and constraints in detail.',
  },
  {
    icon: Network,
    title: 'Relationship Graph',
    description: 'Understand foreign keys and system dependencies.',
  },
  {
    icon: Sparkles,
    title: 'AI Assistance',
    description: 'AI-powered explanations of tables and relations.',
  },
  {
    icon: Download,
    title: 'Export',
    description: 'Export diagrams for documentation and sharing.',
  },
  {
    icon: Boxes,
    title: 'Multi Database Support',
    description: 'PostgreSQL, MySQL and MariaDB in one tool.',
  },
]

const ROADMAP = [
  'AI Database Editing',
  'Documentation Generation',
  'Additional Database Systems',
]

export function DatabaseOverviewPage() {
  const { data, isLoading, error } = useDatabases()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-body">Loading databases...</p>
        </div>
      </div>
    )
  }

  const hasDatabases = !error && data && data.length > 0

  if (hasDatabases) {
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

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-6">
      <div className="max-w-xl">
        <h1 className="text-display">Understand your databases visually</h1>
        <p className="text-body mt-3">
          TableTrail turns complex database schemas into an interactive visual map.
          Explore tables, relationships and dependencies, and onboard developers
          onto unfamiliar systems faster.
        </p>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-label mb-4">Features</p>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-label mb-3">Coming Soon</p>
          <ul className="space-y-1.5">
            {ROADMAP.map((item) => (
              <li key={item} className="text-body">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center">
          <p className="text-section">Start by scanning your first database.</p>
          <button
            type="button"
            onClick={() => navigate('/connect')}
            className="mx-auto mt-4 flex items-center gap-1.5 rounded-md border border-border bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Connect Database
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
