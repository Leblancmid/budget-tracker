import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Activity, ArrowLeft, KeyRound, LogOut, Monitor, Pencil, ShieldAlert, ShieldCheck, Smartphone, UserCheck, UserX } from 'lucide-react'
import { usersApi, type UserActivity } from '@/api/users'
import { useUserDetail } from '@/hooks/useUsers'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Menu } from '@/components/ui/Menu'
import { RoleBadge, StatusLine } from '@/components/users/UserBits'
import { SetPasswordModal, UserModal } from '@/components/users/UserModal'
import { extraModules, isCustom } from '@/lib/access'
import { deviceName, isPhone, timeAgo } from '@/lib/users'
import { MODULE_STYLES, TYPE_LABEL } from '@/pages/logs/logFormat'
import type { LogEntry } from '@/api/logs'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'

type Dialog = 'edit' | 'password' | 'status' | 'everywhere' | null

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/** Users → one person: their account, what they did lately, where they're signed in, failed sign-ins. */
export default function UserDetail() {
  const id = Number(useParams().id)
  const { data, loading, error, refetch } = useUserDetail(id)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [busy, setBusy] = useState<number | 'status' | 'everywhere' | null>(null)

  if (loading && !data) return <DetailSkeleton />
  if (error || !data) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Couldn't load this user</p>
        <p className="mt-1 text-sm text-gray-500">{error ?? 'Not found.'}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link to="/users" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">Back to users</Link>
          <Button variant="secondary" onClick={() => void refetch()}>Try again</Button>
        </div>
      </div>
    )
  }

  const { user, sessions, failed_sign_ins: failed, activity } = data
  const self = user.is_self

  const run = async (key: number | 'status' | 'everywhere', job: () => Promise<string>) => {
    setBusy(key)
    try {
      toast.success(await job())
      setDialog(null)
      await refetch()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const toggleStatus = () => run('status', async () => {
    const next = user.deactivated_at ? await usersApi.reactivate(user.id) : await usersApi.deactivate(user.id)
    return next.deactivated_at ? `${user.name} can no longer sign in` : `${user.name} can sign in again`
  })

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <Link to="/users" className="inline-flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
        <ArrowLeft className="h-4 w-4" /> All users
      </Link>

      {/* Who they are, and the one main action */}
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6 dark:border-gray-800 dark:bg-gray-900">
        <Avatar user={user} size="lg" className={user.deactivated_at ? 'grayscale' : ''} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
            <RoleBadge role={user.role} />
            {self && <span className="rounded-full bg-indigo-100 px-1.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">YOU</span>}
          </div>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <StatusLine user={user} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Can open: {extraModules(user) || 'Daily Expenses only'}{isCustom(user) ? ' (custom)' : ''}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setDialog('edit')}>Edit</Button>
          {!self && (
            <Menu
              label={`More for ${user.name}`}
              trigger={<span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">⋯</span>}
              items={[
                { label: 'Set new password', icon: <KeyRound className="h-4 w-4" />, onSelect: () => setDialog('password') },
                { label: 'Sign out everywhere', icon: <LogOut className="h-4 w-4" />, onSelect: () => setDialog('everywhere'), hidden: sessions.length === 0 },
                user.deactivated_at
                  ? { label: 'Reactivate', icon: <UserCheck className="h-4 w-4" />, onSelect: () => setDialog('status') }
                  : { label: 'Deactivate', icon: <UserX className="h-4 w-4" />, onSelect: () => setDialog('status'), danger: true },
              ]}
            />
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3" icon={<Activity className="h-4 w-4" />} title="Recent activity" subtitle="The last 30 things they did">
          {activity.length === 0
            ? <Empty text="Nothing yet." />
            : <ol className="relative flex flex-col">{activity.map((a) => <ActivityRow key={a.id} a={a} />)}</ol>}
        </Card>

        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card icon={<ShieldCheck className="h-4 w-4" />} title="Signed-in devices" subtitle={`${sessions.length} device${sessions.length === 1 ? '' : 's'}`}>
            {sessions.length === 0 ? <Empty text="Not signed in anywhere." /> : (
              <ul className="flex flex-col gap-2">
                {sessions.map((s) => {
                  const Icon = isPhone(s.device) ? Smartphone : Monitor
                  const used = timeAgo(s.last_used_at ?? s.created_at)
                  return (
                    <li key={s.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 dark:border-gray-800">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300"><Icon className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100" title={s.device}>{deviceName(s.device)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{used ? `Last used ${used}` : 'Not used yet'}</p>
                      </div>
                      {!self && (
                        <Button size="sm" variant="ghost" loading={busy === s.id} aria-label={`Sign out ${deviceName(s.device)}`}
                          onClick={() => void run(s.id, () => usersApi.signOutDevice(user.id, s.id))}>
                          Sign out
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            {self && <p className="mt-3 text-xs text-gray-500">Your own devices are on your <Link to="/profile" className="text-indigo-600 hover:underline dark:text-indigo-400">profile</Link>.</p>}
          </Card>

          <Card icon={<ShieldAlert className="h-4 w-4" />} title="Failed sign-ins" subtitle="Wrong passwords tried on this email">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className={['text-2xl font-bold tabular-nums', failed.last_30_days > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'].join(' ')}>{failed.last_30_days}</span>
              <span className="ml-1.5 text-gray-500">in the last 30 days</span>
            </p>
            {failed.recent.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {failed.recent.map((f) => (
                  <li key={f.created_at + f.type} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-gray-600 dark:text-gray-300">{f.type === 'locked_out' ? 'Locked out (too many tries)' : 'Wrong password'}{f.ip_address ? ` · ${f.ip_address}` : ''}</span>
                    <span className="shrink-0 text-gray-400">{when(f.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {dialog === 'edit' && <UserModal user={user} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); void refetch() }} />}
      {dialog === 'password' && <SetPasswordModal user={user} onClose={() => { setDialog(null); void refetch() }} />}
      <ConfirmDialog
        open={dialog === 'status'}
        onClose={() => setDialog(null)}
        onConfirm={toggleStatus}
        loading={busy === 'status'}
        title={user.deactivated_at ? `Turn ${user.name}'s account back on?` : `Deactivate ${user.name}?`}
        message={user.deactivated_at
          ? 'They can sign in again with their current password.'
          : 'They\'re signed out everywhere and can\'t sign in. Their expenses and history are kept, and you can turn the account back on any time.'}
        confirmLabel={user.deactivated_at ? 'Reactivate' : 'Deactivate'}
      />
      <ConfirmDialog
        open={dialog === 'everywhere'}
        onClose={() => setDialog(null)}
        onConfirm={() => run('everywhere', () => usersApi.signOutEverywhere(user.id))}
        loading={busy === 'everywhere'}
        title={`Sign ${user.name} out everywhere?`}
        message="Every device they're signed in on is signed out. Their account stays on, and they can sign in again."
        confirmLabel="Sign out everywhere"
      />
    </div>
  )
}

function Card({ icon, title, subtitle, className = '', children }: { icon: ReactNode; title: string; subtitle: string; className?: string; children: ReactNode }) {
  return (
    <section className={['rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900', className].join(' ')}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{icon}</span>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function ActivityRow({ a }: { a: UserActivity }) {
  const style = MODULE_STYLES[a.module as LogEntry['module']]
  const Icon = style?.Icon ?? Activity
  return (
    <li className="flex gap-3 border-b border-gray-50 py-2.5 last:border-0 dark:border-gray-800/60">
      <span className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', style?.tile ?? 'bg-gray-100 text-gray-500 dark:bg-gray-800'].join(' ')}><Icon className="h-3.5 w-3.5" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-gray-900 dark:text-gray-100">{a.description || TYPE_LABEL[a.type] || a.type}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {TYPE_LABEL[a.type] ?? a.type}{style ? ` · ${style.label}` : ''}{a.user_agent ? ` · ${deviceName(a.user_agent)}` : ''}
        </p>
      </div>
      <span className="shrink-0 text-xs text-gray-400" title={when(a.created_at)}>{timeAgo(a.created_at)}</span>
    </li>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-800/50">{text}</p>
}

function DetailSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl animate-pulse flex-col gap-5" aria-busy="true" aria-label="Loading user">
      <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-800" />
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="h-80 rounded-2xl bg-gray-200 lg:col-span-3 dark:bg-gray-800" />
        <div className="h-80 rounded-2xl bg-gray-200 lg:col-span-2 dark:bg-gray-800" />
      </div>
    </div>
  )
}

