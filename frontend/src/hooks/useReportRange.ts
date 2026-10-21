import { useState } from 'react'
import type { ReportPeriod } from '@/types'
import { rangeLabel } from '@/utils/reportPeriods'

/** The period / year / month a report shows, with ‹ › stepping (by month for weekly, by year otherwise). */
export function useReportRange(initialPeriod: ReportPeriod = 'monthly') {
  const now = new Date()
  const [period, setPeriod] = useState<ReportPeriod>(initialPeriod)
  const [year,   setYear]   = useState(now.getFullYear())
  const [month,  setMonth]  = useState(now.getMonth() + 1)

  const shift = (delta: number) => {
    if (period === 'weekly') {
      const d = new Date(year, month - 1 + delta, 1)
      setMonth(d.getMonth() + 1); setYear(d.getFullYear())
    } else {
      setYear((y) => y + delta)
    }
  }

  return { period, setPeriod, year, month, shift, label: rangeLabel(period, year, month) }
}
