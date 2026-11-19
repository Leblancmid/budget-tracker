import { useEffect, useState } from 'react'
import { ChevronDown, Coins, Repeat, Search, User as UserIcon, Users, Wallet, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Amt } from '@/components/ui/Amt'
import { Pagination } from '@/components/ui/Pagination'
import { useBuyers } from '@/hooks/useBuyers'
import { compactPhp, formatCurrency, formatDate } from '@/utils/format'
import type { Buyer, BuyerSort } from '@/api/business'

const SORTS: { value: BuyerSort; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'purchases', label: 'Most purchases' },
  { value: 'total', label: 'Top spend' },
]

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?'

/** "today", "3d ago", "5w ago" */
function since(date: string | null): string {
  if (!date) return ''
  const d = Math.max(0, Math.round((Date.now() - Date.parse(`${date}T00:00:00+08:00`)) / 86_400_000))
  return d === 0 ? 'today' : d < 14 ? `${d}d ago` : `${Math.floor(d / 7)}w ago`
}

/** The people you sell to (from "Sold to"): who comes back, how much they buy, and what. */
export default function Buyers() {
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ]       = useState('')
  const [sort, setSort] = useState<BuyerSort>('recent')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<string | null>(null)

  // Search after a short pause in typing
  useEffect(() => {
    const t = setTimeout(() => { setQ(searchInput.trim()); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, loading, error } = useBuyers({ q, sort, page })
  const s = data.summary

  const tiles = [
    { label: 'Buyers', value: String(s.buyers), sub: 'people you sold to', Icon: Users, tone: 'text-indigo-500' },
    { label: 'Came back', value: s.repeat_share != null ? `${Math.round(s.repeat_share * 100)}%` : '—', sub: `${s.repeat} bought more than once`, Icon: Repeat, tone: 'text-emerald-500' },
    { label: 'From regulars', value: (
      <>
        <span className="sm:hidden"><Amt value={compactPhp(s.repeat_sales_php)} /></span>
        <span className="hidden sm:inline"><Amt value={formatCurrency(s.repeat_sales_php)} /></span>
      </>
    ), sub: s.total_php > 0 ? `${Math.round((s.repeat_sales_php / s.total_php) * 100)}% of these sales` : 'of these sales', Icon: Wallet, tone: 'text-amber-500' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Buyers</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500">Who you sell to, from "Sold to" on sold accounts and gold trades</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {tiles.map((t) => (
          <Card key={t.label} className="flex items-center gap-3 px-3 py-3 sm:px-4">
            <t.Icon size={18} className={['hidden shrink-0 sm:block', t.tone].join(' ')} />
            <div className="min-w-0">
              <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">{t.label}</p>
              <p className="truncate text-base font-bold text-gray-900 sm:text-lg dark:text-gray-100">{t.value}</p>
              <p className="hidden truncate text-[11px] text-gray-400 sm:block dark:text-gray-500">{t.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-3 sm:flex-row sm:items-center sm:p-4 dark:border-gray-700/60">
          <div className="relative min-w-0 flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name"
              aria-label="Search buyers"
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} aria-label="Clear search" title="Clear search"
                className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1 sm:flex dark:bg-gray-800" role="group" aria-label="Order">
            {SORTS.map((o) => (
              <button key={o.value} type="button" aria-pressed={sort === o.value} onClick={() => { setSort(o.value); setPage(1) }}
                className={['whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:py-1.5',
                  sort === o.value ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'].join(' ')}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {loading && data.data.length === 0 ? (
          <div className="flex flex-col gap-2 p-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
        ) : error ? (
          <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">{error}</p>
        ) : data.data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <UserIcon className="h-7 w-7 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{q ? 'No buyer by that name' : 'No buyers yet'}</p>
            <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400">
              {q ? 'Try part of the name.' : 'Fill in "Sold to" when you mark an account or gold trade sold, and your buyers gather here.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {data.data.map((b) => (
              <BuyerRow key={b.name} buyer={b} open={open === b.name} onToggle={() => setOpen(open === b.name ? null : b.name)} />
            ))}
          </ul>
        )}
        <div className="border-t border-gray-100 px-4 dark:border-gray-700/60"><Pagination meta={data} onPageChange={setPage} /></div>
      </Card>
    </div>
  )
}

function BuyerRow({ buyer: b, open, onToggle }: { buyer: Buyer; open: boolean; onToggle: () => void }) {
  const regular = b.purchases >= 2
  return (
    <li>
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:hover:bg-gray-800/40 dark:focus:bg-gray-800/40">
        <span className={['flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
          regular ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'].join(' ')}>
          {initials(b.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{b.name}</span>
            {regular && <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Regular</span>}
          </span>
          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
            {b.purchases} purchase{b.purchases === 1 ? '' : 's'}
            {b.accounts > 0 && <> · {b.accounts} account{b.accounts === 1 ? '' : 's'}</>}
            {b.golds > 0 && <> · {b.golds} gold</>}
            {b.last_on && <> · last {since(b.last_on)}</>}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-bold text-gray-900 dark:text-gray-100"><Amt value={formatCurrency(b.total_php)} /></span>
          <span className="block text-[11px] text-emerald-600 dark:text-emerald-400">+<Amt value={formatCurrency(b.profit_php)} /> profit</span>
        </span>
        <ChevronDown size={16} className={['shrink-0 text-gray-400 transition-transform', open ? 'rotate-180' : ''].join(' ')} />
      </button>
      {open && (
        <ul className="mx-4 mb-3 flex flex-col gap-1 rounded-xl bg-gray-50 p-2 dark:bg-gray-800/40">
          {b.items.map((it) => (
            <li key={it.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs">
              {it.type === 'gold' ? <Coins size={13} className="shrink-0 text-amber-500" /> : <UserIcon size={13} className="shrink-0 text-indigo-500" />}
              <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-200">{it.description || (it.type === 'gold' ? 'Gold' : 'Account')}</span>
              <span className="shrink-0 text-gray-400">{it.sold_on && formatDate(it.sold_on)}</span>
              <span className="w-24 shrink-0 text-right font-semibold text-gray-700 dark:text-gray-200">{it.price_php != null ? <Amt value={formatCurrency(it.price_php)} /> : '—'}</span>
            </li>
          ))}
          {b.purchases > b.items.length && (
            <li className="px-2 py-1 text-[11px] text-gray-400">…and {b.purchases - b.items.length} earlier, since {b.first_on && formatDate(b.first_on)}</li>
          )}
        </ul>
      )}
    </li>
  )
}
