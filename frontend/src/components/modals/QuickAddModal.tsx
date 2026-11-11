import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowLeftRight, Briefcase, CalendarDays, Coins, CornerDownLeft, Wallet, Zap } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Amt } from '@/components/ui/Amt'
import { transactionsApi } from '@/api/transactions'
import { balanceAccountsApi, balanceTransfersApi } from '@/api/master'
import { businessTransactionsApi, type BusinessTransactionPayload } from '@/api/business'
import { categoriesApi } from '@/api/categories'
import { emitDataChanged } from '@/lib/dataEvents'
import { savedGoldRates } from '@/lib/goldRates'
import { toast } from '@/lib/toast'
import { errorMessage, flattenApiErrors } from '@/utils/api'
import { fmtIn } from '@/utils/balanceAccounts'
import { formatCurrency, formatShortDate, todayManila } from '@/utils/format'
import { formatGoldShort } from '@/utils/priceGuide'
import { goldPhp, parseQuickAdd, type QuickAddContext, type QuickAddHistory, type QuickAddResult } from '@/utils/quickAdd'
import type { BalanceAccountConfig, Category } from '@/types'

const EXAMPLES_ALL = [
  { text: '250 lunch gcash', hint: 'expense from GCash' },
  { text: '+15k salary maya', hint: 'income into Maya' },
  { text: '5000 maribank > gcash fee 15', hint: 'transfer' },
  { text: 'gold 500kk @.17 sell .19 gcash', hint: 'gold bought at .17, selling at .19' },
  { text: 'gold 500kk ₱5400 maya', hint: 'gold paid in ₱' },
]
const EXAMPLES_DAILY = [
  { text: '250 lunch', hint: 'expense' },
  { text: '+15k salary', hint: 'income' },
  { text: '120 jeep yesterday', hint: 'dated yesterday' },
]

/** A ready-to-save gold trade from the parsed line, the same way Add Gold works it out. */
function goldPayload(r: Extract<QuickAddResult, { kind: 'gold' }>): BusinessTransactionPayload {
  const { phpRate } = savedGoldRates()
  const pricePhp = r.sellRate != null ? goldPhp(r.gold, r.sellRate, phpRate) : null
  const costPhp  = r.phpPaid != null ? r.phpPaid : r.costRate != null ? goldPhp(r.gold, r.costRate, phpRate) : null
  const profit   = pricePhp != null && costPhp != null ? pricePhp - costPhp : null
  return {
    type: 'gold',
    action: null,
    description: r.description || null,
    date: r.date,
    price_gold: r.gold,
    // ₱ paid: no gold went out; otherwise the gold bought is the cost gold
    cost_gold: r.phpPaid != null ? 0 : r.gold,
    price_rate: r.sellRate,
    cost_rate: r.costRate,
    php_rate: r.sellRate != null || r.phpPaid == null ? phpRate : null,
    cost_php_rate: r.phpPaid != null ? null : phpRate,
    price_php: pricePhp,
    cost_php: costPhp,
    amount: profit != null && profit > 0 ? Math.round(profit * 100) / 100 : 0.01,
    balance_account: r.wallet,
  }
}

/**
 * Quick Add: type one line ("250 lunch gcash") and press Enter. Works from any page
 * (Ctrl+K). Mount it only while open.
 */
export function QuickAddModal({ isAdmin, onClose }: { isAdmin: boolean; onClose: () => void }) {
  const [text, setText]           = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [wallets, setWallets]     = useState<BalanceAccountConfig[]>([])
  const [history, setHistory]     = useState<QuickAddHistory[]>([])
  const [loading, setLoading]     = useState(true)
  const [pickedCategory, setPickedCategory] = useState('')
  const [saving, setSaving]       = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // What it needs to understand you: categories, wallets, and recent entries to learn from
  useEffect(() => {
    let cancelled = false
    Promise.all([
      categoriesApi.getAll(),
      isAdmin ? balanceAccountsApi.getAll() : Promise.resolve([] as BalanceAccountConfig[]),
      transactionsApi.getAll({ per_page: 200 }).then((p) => p.data).catch(() => []),
    ]).then(([cats, accs, txs]) => {
      if (cancelled) return
      setCategories(cats)
      setWallets(accs.filter((a) => !a.hidden_at))
      setHistory(txs.map((t) => ({ description: t.description, category_id: t.category_id, type: t.type })))
    }).catch(() => {
      if (!cancelled) toast.error('Could not load your categories and accounts.')
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isAdmin])

  const ctx: QuickAddContext = useMemo(() => ({
    today: todayManila(), isAdmin, history,
    wallets: wallets.map((w) => ({ code: w.code, name: w.name, currency: w.currency })),
    categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
  }), [isAdmin, history, wallets, categories])

  const result = useMemo(() => parseQuickAdd(text, ctx), [text, ctx])
  const walletByCode = useMemo(() => new Map(wallets.map((w) => [w.code, w])), [wallets])

  // A new line clears the category picked by hand for the previous one (reset during render)
  const [lastText, setLastText] = useState(text)
  if (lastText !== text) { setLastText(text); setPickedCategory(''); setServerError(null) }

  const categoryId = result.kind === 'daily' ? (result.categoryId ?? (Number(pickedCategory) || null)) : null
  const canSave = !saving && !loading && (
    result.kind === 'transfer' || result.kind === 'gold' || (result.kind === 'daily' && categoryId != null)
  )

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    setServerError(null)
    try {
      if (result.kind === 'daily') {
        const saved = await transactionsApi.createOrQueue({
          type: result.type, amount: result.amount, description: result.description || undefined,
          category_id: categoryId!, date: result.date, scope: result.business ? 'business' : 'personal',
          ...(isAdmin ? { balance_account: result.wallet } : {}),
        })
        const what = `${result.type === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(result.amount)}`
        toast.success(saved.queued ? `You're offline: ${what.toLowerCase()} saved on this device. You'll approve sending it when you're back online.` : `${what} added.`)
      } else if (result.kind === 'transfer') {
        await balanceTransfersApi.create({ from_account: result.from, to_account: result.to, amount: result.amount, fee: result.fee, date: result.date, note: result.note })
        toast.success(`Moved ${formatCurrency(result.amount)} from ${walletByCode.get(result.from)?.name} to ${walletByCode.get(result.to)?.name}.`)
      } else if (result.kind === 'gold') {
        await businessTransactionsApi.create(goldPayload(result))
        toast.success(`${formatGoldShort(result.gold)} gold added to Sales and your stash.`)
      }
      emitDataChanged()
      setText('')
    } catch (err) {
      const flat = flattenApiErrors(err)
      setServerError(flat ? Object.values(flat).filter(Boolean).join(' ') : errorMessage(err, 'Could not save.'))
    } finally {
      setSaving(false)
    }
  }

  const chip = (icon: ReactNode, label: ReactNode, tone = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200') => (
    <span className={['inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', tone].join(' ')}>{icon}{label}</span>
  )
  const walletChip = (code: string | null, verb: string) => {
    const w = code ? walletByCode.get(code) : undefined
    return w ? chip(<Wallet size={11} />, `${verb} ${w.name}`, 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300') : null
  }
  const dateChip = (date: string) => date !== ctx.today ? chip(<CalendarDays size={11} />, formatShortDate(date)) : null

  const preview = (() => {
    if (loading) return <div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
    if (result.kind === 'empty') return null
    if (result.kind === 'error') return <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">{result.message}</p>

    if (result.kind === 'daily') {
      const income = result.type === 'income'
      return (
        <div className="flex flex-col gap-2 rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-1.5">
            {chip(null, <>{income ? '+' : '−'}<Amt value={formatCurrency(result.amount)} /></>, income ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300')}
            {chip(null, income ? 'Income' : 'Expense')}
            {result.description && chip(null, result.description)}
            {result.categoryId != null && chip(null, categories.find((c) => c.id === result.categoryId)?.name, 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300')}
            {walletChip(result.wallet, income ? 'into' : 'from')}
            {result.business && chip(<Briefcase size={11} />, 'Business', 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300')}
            {dateChip(result.date)}
          </div>
          {result.categoryId == null && (
            <Select aria-label="Category" value={pickedCategory} onChange={(e) => setPickedCategory(e.target.value)}
              placeholder="Pick a category (it's remembered next time)"
              options={categories.filter((c) => c.type === result.type).map((c) => ({ value: c.id, label: c.name }))} />
          )}
        </div>
      )
    }

    if (result.kind === 'transfer') {
      const from = walletByCode.get(result.from)
      return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700">
          {chip(<ArrowLeftRight size={11} />, 'Transfer', 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300')}
          {chip(null, <Amt value={fmtIn(from, result.amount)} />)}
          {chip(null, `${from?.name} → ${walletByCode.get(result.to)?.name}`)}
          {result.fee != null && chip(null, <>fee <Amt value={fmtIn(from, result.fee)} /></>)}
          {result.note && chip(null, result.note)}
          {dateChip(result.date)}
        </div>
      )
    }

    const p = goldPayload(result)
    const missing = result.phpPaid == null && result.costRate == null
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-1.5">
          {chip(<Coins size={11} />, `${formatGoldShort(result.gold)} gold`, 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300')}
          {result.costRate != null && chip(null, `bought @ $${result.costRate}`)}
          {result.phpPaid != null && chip(null, <>paid <Amt value={formatCurrency(result.phpPaid)} /></>, 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300')}
          {result.sellRate != null && chip(null, `selling @ $${result.sellRate}`, 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300')}
          {result.description && chip(null, result.description)}
          {walletChip(result.wallet, 'paid from')}
          {dateChip(result.date)}
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          {missing
            ? 'No cost yet: it saves as Awaiting pricing. Add @rate or ₱amount to include the cost.'
            : <>Cost <Amt value={formatCurrency(p.cost_php ?? 0)} />{p.price_php != null && <> · Price <Amt value={formatCurrency(p.price_php)} /> · Profit <Amt value={formatCurrency((p.price_php ?? 0) - (p.cost_php ?? 0))} /></>} at ₱{savedGoldRates().phpRate}/$ (your Overview rate).</>}
        </p>
      </div>
    )
  })()

  const examples = isAdmin ? EXAMPLES_ALL : EXAMPLES_DAILY

  return (
    <Modal open onClose={onClose} title="Quick add" size="2xl">
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); save() }}>
        <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 focus-within:ring-2 focus-within:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800">
          <Zap size={16} className="shrink-0 text-indigo-500" />
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={examples[0].text}
            aria-label="Type an entry"
            className="w-full bg-transparent py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100"
          />
          <Button type="submit" size="sm" disabled={!canSave} loading={saving} icon={<CornerDownLeft className="h-3.5 w-3.5" />}>Save</Button>
        </div>

        {preview}
        {serverError && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{serverError}</p>}

        <div className="rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Try</p>
          <div className="flex flex-col gap-1">
            {examples.map((ex) => (
              <button key={ex.text} type="button" onClick={() => setText(ex.text)}
                className="flex items-baseline gap-2 rounded-md px-1 py-0.5 text-left text-xs hover:bg-white dark:hover:bg-gray-800">
                <code className="font-semibold text-gray-700 dark:text-gray-200">{ex.text}</code>
                <span className="text-gray-400">{ex.hint}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            Add <code>yesterday</code> for another day{isAdmin && <>, <code>biz</code> for business</>}. Enter saves; the box stays open for the next one.
          </p>
        </div>
      </form>
    </Modal>
  )
}
