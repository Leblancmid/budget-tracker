import { balanceEntriesApi, type BalanceEntryPayload } from '@/api/master'
import type { BalanceEntry } from '@/types'
import { useAsyncData } from './useAsyncData'

const NONE: BalanceEntry[] = []

export function useBalanceEntries() {
  const { data: entries, setData: setEntries, loading, error, refetch } = useAsyncData(balanceEntriesApi.getAll, NONE)

  const create = async (data: BalanceEntryPayload) => {
    const e = await balanceEntriesApi.create(data)
    setEntries((prev) => [e, ...prev])
    return e
  }

  const update = async (id: number, data: BalanceEntryPayload) => {
    const updated = await balanceEntriesApi.update(id, data)
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)))
    return updated
  }

  const remove = async (id: number) => {
    await balanceEntriesApi.delete(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return { entries, loading, error, refetch, create, update, remove }
}
