import { beforeEach, describe, expect, it } from 'vitest'
import { useSettingsStore } from './settingsStore'

const initialState = useSettingsStore.getState()

beforeEach(() => {
  useSettingsStore.setState(initialState, true)
  localStorage.clear()
})

it('starts with no stored values', () => {
  expect(useSettingsStore.getState().values).toEqual({})
})

describe('setValue', () => {
  it('stores a value under its key', () => {
    useSettingsStore.getState().setValue('test.first', true)

    expect(useSettingsStore.getState().values).toEqual({ 'test.first': true })
  })

  it('overwrites an existing value without touching other keys', () => {
    useSettingsStore.getState().setValue('test.first', true)
    useSettingsStore.getState().setValue('test.second', true)
    useSettingsStore.getState().setValue('test.first', false)

    expect(useSettingsStore.getState().values).toEqual({ 'test.first': false, 'test.second': true })
  })

  it('persists values to localStorage', () => {
    useSettingsStore.getState().setValue('test.first', true)

    const stored = JSON.parse(localStorage.getItem('tabletrail-settings') ?? '{}')

    expect(stored.state.values).toEqual({ 'test.first': true })
  })
})

describe('resetAll', () => {
  it('clears every stored value', () => {
    useSettingsStore.getState().setValue('test.first', true)
    useSettingsStore.getState().setValue('test.second', false)

    useSettingsStore.getState().resetAll()

    expect(useSettingsStore.getState().values).toEqual({})
  })
})
