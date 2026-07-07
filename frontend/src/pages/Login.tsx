import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Email and password are required.'); return }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError((err as { message: string }).message ?? 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mikey's Tracker</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Sign in to your account</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-6 shadow-sm">

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
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
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

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

          </form>
        </div>

      </div>
    </div>
  )
}