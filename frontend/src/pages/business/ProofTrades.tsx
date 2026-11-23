import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EyeOff, Images, Pencil, Plus, RefreshCw, Trash2, Trophy } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { proofTradesApi, type ProofTrade } from '@/api/business'
import { useAsyncData } from '@/hooks/useAsyncData'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'
import { formatShortDate } from '@/utils/format'
import { ProofTradeModal } from './proofs/ProofTradeModal'

const NO_TRADES: ProofTrade[] = []
const MEDALS = ['🥇', '🥈', '🥉']
const SYMBOL = { EUR: '€', USD: '$', PHP: '₱' } as const

const formatTradeValue = (t: Pick<ProofTrade, 'value' | 'currency'>) =>
  `${SYMBOL[t.currency]}${t.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

/**
 * Storefront → Proven trades: your best trades with their screenshots (like a Discord references
 * channel), shown on the website as a showcase after "Publish to website". Biggest first.
 */
export default function ProofTrades() {
  const { data: trades, loading, error, refetch } = useAsyncData(proofTradesApi.list, NO_TRADES)
  // The trade open for editing (null with adding = a new one)
  const [editing, setEditing] = useState<ProofTrade | null>(null)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<ProofTrade | null>(null)
  const [busy, setBusy] = useState(false)

  const shown = trades.filter((t) => t.published)

  const remove = async () => {
    if (!removing) return
    setBusy(true)
    try {
      const r = await proofTradesApi.remove(removing.id)
      toast.success(r.message)
      setRemoving(null)
      await refetch()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not remove it.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Proven trades</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Your best trades with screenshots, shown on the website. They go live when you <Link to="/business/listing" className="font-semibold text-indigo-600 dark:text-indigo-400">Publish to website</Link>.
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setAdding(true) }}>Add a trade</Button>
      </div>

      {loading && trades.length === 0 ? (
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      ) : error ? (
        <Card className="flex items-center justify-between gap-2 p-4 text-sm text-gray-500 dark:text-gray-400">
          Couldn't load your proven trades.
          <button onClick={() => refetch()} className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400"><RefreshCw size={13} /> Retry</button>
        </Card>
      ) : trades.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <Trophy size={28} className="text-amber-500" />
          <p className="text-sm text-gray-600 dark:text-gray-300">No proven trades yet. Add your biggest one with its Discord screenshots: it's the strongest proof a new buyer can see.</p>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Add your first trade</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {trades.map((t) => {
            const rank = shown.indexOf(t)
            return (
              <Card key={t.id} className={`flex flex-col overflow-hidden ${t.published ? '' : 'opacity-70'}`}>
                <button type="button" onClick={() => setEditing(t)} className="relative block aspect-[16/9] bg-gray-100 dark:bg-gray-800" aria-label={`Edit ${t.title}`}>
                  {t.images[0] && <img src={t.images[0].thumb_url} alt="" className="size-full object-cover" />}
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white"><Images size={11} /> {t.images.length}</span>
                  {!t.published && <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white"><EyeOff size={11} /> Not on the website</span>}
                </button>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <p className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t.published && rank >= 0 && rank < 3 && <span aria-hidden>{MEDALS[rank]}</span>}
                    {formatTradeValue(t)}
                  </p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.title}</p>
                  {t.traded_on && <p className="text-xs text-gray-400">{formatShortDate(t.traded_on)}</p>}
                  {t.quote && <p className="mt-1 line-clamp-2 text-xs italic text-gray-500 dark:text-gray-400">“{t.quote}”{t.quote_by && ` — ${t.quote_by}`}</p>}
                  <div className="mt-auto flex gap-2 pt-3">
                    <Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(t)}>Edit</Button>
                    <button type="button" onClick={() => setRemoving(t)} title="Remove" aria-label={`Remove ${t.title}`}
                      className="ml-auto rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"><Trash2 size={15} /></button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {(adding || editing) && (
        <ProofTradeModal key={editing?.id ?? 'new'} trade={editing} onClose={() => { setAdding(false); setEditing(null) }} onSaved={refetch} />
      )}
      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        loading={busy}
        title="Remove this trade?"
        confirmLabel="Remove"
        message={`"${removing?.title}" and its ${removing?.images.length ?? 0} screenshot(s) will be deleted. It leaves the website on your next publish.`}
      />
    </div>
  )
}
