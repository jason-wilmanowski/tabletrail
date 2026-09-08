import { create } from 'zustand'
import type { ColumnRelationColor } from '../types/columnRelation'

export interface PendingColumnSelection {
  columnId: number
}

export type PendingColumnRelationAction =
  | { type: 'create'; columnId1: number; columnId2: number }
  | { type: 'update'; id: number; patch: { color?: ColumnRelationColor; description?: string | null } }
  | { type: 'delete'; id: number }

interface ColumnRelationState {
  /** "Relation ziehen" mode — while active, clicking columns builds a relation instead of selecting a table. */
  isEditMode: boolean
  /** First column clicked, waiting for the second one to complete a relation. */
  pendingColumn: PendingColumnSelection | null
  /**
   * A create/update/delete request waiting to be sent. Set synchronously
   * by UI components (`TableNode`, `ColumnRelationEdge`) that don't own
   * the mutation hooks themselves; `GraphCanvas` (which does, since it
   * already holds `databaseId`) watches this and fires the matching
   * request, then clears it.
   */
  pendingAction: PendingColumnRelationAction | null
  /** Id (as a string, matching the edge's own `id`) of the relation whose popover is open. */
  activePopoverId: string | null
  /**
   * Relation ids whose note window is hidden on the canvas. Absence from
   * this set means visible — that way a freshly created/loaded relation
   * with a description shows its note by default without needing an
   * entry here first.
   */
  hiddenNoteIds: Set<number>

  toggleEditMode: () => void
  selectColumn: (columnId: number) => void
  requestUpdate: (id: number, patch: { color?: ColumnRelationColor; description?: string | null }) => void
  requestDelete: (id: number) => void
  clearPendingAction: () => void
  setActivePopover: (id: string | null) => void
  toggleNoteVisibility: (id: number) => void
  resetSelection: () => void
}

/**
 * Client state for manually-drawn column relations — the actual data
 * (the relations themselves) lives in the TanStack Query cache via
 * `useColumnRelations` (server state), matching the rest of this app's
 * hooks/store split. This store only holds interaction state: edit mode,
 * the in-progress two-click selection, and requests waiting to be sent.
 */
export const useColumnRelationStore = create<ColumnRelationState>((set) => ({
  isEditMode: false,
  pendingColumn: null,
  pendingAction: null,
  activePopoverId: null,
  hiddenNoteIds: new Set(),

  toggleEditMode: () =>
    set((state) => ({
      isEditMode: !state.isEditMode,
      pendingColumn: null,
    })),

  selectColumn: (columnId) =>
    set((state) => {
      if (!state.isEditMode) {
        return state
      }

      if (!state.pendingColumn) {
        return { pendingColumn: { columnId } }
      }

      // Clicking the already-pending column again cancels the selection.
      if (state.pendingColumn.columnId === columnId) {
        return { pendingColumn: null }
      }

      return {
        pendingColumn: null,
        pendingAction: { type: 'create', columnId1: state.pendingColumn.columnId, columnId2: columnId },
      }
    }),

  requestUpdate: (id, patch) => set({ pendingAction: { type: 'update', id, patch } }),

  requestDelete: (id) => set({ pendingAction: { type: 'delete', id } }),

  clearPendingAction: () => set({ pendingAction: null }),

  setActivePopover: (id) => set({ activePopoverId: id }),

  toggleNoteVisibility: (id) =>
    set((state) => {
      const hiddenNoteIds = new Set(state.hiddenNoteIds)
      if (hiddenNoteIds.has(id)) {
        hiddenNoteIds.delete(id)
      } else {
        hiddenNoteIds.add(id)
      }
      return { hiddenNoteIds }
    }),

  // Switching databases doesn't need to touch the TanStack Query cache
  // (it's keyed per databaseId already) — only this UI-only interaction
  // state, so a stale selection/popover from the previous database isn't
  // left dangling.
  resetSelection: () =>
    set({
      isEditMode: false,
      pendingColumn: null,
      activePopoverId: null,
    }),
}))
