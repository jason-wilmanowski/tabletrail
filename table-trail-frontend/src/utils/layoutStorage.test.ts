import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSavedLayout, saveLayout } from './layoutStorage'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('getSavedLayout', () => {
  it('returns an empty object when nothing has been saved for a database', () => {
    expect(getSavedLayout(1)).toEqual({})
  })

  it('returns a previously saved layout for that database id', () => {
    localStorage.setItem('tabletrail:layout:1', JSON.stringify({ 'table-1': { x: 10, y: 20 } }))

    expect(getSavedLayout(1)).toEqual({ 'table-1': { x: 10, y: 20 } })
  })

  it('does not mix up layouts saved for different database ids', () => {
    localStorage.setItem('tabletrail:layout:1', JSON.stringify({ 'table-1': { x: 1, y: 1 } }))
    localStorage.setItem('tabletrail:layout:2', JSON.stringify({ 'table-1': { x: 2, y: 2 } }))

    expect(getSavedLayout(1)).toEqual({ 'table-1': { x: 1, y: 1 } })
    expect(getSavedLayout(2)).toEqual({ 'table-1': { x: 2, y: 2 } })
  })

  it('returns an empty object when the stored value is not valid JSON', () => {
    localStorage.setItem('tabletrail:layout:1', 'not-json{')

    expect(getSavedLayout(1)).toEqual({})
  })

  it('returns an empty object when the stored value is not an object (e.g. a JSON number or null)', () => {
    localStorage.setItem('tabletrail:layout:1', '42')

    expect(getSavedLayout(1)).toEqual({})
  })

  it('never throws even if localStorage.getItem itself throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })

    expect(getSavedLayout(1)).toEqual({})
  })
})

describe('saveLayout', () => {
  it('persists positions so they can be read back via getSavedLayout', () => {
    saveLayout(1, { 'table-1': { x: 5, y: 6 } })

    expect(getSavedLayout(1)).toEqual({ 'table-1': { x: 5, y: 6 } })
  })

  it('overwrites any previously saved layout for the same database id', () => {
    saveLayout(1, { 'table-1': { x: 1, y: 1 } })
    saveLayout(1, { 'table-1': { x: 9, y: 9 } })

    expect(getSavedLayout(1)).toEqual({ 'table-1': { x: 9, y: 9 } })
  })

  it('does not throw when localStorage.setItem fails (e.g. quota exceeded)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    expect(() => saveLayout(1, { 'table-1': { x: 1, y: 1 } })).not.toThrow()
  })
})
