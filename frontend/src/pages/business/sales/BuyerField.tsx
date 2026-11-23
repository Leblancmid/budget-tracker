import { useEffect, useId, useState } from 'react'
import { UserRound } from 'lucide-react'
import { businessTransactionsApi } from '@/api/business'
import { Input } from '@/components/ui/Input'
import { buyerKey, didYouMean } from '@/utils/buyerNames'

/** Recent buyers shown as one-tap chips */
const CHIPS = 6

/**
 * "Sold to": who bought it, optional. Recent buyers are one tap away, past ones are suggested as you
 * type, and a name close to a past buyer's ("dark knight" for DarkKnight) asks "Did you mean…?", so
 * one buyer doesn't become two on the Buyers page. Private: it never goes to the website.
 */
export function BuyerField({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const listId = useId()
  const [buyers, setBuyers] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    businessTransactionsApi.buyers().then((b) => { if (!cancelled) setBuyers(b) }).catch(() => { /* no suggestions offline */ })
    return () => { cancelled = true }
  }, [])

  const suggestion = value.trim() ? didYouMean(value, buyers) : null
  const chips = buyers.slice(0, CHIPS).filter((b) => buyerKey(b) !== buyerKey(value))

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
        hint={value.trim()
          ? 'Only you see this; it never goes to the website.'
          : 'Worth filling in: it builds your Buyers list and who to message first. Only you see it.'}
      />
      <datalist id={listId}>
        {buyers.map((b) => <option key={b} value={b} />)}
      </datalist>

      {suggestion && (
        <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
          Did you mean{' '}
          <button type="button" onClick={() => onChange(suggestion)} className="font-semibold underline decoration-dotted underline-offset-2">
            {suggestion}
          </button>
          ? Same buyer, so their purchases stay together.
        </p>
      )}

      {chips.length > 0 && !suggestion && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">Recent:</span>
          {chips.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => onChange(b)}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
            >
              {b}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
