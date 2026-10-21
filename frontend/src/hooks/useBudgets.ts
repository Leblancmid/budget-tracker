import { useCallback, useState } from 'react'
import { budgetsApi } from '@/api/budgets'
import type { Budget } from '@/types'
import { useAsyncData } from './useAsyncData'

const NONE: Budget[] = []

export function useBudgets(initialMonth = new Date().getMonth() + 1, initialYear = new Date().getFullYear()) {
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear]   = useState(initialYear)

  const load = useCallback(() => budgetsApi.getAll(month, year), [month, year])
  const { data: budgets, setData: setBudgets, loading, error, refetch } = useAsyncData(load, NONE)

  const create = async (data: Parameters<typeof budgetsApi.create>[0]) => {
    const budget = await budgetsApi.create(data)
    await refetch()
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
    refetch,
    create, update, remove,
  }
}
