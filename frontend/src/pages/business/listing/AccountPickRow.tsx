import { ImageOff } from 'lucide-react'
import type { RucoyAccount } from '@/types'
import { daysListed, formatGoldShort, listingTitle, sameOriginPath } from '@/utils/listing'

/** One account in the Listing Kit: include it, show/hide its price, see how long it's been listed. */
export function AccountPickRow({ a, included, isNew, nowMs, savingPrice, onToggleInclude, onToggleShowPrice }: {
  a: RucoyAccount
  included: boolean
  isNew: boolean
  nowMs: number
  savingPrice: boolean
  onToggleInclude: () => void
  onToggleShowPrice: () => void
}) {
  const days = daysListed(a.listed_at, nowMs)
  const hasShot = !!a.screenshot

  return (
    <li className={['flex items-center gap-3 px-4 py-3', hasShot ? '' : 'opacity-70'].join(' ')}>
      <input
        type="checkbox"
        checked={included && hasShot}
        disabled={!hasShot}
        onChange={onToggleInclude}
        aria-label={`Include ${listingTitle(a)} in the image`}
        className="h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
      />

      {hasShot ? (
        <img src={sameOriginPath(a.screenshot!)} alt="" className="h-10 w-16 shrink-0 rounded-md object-cover border border-gray-200 dark:border-gray-700" />
      ) : (
        <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-gray-300 dark:border-gray-600">
          <ImageOff size={14} className="text-gray-400" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">
          <span className="truncate">{listingTitle(a)}</span>
          {isNew && <span className="rounded bg-red-600 px-1.5 py-px text-[10px] font-bold text-white">NEW</span>}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {hasShot
            ? <>{a.price ? formatGoldShort(a.price) : 'No price'}{days != null && <> · listed {days === 0 ? 'today' : `${days}d ago`}</>}</>
            : 'Add a screenshot in Sales → Edit to include it'}
        </p>
      </div>

      <label className="flex shrink-0 items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={a.show_price}
          disabled={savingPrice || !a.price}
          onChange={onToggleShowPrice}
          className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
        />
        Show price
      </label>
    </li>
  )
}
