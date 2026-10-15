import { useMemo, useState } from 'react'
import { Group, X } from 'lucide-react'
import { listSchemas } from '../../../utils/schemaGrouping'
import type { TableResponse } from '../../../types/table'

/** Same label the sidebar's `VirtualizedTableList` uses for tables without a schema. */
const UNKNOWN_SCHEMA_LABEL = '(no schema)'

interface SchemaGroupingPanelProps {
  tables: TableResponse[]
  onArrange: (schemaName: string | null) => void
}

/**
 * Small floating trigger for grouping a whole schema at once — same panel
 * behavior (inline, not modal, canvas stays interactive underneath) and
 * trigger styling as `ColumnRelationsPanel`, stacked inside
 * `GraphCanvas`'s shared `flex flex-col` overlay. Lists every schema of
 * the current database; confirming hands the picked one to `onArrange`,
 * which owns the actual node repositioning (this component never touches
 * React Flow state itself).
 */
export function SchemaGroupingPanel({ tables, onArrange }: SchemaGroupingPanelProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  // `undefined` = nothing picked yet; `null` is a real choice (the no-schema group).
  const [selectedSchema, setSelectedSchema] = useState<string | null | undefined>(undefined)
  const schemas = useMemo(() => listSchemas(tables), [tables])

  // A rescan can drop the picked schema — treat that as nothing picked.
  const isSelectionValid = schemas.some((schema) => schema.schemaName === selectedSchema)

  function handleConfirm() {
    if (selectedSchema === undefined || !isSelectionValid) {
      return
    }
    onArrange(selectedSchema)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setIsPanelOpen((prev) => !prev)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-panel text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Group by schema"
      >
        <Group className="h-4 w-4" />
      </button>

      {isPanelOpen && (
        <div className="w-56 rounded-md border border-border bg-panel p-2.5 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-label">Group by schema</span>
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div role="radiogroup" aria-label="Schemas" className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
            {schemas.map(({ schemaName, tableCount }) => {
              const isSelected = schemaName === selectedSchema
              return (
                <button
                  key={schemaName ?? UNKNOWN_SCHEMA_LABEL}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedSchema(schemaName)}
                  className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-left text-sm transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-transparent text-foreground hover:bg-surface-hover'
                  }`}
                >
                  <span className="truncate">{schemaName ?? UNKNOWN_SCHEMA_LABEL}</span>
                  <span className={isSelected ? 'text-accent-foreground' : 'text-muted-foreground'}>
                    {tableCount}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isSelectionValid}
            className="mt-2 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface"
          >
            Arrange schema
          </button>
        </div>
      )}
    </div>
  )
}
