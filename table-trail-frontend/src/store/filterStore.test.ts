import { beforeEach, describe, expect, it } from 'vitest'
import { useFilterStore } from './filterStore'

const initialState = useFilterStore.getState()

beforeEach(() => {
  useFilterStore.setState(initialState, true)
})

it('starts with an empty search query in tables mode', () => {
  expect(useFilterStore.getState().searchQuery).toBe('')
  expect(useFilterStore.getState().searchMode).toBe('tables')
})

describe('setSearchQuery', () => {
  it('updates the search query', () => {
    useFilterStore.getState().setSearchQuery('users')

    expect(useFilterStore.getState().searchQuery).toBe('users')
  })
})

describe('setSearchMode', () => {
  it('switches between tables and columns mode', () => {
    useFilterStore.getState().setSearchMode('columns')

    expect(useFilterStore.getState().searchMode).toBe('columns')

    useFilterStore.getState().setSearchMode('tables')

    expect(useFilterStore.getState().searchMode).toBe('tables')
  })

  it('keeps the search query when switching modes', () => {
    useFilterStore.getState().setSearchQuery('user')
    useFilterStore.getState().setSearchMode('columns')

    expect(useFilterStore.getState().searchQuery).toBe('user')
  })
})
