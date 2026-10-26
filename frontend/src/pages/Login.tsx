import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '@/context/auth'
import { rememberedEmail } from '@/lib/authSession'
import { errorMessage, flattenApiErrors } from '@/utils/api'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate  = useNavigate()

  const [email,    setEmail]    = useState(rememberedEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => rememberedEmail() !== '')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Already signed in (e.g. a remembered login) — skip the form
  if (isAuthenticated) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Email and password are required.'); return }
    setLoading(true)
    setError('')
    try {
      await login(email, password, remember)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      // Field messages (e.g. wrong credentials) read better than the generic "Validation failed."
      const fields = flattenApiErrors(err)
      setError(fields?.email ?? fields?.password ?? errorMessage(err, 'Login failed.'))
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <span className="relative flex h-16 w-16">
            <span className="absolute inset-0 rounded-2xl bg-violet-500/40 blur-xl" />
            <img src="/logo.svg" alt="" className="relative h-16 w-16 rounded-2xl shadow-lg" />
          </span>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Sign in to your account</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-6 shadow-sm">

          {error && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                autoFocus={!email}
                maxLength={255}
                className={[
                  'block w-full rounded-xl border bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100',
                  'placeholder:text-gray-400 dark:placeholder:text-gray-600',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-colors',
                  error ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700',
                ].join(' ')}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  autoFocus={!!email}
                  maxLength={255}
                  className={[
                    'block w-full rounded-xl border bg-white dark:bg-gray-800 px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400 dark:placeholder:text-gray-600',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-colors',
                    error ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex cursor-pointer items-start gap-2.5 select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
              />
              <span>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">Remember me</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500">
                  {remember ? 'Stay signed in on this device for 30 days.' : 'You’ll be signed out when you close the browser.'}
                </span>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={[
                'flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors mt-1',
                'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
                'focus:outline-none focus:ring-2 focus:ring-indigo-400/40',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            {!remember && (
              <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">On a shared computer, leave “Remember me” off.</p>
            )}
          </form>
        </div>

      </div>
    </div>
  )
}
