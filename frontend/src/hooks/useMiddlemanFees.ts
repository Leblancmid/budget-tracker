import { useCallback, useEffect, useState } from 'react'
import { middlemanFeesApi } from '@/api/rucoy'
import type { MiddlemanFee } from '@/types'

export function useMiddlemanFees() {
  const [fees,    setFees]    = useState<MiddlemanFee[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { fees: f, total: t } = await middlemanFeesApi.getAll()
      setFees(f)
      setTotal(t)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (amount: number, description?: string) => {
    const fee = await middlemanFeesApi.create(amount, description)
    setFees((prev) => [fee, ...prev])
    setTotal((prev) => prev + parseFloat(fee.amount))
    return fee
  }

  const remove = async (id: number) => {
    const fee = fees.find((f) => f.id === id)
    await middlemanFeesApi.delete(id)
    setFees((prev) => prev.filter((f) => f.id !== id))
    if (fee) setTotal((prev) => prev - parseFloat(fee.amount))
  }

  return { fees, total, loading, refetch: fetch, create, remove }
}
