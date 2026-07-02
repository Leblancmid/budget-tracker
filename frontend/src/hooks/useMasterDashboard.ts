import { useCallback, useEffect, useState } from 'react'
import { masterDashboardApi } from '@/api/master'
import type { MasterDashboardStats } from '@/types'

export function useMasterDashboard() {
  const [stats, setStats]   = useState<MasterDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await masterDashboardApi.getStats())
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { stats, loading, error, refetch: fetch }
}
