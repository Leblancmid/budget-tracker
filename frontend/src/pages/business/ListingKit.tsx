import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clipboard, Download, FileText, Megaphone, Timer } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRucoyAccounts } from '@/hooks/useRucoyAccounts'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useLoadedImages } from '@/hooks/useLoadedImages'
import { rucoyAccountsApi } from '@/api/rucoy'
import { readJson, STORAGE_KEYS, writeJson } from '@/lib/storage'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import type { RucoyAccount } from '@/types'
import {
  daysListed, DEFAULT_CROP, formatGoldShort, isNewListing, listingCaption, sameOriginPath, sortForListing,
  type CropInsets,
} from '@/utils/listing'
import { AccountPickRow } from './listing/AccountPickRow'
import { canvasToBlob, drawListing, pngUnder, type ListingTile } from './listing/drawListing'

interface KitSettings {
  columns: number
  newForDays: number
  headline: string
  promos: string
  /** Website link for the caption */
  link: string
  /** How much of each screenshot edge to cut, to keep just the stats panel */
  crop: CropInsets
}

const CROP_SIDES: { key: keyof CropInsets; label: string }[] = [
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'left', label: 'Left' },
  { key: 'right', label: 'Right' },
]

const DEFAULTS: KitSettings = {
  columns: 3,
  newForDays: 3,
  headline: 'Rucoy accounts for sale',
  promos: 'SELL GOLD\nBUY 700 - 800 ACCOUNT',
  link: 'https://leblancmid.vercel.app/',
  crop: DEFAULT_CROP,
}

const NO_ACCOUNTS: RucoyAccount[] = []

/**
 * Builds the image posted in Discord / WhatsApp straight from the accounts for sale:
 * screenshots cropped to the stats panel, NEW ribbons, optional prices and promo tags.
 */
export default function ListingKit() {
  const { accounts, loading, error, refetch, update } = useRucoyAccounts()
  const sold = useAsyncData(rucoyAccountsApi.getArchived, NO_ACCOUNTS)
  const [settings, setSettings] = useState<KitSettings>(() => ({ ...DEFAULTS, ...readJson<Partial<KitSettings>>(STORAGE_KEYS.listingKit, {}) }))
  const [excluded, setExcluded] = useState<Set<number>>(() => new Set())
  const [savingPriceId, setSavingPriceId] = useState<number | null>(null)
  const [nowMs] = useState(() => Date.now())
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const patch = (p: Partial<KitSettings>) => {
    const next = { ...settings, ...p }
    setSettings(next)
    writeJson(STORAGE_KEYS.listingKit, next)
  }

  const ordered  = useMemo(() => sortForListing(accounts), [accounts])
  const included = useMemo(() => ordered.filter((a) => a.screenshot && !excluded.has(a.id)), [ordered, excluded])
  const promos   = useMemo(() => settings.promos.split('\n').map((p) => p.trim()).filter(Boolean), [settings.promos])
  const urls     = useMemo(() => included.map((a) => sameOriginPath(a.screenshot!)), [included])
  const { images, failed, loading: imagesLoading } = useLoadedImages(urls)

  const tiles: ListingTile[] = useMemo(() => included.flatMap((a, i) => {
    const image = images.get(urls[i])
    if (!image) return []
    return [{
      image,
      isNew: isNewListing(a.listed_at, nowMs, settings.newForDays),
      priceLabel: a.show_price && a.price ? formatGoldShort(a.price) : null,
    }]
  }), [included, images, urls, nowMs, settings.newForDays])

  // Paint the canvas (an external system) whenever what's on it changes
  useEffect(() => {
    if (canvasRef.current && tiles.length) {
      drawListing(canvasRef.current, tiles, { columns: settings.columns, promos, crop: settings.crop })
    }
  }, [tiles, settings.columns, settings.crop, promos])

  // Measurement: how long sold accounts took to sell
  const avgDaysToSell = useMemo(() => {
    const days = sold.data
      .map((a) => (a.archived_at ? daysListed(a.listed_at, Date.parse(a.archived_at)) : null))
      .filter((d): d is number => d != null)
    return days.length ? { avg: days.reduce((s, d) => s + d, 0) / days.length, count: days.length } : null
  }, [sold.data])

  const toggleInclude = (id: number) => setExcluded((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const toggleShowPrice = async (a: RucoyAccount) => {
    setSavingPriceId(a.id)
    try {
      await update(a.id, { email: a.email, show_price: !a.show_price })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSavingPriceId(null)
    }
  }

  const copyImage = async () => {
    if (!canvasRef.current) return
    try {
      const { blob, scale } = await pngUnder(canvasRef.current)
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      toast.success(scale < 1
        ? `Image copied at ${Math.round(scale * 100)}% size to fit Discord’s 10 MB limit. Use Download for full size.`
        : 'Image copied — paste it into Discord with Ctrl+V.')
    } catch {
      toast.error('Your browser blocked copying the image. Use Download instead.')
    }
  }

  const downloadImage = async () => {
    if (!canvasRef.current) return
    try {
      const blob = await canvasToBlob(canvasRef.current, 'image/jpeg', 0.92)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `accounts-for-sale-${new Date(nowMs).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })}.jpg`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(listingCaption(included, { headline: settings.headline, link: settings.link, promos }))
      toast.success('Caption copied.')
    } catch {
      toast.error('Your browser blocked copying the caption.')
    }
  }

  const missingShots = ordered.filter((a) => !a.screenshot).length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
          <Megaphone className="h-5 w-5 text-teal-600 dark:text-teal-400" /> Listing Kit
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The image you post in Discord and WhatsApp, built from the accounts you have for sale.
        </p>
      </div>

      {error ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={refetch}>Try again</Button>
        </Card>
      ) : loading ? (
        <Card className="p-10 text-center text-sm text-gray-400">Loading accounts…</Card>
      ) : ordered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">No accounts for sale right now.</p>
          <Link to="/business/transactions" className="mt-2 inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Add one in Sales
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">

          {/* Left: what goes in the image */}
          <div className="flex flex-col gap-6">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Accounts ({included.length} in image)</h2>
                {missingShots > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">{missingShots} without screenshot</span>
                )}
              </div>
              <ul className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
                {ordered.map((a) => (
                  <AccountPickRow
                    key={a.id}
                    a={a}
                    included={!excluded.has(a.id)}
                    isNew={isNewListing(a.listed_at, nowMs, settings.newForDays)}
                    nowMs={nowMs}
                    savingPrice={savingPriceId === a.id}
                    onToggleInclude={() => toggleInclude(a.id)}
                    onToggleShowPrice={() => toggleShowPrice(a)}
                  />
                ))}
              </ul>
            </Card>

            <Card className="flex flex-col gap-4 p-4">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Image settings</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="kit-columns" className="text-sm font-medium text-gray-700 dark:text-gray-300">Columns</label>
                  <select
                    id="kit-columns"
                    value={settings.columns}
                    onChange={(e) => patch({ columns: Number(e.target.value) })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    {[2, 3, 4].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Input
                  label="NEW for (days)"
                  type="number"
                  min={0}
                  max={30}
                  value={settings.newForDays}
                  onChange={(e) => patch({ newForDays: Math.max(0, Math.min(30, Number(e.target.value) || 0)) })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="kit-promos" className="text-sm font-medium text-gray-700 dark:text-gray-300">Promo tags (one per line)</label>
                <textarea
                  id="kit-promos"
                  rows={2}
                  value={settings.promos}
                  onChange={(e) => patch({ promos: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Crop screenshots (%)</p>
                  <button
                    type="button"
                    onClick={() => patch({ crop: DEFAULT_CROP })}
                    className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {CROP_SIDES.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="w-12 shrink-0">{label}</span>
                      <input
                        type="range"
                        min={0}
                        max={60}
                        value={settings.crop[key]}
                        onChange={(e) => patch({ crop: { ...settings.crop, [key]: Number(e.target.value) } })}
                        className="min-w-0 flex-1 accent-indigo-600"
                      />
                      <span className="w-7 text-right tabular-nums">{settings.crop[key]}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Keeps just the stats panel and the account name. Adjust once if your screenshots are framed differently.</p>
              </div>
              <Input label="Website link (caption)" value={settings.link} onChange={(e) => patch({ link: e.target.value })} />
              <Input label="Caption headline" value={settings.headline} onChange={(e) => patch({ headline: e.target.value })} />
            </Card>

            {avgDaysToSell && (
              <Card className="flex items-center gap-3 p-4">
                <Timer className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sold accounts took <span className="font-semibold text-gray-900 dark:text-gray-100">{avgDaysToSell.avg.toFixed(1)} days</span> on
                  average to sell ({avgDaysToSell.count} sold).
                  {avgDaysToSell.avg < 2 && ' They sell fast — you may have room to raise prices.'}
                </p>
              </Card>
            )}
          </div>

          {/* Right: preview + actions */}
          <Card className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-sm font-semibold text-gray-800 dark:text-gray-100">Preview</h2>
              <Button size="sm" icon={<Clipboard size={14} />} onClick={copyImage} disabled={!tiles.length || imagesLoading}>
                Copy image
              </Button>
              <Button size="sm" variant="secondary" icon={<FileText size={14} />} onClick={copyCaption} disabled={!included.length}>
                Copy caption
              </Button>
              <button
                type="button"
                onClick={downloadImage}
                disabled={!tiles.length || imagesLoading}
                title="Download image"
                aria-label="Download image"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <Download size={16} />
              </button>
            </div>

            {failed.length > 0 && (
              <p className="text-xs text-red-500">{failed.length} screenshot{failed.length > 1 ? 's' : ''} could not be loaded and {failed.length > 1 ? 'are' : 'is'} left out.</p>
            )}

            {included.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 dark:border-gray-700">
                Pick at least one account with a screenshot.
              </div>
            ) : imagesLoading ? (
              <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400 dark:bg-gray-800/50">
                Loading screenshots…
              </div>
            ) : null}
            <canvas
              ref={canvasRef}
              className={['h-auto w-full rounded-lg', tiles.length && !imagesLoading ? '' : 'hidden'].join(' ')}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Copy image, then paste it with Ctrl+V in each server. Posting stays manual on purpose: automating your own Discord account breaks Discord’s rules and puts your name at risk.
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
