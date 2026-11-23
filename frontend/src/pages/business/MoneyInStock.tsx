import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Coins, Package, RefreshCw, User } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Amt } from '@/components/ui/Amt'
import { Pagination } from '@/components/ui/Pagination'
import { businessInsightsApi, type StockAging, type StockItem } from '@/api/business'
import { useAsyncData } from '@/hooks/useAsyncData'
import { formatCurrency, paginateLocally } from '@/utils/format'

const NO_STOCK = null as StockAging | null
const PER_PAGE = 5

/** Money by age, fresh to old */
const BUCKET_TONES: Record<StockAging['buckets'][number]['key'], string> = {
  fresh: 'bg-emerald-500',
  weeks: 'bg-amber-400',
  month: 'bg-orange-500',
  old: 'bg-red-500',
}

/** Held over twice as long as similar accounts usually take to sell */
const isOverdue = (i: StockItem) => i.usual_days != null && i.held_days != null && i.held_days > i.usual_days * 2

function StockRow({ item }: { item: StockItem }) {
  const Icon = item.type === 'gold' ? Coins : User
  const gain = item.cost_php != null && item.value_php != null ? item.value_php - item.cost_php : null
  return (
    <li>
      <Link to="/business/transactions" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${item.type === 'gold' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'}`}>
          <Icon size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{item.name}</p>
          <p className={`text-xs ${isOverdue(item) ? 'font-semibold text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {item.held_days == null ? 'No buy date' : item.held_days === 0 ? 'Bought today' : `Held ${item.held_days} day${item.held_days === 1 ? '' : 's'}`}
            {item.usual_days != null && <span className="font-normal text-gray-400"> · similar sell in ~{Math.round(item.usual_days)}d</span>}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs">
          <p className="text-gray-500 dark:text-gray-400">{item.cost_php != null ? <Amt value={formatCurrency(item.cost_php)} /> : 'No cost'}</p>
          <p className={`font-semibold ${gain == null ? 'text-gray-400' : gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
            title={item.value_from === 'price' ? 'Your price' : item.value_from === 'guide' ? 'What similar sold for / your recent gold rate' : undefined}>
            {item.value_php != null ? <>→ <Amt value={formatCurrency(item.value_php)} />{item.value_from === 'guide' && <span className="font-normal text-gray-400"> est.</span>}</> : 'no estimate'}
          </p>
        </div>
      </Link>
    </li>
  )
}

/**
 * Money in stock: what you paid for the accounts and gold you haven't sold, how long it's sat, and
 * what it would likely bring. Oldest first, so what to sell off is at the top.
 */
export function MoneyInStock() {
  const { data, loading, error, refetch } = useAsyncData(businessInsightsApi.stock, NO_STOCK)
  const [page, setPage] = useState(1)

  if (loading && !data) return <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
  if (error || !data) {
    return (
      <Card className="flex items-center justify-between gap-2 p-4 text-sm text-gray-500 dark:text-gray-400">
        Couldn't load the money in stock.
        <button onClick={() => refetch()} className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400"><RefreshCw size={13} /> Retry</button>
      </Card>
    )
  }

  const t = data.totals
  const { paginated, meta } = paginateLocally(data.items, page, PER_PAGE)
  const bucketTotal = data.buckets.reduce((s, b) => s + b.cost_php, 0)

  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5 dark:border-gray-700/60">
        <Package size={15} className="text-teal-500" />
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Money in stock</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">What your unsold accounts and gold cost, how long they've sat, and what they'd bring</p>
        </div>
      </div>

      {t.count === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Nothing in stock: everything you bought has sold.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 px-5 pt-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Tied up</p>
              <p className="text-base font-bold text-gray-900 dark:text-gray-100"><Amt value={formatCurrency(t.cost_php)} /></p>
              <p className="text-[11px] text-gray-400">{t.count} item{t.count === 1 ? '' : 's'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Likely value</p>
              <p className="text-base font-bold text-gray-900 dark:text-gray-100"><Amt value={formatCurrency(t.value_php)} /></p>
              {t.unvalued > 0 && <p className="text-[11px] text-gray-400">{t.unvalued} without estimate</p>}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">If all sold</p>
              <p className={`text-base font-bold ${t.profit_php >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {t.profit_php >= 0 ? '+' : '−'}<Amt value={formatCurrency(Math.abs(t.profit_php))} />
              </p>
              <p className="text-[11px] text-gray-400">
                {t.unvalued > 0 ? `profit on the ${t.count - t.unvalued} with an estimate` : 'profit'}
              </p>
            </div>
          </div>

          {/* How old the money is */}
          {bucketTotal > 0 && (
            <div className="px-5 pt-4">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" role="img"
                aria-label={data.buckets.map((b) => `${b.label}: ${formatCurrency(b.cost_php)}`).join(', ')}>
                {data.buckets.filter((b) => b.cost_php > 0).map((b) => (
                  <span key={b.key} className={BUCKET_TONES[b.key]} style={{ width: `${(b.cost_php / bucketTotal) * 100}%` }} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                {data.buckets.map((b) => (
                  <span key={b.key} className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${BUCKET_TONES[b.key]}`} />
                    {b.label}: <b className="font-semibold text-gray-700 dark:text-gray-200"><Amt value={formatCurrency(b.cost_php)} /></b>
                  </span>
                ))}
              </div>
              {t.overdue > 0 && (
                <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
                  {t.overdue} account{t.overdue === 1 ? ' has' : 's have'} sat over twice as long as similar ones usually take: consider selling cheaper to free the cash.
                </p>
              )}
            </div>
          )}

          <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-700/60">
            {paginated.map((i) => <StockRow key={`${i.type}-${i.id}`} item={i} />)}
          </ul>
          <div className="px-4"><Pagination meta={meta} onPageChange={setPage} /></div>
        </>
      )}
    </Card>
  )
}
