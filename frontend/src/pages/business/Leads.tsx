import { useMemo, useState } from 'react'
import { Coins, ExternalLink, HandCoins, Inbox, MessageCircle, Phone, RefreshCw, ShoppingCart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { Amt } from '@/components/ui/Amt'
import { leadsApi, type Lead, type LeadStatus } from '@/api/business'
import { useAsyncData } from '@/hooks/useAsyncData'
import { emitDataChanged } from '@/lib/dataEvents'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import { formatCurrency, paginateLocally } from '@/utils/format'
import { formatGoldShort } from '@/utils/listing'

const PER_PAGE = 15
const NONE = { configured: true, leads: [] as Lead[] }

const TYPES: Record<Lead['type'], { label: string; Icon: LucideIcon; tone: string }> = {
  account: { label: 'Wants an account', Icon: ShoppingCart, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  gold:    { label: 'Gold order',       Icon: Coins,        tone: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
  sell:    { label: 'Offering you an account', Icon: HandCoins, tone: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
}

/** Where each lead is: one plain sentence, and the next step. */
const STATUS: Record<LeadStatus, { label: string; next: LeadStatus[] }> = {
  new:       { label: 'Waiting for your reply', next: ['contacted', 'lost'] },
  contacted: { label: 'You messaged them',      next: ['won', 'lost'] },
  won:       { label: 'Deal done',              next: ['contacted'] },
  lost:      { label: 'No deal',                next: ['new'] },
}
const ACTION: Record<LeadStatus, string> = { new: 'Reopen', contacted: 'Messaged', won: 'Deal done', lost: 'No deal' }

const FILTERS: { value: LeadStatus | 'open' | 'all'; label: string }[] = [
  { value: 'open', label: 'Open' }, { value: 'new', label: 'New' }, { value: 'won', label: 'Done' }, { value: 'lost', label: 'No deal' }, { value: 'all', label: 'All' },
]

const ago = (ms: number) => {
  const h = Math.floor((Date.now() - ms) / 3_600_000)
  return h < 1 ? 'just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

const kk = (n: number) => formatGoldShort(n * 1_000_000)
const money = (n: number, currency: string) => (currency === 'PHP' ? formatCurrency(n) : `$${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)

/** What they want, in one line. */
function summary(l: Lead): string {
  const d = l.details
  if (l.type === 'gold') return `${kk(Number(d.amount_kk))} via ${d.payment} · ${money(Number(d.total), String(d.currency))}`
  if (l.type === 'sell') {
    const stats = (['melee', 'distance', 'magic', 'defense'] as const)
      .filter((k) => d.stats?.[k] != null).map((k) => `${k[0].toUpperCase()}${k.slice(1, 3)} ${d.stats![k]}`).join(' · ')
    return `Lv ${d.level} ${d.category}${d.asking ? ` · asking ${d.asking}` : ''}${stats ? ` · ${stats}` : ''}`
  }
  return l.account_name ? `${l.account_name}${l.account_sold ? ' (sold since)' : ''}` : String(d.title ?? l.listing_id ?? '')
}

function contactLink(l: Lead): string | null {
  if (l.method === 'whatsapp') return `https://wa.me/${l.contact.replace(/\D/g, '')}`
  return null
}

/** Leads from the website: "I want this", gold orders and accounts offered to you. */
export default function Leads() {
  const { data, setData, loading, error, refetch } = useAsyncData(leadsApi.getAll, NONE)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('open')
  const [page, setPage] = useState(1)
  const [saving, setSaving] = useState<number | null>(null)

  const leads = data.leads
  const filtered = useMemo(() => leads.filter((l) =>
    filter === 'all' ? true : filter === 'open' ? l.status === 'new' || l.status === 'contacted' : l.status === filter), [leads, filter])
  const { paginated, meta } = paginateLocally(filtered, page, PER_PAGE)

  const counts = useMemo(() => {
    const won = leads.filter((l) => l.status === 'won').length
    const closed = won + leads.filter((l) => l.status === 'lost').length
    return { new: leads.filter((l) => l.status === 'new').length, won, rate: closed ? Math.round((won / closed) * 100) : null }
  }, [leads])

  const setStatus = async (l: Lead, status: LeadStatus) => {
    setSaving(l.id)
    try {
      await leadsApi.setStatus(l.id, status)
      setData((d) => ({ ...d, leads: d.leads.map((x) => (x.id === l.id ? { ...x, status, updated_at: Date.now() } : x)) }))
      toast.success(`${l.name}: ${STATUS[status].label.toLowerCase()}.`)
      emitDataChanged() // the waiting-leads badge updates right away
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the lead.'))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">From the website: buyers who want an account or gold, and people selling you theirs</p>
        </div>
        <button onClick={() => refetch()} title="Refresh" aria-label="Refresh leads"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Waiting for a reply', value: counts.new },
          { label: 'Deals done', value: counts.won },
          { label: 'Turned into a deal', value: counts.rate != null ? `${counts.rate}%` : '—' },
        ].map((t) => (
          <Card key={t.label} className="px-4 py-3">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{t.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 px-4 py-3 dark:border-gray-700/60">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => { setFilter(f.value); setPage(1) }}
              className={['rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                filter === f.value ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'].join(' ')}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && leads.length === 0 ? (
          <div className="flex flex-col gap-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
        ) : error ? (
          <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">{error}</p>
        ) : !data.configured ? (
          <p className="p-6 text-center text-sm text-amber-700 dark:text-amber-300">The website isn't connected: set LISTING_SITE_TOKEN in the backend .env.</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Inbox className="h-7 w-7 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{leads.length ? 'Nothing here' : 'No leads yet'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">They appear when someone uses "I want this", "Order gold" or "Get an offer" on the website.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {paginated.map((l) => {
              const t = TYPES[l.type]
              const link = contactLink(l)
              return (
                <li key={l.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                  <span className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', t.tone].join(' ')}><t.Icon size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {l.name} <span className="font-normal text-gray-400">· {t.label} · {ago(l.created_at)}</span>
                    </p>
                    <p className="truncate text-xs text-gray-600 dark:text-gray-300">{summary(l)}</p>
                    {l.details.message && <p className="truncate text-xs italic text-gray-400">"{l.details.message}"</p>}
                    {l.guide?.max_buy_php != null && (
                      <p className="mt-0.5 text-[11px] text-indigo-600 dark:text-indigo-400">
                        Price guide: similar sold for <Amt value={formatCurrency(l.guide.price_php ?? 0)} />; pay up to <b><Amt value={formatCurrency(l.guide.max_buy_php)} /></b>
                        {l.guide.max_buy_gold != null && <> ({formatGoldShort(l.guide.max_buy_gold)})</>} to keep your usual margin.
                      </p>
                    )}
                    {l.type === 'sell' && <p className="text-[11px] text-gray-400">Screenshot is in #inquiries.</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {link ? (
                      <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <Phone size={12} /> {l.contact} <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" title="Discord username">
                        <MessageCircle size={12} /> {l.contact}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{STATUS[l.status].label}</span>
                    {STATUS[l.status].next.map((s) => (
                      <button key={s} disabled={saving === l.id} onClick={() => setStatus(l, s)}
                        className={['rounded-lg px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-50',
                          s === 'won' || s === 'contacted' ? 'bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'].join(' ')}>
                        {ACTION[s]}
                      </button>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {filtered.length > PER_PAGE && (
          <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700/60"><Pagination meta={meta} onPageChange={setPage} /></div>
        )}
      </Card>
    </div>
  )
}
