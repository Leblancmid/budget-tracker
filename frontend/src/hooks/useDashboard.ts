import { useCallback, useState } from 'react'
import { dashboardApi } from '@/api/dashboard'
import type { DashboardStats } from '@/types'
import { useAsyncData } from './useAsyncData'

export function useDashboard(initialMonth = new Date().getMonth() + 1, initialYear = new Date().getFullYear()) {
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear]   = useState(initialYear)

  const load = useCallback(() => dashboardApi.getStats(month, year), [month, year])
  const { data: stats, loading, error, refetch } = useAsyncData<DashboardStats | null>(load, null)

  return { stats, month, year, loading, error, setMonth, setYear, refetch }
}
