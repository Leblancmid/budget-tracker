import { useCallback, useState } from 'react'
import { transactionsApi } from '@/api/transactions'
import type { Paginated, Transaction, TransactionFilters } from '@/types'
import { useAsyncData } from './useAsyncData'

const EMPTY_PAGE: Paginated<Transaction> = {
  data: [],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: null, last_page: 1, per_page: 10, to: null, total: 0 },
}

export function useTransactions(initialFilters: TransactionFilters = {}) {
  const [filters, setFilters] = useState<TransactionFilters>({ per_page: 10, page: 1, ...initialFilters })

  const load = useCallback(() => transactionsApi.getAll(filters), [filters])
  const { data: result, loading, error, refetch } = useAsyncData(load, EMPTY_PAGE)

  const applyFilters = (updated: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated, page: 1 }))
  }

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  /** Add an entry; offline it waits on the device (`queued: true`) and is sent later. */
  const create = async (data: Parameters<typeof transactionsApi.create>[0]) => {
    const result = await transactionsApi.createOrQueue(data)
    if (!result.queued) await refetch()
    return result
  }

  /** Edit an entry; offline the edit waits on the device (`queued: true`) and is sent later. */
  const update = async (id: number, data: Parameters<typeof transactionsApi.updateOrQueue>[1]) => {
    const result = await transactionsApi.updateOrQueue(id, data)
    if (!result.queued) await refetch()
    return result
  }

  /** Delete an entry; offline the delete waits on the device (`queued: true`) and is sent later. */
  const remove = async (tx: Transaction) => {
    const result = await transactionsApi.deleteOrQueue(tx)
    if (!result.queued) await refetch()
    return result
  }

  return {
    transactions: result.data,
    meta: result.meta,
    filters,
    loading,
    error,
    applyFilters,
    setPage,
    refetch,
    create,
    update,
    remove,
  }
}
