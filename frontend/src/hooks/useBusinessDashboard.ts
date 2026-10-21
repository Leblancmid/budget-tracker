import { useCallback, useState } from 'react'
import { businessDashboardApi } from '@/api/business'
import type { BusinessDashboardStats } from '@/types'
import { useAsyncData } from './useAsyncData'

export function useBusinessDashboard() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear]   = useState(now.getFullYear())

  const load = useCallback(() => businessDashboardApi.getStats(month, year), [month, year])
  const { data: stats, loading, error, refetch } = useAsyncData<BusinessDashboardStats | null>(load, null)

  return { stats, month, year, loading, error, setMonth, setYear, refetch }
}
