import { useCallback, useEffect, useState } from 'react'
import { savingsApi, type SavingPayload } from '@/api/master'
import type { Saving } from '@/types'

export function useSavings() {
  const [savings, setSavings] = useState<Saving[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSavings(await savingsApi.getAll())
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: SavingPayload) => {
    const s = await savingsApi.create(data)
    setSavings((prev) => [s, ...prev])
    return s
  }

  const update = async (id: number, data: SavingPayload) => {
    const updated = await savingsApi.update(id, data)
    setSavings((prev) => prev.map((s) => (s.id === id ? updated : s)))
    return updated
  }

  const remove = async (id: number) => {
    await savingsApi.delete(id)
    setSavings((prev) => prev.filter((s) => s.id !== id))
  }

  return { savings, loading, error, refetch: fetch, create, update, remove }
}
