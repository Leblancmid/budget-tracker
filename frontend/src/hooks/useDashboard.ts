import { useCallback, useEffect, useState } from 'react'
import { dashboardApi } from '@/api/dashboard'
import type { DashboardStats } from '@/types'

export function useDashboard(initialMonth = new Date().getMonth() + 1, initialYear = new Date().getFullYear()) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (m: number, y: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await dashboardApi.getStats(m, y)
      setStats(data)
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch(month, year) }, [fetch, month, year])

  return { stats, month, year, loading, error, setMonth, setYear, refetch: () => fetch(month, year) }
}
