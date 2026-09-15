import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from './uiStore'

const initialState = useUiStore.getState()

beforeEach(() => {
  useUiStore.setState(initialState, true)
})

it('starts with the expected defaults', () => {
  const state = useUiStore.getState()

  expect(state.selectedTableId).toBeNull()
  expect(state.focusMode).toBe(false)
  expect(state.sidebarCollapsed).toBe(false)
  expect(state.zoomLevel).toBe(1)
  expect(state.previewDatabaseId).toBeNull()
})

describe('setSelectedTableId', () => {
  it('sets and clears the selected table id', () => {
    useUiStore.getState().setSelectedTableId('table-1')

    expect(useUiStore.getState().selectedTableId).toBe('table-1')

    useUiStore.getState().setSelectedTableId(null)

    expect(useUiStore.getState().selectedTableId).toBeNull()
  })
})

describe('setFocusMode', () => {
  it('toggles focus mode', () => {
    useUiStore.getState().setFocusMode(true)

    expect(useUiStore.getState().focusMode).toBe(true)
  })
})

describe('setSidebarCollapsed', () => {
  it('toggles sidebar collapsed state', () => {
    useUiStore.getState().setSidebarCollapsed(true)

    expect(useUiStore.getState().sidebarCollapsed).toBe(true)
  })
})

describe('setZoomLevel', () => {
  it('updates the zoom level', () => {
    useUiStore.getState().setZoomLevel(2.5)

    expect(useUiStore.getState().zoomLevel).toBe(2.5)
  })
})

describe('setPreviewDatabaseId', () => {
  it('sets and clears the preview database id', () => {
    useUiStore.getState().setPreviewDatabaseId(42)

    expect(useUiStore.getState().previewDatabaseId).toBe(42)

    useUiStore.getState().setPreviewDatabaseId(null)

    expect(useUiStore.getState().previewDatabaseId).toBeNull()
  })
})
