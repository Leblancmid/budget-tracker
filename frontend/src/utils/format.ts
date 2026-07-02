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

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const ICON_OPTIONS = [
  'tag', 'shopping-cart', 'home', 'car', 'utensils', 'heart-pulse',
  'graduation-cap', 'plane', 'tv', 'dumbbell', 'shirt', 'piggy-bank',
  'briefcase', 'gift', 'music', 'coffee',
]

export const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#06b6d4',
]
