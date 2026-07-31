import { useState, useCallback, useEffect } from 'react'
import type { CSSProperties } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
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
import { useUiStore } from '../../store/uiStore'
import type { TableResponse } from '../../types/table'

interface GraphCanvasProps {
  tables: TableResponse[]
  interactive?: boolean
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
 * custom properties (its stylesheet ships light-theme defaults). These
 * are overridden locally on the canvas wrapper — scoped to this
 * component, not a global stylesheet, since React Flow's own variables
 * are a different naming scheme than this app's design tokens — but as
 * of Step 28 every value here points at the same `--background`,
 * `--panel`, `--border` etc. tokens defined in index.css, not hand-picked
 * hex values anymore.
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
  '--xy-background-color': 'hsl(var(--background))',
  '--xy-controls-button-background-color': 'hsl(var(--panel))',
  '--xy-controls-button-background-color-hover': 'hsl(var(--surface-hover))',
  '--xy-controls-button-border-color': 'hsl(var(--border))',
  '--xy-controls-button-color': 'hsl(var(--muted-foreground))',
  '--xy-controls-button-color-hover': 'hsl(var(--foreground))',
  '--xy-minimap-background-color': 'hsl(var(--panel))',
  '--xy-minimap-mask-background-color': 'hsl(var(--background) / 0.6)',
  '--xy-minimap-node-background-color': 'hsl(var(--border))',
  '--xy-minimap-node-stroke-color': 'hsl(var(--muted-foreground))',
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
 * `RelationEdge` types, configures the built-in `Background`, `Controls`
 * and `MiniMap`, and — as of Step 27 — centers the view on the currently
 * selected table (`uiStore.selectedTableId`, the same field `TableNode`
 * writes to on click and `TableInspectorPanel` reads to open). No custom
 * zoom/pan/minimap/camera implementation: everything here is a React Flow
 * API (`fitView`) reacting to state, not a reimplementation of it.
 *
 * Named `GraphCanvasInner` and wrapped in `ReactFlowProvider` below
 * because `useReactFlow()` (needed to call `fitView` imperatively) only
 * works inside a component rendered within that provider's tree — it
 * can't be called in the same component that also renders `<ReactFlow>`
 * without the explicit provider wrapping.
 */
function GraphCanvasInner({ tables, interactive = true }: GraphCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>(() => buildGraph(tables).nodes)
  const [edges, setEdges] = useState<Edge[]>(() => buildGraph(tables).edges)

  const { fitView } = useReactFlow()
  const selectedTableId = useUiStore((state) => state.selectedTableId)

  // Re-derive nodes and edges when the underlying table data changes
  // (e.g. after a rescan). Manual drag positions are intentionally not
  // preserved here — that concern belongs to a later step once layout
  // persistence exists.
  useEffect(() => {
    const graph = buildGraph(tables)
    setNodes(graph.nodes)
    setEdges(graph.edges)
  }, [tables])

  // Centers the view on the node matching the current selection —
  // triggered both by clicking a TableNode directly and by clicking a
  // sidebar entry (Step 27), since both write to the same store field.
  // Silently no-ops for a selected id that doesn't match any node (e.g.
  // stale selection after a rescan) rather than throwing.
  useEffect(() => {
    if (selectedTableId === null) {
      return
    }

    const nodeId = `table-${selectedTableId}`
    const nodeExists = nodes.some((node) => node.id === nodeId)

    if (!nodeExists) {
      return
    }

    fitView({ nodes: [{ id: nodeId }], duration: 400, maxZoom: 1.25 })
  }, [selectedTableId, nodes, fitView])

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
        nodesDraggable={interactive}
        nodesConnectable={false}
        elementsSelectable={interactive}
        panOnDrag={interactive}
        zoomOnScroll={interactive}
        zoomOnPinch={interactive}
        zoomOnDoubleClick={interactive}
        preventScrolling={interactive}
      >
        <Background color="hsl(var(--border))" gap={24} />
        {interactive && <Controls showInteractive={false} />}
        {interactive && (
          <MiniMap pannable zoomable nodeStrokeWidth={1} className="!border !border-border" />
        )}
      </ReactFlow>
    </div>
  )
}

/**
 * Public entry point — wraps `GraphCanvasInner` in `ReactFlowProvider` so
 * `useReactFlow()` is available inside it. Callers (`DatabaseDetailPage`)
 * use this export exactly as before; the provider wrapping is an internal
 * detail, not a change to this component's public API.
 */
export function GraphCanvas({ tables, interactive }: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner tables={tables} interactive={interactive} />
    </ReactFlowProvider>
  )
}
