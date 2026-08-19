import { useState, useEffect, useCallback } from 'react'
import { logsApi, type LogEntry } from '@/api/logs'

export function useLogs() {
  const [entries, setEntries]   = useState<LogEntry[]>([])
  const [loading, setLoading]   = useState(true)

  const fetch = useCallback(() => {
    setLoading(true)
    logsApi.getAll()
      .then((r) => setEntries(r.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { entries, loading, refetch: fetch }
}
