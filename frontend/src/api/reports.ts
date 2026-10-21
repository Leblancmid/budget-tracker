import api from './axios'
import type { ReportData, ReportKind, ReportPeriod } from '@/types'

export const reportsApi = {
  /** month only matters for the weekly view */
  get: (kind: ReportKind, period: ReportPeriod, year: number, month: number) => {
    const params: Record<string, string | number> = { period, year }
    if (period === 'weekly') params.month = month
    return api.get<ReportData>(`/reports/${kind}`, { params }).then((r) => r.data)
  },
}
