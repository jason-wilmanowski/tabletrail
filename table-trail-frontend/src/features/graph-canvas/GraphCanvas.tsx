import { useState, useCallback } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

/**
 * Static placeholder nodes to verify the React Flow integration itself
 * (rendering, zoom, pan, dragging) before any real database data is
 * mapped in (Step 12). Default node type — no custom TableNode yet.
 */
const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Test Node 1' } },
  { id: '2', position: { x: 250, y: 150 }, data: { label: 'Test Node 2' } },
]

const initialEdges: Edge[] = []

/**
 * Central graph canvas component. Owns React Flow's node/edge state and
 * renders the canvas with default controls. Later steps build on top of
 * this without changing its shape:
 * - Step 12 replaces `initialNodes`/`initialEdges` with data mapped from
 *   `TableResponse[]`.
 * - Step 13 adds auto-layout (Dagre) for initial node positioning.
 * - Step 14+ introduces a custom `TableNode` type via `nodeTypes`.
 */
export function GraphCanvas() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

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
