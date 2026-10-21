import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BusinessTransaction, RucoyAccount } from '@/types'
import { daysUntilPayment, isDueSoon, isOverdue, nextSort, sellPreview, txProfitPhp } from './salesUtils'

const tx = (overrides: Partial<BusinessTransaction>) => overrides as BusinessTransaction
const account = (overrides: Partial<RucoyAccount>) => ({ payment_status: 'not_paid', payment_date: null, ...overrides }) as RucoyAccount

describe('sellPreview', () => {
  const trade = tx({ price_gold: '1200', cost_gold: '700', price_php: '14.40', cost_php: '8.40' })

  it('takes cost off by the same gold as the price', () => {
    // 1,200 / 700 selling 200 → 1,000 / 500
    expect(sellPreview(trade, 200)).toMatchObject({ costGold: 200, remaining: 1000, remainingCost: 500 })
  })

  it('caps the cost at what there is and sells it all on a full sale', () => {
    expect(sellPreview(trade, 900)).toMatchObject({ costGold: 700, remaining: 300, remainingCost: 0 })
    const all = sellPreview(trade, 1200)
    expect(all).toMatchObject({ fraction: 1, costGold: 700, remaining: 0 })
    expect(all.pricePhp).toBeCloseTo(14.4)
    expect(all.costPhp).toBeCloseTo(8.4)
  })

  it('pro-rates ₱ by each side', () => {
    const p = sellPreview(trade, 300)
    expect(p.pricePhp).toBeCloseTo(3.6) // 14.40 × 300 / 1,200
    expect(p.costPhp).toBeCloseTo(3.6)  // 8.40 × 300 / 700
  })
})

describe('txProfitPhp', () => {
  it('uses the stored profit, else price − cost, else null while unpriced', () => {
    expect(txProfitPhp(tx({ price_php: '10', cost_php: '4', profit_php: '6.5' }))).toBe(6.5)
    expect(txProfitPhp(tx({ price_php: '10', cost_php: '4', profit_php: null }))).toBe(6)
    expect(txProfitPhp(tx({ price_php: null, cost_php: '4' }))).toBeNull()
    expect(txProfitPhp(undefined)).toBeNull()
  })
})

describe('payment due dates', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 21, 15, 0)) })
  afterEach(() => { vi.useRealTimers() })

  it('counts whole days to the payment date', () => {
    expect(daysUntilPayment(account({ payment_date: '2026-10-24' }))).toBe(3)
    expect(daysUntilPayment(account({ payment_date: '2026-10-19' }))).toBe(-2)
    expect(daysUntilPayment(account({}))).toBeNull()
  })

  it('flags overdue and due-soon accounts that are not fully paid', () => {
    expect(isOverdue(account({ payment_date: '2026-10-19' }))).toBe(true)
    expect(isOverdue(account({ payment_date: '2026-10-19', payment_status: 'fully_paid' }))).toBe(false)
    expect(isDueSoon(account({ payment_date: '2026-10-28' }))).toBe(true)
    expect(isDueSoon(account({ payment_date: '2026-10-29' }))).toBe(false)
  })
})

describe('nextSort', () => {
  it('cycles off → high-to-low → low-to-high → off', () => {
    expect(nextSort(null)).toBe('desc')
    expect(nextSort('desc')).toBe('asc')
    expect(nextSort('asc')).toBeNull()
  })
})
