import { useEffect, useState } from 'react'
import { websiteStatsApi } from '@/api/business'
import { useDataChanged } from '@/lib/dataEvents'

const POLL_MS = 60_000

/**
 * How many website leads are waiting for a reply, for the Business / Leads badges. Checked every
 * minute while the tab is visible, and right away after something is saved (e.g. a lead marked as
 * contacted). Quietly 0 when the website isn't connected or can't be reached.
 */
export function useWaitingLeads(enabled: boolean): number {
  const [count, setCount] = useState(0)
  const [fresh, setFresh] = useState(0)

  useDataChanged(() => setFresh((n) => n + 1))

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const load = (skipCache: boolean) => {
      if (document.visibilityState === 'hidden') return
      websiteStatsApi.get(skipCache)
        .then((s) => { if (!cancelled) setCount(s.configured ? (s.leads_new?.count ?? 0) : 0) })
        .catch(() => { /* website down or not set up: keep the last count */ })
    }
    load(fresh > 0)
    const timer = window.setInterval(() => load(false), POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [enabled, fresh])

  return enabled ? count : 0
}
