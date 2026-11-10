import { describe, expect, it } from 'vitest'
import type { Category, Transaction } from '@/types'
import { applyPending } from './applyPending'
import type { PendingEntry } from './outbox'

const food = { id: 1, name: 'Food', type: 'expense' } as Category
const transport = { id: 2, name: 'Transportations', type: 'expense' } as Category
const tx = (id: number, date: string, description: string): Transaction => ({
  id, category_id: 1, category: food, type: 'expense', scope: 'personal', amount: '100.00', description, date,
  notes: null, balance_entry: { id: 9, transaction_id: id, account: 'GCASH' }, created_at: '', updated_at: '',
})
const change = (kind: 'update' | 'delete' | 'create', transaction_id: number | undefined, payload: Partial<PendingEntry['payload']> = {}, error: string | null = null): PendingEntry => ({
  client_id: `c${transaction_id}${kind}`, user_id: 7, kind, transaction_id, created_at: 1, error,
  payload: { category_id: 1, type: 'expense', amount: 100, date: '2026-11-10', ...payload },
})

const list = [tx(3, '2026-11-10', 'Gas'), tx(2, '2026-11-09', 'Lunch'), tx(1, '2026-11-08', 'Rent')]

describe('applyPending', () => {
  it('shows waiting edits with their new values, marked', () => {
    const shown = applyPending(list, [change('update', 2, { amount: 320, description: 'Lunch with drinks', category_id: 2, date: '2026-11-09', balance_account: null })], [food, transport])
    expect(shown[1]).toMatchObject({ id: 2, amount: '320', description: 'Lunch with drinks', category: transport, balance_entry: null, waitingToSync: true })
    expect(shown[0].waitingToSync).toBeUndefined()
  })

  it('leaves out entries waiting to be deleted', () => {
    expect(applyPending(list, [change('delete', 2)], [food]).map((t) => t.id)).toEqual([3, 1])
  })

  it('moves an entry whose date was changed to its new day', () => {
    const shown = applyPending(list, [change('update', 1, { date: '2026-11-10', description: 'Rent' })], [food])
    expect(shown.map((t) => t.id)).toEqual([3, 1, 2])
  })

  it('ignores new entries and changes the server refused', () => {
    expect(applyPending(list, [change('create', undefined), change('delete', 2, {}, 'refused')], [food])).toBe(list)
  })

  it('keeps the wallet when the edit leaves it out', () => {
    const shown = applyPending(list, [change('update', 3, { description: 'Gas' })], [food])
    expect(shown[0].balance_entry?.account).toBe('GCASH')
  })
})
