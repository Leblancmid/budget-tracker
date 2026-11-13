import { useEffect, useId, useState } from 'react'
import { UserRound } from 'lucide-react'
import { businessTransactionsApi } from '@/api/business'
import { Input } from '@/components/ui/Input'

/**
 * "Sold to": who bought it, optional. Suggests people you sold to before (newest first) as you
 * type. Private: it stays in the app and never goes to the website.
 */
export function BuyerField({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const listId = useId()
  const [buyers, setBuyers] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    businessTransactionsApi.buyers().then((b) => { if (!cancelled) setBuyers(b) }).catch(() => { /* no suggestions offline */ })
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <Input
        label="Sold to (optional)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buyer's name or Discord"
        list={listId}
        maxLength={100}
        autoComplete="off"
        autoFocus={autoFocus}
        leftIcon={<UserRound className="h-4 w-4" />}
        hint="Only you see this; it never goes to the website."
      />
      <datalist id={listId}>
        {buyers.map((b) => <option key={b} value={b} />)}
      </datalist>
    </div>
  )
}
