import { describe, expect, it } from 'vitest'
import { dailyInterest } from './balanceAccounts'

describe('dailyInterest', () => {
  it('is balance × rate ÷ 365 after the withheld tax, like the server', () => {
    // ₱100,000 at 3.65% = ₱10 a day, minus 20% tax
    expect(dailyInterest(100_000, 3.65)).toBe(8)
    expect(dailyInterest(100_000, 3.65, 0)).toBe(10)
  })

  it('earns nothing without a rate or on a zero / negative balance', () => {
    expect(dailyInterest(100_000, null)).toBe(0)
    expect(dailyInterest(100_000, 0)).toBe(0)
    expect(dailyInterest(-500, 3.65)).toBe(0)
  })
})
