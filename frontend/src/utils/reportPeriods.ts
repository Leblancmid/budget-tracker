import type { ReportPeriod, ReportRow } from '@/types'
import { MONTHS } from './format'

export const PERIOD_TABS: { value: ReportPeriod; label: string; unit: string }[] = [
  { value: 'weekly',  label: 'Weekly',  unit: 'week'  },
  { value: 'monthly', label: 'Monthly', unit: 'month' },
  { value: 'yearly',  label: 'Yearly',  unit: 'year'  },
]

export const periodUnit = (period: ReportPeriod) => PERIOD_TABS.find((p) => p.value === period)!.unit

/** Short x-axis label for a row ("Week 2 (Oct 8–14)" → "W2", "October 2026" → "Oct"). */
export function shortLabel(row: ReportRow, period: ReportPeriod, i: number): string {
  if (period === 'weekly')  return `W${i + 1}`
  if (period === 'monthly') return row.label.slice(0, 3)
  return row.label
}

/** Index of the row that contains today, or -1. */
export function currentIndex(period: ReportPeriod, rows: ReportRow[], year: number, month: number, now = new Date()): number {
  if (period === 'monthly') return year === now.getFullYear() ? now.getMonth() : -1
  if (period === 'weekly')  return year === now.getFullYear() && month === now.getMonth() + 1 ? Math.min(Math.floor((now.getDate() - 1) / 7), rows.length - 1) : -1
  return rows.findIndex((r) => r.label === String(now.getFullYear()))
}

/** "October 2026" (weekly), "2026" (monthly) or "All years". */
export function rangeLabel(period: ReportPeriod, year: number, month: number): string {
  if (period === 'weekly')  return `${MONTHS[month - 1]} ${year}`
  if (period === 'monthly') return String(year)
  return 'All years'
}

/** File name for a report's CSV export, e.g. "business-weekly-2026-10". */
export function exportName(prefix: string, period: ReportPeriod, year: number, month: number): string {
  return `${prefix}-${period}-${period === 'weekly' ? `${year}-${month}` : year}`
}

/** Running total down the rows. */
export function runningTotals(rows: ReportRow[], valueOf: (r: ReportRow) => number): number[] {
  let acc = 0
  return rows.map((r) => (acc += valueOf(r)))
}
