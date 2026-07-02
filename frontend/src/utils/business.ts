import type { BusinessTransaction } from '@/types'

export function isBusinessIncome(tx: Pick<BusinessTransaction, 'action' | 'type'>): boolean {
  return tx.action === 'sell' || (tx.type !== 'expense' && tx.action === null)
}
