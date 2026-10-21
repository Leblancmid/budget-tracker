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

  const create = async (data: Parameters<typeof transactionsApi.create>[0]) => {
    const tx = await transactionsApi.create(data)
    await refetch()
    return tx
  }

  const update = async (id: number, data: Parameters<typeof transactionsApi.update>[1]) => {
    const tx = await transactionsApi.update(id, data)
    await refetch()
    return tx
  }

  const remove = async (id: number) => {
    await transactionsApi.delete(id)
    await refetch()
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
