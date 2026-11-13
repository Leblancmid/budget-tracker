import { useCallback } from 'react'
import { logsApi, type LogEntry, type LogPeriod } from '@/api/logs'
import { useAsyncData } from './useAsyncData'

const NONE: LogEntry[] = []

/** The Logs page's entries for one period (the server only sends that period). */
export function useLogs(days: LogPeriod) {
  const load = useCallback(() => logsApi.getAll(days).then((r) => r.data), [days])
  const { data: entries, loading, refetch } = useAsyncData(load, NONE)

  return { entries, loading, refetch }
}
