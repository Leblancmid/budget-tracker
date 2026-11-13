import { useEffect, useState } from 'react'
import { BellRing, Eye, RefreshCw, Users, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import { websiteStatsApi, type WebsiteStats } from '@/api/business'
import { useAsyncData } from '@/hooks/useAsyncData'

const NONE = null as WebsiteStats | null

/** Refresh "online now" this often while the page is open. */
const REFRESH_MS = 30_000

const describeAlert = (a: WebsiteStats['alerts'][number]) =>
  `${a.category ?? 'Any build'}, level ${a.max_level ? `${a.min_level}–${a.max_level}` : `${a.min_level}+`}`

/** Website visitors: online now, visits, views per account, and "Notify me" requests. */
export function WebsiteStatsCard() {
  const { data: stats, setData, loading, error, refetch } = useAsyncData(websiteStatsApi.get, NONE)
  const [showAllViews, setShowAllViews] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<WebsiteStats['alerts'][number] | null>(null)
  const [removing, setRemoving]         = useState(false)

  const removeAlert = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await websiteStatsApi.deleteAlert(removeTarget.id)
      setData((s) => (s ? { ...s, alerts: s.alerts.filter((a) => a.id !== removeTarget.id) } : s))
      toast.success(`Removed ${removeTarget.name}'s request.`)
      setRemoveTarget(null)
    } catch (err) {
      toast.error(errorMessage(err, 'Could not remove the request.'))
    } finally {
      setRemoving(false)
    }
  }

  // Keep "online now" fresh while this page is open and visible
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') refetch() }, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [refetch])

  const header = (
    <div className="flex items-center gap-2">
      <Users size={16} className="text-indigo-500" />
      <h2 className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-100">Website visitors</h2>
      <button onClick={() => refetch()} title="Refresh" aria-label="Refresh visitor stats"
        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200">
        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  )

  if (loading && !stats) {
    return <Card className="flex flex-col gap-3 p-4">{header}<div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" /></Card>
  }
  if (error || !stats) {
    return <Card className="flex flex-col gap-3 p-4">{header}<p className="text-sm text-gray-500 dark:text-gray-400">{error ?? "Couldn't load the stats."}</p></Card>
  }
  if (!stats.configured) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        {header}
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          Visitor stats are off. Add <code>LISTING_SITE_TOKEN</code> to the backend <code>.env</code> (the same value as
          <code> STATS_TOKEN</code> in Cloudflare), then run the after-deploy script.
        </p>
      </Card>
    )
  }

  const views  = stats.listing_views.filter((v) => !v.sold)
  const shown  = showAllViews ? views : views.slice(0, 6)
  const maxDay = Math.max(1, ...stats.daily.map((d) => d.visitors))
  const days   = stats.daily.slice(-14)
  const tiles  = [
    { label: 'Today', value: stats.today.visitors, sub: `${stats.today.pageviews} page views` },
    { label: 'Last 7 days', value: stats.last7.visitors, sub: `${stats.last7.pageviews} page views` },
    { label: 'Last 30 days', value: stats.last30.visitors, sub: `${stats.last30.pageviews} page views` },
    { label: 'All time', value: stats.all_time.unique_visitors, sub: 'different people' },
  ]

  return (
    <Card className="flex flex-col gap-4 p-4">
      {header}

      {/* Online now */}
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-900/20">
        <span className="relative flex h-3 w-3">
          {stats.online > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
          <span className={['relative inline-flex h-3 w-3 rounded-full', stats.online > 0 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'].join(' ')} />
        </span>
        <div className="flex-1">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.online}</p>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">on the website right now</p>
        </div>
        {stats.online_pages.length > 0 && (
          <ul className="text-right text-[11px] text-emerald-800/80 dark:text-emerald-200/70">
            {stats.online_pages.map((p) => <li key={p.path ?? '-'}>{p.n} on {p.path === '/' ? 'Home' : p.path ?? '?'}</li>)}
          </ul>
        )}
      </div>

      {/* Visitors */}
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{t.label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.value.toLocaleString()} <span className="text-xs font-medium text-gray-400">visitors</span></p>
            <p className="text-[11px] text-gray-400">{t.sub}</p>
          </div>
        ))}
      </div>

      {days.length > 1 && (
        <div>
          <p className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">Visitors per day</p>
          <div className="flex h-14 items-end gap-1" role="img" aria-label="Visitors per day, last 14 days">
            {days.map((d) => (
              <div key={d.day} title={`${d.day}: ${d.visitors} visitors, ${d.pageviews} page views`}
                className="flex-1 rounded-t bg-indigo-400/80 dark:bg-indigo-500/70" style={{ height: `${Math.max(4, (d.visitors / maxDay) * 100)}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* Views per account */}
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200"><Eye size={13} /> Views per account (for sale)</p>
        {views.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">No one has opened an account's details yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
            {shown.map((v) => (
              <li key={v.listing_id} className="flex items-center gap-2 py-1 text-xs">
                <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-200">{v.name}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{v.total}</span>
                <span className="w-20 text-right text-[11px] text-gray-400">{v.last7} this week</span>
              </li>
            ))}
          </ul>
        )}
        {views.length > 6 && (
          <button onClick={() => setShowAllViews((x) => !x)} className="mt-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            {showAllViews ? 'Show less' : `Show all ${views.length}`}
          </button>
        )}
      </div>

      {/* Notify me */}
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200">
          <BellRing size={13} /> Waiting to be notified ({stats.alerts.length})
        </p>
        {stats.alerts.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">No requests yet. Buyers can ask on the For Sale page.</p>
        ) : (
          <ul className="flex max-h-40 flex-col divide-y divide-gray-100 overflow-y-auto scrollbar-thin dark:divide-gray-800">
            {stats.alerts.map((a) => (
              <li key={a.id} className="group flex items-start gap-2 py-1 text-xs">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{a.name}</span>
                  <span className="text-gray-500 dark:text-gray-400"> wants {describeAlert(a)} · {a.method === 'whatsapp' ? 'WhatsApp' : 'Discord'} {a.contact}</span>
                </span>
                <button onClick={() => setRemoveTarget(a)} title="Remove this request" aria-label={`Remove ${a.name}'s request`}
                  className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 focus-within:opacity-100 md:focus:opacity-100">
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-[11px] text-gray-400">When you publish a match, the list of who to message is posted in #inquiries.</p>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={removeAlert}
        loading={removing}
        title="Remove request"
        confirmLabel="Remove"
        message={removeTarget ? `Remove ${removeTarget.name}'s request (${describeAlert(removeTarget)})? You won't be told about matches for it anymore.` : ''}
      />
    </Card>
  )
}
