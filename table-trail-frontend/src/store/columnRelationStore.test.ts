import { beforeEach, describe, expect, it } from 'vitest'
import { useColumnRelationStore } from './columnRelationStore'

const initialState = useColumnRelationStore.getState()

beforeEach(() => {
  useColumnRelationStore.setState(initialState, true)
})

describe('toggleEditMode', () => {
  it('flips isEditMode and clears any pending column selection', () => {
    useColumnRelationStore.setState({ pendingColumn: { columnId: 1 } })

    useColumnRelationStore.getState().toggleEditMode()

    expect(useColumnRelationStore.getState().isEditMode).toBe(true)
    expect(useColumnRelationStore.getState().pendingColumn).toBeNull()

    useColumnRelationStore.getState().toggleEditMode()

    expect(useColumnRelationStore.getState().isEditMode).toBe(false)
  })
})

describe('selectColumn', () => {
  it('does nothing while edit mode is off', () => {
    useColumnRelationStore.getState().selectColumn(1)

    expect(useColumnRelationStore.getState().pendingColumn).toBeNull()
  })

  it('stores the first clicked column as pending', () => {
    useColumnRelationStore.setState({ isEditMode: true })

    useColumnRelationStore.getState().selectColumn(1)

    expect(useColumnRelationStore.getState().pendingColumn).toEqual({ columnId: 1 })
    expect(useColumnRelationStore.getState().pendingAction).toBeNull()
  })

  it('cancels the selection when the pending column is clicked again', () => {
    useColumnRelationStore.setState({ isEditMode: true, pendingColumn: { columnId: 1 } })

    useColumnRelationStore.getState().selectColumn(1)

    expect(useColumnRelationStore.getState().pendingColumn).toBeNull()
  })

  it('builds a create action and clears the pending column when a second column is clicked', () => {
    useColumnRelationStore.setState({ isEditMode: true, pendingColumn: { columnId: 1 } })

    useColumnRelationStore.getState().selectColumn(2)

    expect(useColumnRelationStore.getState().pendingColumn).toBeNull()
    expect(useColumnRelationStore.getState().pendingAction).toEqual({
      type: 'create',
      columnId1: 1,
      columnId2: 2,
    })
  })
})

describe('requestUpdate / requestDelete / clearPendingAction', () => {
  it('sets an update action with the given patch', () => {
    useColumnRelationStore.getState().requestUpdate(7, { description: 'note' })

    expect(useColumnRelationStore.getState().pendingAction).toEqual({
      type: 'update',
      id: 7,
      patch: { description: 'note' },
    })
  })

  it('sets a delete action for the given id', () => {
    useColumnRelationStore.getState().requestDelete(7)

    expect(useColumnRelationStore.getState().pendingAction).toEqual({ type: 'delete', id: 7 })
  })

  it('clears the pending action', () => {
    useColumnRelationStore.getState().requestDelete(7)

    useColumnRelationStore.getState().clearPendingAction()

    expect(useColumnRelationStore.getState().pendingAction).toBeNull()
  })
})

describe('setActivePopover', () => {
  it('sets and clears the active popover id', () => {
    useColumnRelationStore.getState().setActivePopover('edge-1')

    expect(useColumnRelationStore.getState().activePopoverId).toBe('edge-1')

    useColumnRelationStore.getState().setActivePopover(null)

    expect(useColumnRelationStore.getState().activePopoverId).toBeNull()
  })
})

describe('toggleNoteVisibility', () => {
  it('hides a note on first toggle and shows it again on the second', () => {
    useColumnRelationStore.getState().toggleNoteVisibility(3)

    expect(useColumnRelationStore.getState().hiddenNoteIds.has(3)).toBe(true)

    useColumnRelationStore.getState().toggleNoteVisibility(3)

    expect(useColumnRelationStore.getState().hiddenNoteIds.has(3)).toBe(false)
  })

  it('does not affect other hidden note ids', () => {
    useColumnRelationStore.getState().toggleNoteVisibility(3)
    useColumnRelationStore.getState().toggleNoteVisibility(4)

    useColumnRelationStore.getState().toggleNoteVisibility(3)

    expect(useColumnRelationStore.getState().hiddenNoteIds.has(3)).toBe(false)
    expect(useColumnRelationStore.getState().hiddenNoteIds.has(4)).toBe(true)
  })
})

describe('resetSelection', () => {
  it('resets edit mode, pending column and active popover but keeps pending action and hidden notes', () => {
    useColumnRelationStore.setState({
      isEditMode: true,
      pendingColumn: { columnId: 1 },
      pendingAction: { type: 'delete', id: 1 },
      activePopoverId: 'edge-1',
      hiddenNoteIds: new Set([1]),
    })

    useColumnRelationStore.getState().resetSelection()

    const state = useColumnRelationStore.getState()
    expect(state.isEditMode).toBe(false)
    expect(state.pendingColumn).toBeNull()
    expect(state.activePopoverId).toBeNull()
    expect(state.pendingAction).toEqual({ type: 'delete', id: 1 })
    expect(state.hiddenNoteIds.has(1)).toBe(true)
  })
})
