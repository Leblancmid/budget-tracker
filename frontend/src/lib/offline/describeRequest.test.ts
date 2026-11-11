import { describe, expect, it } from 'vitest'
import { describeEntry, describeRequest } from './describeRequest'
import type { PendingEntry } from './outbox'

const json = (o: object) => JSON.stringify(o)

describe('describing changes made offline', () => {
  it('names business actions in words', () => {
    expect(describeRequest('POST', '/rucoy/accounts/12/archive', null, () => 'Leblanc 621 Dist')).toBe('Sell account “Leblanc 621 Dist”')
    expect(describeRequest('POST', '/business/transactions', json({ description: '9/100 Crash' }))).toBe('Add sale “9/100 Crash”')
    expect(describeRequest('POST', '/business/transactions/7/sell', json({ gold: 1 }), () => 'Gold 500KK')).toBe('Sell gold from “Gold 500KK”')
    expect(describeRequest('DELETE', '/master/balance-entries/9', null)).toBe('Delete wallet entry #9')
    expect(describeRequest('POST', '/rucoy/golds/adjust', json({ actual: 5 }))).toBe('Correct the gold stash')
  })

  it('reads an account form sent as POST with _method=PUT as an edit', () => {
    const form: [string, string][] = [['_method', 'PUT'], ['description', 'Leblanc 600 Dist']]
    expect(describeRequest('POST', '/rucoy/accounts/4', form)).toBe('Edit account “Leblanc 600 Dist”')
  })

  it('says how much gold when there is no name (a gold trade from Quick Add)', () => {
    expect(describeRequest('POST', '/business/transactions', json({ type: 'gold', price_gold: 500_000_000 }))).toBe('Add sale · 500KK gold')
    expect(describeRequest('POST', '/business/transactions', json({ type: 'gold', price_gold: 1_250_000_000 }))).toBe('Add sale · 1.25KKK gold')
  })

  it('falls back to the request for anything unknown', () => {
    expect(describeRequest('PATCH', '/something/new', null)).toBe('PATCH /something/new')
  })

  it('describes daily entries with their amount', () => {
    const e = { client_id: 'x', user_id: 1, kind: 'update', transaction_id: 3, created_at: 1, error: null,
      payload: { category_id: 1, type: 'expense', amount: 250, description: 'Lunch', date: '2026-11-11' } } as PendingEntry
    expect(describeEntry(e)).toEqual({ label: 'Edit expense “Lunch”', amount: '₱250.00' })
  })
})
