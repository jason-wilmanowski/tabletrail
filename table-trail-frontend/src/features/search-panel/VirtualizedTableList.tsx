import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useFilterStore } from '../../store/filterStore'
import { useUiStore } from '../../store/uiStore'
import type { TableResponse } from '../../types/table'

interface VirtualizedTableListProps {
  tables: TableResponse[]
  /**
   * Optional callback fired when a table row is clicked. Deliberately a
   * plain prop, not a direct `useUiStore` call inside this component —
   * this list has no opinion on what "selecting a table" should do (open
   * the inspector? center the graph? both, later in Step 27?). That
   * decision stays with whoever mounts this list, keeping this component
   * free of global state per the architecture rules for this step.
   */
  onSelectTable?: (tableId: number) => void
}

/** Label used when a table has no `schema_name` (nullable on the
 * backend) — grouped together instead of being dropped or crashing. */
const UNKNOWN_SCHEMA_LABEL = '(no schema)'

/**
 * A single row in the flattened, virtualized list — either a schema
 * section header or a table entry. Virtualizing a flat array of these
 * (rather than one loop per schema group) is what keeps grouping and
 * virtualization compatible: `useVirtualizer` needs one continuous,
 * indexable list to compute scroll offsets from, it has no built-in
 * concept of "groups".
 */
type ListRow =
  | { type: 'header'; schemaName: string }
  | { type: 'table'; table: TableResponse }

/**
 * Groups tables by `schema_name` and flattens the result into a single
 * `ListRow[]` — a header row followed by its tables, repeated per group.
 * Groups are ordered alphabetically by schema name (unknown-schema tables
 * last) so the list reads consistently regardless of the order tables
 * happen to arrive in from the backend; tables within a group keep their
 * original relative order (no per-table sorting requested for this step).
 */
function groupTablesBySchema(tables: TableResponse[]): ListRow[] {
  const groups = new Map<string, TableResponse[]>()

  for (const table of tables) {
    const schemaName = table.schema_name ?? UNKNOWN_SCHEMA_LABEL
    const group = groups.get(schemaName) ?? []
    group.push(table)
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
    for (const table of groups.get(schemaName)!) {
      rows.push({ type: 'table', table })
    }
  }

  return rows
}

/** Estimated row heights in px — header rows are shorter than table rows.
 * Rows are simple single-line entries in this step, so fixed estimates
 * per type are accurate enough; no per-row measurement needed. */
const HEADER_ROW_HEIGHT = 24
const TABLE_ROW_HEIGHT = 32

/**
 * Performant, virtualized, schema-grouped, searchable list of a
 * database's tables — only the rows currently in the scroll viewport
 * (plus a small overscan buffer) exist in the DOM, regardless of how many
 * tables or schemas the database actually has.
 *
 * Step 24 established plain virtualization. Step 25 added schema
 * grouping. Step 26 adds client-side filtering: reads `searchQuery` from
 * `filterStore` (written by `SearchInput`, which contains no filter logic
 * itself) and filters `tables` by name — case-insensitive substring match
 * — *before* grouping, so `groupTablesBySchema()` and the virtualizer
 * configuration don't need to know filtering exists at all. Filtering
 * happens inside the same `useMemo` that already recomputed grouping on
 * `tables` changes, now also re-running when `searchQuery` changes; no
 * extra render passes.
 *
 * Step 29 adds a read-only selected-row highlight via `uiStore.selectedTableId`
 * — reading it (not writing) to mirror the same `accent`-based selection
 * state now shown on `TableNode`, so a table selected via the sidebar
 * looks selected in the sidebar too, not just in the graph.
 *
 * Step 30 moves everything onto the shared typography classes. The
 * schema group header stopped forcing `uppercase`: it displays a literal
 * `schema_name` value, same as the schema badge in `TableNode`, and that
 * one already preserves real case — this brings the two into agreement
 * instead of showing the same identifier differently in two places.
 * Empty states ("No tables"/"No matching tables") moved to `.text-body`
 * since they're UI messages, not database data.
 */
export function VirtualizedTableList({ tables, onSelectTable }: VirtualizedTableListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const searchQuery = useFilterStore((state) => state.searchQuery)
  const selectedTableId = useUiStore((state) => state.selectedTableId)

  const filteredTables = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (query === '') {
      return tables
    }
    return tables.filter((table) => table.name.toLowerCase().includes(query))
  }, [tables, searchQuery])

  const rows = useMemo(() => groupTablesBySchema(filteredTables), [filteredTables])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) =>
      rows[index].type === 'header' ? HEADER_ROW_HEIGHT : TABLE_ROW_HEIGHT,
    overscan: 8,
  })

  if (tables.length === 0) {
    return <div className="text-body px-3 py-3">No tables</div>
  }

  if (filteredTables.length === 0) {
    return <div className="text-body px-3 py-3">No matching tables</div>
  }

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div
        style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}
      >
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
                className="text-technical-muted flex items-end px-3 pb-1"
              >
                {row.schemaName}
              </div>
            )
          }

          const { table } = row
          const isSelected = selectedTableId === String(table.id)

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => onSelectTable?.(table.id)}
              style={style}
              className={`text-technical flex items-center gap-2 border-b border-border border-l-2 px-3 text-left transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset ${
                isSelected ? 'border-l-accent bg-surface-hover' : 'border-l-transparent'
              }`}
            >
              <span className="truncate">{table.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}