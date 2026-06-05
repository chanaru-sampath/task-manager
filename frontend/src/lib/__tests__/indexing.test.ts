import { describe, expect, it } from 'vitest'

import { generateKeyBetween } from '../indexing'

describe('generateKeyBetween', () => {
  describe('both null', () => {
    it('returns 1.0 when prev and next are both null', () => {
      expect(generateKeyBetween(null, null)).toBe(1.0)
    })
  })

  describe('prev is null (insert at top)', () => {
    it('returns next - 1 when prev is null', () => {
      expect(generateKeyBetween(null, 5.0)).toBe(4.0)
    })

    it('returns a value less than next', () => {
      const result = generateKeyBetween(null, 3.0)
      expect(result).toBeLessThan(3.0)
    })

    it('handles next = 1.0', () => {
      expect(generateKeyBetween(null, 1.0)).toBe(0.0)
    })

    it('handles negative next value', () => {
      expect(generateKeyBetween(null, -2.0)).toBe(-3.0)
    })
  })

  describe('next is null (insert at bottom)', () => {
    it('returns prev + 1 when next is null', () => {
      expect(generateKeyBetween(5.0, null)).toBe(6.0)
    })

    it('returns a value greater than prev', () => {
      const result = generateKeyBetween(3.0, null)
      expect(result).toBeGreaterThan(3.0)
    })

    it('handles prev = 0', () => {
      expect(generateKeyBetween(0, null)).toBe(1.0)
    })

    it('handles negative prev value', () => {
      expect(generateKeyBetween(-3.0, null)).toBe(-2.0)
    })
  })

  describe('insert between two values', () => {
    it('returns the midpoint of prev and next', () => {
      expect(generateKeyBetween(1.0, 3.0)).toBe(2.0)
    })

    it('returns a value strictly between prev and next', () => {
      const result = generateKeyBetween(1.0, 2.0)
      expect(result).toBeGreaterThan(1.0)
      expect(result).toBeLessThan(2.0)
    })

    it('handles adjacent integer values', () => {
      expect(generateKeyBetween(1.0, 2.0)).toBe(1.5)
    })

    it('handles already fractional values', () => {
      expect(generateKeyBetween(1.0, 1.5)).toBe(1.25)
    })

    it('handles negative range', () => {
      expect(generateKeyBetween(-3.0, -1.0)).toBe(-2.0)
    })

    it('handles range spanning zero', () => {
      expect(generateKeyBetween(-1.0, 1.0)).toBe(0.0)
    })
  })
})
