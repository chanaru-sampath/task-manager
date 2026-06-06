import { format } from 'date-fns'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  addLocalDays,
  compareLocalDates,
  diffInDays,
  formatLong,
  formatRelative,
  fromIso,
  isAfterLocalDate,
  isBeforeLocalDate,
  isSameLocalDate,
  toIso,
  today,
  todayIso,
} from '../local-date'

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

describe('toIso', () => {
  it('formats a Date as YYYY-MM-DD using local date parts', () => {
    const d = new Date(2026, 5, 6, 15, 30)
    expect(toIso(d)).toBe('2026-06-06')
  })

  it('pads single-digit months and days', () => {
    const d = new Date(2026, 0, 5)
    expect(toIso(d)).toBe('2026-01-05')
  })

  it('uses local date components, not UTC (regression for toISOString bug)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T23:30:00'))
    try {
      const now = new Date()
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      expect(toIso(now)).toBe(expected)
      expect(toIso(now)).toBe(format(now, 'yyyy-MM-dd'))
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('fromIso / toIso roundtrip', () => {
  it('preserves the calendar date', () => {
    const iso = '2026-12-31'
    expect(toIso(fromIso(iso))).toBe(iso)
  })

  it('handles leap day', () => {
    expect(toIso(fromIso('2024-02-29'))).toBe('2024-02-29')
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

describe('isBeforeLocalDate / isAfterLocalDate / isSameLocalDate', () => {
  const earlier = fromIso('2026-06-05')
  const same = fromIso('2026-06-06')
  const later = fromIso('2026-06-07')

  it('isBeforeLocalDate', () => {
    expect(isBeforeLocalDate(earlier, same)).toBe(true)
    expect(isBeforeLocalDate(same, same)).toBe(false)
    expect(isBeforeLocalDate(later, same)).toBe(false)
  })

  it('isAfterLocalDate', () => {
    expect(isAfterLocalDate(later, same)).toBe(true)
    expect(isAfterLocalDate(same, same)).toBe(false)
    expect(isAfterLocalDate(earlier, same)).toBe(false)
  })

  it('isSameLocalDate', () => {
    expect(isSameLocalDate(same, fromIso('2026-06-06'))).toBe(true)
    expect(isSameLocalDate(earlier, same)).toBe(false)
  })
})

describe('addLocalDays', () => {
  it('adds days within a month', () => {
    expect(toIso(addLocalDays(fromIso('2026-06-06'), 3))).toBe('2026-06-09')
  })

  it('subtracts days with negative input', () => {
    expect(toIso(addLocalDays(fromIso('2026-06-06'), -1))).toBe('2026-06-05')
  })

  it('rolls over month-end (Jan 31 + 1 -> Feb 1)', () => {
    expect(toIso(addLocalDays(fromIso('2026-01-31'), 1))).toBe('2026-02-01')
  })

  it('handles leap year (2024-02-28 + 1 -> 2024-02-29)', () => {
    expect(toIso(addLocalDays(fromIso('2024-02-28'), 1))).toBe('2024-02-29')
  })

  it('handles non-leap year (2025-02-28 + 1 -> 2025-03-01)', () => {
    expect(toIso(addLocalDays(fromIso('2025-02-28'), 1))).toBe('2025-03-01')
  })

  it('rolls over year-end (2026-12-31 + 1 -> 2027-01-01)', () => {
    expect(toIso(addLocalDays(fromIso('2026-12-31'), 1))).toBe('2027-01-01')
  })
})

describe('diffInDays', () => {
  it('returns 0 for the same day', () => {
    expect(diffInDays(fromIso('2026-06-06'), fromIso('2026-06-06'))).toBe(0)
  })

  it('returns 1 for next day', () => {
    expect(diffInDays(fromIso('2026-06-07'), fromIso('2026-06-06'))).toBe(1)
  })

  it('returns -1 for previous day', () => {
    expect(diffInDays(fromIso('2026-06-05'), fromIso('2026-06-06'))).toBe(-1)
  })

  it('returns 7 for a week apart', () => {
    expect(diffInDays(fromIso('2026-06-13'), fromIso('2026-06-06'))).toBe(7)
  })

  it('returns -7 for a week before', () => {
    expect(diffInDays(fromIso('2026-05-30'), fromIso('2026-06-06'))).toBe(-7)
  })

  it('returns 30 for a month apart', () => {
    expect(diffInDays(fromIso('2026-07-06'), fromIso('2026-06-06'))).toBe(30)
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

describe('formatLong', () => {
  it('omits year when same year', () => {
    expect(formatLong(fromIso('2026-06-06'), fromIso('2026-12-31'))).toBe('Jun 6')
  })

  it('includes year when different year', () => {
    expect(formatLong(fromIso('2027-06-06'), fromIso('2026-06-06'))).toBe('Jun 6, 2027')
  })
})
