import { useCallback, useEffect, useState } from 'react'
import { budgetsApi } from '@/api/budgets'
import type { Budget } from '@/types'

export function useBudgets(initialMonth = new Date().getMonth() + 1, initialYear = new Date().getFullYear()) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (m: number, y: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await budgetsApi.getAll(m, y)
      setBudgets(data)
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch(month, year) }, [fetch, month, year])

  const create = async (data: Parameters<typeof budgetsApi.create>[0]) => {
    const budget = await budgetsApi.create(data)
    await fetch(month, year)
    return budget
  }

  const update = async (id: number, data: { amount: number }) => {
    const budget = await budgetsApi.update(id, data)
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...budget } : b)))
    return budget
  }

  const remove = async (id: number) => {
    await budgetsApi.delete(id)
    setBudgets((prev) => prev.filter((b) => b.id !== id))
  }

  return {
    budgets, month, year, loading, error,
    setMonth, setYear,
    refetch: () => fetch(month, year),
    create, update, remove,
  }
}
