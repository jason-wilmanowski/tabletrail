import { beforeEach, describe, expect, it } from 'vitest'
import { useFilterStore } from './filterStore'

const initialState = useFilterStore.getState()

beforeEach(() => {
  useFilterStore.setState(initialState, true)
})

it('starts with no schema filter and an empty search query', () => {
  expect(useFilterStore.getState().activeSchemaFilter).toBeNull()
  expect(useFilterStore.getState().searchQuery).toBe('')
})

describe('setActiveSchemaFilter', () => {
  it('sets and clears the active schema filter', () => {
    useFilterStore.getState().setActiveSchemaFilter('public')

    expect(useFilterStore.getState().activeSchemaFilter).toBe('public')

    useFilterStore.getState().setActiveSchemaFilter(null)

    expect(useFilterStore.getState().activeSchemaFilter).toBeNull()
  })
})

describe('setSearchQuery', () => {
  it('updates the search query', () => {
    useFilterStore.getState().setSearchQuery('users')

    expect(useFilterStore.getState().searchQuery).toBe('users')
  })
})
