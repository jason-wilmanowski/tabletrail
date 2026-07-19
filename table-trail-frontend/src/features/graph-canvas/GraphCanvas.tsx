import { useState, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { tablesToNodes } from '../../utils/tablesToNodes'
import type { TableResponse } from '../../types/table'

interface GraphCanvasProps {
  tables: TableResponse[]
}

const initialEdges: Edge[] = []

/**
 * Central graph canvas component. Owns React Flow's node/edge state and
 * renders the canvas with default controls.
 *
 * As of Step 12, nodes are derived from real `TableResponse[]` data via
 * `tablesToNodes()` (src/utils/) rather than static test data — all
 * mapping logic lives in that utility, this component only renders what
 * it produces. Later steps build on top of this without changing its
 * shape:
 * - Step 13 adds auto-layout (Dagre) inside `tablesToNodes()` /
 *   a follow-up layout utility, positions flow through unchanged here.
 * - Step 14+ introduces a custom `TableNode` type via `nodeTypes`.
 * - Step 18 adds edges derived from constraints, same pattern as nodes.
 */
export function GraphCanvas({ tables }: GraphCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>(() => tablesToNodes(tables))
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  // Re-derive nodes when the underlying table data changes (e.g. after a
  // rescan). Manual drag positions are intentionally not preserved here —
  // that concern belongs to a later step once layout persistence exists.
  useEffect(() => {
    setNodes(tablesToNodes(tables))
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
