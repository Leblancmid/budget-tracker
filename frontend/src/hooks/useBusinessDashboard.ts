import { useCallback, useEffect, useState } from 'react'
import { businessDashboardApi } from '@/api/business'
import type { BusinessDashboardStats } from '@/types'

export function useBusinessDashboard() {
  const [stats, setStats] = useState<BusinessDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await businessDashboardApi.getStats()
      setStats(data)
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { stats, loading, error, refetch: fetch }
}
