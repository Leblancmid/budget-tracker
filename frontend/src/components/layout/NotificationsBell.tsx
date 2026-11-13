import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, KeyRound, ShieldCheck, UserCheck, UserRound } from 'lucide-react'
import { notificationsApi, type AppNotification } from '@/api/notifications'
import { timeAgo } from '@/lib/users'

/** Checked again this often while the app is open and visible (there's no live connection) */
const POLL_MS = 60_000

const ICONS: Record<string, typeof Bell> = { access: ShieldCheck, details: UserRound, password: KeyRound, reactivated: UserCheck }

/**
 * The bell: things an admin changed on your account. Shows how many are unread, opens a list,
 * and marks them read when you open one (or all at once).
 */
export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await notificationsApi.list()
      setItems(res.data)
      setUnread(res.unread)
      setLoaded(true)
    } catch { /* offline: keep what's shown */ }
  }, [])

  // On start, then every minute while the tab is visible
  useEffect(() => {
    void load()
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void load() }, POLL_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') void load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [load])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const toggle = () => {
    setOpen((v) => !v)
    if (!open) void load()
  }

  const markRead = async (n: AppNotification) => {
    if (n.read_at) return
    setItems((all) => all.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)))
    try { setUnread(await notificationsApi.read(n.id)) } catch { /* shown as read anyway; fixed on the next check */ }
  }

  const markAll = async () => {
    setItems((all) => all.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })))
    try { setUnread(await notificationsApi.readAll()) } catch { void load() }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        title="Notifications"
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-white dark:ring-gray-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/40">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={() => void markAll()} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
              </button>
            )}
          </div>
          {!loaded ? (
            <div className="space-y-2 p-4">{[0, 1].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="h-6 w-6 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Nothing yet. You'll see here when an admin changes your account.</p>
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto scrollbar-thin dark:divide-gray-800">
              {items.map((n) => {
                const Icon = ICONS[n.kind] ?? Bell
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void markRead(n)}
                      className={['flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50', n.read_at ? '' : 'bg-indigo-50/50 dark:bg-indigo-900/10'].join(' ')}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300"><Icon className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{n.title}</span>
                          {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="Unread" />}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-gray-600 dark:text-gray-300">{n.body}</span>
                        <span className="mt-1 block text-[11px] text-gray-400">By {n.by} · {timeAgo(n.created_at)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
