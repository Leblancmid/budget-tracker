import { useCallback, useEffect, useState } from 'react'
import { businessTransactionsApi, type BusinessTransactionPayload } from '@/api/business'
import type { BusinessTransaction } from '@/types'

export function useBusinessTransactions() {
  const [transactions, setTransactions] = useState<BusinessTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await businessTransactionsApi.getAll()
      setTransactions(data)
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: BusinessTransactionPayload) => {
    const tx = await businessTransactionsApi.create(data)
    setTransactions((prev) => [tx, ...prev])
    return tx
  }

  const update = async (id: number, data: BusinessTransactionPayload) => {
    const updated = await businessTransactionsApi.update(id, data)
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }

  const remove = async (id: number) => {
    await businessTransactionsApi.delete(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  return { transactions, loading, error, refetch: fetch, create, update, remove }
}
