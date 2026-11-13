import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onSelect: () => void
  danger?: boolean
  hidden?: boolean
}

/**
 * A small dropdown: the trigger opens it, Escape or a click outside closes it, and the arrow keys
 * move between items. Used for ⋯ (rare actions) and the account menu.
 */
export function Menu({ trigger, label, items, header, align = 'right' }: {
  /** What the button shows */
  trigger: ReactNode
  /** For screen readers and the tooltip */
  label: string
  items: MenuItem[]
  /** Shown above the items (e.g. who's signed in) */
  header?: ReactNode
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const shown = items.filter((i) => !i.hidden)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); root.current?.querySelector<HTMLButtonElement>('[data-menu-trigger]')?.focus() }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
        const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
        const next = e.key === 'ArrowDown' ? (at + 1) % buttons.length : (at - 1 + buttons.length) % buttons.length
        buttons[next]?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        data-menu-trigger
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={[
            'absolute z-40 mt-2 min-w-52 origin-top overflow-hidden rounded-xl border border-gray-200 bg-white/95 p-1 shadow-lg shadow-gray-900/10 backdrop-blur',
            'dark:border-gray-700 dark:bg-gray-900/95 dark:shadow-black/40',
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
        >
          {header && <div className="border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">{header}</div>}
          <div className={header ? 'pt-1' : ''}>
            {shown.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); item.onSelect() }}
                className={[
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none',
                  item.danger
                    ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20'
                    : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800',
                ].join(' ')}
              >
                {item.icon && <span className="flex h-4 w-4 items-center justify-center opacity-70">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
