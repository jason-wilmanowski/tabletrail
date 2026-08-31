import { MousePointer2 } from 'lucide-react'
import { useDatabases, useDatabase } from '../hooks/useDatabases'
import { useUiStore } from '../store/uiStore'
import { GraphCanvas } from '../features/graph-canvas/GraphCanvas'
import { LandingView } from '../features/home/LandingView'
import { DatabaseEmptyState } from '../features/database-detail/DatabaseEmptyState'

export function DatabaseOverviewPage() {
  const { data, isLoading, error } = useDatabases()
  const previewDatabaseId = useUiStore((state) => state.previewDatabaseId)

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

  if (previewDatabaseId !== null && previewData) {
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
        <p className="text-body">Hover over a database to preview it.</p>
      </div>
    </div>
  )
}
