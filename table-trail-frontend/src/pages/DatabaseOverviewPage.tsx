import { MousePointer2 } from 'lucide-react'
import { useDatabases, useDatabase } from '../hooks/useDatabases'
import { useUiStore } from '../store/uiStore'
import { useSettingValue } from '../store/settingsStore'
import { GraphCanvas } from '../features/graph-canvas/GraphCanvas'
import { LandingView } from '../features/home/LandingView'
import { DatabaseEmptyState } from '../features/database-detail/DatabaseEmptyState'
import { DatabaseLoadingState } from '../features/database-detail/DatabaseLoadingState'

export function DatabaseOverviewPage() {
  const { data, isLoading, error } = useDatabases()
  const isHoverPreviewEnabled = useSettingValue('general.databaseHoverPreview', true)
  // Ignored while the setting is off, so a hover id left over from before
  // the toggle neither renders nor fetches (`useDatabase(0)` is disabled).
  const previewDatabaseId = useUiStore((state) => (isHoverPreviewEnabled ? state.previewDatabaseId : null))

  const { data: previewData } = useDatabase(previewDatabaseId ?? 0)

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

  if (!hasDatabases) {
    return <LandingView />
  }

  if (previewDatabaseId !== null) {
    // Large databases (e.g. Odoo-scale schemas) can take a few seconds to
    // fetch — without this branch, the preview still shows the "Hover
    // over a database" hint below even though the user is already
    // hovering and a fetch is in flight.
    if (!previewData) {
      return <DatabaseLoadingState />
    }
    return previewData.tables.length > 0 ? (
      <GraphCanvas tables={previewData.tables} databaseId={previewDatabaseId} interactive={false} />
    ) : (
      <DatabaseEmptyState />
    )
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <MousePointer2 className="h-6 w-6 text-muted-foreground" />
        <p className="text-body">
          {isHoverPreviewEnabled ? 'Hover over a database to preview it.' : 'Select a database in the sidebar to open it.'}
        </p>
      </div>
    </div>
  )
}
