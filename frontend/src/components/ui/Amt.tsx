import { useAmountVisibility } from '@/context/amountVisibility'

/** An amount that's masked while amounts are hidden. */
export function Amt({ value }: { value: string | number | null | undefined }) {
  const { hidden } = useAmountVisibility()
  if (hidden) return <span className="select-none tracking-widest text-current opacity-40">••••••</span>
  return <>{value}</>
}
