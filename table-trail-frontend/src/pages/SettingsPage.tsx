import { useState } from 'react'
import { NavLink, Navigate, useParams } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { SETTINGS_CATEGORIES, DEFAULT_SETTINGS_CATEGORY_ID } from '../features/settings/settingsRegistry'
import { SettingsView } from '../features/settings/SettingsView'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useSettingsStore } from '../store/settingsStore'

export function SettingsPage() {
  const { categoryId } = useParams()
  const category = SETTINGS_CATEGORIES.find((entry) => entry.id === categoryId)

  const hasChangedSettings = useSettingsStore((state) => Object.keys(state.values).length > 0)
  const resetAll = useSettingsStore((state) => state.resetAll)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  if (!category) {
    return <Navigate to={`/settings/${DEFAULT_SETTINGS_CATEGORY_ID}`} replace />
  }

  function handleResetConfirm() {
    resetAll()
    setIsResetConfirmOpen(false)
  }

  return (
    <div className="flex h-full">
      <nav className="flex w-56 shrink-0 flex-col border-r border-border bg-panel p-2" aria-label="Settings">
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

        {/* Global action, so it lives with the navigation rather than inside one category.
            Disabled while every setting is still at its default. */}
        <div className="mt-auto border-t border-border pt-2">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            disabled={!hasChangedSettings}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4 shrink-0" />
            Reset all settings
          </button>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto">
        <SettingsView category={category} />
      </div>

      {isResetConfirmOpen && (
        <ConfirmDialog
          title="Reset all settings to their defaults?"
          confirmLabel="Yes"
          pendingLabel="Resetting..."
          isPending={false}
          variant="danger"
          onConfirm={handleResetConfirm}
          onCancel={() => setIsResetConfirmOpen(false)}
        />
      )}
    </div>
  )
}
