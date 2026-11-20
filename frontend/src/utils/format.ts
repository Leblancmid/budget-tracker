export function handleAmountInput(raw: string, onValid: (stripped: string) => void, allowDecimal = true): void {
  const stripped = raw.replace(/,/g, '')
  const pattern = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/
  if (stripped === '' || pattern.test(stripped)) onValid(stripped)
}

export function formatWithCommas(raw: string, allowDecimal = true): string {
  if (!raw) return ''
  const [integer, decimal] = raw.split('.')
  const intFormatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (!allowDecimal || decimal === undefined) return intFormatted
  return `${intFormatted}.${decimal}`
}

export const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value))

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date))

/** "Oct 15" from a Y-m-d date, read as a calendar date (no timezone shift). */
export function formatShortDate(ymd: string): string {
  const [year, month, day] = ymd.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function paginateLocally<T>(items: T[], page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const safePage   = Math.min(Math.max(1, page), totalPages)
  const paginated  = items.slice((safePage - 1) * perPage, safePage * perPage)
  return {
    paginated,
    safePage,
    meta: {
      current_page: safePage,
      last_page:    totalPages,
      from:         items.length ? (safePage - 1) * perPage + 1 : null,
      to:           Math.min(safePage * perPage, items.length) || null,
      total:        items.length,
      per_page:     perPage,
    },
  }
}

/** Today's date (Y-m-d) in the Philippines, whatever the computer's clock zone. */
export function todayManila(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export const formatTime = (iso: string | null): string => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

/** Weekday and time in Manila, e.g. "Fri 10:00 PM" (schedules that run on Manila time) */
export const manilaWeekdayTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Manila', weekday: 'short', hour: 'numeric', minute: '2-digit' })

export function formatDateLong(iso: string | null): string {
  if (!iso) return '—'
  const [year, month, day] = iso.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Compact ₱ figure for tight spaces (the sidebar, phone tiles): ₱444.9k, ₱1.20M. */
export function compactPhp(n: number): string {
  const a = Math.abs(n)
  const s = a >= 1e6 ? `${(a / 1e6).toFixed(2)}M` : a >= 1e3 ? `${(a / 1e3).toFixed(1)}k` : a.toFixed(0)
  return `${n < 0 ? '−' : ''}₱${s}`
}
