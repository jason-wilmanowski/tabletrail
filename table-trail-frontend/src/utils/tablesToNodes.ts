import type { Node } from '@xyflow/react'
import type { TableResponse } from '../types/table'

const NODES_PER_ROW = 4
const COLUMN_SPACING = 250
const ROW_SPACING = 150

/**
 * Data carried by every table node. Exported so `TableNode.tsx` can type
 * its props against the exact shape this function produces, instead of
 * duplicating the shape in two places.
 */
export interface TableNodeData extends Record<string, unknown> {
  label: string
  table: TableResponse
}

export type TableNodeType = Node<TableNodeData, 'table'>

/**
 * Maps backend `TableResponse[]` to React Flow `Node[]`.
 *
 * Positioning here is a simple grid, refined by `layoutAlgorithm()`
 * (Step 13 / Dagre) afterwards — this function only produces the raw
 * nodes and their data.
 *
 * `type: 'table'` selects the custom `TableNode` component registered in
 * `GraphCanvas`'s `nodeTypes` (Step 14). The full `TableResponse` is
 * carried in `data.table` (not just the name) so `TableNode` can render
 * columns/constraints in later steps without a second data lookup.
 */
export function tablesToNodes(tables: TableResponse[]): TableNodeType[] {
  return tables.map((table, index) => ({
    id: `table-${table.id}`,
    type: 'table',
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
