import { useMemo } from 'react'
import { Timer } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { rucoyAccountsApi } from '@/api/rucoy'
import { useAsyncData } from '@/hooks/useAsyncData'
import { daysListed } from '@/utils/listing'
import type { RucoyAccount } from '@/types'

const NO_ACCOUNTS: RucoyAccount[] = []

/** How long sold accounts took to sell on average (listed → sold). Hidden until something has sold. */
export function DaysToSellCard() {
  const sold = useAsyncData(rucoyAccountsApi.getArchived, NO_ACCOUNTS)

  const avg = useMemo(() => {
    const days = sold.data
      .map((a) => (a.archived_at ? daysListed(a.listed_at, Date.parse(a.archived_at)) : null))
      .filter((d): d is number => d != null)
    return days.length ? { days: days.reduce((s, d) => s + d, 0) / days.length, count: days.length } : null
  }, [sold.data])

  if (!avg) return null

  return (
    <Card className="flex items-center gap-3 p-4">
      <Timer className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Sold accounts took <span className="font-semibold text-gray-900 dark:text-gray-100">{avg.days.toFixed(1)} days</span> on
        average to sell ({avg.count} sold).
        {avg.days < 2 && ' They sell fast — you may have room to raise prices.'}
      </p>
    </Card>
  )
}
