import {
  compareAsc,
  addDays as dfAddDays,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  startOfDay,
} from 'date-fns'

const ISO_FORMAT = 'yyyy-MM-dd'

export function fromIso(iso: string): Date {
  if (typeof iso !== 'string' || iso.length === 0) {
    throw new Error(`fromIso expected a non-empty YYYY-MM-DD string, got: ${String(iso)}`)
  }
  const parsed = parseISO(iso)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ISO date string: ${iso}`)
  }
  return parsed
}

export function toIso(date: Date): string {
  return format(date, ISO_FORMAT)
}

export function today(): Date {
  return startOfDay(new Date())
}

export function todayIso(): string {
  return toIso(today())
}

export function compareLocalDates(a: Date, b: Date): -1 | 0 | 1 {
  const result = compareAsc(a, b)
  if (result < 0) return -1
  if (result > 0) return 1
  return 0
}

export function isBeforeLocalDate(a: Date, b: Date): boolean {
  return isBefore(a, b)
}

export function isAfterLocalDate(a: Date, b: Date): boolean {
  return isAfter(a, b)
}

export function isSameLocalDate(a: Date, b: Date): boolean {
  return isEqual(a, b)
}

export function addLocalDays(date: Date, days: number): Date {
  return dfAddDays(date, days)
}

export function diffInDays(a: Date, b: Date): number {
  return differenceInCalendarDays(a, b)
}

export function formatRelative(date: Date, reference: Date): string {
  const diff = diffInDays(date, reference)

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff <= 7) return `In ${diff} days`
  if (diff < -1 && diff >= -7) return `${Math.abs(diff)} days ago`

  return formatLong(date, reference)
}

export function formatLong(date: Date, reference: Date): string {
  const sameYear = date.getFullYear() === reference.getFullYear()
  return format(date, sameYear ? 'MMM d' : 'MMM d, yyyy')
}
