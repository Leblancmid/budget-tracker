import { useCallback, useEffect, useState } from 'react'
import { tradesApi, type TradePayload } from '@/api/rucoy'
import type { Trade } from '@/types'

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTrades(await tradesApi.getAll())
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: TradePayload) => {
    const trade = await tradesApi.create(data)
    setTrades((prev) => [trade, ...prev])
    return trade
  }

  const update = async (id: number, data: TradePayload) => {
    const trade = await tradesApi.update(id, data)
    setTrades((prev) => prev.map((t) => (t.id === id ? trade : t)))
    return trade
  }

  const archive = async (id: number) => {
    await tradesApi.archive(id)
    setTrades((prev) => prev.filter((t) => t.id !== id))
  }

  const unarchive = async (id: number) => {
    const trade = await tradesApi.unarchive(id)
    setTrades((prev) => [trade, ...prev])
  }

  const remove = async (id: number) => {
    await tradesApi.delete(id)
    setTrades((prev) => prev.filter((t) => t.id !== id))
  }

  return { trades, loading, error, refetch: fetch, create, update, archive, unarchive, remove }
}
