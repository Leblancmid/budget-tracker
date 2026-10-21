import { describe, expect, it } from 'vitest'
import type { BalanceAccountConfig, BalanceEntry } from '@/types'
import { accountStats, allocation, balanceTotals, formatShare } from './balanceStats'

const account = (code: string, currency: 'USD' | 'PHP') => ({ code, name: code, currency, color: 'blue', icon: 'wallet' }) as BalanceAccountConfig
const entry = (account: string, type: 'add' | 'sell', amount: number, date: string) => ({ account, type, amount: String(amount), date }) as BalanceEntry

const accounts = [account('PAYPAL', 'USD'), account('GCASH', 'PHP'), account('EMPTY', 'PHP')]
const stats = accountStats([
  entry('PAYPAL', 'add', 100, '2026-10-01'),
  entry('PAYPAL', 'sell', 20, '2026-10-05'),
  entry('GCASH', 'add', 1000, '2026-10-03'),
])

describe('balance stats', () => {
  it('computes balance, count and latest date per account', () => {
    expect(stats.get('PAYPAL')).toEqual({ balance: 80, count: 2, last: '2026-10-05' })
    expect(stats.get('EMPTY')).toBeUndefined()
  })

  it('totals by currency and converts net worth to ₱', () => {
    expect(balanceTotals(accounts, stats, 58)).toEqual({ usd: 80, php: 1000, usdCount: 1, phpCount: 2, net: 1000 + 80 * 58 })
  })

  it('allocates positive balances in ₱, largest first', () => {
    const a = allocation(accounts, stats, 58)
    expect(a.sum).toBe(5640)
    expect(a.parts.map((p) => p.a.code)).toEqual(['PAYPAL', 'GCASH'])
    expect(a.parts[0].share).toBeCloseTo(4640 / 5640)
  })

  it('formats shares', () => {
    expect(formatShare(0.823)).toBe('82%')
    expect(formatShare(0.045)).toBe('4.5%')
  })
})
