import { useMemo, useState } from 'react'
import { Plus, Minus, Coins, TrendingUp, TrendingDown, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { GoldModal } from '@/components/modals/GoldModal'
import { useGolds } from '@/hooks/useGolds'
import { useGoldLogs } from '@/hooks/useGoldLogs'
import { goldsApi } from '@/api/rucoy'
import { toast } from '@/components/ui/Toast'
import { formatWithCommas, formatDateLong, paginateLocally } from '@/utils/format'
import { exportCsv } from '@/utils/csv'

export default function Golds() {
  const { totalGold, loading, error, refetch: refetchGolds, create } = useGolds()
  const { logs, loading: logsLoading, refetch: refetchLogs } = useGoldLogs()

  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'add' | 'sell'>('all')
  const [page, setPage]             = useState(1)
  const [addOpen, setAddOpen]       = useState(false)
  const [sellOpen, setSellOpen]     = useState(false)
  const [sellAmount, setSellAmount] = useState('')
  const [sellDesc, setSellDesc]     = useState('')
  const [sellError, setSellError]   = useState('')
  const [selling, setSelling]       = useState(false)

  const filteredLogs = useMemo(() => {
    let result = typeFilter === 'all' ? logs : logs.filter((l) => l.type === typeFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((l) => (l.description ?? '').toLowerCase().includes(q))
    }
    return result
  }, [logs, typeFilter, search])

  const { paginated: paginatedLogs, meta } = paginateLocally(filteredLogs, page, 10)


  const openSell  = () => { setSellOpen(true); setSellAmount(''); setSellDesc(''); setSellError('') }
  const closeSell = () => { setSellOpen(false); setSellAmount(''); setSellDesc(''); setSellError('') }

  const handleExport = () => exportCsv('golds', logs.map((l) => ({
    date: l.created_at, type: l.type, amount: l.amount, description: l.description ?? '',
  })))

  const handleAdd = async (data: { amount: number; description?: string }) => {
    await create(data)
    toast.success('Gold added.')
    await refetchLogs()
  }

  const handleSell = async () => {
    const parsed = parseFloat(sellAmount)
    if (!sellAmount || isNaN(parsed) || parsed <= 0) { setSellError('Enter a valid amount.'); return }
    setSelling(true)
    try {
      await goldsApi.sell(parsed, sellDesc || undefined)
      await Promise.all([refetchGolds(), refetchLogs()])
      toast.success(`Sold ${parsed.toLocaleString()} G.`)
      closeSell()
    } catch (err: unknown) {
      setSellError((err as { message: string }).message)
    } finally {
      setSelling(false)
    }
  }

  const isNegative = !loading && totalGold < 0

  return (
    <div className="flex flex-col gap-5">

      {error && <div className="text-red-500 text-sm text-center py-2">{error}</div>}

      {/* Hero banner */}
      {loading ? (
        <div className="h-36 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className={[
          'relative overflow-hidden rounded-2xl p-6 shadow-lg',
          isNegative
            ? 'bg-gradient-to-br from-red-700 to-red-900 shadow-red-900/30'
            : 'bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-900/30 dark:shadow-black/40',
        ].join(' ')}>
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={['flex h-6 w-6 items-center justify-center rounded-lg', isNegative ? 'bg-red-400/20' : 'bg-amber-400/20'].join(' ')}>
                  <Coins className={['h-3.5 w-3.5', isNegative ? 'text-red-300' : 'text-amber-400'].join(' ')} />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Gold Stash</span>
              </div>
              <p className={['text-3xl font-bold', isNegative ? 'text-red-300' : 'text-amber-400'].join(' ')}>
                {totalGold.toLocaleString()} <span className="text-xl font-semibold opacity-60">G</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">{logs.length} log{logs.length !== 1 ? 's' : ''} recorded</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus size={15} /> Add Gold
              </button>
              <button
                onClick={openSell}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/80 hover:text-white px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus size={15} /> Sell Gold
              </button>
            </div>
          </div>
        </div>
      )}


      {/* History */}
      <Card className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Transaction History
            {filteredLogs.length > 0 && (
              <span className="ml-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                {filteredLogs.length} entries
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search…"
                className="rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 w-36"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1) }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400/40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="all">All Types</option>
              <option value="add">Add</option>
              <option value="sell">Sell</option>
            </select>
            <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>

        {logsLoading ? (
          <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-700/40">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="h-8 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 h-3 w-40 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <Coins className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {search || typeFilter !== 'all' ? 'No results match your filters.' : 'No gold logs yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Description</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide dark:text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={[
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                          log.type === 'add'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                        ].join(' ')}>
                          {log.type === 'add' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {log.type === 'add' ? 'Add' : 'Sell'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {log.description || <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className={[
                        'px-5 py-3.5 text-right font-bold whitespace-nowrap',
                        log.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
                      ].join(' ')}>
                        {log.type === 'add' ? '+' : '−'}{Number(log.amount).toLocaleString()} G
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {formatDateLong(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700/40">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>

      <GoldModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} gold={null} />

      {/* Sell modal */}
      <Modal open={sellOpen} onClose={closeSell} title="Sell Gold" size="sm">
        <div className="flex flex-col gap-4">
          {(() => {
            const parsed    = parseFloat(sellAmount)
            const remaining = sellAmount && !isNaN(parsed) ? totalGold - parsed : totalGold
            const neg       = remaining < 0
            return (
              <div className={['flex items-center justify-between rounded-xl px-4 py-3', neg ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-800/40'].join(' ')}>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Remaining after sale</span>
                <span className={['text-sm font-bold', neg ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'].join(' ')}>
                  {remaining.toLocaleString()} G
                </span>
              </div>
            )
          })()}

          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Amount to sell</p>
            <input
              type="text"
              inputMode="decimal"
              value={formatWithCommas(sellAmount)}
              onChange={(e) => {
                const stripped = e.target.value.replace(/,/g, '')
                if (stripped === '' || /^\d*\.?\d*$/.test(stripped)) { setSellAmount(stripped); setSellError('') }
              }}
              placeholder="e.g. 500,000"
              className={[
                'block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-colors',
                'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
                sellError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600',
              ].join(' ')}
            />
            {sellError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{sellError}</p>}
          </div>

          <Input
            label="Description (optional)"
            value={sellDesc}
            onChange={(e) => setSellDesc(e.target.value)}
            placeholder="e.g. Sold to buyer"
          />

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={closeSell} disabled={selling}>Cancel</Button>
            <Button onClick={handleSell} loading={selling}>Sell Gold</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
