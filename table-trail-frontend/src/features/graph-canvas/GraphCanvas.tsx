import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
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
  getViewportForBounds,
} from '@xyflow/react'
import type {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  NodeTypes,
  EdgeTypes,
  EdgeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { tablesToNodes } from '../../utils/tablesToNodes'
import { layoutAlgorithm } from '../../utils/layoutAlgorithm'
import { constraintsToEdges } from '../../utils/constraintsToEdges'
import { getSavedLayout, saveLayout } from '../../utils/layoutStorage'
import { computeCollisionOffsets } from '../../utils/collisionOffset'
import { TableNode } from './nodes/TableNode'
import { RelationEdge } from './edges/RelationEdge'
import { ColumnRelationEdge } from './edges/ColumnRelationEdge'
import type { ColumnRelationEdgeType } from './edges/ColumnRelationEdge'
import { ColumnRelationsPanel } from './column-relations/ColumnRelationsPanel'
import { VisibilityPanel } from './visibility/VisibilityPanel'
import { useUiStore } from '../../store/uiStore'
import { useColumnRelationStore } from '../../store/columnRelationStore'
import { useGraphVisibilityStore } from '../../store/graphVisibilityStore'
import { notifyError } from '../../store/notificationStore'
import { getErrorMessage } from '../../api/client'
import {
  useColumnRelations,
  useCreateColumnRelation,
  useUpdateColumnRelation,
  useDeleteColumnRelation,
} from '../../hooks/useColumnRelations'
import type { TableResponse } from '../../types/table'

interface GraphCanvasProps {
  tables: TableResponse[]
  databaseId: number
  interactive?: boolean
}

/**
 * Width of `TableInspectorPanel`'s `w-72` overlay in px. It sits absolutely
 * over the right edge of this canvas rather than shrinking it, so React
 * Flow's own container size doesn't account for it — the centering effect
 * below has to subtract it manually to target the actually-visible area.
 */
const INSPECTOR_PANEL_WIDTH = 288

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
  columnRelation: ColumnRelationEdge,
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
 *
 * After Dagre lays out every node, any table with a manually-saved
 * position (from a previous drag, see `layoutStorage`) has that position
 * substituted back in — Dagre stays the fallback for tables that were
 * never dragged.
 */
function buildGraph(tables: TableResponse[], databaseId: number): { nodes: Node[]; edges: Edge[] } {
  const edges = constraintsToEdges(tables)
  const layoutNodes = layoutAlgorithm(tablesToNodes(tables), edges)
  const savedLayout = getSavedLayout(databaseId)
  const nodes = layoutNodes.map((node) => {
    const saved = savedLayout[node.id]
    return saved ? { ...node, position: saved } : node
  })
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
 * writes to on click and `TableInspectorPanel` reads to open) — via
 * `setViewport` rather than `fitView` directly, since the target viewport
 * has to be computed against the width visible next to the inspector
 * panel overlay, not React Flow's own (wider) container bounds. See the
 * centering effect below for details.
 *
 * Named `GraphCanvasInner` and wrapped in `ReactFlowProvider` below
 * because `useReactFlow()` (needed to call `setViewport` imperatively)
 * only works inside a component rendered within that provider's tree —
 * it can't be called in the same component that also renders
 * `<ReactFlow>` without the explicit provider wrapping.
 */
function GraphCanvasInner({ tables, databaseId, interactive = true }: GraphCanvasProps) {
  // `buildGraph` runs Dagre over every table/edge — computed once via a
  // ref (not `useMemo`, since a *stale* value here is fine: the effect
  // below re-derives `nodes`/`edges` on every `tables`/`databaseId`
  // change anyway) and reused for both initial states below, instead of
  // calling `buildGraph` twice on mount.
  const initialGraphRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null)
  if (initialGraphRef.current === null) {
    initialGraphRef.current = buildGraph(tables, databaseId)
  }
  const [nodes, setNodes] = useState<Node[]>(() => initialGraphRef.current!.nodes)
  const [edges, setEdges] = useState<Edge[]>(() => initialGraphRef.current!.edges)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { setViewport, getNodesBounds } = useReactFlow()
  const selectedTableId = useUiStore((state) => state.selectedTableId)
  const setSelectedTableId = useUiStore((state) => state.setSelectedTableId)
  const pendingColumnRelationAction = useColumnRelationStore((state) => state.pendingAction)
  const clearPendingColumnRelationAction = useColumnRelationStore((state) => state.clearPendingAction)
  const setActiveColumnRelationPopover = useColumnRelationStore((state) => state.setActivePopover)
  const resetColumnRelationSelection = useColumnRelationStore((state) => state.resetSelection)

  // Purely visual layer toggles (Teil 1 of the UX update, via
  // `VisibilityPanel`) — absence from `hiddenLayerIds` means visible, same
  // convention as `hiddenNoteIds` above.
  const hiddenLayerIds = useGraphVisibilityStore((state) => state.hiddenLayerIds)
  const isCustomRelationsVisible = !hiddenLayerIds.has('customRelations')
  const isForeignKeyRelationsVisible = !hiddenLayerIds.has('foreignKeyRelations')

  // Custom relations are server state (unlike FK edges, which are derived
  // straight from `tables`) — TanStack Query keys the cache per
  // `databaseId` on its own, so switching databases just refetches; only
  // this component's own edit-mode/selection/popover state needs a
  // manual reset (a leftover pending selection referencing the previous
  // database's columns would otherwise dangle).
  useEffect(() => {
    resetColumnRelationSelection()
  }, [databaseId, resetColumnRelationSelection])

  const columnRelationsQuery = useColumnRelations(databaseId)
  const createColumnRelation = useCreateColumnRelation(databaseId)
  const updateColumnRelation = useUpdateColumnRelation(databaseId)
  const deleteColumnRelation = useDeleteColumnRelation(databaseId)

  // Surfaces a failed initial load — the graph would otherwise just
  // silently show zero custom relations with no indication anything
  // went wrong.
  useEffect(() => {
    if (columnRelationsQuery.error) {
      notifyError(`Custom-Relationen konnten nicht geladen werden: ${getErrorMessage(columnRelationsQuery.error)}`)
    }
  }, [columnRelationsQuery.error])

  // `TableNode`/`ColumnRelationEdge` don't hold `databaseId` or the
  // mutation hooks themselves, so they just record what they want to
  // happen (`pendingAction`) in the store; this effect is the one place
  // that actually fires the request and reports failures, once, right
  // after the action is requested.
  useEffect(() => {
    if (!pendingColumnRelationAction) {
      return
    }
    const action = pendingColumnRelationAction
    clearPendingColumnRelationAction()

    if (action.type === 'create') {
      createColumnRelation.mutate(
        { column_id_1: action.columnId1, column_id_2: action.columnId2 },
        {
          onSuccess: (created) => setActiveColumnRelationPopover(String(created.id)),
          onError: (error) => notifyError(`Relation konnte nicht erstellt werden: ${getErrorMessage(error)}`),
        }
      )
    } else if (action.type === 'update') {
      updateColumnRelation.mutate(
        { id: action.id, data: { relation_color: action.patch.color, description: action.patch.description } },
        { onError: (error) => notifyError(`Änderung konnte nicht gespeichert werden: ${getErrorMessage(error)}`) }
      )
    } else {
      deleteColumnRelation.mutate(action.id, {
        onError: (error) => notifyError(`Relation konnte nicht gelöscht werden: ${getErrorMessage(error)}`),
      })
    }
  }, [
    pendingColumnRelationAction,
    clearPendingColumnRelationAction,
    createColumnRelation,
    updateColumnRelation,
    deleteColumnRelation,
    setActiveColumnRelationPopover,
  ])

  // Real relations only carry column ids (matching the backend response),
  // so rendering them as edges needs each column's owning table id —
  // built once per `tables` change rather than scanning on every relation.
  const columnToTableId = useMemo(() => {
    const map = new Map<number, number>()
    for (const table of tables) {
      for (const column of table.columns) {
        map.set(column.id, table.id)
      }
    }
    return map
  }, [tables])

  // Manually-drawn relations are derived straight from the query cache
  // rather than folded into the `edges` state above — they don't
  // participate in `onNodesChange`/`applyEdgeChanges` (no drag/selection
  // state of their own), so keeping them out of that state avoids two
  // sources of truth for the same edge.
  //
  // Memoized (keyed on the actual inputs, not recomputed on every render
  // of this component) because React Flow's own `StoreUpdater` compares
  // its `edges` prop by reference and, on any change, fully rebuilds its
  // internal connection/edge lookup maps by iterating every edge
  // (`updateConnectionLookup`). Without this, a fresh array here on every
  // render — e.g. on every node-drag frame — would re-trigger that full
  // rebuild for no reason.
  const columnRelationEdges: ColumnRelationEdgeType[] = useMemo(() => {
    if (!isCustomRelationsVisible) {
      return []
    }
    return (columnRelationsQuery.data ?? []).flatMap((relation) => {
      const tableId1 = columnToTableId.get(relation.column_id_1)
      const tableId2 = columnToTableId.get(relation.column_id_2)
      if (tableId1 === undefined || tableId2 === undefined) {
        return []
      }
      return [
        {
          id: String(relation.id),
          type: 'columnRelation' as const,
          source: `table-${tableId1}`,
          target: `table-${tableId2}`,
          sourceHandle: `col-${relation.column_id_1}`,
          targetHandle: `col-${relation.column_id_2}`,
          data: { color: relation.relation_color, description: relation.description },
        },
      ]
    })
  }, [columnRelationsQuery.data, columnToTableId, isCustomRelationsVisible])

  // Small nudge away from dead-center for notes whose relations land
  // close enough to another visible one to otherwise overlap. Uses each
  // relation's source/target *table* center as a cheap stand-in for its
  // true edge midpoint (exact handle-level positions aren't available
  // here without duplicating React Flow's own internal layout math) —
  // close enough to detect "these two are near each other", which is all
  // collision avoidance needs. Only relations that actually render a
  // note (has a description, not hidden) are considered, so an edge with
  // no visible note can't crowd out ones that do.
  //
  // Recomputed on every `nodes` change (e.g. every drag frame) since
  // table positions move, but `computeCollisionOffsets` itself is a
  // single cheap O(n) bucketing pass over just the column-relation count
  // — not the full table count — so this stays proportional to how many
  // manually-drawn relations exist, independent of database size.
  const hiddenNoteIds = useColumnRelationStore((state) => state.hiddenNoteIds)
  const columnRelationOffsets = useMemo(() => {
    const nodePositionById = new Map(nodes.map((node) => [node.id, node.position]))
    const points = columnRelationEdges.flatMap((edge) => {
      if (!edge.data?.description || hiddenNoteIds.has(Number(edge.id))) {
        return []
      }
      const source = nodePositionById.get(edge.source)
      const target = nodePositionById.get(edge.target)
      if (!source || !target) {
        return []
      }
      return [{ id: edge.id, point: { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 } }]
    })
    return computeCollisionOffsets(points)
  }, [columnRelationEdges, nodes, hiddenNoteIds])

  // Same reasoning as `columnRelationEdges` above — the array passed to
  // `<ReactFlow edges>` needs a stable reference across renders where
  // neither `edges` nor `columnRelationEdges` actually changed, otherwise
  // every render (including drag frames) forces React Flow to rebuild its
  // internal edge lookups from scratch.
  const allEdges = useMemo(() => {
    const withOffsets = columnRelationEdges.map((edge) => {
      const offset = columnRelationOffsets.get(edge.id)
      if (!offset) {
        return edge
      }
      return { ...edge, data: { ...edge.data!, offsetX: offset.x, offsetY: offset.y } }
    })
    const relationEdges = isForeignKeyRelationsVisible ? edges : []
    return [...relationEdges, ...withOffsets]
  }, [edges, columnRelationEdges, columnRelationOffsets, isForeignKeyRelationsVisible])

  // Re-derive nodes and edges when the underlying table data changes
  // (e.g. after a rescan) or when a different database is shown. Manual
  // drag positions are re-applied on top of the fresh Dagre layout by
  // `buildGraph` itself (via `layoutStorage`), so they survive a rescan
  // as long as the dragged table still exists.
  useEffect(() => {
    const graph = buildGraph(tables, databaseId)
    setNodes(graph.nodes)
    setEdges(graph.edges)
  }, [tables, databaseId])

  // Centers the view on the node matching the current selection —
  // triggered both by clicking a TableNode directly and by clicking a
  // sidebar entry (Step 27), since both write to the same store field.
  // Silently no-ops for a selected id that doesn't match any node (e.g.
  // stale selection after a rescan) rather than throwing.
  //
  // Selecting a table also opens `TableInspectorPanel`, an absolute
  // overlay on the right edge of this canvas rather than a layout sibling
  // — so React Flow's own container width doesn't shrink to make room for
  // it, and a plain `fitView` centers the node in the *full* canvas width,
  // landing visibly right of center once the panel covers its share of
  // the right side. Computing the viewport by hand against
  // `containerWidth - INSPECTOR_PANEL_WIDTH` targets the actually-visible
  // area instead, so the node ends up centered between the left sidebar
  // and the inspector panel, not just within the raw canvas bounds.
  useEffect(() => {
    if (selectedTableId === null) {
      return
    }

    const nodeId = `table-${selectedTableId}`
    const node = nodes.find((n) => n.id === nodeId)
    const wrapper = wrapperRef.current

    if (!node || !wrapper) {
      return
    }

    const bounds = getNodesBounds([node])
    const visibleWidth = wrapper.clientWidth - INSPECTOR_PANEL_WIDTH
    const { x, y, zoom } = getViewportForBounds(
      bounds,
      visibleWidth,
      wrapper.clientHeight,
      0.5,
      1.25,
      0.1
    )

    setViewport({ x, y, zoom }, { duration: 400 })
  }, [selectedTableId, nodes, getNodesBounds, setViewport])

  // Persists node positions to `localStorage` once a drag finishes — React
  // Flow reports drag progress as a stream of `position` changes with
  // `dragging: true`, and fires one final `position` change with
  // `dragging: false` when the user releases the node. Only that final
  // change should trigger a write; saving on every intermediate step would
  // thrash `localStorage` during the drag.
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((current) => {
        const updated = applyNodeChanges(changes, current)

        const dragEnded = changes.some(
          (change) => change.type === 'position' && change.dragging === false
        )
        if (dragEnded) {
          const positions = Object.fromEntries(updated.map((node) => [node.id, node.position]))
          saveLayout(databaseId, positions)
        }

        return updated
      })
    },
    [databaseId]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((current) => applyEdgeChanges(changes, current)),
    []
  )

  // Clicking empty canvas space clears the current selection, closing
  // `TableInspectorPanel` the same way `Escape` already does — React
  // Flow's own distinction between "pane" (background) and node clicks
  // means this never fires for a click that lands on a `TableNode`.
  const onPaneClick = useCallback(() => {
    setSelectedTableId(null)
    setActiveColumnRelationPopover(null)
  }, [setSelectedTableId, setActiveColumnRelationPopover])

  // Opens the inline color/note popover for a clicked custom relation
  // (edit mode: editable, otherwise read-only — see ColumnRelationEdge).
  // Real FK edges (`type: 'relation'`) aren't clickable in this way.
  const onEdgeClick: EdgeMouseHandler = useCallback(
    (event, edge) => {
      if (edge.type !== 'columnRelation') {
        return
      }
      event.stopPropagation()
      setActiveColumnRelationPopover(edge.id)
    },
    [setActiveColumnRelationPopover]
  )

  return (
    <div ref={wrapperRef} className="relative h-full w-full" style={reactFlowTheme}>
      <ReactFlow
        nodes={nodes}
        edges={allEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        fitView
        // Without this, React Flow mounts every node/edge regardless of
        // what's actually in the viewport (confirmed in its own source:
        // `useVisibleNodeIds`/`useVisibleEdgeIds` return every id when
        // this is off). At 400 tables that's thousands of DOM elements
        // (column rows, handles) kept mounted at all times, which is the
        // main cost behind pan/zoom jank at that scale. Node/edge state
        // itself (positions, saved layout, selection) lives in the store
        // regardless of what's mounted, so this only changes what's in
        // the DOM, not any of the existing features.
        onlyRenderVisibleElements
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
      {/* Hidden while a table is selected — the top trigger sits top-right
          (`right-3 top-3`), directly over `TableInspectorPanel`'s header
          (`absolute right-0 top-0 w-72`), so an open table's name/columns
          would otherwise be partly covered by this icon. `ColumnRelationsPanel`
          and `VisibilityPanel` are plain (non-absolute) flex children here —
          this wrapper is the single absolutely-positioned overlay, so when
          either panel's dropdown opens, normal flex flow pushes the other
          trigger down instead of it getting covered by a hardcoded offset. */}
      {interactive && selectedTableId === null && (
        <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2">
          <ColumnRelationsPanel />
          <VisibilityPanel />
        </div>
      )}
    </div>
  )
}

/**
 * Public entry point — wraps `GraphCanvasInner` in `ReactFlowProvider` so
 * `useReactFlow()` is available inside it. Callers (`DatabaseDetailPage`)
 * use this export exactly as before; the provider wrapping is an internal
 * detail, not a change to this component's public API.
 */
export function GraphCanvas({ tables, databaseId, interactive }: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner tables={tables} databaseId={databaseId} interactive={interactive} />
    </ReactFlowProvider>
  )
}
