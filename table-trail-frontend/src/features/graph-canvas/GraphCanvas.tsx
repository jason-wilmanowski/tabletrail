import { useState, useCallback, useEffect } from 'react'
import type { CSSProperties } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
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
 * React Flow themes its built-in Controls/MiniMap/Background via CSS
 * custom properties (its stylesheet ships light-theme defaults). Rather
 * than waiting for the formal design-token system (Step 28), these are
 * overridden locally on the canvas wrapper — scoped to this component,
 * not a global stylesheet — so navigation elements read as dark and
 * muted instead of the library's default light chrome. Values are hand-
 * picked to match the neutral palette already used in TableNode/
 * RelationEdge (border/background/text tones), not a new color system.
 */
interface ReactFlowThemeVars extends CSSProperties {
  '--xy-background-color'?: string
  '--xy-controls-button-background-color'?: string
  '--xy-controls-button-background-color-hover'?: string
  '--xy-controls-button-border-color'?: string
  '--xy-controls-button-color'?: string
  '--xy-controls-button-color-hover'?: string
  '--xy-minimap-background-color'?: string
  '--xy-minimap-mask-background-color'?: string
  '--xy-minimap-node-background-color'?: string
  '--xy-minimap-node-stroke-color'?: string
}

const reactFlowTheme: ReactFlowThemeVars = {
  '--xy-background-color': '#0a0a0a',
  '--xy-controls-button-background-color': '#18181b',
  '--xy-controls-button-background-color-hover': '#27272a',
  '--xy-controls-button-border-color': '#3f3f46',
  '--xy-controls-button-color': '#a1a1aa',
  '--xy-controls-button-color-hover': '#e4e4e7',
  '--xy-minimap-background-color': '#111113',
  '--xy-minimap-mask-background-color': 'rgba(0, 0, 0, 0.6)',
  '--xy-minimap-node-background-color': '#3f3f46',
  '--xy-minimap-node-stroke-color': '#52525b',
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
 * renders the canvas with navigation elements.
 *
 * Nodes come from `tablesToNodes()` + `layoutAlgorithm()`, edges come from
 * `constraintsToEdges()` — all pure utilities, this component only
 * renders what they produce, registers the custom `TableNode`/
 * `RelationEdge` types, and — as of Step 20 — configures the built-in
 * `Background`, `Controls` and `MiniMap`. No custom zoom/pan/minimap
 * implementation: all three are React Flow's own components, themed via
 * CSS variables rather than replaced.
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
    <div className="h-full w-full" style={reactFlowTheme}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background color="#27272a" gap={24} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={1}
          className="!border !border-neutral-700"
        />
      </ReactFlow>
    </div>
  )
}
