import { useMemo, useState } from 'react'
import { ScrollText, Wallet, Briefcase, PiggyBank, DollarSign, Coins, RefreshCw, Smartphone, Monitor, ArrowLeftRight, User, Search } from 'lucide-react'
import { useLogs } from '@/hooks/useLogs'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { Amt } from '@/context/AmountVisibilityContext'
import { paginateLocally } from '@/utils/format'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import type { LogEntry } from '@/api/logs'

const PER_PAGE = 30

type ModuleKey = LogEntry['module'] | 'all'
type UserFilterKey = 'all' | number

const MODULE_TABS: { key: ModuleKey; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'daily',    label: 'Daily' },
  { key: 'business', label: 'Business' },
  { key: 'savings',  label: 'Savings' },
  { key: 'balance',  label: 'Balance' },
  { key: 'gold',     label: 'Gold' },
  { key: 'trade',    label: 'Trades' },
]

const MODULE_STYLES: Record<LogEntry['module'], {
  Icon: React.ComponentType<{ className?: string }>
  dot: string
  badge: string
  label: string
}> = {
  daily:    { Icon: Wallet,     dot: 'bg-indigo-500',  badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',    label: 'Daily' },
  business: { Icon: Briefcase,  dot: 'bg-teal-500',    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',            label: 'Business' },
  savings:  { Icon: PiggyBank,  dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Savings' },
  balance:  { Icon: DollarSign, dot: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',    label: 'Balance' },
  gold:     { Icon: Coins,         dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',        label: 'Gold' },
  trade:    { Icon: ArrowLeftRight, dot: 'bg-rose-500',   badge: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',            label: 'Trade' },
}

const TYPE_LABEL: Record<string, string> = {
  income: 'Income', expense: 'Expense',
  deposit: 'Deposit', withdraw: 'Withdraw',
  add: 'Add', sell: 'Sell', fee: 'Fee',
  account: 'Account', gold: 'Gold',
  kks: 'KKS', cash: 'Cash',
  archived: 'Archived', edited: 'Edited',
}

type ValueKind = 'gold' | 'php' | 'usd' | 'rate' | 'date' | 'text'

const FIELD_META: Record<string, { label: string; kind: ValueKind }> = {
  description:         { label: 'Description',      kind: 'text' },
  notes:               { label: 'Notes',            kind: 'text' },
  type:                { label: 'Type',             kind: 'text' },
  action:              { label: 'Action',           kind: 'text' },
  status:              { label: 'Status',           kind: 'text' },
  currency:            { label: 'Currency',         kind: 'text' },
  payment_method:      { label: 'Payment Method',   kind: 'text' },
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
  middleman_fee:       { label: 'Middleman Fee',    kind: 'text' },
}

/** How a field is shown; `amount` depends on the module (G for gold, $ for balance, ₱ otherwise). */
function fieldMeta(field: string, module: LogEntry['module']): { label: string; kind: ValueKind } {
  if (field === 'amount') return { label: 'Amount', kind: module === 'gold' ? 'gold' : module === 'balance' ? 'usd' : module === 'trade' ? 'text' : 'php' }
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
        const { label, kind } = fieldMeta(field, entry.module)
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
  if (e.module === 'trade')    return true
  return true
}

function formatAmount(e: LogEntry): string {
  if (e.amount == null) return '—'
  const n = Math.abs(parseFloat(e.amount))
  if (e.module === 'gold')    return `${n.toLocaleString()} G`
  if (e.module === 'balance') return `$${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (e.module === 'trade')   return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `₱${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function detectDevice(ua: string | null): 'mobile' | 'desktop' | null {
  if (!ua) return null
  return /mobile|android|iphone|ipad|tablet/i.test(ua) ? 'mobile' : 'desktop'
}

export default function Logs() {
  const { entries, loading, refetch } = useLogs()
  const { user: currentUser } = useAuth()
  const [activeModule, setActiveModule] = useState<ModuleKey>('all')
  
  // Extract unique users from logs and add current user if not in list
  const users = useMemo(() => {
    const userMap = new Map<number, { id: number; name: string; email: string }>()
    
    // Add current user first if available
    if (currentUser) {
      userMap.set(currentUser.id, { 
        id: currentUser.id, 
        name: currentUser.name, 
        email: currentUser.email 
      })
    }
    
    // Add users from logs
    entries.forEach((e) => {
      if (e.user_id && e.user_name) {
        userMap.set(e.user_id, { id: e.user_id, name: e.user_name, email: e.user_email || '' })
      }
    })
    
    return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [entries, currentUser])

  // Find Mikey's user ID, fallback to 'all' if not found
  const mikeyUser = users.find(u => u.name.toLowerCase() === 'mikey')
  const defaultUser: UserFilterKey = mikeyUser?.id ?? 'all'
  
  const [activeUser, setActiveUser] = useState<UserFilterKey>(defaultUser)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let result = entries
    
    // Filter by module
    if (activeModule !== 'all') {
      result = result.filter((e) => e.module === activeModule)
    }
    
    // Filter by user
    if (activeUser !== 'all') {
      result = result.filter((e) => e.user_id === activeUser)
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((e) => {
        const description = (e.description || '').toLowerCase()
        const type = (TYPE_LABEL[e.type] || e.type).toLowerCase()
        const userName = (e.user_name || '').toLowerCase()
        const amount = (e.amount || '').toString()
        const ipAddress = (e.ip_address || '').toLowerCase()
        
        return (
          description.includes(query) ||
          type.includes(query) ||
          userName.includes(query) ||
          amount.includes(query) ||
          ipAddress.includes(query)
        )
      })
    }
    
    return result
  }, [entries, activeModule, activeUser, searchQuery])

  const { paginated, meta } = paginateLocally(filtered, page, PER_PAGE)

  const handleModule = (m: ModuleKey) => { setActiveModule(m); setPage(1) }
  const handleUser = (u: UserFilterKey) => { setActiveUser(u); setPage(1) }
  const handleSearch = (value: string) => { setSearchQuery(value); setPage(1) }

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <ScrollText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Activity Logs</h1>
            {!loading && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {filtered.length} {filtered.length !== entries.length && `of ${entries.length}`} entries
              </p>
            )}
          </div>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={['h-3.5 w-3.5', loading ? 'animate-spin' : ''].join(' ')} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search logs by description, type, user, amount, or IP..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
      />

      {/* User filter pills — hidden on mobile */}
      {users.length > 0 && (
        <div className="hidden md:flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Filter by User</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleUser('all')}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                activeUser === 'all'
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              All Users
              <span className={['text-[10px] font-bold', activeUser === 'all' ? 'opacity-70' : 'opacity-50'].join(' ')}>
                {entries.length}
              </span>
            </button>
            {users.map((user) => {
              const count = entries.filter((e) => e.user_id === user.id).length
              return (
                <button
                  key={user.id}
                  onClick={() => handleUser(user.id)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                    activeUser === user.id
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                  ].join(' ')}
                  title={user.email}
                >
                  {user.name}
                  <span className={['text-[10px] font-bold', activeUser === user.id ? 'opacity-70' : 'opacity-50'].join(' ')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Module filter pills — hidden on mobile */}
      <div className="hidden md:flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ScrollText className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Filter by Module</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MODULE_TABS.map(({ key, label }) => {
            const count = key === 'all' ? filtered.length : entries.filter((e) => e.module === key && (activeUser === 'all' || e.user_id === activeUser)).length
            return (
              <button
                key={key}
                onClick={() => handleModule(key)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                  activeModule === key
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
                ].join(' ')}
              >
                {label}
                <span className={['text-[10px] font-bold', activeModule === key ? 'opacity-70' : 'opacity-50'].join(' ')}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex gap-2">
                    <div className="h-4 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
                    <div className="h-4 w-12 rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="h-3 w-48 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="h-3.5 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-2.5 w-12 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            ))
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
              No activity logs yet.
            </div>
          ) : (
            paginated.map((e, i) => {
              const cfg      = MODULE_STYLES[e.module]
              const positive = isPositiveEntry(e)
              const typeLabel = TYPE_LABEL[e.type] ?? e.type
              const device   = detectDevice(e.user_agent)
              return (
                <div key={i} className={['flex gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors', e.changes ? 'items-start' : 'items-center'].join(' ')}>
                  {/* Module dot */}
                  <div className={['h-2 w-2 rounded-full shrink-0', e.changes ? 'mt-[26px]' : 'mt-px', cfg.dot].join(' ')} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={['text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide', cfg.badge].join(' ')}>
                        {cfg.label}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        {typeLabel}
                      </span>
                      {e.user_name && (
                        <span className="flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                          <User className="h-3 w-3" />
                          {e.user_name}
                        </span>
                      )}
                      {device && (
                        <span className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                          {device === 'mobile'
                            ? <Smartphone className="h-3 w-3" />
                            : <Monitor className="h-3 w-3" />
                          }
                          {device === 'mobile' ? 'Mobile' : 'Desktop'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate mt-0.5">
                      {e.description ?? <span className="italic text-gray-400 dark:text-gray-500 text-xs">No description</span>}
                    </p>
                    {e.ip_address && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{e.ip_address}</p>
                    )}
                    {e.type === 'edited' && <ChangeList entry={e} />}
                  </div>

                  {/* Amount + time */}
                  <div className="flex flex-col items-end shrink-0 gap-0.5">
                    {e.amount != null && (
                      <span className={['text-sm font-bold', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'].join(' ')}>
                        {positive ? '+' : '−'}<Amt value={formatAmount(e)} />
                      </span>
                    )}
                    <span
                      className="text-[10px] text-gray-400 dark:text-gray-500 cursor-default"
                      title={formatDateTime(e.created_at)}
                    >
                      {timeAgo(e.created_at)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {meta.last_page > 1 && (
        <Pagination meta={meta} onPageChange={setPage} />
      )}

    </div>
  )
}
