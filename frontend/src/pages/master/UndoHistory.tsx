import { useCallback, useState } from 'react'
import { ChevronDown, History, Redo2, RefreshCw, Undo2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { operationsApi, type Operation, type OperationChange, type OperationPage } from '@/api/master'
import { useAsyncData } from '@/hooks/useAsyncData'
import { emitDataChanged } from '@/lib/dataEvents'
import { toast } from '@/lib/toast'
import { errorMessage } from '@/utils/api'

const NO_PAGE = null as OperationPage | null

/** "Nov 10, 3:42 PM" in Manila time */
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/** "1 sale", "2 gold stash entries" */
const plural = (n: number, noun: string) => `${n} ${n === 1 ? noun : noun.endsWith('y') ? `${noun.slice(0, -1)}ies` : `${noun}s`}`

/** "1 sale · 2 gold stash entries" */
function summary(changes: OperationChange[]): string {
  const counts = new Map<string, number>()
  changes.forEach((c) => counts.set(c.noun, (counts.get(c.noun) ?? 0) + 1))
  return [...counts].map(([noun, n]) => plural(n, noun)).join(' · ')
}

const VERB: Record<OperationChange['action'], string> = { created: 'Added', updated: 'Changed', deleted: 'Removed' }

/** Fields with a clearer name for people ("archived" means sold in this app) */
const FIELD_NAMES: Record<string, string> = {
  archived_at: 'sold', cancelled_at: 'cancelled', listed_at: 'listed', hidden_at: 'hidden', undone_at: 'undone',
  price_php: 'price ₱', cost_php: 'cost ₱', profit_php: 'profit ₱', price_gold: 'price (gold)', cost_gold: 'cost (gold)',
}

/** archived_at → "sold", account_id → "account" */
const fieldName = (f: string) => FIELD_NAMES[f] ?? f.replace(/_id$/, '').replace(/_/g, ' ')

/** Stored times are UTC ("2026-11-10 03:41:26"): show them in Manila, like the rest of the app */
function value(v: string | null): string {
  if (v === null) return '—'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)) return when(`${v.replace(' ', 'T')}Z`)
  return v
}

function ChangeLine({ c }: { c: OperationChange }) {
  return (
    <li className="py-1.5 text-xs text-gray-600 dark:text-gray-300">
      <span className={c.action === 'deleted' ? 'text-red-600 dark:text-red-400' : c.action === 'created' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
        {VERB[c.action]}
      </span>{' '}
      {c.noun}{c.name ? <> <span className="font-medium text-gray-800 dark:text-gray-100">“{c.name}”</span></> : null}
      {c.action !== 'updated' && c.amount ? <span className="text-gray-400"> · {Number(c.amount).toLocaleString('en-US')}</span> : null}
      {c.fields.length > 0 && (
        <ul className="ml-3 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
          {c.fields.map((f) => (
            <li key={f.field}>{fieldName(f.field)}: <span className="line-through opacity-70">{value(f.before)}</span> → {value(f.after)}</li>
          ))}
        </ul>
      )}
    </li>
  )
}

function OperationRow({ op, onAsk }: { op: Operation; onAsk: (op: Operation, mode: 'undo' | 'redo') => void }) {
  const [open, setOpen] = useState(false)
  const undone = op.undone_at !== null

  return (
    <li className={undone ? 'bg-gray-50/70 dark:bg-gray-800/20' : undefined}>
      <div className="flex items-start gap-3 px-4 py-3">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-3 text-left" title={open ? 'Hide what changed' : 'Show what changed'}>
          <span className={['mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            undone ? 'bg-gray-100 text-gray-400 dark:bg-gray-800' : 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300'].join(' ')}>
            {undone ? <Undo2 size={14} /> : <History size={14} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className={['block text-sm font-semibold', undone ? 'text-gray-400 line-through decoration-gray-300 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'].join(' ')}>
              {op.label}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              {op.user} · {when(op.created_at)} · {summary(op.changes)}
            </span>
            {undone && (
              <span className="block text-xs font-medium text-amber-600 dark:text-amber-400">
                Undone by {op.undone_by ?? 'someone'} · {when(op.undone_at!)}
              </span>
            )}
          </span>
          <ChevronDown size={16} className={['mt-1.5 shrink-0 text-gray-300 transition-transform', open ? 'rotate-180' : ''].join(' ')} />
        </button>
        <button type="button" onClick={() => onAsk(op, undone ? 'redo' : 'undo')}
          className={['flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
            undone
              ? 'border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
              : 'border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-900/30'].join(' ')}>
          {undone ? <Redo2 size={13} /> : <Undo2 size={13} />} {undone ? 'Redo' : 'Undo'}
        </button>
      </div>
      {open && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100 px-4 pb-2 pl-14 dark:divide-gray-800 dark:border-gray-800">
          {op.changes.map((c, i) => <ChangeLine key={i} c={c} />)}
        </ul>
      )}
    </li>
  )
}

/**
 * Master File → Undo: everything done in the app, newest first. Undo puts back every record an
 * action touched (sales, the gold stash, wallets, logs…), so totals follow; Redo does it again.
 */
export default function UndoHistory() {
  const [page, setPage] = useState(1)
  const load = useCallback(() => operationsApi.list(page), [page])
  const { data, loading, error, refetch } = useAsyncData(load, NO_PAGE)
  const [asking, setAsking] = useState<{ op: Operation; mode: 'undo' | 'redo' } | null>(null)
  const [working, setWorking] = useState(false)

  const confirm = async () => {
    if (!asking) return
    setWorking(true)
    try {
      const res = asking.mode === 'undo' ? await operationsApi.undo(asking.op.id) : await operationsApi.redo(asking.op.id)
      toast.success(res.message)
      setAsking(null)
      emitDataChanged() // totals elsewhere (net worth, badges) refresh
      await refetch()
    } catch (err) {
      // e.g. "A trade it touched was changed afterwards by “Edited trade T1” (Nov 10, 3:42 PM). Undo that first."
      toast.error(errorMessage(err, 'It couldn\'t be undone.'))
      setAsking(null)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Undo</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Everything done in the app, newest first. Undo puts back every record an action changed, so totals follow. Kept for 90 days.
          </p>
        </div>
        <button onClick={() => refetch()} title="Refresh" aria-label="Refresh"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <Card>
        {loading && !data ? (
          <div className="flex flex-col gap-2 p-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />)}</div>
        ) : error ? (
          <p className="px-4 py-8 text-center text-sm text-red-500">{error}</p>
        ) : !data || data.data.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Nothing yet. Everything you add, change or delete from now on shows here.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.data.map((op) => <OperationRow key={op.id} op={op} onAsk={(o, mode) => setAsking({ op: o, mode })} />)}
          </ul>
        )}
        {data && data.last_page > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700/60">
            <Pagination meta={data} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={asking !== null}
        onClose={() => !working && setAsking(null)}
        onConfirm={confirm}
        loading={working}
        title={asking?.mode === 'redo' ? 'Do it again?' : 'Undo this?'}
        confirmLabel={asking?.mode === 'redo' ? 'Redo' : 'Undo'}
        message={asking
          ? asking.mode === 'redo'
            ? `${asking.op.label}: done again. ${asking.op.changes.length} record${asking.op.changes.length === 1 ? '' : 's'} go back to how it left them.`
            : `${asking.op.label}: undone. ${asking.op.changes.length} record${asking.op.changes.length === 1 ? '' : 's'} (${summary(asking.op.changes)}) go back to how they were. You can redo it afterwards.`
          : ''}
      />
    </div>
  )
}
