import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, LogOut } from 'lucide-react'
import { profileApi } from '@/api/users'
import { useAuth } from '@/context/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordField } from '@/components/users/PasswordField'
import { passwordOk } from '@/lib/users'
import { toast } from '@/lib/toast'
import { errorMessage, flattenApiErrors } from '@/utils/api'

/**
 * Shown instead of the app to someone signed in with a password an admin chose (a new account, or
 * one an admin reset): they pick their own before anything else (the server enforces the same).
 */
export default function ChoosePassword() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const empty = { current_password: '', password: '', password_confirmation: '' }
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (!form.current_password) e.current_password = 'Enter the password you signed in with.'
    if (!passwordOk(form.password)) e.password = 'The new password doesn\'t meet the rules yet.'
    if (form.password !== form.password_confirmation) e.password_confirmation = 'The passwords don\'t match.'
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      await profileApi.changePassword(form)
      const { user: fresh } = await profileApi.get()
      updateUser(fresh)
      toast.success('Password set. Welcome!')
      navigate('/', { replace: true })
    } catch (err) {
      const fields = flattenApiErrors(err)
      if (fields) setErrors(fields)
      else toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4 py-10 safe-top safe-bottom dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <KeyRound className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Choose your own password</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {user?.name ? `Hi ${user.name.split(' ')[0]}! ` : ''}You signed in with a password someone else set. Replace it with one only you know to continue.
            </p>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700/60 dark:bg-gray-900">
          <Input label="Password you signed in with" type="password" value={form.current_password} onChange={(e) => set('current_password')(e.target.value)} error={errors.current_password} autoComplete="current-password" autoFocus />
          <PasswordField label="New password" value={form.password} onChange={set('password')} error={errors.password} />
          <Input label="Confirm new password" type="password" value={form.password_confirmation} onChange={(e) => set('password_confirmation')(e.target.value)} error={errors.password_confirmation} autoComplete="new-password" />
          <Button type="submit" loading={saving} className="mt-1 w-full">Set password and continue</Button>
        </form>

        <button type="button" onClick={() => void signOut()} className="mx-auto mt-5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  )
}
