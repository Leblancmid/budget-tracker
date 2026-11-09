import { useState } from 'react'
import { Coins, Lightbulb, Plus, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { websiteGoldApi, type WebsiteGold, type WebsiteGoldRate } from '@/api/business'
import { useAsyncData } from '@/hooks/useAsyncData'
import { toast } from '@/lib/toast'
import { errorMessage, flattenApiErrors } from '@/utils/api'
import { handleAmountInput } from '@/utils/format'

const NONE = null as WebsiteGold | null
const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'

interface Row { method: string; currency: 'USD' | 'PHP'; per_kk: string }
const toRows = (rates: WebsiteGoldRate[]): Row[] => rates.map((r) => ({ ...r, per_kk: String(r.per_kk) }))

/** Gold rates shown on the website (per 1KK), saved here and published with the listings. */
export function GoldRatesCard() {
  const { data, loading, error, refetch } = useAsyncData(websiteGoldApi.get, NONE)
  const [rows, setRows]     = useState<Row[] | null>(null)
  const [minKk, setMinKk]   = useState<string | null>(null)
  const [note, setNote]     = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [saving, setSaving] = useState(false)

  // Until edited, show what's saved
  const shownRows = rows ?? (data ? toRows(data.gold.rates) : [])
  const shownMin  = minKk ?? (data?.gold.min_order_kk != null ? String(data.gold.min_order_kk) : '')
  const shownNote = note ?? data?.gold.note ?? ''
  const dirty = rows !== null || minKk !== null || note !== null

  const update = (i: number, patch: Partial<Row>) => setRows(shownRows.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const save = async () => {
    const errs: typeof errors = {}
    shownRows.forEach((r, i) => {
      if (!r.method.trim()) errs[`rates.${i}.method`] = 'Name it, e.g. Binance.'
      if (!(Number(r.per_kk) > 0)) errs[`rates.${i}.per_kk`] = 'Enter the price.'
    })
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      await websiteGoldApi.save({
        rates: shownRows.map((r) => ({ method: r.method.trim(), currency: r.currency, per_kk: Number(r.per_kk) })),
        min_order_kk: shownMin ? Number(shownMin) : null,
        note: shownNote.trim() || null,
      })
      setRows(null); setMinKk(null); setNote(null)
      await refetch()
      toast.success('Gold rates saved. Click Publish to website to put them live.')
    } catch (err) {
      const flat = flattenApiErrors(err)
      if (flat) setErrors(flat)
      else toast.error(errorMessage(err, 'Could not save the rates.'))
    } finally {
      setSaving(false)
    }
  }

  const g = data?.guide

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Coins size={16} className="text-amber-500" />
        <h2 className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-100">Gold rates on the website</h2>
      </div>

      {loading && !data ? (
        <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      ) : error || !data ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{error ?? "Couldn't load the rates."}</p>
      ) : (
        <>
          {g?.recent_sell_rate != null && (
            <p className="flex items-start gap-1.5 rounded-lg bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-100">
              <Lightbulb size={13} className="mt-0.5 shrink-0 text-indigo-500" />
              <span>Lately you've sold at <b>${g.recent_sell_rate}</b>/KK and bought at <b>${g.buy_rate ?? '—'}</b>/KK ({g.sales} sales).</span>
            </p>
          )}

          {shownRows.length === 0 && <p className="text-xs text-gray-500 dark:text-gray-400">No rates yet: the website won't show a gold box until you add one.</p>}
          <div className="flex flex-col gap-2">
            {shownRows.map((r, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="grid grid-cols-[1fr_auto_6rem_auto] items-center gap-2">
                  <input value={r.method} onChange={(e) => update(i, { method: e.target.value })} maxLength={30} placeholder="Binance" aria-label="Payment method" className={inputCls} />
                  <select value={r.currency} onChange={(e) => update(i, { currency: e.target.value as Row['currency'] })} aria-label="Currency" className={inputCls}>
                    <option value="USD">$</option>
                    <option value="PHP">₱</option>
                  </select>
                  <input value={r.per_kk} onChange={(e) => handleAmountInput(e.target.value, (v) => update(i, { per_kk: v }))} inputMode="decimal" placeholder="0.195" aria-label="Price per 1KK" className={inputCls} />
                  <button onClick={() => setRows(shownRows.filter((_, j) => j !== i))} title="Remove this rate" aria-label="Remove this rate"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 size={14} /></button>
                </div>
                {(errors[`rates.${i}.method`] || errors[`rates.${i}.per_kk`]) && (
                  <p className="text-xs text-red-500">{errors[`rates.${i}.method`] ?? errors[`rates.${i}.per_kk`]}</p>
                )}
              </div>
            ))}
          </div>
          {shownRows.length < 6 && (
            <button onClick={() => setRows([...shownRows, { method: '', currency: 'USD', per_kk: '' }])}
              className="flex items-center gap-1 self-start text-xs font-semibold text-indigo-600 dark:text-indigo-400"><Plus size={13} /> Add a payment method</button>
          )}
          <p className="text-[11px] text-gray-400">Price per 1KK (1,000,000) gold.</p>

          <div className="grid grid-cols-[7rem_1fr] gap-2">
            <label className="flex flex-col gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              Minimum (KK)
              <input value={shownMin} onChange={(e) => handleAmountInput(e.target.value, setMinKk, false)} inputMode="numeric" placeholder="none" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              Note for buyers (optional)
              <input value={shownNote} onChange={(e) => setNote(e.target.value)} maxLength={160} placeholder="e.g. Delivered within 30 minutes" className={inputCls} />
            </label>
          </div>
          {errors.min_order_kk && <p className="text-xs text-red-500">{errors.min_order_kk}</p>}

          <Button onClick={save} loading={saving} disabled={!dirty}>Save rates</Button>
        </>
      )}
    </Card>
  )
}
