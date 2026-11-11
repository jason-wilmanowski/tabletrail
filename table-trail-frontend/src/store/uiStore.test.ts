import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUiStore } from './uiStore'
import { COLUMN_HIGHLIGHT_DELAY_MS, COLUMN_HIGHLIGHT_DURATION_MS } from '../utils/graphFocus'

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

describe('focusColumn', () => {
  const HIGHLIGHT_TOTAL_MS = COLUMN_HIGHLIGHT_DELAY_MS + COLUMN_HIGHLIGHT_DURATION_MS

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('selects the table, requests a focus and highlights the column', () => {
    useUiStore.getState().focusColumn(7, 42)

    const state = useUiStore.getState()
    expect(state.selectedTableId).toBe('7')
    expect(state.focusRequest).toBe(initialState.focusRequest + 1)
    expect(state.columnHighlight?.columnId).toBe(42)
  })

  it('clears the highlight once the animation is over', () => {
    useUiStore.getState().focusColumn(7, 42)

    vi.advanceTimersByTime(HIGHLIGHT_TOTAL_MS - 1)
    expect(useUiStore.getState().columnHighlight).not.toBeNull()

    vi.advanceTimersByTime(1)
    expect(useUiStore.getState().columnHighlight).toBeNull()
  })

  it('keeps the selection and focus request when the highlight clears', () => {
    useUiStore.getState().focusColumn(7, 42)
    vi.advanceTimersByTime(HIGHLIGHT_TOTAL_MS)

    expect(useUiStore.getState().selectedTableId).toBe('7')
    expect(useUiStore.getState().focusRequest).toBe(initialState.focusRequest + 1)
  })

  it('restarts with a new token when the same column is picked again', () => {
    useUiStore.getState().focusColumn(7, 42)
    const firstToken = useUiStore.getState().columnHighlight!.token

    vi.advanceTimersByTime(HIGHLIGHT_TOTAL_MS - 100)
    useUiStore.getState().focusColumn(7, 42)

    expect(useUiStore.getState().columnHighlight!.token).not.toBe(firstToken)

    // The first timer must not cut the second highlight short.
    vi.advanceTimersByTime(100)
    expect(useUiStore.getState().columnHighlight).not.toBeNull()

    vi.advanceTimersByTime(HIGHLIGHT_TOTAL_MS - 100)
    expect(useUiStore.getState().columnHighlight).toBeNull()
  })
})
