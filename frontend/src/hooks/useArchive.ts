import { useCallback, useEffect, useState } from 'react'

export function useArchive<T>(fetcher: () => Promise<T[]>) {
  const [showArchive, setShowArchive]       = useState(false)
  const [archivedItems, setArchivedItems]   = useState<T[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)

  const fetchArchived = useCallback(async () => {
    setArchiveLoading(true)
    try { setArchivedItems(await fetcher()) }
    finally { setArchiveLoading(false) }
  }, [fetcher])

  useEffect(() => { if (showArchive) fetchArchived() }, [showArchive, fetchArchived])

  const removeFromArchived = (predicate: (item: T) => boolean) =>
    setArchivedItems((prev) => prev.filter(predicate))

  return { showArchive, setShowArchive, archivedItems, archiveLoading, fetchArchived, removeFromArchived }
}
