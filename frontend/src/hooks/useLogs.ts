import { logsApi, type LogEntry } from '@/api/logs'
import { useAsyncData } from './useAsyncData'

const NONE: LogEntry[] = []
const load = () => logsApi.getAll().then((r) => r.data)

export function useLogs() {
  const { data: entries, loading, refetch } = useAsyncData(load, NONE)

  return { entries, loading, refetch }
}
