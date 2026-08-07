import { useMemo, useState } from 'react'
import { ScrollText, Wallet, Briefcase, PiggyBank, DollarSign, Coins, RefreshCw, Smartphone, Monitor } from 'lucide-react'
import { useLogs } from '@/hooks/useLogs'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { Amt } from '@/context/AmountVisibilityContext'
import { paginateLocally } from '@/utils/format'
import type { LogEntry } from '@/api/logs'

const PER_PAGE = 30

type ModuleKey = LogEntry['module'] | 'all'

const MODULE_TABS: { key: ModuleKey; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'daily',    label: 'Daily' },
  { key: 'business', label: 'Business' },
  { key: 'savings',  label: 'Savings' },
  { key: 'balance',  label: 'Balance' },
  { key: 'gold',     label: 'Gold' },
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
  gold:     { Icon: Coins,      dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',        label: 'Gold' },
}

const TYPE_LABEL: Record<string, string> = {
  income: 'Income', expense: 'Expense',
  deposit: 'Deposit', withdraw: 'Withdraw',
  add: 'Add', sell: 'Sell', fee: 'Fee',
  account: 'Account', gold: 'Gold',
}

function isPositiveEntry(e: LogEntry): boolean {
  if (e.module === 'daily')    return e.type === 'income'
  if (e.module === 'savings')  return e.type === 'deposit'
  if (e.module === 'balance')  return e.type === 'add'
  if (e.module === 'gold')     return e.type === 'add'
  if (e.module === 'business') return parseFloat(e.amount ?? '0') >= 0
  return true
}

function formatAmount(e: LogEntry): string {
  if (e.amount == null) return '—'
  const n = Math.abs(parseFloat(e.amount))
  if (e.module === 'gold')    return `${n.toLocaleString()} G`
  if (e.module === 'balance') return `$${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
  const [activeModule, setActiveModule] = useState<ModuleKey>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (activeModule === 'all') return entries
    return entries.filter((e) => e.module === activeModule)
  }, [entries, activeModule])

  const { paginated, meta } = paginateLocally(filtered, page, PER_PAGE)

  const handleModule = (m: ModuleKey) => { setActiveModule(m); setPage(1) }

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
              <p className="text-xs text-gray-400 dark:text-gray-500">{entries.length} total entries</p>
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

      {/* Module filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {MODULE_TABS.map(({ key, label }) => {
          const count = key === 'all' ? entries.length : entries.filter((e) => e.module === key).length
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
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  {/* Module dot */}
                  <div className={['h-2 w-2 rounded-full shrink-0 mt-px', cfg.dot].join(' ')} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={['text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide', cfg.badge].join(' ')}>
                        {cfg.label}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                        {typeLabel}
                      </span>
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
