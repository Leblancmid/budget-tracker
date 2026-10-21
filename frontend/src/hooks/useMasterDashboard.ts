import { masterDashboardApi } from '@/api/master'
import type { MasterDashboardStats } from '@/types'
import { useAsyncData } from './useAsyncData'

export function useMasterDashboard() {
  const { data: stats, loading, error, refetch } = useAsyncData<MasterDashboardStats | null>(masterDashboardApi.getStats, null)

  return { stats, loading, error, refetch }
}
