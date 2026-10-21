import { goldsApi, type GoldPayload } from '@/api/rucoy'
import type { Gold } from '@/types'
import { useAsyncData } from './useAsyncData'

const NONE: Gold[] = []

export function useGolds() {
  const { data: golds, setData: setGolds, loading, error, refetch } = useAsyncData(goldsApi.getAll, NONE)

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

  return { golds, totalGold, loading, error, refetch, create, update, remove }
}
