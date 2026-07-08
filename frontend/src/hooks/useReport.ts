import { useState, useEffect, useCallback } from 'react'
import api from '@/api/axios'

export type ReportPeriod = 'weekly' | 'monthly' | 'yearly'

export interface ReportRow {
  label:   string
  income:  number
  expense: number
  net?:    number
  profit?: number
}

export interface ReportTotals {
  income:  number
  expense: number
  net?:    number
  profit?: number
}

export interface ReportData {
  period: ReportPeriod
  year:   number
  month:  number
  rows:   ReportRow[]
  totals: ReportTotals
}

export function useReport(
  type:   'daily-expenses' | 'business',
  period: ReportPeriod,
  year:   number,
  month:  number,
) {
  const [data,    setData]    = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = { period, year }
      if (period === 'weekly') params.month = month
      const { data: res } = await api.get<ReportData>(`/reports/${type}`, { params })
      setData(res)
    } catch (e: unknown) {
      setError((e as { message: string }).message ?? 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [type, period, year, month])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}