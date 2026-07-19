import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'

/**
 * Placeholder node dimensions used purely for layout spacing. React Flow's
 * default node renders at roughly this size; Dagre needs concrete
 * width/height to avoid overlaps regardless of what actually renders.
 * Step 14's custom `TableNode` will likely need real measured sizes
 * (columns list makes nodes taller) — that refinement belongs there, not
 * here, since this utility only knows about generic nodes for now.
 */
const NODE_WIDTH = 172
const NODE_HEIGHT = 40

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
 * React, no side effects, independent of any specific node's rendered
 * content. `edges` are optional since this step has none yet, but the
 * signature already accepts them so Step 18 can pass real relation edges
 * without changing this function's shape.
 */
export function layoutAlgorithm(nodes: Node[], edges: Edge[] = []): Node[] {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: LAYOUT_DIRECTION })

  for (const node of nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return nodes.map((node) => {
    const { x, y } = graph.node(node.id)
    return {
      ...node,
      // Dagre positions by center, React Flow positions by top-left corner.
      position: {
        x: x - NODE_WIDTH / 2,
        y: y - NODE_HEIGHT / 2,
      },
    }
  })
}
