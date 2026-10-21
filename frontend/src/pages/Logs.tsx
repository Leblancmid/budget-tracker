import { useMemo, useState } from 'react'
import { RefreshCw, ScrollText, Search, User, X } from 'lucide-react'
import { useLogs } from '@/hooks/useLogs'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { paginateLocally } from '@/utils/format'
import { useAuth } from '@/context/auth'
import type { LogEntry } from '@/api/logs'
import { LogRow } from './logs/LogRow'
import { LogsHero } from './logs/LogsHero'
import {
  EVENT_FILTERS, MODULE_ORDER, MODULE_STYLES, PER_PAGE, TYPE_LABEL, dayLabel, eventOf, summarizeLogs,
  type EventKey, type ModuleKey, type UserFilterKey,
} from './logs/logFormat'

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

  const summary = useMemo(() => summarizeLogs(byUser), [byUser])

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
        <LogsHero
          summary={summary}
          shownCount={byUser.length}
          totalCount={entries.length}
          userName={activeUser === 'all' ? null : users.find((u) => u.id === activeUser)?.name ?? ''}
        />
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
            <button onClick={() => reset(() => setSearchQuery(''))} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"><X size={14} /></button>
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

          {EVENT_FILTERS.map(({ key, label, Icon }) => (
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
                  {g.items.map((e, i) => <LogRow key={`${g.key}-${i}`} entry={e} />)}
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
