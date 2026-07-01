import { useCallback, useEffect, useState } from 'react'
import { rucoyDashboardApi } from '@/api/rucoy'
import type { RucoyDashboardStats } from '@/types'

export function useRucoyDashboard() {
  const [stats, setStats] = useState<RucoyDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await rucoyDashboardApi.getStats())
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { stats, loading, error, refetch: fetch }
}
