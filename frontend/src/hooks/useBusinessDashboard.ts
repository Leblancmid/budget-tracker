import { useCallback, useEffect, useState } from 'react'
import { businessDashboardApi } from '@/api/business'
import type { BusinessDashboardStats } from '@/types'

export function useBusinessDashboard() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear]   = useState(now.getFullYear())
  const [stats, setStats] = useState<BusinessDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await businessDashboardApi.getStats(month, year)
      setStats(data)
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetch() }, [fetch])

  return { stats, month, year, loading, error, setMonth, setYear, refetch: fetch }
}
