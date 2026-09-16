import { describe, expect, it } from 'vitest'
import { truncateWithEllipsis } from './textClamp'

/** A `fits` stand-in: true as long as the candidate is no longer than `max` characters. */
function maxLength(max: number) {
  return (candidate: string) => candidate.length <= max
}

describe('truncateWithEllipsis', () => {
  it('returns the text unchanged when it already fits', () => {
    expect(truncateWithEllipsis('short', maxLength(20))).toBe('short')
  })

  it('truncates and appends an ellipsis when the text does not fit', () => {
    const result = truncateWithEllipsis('this text is much too long to fit', maxLength(10))
    expect(result.length).toBeLessThanOrEqual(10)
    expect(result.endsWith('…')).toBe(true)
  })

  it('trims trailing whitespace left by truncation before the ellipsis', () => {
    const result = truncateWithEllipsis('one two three four five', maxLength(9))
    // "one two t" would leave a partial word — trimEnd only removes
    // whitespace, so this just confirms no " …" (space then ellipsis).
    expect(result).not.toContain(' …')
  })

  it('always returns at least a bare ellipsis when nothing else fits', () => {
    const result = truncateWithEllipsis('anything', () => false)
    expect(result).toBe('…')
  })

  it('returns the full text unchanged for an empty string', () => {
    expect(truncateWithEllipsis('', maxLength(5))).toBe('')
  })

  it('finds the maximal fitting prefix, not just any fitting one', () => {
    // fits() allows up to 12 chars total (prefix + ellipsis), so the
    // longest valid prefix is 11 chars before the ellipsis is appended.
    const result = truncateWithEllipsis('abcdefghijklmnopqrstuvwxyz', maxLength(12))
    expect(result).toBe('abcdefghijk…')
  })
})
