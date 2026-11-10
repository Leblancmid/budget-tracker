import api from './axios'
import type { DailyBrief, DashboardStats } from '@/types'

export const dashboardApi = {
  getStats: (month: number, year: number) =>
    api
      .get<DashboardStats>('/dashboard', { params: { month, year } })
      .then((r) => r.data),

  /** The Daily Expenses weekly brief (your own spending and budgets) */
  brief: () => api.get<DailyBrief>('/dashboard/brief').then((r) => r.data),
}
