import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useFilterStore } from '../../store/filterStore'
import { useUiStore } from '../../store/uiStore'
import type { TableResponse } from '../../types/table'
import { filterColumnsByName } from '../../utils/filterTables'
import type { ColumnMatch } from '../../utils/filterTables'

interface VirtualizedColumnListProps {
  tables: TableResponse[]
  /** Fired with the column's table when a column row is clicked — same contract as `VirtualizedTableList`. */
  onSelectTable?: (tableId: number) => void
}

/** Same label `VirtualizedTableList` uses for tables without a `schema_name`. */
const UNKNOWN_SCHEMA_LABEL = '(no schema)'

type ListRow = { type: 'header'; schemaName: string } | { type: 'column'; match: ColumnMatch }

/**
 * Whether the database spans more than one schema. Decided from *all*
 * tables rather than the current matches, so schema headers don't appear
 * and disappear while typing.
 */
function hasMultipleSchemas(tables: TableResponse[]): boolean {
  return new Set(tables.map((table) => table.schema_name ?? UNKNOWN_SCHEMA_LABEL)).size > 1
}

/**
 * Groups column matches by their table's schema into one flat row list —
 * a header row followed by its matches — so the column list reads like
 * the table list. Schemas are sorted alphabetically (unknown schema last);
 * matches keep their order within a schema. With `showSchemas` off (a
 * single-schema database) the headers carry no information and are left
 * out, leaving just the matches.
 */
function groupMatchesBySchema(matches: ColumnMatch[], showSchemas: boolean): ListRow[] {
  if (!showSchemas) {
    return matches.map((match) => ({ type: 'column', match }))
  }

  const groups = new Map<string, ColumnMatch[]>()

  for (const match of matches) {
    const schemaName = match.table.schema_name ?? UNKNOWN_SCHEMA_LABEL
    const group = groups.get(schemaName) ?? []
    group.push(match)
    groups.set(schemaName, group)
  }

  const schemaNames = Array.from(groups.keys()).sort((a, b) => {
    if (a === UNKNOWN_SCHEMA_LABEL) return 1
    if (b === UNKNOWN_SCHEMA_LABEL) return -1
    return a.localeCompare(b)
  })

  const rows: ListRow[] = []
  for (const schemaName of schemaNames) {
    rows.push({ type: 'header', schemaName })
    for (const match of groups.get(schemaName)!) {
      rows.push({ type: 'column', match })
    }
  }

  return rows
}

const HEADER_ROW_HEIGHT = 26
const COLUMN_ROW_HEIGHT = 32

/**
 * Virtualized sidebar list for the columns search mode: every column whose
 * name matches `filterStore.searchQuery`, with its table shown next to it.
 * Clicking a column selects its table, like clicking a table in
 * `VirtualizedTableList`. Schema headers only appear when the database
 * has more than one schema. With an empty search it shows a hint instead of
 * every column of the database.
 */
export function VirtualizedColumnList({ tables, onSelectTable }: VirtualizedColumnListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const searchQuery = useFilterStore((state) => state.searchQuery)
  const selectedTableId = useUiStore((state) => state.selectedTableId)

  const matches = useMemo(() => filterColumnsByName(tables, searchQuery), [tables, searchQuery])

  const showSchemas = useMemo(() => hasMultipleSchemas(tables), [tables])
  const rows = useMemo(() => groupMatchesBySchema(matches, showSchemas), [matches, showSchemas])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (rows[index].type === 'header' ? HEADER_ROW_HEIGHT : COLUMN_ROW_HEIGHT),
    overscan: 8,
  })

  if (searchQuery.trim() === '') {
    return <div className="text-body px-3 py-3">Type to search columns</div>
  }

  if (matches.length === 0) {
    return <div className="text-body px-3 py-3">No matching columns</div>
  }

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]

          const style = {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }

          if (row.type === 'header') {
            return (
              <div
                key={`header-${row.schemaName}`}
                style={style}
                className="text-label flex items-center justify-center border-b border-border/60 bg-surface/40 px-3 text-center text-foreground/80"
              >
                {row.schemaName}
              </div>
            )
          }

          const { table, column } = row.match
          const isSelected = selectedTableId === String(table.id)

          return (
            <button
              key={column.id}
              type="button"
              onClick={() => onSelectTable?.(table.id)}
              style={style}
              className={`text-technical flex items-center justify-between gap-2 border-b border-border border-l-2 ${showSchemas ? 'pl-6' : 'pl-3'} pr-3 text-left transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset ${
                isSelected ? 'border-l-accent bg-surface-hover' : 'border-l-transparent'
              }`}
            >
              <span className="truncate">{column.name}</span>
              <span className="text-technical-muted shrink-0 truncate">{table.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
