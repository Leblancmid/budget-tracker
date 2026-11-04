import { describe, expect, it } from 'vitest'
import { cashToPhp, formatCash } from './cash'

describe('cashToPhp', () => {
  it('keeps pesos as they are', () => {
    expect(cashToPhp('8000', 'PHP', '')).toBe(8000)
  })

  it('converts dollars at the ₱ rate', () => {
    expect(cashToPhp('150', 'USD', '58')).toBe(8700)
  })

  it('is unknown without an amount, or for dollars without a rate', () => {
    expect(cashToPhp('', 'PHP', '')).toBeNull()
    expect(cashToPhp('150', 'USD', '')).toBeNull()
  })
})

describe('formatCash', () => {
  it('shows the currency symbol', () => {
    expect(formatCash(8000, 'PHP')).toBe('₱8,000')
    expect(formatCash(150.5, 'USD')).toBe('$150.5')
  })
})
