import { businessTransactionsApi, type BusinessTransactionPayload } from '@/api/business'
import type { BusinessTransaction } from '@/types'
import { useAsyncData } from './useAsyncData'

const NONE: BusinessTransaction[] = []

export function useBusinessTransactions() {
  const { data: transactions, setData: setTransactions, loading, error, refetch } = useAsyncData(businessTransactionsApi.getAll, NONE)

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

  const archive = async (id: number) => {
    await businessTransactionsApi.archive(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const unarchive = async (id: number) => {
    const updated = await businessTransactionsApi.unarchive(id)
    setTransactions((prev) => [updated, ...prev])
    return updated
  }

  const remove = async (id: number) => {
    await businessTransactionsApi.delete(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  return { transactions, loading, error, refetch, create, update, archive, unarchive, remove }
}
