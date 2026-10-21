import { useMemo, useState } from 'react'
import { Activity, Archive, ArrowLeftRight, Briefcase, Coins, Landmark, Monitor, Pencil, PiggyBank, Plus, RefreshCw, ScrollText, Search, Smartphone, User, Wallet, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLogs } from '@/hooks/useLogs'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { Amt } from '@/components/ui/Amt'
import { paginateLocally } from '@/utils/format'
import { useAuth } from '@/context/auth'
import type { LogEntry } from '@/api/logs'

const PER_PAGE = 30

type ModuleKey = LogEntry['module'] | 'all'
type UserFilterKey = 'all' | number
type EventKey = 'all' | 'created' | 'edited' | 'archived'

const MODULE_STYLES: Record<LogEntry['module'], { Icon: LucideIcon; tile: string; badge: string; bar: string; label: string }> = {
  daily:    { Icon: Wallet,         tile: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300',    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',    bar: 'bg-indigo-400',  label: 'Daily' },
  business: { Icon: Briefcase,      tile: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300',            badge: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',            bar: 'bg-teal-400',    label: 'Business' },
  savings:  { Icon: PiggyBank,      tile: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', bar: 'bg-emerald-400', label: 'Savings' },
  balance:  { Icon: Landmark,       tile: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',    bar: 'bg-violet-400',  label: 'Balance' },
  gold:     { Icon: Coins,          tile: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',        bar: 'bg-amber-400',   label: 'Gold' },
  trade:    { Icon: ArrowLeftRight, tile: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',            badge: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',            bar: 'bg-rose-400',    label: 'Trades' },
}
const MODULE_ORDER: LogEntry['module'][] = ['daily', 'business', 'balance', 'gold', 'trade', 'savings']

const TYPE_LABEL: Record<string, string> = {
  income: 'Income', expense: 'Expense',
  deposit: 'Deposit', withdraw: 'Withdraw',
  add: 'Add', sell: 'Sell', fee: 'MM fee',
  account: 'Account', gold: 'Gold',
  kks: 'KKS', cash: 'Cash',
  archived: 'Sold / archived', edited: 'Edited',
}

const eventOf = (e: LogEntry): Exclude<EventKey, 'all'> => (e.type === 'edited' ? 'edited' : e.type === 'archived' ? 'archived' : 'created')

type ValueKind = 'gold' | 'php' | 'usd' | 'rate' | 'date' | 'text'

const FIELD_META: Record<string, { label: string; kind: ValueKind }> = {
  description:         { label: 'Description',      kind: 'text' },
  notes:               { label: 'Notes',            kind: 'text' },
  type:                { label: 'Type',             kind: 'text' },
  scope:               { label: 'Counts toward',    kind: 'text' },
  action:              { label: 'Action',           kind: 'text' },
  status:              { label: 'Status',           kind: 'text' },
  currency:            { label: 'Currency',         kind: 'text' },
  payment_method:      { label: 'Payment Method',   kind: 'text' },
  account:             { label: 'Account',          kind: 'text' },
  account_id:          { label: 'Account',          kind: 'text' },
  category_id:         { label: 'Category',         kind: 'text' },
  date:                { label: 'Date',             kind: 'date' },
  completion_date:     { label: 'Completion Date',  kind: 'date' },
  archived_at:         { label: 'Sold / Archived',  kind: 'date' },
  price_gold:          { label: 'Price (G)',        kind: 'gold' },
  cost_gold:           { label: 'Cost (G)',         kind: 'gold' },
  price_gold_received: { label: 'Received (G)',     kind: 'gold' },
  cost_gold_paid:      { label: 'Paid (G)',         kind: 'gold' },
  price_rate:          { label: 'Price Rate ($)',   kind: 'rate' },
  cost_rate:           { label: 'Cost Rate ($)',    kind: 'rate' },
  php_rate:            { label: 'PHP Rate (Price)', kind: 'rate' },
  cost_php_rate:       { label: 'PHP Rate (Cost)',  kind: 'rate' },
  price_php:           { label: 'Price (₱)',        kind: 'php' },
  cost_php:            { label: 'Cost (₱)',         kind: 'php' },
  profit_php:          { label: 'Profit (₱)',       kind: 'php' },
  middleman_fee:       { label: 'Middleman Fee',    kind: 'gold' },
}

/** Kind of the `amount` field: G for gold, the account's currency for balance, ₱ otherwise. */
function amountKind(e: LogEntry): ValueKind {
  if (e.module === 'gold')    return 'gold'
  if (e.module === 'balance') return e.currency === 'PHP' ? 'php' : 'usd'
  if (e.module === 'trade')   return 'text'
  return 'php'
}

function fieldMeta(field: string, e: LogEntry): { label: string; kind: ValueKind } {
  if (field === 'amount') return { label: 'Amount', kind: amountKind(e) }
  return FIELD_META[field] ?? { label: field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), kind: 'text' }
}

function formatValue(value: unknown, kind: ValueKind): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  const money = (v: number) => v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  switch (kind) {
    case 'gold': return Number.isFinite(n) ? `${Math.round(n).toLocaleString()} G` : String(value)
    case 'php':  return Number.isFinite(n) ? `₱${money(n)}` : String(value)
    case 'usd':  return Number.isFinite(n) ? `$${money(n)}` : String(value)
    case 'rate': return Number.isFinite(n) ? String(Math.round(n * 10000) / 10000) : String(value)
    case 'date': {
      const d = new Date(String(value).length <= 10 ? `${value}T00:00:00` : String(value))
      return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    default: return String(value)
  }
}

function ChangeList({ entry }: { entry: LogEntry }) {
  const rows = Object.entries(entry.changes ?? {})
  if (rows.length === 0) return null
  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700/60 divide-y divide-gray-100 dark:divide-gray-700/60">
      {rows.map(([field, { before, after }]) => {
        const { label, kind } = fieldMeta(field, entry)
        const isMoney = kind === 'php' || kind === 'usd'
        const b = formatValue(before, kind)
        const a = formatValue(after, kind)
        return (
          <div key={field} className="grid grid-cols-[minmax(90px,140px)_1fr] sm:grid-cols-[160px_1fr] items-start gap-2 px-3 py-1.5 bg-gray-50/60 dark:bg-gray-800/30">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate" title={label}>{label}</span>
            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs min-w-0">
              <span className="text-red-500/90 dark:text-red-400/90 line-through decoration-red-300/60 break-all">
                {isMoney && b !== '—' ? <Amt value={b} /> : b}
              </span>
              <span className="text-gray-300 dark:text-gray-600">→</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 break-all">
                {isMoney && a !== '—' ? <Amt value={a} /> : a}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

function isPositiveEntry(e: LogEntry): boolean {
  if (e.module === 'daily')    return e.type === 'income'
  if (e.module === 'savings')  return e.type === 'deposit'
  if (e.module === 'balance')  return e.type === 'add'
  if (e.module === 'gold')     return e.type === 'add' || e.type === 'fee'
  if (e.module === 'business') return parseFloat(e.amount ?? '0') >= 0
  return true
}

function formatAmount(e: LogEntry): string {
  if (e.amount == null) return '—'
  const n = Math.abs(parseFloat(e.amount))
  const kind = amountKind(e)
  if (kind === 'text') return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return formatValue(n, kind)
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTimeOnly = (iso: string) => new Date(iso).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true })
const formatDateTime = (iso: string) => new Date(iso).toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

function dayLabel(d: Date): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const x = new Date(d); x.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - x.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function detectDevice(ua: string | null): 'mobile' | 'desktop' | null {
  if (!ua) return null
  return /mobile|android|iphone|ipad|tablet/i.test(ua) ? 'mobile' : 'desktop'
}

export default function Logs() {
  const { entries, loading, refetch } = useLogs()
  const { user: currentUser } = useAuth()

  const users = useMemo(() => {
    const userMap = new Map<number, { id: number; name: string; email: string }>()
    if (currentUser) userMap.set(currentUser.id, { id: currentUser.id, name: currentUser.name, email: currentUser.email })
    entries.forEach((e) => { if (e.user_id && e.user_name) userMap.set(e.user_id, { id: e.user_id, name: e.user_name, email: e.user_email || '' }) })
    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [entries, currentUser])

  // Default to Mikey's entries when that user exists
  const mikeyUser = users.find((u) => u.name.toLowerCase() === 'mikey')
  const [activeUser, setActiveUser]     = useState<UserFilterKey>(mikeyUser?.id ?? 'all')
  const [activeModule, setActiveModule] = useState<ModuleKey>('all')
  const [activeEvent, setActiveEvent]   = useState<EventKey>('all')
  const [searchQuery, setSearchQuery]   = useState('')
  const [page, setPage]                 = useState(1)

  const byUser = useMemo(() => (activeUser === 'all' ? entries : entries.filter((e) => e.user_id === activeUser)), [entries, activeUser])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return byUser.filter((e) => {
      if (activeModule !== 'all' && e.module !== activeModule) return false
      if (activeEvent !== 'all' && eventOf(e) !== activeEvent) return false
      if (!q) return true
      return [e.description, TYPE_LABEL[e.type] ?? e.type, e.user_name, e.amount, e.ip_address, e.account_name, MODULE_STYLES[e.module]?.label]
        .some((v) => String(v ?? '').toLowerCase().includes(q))
    })
  }, [byUser, activeModule, activeEvent, searchQuery])

  const moduleCounts = useMemo(() => {
    const c: Record<string, number> = { all: 0 }
    for (const e of byUser) {
      if (activeEvent !== 'all' && eventOf(e) !== activeEvent) continue
      c.all++
      c[e.module] = (c[e.module] ?? 0) + 1
    }
    return c
  }, [byUser, activeEvent])

  const eventCounts = useMemo(() => {
    const c: Record<EventKey, number> = { all: 0, created: 0, edited: 0, archived: 0 }
    for (const e of byUser) {
      if (activeModule !== 'all' && e.module !== activeModule) continue
      c.all++
      c[eventOf(e)]++
    }
    return c
  }, [byUser, activeModule])

  // ── Summary for the current user filter ──
  const summary = useMemo(() => {
    const now = Date.now()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    let todayCount = 0, weekCount = 0, edits = 0
    const perModule: Record<string, number> = {}
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - 13 + i)
      return { key: d.toDateString(), date: d, count: 0 }
    })
    const dayMap = new Map(days.map((d) => [d.key, d]))
    for (const e of byUser) {
      const t = new Date(e.created_at)
      if (t >= today) todayCount++
      if (now - t.getTime() < 7 * 86400000) weekCount++
      if (e.type === 'edited') edits++
      perModule[e.module] = (perModule[e.module] ?? 0) + 1
      const d = dayMap.get(t.toDateString())
      if (d) d.count++
    }
    const top = Object.entries(perModule).sort((a, b) => b[1] - a[1])[0]
    return { todayCount, weekCount, edits, top, days, dayMax: Math.max(1, ...days.map((d) => d.count)) }
  }, [byUser])

  const { paginated, meta } = paginateLocally(filtered, page, PER_PAGE)

  const groups = useMemo(() => {
    const out: { key: string; label: string; items: LogEntry[] }[] = []
    for (const e of paginated) {
      const d = new Date(e.created_at)
      const key = d.toDateString()
      let g = out[out.length - 1]
      if (!g || g.key !== key) { g = { key, label: dayLabel(d), items: [] }; out.push(g) }
      g.items.push(e)
    }
    return out
  }, [paginated])

  const reset = (fn: () => void) => { fn(); setPage(1) }
  const hasFilters = activeModule !== 'all' || activeEvent !== 'all' || !!searchQuery.trim()

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Activity logs</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Every add, edit and sale across the app — with before → after for edits</p>
        </div>
        <button onClick={refetch} disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
          <RefreshCw className={['h-4 w-4', loading ? 'animate-spin' : ''].join(' ')} /> Refresh
        </button>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      {loading && entries.length === 0 ? (
        <div className="h-44 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-400/20">
                    <ScrollText className="h-3.5 w-3.5 text-slate-200" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Entries</span>
                  {activeUser !== 'all' && (
                    <span className="text-[10px] font-semibold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">{users.find((u) => u.id === activeUser)?.name}</span>
                  )}
                </div>
                <p className="text-4xl font-bold text-slate-100">{byUser.length.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">of {entries.length.toLocaleString()} across all users</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Today',     value: summary.todayCount },
                  { label: 'This week', value: summary.weekCount },
                  { label: 'Edits',     value: summary.edits },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white/5 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
                    <p className="text-lg font-bold text-slate-100">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 14-day activity */}
            <div className="flex flex-col justify-end gap-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><Activity size={11} /> Last 14 days</span>
                {summary.top && (
                  <span>Busiest: <b className="text-slate-300">{MODULE_STYLES[summary.top[0] as LogEntry['module']]?.label ?? summary.top[0]}</b> ({summary.top[1]})</span>
                )}
              </div>
              <div className="flex h-24 items-end gap-1">
                {summary.days.map((d) => (
                  <div key={d.key} className="flex h-full flex-1 flex-col justify-end" title={`${d.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}: ${d.count} entr${d.count === 1 ? 'y' : 'ies'}`}>
                    <span className={['w-full rounded-t-md transition-all duration-700', d.count ? 'bg-violet-400/80' : 'bg-white/10'].join(' ')} style={{ height: d.count ? `${Math.max(8, (d.count / summary.dayMax) * 100)}%` : '4px' }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{summary.days[0].date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────── */}
      <Card className="flex flex-col gap-3 p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={(e) => reset(() => setSearchQuery(e.target.value))}
            placeholder="Search description, type, user, account, amount or IP…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
          {searchQuery && (
            <button onClick={() => reset(() => setSearchQuery(''))} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"><X size={14} /></button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => reset(() => setActiveModule('all'))}
            className={['rounded-full px-3 py-1 text-xs font-semibold transition-colors', activeModule === 'all' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'].join(' ')}>
            All modules <span className="opacity-60">{moduleCounts.all ?? 0}</span>
          </button>
          {MODULE_ORDER.filter((m) => (moduleCounts[m] ?? 0) > 0 || activeModule === m).map((m) => {
            const s = MODULE_STYLES[m]
            const on = activeModule === m
            return (
              <button key={m} onClick={() => reset(() => setActiveModule(on ? 'all' : m))}
                className={['flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors', on ? s.badge + ' ring-1 ring-current/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'].join(' ')}>
                <s.Icon size={12} /> {s.label} <span className="opacity-60">{moduleCounts[m] ?? 0}</span>
              </button>
            )
          })}

          <span className="mx-1 hidden h-5 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

          {([
            { key: 'all',      label: 'All events',      Icon: null },
            { key: 'created',  label: 'Created',         Icon: Plus },
            { key: 'edited',   label: 'Edited',          Icon: Pencil },
            { key: 'archived', label: 'Sold / archived', Icon: Archive },
          ] as const).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => reset(() => setActiveEvent(key))}
              className={['flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors', activeEvent === key ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'].join(' ')}>
              {Icon && <Icon size={11} />} {label} <span className="opacity-60">{eventCounts[key]}</span>
            </button>
          ))}
        </div>

        {users.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500"><User size={12} /> User</span>
            {[{ id: 'all' as const, name: 'Everyone', count: entries.length }, ...users.map((u) => ({ id: u.id, name: u.name, count: entries.filter((e) => e.user_id === u.id).length }))].map((u) => (
              <button key={String(u.id)} onClick={() => reset(() => setActiveUser(u.id))}
                className={['rounded-full px-3 py-1 text-xs font-semibold transition-colors', activeUser === u.id ? 'bg-blue-600 text-white dark:bg-blue-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'].join(' ')}>
                {u.name} <span className="opacity-60">{u.count}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* ── Timeline ───────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        {loading && entries.length === 0 ? (
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3 w-48 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-2.5 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <ScrollText className="h-6 w-6 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-400 dark:text-gray-500">{hasFilters ? 'No entries match these filters.' : 'No activity logged yet.'}</p>
            {hasFilters && (
              <button onClick={() => reset(() => { setActiveModule('all'); setActiveEvent('all'); setSearchQuery('') })} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Clear filters</button>
            )}
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <div key={g.key}>
                <div className="flex items-center justify-between gap-3 bg-gray-50/80 dark:bg-gray-800/40 px-5 py-2 border-y border-gray-100 dark:border-gray-700/60 first:border-t-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{g.label}</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{g.items.length} entr{g.items.length === 1 ? 'y' : 'ies'}</span>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {g.items.map((e, i) => {
                    const s = MODULE_STYLES[e.module]
                    const positive = isPositiveEntry(e)
                    const device = detectDevice(e.user_agent)
                    const ev = eventOf(e)
                    return (
                      <div key={`${g.key}-${i}`} className="flex gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <div className="flex w-14 shrink-0 flex-col items-end pt-1 text-[11px] text-gray-400 dark:text-gray-500" title={formatDateTime(e.created_at)}>
                          {formatTimeOnly(e.created_at)}
                        </div>
                        <div className="relative">
                          <span className={['flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', s.tile].join(' ')}><s.Icon size={15} /></span>
                          {ev !== 'created' && (
                            <span className={['absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-900', ev === 'edited' ? 'bg-indigo-500' : 'bg-amber-500'].join(' ')}>
                              {ev === 'edited' ? <Pencil size={8} className="text-white" /> : <Archive size={8} className="text-white" />}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                {e.description || <span className="italic text-gray-400 dark:text-gray-500">No description</span>}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-gray-400 dark:text-gray-500">
                                <span className={['rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', s.badge].join(' ')}>{s.label}</span>
                                <span className="font-semibold text-gray-500 dark:text-gray-400">{TYPE_LABEL[e.type] ?? e.type}</span>
                                {e.account_name && <span>· {e.account_name}</span>}
                                {e.user_name && <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400"><User className="h-3 w-3" />{e.user_name}</span>}
                                {device && (
                                  <span className="flex items-center gap-0.5" title={e.ip_address ? `IP ${e.ip_address}` : undefined}>
                                    {device === 'mobile' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                                    {device === 'mobile' ? 'Mobile' : 'Desktop'}
                                  </span>
                                )}
                                {e.ip_address && <span className="hidden font-mono text-[10px] md:inline">{e.ip_address}</span>}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end">
                              {e.amount != null && (
                                <span className={['text-sm font-bold whitespace-nowrap', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                                  {positive ? '+' : '−'}<Amt value={formatAmount(e)} />
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(e.created_at)}</span>
                            </div>
                          </div>
                          {ev === 'edited' && <ChangeList entry={e} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {meta.last_page > 1 && (
              <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700/40">
                <Pagination meta={meta} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
