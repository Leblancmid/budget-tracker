import { describe, expect, it } from 'vitest'
import type { GoldLog } from '@/types'
import { goldFlow, logDelta, mmFeeTotal, shortG } from './summaryUtils'

const log = (type: GoldLog['type'], amount: number, created_at: string, cancelled = false) =>
  ({ id: Math.random(), type, amount: String(amount), description: null, created_at, cancelled_at: cancelled ? created_at : null }) as GoldLog

const now = new Date(2026, 9, 21, 12)

describe('gold summary', () => {
  it('signs log effects and ignores cancelled ones', () => {
    expect(logDelta(log('add', 100, '2026-10-01'))).toBe(100)
    expect(logDelta(log('sell', 40, '2026-10-01'))).toBe(-40)
    expect(logDelta(log('add', 100, '2026-10-01', true))).toBe(0)
  })

  it('totals middleman fees per period', () => {
    const logs = [
      log('fee', 10, new Date(2026, 9, 21, 9).toISOString()),
      log('fee', 20, new Date(2026, 9, 2).toISOString()),
      log('fee', 40, new Date(2026, 8, 15).toISOString()),
      log('fee', 80, new Date(2025, 5, 1).toISOString()),
      log('fee', 999, new Date(2026, 9, 21).toISOString(), true),
      log('add', 500, new Date(2026, 9, 21).toISOString()),
    ]
    expect(mmFeeTotal(logs, 'today', now)).toBe(10)
    expect(mmFeeTotal(logs, 'monthly', now)).toBe(30)
    expect(mmFeeTotal(logs, 'last_month', now)).toBe(40)
    expect(mmFeeTotal(logs, 'yearly', now)).toBe(70)
    expect(mmFeeTotal(logs, 'total', now)).toBe(150)
  })

  it('sums this month and buckets the last 30 days', () => {
    const flow = goldFlow([
      log('add', 1000, new Date(2026, 9, 20).toISOString()),
      log('sell', 300, new Date(2026, 9, 21).toISOString()),
      log('fee', 50, new Date(2026, 9, 21).toISOString()),
    ], now)
    expect(flow).toMatchObject({ added: 1000, sold: 300, fees: 50, net: 750 })
    expect(flow.days).toHaveLength(30)
    expect(flow.days[29]).toMatchObject({ inflow: 50, outflow: 300 })
  })

  it('shortens big numbers for chart labels', () => {
    expect(shortG(1_500_000_000)).toBe('1.5B')
    expect(shortG(350_000_000)).toBe('350M')
    expect(shortG(12_000)).toBe('12k')
  })
})
