import { describe, expect, it } from 'vitest'
import type { MasterTrendMonth } from '@/types'
import { change, compactPhp, fromFirstActivity, holdingsOf, monthLabel, netWorthOf, niceTicks, profitOf } from './overview'

const month = (over: Partial<MasterTrendMonth> = {}): MasterTrendMonth => ({
  month: '2026-11', business_profit: 0, daily_income: 0, daily_expense: 0,
  php_balance: 0, usd_balance: 0, gold_stash: 0, account_gold: 0, account_cash_php: 0, ...over,
})
const rates = { usdRate: 0.2, phpRate: 60 }

describe('overview', () => {
  it('values gold and dollars at the given rates', () => {
    const m = month({ php_balance: 1000, usd_balance: 10, gold_stash: 100_000_000, account_gold: 50_000_000, account_cash_php: 500 })
    // 100M G = $20 = ₱1,200; 50M G = ₱600, plus ₱500 paid in cash
    expect(holdingsOf(m, rates)).toEqual({ php: 1000, usd: 600, gold: 1200, accounts: 1100 })
    expect(netWorthOf(m, rates)).toBe(3900)
  })

  it('adds the Daily net to the Business profit', () => {
    expect(profitOf(month({ business_profit: 7000, daily_income: 1000, daily_expense: 55000 }))).toEqual({ business: 7000, daily: -54000, total: -47000 })
  })

  it('starts the charts the month before records begin', () => {
    const quiet = (ym: string) => month({ month: ym, php_balance: 500 })
    const months = [quiet('2026-01'), quiet('2026-02'), quiet('2026-03'), month({ month: '2026-04', php_balance: 800 }), month({ month: '2026-05', php_balance: 800, daily_expense: 10 })]
    expect(fromFirstActivity(months).map((m) => m.month)).toEqual(['2026-03', '2026-04', '2026-05'])
    // Profit alone counts as activity
    expect(fromFirstActivity([month({ month: '2026-01' }), month({ month: '2026-02', business_profit: 5 })]).map((m) => m.month)).toEqual(['2026-01', '2026-02'])
    // Nothing ever happened: still the last two months
    expect(fromFirstActivity([quiet('2026-01'), quiet('2026-02'), quiet('2026-03')]).map((m) => m.month)).toEqual(['2026-02', '2026-03'])
  })

  it('labels months', () => {
    expect(monthLabel('2026-11')).toBe('Nov')
    expect(monthLabel('2025-12', true)).toBe('December 2025')
  })

  it('shortens pesos', () => {
    expect(compactPhp(950)).toBe('₱950')
    expect(compactPhp(12_500)).toBe('₱12.5k')
    expect(compactPhp(584_017)).toBe('₱584k')
    expect(compactPhp(-1_250_000)).toBe('−₱1.25M')
  })

  it('makes round ticks that include zero', () => {
    expect(niceTicks(0, 584_017)).toEqual([0, 200_000, 400_000, 600_000])
    expect(niceTicks(-54_000, 7_000)).toEqual([-60_000, -40_000, -20_000, 0, 20_000])
    expect(niceTicks(0, 0)).toEqual([0])
  })

  it('measures change', () => {
    expect(change(120, 100)).toEqual({ amount: 20, pct: 20 })
    expect(change(-50, -100)).toEqual({ amount: 50, pct: 50 })
    expect(change(10, 0)).toEqual({ amount: 10, pct: null })
  })
})
