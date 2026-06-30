import { useCallback, useEffect, useState } from 'react'
import { transactionsApi } from '@/api/transactions'
import type { Paginated, Transaction, TransactionFilters } from '@/types'

const EMPTY_PAGE: Paginated<Transaction> = {
  data: [],
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: null, last_page: 1, per_page: 10, to: null, total: 0 },
}

export function useTransactions(initialFilters: TransactionFilters = {}) {
  const [result, setResult] = useState<Paginated<Transaction>>(EMPTY_PAGE)
  const [filters, setFilters] = useState<TransactionFilters>({ per_page: 10, page: 1, ...initialFilters })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (f: TransactionFilters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await transactionsApi.getAll(f)
      setResult(data)
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch(filters) }, [fetch, filters])

  const applyFilters = (updated: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated, page: 1 }))
  }

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  const create = async (data: Parameters<typeof transactionsApi.create>[0]) => {
    const tx = await transactionsApi.create(data)
    await fetch(filters)
    return tx
  }

  const update = async (id: number, data: Parameters<typeof transactionsApi.update>[1]) => {
    const tx = await transactionsApi.update(id, data)
    await fetch(filters)
    return tx
  }

  const remove = async (id: number) => {
    await transactionsApi.delete(id)
    await fetch(filters)
  }

  return {
    transactions: result.data,
    meta: result.meta,
    filters,
    loading,
    error,
    applyFilters,
    setPage,
    refetch: () => fetch(filters),
    create,
    update,
    remove,
  }
}
