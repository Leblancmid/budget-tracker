import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { errorMessage } from '@/utils/api'

export interface AsyncData<T> {
  data: T
  setData: Dispatch<SetStateAction<T>>
  loading: boolean
  error: string | null
  /** Load again; resolves once the data (or error) is in place. */
  refetch: () => Promise<void>
}

/**
 * Loads data on mount and whenever `load` changes (memoize it with useCallback).
 * Only the latest request's result is kept, so a slow earlier response can't
 * overwrite a newer one (e.g. when switching months quickly).
 */
export function useAsyncData<T>(load: () => Promise<T>, initialData: T): AsyncData<T> {
  const [data, setData]       = useState<T>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const latestRequest         = useRef(0)

  const refetch = useCallback(async () => {
    const request = ++latestRequest.current
    const isLatest = () => request === latestRequest.current
    setLoading(true)
    setError(null)
    try {
      const result = await load()
      if (isLatest()) setData(result)
    } catch (err: unknown) {
      if (isLatest()) setError(errorMessage(err))
    } finally {
      if (isLatest()) setLoading(false)
    }
  }, [load])

  useEffect(() => { refetch() }, [refetch])

  return { data, setData, loading, error, refetch }
}
