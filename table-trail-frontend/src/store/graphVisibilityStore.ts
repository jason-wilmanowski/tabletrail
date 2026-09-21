import { create } from 'zustand'

/**
 * Id of a visibility toggle rendered by `VisibilityPanel`. Extend this
 * union (and `GRAPH_VISIBILITY_TOGGLES` in
 * `features/graph-canvas/visibility/visibilityToggles.ts`) to add a new
 * toggle — the store and panel don't need any other change.
 */
export type GraphVisibilityLayerId = 'customRelations' | 'foreignKeyRelations'

interface GraphVisibilityState {
  /**
   * Layer ids currently hidden. Absence means visible — same convention as
   * `columnRelationStore`'s `hiddenNoteIds`, so a newly-added toggle
   * defaults to "on" without needing an explicit entry here first.
   */
  hiddenLayerIds: Set<GraphVisibilityLayerId>
  toggleLayer: (id: GraphVisibilityLayerId) => void
}

/**
 * Client-only UI state for which relation layers are currently shown on the
 * graph canvas (Teil 1 of the UX update) — purely visual, never touches the
 * underlying relation data itself. Not persisted (unlike `layoutStorage`'s
 * per-database node positions): reopening the graph always starts with
 * every layer visible.
 */
export const useGraphVisibilityStore = create<GraphVisibilityState>((set) => ({
  hiddenLayerIds: new Set(),

  toggleLayer: (id) =>
    set((state) => {
      const hiddenLayerIds = new Set(state.hiddenLayerIds)
      if (hiddenLayerIds.has(id)) {
        hiddenLayerIds.delete(id)
      } else {
        hiddenLayerIds.add(id)
      }
      return { hiddenLayerIds }
    }),
}))
