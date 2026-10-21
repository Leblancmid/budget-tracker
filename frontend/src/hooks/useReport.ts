import { useCallback } from 'react'
import { reportsApi } from '@/api/reports'
import type { ReportData, ReportKind, ReportPeriod } from '@/types'
import { useAsyncData } from './useAsyncData'

export function useReport(kind: ReportKind, period: ReportPeriod, year: number, month: number) {
  const load = useCallback(() => reportsApi.get(kind, period, year, month), [kind, period, year, month])
  const { data, loading, error, refetch } = useAsyncData<ReportData | null>(load, null)
  return { data, loading, error: error ?? '', refetch }
}
