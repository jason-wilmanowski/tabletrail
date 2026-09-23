import { describe, expect, it } from 'vitest'
import { getDaysSince, parseBackendTimestamp } from './scanAge'

describe('parseBackendTimestamp', () => {
  it('reads a timestamp without offset as UTC', () => {
    expect(parseBackendTimestamp('2026-09-20T12:00:00').toISOString()).toBe('2026-09-20T12:00:00.000Z')
  })

  it('keeps an explicit offset', () => {
    expect(parseBackendTimestamp('2026-09-20T12:00:00+02:00').toISOString()).toBe('2026-09-20T10:00:00.000Z')
    expect(parseBackendTimestamp('2026-09-20T12:00:00Z').toISOString()).toBe('2026-09-20T12:00:00.000Z')
  })

  it('handles fractional seconds', () => {
    expect(parseBackendTimestamp('2026-09-20T12:00:00.123456').getTime()).toBe(Date.UTC(2026, 8, 20, 12, 0, 0, 123))
  })
})

describe('getDaysSince', () => {
  const now = new Date('2026-09-23T12:00:00Z')

  it('counts full days only', () => {
    expect(getDaysSince('2026-09-23T00:00:00', now)).toBe(0)
    expect(getDaysSince('2026-09-22T12:00:00', now)).toBe(1)
    expect(getDaysSince('2026-09-16T11:59:59', now)).toBe(7)
  })

  it('never returns a negative age for timestamps in the future', () => {
    expect(getDaysSince('2026-09-24T12:00:00', now)).toBe(0)
  })
})
