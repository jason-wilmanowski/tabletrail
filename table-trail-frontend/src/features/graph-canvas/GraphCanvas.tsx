import { useState, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange, NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { tablesToNodes } from '../../utils/tablesToNodes'
import { layoutAlgorithm } from '../../utils/layoutAlgorithm'
import { TableNode } from './nodes/TableNode'
import type { TableResponse } from '../../types/table'

interface GraphCanvasProps {
  tables: TableResponse[]
}

const initialEdges: Edge[] = []

/**
 * Registered once, outside the component, so React Flow always sees the
 * same object reference across renders (a new object here would make
 * React Flow think node types changed on every render).
 */
const nodeTypes: NodeTypes = {
  table: TableNode,
}

/**
 * Central graph canvas component. Owns React Flow's node/edge state and
 * renders the canvas with default controls.
 *
 * Nodes are derived from real `TableResponse[]` data via `tablesToNodes()`
 * and then positioned by `layoutAlgorithm()` (Dagre) — both are pure
 * utilities, this component only renders what they produce, no mapping or
 * layout math happens here.
 *
 * As of Step 14, nodes render via the custom `TableNode` component
 * (registered in `nodeTypes` above) instead of React Flow's default node —
 * `tablesToNodes()` already tags every node with `type: 'table'` so this
 * mapping resolves automatically. Later steps build on top of this
 * without changing its shape:
 * - Step 15–17 extend `TableNode` itself (columns, icons, collapse).
 * - Step 18 adds edges derived from constraints and passes them into
 *   `layoutAlgorithm()` so Dagre can account for relations too.
 */
export function GraphCanvas({ tables }: GraphCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>(() =>
    layoutAlgorithm(tablesToNodes(tables), initialEdges)
  )
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  // Re-derive nodes when the underlying table data changes (e.g. after a
  // rescan). Manual drag positions are intentionally not preserved here —
  // that concern belongs to a later step once layout persistence exists.
  useEffect(() => {
    // No edges exist yet at this step (Step 18 introduces them) — passing
    // an empty array directly here avoids depending on the `edges` state
    // variable, which stays untouched by user interaction in this step.
    setNodes(layoutAlgorithm(tablesToNodes(tables), []))
  }, [tables])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((current) => applyNodeChanges(changes, current)),
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((current) => applyEdgeChanges(changes, current)),
    []
  )

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
