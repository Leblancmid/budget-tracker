import { middlemanFeesApi } from '@/api/rucoy'
import type { MiddlemanFeeIndex } from '@/types'
import { useAsyncData } from './useAsyncData'

const EMPTY: MiddlemanFeeIndex = { fees: [], total: 0 }

export function useMiddlemanFees() {
  const { data, setData, loading, refetch } = useAsyncData(middlemanFeesApi.getAll, EMPTY)

  const create = async (amount: number, description?: string) => {
    const fee = await middlemanFeesApi.create(amount, description)
    setData((prev) => ({ fees: [fee, ...prev.fees], total: prev.total + parseFloat(fee.amount) }))
    return fee
  }

  const remove = async (id: number) => {
    const fee = data.fees.find((f) => f.id === id)
    await middlemanFeesApi.delete(id)
    setData((prev) => ({
      fees:  prev.fees.filter((f) => f.id !== id),
      total: fee ? prev.total - parseFloat(fee.amount) : prev.total,
    }))
  }

  return { fees: data.fees, total: data.total, loading, refetch, create, remove }
}
