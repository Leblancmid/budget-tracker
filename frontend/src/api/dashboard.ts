import api from './axios'
import type { DashboardStats } from '@/types'

export const dashboardApi = {
  getStats: (month: number, year: number) =>
    api
      .get<DashboardStats>('/dashboard', { params: { month, year } })
      .then((r) => r.data),
}
