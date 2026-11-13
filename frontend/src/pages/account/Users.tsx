import { useEffect, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CandlestickChart, KeyRound, Pencil, Search, ShieldCheck, UserCheck, UserPlus, UserX, Users as UsersIcon, Wallet, X } from 'lucide-react'
import { usersApi, type AccountUser } from '@/api/users'
import type { UserRole } from '@/context/auth'
import { useUsers } from '@/hooks/useUsers'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RoleBadge, StatusLine } from '@/components/users/UserBits'
import { SetPasswordModal, UserModal } from '@/components/users/UserModal'
import { extraModules, isCustom } from '@/lib/access'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'

type Status = '' | 'active' | 'deactivated'
type Dialog =
  | { kind: 'edit'; user: AccountUser | null }
  | { kind: 'password'; user: AccountUser }
  | { kind: 'status'; user: AccountUser }
  | null

/** User management (admins): who can sign in, and what they can see. */
export default function Users() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [status, setStatus] = useState<Status>('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [busy, setBusy] = useState(false)

  // Search after a short pause in typing
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, loading, error, refetch } = useUsers({ search, role, status, page })
  const filtered = !!(search || role || status)

  const chooseStat = (next: { role?: UserRole | ''; status?: Status }) => {
    setRole(next.role ?? '')
    setStatus(next.status ?? '')
    setPage(1)
  }
  const clearFilters = () => { setSearchInput(''); setSearch(''); chooseStat({}) }

  const toggleStatus = async (u: AccountUser) => {
    setBusy(true)
    try {
      const next = u.deactivated_at ? await usersApi.reactivate(u.id) : await usersApi.deactivate(u.id)
      toast.success(next.deactivated_at ? `${u.name} can no longer sign in` : `${u.name} can sign in again`)
      setDialog(null)
      await refetch()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const stats = [
    { key: 'all', label: 'All users', value: data.counts.all, icon: UsersIcon, glow: 'from-indigo-500/15', color: 'text-indigo-600 dark:text-indigo-300', active: !role && !status, pick: () => chooseStat({}) },
    { key: 'admin', label: 'Admins', value: data.counts.admin, icon: ShieldCheck, glow: 'from-violet-500/15', color: 'text-violet-600 dark:text-violet-300', active: role === 'admin', pick: () => chooseStat({ role: 'admin', status: 'active' }) },
    { key: 'trader', label: 'Traders', value: data.counts.trader, icon: CandlestickChart, glow: 'from-amber-500/15', color: 'text-amber-600 dark:text-amber-300', active: role === 'trader', pick: () => chooseStat({ role: 'trader', status: 'active' }) },
    { key: 'daily', label: 'Daily Expenses only', value: data.counts.daily_only, icon: Wallet, glow: 'from-sky-500/15', color: 'text-sky-600 dark:text-sky-300', active: role === 'daily_only', pick: () => chooseStat({ role: 'daily_only', status: 'active' }) },
    { key: 'off', label: 'Deactivated', value: data.counts.deactivated, icon: UserX, glow: 'from-rose-500/15', color: 'text-rose-600 dark:text-rose-300', active: status === 'deactivated' && !role, pick: () => chooseStat({ status: 'deactivated' }) },
  ]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      {/* Title + the one main action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Who can sign in, and what each person can see.</p>
        </div>
        <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setDialog({ kind: 'edit', user: null })}>Add user</Button>
      </div>

      {/* Counts: each one is also a filter */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={s.pick}
            aria-pressed={s.active}
            className={[
              'group relative overflow-hidden rounded-2xl border bg-white p-3 text-left shadow-sm transition-all sm:p-4 hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900',
              s.active ? 'border-indigo-400 ring-1 ring-indigo-400 dark:border-indigo-500 dark:ring-indigo-500' : 'border-gray-200/80 dark:border-gray-800',
            ].join(' ')}
          >
            <div className={['pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent', s.glow].join(' ')} />
            <s.icon className={['relative h-4 w-4 sm:h-5 sm:w-5', s.color].join(' ')} />
            <p className="relative mt-2 text-lg font-bold tabular-nums sm:mt-3 sm:text-2xl text-gray-900 dark:text-white">{s.value}</p>
            <p className="relative text-[11px] font-medium leading-tight text-gray-500 sm:text-xs dark:text-gray-400">{s.label}</p>
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-gray-100 p-3 sm:flex-row sm:items-center sm:p-4 dark:border-gray-800">
          <label className="relative flex-1">
            <span className="sr-only">Search users</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setSearchInput('') }}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800" role="group" aria-label="Filter by role">
            {([['', 'Everyone'], ['admin', 'Admins'], ['trader', 'Traders'], ['daily_only', 'Daily only']] as const).map(([value, label]) => (
              <button
                key={value || 'all'}
                type="button"
                aria-pressed={role === value}
                onClick={() => { setRole(value); setPage(1) }}
                className={['flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none', role === value ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
          {filtered && (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 self-start text-xs font-medium text-gray-500 hover:text-gray-800 sm:self-auto dark:hover:text-gray-200">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Header row (wide screens) */}
        <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_2.5rem] gap-4 border-b border-gray-100 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 md:grid dark:border-gray-800">
          <span>User</span><span>Access</span><span>Status</span><span>Joined</span><span className="sr-only">Actions</span>
        </div>

        {error ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Couldn't load users</p>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <Button className="mt-4" variant="secondary" onClick={() => void refetch()}>Try again</Button>
          </div>
        ) : loading && data.data.length === 0 ? (
          <RowsSkeleton />
        ) : data.data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800"><UsersIcon className="h-6 w-6" /></span>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{filtered ? 'No users match' : 'No users yet'}</p>
            <p className="text-sm text-gray-500">{filtered ? 'Try another name or clear the filters.' : 'Add someone so they can sign in.'}</p>
            {filtered && <Button size="sm" variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          </div>
        ) : (
          <ul className={['divide-y divide-gray-100 transition-opacity dark:divide-gray-800', loading ? 'opacity-60' : ''].join(' ')}>
            {data.data.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onOpen={() => navigate(`/users/${u.id}`)}
                onEdit={() => setDialog({ kind: 'edit', user: u })}
                onPassword={() => setDialog({ kind: 'password', user: u })}
                onStatus={() => setDialog({ kind: 'status', user: u })}
              />
            ))}
          </ul>
        )}

        {data.last_page > 1 && (
          <div className="border-t border-gray-100 px-4 dark:border-gray-800">
            <Pagination meta={data} onPageChange={setPage} />
          </div>
        )}
      </section>

      {dialog?.kind === 'edit' && (
        <UserModal
          user={dialog.user}
          onClose={() => setDialog(null)}
          onSaved={() => { setDialog(null); void refetch() }}
        />
      )}
      {dialog?.kind === 'password' && <SetPasswordModal user={dialog.user} onClose={() => setDialog(null)} />}
      <ConfirmDialog
        open={dialog?.kind === 'status'}
        onClose={() => setDialog(null)}
        onConfirm={() => (dialog?.kind === 'status' ? toggleStatus(dialog.user) : undefined)}
        loading={busy}
        title={dialog?.kind === 'status' && dialog.user.deactivated_at ? `Turn ${dialog.user.name}'s account back on?` : `Deactivate ${dialog?.user?.name ?? ''}?`}
        message={dialog?.kind === 'status' && dialog.user.deactivated_at
          ? 'They can sign in again with their current password.'
          : 'They\'re signed out everywhere and can\'t sign in. Their expenses and history are kept, and you can turn the account back on any time.'}
        confirmLabel={dialog?.kind === 'status' && dialog.user.deactivated_at ? 'Reactivate' : 'Deactivate'}
      />
    </div>
  )
}

function UserRow({ user: u, onOpen, onEdit, onPassword, onStatus }: { user: AccountUser; onOpen: () => void; onEdit: () => void; onPassword: () => void; onStatus: () => void }) {
  const joined = u.created_at ? new Date(u.created_at).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && e.target === e.currentTarget) onOpen() }

  return (
    <li
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKey}
      aria-label={`Open ${u.name}`}
      className={[
        'grid cursor-pointer grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none sm:px-5 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_2.5rem] dark:hover:bg-gray-800/40 dark:focus:bg-gray-800/40',
        u.deactivated_at ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar user={u} size="md" className={u.deactivated_at ? 'grayscale' : ''} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
            <span className="truncate">{u.name}</span>
            {u.is_self && <span className="rounded-full bg-indigo-100 px-1.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">YOU</span>}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
          {/* Phone: role and status under the name */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 md:hidden">
            <Access user={u} />
            <StatusLine user={u} />
          </div>
        </div>
      </div>
      <div className="hidden md:block"><Access user={u} /></div>
      <div className="hidden md:block"><StatusLine user={u} /></div>
      <p className="hidden text-xs text-gray-500 md:block dark:text-gray-400">{joined}</p>
      <div className="flex justify-end">
        <Menu
          label={`Actions for ${u.name}`}
          trigger={<span className="flex h-8 w-8 items-center justify-center rounded-lg text-lg leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200">⋯</span>}
          items={[
            { label: 'Edit details', icon: <Pencil className="h-4 w-4" />, onSelect: onEdit },
            { label: 'Set new password', icon: <KeyRound className="h-4 w-4" />, onSelect: onPassword, hidden: u.is_self },
            u.deactivated_at
              ? { label: 'Reactivate', icon: <UserCheck className="h-4 w-4" />, onSelect: onStatus, hidden: u.is_self }
              : { label: 'Deactivate', icon: <UserX className="h-4 w-4" />, onSelect: onStatus, danger: true, hidden: u.is_self },
          ]}
        />
      </div>
    </li>
  )
}

/** The role, and the modules this person has when they differ from what the role gives. */
function Access({ user }: { user: AccountUser }) {
  const extra = isCustom(user) ? extraModules(user) : null
  return (
    <div className="flex flex-col items-start gap-0.5">
      <RoleBadge role={user.role} />
      {isCustom(user) && <span className="text-[11px] text-gray-500 dark:text-gray-400" title="Modules picked for this person">Custom: {extra || 'Daily Expenses only'}</span>}
    </div>
  )
}

function RowsSkeleton() {
  return (
    <ul className="animate-pulse divide-y divide-gray-100 dark:divide-gray-800" aria-busy="true" aria-label="Loading users">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex items-center gap-3 px-5 py-3.5">
          <span className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-40 rounded bg-gray-200 dark:bg-gray-800" />
            <span className="block h-2.5 w-56 rounded bg-gray-100 dark:bg-gray-800/70" />
          </span>
        </li>
      ))}
    </ul>
  )
}
