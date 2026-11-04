import { describe, expect, it } from 'vitest'
import { accountCostPhp, blendedPhpPerMillion, tradeShareCostPhp } from './accountCost'

// 540M at .17 × 63.4 = ₱5,820.12; 460M at .1777 × 62.53 = ₱5,111.33
const BOTH = { gold: 1_000_000_000, php: 10931.45 }

describe('accountCostPhp', () => {
  it('is the exact sum once fully paid, whatever the typed rate', () => {
    expect(accountCostPhp(BOTH, 1_000_000_000, 0.2, 60)).toBe(10931.45)
  })

  it('values unpaid gold at the typed rate', () => {
    expect(accountCostPhp({ gold: 460_000_000, php: 5111.33 }, 1_000_000_000, 0.2, 60)).toBe(11591.33)
  })

  it('is unknown while unpaid gold has no rates', () => {
    expect(accountCostPhp({ gold: 460_000_000, php: 5111.33 }, 1_000_000_000, null, null)).toBeNull()
  })

  it('matches the old single-rate cost when there are no payments', () => {
    expect(accountCostPhp({ gold: 0, php: 0 }, 1_000_000_000, 0.17, 63.4)).toBe(10778)
  })
})

describe('tradeShareCostPhp', () => {
  it('carries the trade cost over by the share of gold taken', () => {
    expect(tradeShareCostPhp({ cost_gold: 600_000_000, cost_php: 6666.95 }, 460_000_000)).toBe(5111.33)
    expect(tradeShareCostPhp({ cost_gold: 600_000_000, cost_php: null }, 1)).toBeNull()
  })
})

describe('blendedPhpPerMillion', () => {
  it('is ₱ per 1M gold across all payments', () => {
    expect(blendedPhpPerMillion(BOTH)).toBeCloseTo(10.93145)
    expect(blendedPhpPerMillion({ gold: 0, php: 0 })).toBeNull()
  })
})
