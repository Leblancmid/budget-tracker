import { describe, expect, it } from 'vitest'
import type { BusinessTransaction } from '@/types'
import { goldTopUp } from './goldTrade'

const trade = (overrides: Partial<BusinessTransaction> = {}) => ({
  type: 'gold',
  date: '2026-10-01',
  price_gold: '1200000',
  cost_gold: '700000',
  price_rate: '0.2',
  cost_rate: '0.2',
  php_rate: '60',
  cost_php_rate: null,
  price_php: '14.40',
  cost_php: '8.40',
  ...overrides,
}) as BusinessTransaction

describe('goldTopUp', () => {
  it('adds gold and recomputes ₱ from the trade rates', () => {
    const r = goldTopUp(trade(), 100_000, 50_000)
    expect(r).toMatchObject({ oldPrice: 1_200_000, newPrice: 1_300_000, oldCost: 700_000, newCost: 750_000 })
    expect(r.pricePhp).toBe(15.6)
    expect(r.costPhp).toBe(9)
    expect(r.profitPhp).toBeCloseTo(6.6)
    expect(r.payload).toMatchObject({ type: 'gold', price_gold: 1_300_000, cost_gold: 750_000, amount: 6.6 })
  })

  it('scales the old ₱ value when the trade has no rates', () => {
    const r = goldTopUp(trade({ price_rate: null, cost_rate: null, php_rate: null }), 600_000, 0)
    expect(r.pricePhp).toBe(21.6) // 14.40 × 1.8M / 1.2M
    expect(r.costPhp).toBe(8.4)
  })

  it('floors the payload amount at 0.01 when there is no profit', () => {
    const r = goldTopUp(trade({ price_php: null, cost_php: null, price_rate: null, cost_rate: null, php_rate: null }), 1, 0)
    expect(r.pricePhp).toBeNull()
    expect(r.payload.amount).toBe(0.01)
  })
})
