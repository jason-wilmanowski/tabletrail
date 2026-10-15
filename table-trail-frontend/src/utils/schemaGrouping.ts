import type { TableResponse } from '../types/table'
import type { TableNodeType } from './tablesToNodes'
import { NODE_WIDTH, estimateNodeHeight } from './layoutAlgorithm'

/** Horizontal distance between the arranged group and the rest of the graph. */
const GROUP_OFFSET_X = 200
/** Gaps between tables inside the arranged group — loose enough to keep it readable. */
const GROUP_COLUMN_GAP = 80
const GROUP_ROW_GAP = 60

export interface SchemaSummary {
  /** `null` for tables without a schema (nullable on the backend). */
  schemaName: string | null
  tableCount: number
}

/**
 * Lists every schema present in `tables` with its table count, sorted
 * alphabetically with the no-schema group last — same ordering as the
 * sidebar's `VirtualizedTableList`.
 */
export function listSchemas(tables: TableResponse[]): SchemaSummary[] {
  const counts = new Map<string | null, number>()
  for (const table of tables) {
    counts.set(table.schema_name, (counts.get(table.schema_name) ?? 0) + 1)
  }

  return Array.from(counts, ([schemaName, tableCount]) => ({ schemaName, tableCount })).sort((a, b) => {
    if (a.schemaName === null) return 1
    if (b.schemaName === null) return -1
    return a.schemaName.localeCompare(b.schemaName)
  })
}

/**
 * Real rendered size when React Flow has measured the node already, the
 * same estimate `layoutAlgorithm` uses otherwise (`onlyRenderVisibleElements`
 * means off-screen nodes may never have been measured).
 */
function nodeSize(node: TableNodeType): { width: number; height: number } {
  return {
    width: node.measured?.width ?? NODE_WIDTH,
    height: node.measured?.height ?? estimateNodeHeight(node),
  }
}

/**
 * Moves every table of `schemaName` into one grid-shaped block to the
 * right of all other tables, top-aligned with them. The grid is roughly
 * square (`ceil(sqrt(n))` columns), sorted by table name, and each column/
 * row is as wide/tall as its largest table plus a fixed gap, so tables
 * never overlap and the block stays readable.
 *
 * Returns a new node array; nodes of other schemas are returned unchanged.
 * If the schema is the only one in the graph, the block starts at the
 * schema's own current top-left corner instead.
 */
export function arrangeSchemaGroup(nodes: TableNodeType[], schemaName: string | null): TableNodeType[] {
  const groupNodes = nodes
    .filter((node) => node.data.table.schema_name === schemaName)
    .sort((a, b) => a.data.table.name.localeCompare(b.data.table.name))
  if (groupNodes.length === 0) {
    return nodes
  }
  const otherNodes = nodes.filter((node) => node.data.table.schema_name !== schemaName)

  let originX: number
  let originY: number
  if (otherNodes.length > 0) {
    originX = Math.max(...otherNodes.map((node) => node.position.x + nodeSize(node).width)) + GROUP_OFFSET_X
    originY = Math.min(...otherNodes.map((node) => node.position.y))
  } else {
    originX = Math.min(...groupNodes.map((node) => node.position.x))
    originY = Math.min(...groupNodes.map((node) => node.position.y))
  }

  const columnCount = Math.ceil(Math.sqrt(groupNodes.length))
  const rowCount = Math.ceil(groupNodes.length / columnCount)
  const columnWidths = new Array<number>(columnCount).fill(0)
  const rowHeights = new Array<number>(rowCount).fill(0)
  groupNodes.forEach((node, index) => {
    const { width, height } = nodeSize(node)
    const column = index % columnCount
    const row = Math.floor(index / columnCount)
    columnWidths[column] = Math.max(columnWidths[column], width)
    rowHeights[row] = Math.max(rowHeights[row], height)
  })

  const positions = new Map<string, { x: number; y: number }>()
  groupNodes.forEach((node, index) => {
    const column = index % columnCount
    const row = Math.floor(index / columnCount)
    const x = originX + columnWidths.slice(0, column).reduce((sum, width) => sum + width + GROUP_COLUMN_GAP, 0)
    const y = originY + rowHeights.slice(0, row).reduce((sum, height) => sum + height + GROUP_ROW_GAP, 0)
    positions.set(node.id, { x, y })
  })

  return nodes.map((node) => {
    const position = positions.get(node.id)
    return position ? { ...node, position } : node
  })
}
