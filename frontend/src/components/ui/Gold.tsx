import { formatGoldShort } from '@/utils/goldShort'

/**
 * A gold amount: the short trade-chat form on phones (14.9KKK G), the exact number from the
 * small breakpoint up (14,905,000,000 G). The exact number is always in the tooltip.
 */
export function Gold({ value, unit = true }: { value: number; unit?: boolean }) {
  const sign = value < 0 ? '−' : ''
  const exact = `${sign}${Math.round(Math.abs(value)).toLocaleString()}`
  const short = `${sign}${formatGoldShort(Math.abs(value))}`
  const g = unit ? ' G' : ''
  return (
    <span title={`${exact} G`}>
      <span className="sm:hidden">{short}{g}</span>
      <span className="hidden sm:inline">{exact}{g}</span>
    </span>
  )
}
