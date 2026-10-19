import { useCallback, useEffect, useState } from 'react'
import { categoriesApi } from '@/api/categories'
import type { Category } from '@/types'

/** month/year (optional) choose which month each category's month_total covers. */
export function useCategories(month?: number, year?: number) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await categoriesApi.getAll(month && year ? { month, year } : undefined)
      setCategories(data)
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: Parameters<typeof categoriesApi.create>[0]) => {
    const category = await categoriesApi.create(data)
    setCategories((prev) => [...prev, { ...category, transactions_count: 0, month_total: 0, all_time_total: 0 }])
    return category
  }

  const update = async (id: number, data: Parameters<typeof categoriesApi.update>[1]) => {
    const updated = await categoriesApi.update(id, data)
    // Keep the counts/totals, which the update response doesn't include
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)))
    return updated
  }

  const remove = async (id: number) => {
    await categoriesApi.delete(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return { categories, loading, error, refetch: fetch, create, update, remove }
}
