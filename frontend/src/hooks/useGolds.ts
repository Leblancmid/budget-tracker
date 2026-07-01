import { useCallback, useEffect, useState } from 'react'
import { goldsApi, type GoldPayload } from '@/api/rucoy'
import type { Gold } from '@/types'

export function useGolds() {
  const [golds, setGolds] = useState<Gold[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setGolds(await goldsApi.getAll())
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: GoldPayload) => {
    const gold = await goldsApi.create(data)
    setGolds((prev) => [gold, ...prev])
    return gold
  }

  const update = async (id: number, data: GoldPayload) => {
    const gold = await goldsApi.update(id, data)
    setGolds((prev) => prev.map((g) => (g.id === id ? gold : g)))
    return gold
  }

  const remove = async (id: number) => {
    await goldsApi.delete(id)
    setGolds((prev) => prev.filter((g) => g.id !== id))
  }

  const totalGold = golds.reduce((sum, g) => sum + parseFloat(g.amount), 0)

  return { golds, totalGold, loading, error, refetch: fetch, create, update, remove }
}
