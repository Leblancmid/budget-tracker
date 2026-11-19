import { Eye, Gauge, MessageSquare, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { useAsyncData } from '@/hooks/useAsyncData'
import { listingPerformanceApi, type ListingPerformance, type ListingVerdict } from '@/api/business'

const EMPTY: ListingPerformance = { usual_days: 14, has_stats: false, listings: [] }

/** Each verdict as a plain word and a colour */
const VERDICT: Record<ListingVerdict, { label: string; tone: string }> = {
  price:    { label: 'Check the price', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  reach:    { label: 'Needs more eyes', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  slow:     { label: 'Slow to sell',    tone: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  early:    { label: 'Too early to tell', tone: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  interest: { label: 'People asked',    tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
}

/**
 * How each account on the website is doing: days listed, views, requests, and what to do about it
 * ("seen 140 times, nobody asked: the price may be too high").
 */
export function ListingPerformanceCard() {
  const { data, loading, error, refetch } = useAsyncData(listingPerformanceApi.get, EMPTY)
  const needs = data.listings.filter((l) => l.verdict === 'price' || l.verdict === 'reach' || l.verdict === 'slow').length

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-700/60">
        <Gauge size={16} className="text-indigo-500" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">How your listings are doing</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            You usually sell in about {data.usual_days} days{needs > 0 && <> · <b className="text-amber-600 dark:text-amber-400">{needs} need{needs === 1 ? 's' : ''} a look</b></>}
          </p>
        </div>
        <button onClick={() => refetch()} title="Refresh" aria-label="Refresh listing performance"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 sm:h-7 sm:w-7 dark:hover:bg-gray-800 dark:hover:text-gray-200">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && data.listings.length === 0 ? (
        <div className="flex flex-col gap-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
      ) : error ? (
        <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">{error}</p>
      ) : data.listings.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Nothing on the website yet. Accounts with a screenshot appear here once listed (<Link to="/business/listing" className="font-semibold text-indigo-600 dark:text-indigo-400">Listing Kit</Link>).
        </p>
      ) : (
        <ul className="divide-y divide-gray-50 dark:divide-gray-800">
          {data.listings.map((l) => {
            const v = VERDICT[l.verdict]
            return (
              <li key={l.account_id} className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-100">
                    <span className="truncate">{l.name}</span>
                    <span className={['rounded-full px-2 py-0.5 text-[10px] font-semibold', v.tone].join(' ')}>{v.label}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{l.advice}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span title="Price on the website">{l.price ?? 'On request'}</span>
                  <span title="Days on the website">{l.days}d</span>
                  {l.views != null && (
                    <span className="flex items-center gap-1" title={`${l.views} views (${l.views_week ?? 0} this week)`}><Eye size={12} /> {l.views}</span>
                  )}
                  {l.requests != null && (
                    <span className="flex items-center gap-1" title="Requests from the website"><MessageSquare size={12} /> {l.requests}</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {!data.has_stats && data.listings.length > 0 && (
        <p className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400 dark:border-gray-700/60 dark:text-gray-500">
          Views and requests show once the website is connected (LISTING_SITE_TOKEN).
        </p>
      )}
    </Card>
  )
}
