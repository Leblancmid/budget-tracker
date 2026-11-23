import { ImageOff, Users } from 'lucide-react'
import type { RucoyAccount } from '@/types'
import { daysListed, listingPrice, listingTitle, sameOriginPath } from '@/utils/listing'

/**
 * One account in the Listing Kit: include it, show/hide its price, see how long it's been listed,
 * and (regulars > 0) who bought one like it before.
 */
export function AccountPickRow({ a, included, isNew, nowMs, savingPrice, regulars, onToggleInclude, onToggleShowPrice, onShowRegulars }: {
  a: RucoyAccount
  included: boolean
  isNew: boolean
  nowMs: number
  savingPrice: boolean
  /** Past buyers of a similar account */
  regulars: number
  onToggleInclude: () => void
  onToggleShowPrice: () => void
  onShowRegulars: () => void
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
            ? <>{listingPrice(a) ?? 'No price'}{days != null && <> · listed {days === 0 ? 'today' : `${days}d ago`}</>}</>
            : 'Add a screenshot in Sales → Edit to include it'}
        </p>
        {regulars > 0 && (
          <button
            type="button"
            onClick={onShowRegulars}
            title="People who bought one like this before: message them first"
            className="mt-1 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-1.5 py-px text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
          >
            <Users size={10} /> {regulars} regular{regulars === 1 ? '' : 's'}<span className="hidden sm:inline"> bought one like it</span>
          </button>
        )}
      </div>

      <label className="flex shrink-0 items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={a.show_price}
          disabled={savingPrice || !listingPrice(a)}
          onChange={onToggleShowPrice}
          className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-40"
        />
        Show price
      </label>
    </li>
  )
}
