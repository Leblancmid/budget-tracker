import { describe, expect, it } from 'vitest'
import type { ReportRow } from '@/types'
import { currentIndex, exportName, periodUnit, rangeLabel, runningTotals, shortLabel } from './reportPeriods'

const row = (label: string, income = 0, expense = 0): ReportRow => ({ label, income, expense })
const today = new Date(2026, 9, 21) // Oct 21, 2026

describe('report periods', () => {
  it('labels the x-axis compactly', () => {
    expect(shortLabel(row('Week 2 (Oct 8–14)'), 'weekly', 1)).toBe('W2')
    expect(shortLabel(row('October 2026'), 'monthly', 9)).toBe('Oct')
    expect(shortLabel(row('2026'), 'yearly', 0)).toBe('2026')
  })

  it('finds the row containing today', () => {
    const weeks = [1, 2, 3, 4, 5].map((n) => row(`Week ${n}`))
    expect(currentIndex('weekly', weeks, 2026, 10, today)).toBe(2) // Oct 21 → week 3
    expect(currentIndex('weekly', weeks, 2026, 9, today)).toBe(-1)
    expect(currentIndex('monthly', [], 2026, 10, today)).toBe(9)
    expect(currentIndex('monthly', [], 2025, 10, today)).toBe(-1)
    expect(currentIndex('yearly', [row('2025'), row('2026')], 0, 0, today)).toBe(1)
  })

  it('describes the range and names exports', () => {
    expect(rangeLabel('weekly', 2026, 10)).toBe('October 2026')
    expect(rangeLabel('monthly', 2026, 10)).toBe('2026')
    expect(rangeLabel('yearly', 2026, 10)).toBe('All years')
    expect(exportName('business', 'weekly', 2026, 10)).toBe('business-weekly-2026-10')
    expect(exportName('business', 'monthly', 2026, 10)).toBe('business-monthly-2026')
    expect(periodUnit('monthly')).toBe('month')
  })

  it('keeps a running total', () => {
    expect(runningTotals([row('a', 10, 4), row('b', 0, 3), row('c', 5, 0)], (r) => r.income - r.expense)).toEqual([6, 3, 8])
  })
})
