import { NavLink, Navigate, useParams } from 'react-router-dom'
import { SETTINGS_CATEGORIES, DEFAULT_SETTINGS_CATEGORY_ID } from '../features/settings/settingsRegistry'
import { SettingsView } from '../features/settings/SettingsView'

export function SettingsPage() {
  const { categoryId } = useParams()
  const category = SETTINGS_CATEGORIES.find((entry) => entry.id === categoryId)

  if (!category) {
    return <Navigate to={`/settings/${DEFAULT_SETTINGS_CATEGORY_ID}`} replace />
  }

  return (
    <div className="flex h-full">
      <nav className="w-56 shrink-0 border-r border-border bg-panel p-2" aria-label="Settings">
        {SETTINGS_CATEGORIES.map((entry) => {
          const Icon = entry.icon
          return (
            <NavLink
              key={entry.id}
              to={`/settings/${entry.id}`}
              className={({ isActive }) =>
                `flex w-full items-center gap-2 rounded-md border-l-2 px-2 py-1.5 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                  isActive
                    ? 'border-l-accent bg-surface-hover text-foreground'
                    : 'border-l-transparent text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-section">{entry.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="flex-1 overflow-y-auto">
        <SettingsView category={category} />
      </div>
    </div>
  )
}
