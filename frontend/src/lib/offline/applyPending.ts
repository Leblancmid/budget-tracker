import type { Category, Transaction } from '@/types'
import { kindOf, type PendingEntry } from './outbox'

/** A transaction as listed, with whether it has an offline edit waiting to be sent. */
export type ListedTransaction = Transaction & { waitingToSync?: boolean }

/**
 * The list as it will be once the waiting offline changes reach the server: edited entries show
 * their new values (marked as waiting), deleted ones are left out. Newest date first, as the server
 * sorts it (an edit can move an entry to another day).
 */
export function applyPending(list: Transaction[], pending: PendingEntry[], categories: Category[]): ListedTransaction[] {
  const changes = pending.filter((e) => (kindOf(e) === 'update' || kindOf(e) === 'delete') && e.error === null)
  if (changes.length === 0) return list

  const deleted = new Set(changes.filter((e) => kindOf(e) === 'delete').map((e) => e.transaction_id))
  const edits = new Map(changes.filter((e) => kindOf(e) === 'update').map((e) => [e.transaction_id, e.payload!]))

  const shown = list.filter((tx) => !deleted.has(tx.id)).map((tx): ListedTransaction => {
    const p = edits.get(tx.id)
    if (!p) return tx
    const category = categories.find((c) => c.id === p.category_id) ?? tx.category
    return {
      ...tx,
      category_id: category.id,
      category,
      type: p.type as Transaction['type'],
      scope: p.scope ?? tx.scope,
      amount: String(p.amount),
      description: p.description ?? null,
      date: p.date,
      notes: p.notes ?? null,
      balance_entry: p.balance_account === undefined ? tx.balance_entry
        : p.balance_account === null ? null
        : { id: tx.balance_entry?.id ?? 0, transaction_id: tx.id, account: p.balance_account },
      waitingToSync: true,
    }
  })

  // Keep the server's order within a day; a moved entry joins its new day
  return shown.map((tx, i) => ({ tx, i })).sort((a, b) => b.tx.date.localeCompare(a.tx.date) || a.i - b.i).map(({ tx }) => tx)
}
