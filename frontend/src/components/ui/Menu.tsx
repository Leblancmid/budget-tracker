import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onSelect: () => void
  danger?: boolean
  hidden?: boolean
}

const GAP = 8
const EDGE = 8

/**
 * A small dropdown: the trigger opens it, Escape or a click outside closes it, and the arrow keys
 * move between items. Used for ⋯ (rare actions) and the account menu.
 *
 * The list is drawn on top of the page (in a portal), so a card that clips its contents (rounded
 * corners with overflow hidden) can't cut it off. It opens upward when there's no room below, and
 * closes when the page scrolls or resizes, since it no longer lines up with its button.
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
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' })
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const shown = items.filter((i) => !i.hidden)

  const close = (refocus = false) => {
    setOpen(false)
    setStyle({ visibility: 'hidden' })
    if (refocus) button.current?.focus()
  }

  // Place the list next to its button once it's drawn (its height decides up or down)
  useLayoutEffect(() => {
    if (!open || !button.current || !list.current) return
    const b = button.current.getBoundingClientRect()
    const height = list.current.offsetHeight
    const width = list.current.offsetWidth
    const below = window.innerHeight - b.bottom
    const up = below < height + GAP + EDGE && b.top > below
    // Line up with the button's right (or left) edge, unless that would run off the screen
    const fitsRight = b.right - width >= EDGE
    const fitsLeft = b.left + width <= window.innerWidth - EDGE
    const horizontal = (align === 'right' ? fitsRight || !fitsLeft : !fitsLeft && fitsRight)
      ? { right: Math.max(EDGE, window.innerWidth - b.right) }
      : { left: Math.max(EDGE, b.left) }
    setStyle(up ? { ...horizontal, bottom: window.innerHeight - b.top + GAP } : { ...horizontal, top: b.bottom + GAP })
  }, [open, align])

  useEffect(() => {
    if (!open) return
    const inside = (t: EventTarget | null) => button.current?.contains(t as Node) || list.current?.contains(t as Node)
    const onDown = (e: MouseEvent) => { if (!inside(e.target)) close() }
    // Close when the page really moved (the list would no longer sit by its button), not on the
    // tiny scroll a phone makes while you tap
    const startTop = button.current?.getBoundingClientRect().top ?? 0
    const onMove = (e: Event) => {
      if (inside(e.target)) return
      const top = button.current?.getBoundingClientRect().top ?? startTop
      if (e.type === 'resize' || Math.abs(top - startTop) > 12) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true)
      if (e.key === 'Tab') close()
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const buttons = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
        const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
        const next = e.key === 'ArrowDown' ? (at + 1) % buttons.length : (at - 1 + buttons.length) % buttons.length
        buttons[next]?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open])

  return (
    // Clicks inside (including the list, which React still treats as a child) don't reach the row behind
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex min-h-10 min-w-10 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:min-h-0 sm:min-w-0"
      >
        {trigger}
      </button>
      {open && createPortal(
        <div
          ref={list}
          role="menu"
          aria-label={label}
          style={style}
          className={[
            'fixed z-[60] min-w-52 overflow-hidden rounded-xl border border-gray-200 bg-white/95 p-1 shadow-lg shadow-gray-900/10 backdrop-blur',
            'dark:border-gray-700 dark:bg-gray-900/95 dark:shadow-black/40',
          ].join(' ')}
        >
          {header && <div className="border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">{header}</div>}
          <div className={header ? 'pt-1' : ''}>
            {shown.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => { close(); item.onSelect() }}
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
        </div>,
        document.body,
      )}
    </div>
  )
}
