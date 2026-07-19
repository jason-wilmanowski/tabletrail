import type { Node } from '@xyflow/react'
import type { TableResponse } from '../types/table'

const NODES_PER_ROW = 4
const COLUMN_SPACING = 250
const ROW_SPACING = 150

/**
 * Maps backend `TableResponse[]` to React Flow `Node[]`.
 *
 * Positioning here is a simple grid, not a real layout algorithm —
 * Step 13 replaces this with Dagre-based auto-layout without changing
 * the id/data shape produced here.
 *
 * The full `TableResponse` is carried in `data.table` (not just the name)
 * so that Step 14's custom `TableNode` can render columns/constraints
 * without needing a second lookup back to the original data.
 */
export function tablesToNodes(tables: TableResponse[]): Node[] {
  return tables.map((table, index) => ({
    id: `table-${table.id}`,
    position: {
      x: (index % NODES_PER_ROW) * COLUMN_SPACING,
      y: Math.floor(index / NODES_PER_ROW) * ROW_SPACING,
    },
    data: {
      label: table.name,
      table,
    },
  }))
}
