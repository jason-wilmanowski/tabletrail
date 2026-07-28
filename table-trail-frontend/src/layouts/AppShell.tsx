import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Database, Plus, Settings } from 'lucide-react'
import { useDatabases } from '../hooks/useDatabases'
import { DatabaseTypeIcon } from '../features/connection-form/DatabaseTypeIcon'

interface AppShellProps {
  children?: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="grid h-screen grid-rows-[auto_1fr]">
      <Topbar />

      <div className="grid grid-cols-[auto_1fr] overflow-hidden">
        <Sidebar />
        <main className="overflow-hidden">{children}</main>
      </div>
    </div>
  )
}

function Sidebar() {
  const { data } = useDatabases()
  const navigate = useNavigate()

  return (
    <aside className="flex w-16 flex-col items-center gap-2 overflow-y-auto border-r border-border bg-panel py-3 md:w-56 md:items-stretch md:px-3">
      <Link
        to="/"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Database className="h-4 w-4 shrink-0" />
        <span className="text-section hidden md:inline">Databases</span>
      </Link>

      {data && data.length > 0 && (
        <div className="mt-1 flex flex-col gap-0.5">
          {data.map((database) => (
            <button
              key={database.id}
              type="button"
              onClick={() => navigate(`/database/${database.id}`)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title={database.name}
            >
              <DatabaseTypeIcon type={database.db_type} className="h-3.5 w-3.5 shrink-0" />
              <span className="text-technical hidden min-w-0 flex-1 truncate md:block">
                {database.name}
              </span>
            </button>
          ))}
        </div>
      )}

      <Link
        to="/settings"
        title="Settings"
        className="mt-auto flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Settings className="h-4 w-4 shrink-0" />
        <span className="text-section hidden md:inline">Settings</span>
      </Link>
    </aside>
  )
}

function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-panel px-4">
      <Link to="/" className="text-lg font-bold tracking-tight text-foreground">
        TableTrail
      </Link>

      <Link
        to="/connect"
        className="flex items-center gap-1.5 rounded-md border border-border bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Plus className="h-3.5 w-3.5" />
        Connect Database
      </Link>
    </header>
  )
}
