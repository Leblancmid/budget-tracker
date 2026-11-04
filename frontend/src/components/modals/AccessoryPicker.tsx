import { Check } from 'lucide-react'
import { ACCESSORIES, type AccessoryKind } from '@/utils/accessories'

const GROUPS: { kind: AccessoryKind; label: string }[] = [
  { kind: 'decoration', label: 'Decoration' },
  { kind: 'buff', label: 'Buff' },
]

/** Tick the accessories an account comes with; they're drawn on its listing tile. */
export function AccessoryPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const selected = new Set(value)
  const toggle = (key: string) =>
    onChange(selected.has(key) ? value.filter((k) => k !== key) : [...value, key])

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Accessories</p>
        {value.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {GROUPS.map(({ kind, label }) => (
          <div key={kind} className="flex flex-wrap items-center gap-1.5">
            <span className="w-20 shrink-0 text-xs text-gray-500 dark:text-gray-400">{label}</span>
            {ACCESSORIES.filter((a) => a.kind === kind).map((a) => {
              const on = selected.has(a.key)
              return (
                <button
                  key={a.key}
                  type="button"
                  aria-pressed={on}
                  title={a.label}
                  aria-label={a.label}
                  onClick={() => toggle(a.key)}
                  className={[
                    'relative h-11 w-11 overflow-hidden rounded-lg border-2 transition',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                    on ? 'border-emerald-500 shadow-sm' : 'border-transparent opacity-45 grayscale hover:opacity-80 hover:grayscale-0',
                  ].join(' ')}
                >
                  <img src={a.src} alt="" className="h-full w-full object-cover" style={{ imageRendering: 'pixelated' }} />
                  {on && (
                    <span className="absolute right-0 top-0 rounded-bl bg-emerald-500 p-px text-white">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
