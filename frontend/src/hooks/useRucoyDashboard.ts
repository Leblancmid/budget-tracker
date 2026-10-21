import { rucoyDashboardApi } from '@/api/rucoy'
import type { RucoyDashboardStats } from '@/types'
import { useAsyncData } from './useAsyncData'

export function useRucoyDashboard() {
  const { data: stats, loading, error, refetch } = useAsyncData<RucoyDashboardStats | null>(rucoyDashboardApi.getStats, null)

  return { stats, loading, error, refetch }
}
