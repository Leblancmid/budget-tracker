import { useMemo, useState } from 'react'
import { Plus, Minus, Coins, TrendingUp, TrendingDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { GoldModal } from '@/components/modals/GoldModal'
import { useGolds } from '@/hooks/useGolds'
import { useGoldLogs } from '@/hooks/useGoldLogs'
import { goldsApi } from '@/api/rucoy'
import { toast } from '@/components/ui/Toast'
import { formatWithCommas, formatDateLong, paginateLocally } from '@/utils/format'

export default function Golds() {
  const { totalGold, loading, error, refetch: refetchGolds, create } = useGolds()
  const { logs, refetch: refetchLogs } = useGoldLogs()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [addOpen, setAddOpen] = useState(false)

  const [sellOpen, setSellOpen] = useState(false)
  const [sellAmount, setSellAmount] = useState('')
  const [sellDesc, setSellDesc] = useState('')
  const [sellError, setSellError] = useState('')
  const [selling, setSelling] = useState(false)

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs
    const q = search.trim().toLowerCase()
    return logs.filter((l) =>
      (l.description ?? '').toLowerCase().includes(q) ||
      l.type.toLowerCase().includes(q)
    )
  }, [logs, search])

  const { paginated: paginatedLogs, meta } = paginateLocally(filteredLogs, page, 5)

  const openSell = () => { setSellOpen(true); setSellAmount(''); setSellDesc(''); setSellError('') }
  const closeSell = () => { setSellOpen(false); setSellAmount(''); setSellDesc(''); setSellError('') }

  const handleAdd = async (data: { amount: number; description?: string }) => {
    await create(data)
    toast.success('Gold added.')
    await refetchLogs()
  }

  const handleSell = async () => {
    const parsed = parseFloat(sellAmount)
    if (!sellAmount || isNaN(parsed) || parsed <= 0) { setSellError('Enter a valid amount.'); return }
    if (parsed > totalGold) { setSellError(`Cannot sell more than ${totalGold.toLocaleString()} G.`); return }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Golds</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your current gold balance</p>
        </div>
      </div>

      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      {/* Current Gold banner */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/40 dark:bg-amber-900/10">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 dark:bg-amber-500/20">
            <Coins size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-500 uppercase tracking-wide">Current Gold</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {loading ? '—' : `${totalGold.toLocaleString()} `}
              <span className="text-base font-semibold">G</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
            title="Add Gold"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={openSell}
            disabled={loading || totalGold === 0}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            title="Sell Gold"
          >
            <Minus size={18} />
          </button>
        </div>
      </div>

      {/* Transaction History */}
      {logs.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Transaction History</h2>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search…"
                className="rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-1.5 text-sm text-gray-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 w-44"
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500 italic">
                      No results match your search.
                    </td>
                  </tr>
                )}
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={[
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        log.type === 'add'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      ].join(' ')}>
                        {log.type === 'add' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {log.type === 'add' ? 'Add' : 'Sell'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {log.description || <span className="italic">—</span>}
                    </td>
                    <td className={[
                      'px-4 py-3 text-right font-semibold whitespace-nowrap',
                      log.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
                    ].join(' ')}>
                      {log.type === 'add' ? '+' : '-'}{Number(log.amount).toLocaleString()} G
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {formatDateLong(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      )}

      <GoldModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} gold={null} />

      <Modal open={sellOpen} onClose={closeSell} title="Sell Gold" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total available: <span className="font-semibold text-amber-600 dark:text-amber-400">{totalGold.toLocaleString()} G</span>
          </p>
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Amount to sell</p>
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
                'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors',
                'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
                sellError ? 'border-red-400 dark:border-red-500' : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500',
              ].join(' ')}
            />
            {sellError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{sellError}</p>}
          </div>
          <Input
            label="Description (optional)"
            value={sellDesc}
            onChange={(e) => setSellDesc(e.target.value)}
            placeholder="e.g. Sold to buyer"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeSell} disabled={selling}>Cancel</Button>
            <Button onClick={handleSell} loading={selling}>Sell Gold</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
