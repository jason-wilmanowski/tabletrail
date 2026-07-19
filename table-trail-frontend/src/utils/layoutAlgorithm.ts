import dagre from '@dagrejs/dagre'
import type { Edge } from '@xyflow/react'
import type { TableNodeType } from './tablesToNodes'

/**
 * Node width stays fixed (TableNode has a fixed min-width, see
 * `min-w-[220px]` in TableNode.tsx). Height, however, now depends on how
 * many columns a table has — see `estimateNodeHeight` below. This was a
 * fixed placeholder (40px) as of Step 13, updated here in Step 15 because
 * the column list added to `TableNode` makes real node height vary a lot
 * per table, and a fixed height would cause overlapping nodes for tables
 * with many columns.
 */
const NODE_WIDTH = 220
const HEADER_HEIGHT = 33
const ROW_HEIGHT = 26
const VERTICAL_PADDING = 4

/**
 * Estimates a node's rendered height from its column count. Not pixel-
 * perfect (Step 17's collapse/expand will change this again), but close
 * enough for Dagre to space nodes apart without visible overlap.
 */
function estimateNodeHeight(node: TableNodeType): number {
  return HEADER_HEIGHT + node.data.table.columns.length * ROW_HEIGHT + VERTICAL_PADDING
}

/**
 * Layout direction: top-to-bottom.
 *
 * Chosen because once Step 18 adds Foreign-Key edges, the natural reading
 * direction for "this table references that table" is downward (similar
 * to an org chart / ER diagram convention), and TB layouts stay narrower
 * horizontally, which fits better next to the fixed-width sidebar defined
 * in AppShell.
 */
const LAYOUT_DIRECTION = 'TB'

/**
 * Computes positions for the given nodes using Dagre and returns a new
 * array of nodes with updated `position` values. Pure function — no
 * React, no side effects. `edges` are optional since Step 15 still has
 * none, but the signature already accepts them so Step 18 can pass real
 * relation edges without changing this function's shape.
 *
 * Typed against `TableNodeType[]` (not a generic `Node[]`) since node
 * height now depends on `data.table.columns` — this utility is no longer
 * fully content-agnostic, but stays specific to table nodes, which is all
 * this application ever lays out.
 */
export function layoutAlgorithm(nodes: TableNodeType[], edges: Edge[] = []): TableNodeType[] {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: LAYOUT_DIRECTION })

  for (const node of nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: estimateNodeHeight(node) })
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return nodes.map((node) => {
    const { x, y } = graph.node(node.id)
    const height = estimateNodeHeight(node)
    return {
      ...node,
      // Dagre positions by center, React Flow positions by top-left corner.
      position: {
        x: x - NODE_WIDTH / 2,
        y: y - height / 2,
      },
    }
  })
}
