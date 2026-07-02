import { useCallback, useEffect, useState } from 'react'
import { businessCategoriesApi, type BusinessCategoryPayload } from '@/api/business'
import type { BusinessCategory } from '@/types'

export function useBusinessCategories() {
  const [categories, setCategories] = useState<BusinessCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await businessCategoriesApi.getAll()
      setCategories(data)
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = async (data: BusinessCategoryPayload) => {
    const cat = await businessCategoriesApi.create(data)
    setCategories((prev) => [...prev, cat])
    return cat
  }

  const update = async (id: number, data: Partial<BusinessCategoryPayload>) => {
    const updated = await businessCategoriesApi.update(id, data)
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }

  const remove = async (id: number) => {
    await businessCategoriesApi.delete(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return { categories, loading, error, refetch: fetch, create, update, remove }
}
