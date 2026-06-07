import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { compareLocalDates, formatRelative, fromIso, today, todayIso } from '../local-date'

describe('fromIso', () => {
  it('parses a valid YYYY-MM-DD string', () => {
    const d = fromIso('2026-06-06')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(5)
    expect(d.getDate()).toBe(6)
  })

  it('throws on empty string with a clear message', () => {
    expect(() => fromIso('')).toThrow(/non-empty YYYY-MM-DD/)
  })

  it('throws on undefined', () => {
    expect(() => fromIso(undefined as unknown as string)).toThrow(/non-empty YYYY-MM-DD/)
  })

  it('throws on non-date string', () => {
    expect(() => fromIso('not-a-date')).toThrow()
  })

  it('throws on invalid month', () => {
    expect(() => fromIso('2026-13-01')).toThrow()
  })

  it('throws on invalid day-of-month (Feb 30)', () => {
    expect(() => fromIso('2026-02-30')).toThrow()
  })
})

describe('today / todayIso', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('today() returns local midnight', () => {
    vi.setSystemTime(new Date('2026-06-06T15:42:17.123'))
    const t = today()
    expect(t.getHours()).toBe(0)
    expect(t.getMinutes()).toBe(0)
    expect(t.getSeconds()).toBe(0)
    expect(t.getMilliseconds()).toBe(0)
    expect(t.getFullYear()).toBe(2026)
    expect(t.getMonth()).toBe(5)
    expect(t.getDate()).toBe(6)
  })

  it('todayIso() matches the local calendar date', () => {
    vi.setSystemTime(new Date('2026-06-06T15:42:17'))
    expect(todayIso()).toBe('2026-06-06')
  })
})

describe('compareLocalDates', () => {
  it('returns -1 when a is before b', () => {
    expect(compareLocalDates(fromIso('2026-06-05'), fromIso('2026-06-06'))).toBe(-1)
  })

  it('returns 0 when same day', () => {
    expect(compareLocalDates(fromIso('2026-06-06'), fromIso('2026-06-06'))).toBe(0)
  })

  it('returns 1 when a is after b', () => {
    expect(compareLocalDates(fromIso('2026-06-07'), fromIso('2026-06-06'))).toBe(1)
  })

  it('handles year boundaries', () => {
    expect(compareLocalDates(fromIso('2025-12-31'), fromIso('2026-01-01'))).toBe(-1)
  })
})

describe('formatRelative', () => {
  const ref = fromIso('2026-06-06')

  it('returns "Today" for same day', () => {
    expect(formatRelative(ref, ref)).toBe('Today')
  })

  it('returns "Tomorrow" for next day', () => {
    expect(formatRelative(fromIso('2026-06-07'), ref)).toBe('Tomorrow')
  })

  it('returns "Yesterday" for previous day', () => {
    expect(formatRelative(fromIso('2026-06-05'), ref)).toBe('Yesterday')
  })

  it('returns "In N days" for 2 to 7 days ahead', () => {
    expect(formatRelative(fromIso('2026-06-08'), ref)).toBe('In 2 days')
    expect(formatRelative(fromIso('2026-06-13'), ref)).toBe('In 7 days')
  })

  it('returns "N days ago" for 2 to 7 days behind', () => {
    expect(formatRelative(fromIso('2026-06-04'), ref)).toBe('2 days ago')
    expect(formatRelative(fromIso('2026-05-30'), ref)).toBe('7 days ago')
  })

  it('falls through to long-form for > 7 days ahead', () => {
    expect(formatRelative(fromIso('2026-06-14'), ref)).toBe('Jun 14')
  })

  it('falls through to long-form for > 7 days behind', () => {
    expect(formatRelative(fromIso('2026-05-29'), ref)).toBe('May 29')
  })
})
