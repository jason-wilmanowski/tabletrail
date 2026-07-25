import type { ReactNode } from 'react'

interface AppShellProps {
  /** Rendered inside the main canvas area — where GraphCanvas will mount later. */
  children?: ReactNode
}

/**
 * Static structural layout for the whole application. Purely structural —
 * no data, no interactivity, no final visual design. Later steps mount
 * real content into the three regions below without changing this
 * structure itself.
 *
 * Layout: a top row (Topbar) spanning full width, and a second row split
 * into a fixed-width Sidebar and a flexible Canvas area that takes up all
 * remaining space.
 */
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

/**
 * Placeholder for later database navigation, table search and filters
 * (Steps 24–27). Fixed width for now, collapsible behavior wired in
 * a later step via uiStore's `sidebarCollapsed`.
 */
function Sidebar() {
  return (
    <aside className="w-16 overflow-y-auto border-r border-border bg-panel md:w-64">
      {/* Table list, search input and schema filters mount here later */}
    </aside>
  )
}

/**
 * Placeholder for later navigation, actions and database info
 * (breadcrumbs, rescan button).
 */
function Topbar() {
  return (
    <header className="flex h-14 items-center border-b border-border bg-panel px-4">
      {/* Database title, rescan button and breadcrumbs mount here later */}
    </header>
  )
}
