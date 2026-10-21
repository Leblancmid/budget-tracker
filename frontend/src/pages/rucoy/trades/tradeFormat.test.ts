import { describe, expect, it } from 'vitest'
import type { Trade } from '@/types'
import { dueLabel, formatAmount, sortByCompletion } from './tradeFormat'

const trade = (overrides: Partial<Trade>) => ({ status: 'cash', amount: '0', currency: null, completion_date: null, ...overrides }) as Trade
const today = new Date(2026, 9, 21, 15)

describe('trade formatting', () => {
  it('shows KKS in G and cash in its currency', () => {
    expect(formatAmount(trade({ status: 'kks', amount: '5000000' }))).toBe('5,000,000 G')
    expect(formatAmount(trade({ amount: '12.5', currency: 'USD' }))).toBe('$12.50')
  })

  it('counts down to the completion date', () => {
    expect(dueLabel(null, today).text).toBe('No date')
    expect(dueLabel('2026-10-19', today).text).toBe('2d overdue')
    expect(dueLabel('2026-10-21', today).text).toBe('Due today')
    expect(dueLabel('2026-10-25', today).text).toBe('in 4d')
  })

  it('sorts by completion date with undated trades last', () => {
    const list = [trade({ completion_date: '2026-11-01' }), trade({}), trade({ completion_date: '2026-10-25' })]
    expect(sortByCompletion(list, 'asc').map((t) => t.completion_date)).toEqual(['2026-10-25', '2026-11-01', null])
    expect(sortByCompletion(list, 'desc').map((t) => t.completion_date)).toEqual(['2026-11-01', '2026-10-25', null])
  })
})
