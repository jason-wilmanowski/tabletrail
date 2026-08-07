import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Database, Plus, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useDatabases } from '../hooks/useDatabases'
import { useUiStore } from '../store/uiStore'
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

const NAV_ITEM_CLASSES =
  'flex w-full items-center justify-start gap-2.5 rounded-md px-2.5 py-2 text-foreground/75 transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring'

function Sidebar() {
  const { data } = useDatabases()
  const navigate = useNavigate()
  const setPreviewDatabaseId = useUiStore((state) => state.setPreviewDatabaseId)
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed)

  return (
    <aside
      className={`flex flex-col gap-2 overflow-y-auto border-r border-border bg-panel py-3 transition-all ${
        collapsed ? 'w-[55px] items-center px-1.5' : 'w-[198px] items-stretch px-3'
      }`}
    >
      <div className={`flex w-full items-center ${collapsed ? 'justify-center' : 'gap-1'}`}>
        {!collapsed && (
          <Link to="/" className={NAV_ITEM_CLASSES}>
            <Database className="h-[18px] w-[18px] shrink-0" />
            <span className="text-section text-base">Databases</span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => setSidebarCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="shrink-0 rounded-md p-1.5 text-foreground/75 transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {!collapsed && data && data.length > 0 && (
        <div
          className="mt-1 flex w-full flex-col gap-0.5"
          onMouseLeave={() => setPreviewDatabaseId(null)}
        >
          {data.map((database) => (
            <button
              key={database.id}
              type="button"
              onClick={() => navigate(`/database/${database.id}`)}
              onMouseEnter={() => setPreviewDatabaseId(database.id)}
              className={NAV_ITEM_CLASSES}
              title={database.name}
            >
              <DatabaseTypeIcon type={database.db_type} className="h-5 w-5 shrink-0" />
              <span className="text-technical block max-w-[140px] truncate text-left text-[17px]">
                {database.name}
              </span>
            </button>
          ))}
        </div>
      )}

      <Link
        to="/settings"
        title="Settings"
        className={collapsed ? 'mt-auto rounded-md p-1.5 text-foreground/75 transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring' : `mt-auto ${NAV_ITEM_CLASSES}`}
      >
        <Settings className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="text-section text-base">Settings</span>}
      </Link>
    </aside>
  )
}

function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-panel px-4">
      <Link to="/welcome" className="text-lg font-bold tracking-tight text-foreground">
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
