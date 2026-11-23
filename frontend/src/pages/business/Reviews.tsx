import { useState } from 'react'
import { Check, CheckCircle2, Copy, EyeOff, MessageSquareHeart, RefreshCw, RotateCcw, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { reviewsApi, type BuyerReview, type ReviewableSale } from '@/api/business'
import { useAsyncData } from '@/hooks/useAsyncData'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import { formatShortDate, paginateLocally } from '@/utils/format'

const NO_DATA = null as Awaited<ReturnType<typeof reviewsApi.list>> | null
const PER_PAGE = 6

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} className={i <= n ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'} />)}
    </span>
  )
}

/** Copy text even where the modern clipboard is off (plain http) */
async function copy(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true } catch { /* fall back */ }
  const area = document.createElement('textarea')
  area.value = text; area.style.position = 'fixed'; area.style.opacity = '0'
  document.body.appendChild(area); area.select()
  let ok = false
  try { ok = document.execCommand('copy') } catch { ok = false }
  area.remove()
  return ok
}

/** One recent sale: copy a ready-to-send message with its review link */
function AskRow({ sale }: { sale: ReviewableSale }) {
  const [busy, setBusy] = useState(false)
  const ask = async () => {
    setBusy(true)
    try {
      const r = await reviewsApi.link(sale.id)
      const text = `Thanks for trading with Leblanc! If you have a minute, a quick review helps a lot: ${r.url}`
      if (await copy(text)) toast.success(`Copied. Paste it to ${sale.sold_to ?? 'the buyer'} on Discord or WhatsApp. The link works for ${r.days} days.`)
      else toast.error(`Couldn't copy. The link: ${r.url}`)
    } catch (err) {
      toast.error(errorMessage(err, 'Could not make the link.'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{sale.item}{sale.sold_to && <span className="font-normal text-gray-500"> · {sale.sold_to}</span>}</p>
        <p className="text-xs text-gray-400">{sale.sold_on ? `Sold ${formatShortDate(sale.sold_on)}` : 'Sold'}</p>
      </div>
      {sale.reviewed
        ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={13} /> Reviewed</span>
        : <Button size="sm" variant="secondary" icon={<Copy className="h-3.5 w-3.5" />} onClick={ask} loading={busy}>Copy review link</Button>}
    </li>
  )
}

/** One review: approve it for the website, hide it, or put it back */
function ReviewCard({ review, onChanged }: { review: BuyerReview; onChanged: () => unknown }) {
  const [busy, setBusy] = useState<BuyerReview['status'] | null>(null)
  const set = async (status: BuyerReview['status']) => {
    setBusy(status)
    try {
      const r = await reviewsApi.setStatus(review.id, status)
      toast.success(r.message)
      await onChanged()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the review.'))
    } finally {
      setBusy(null)
    }
  }
  const tone = { pending: 'border-amber-200 dark:border-amber-800/60', approved: 'border-emerald-200 dark:border-emerald-800/60', hidden: 'border-gray-200 opacity-70 dark:border-gray-700' }[review.status]
  return (
    <li className={`flex flex-col gap-2 rounded-xl border p-4 ${tone}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Stars n={review.rating} />
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{review.name}</span>
        <span className="text-xs text-gray-400">{review.item} · {new Date(review.created_at).toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' })}</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${review.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : review.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
          {review.status === 'pending' ? 'Waiting for you' : review.status === 'approved' ? 'On the website' : 'Hidden'}
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-200">“{review.message}”</p>
      <div className="flex flex-wrap gap-2">
        {review.status !== 'approved' && <Button size="sm" icon={<Check className="h-3.5 w-3.5" />} loading={busy === 'approved'} disabled={busy !== null} onClick={() => set('approved')}>Approve</Button>}
        {review.status !== 'hidden' && <Button size="sm" variant="secondary" icon={<EyeOff className="h-3.5 w-3.5" />} loading={busy === 'hidden'} disabled={busy !== null} onClick={() => set('hidden')}>Hide</Button>}
        {review.status === 'hidden' && <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} loading={busy === 'pending'} disabled={busy !== null} onClick={() => set('pending')}>Back to waiting</Button>}
      </div>
    </li>
  )
}

/**
 * Storefront → Reviews: send buyers a review link after a sale, and approve their reviews for the
 * Leblanc website (only approved ones show there).
 */
export default function Reviews() {
  const { data, loading, error, refetch } = useAsyncData(reviewsApi.list, NO_DATA)
  const [page, setPage] = useState(1)

  const order = { pending: 0, approved: 1, hidden: 2 }
  const reviews = [...(data?.reviews ?? [])].sort((a, b) => order[a.status] - order[b.status] || b.created_at - a.created_at)
  const { paginated, meta } = paginateLocally(reviews, page, PER_PAGE)
  const waiting = reviews.filter((r) => r.status === 'pending').length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Reviews</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Ask buyers for a review after a sale; approved reviews show on the website</p>
        </div>
        <button onClick={() => refetch()} disabled={loading} title="Refresh" aria-label="Refresh" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !data ? (
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      ) : error || !data ? (
        <Card className="flex items-center justify-between gap-2 p-4 text-sm text-gray-500 dark:text-gray-400">
          Couldn't load the reviews from the website.
          <button onClick={() => refetch()} className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400"><RefreshCw size={13} /> Retry</button>
        </Card>
      ) : !data.configured ? (
        <Card className="p-4 text-sm text-gray-600 dark:text-gray-300">Reviews need the website connection: set LISTING_SITE_TOKEN in the backend .env.</Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <Card className="flex flex-col">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700/60">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ask for a review</h2>
              <p className="text-[11px] text-gray-400">Sales from the last 30 days. Copy the message and send it to the buyer.</p>
            </div>
            {data.recent_sales.length === 0
              ? <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No sales in the last 30 days.</p>
              : <ul className="divide-y divide-gray-100 dark:divide-gray-800">{data.recent_sales.map((s) => <AskRow key={s.id} sale={s} />)}</ul>}
          </Card>

          <Card className="flex flex-col gap-3 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              <MessageSquareHeart size={15} className="text-indigo-500" /> From buyers
              {waiting > 0 && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{waiting} waiting</span>}
            </h2>
            {reviews.length === 0
              ? <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No reviews yet. Send a review link to your next buyer.</p>
              : <ul className="flex flex-col gap-3">{paginated.map((r) => <ReviewCard key={r.id} review={r} onChanged={refetch} />)}</ul>}
            <Pagination meta={meta} onPageChange={setPage} />
          </Card>
        </div>
      )}
    </div>
  )
}
