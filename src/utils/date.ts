/** Local calendar date as `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function daysAgo(days: number, from = new Date()): string {
  const date = new Date(from)
  date.setDate(date.getDate() - days)
  return toIsoDate(date)
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
]

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatRelative(iso: string, now = Date.now()): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000)
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormatter.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export function formatLongDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Formats a `YYYY-MM-DD` value as "Sep 25, 2026" without time-zone drift. */
export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year!, month! - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
}
