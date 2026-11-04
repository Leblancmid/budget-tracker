import type { RecurringFrequency } from '@/types'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/** "Every month on the 15th." for a frequency starting on a Y-m-d date (same rule as the server). */
export function describeRepeat(frequency: RecurringFrequency, date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Pick the first date.'
  const [y, m, d] = date.split('-').map(Number)
  if (frequency === 'daily') return 'Every day.'
  if (frequency === 'weekly') return `Every ${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}.`
  return `Every month on the ${ordinal(d)}${d > 28 ? ' (the last day in shorter months)' : ''}.`
}
