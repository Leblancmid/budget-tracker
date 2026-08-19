import { useCallback, useEffect, useState } from 'react'
import { goldLogsApi } from '@/api/rucoy'
import type { GoldLog } from '@/types'

export function useGoldLogs() {
  const [logs, setLogs] = useState<GoldLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      setLogs(await goldLogsApi.getAll())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const cancel = async (id: number) => {
    const updated = await goldLogsApi.cancel(id)
    setLogs((prev) => prev.map((l) => (l.id === id ? updated : l)))
    return updated
  }

  return { logs, loading, refetch: fetch, cancel }
}
