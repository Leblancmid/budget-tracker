import { describe, expect, it } from 'vitest'
import { formatDateLong, formatWithCommas, handleAmountInput, paginateLocally } from './format'

describe('handleAmountInput', () => {
  const accepted = (raw: string, allowDecimal = true) => {
    let out: string | null = null
    handleAmountInput(raw, (v) => { out = v }, allowDecimal)
    return out
  }

  it('strips thousands separators', () => {
    expect(accepted('1,200,000')).toBe('1200000')
  })

  it('accepts decimals only when allowed', () => {
    expect(accepted('12.5')).toBe('12.5')
    expect(accepted('12.5', false)).toBeNull()
  })

  it('rejects non-numeric input and allows clearing', () => {
    expect(accepted('12a')).toBeNull()
    expect(accepted('')).toBe('')
  })
})

describe('formatWithCommas', () => {
  it('groups the integer part and keeps the typed decimals', () => {
    expect(formatWithCommas('1200000')).toBe('1,200,000')
    expect(formatWithCommas('1234.5')).toBe('1,234.5')
    expect(formatWithCommas('1234.')).toBe('1,234.')
    expect(formatWithCommas('')).toBe('')
  })
})

describe('paginateLocally', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1)

  it('slices the requested page and reports its range', () => {
    const { paginated, meta } = paginateLocally(items, 2, 10)
    expect(paginated).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    expect(meta).toMatchObject({ current_page: 2, last_page: 3, from: 11, to: 20, total: 25 })
  })

  it('clamps an out-of-range page', () => {
    expect(paginateLocally(items, 9, 10).safePage).toBe(3)
    expect(paginateLocally([], 1, 10).meta).toMatchObject({ last_page: 1, from: null, to: null, total: 0 })
  })
})

describe('formatDateLong', () => {
  it('reads the date part without shifting by timezone', () => {
    expect(formatDateLong('2026-10-01T00:00:00Z')).toBe('October 1, 2026')
    expect(formatDateLong(null)).toBe('—')
  })
})
