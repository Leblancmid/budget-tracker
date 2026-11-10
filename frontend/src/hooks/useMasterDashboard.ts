import { masterDashboardApi } from '@/api/master'
import type { MasterDashboardStats, MasterTrendMonth } from '@/types'
import { useAsyncData } from './useAsyncData'

const NO_TREND: MasterTrendMonth[] = []

export function useMasterDashboard() {
  const { data: stats, loading, error, refetch } = useAsyncData<MasterDashboardStats | null>(masterDashboardApi.getStats, null)
  // The charts load separately, so the totals show without waiting for them
  const trend = useAsyncData(masterDashboardApi.getTrend, NO_TREND)

  return { stats, loading, error, refetch, trend: trend.data, trendLoading: trend.loading, trendError: trend.error }
}
