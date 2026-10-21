import { tradesApi, type TradePayload } from '@/api/rucoy'
import type { Trade } from '@/types'
import { useAsyncData } from './useAsyncData'

const NONE: Trade[] = []

export function useTrades() {
  const { data: trades, setData: setTrades, loading, error, refetch } = useAsyncData(tradesApi.getAll, NONE)

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

  return { trades, loading, error, refetch, create, update, archive, unarchive, remove }
}
