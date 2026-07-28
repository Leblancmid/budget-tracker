import { useCallback, useEffect, useState } from 'react'
import { balanceEntriesApi, type BalanceEntryPayload } from '@/api/master'
import type { BalanceEntry } from '@/types'

export function useBalanceEntries() {
  const [entries, setEntries] = useState<BalanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setEntries(await balanceEntriesApi.getAll())
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

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

  return { entries, loading, error, refetch: fetch, create, update, remove }
}
