import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CalendarDays, KeyRound, LogOut, Monitor, ShieldCheck, Smartphone, Trash2, UserRound } from 'lucide-react'
import api from '@/api/axios'
import { profileApi, type AccountUser, type DeviceSession } from '@/api/users'
import { useAuth } from '@/context/auth'
import { useProfile } from '@/hooks/useUsers'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Menu } from '@/components/ui/Menu'
import { AvatarCropper } from '@/components/users/AvatarCropper'
import { PasswordField } from '@/components/users/PasswordField'
import { PhoneAlertsCard } from '@/components/users/PhoneAlertsCard'
import { RoleBadge, StatusLine } from '@/components/users/UserBits'
import { deviceName, isPhone, passwordOk, timeAgo } from '@/lib/users'
import { toast } from '@/lib/toast'
import { errorMessage, flattenApiErrors } from '@/utils/api'

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PICK_BYTES = 15 * 1024 * 1024

/** Your own account: picture, name and email, password, and the devices you're signed in on. */
export default function Profile() {
  const { data, setData, loading, error, refetch } = useProfile()
  const { updateUser } = useAuth()
  const user = data.user

  const saved = (next: AccountUser) => {
    setData((d) => ({ ...d, user: next }))
    updateUser(next)
  }

  if (loading && !user) return <ProfileSkeleton />
  if (error && !user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Couldn't load your profile</p>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <Button className="mt-4" variant="secondary" onClick={() => void refetch()}>Try again</Button>
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <ProfileHero user={user} onSaved={saved} />
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="flex flex-col gap-5 lg:col-span-3">
          <PersonalInfo key={`${user.name}|${user.email}`} user={user} onSaved={saved} />
          <ChangePassword onChanged={() => void refetch()} />
        </div>
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Devices sessions={data.sessions} onChanged={() => void refetch()} />
          <PhoneAlertsCard />
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5 flex items-start gap-3">
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

/** The banner: big picture (click to change), name, email, role and how long you've been here. */
function ProfileHero({ user, onSaved }: { user: AccountUser; onSaved: (u: AccountUser) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const pick = (f: File | undefined) => {
    if (!f) return
    if (!AVATAR_TYPES.includes(f.type)) return toast.error('Use a JPG, PNG or WebP picture.')
    if (f.size > MAX_PICK_BYTES) return toast.error('That picture is too large (15 MB max).')
    setFile(f)
  }

  const upload = async (blob: Blob) => {
    setSaving(true)
    try {
      onSaved(await profileApi.uploadAvatar(blob))
      setFile(null)
      toast.success('Profile picture updated')
    } catch (e) {
      toast.error(errorMessage(e, 'Couldn\'t save the picture.'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setSaving(true)
    try {
      onSaved(await profileApi.removeAvatar())
      toast.success('Profile picture removed')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
      setConfirmRemove(false)
    }
  }

  const since = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'long', year: 'numeric' })
    : null

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* Mesh-gradient banner */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 sm:h-40">
        <div className="absolute -left-10 -top-16 h-56 w-56 rounded-full bg-sky-400/40 blur-3xl" />
        <div className="absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-pink-400/40 blur-3xl" />
        <div className="absolute right-1/3 top-4 h-32 w-32 rounded-full bg-amber-300/30 blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.18)_1px,transparent_0)] [background-size:18px_18px]" />
      </div>

      <div className="flex flex-col gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:gap-5 sm:px-8">
        <div className="relative -mt-14 w-fit sm:-mt-16">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="group relative block rounded-full ring-4 ring-white focus:outline-none focus-visible:ring-indigo-500 dark:ring-gray-900"
            aria-label="Change profile picture"
            title="Change profile picture"
          >
            <Avatar user={user} size="xl" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </span>
          </button>
          <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md ring-2 ring-white dark:ring-gray-900" aria-hidden="true">
            <Camera className="h-4 w-4" />
          </span>
          <input
            ref={input}
            type="file"
            accept={AVATAR_TYPES.join(',')}
            className="hidden"
            onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }}
          />
        </div>

        <div className="min-w-0 flex-1 sm:pb-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{user.name}</h1>
            <RoleBadge role={user.role} />
          </div>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            {since && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Member since {since}</span>}
            <StatusLine user={user} />
          </div>
        </div>

        <div className="flex gap-2 sm:pb-1">
          <Button variant="secondary" size="sm" icon={<Camera className="h-4 w-4" />} onClick={() => input.current?.click()}>
            {user.avatar_url ? 'Change picture' : 'Add picture'}
          </Button>
          {user.avatar_url && (
            <Menu
              label="More picture options"
              trigger={<span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800">⋯</span>}
              items={[{ label: 'Remove picture', icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => setConfirmRemove(true) }]}
            />
          )}
        </div>
      </div>

      {file && <AvatarCropper key={`${file.name}-${file.lastModified}`} file={file} saving={saving} onCancel={() => setFile(null)} onSave={(b) => void upload(b)} />}
      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={remove}
        loading={saving}
        title="Remove your profile picture?"
        message="Your initials will show instead. You can add a new picture any time."
        confirmLabel="Remove"
      />
    </section>
  )
}

/** Name and email. Only what changed is sent. */
function PersonalInfo({ user, onSaved }: { user: AccountUser; onSaved: (u: AccountUser) => void }) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const changes = {
    ...(name.trim() !== user.name ? { name: name.trim() } : {}),
    ...(email.trim().toLowerCase() !== user.email ? { email: email.trim().toLowerCase() } : {}),
  }
  const dirty = Object.keys(changes).length > 0

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email.'
    return e
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const local = validate()
    setErrors(local)
    if (Object.keys(local).length || !dirty) return
    setSaving(true)
    try {
      onSaved(await profileApi.update(changes))
      toast.success('Profile saved')
    } catch (e) {
      const fields = flattenApiErrors(e)
      if (fields) setErrors(fields)
      else toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section icon={<UserRound className="h-4 w-4" />} title="Personal info" subtitle="Your name shows in the logs next to everything you do.">
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" maxLength={100} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" hint="You sign in with this." />
        <div className="flex items-center justify-end gap-2 sm:col-span-2">
          {dirty && <Button type="button" variant="ghost" onClick={() => { setName(user.name); setEmail(user.email); setErrors({}) }}>Discard</Button>}
          <Button type="submit" loading={saving} disabled={!dirty}>Save changes</Button>
        </div>
      </form>
    </Section>
  )
}

function ChangePassword({ onChanged }: { onChanged: () => void }) {
  const empty = { current_password: '', password: '', password_confirmation: '' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (!form.current_password) e.current_password = 'Enter your current password.'
    if (!passwordOk(form.password)) e.password = 'The new password doesn\'t meet the rules yet.'
    if (form.password !== form.password_confirmation) e.password_confirmation = 'The passwords don\'t match.'
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      toast.success(await profileApi.changePassword(form))
      setForm(empty)
      onChanged()
    } catch (err) {
      const fields = flattenApiErrors(err)
      if (fields) setErrors(fields)
      else toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section icon={<KeyRound className="h-4 w-4" />} title="Password" subtitle="Changing it signs out your other devices.">
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Input label="Current password" type="password" value={form.current_password} onChange={(e) => set('current_password')(e.target.value)} error={errors.current_password} autoComplete="current-password" />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField label="New password" value={form.password} onChange={set('password')} error={errors.password} />
          <Input
            label="Confirm new password"
            type="password"
            value={form.password_confirmation}
            onChange={(e) => set('password_confirmation')(e.target.value)}
            error={errors.password_confirmation}
            autoComplete="new-password"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={!form.current_password || !form.password}>Update password</Button>
        </div>
      </form>
    </Section>
  )
}

/** Where you're signed in: this device first, others with a button to sign them out. */
function Devices({ sessions, onChanged }: { sessions: DeviceSession[]; onChanged: () => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [busy, setBusy] = useState<number | 'all' | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)
  const sorted = [...sessions].sort((a, b) => Number(b.current) - Number(a.current))

  const signOut = async (s: DeviceSession) => {
    setBusy(s.id)
    try {
      toast.success(await profileApi.signOutDevice(s.id))
      onChanged()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const signOutEverywhere = async () => {
    setBusy('all')
    try {
      await api.post('/auth/logout-all')
    } catch { /* signed out here either way */ }
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <Section icon={<ShieldCheck className="h-4 w-4" />} title="Signed-in devices" subtitle={`${sessions.length} device${sessions.length === 1 ? '' : 's'} can use your account.`}>
      {sorted.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500 dark:bg-gray-800/50">No devices found.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((s) => {
            const Icon = isPhone(s.device) ? Smartphone : Monitor
            const used = timeAgo(s.last_used_at ?? s.created_at)
            return (
              <li key={s.id} className={['flex items-center gap-3 rounded-xl border px-3 py-2.5', s.current ? 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-800/60 dark:bg-indigo-900/15' : 'border-gray-100 dark:border-gray-800'].join(' ')}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-300"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100" title={s.device}>{deviceName(s.device)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.current ? 'This device' : used ? `Last used ${used}` : 'Not used yet'}</p>
                </div>
                {s.current ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Active now</span>
                ) : (
                  <Button size="sm" variant="ghost" loading={busy === s.id} onClick={() => void signOut(s)} aria-label={`Sign out ${deviceName(s.device)}`}>Sign out</Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <Button className="mt-4 w-full" variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={() => setConfirmAll(true)}>
        Sign out everywhere
      </Button>
      <ConfirmDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        onConfirm={signOutEverywhere}
        loading={busy === 'all'}
        title="Sign out of every device?"
        message="Every device signed in to your account, including this one, will need to sign in again."
        confirmLabel="Sign out everywhere"
      />
    </Section>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto flex max-w-5xl animate-pulse flex-col gap-5" aria-busy="true" aria-label="Loading profile">
      <div className="h-64 rounded-3xl bg-gray-200 dark:bg-gray-800" />
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="h-56 rounded-2xl bg-gray-200 lg:col-span-3 dark:bg-gray-800" />
        <div className="h-56 rounded-2xl bg-gray-200 lg:col-span-2 dark:bg-gray-800" />
      </div>
    </div>
  )
}
