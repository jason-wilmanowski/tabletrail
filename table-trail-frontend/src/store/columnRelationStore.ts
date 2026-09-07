import { create } from 'zustand'

/** Mirrors backend `ColumnRelationColor` enum values exactly. */
export type ColumnRelationColor = 'green' | 'red' | 'yellow' | 'blue' | 'magenta' | 'white'

export interface PendingColumnSelection {
  columnId: number
  tableId: number
}

/**
 * A manually-drawn column-to-column relation. Step 1: local-only, `id` is
 * a client-generated placeholder — Step 2 (backend wiring) will replace
 * this with the real `ColumnRelationResponse` shape (`column_id_1`/
 * `column_id_2`/`relation_color`, numeric `id` from the API).
 */
export interface ColumnRelationDraft {
  id: string
  columnId1: number
  tableId1: number
  columnId2: number
  tableId2: number
  color: ColumnRelationColor
  description: string | null
}

interface ColumnRelationState {
  /** "Relation ziehen" mode — while active, clicking columns builds a relation instead of selecting a table. */
  isEditMode: boolean
  /** First column clicked, waiting for the second one to complete a relation. */
  pendingColumn: PendingColumnSelection | null
  drafts: ColumnRelationDraft[]
  /** Id of the draft whose popover (edit or read-only) is currently open. */
  activePopoverId: string | null

  toggleEditMode: () => void
  selectColumn: (columnId: number, tableId: number) => void
  updateDraft: (id: string, patch: Partial<Pick<ColumnRelationDraft, 'color' | 'description'>>) => void
  setActivePopover: (id: string | null) => void
  resetForDatabase: () => void
}

/**
 * Local client state for manually-drawn column relations, kept separate
 * from `uiStore` since it's specific to the graph-canvas custom-relations
 * feature rather than app-wide UI state.
 *
 * Step 1 (current): `drafts` lives only here, nothing is persisted.
 * Step 2 will add loading real relations from the backend and syncing
 * create/update/delete through the API — this store's shape is already
 * close to that so the wiring change stays small.
 */
export const useColumnRelationStore = create<ColumnRelationState>((set) => ({
  isEditMode: false,
  pendingColumn: null,
  drafts: [],
  activePopoverId: null,

  toggleEditMode: () =>
    set((state) => ({
      isEditMode: !state.isEditMode,
      pendingColumn: null,
    })),

  selectColumn: (columnId, tableId) =>
    set((state) => {
      if (!state.isEditMode) {
        return state
      }

      if (!state.pendingColumn) {
        return { pendingColumn: { columnId, tableId } }
      }

      // Clicking the already-pending column again cancels the selection.
      if (state.pendingColumn.columnId === columnId) {
        return { pendingColumn: null }
      }

      const draft: ColumnRelationDraft = {
        id: `draft-${crypto.randomUUID()}`,
        columnId1: state.pendingColumn.columnId,
        tableId1: state.pendingColumn.tableId,
        columnId2: columnId,
        tableId2: tableId,
        color: 'green',
        description: null,
      }

      return {
        pendingColumn: null,
        drafts: [...state.drafts, draft],
        activePopoverId: draft.id,
      }
    }),

  updateDraft: (id, patch) =>
    set((state) => ({
      drafts: state.drafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
    })),

  setActivePopover: (id) => set({ activePopoverId: id }),

  // Drafts reference column/table ids scoped to one database — without
  // this, switching to a different database (the Zustand store outlives
  // route changes) would keep rendering the previous database's relations.
  resetForDatabase: () =>
    set({
      isEditMode: false,
      pendingColumn: null,
      drafts: [],
      activePopoverId: null,
    }),
}))
