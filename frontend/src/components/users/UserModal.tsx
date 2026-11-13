import { useState, type FormEvent } from 'react'
import { Check, Copy } from 'lucide-react'
import { usersApi, type AccountUser, type UserInput } from '@/api/users'
import type { Module, UserRole } from '@/context/auth'
import { MODULES, modulesOf, PRESETS } from '@/lib/access'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { PasswordField } from './PasswordField'
import { StatusLine } from './UserBits'
import { generatePassword, passwordOk, roleLabel, ROLES } from '@/lib/users'
import { toast } from '@/lib/toast'
import { errorMessage, flattenApiErrors } from '@/utils/api'

/**
 * Add a user (with a first password to give them), or edit one's name, email, role and modules. Editing
 * sends only what changed. Your own role can't be changed here, so there's always an admin.
 */
export function UserModal({ user, onClose, onSaved }: {
  /** null: adding a new user */
  user: AccountUser | null
  onClose: () => void
  onSaved: (u: AccountUser, created: boolean) => void
}) {
  const adding = user === null
  const [form, setForm] = useState<UserInput>(() => ({
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'daily_only',
    modules: user ? modulesOf(user) : PRESETS.daily_only,
    password: adding ? generatePassword() : undefined,
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const set = <K extends keyof UserInput>(k: K, v: UserInput[K]) => setForm((f) => ({ ...f, [k]: v }))
  const ownRoleLocked = !!user?.is_self
  const picked = form.modules ?? []
  // A role starts from its preset; the switches below change it module by module
  const pickRole = (role: UserRole) => setForm((f) => ({ ...f, role, modules: PRESETS[role] }))
  // Turning a module off also turns off what needs it (Storefront needs Trading)
  const toggle = (m: Module) => set('modules', picked.includes(m)
    ? picked.filter((x) => x !== m && MODULES.find((d) => d.value === x)?.requires !== m)
    : [...picked, m])
  const sameModules = (a: Module[], b: Module[]) => a.length === b.length && a.every((m) => b.includes(m))
  const custom = form.role !== 'admin' && !sameModules(picked, PRESETS[form.role])

  const changes = (): Partial<UserInput> => {
    if (!user) return form.role === 'admin' ? { ...form, modules: undefined } : form
    const out: Partial<UserInput> = {}
    if (form.name.trim() !== user.name) out.name = form.name.trim()
    if (form.email.trim().toLowerCase() !== user.email) out.email = form.email.trim().toLowerCase()
    if (form.role !== user.role) out.role = form.role
    if (form.role !== 'admin' && !sameModules(picked, modulesOf(user))) out.modules = picked
    return out
  }

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Enter a name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email.'
    if (adding && !passwordOk(form.password ?? '')) e.password = 'The password doesn\'t meet the rules yet.'
    setErrors(e)
    if (Object.keys(e).length) return

    const data = changes()
    if (!adding && Object.keys(data).length === 0) return onClose()
    setSaving(true)
    try {
      const saved = adding ? await usersApi.create(data as UserInput) : await usersApi.update(user.id, data)
      toast.success(adding ? `${saved.name} added. Give them their password to sign in.` : 'User saved')
      onSaved(saved, adding)
    } catch (err) {
      const fields = flattenApiErrors(err)
      if (fields) setErrors(fields)
      else toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(form.password ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Couldn\'t copy. Select the password and copy it yourself.')
    }
  }

  return (
    <Modal open onClose={onClose} title={adding ? 'Add user' : 'Edit user'} size="5xl">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        {/* Landscape: who they are on the left, what they can open on the right (stacked on phones) */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col gap-4 lg:border-r lg:border-gray-100 lg:pr-6 dark:lg:border-gray-800">
            {user && (
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                <Avatar user={user} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}{user.is_self && <span className="ml-1.5 text-xs font-normal text-gray-500">(you)</span>}</p>
                  <StatusLine user={user} />
                </div>
              </div>
            )}

            <Input label="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} autoFocus={adding} maxLength={100} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} autoComplete="off" />

            {adding && (
              <div>
                <PasswordField label="First password" value={form.password ?? ''} onChange={(v) => set('password', v)} error={errors.password} allowGenerate />
                <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  <span>Give this password to them in person or by message. At their first sign-in they'll be asked to choose their own.</span>
                  <button type="button" onClick={() => void copyPassword()} className="inline-flex shrink-0 items-center gap-1 font-semibold hover:underline">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Role</legend>
              <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
                {ROLES.map((r) => {
                  const active = form.role === r.value
                  return (
                    <button
                      key={r.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={ownRoleLocked && !active}
                      onClick={() => pickRole(r.value)}
                      className={[
                        'relative rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40',
                        active
                          ? 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-900/20 dark:ring-indigo-400'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
                      ].join(' ')}
                    >
                      {active && <Check className="absolute right-3 top-3 h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.label}</p>
                      <p className="mt-0.5 pr-5 text-xs text-gray-500 dark:text-gray-400">{r.description}</p>
                    </button>
                  )
                })}
              </div>
              {ownRoleLocked && <p className="mt-2 text-xs text-gray-500">You can't change your own access, so there's always an admin.</p>}
              {errors.role && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.role}</p>}
            </fieldset>

            {/* Module by module: starts from the role, and can be changed for this person */}
            <fieldset>
              <div className="mb-2 flex items-center justify-between">
                <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">What they can open</legend>
                {custom && (
                  <button type="button" onClick={() => set('modules', PRESETS[form.role])} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    Reset to {roleLabel(form.role)}
                  </button>
                )}
              </div>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-700">
                {MODULES.map((m) => {
                  const isAdminRole = form.role === 'admin'
                  // Storefront needs Trading: greyed out (and off) without it
                  const needs = m.requires && !isAdminRole && !picked.includes(m.requires) ? MODULES.find((x) => x.value === m.requires) : null
                  const on = isAdminRole || (picked.includes(m.value) && !needs)
                  const locked = isAdminRole || !!m.locked || ownRoleLocked || !!needs
                  return (
                    <li key={m.value} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{m.description}{needs && <span className="text-amber-600 dark:text-amber-400"> · Needs {needs.label}</span>}</p>
                      </div>
                      <Switch on={on} disabled={locked} label={`${m.label} access`} onChange={() => toggle(m.value)} />
                    </li>
                  )
                })}
              </ul>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {form.role === 'admin'
                  ? 'Admins can open everything and manage users.'
                  : custom ? `Custom: different from what ${roleLabel(form.role)} gives. Managing users stays with admins.` : 'Managing users stays with admins.'}
              </p>
              {errors.modules && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.modules}</p>}
            </fieldset>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{adding ? 'Add user' : 'Save changes'}</Button>
        </div>
      </form>
    </Modal>
  )
}

/** An on/off switch. */
function Switch({ on, disabled, label, onChange }: { on: boolean; disabled?: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onChange}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-gray-900',
        on ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700',
      ].join(' ')}
    >
      <span className={['inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-5' : 'translate-x-0.5'].join(' ')} />
    </button>
  )
}

/** An admin sets a new password for someone; they're signed out everywhere. */
export function SetPasswordModal({ user, onClose }: { user: AccountUser; onClose: () => void }) {
  const [password, setPassword] = useState(() => generatePassword())
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!passwordOk(password)) return setError('The password doesn\'t meet the rules yet.')
    setSaving(true)
    try {
      toast.success(await usersApi.setPassword(user.id, password))
      onClose()
    } catch (err) {
      setError(flattenApiErrors(err)?.password ?? errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`New password for ${user.name}`} size="md">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <PasswordField label="New password" value={password} onChange={(v) => { setPassword(v); setError(undefined) }} error={error} allowGenerate autoFocus />
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800/50 dark:text-gray-400">
          {user.name} will be signed out on every device, signs in with this password, and is then asked to choose their own.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Set password</Button>
        </div>
      </form>
    </Modal>
  )
}
