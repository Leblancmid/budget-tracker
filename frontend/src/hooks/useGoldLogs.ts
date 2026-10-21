import { goldLogsApi } from '@/api/rucoy'
import type { GoldLog } from '@/types'
import { useAsyncData } from './useAsyncData'

const NONE: GoldLog[] = []

export function useGoldLogs() {
  const { data: logs, setData: setLogs, loading, refetch } = useAsyncData(goldLogsApi.getAll, NONE)

  const cancel = async (id: number) => {
    const updated = await goldLogsApi.cancel(id)
    setLogs((prev) => prev.map((l) => (l.id === id ? updated : l)))
    return updated
  }

  return { logs, loading, refetch, cancel }
}
