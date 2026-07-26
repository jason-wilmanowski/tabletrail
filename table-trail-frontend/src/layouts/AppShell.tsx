import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Database } from 'lucide-react'

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
  return (
    <aside className="flex w-16 flex-col items-center gap-2 overflow-y-auto border-r border-border bg-panel py-3 md:w-56 md:items-stretch md:px-3">
      <Link
        to="/"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <Database className="h-4 w-4 shrink-0" />
        <span className="text-section hidden md:inline">Databases</span>
      </Link>
    </aside>
  )
}

function Topbar() {
  return (
    <header className="flex h-14 items-center border-b border-border bg-panel px-4">
      <Link to="/" className="text-section">
        TableTrail
      </Link>
    </header>
  )
}
