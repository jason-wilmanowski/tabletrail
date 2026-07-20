import { useState, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import type { Node, Edge, NodeChange, EdgeChange, NodeTypes, EdgeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { tablesToNodes } from '../../utils/tablesToNodes'
import { layoutAlgorithm } from '../../utils/layoutAlgorithm'
import { constraintsToEdges } from '../../utils/constraintsToEdges'
import { TableNode } from './nodes/TableNode'
import { RelationEdge } from './edges/RelationEdge'
import type { TableResponse } from '../../types/table'

interface GraphCanvasProps {
  tables: TableResponse[]
}

/**
 * Registered once, outside the component, so React Flow always sees the
 * same object references across renders (new objects here would make
 * React Flow think node/edge types changed on every render).
 */
const nodeTypes: NodeTypes = {
  table: TableNode,
}

const edgeTypes: EdgeTypes = {
  relation: RelationEdge,
}

/**
 * Computes nodes and edges together for a given set of tables. Kept as
 * one small helper so both the initial state and the data-change effect
 * derive them the exact same way, in the right order: edges are needed
 * *before* layout so Dagre can account for relations when positioning
 * nodes (see `layoutAlgorithm`'s `edges` parameter).
 */
function buildGraph(tables: TableResponse[]): { nodes: Node[]; edges: Edge[] } {
  const edges = constraintsToEdges(tables)
  const nodes = layoutAlgorithm(tablesToNodes(tables), edges)
  return { nodes, edges }
}

/**
 * Central graph canvas component. Owns React Flow's node/edge state and
 * renders the canvas with default controls.
 *
 * Nodes come from `tablesToNodes()` + `layoutAlgorithm()`, edges come from
 * `constraintsToEdges()` (Step 18) — all three are pure utilities, this
 * component only renders what they produce and registers the custom
 * `TableNode`/`RelationEdge` types. No mapping, layout, or constraint
 * analysis happens here.
 */
export function GraphCanvas({ tables }: GraphCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>(() => buildGraph(tables).nodes)
  const [edges, setEdges] = useState<Edge[]>(() => buildGraph(tables).edges)

  // Re-derive nodes and edges when the underlying table data changes
  // (e.g. after a rescan). Manual drag positions are intentionally not
  // preserved here — that concern belongs to a later step once layout
  // persistence exists.
  useEffect(() => {
    const graph = buildGraph(tables)
    setNodes(graph.nodes)
    setEdges(graph.edges)
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
        edgeTypes={edgeTypes}
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
