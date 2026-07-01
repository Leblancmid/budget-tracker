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

  return { logs, loading, refetch: fetch }
}
