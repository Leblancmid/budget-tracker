import { useId, useState } from 'react'
import { Check, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { generatePassword, passwordChecks, passwordStrength, STRENGTH_LABEL } from '@/lib/users'

const BAR = ['bg-gray-200 dark:bg-gray-700', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500']

/** A new password with show/hide, a strength bar and the rules ticked off as you type. */
export function PasswordField({ label, value, onChange, error, autoFocus, allowGenerate = false }: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  autoFocus?: boolean
  /** Offer a random password (when an admin sets one for someone) */
  allowGenerate?: boolean
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const strength = passwordStrength(value)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {allowGenerate && (
          <button
            type="button"
            onClick={() => { onChange(generatePassword()); setVisible(true) }}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <RefreshCw className="h-3 w-3" /> Generate
          </button>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          autoFocus={autoFocus}
          autoComplete="new-password"
          onChange={(e) => onChange(e.target.value)}
          className={[
            'block w-full rounded-lg border bg-white py-2 pl-3 pr-10 font-mono text-sm text-gray-900 transition-colors',
            'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100',
            error ? 'border-red-400 dark:border-red-500' : 'border-gray-300 hover:border-gray-400 dark:border-gray-600',
          ].join(' ')}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Strength: four segments that fill and change colour */}
      <div className="flex items-center gap-2" aria-live="polite">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={['h-1 flex-1 rounded-full transition-colors', n <= strength ? BAR[strength] : BAR[0]].join(' ')} />
          ))}
        </div>
        <span className="w-12 text-right text-[11px] font-medium text-gray-500 dark:text-gray-400">{STRENGTH_LABEL[strength]}</span>
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {passwordChecks(value).map((c) => (
          <li key={c.label} className={['inline-flex items-center gap-1 text-[11px] transition-colors', c.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'].join(' ')}>
            <Check className={['h-3 w-3', c.ok ? 'opacity-100' : 'opacity-40'].join(' ')} />
            {c.label}
          </li>
        ))}
      </ul>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
