import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDatabase, useDeleteDatabase, useRescanDatabase } from '../hooks/useDatabases'
import { GraphCanvas } from '../features/graph-canvas/GraphCanvas'
import { TableInspectorPanel } from '../features/table-inspector/TableInspectorPanel'
import { SearchInput } from '../features/search-panel/SearchInput'
import { VirtualizedTableList } from '../features/search-panel/VirtualizedTableList'
import { EditDatabaseModal } from '../features/database-detail/EditDatabaseModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useUiStore } from '../store/uiStore'

const INFO_ROWS = ['db_type', 'host', 'port', 'db_name'] as const
const INFO_LABELS: Record<(typeof INFO_ROWS)[number], string> = {
  db_type: 'Type',
  host: 'Host',
  port: 'Port',
  db_name: 'Database',
}

export function DatabaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const databaseId = Number(id)
  const navigate = useNavigate()

  const { data, isLoading, error } = useDatabase(databaseId)
  const setSelectedTableId = useUiStore((state) => state.setSelectedTableId)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isRescanConfirmOpen, setIsRescanConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const rescanDatabaseMutation = useRescanDatabase(databaseId)
  const deleteDatabaseMutation = useDeleteDatabase()

  function handleRescanConfirm() {
    if (!data) return
    rescanDatabaseMutation.mutate(
      {
        name: data.name,
        db_type: data.db_type,
        host: data.host,
        port: data.port,
        db_name: data.db_name,
        username: data.username,
        password: data.password,
      },
      { onSuccess: () => setIsRescanConfirmOpen(false) }
    )
  }

  function handleDeleteConfirm() {
    deleteDatabaseMutation.mutate(databaseId, {
      onSuccess: () => {
        setIsDeleteConfirmOpen(false)
        navigate('/')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-display">Database Detail</h1>
        <p className="text-body mt-2">Loading database...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-display">Database Detail</h1>
        <p className="mt-2 text-sm text-danger">{error.message}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="flex h-full">
      <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-panel">
        <div className="border-b border-border p-4">
          <p className="text-section truncate">{data.name}</p>

          <div className="mt-3 space-y-1.5">
            {INFO_ROWS.map((key) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="text-label">{INFO_LABELS[key]}</span>
                <span className="text-technical truncate">{data[key]}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="mt-4 w-full rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Edit Details
          </button>
        </div>

        <SearchInput />

        <div className="flex-1 overflow-hidden">
          <VirtualizedTableList
            tables={data.tables}
            onSelectTable={(tableId) => setSelectedTableId(String(tableId))}
          />
        </div>

        <div className="space-y-2 border-t border-border p-3">
          <button
            type="button"
            onClick={() => setIsRescanConfirmOpen(true)}
            className="w-full rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Rescan Database
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="w-full rounded-md border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Delete Database
          </button>
        </div>
      </aside>

      <div className="relative flex-1 overflow-hidden bg-background">
        <GraphCanvas tables={data.tables} />
        <TableInspectorPanel tables={data.tables} />
      </div>

      {isEditOpen && (
        <EditDatabaseModal database={data} onClose={() => setIsEditOpen(false)} />
      )}

      {isRescanConfirmOpen && (
        <ConfirmDialog
          title="Rescan this database?"
          confirmLabel="Yes"
          pendingLabel="Rescanning..."
          isPending={rescanDatabaseMutation.isPending}
          errorMessage={rescanDatabaseMutation.error?.message}
          onConfirm={handleRescanConfirm}
          onCancel={() => setIsRescanConfirmOpen(false)}
        />
      )}

      {isDeleteConfirmOpen && (
        <ConfirmDialog
          title="Delete this database?"
          confirmLabel="Yes"
          pendingLabel="Deleting..."
          isPending={deleteDatabaseMutation.isPending}
          errorMessage={deleteDatabaseMutation.error?.message}
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      )}
    </div>
  )
}
