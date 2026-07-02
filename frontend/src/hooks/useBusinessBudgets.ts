import { useCallback, useEffect, useState } from 'react'
import { businessBudgetsApi } from '@/api/business'
import type { BusinessBudget } from '@/types'

export function useBusinessBudgets() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState<BusinessBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await businessBudgetsApi.getAll(month, year)
      setBudgets(data)
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: { category_id: number; amount: number; month: number; year: number }) => {
    const budget = await businessBudgetsApi.create(data)
    setBudgets((prev) => [...prev, budget])
    return budget
  }

  const update = async (id: number, amount: number) => {
    const updated = await businessBudgetsApi.update(id, amount)
    setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)))
    return updated
  }

  const remove = async (id: number) => {
    await businessBudgetsApi.delete(id)
    setBudgets((prev) => prev.filter((b) => b.id !== id))
  }

  return { budgets, month, year, loading, error, setMonth, setYear, refetch: fetch, create, update, remove }
}
