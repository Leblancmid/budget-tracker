import { describe, expect, it } from 'vitest'
import type { BusinessTransaction } from '@/types'
import { costPaidInPhp, goldTopUp, goldWalletCost, usableGold } from './goldTrade'

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

describe('goldWalletCost', () => {
  it('prices bought gold in the wallet currency, like the server', () => {
    // 540KK × 0.17 $/M × 63.4 ₱/$
    expect(goldWalletCost(540_000_000, '0.17', '63.4', 'USD')).toBe(91.8)
    expect(goldWalletCost(540_000_000, 0.17, 63.4, 'PHP')).toBe(5820.12)
  })

  it('is unknown without gold or rates', () => {
    expect(goldWalletCost(0, 0.17, 63.4, 'PHP')).toBeNull()
    expect(goldWalletCost(1_000_000, null, 63.4, 'USD')).toBeNull()
    expect(goldWalletCost(1_000_000, 0.17, '', 'PHP')).toBeNull()
    expect(goldWalletCost(1_000_000, 0.17, null, 'USD')).toBe(0.17)
  })
})

describe('costPaidInPhp', () => {
  it('is gold bought with money: no cost gold, a ₱ cost', () => {
    expect(costPaidInPhp('0', '5830.00')).toBe(true)
    expect(costPaidInPhp(null, 5830)).toBe(true)
    expect(costPaidInPhp('540000000', '5820.12')).toBe(false)
    expect(costPaidInPhp('0', '0')).toBe(false)
  })

  it('tops up a peso-paid trade by the extra pesos', () => {
    const tx = trade({ price_gold: '540000000', cost_gold: '0', cost_php: '5830.00' })
    expect(goldTopUp(tx, 100_000_000, 0, 1000).costPhp).toBe(6830)
  })
})

describe('usableGold', () => {
  it('is only the gold received when a buyer is still paying', () => {
    expect(usableGold(trade({ price_gold: '501000000', price_gold_received: '80000' }))).toBe(80_000)
    expect(usableGold(trade({ price_gold: '540000000', price_gold_received: null }))).toBe(540_000_000)
    expect(usableGold(trade({ price_gold: '100', price_gold_received: '500' }))).toBe(100)
    expect(usableGold(trade({ price_gold: '24000000', price_gold_received: '0', system_key: 'middleman_fee' }))).toBe(24_000_000)
  })
})
