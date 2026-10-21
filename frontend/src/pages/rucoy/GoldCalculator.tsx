import { useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Calculator, Coins, Copy, RotateCcw, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useGolds } from '@/hooks/useGolds'
import { useRucoyDashboard } from '@/hooks/useRucoyDashboard'
import { formatWithCommas } from '@/utils/format'
import { toast } from '@/lib/toast'
import { readJson, STORAGE_KEYS, writeJson } from '@/lib/storage'

type Code = 'PHP' | 'USD' | 'EUR'

/**
 * How each currency is priced. PHP is quoted as gold per ₱1 (the old "÷10,000 ÷ 9.5" is ₱1 = 95,000 G);
 * USD/EUR as money per 1M G. Results are identical to the previous calculator.
 */
const CURRENCIES: Record<Code, {
  symbol: string; flag: string; label: string
  quote: 'gold-per-unit' | 'unit-per-million'
  defaultRate: number
  rateLabel: (r: string) => string
  text: string; soft: string; ring: string
}> = {
  PHP: { symbol: '₱', flag: '🇵🇭', label: 'Philippine Peso', quote: 'gold-per-unit',    defaultRate: 95000, rateLabel: (r) => `₱1 = ${Number(r || 0).toLocaleString()} G`, text: 'text-rose-600 dark:text-rose-400',     soft: 'bg-rose-50 dark:bg-rose-900/15',     ring: 'focus:ring-rose-400/40' },
  USD: { symbol: '$', flag: '🇺🇸', label: 'US Dollar',       quote: 'unit-per-million', defaultRate: 0.18,  rateLabel: (r) => `1M G = $${r || 0}`,                          text: 'text-sky-600 dark:text-sky-400',       soft: 'bg-sky-50 dark:bg-sky-900/15',       ring: 'focus:ring-sky-400/40' },
  EUR: { symbol: '€', flag: '🇪🇺', label: 'Euro',            quote: 'unit-per-million', defaultRate: 0.17,  rateLabel: (r) => `1M G = €${r || 0}`,                          text: 'text-violet-600 dark:text-violet-400', soft: 'bg-violet-50 dark:bg-violet-900/15', ring: 'focus:ring-violet-400/40' },
}
const CODES: Code[] = ['PHP', 'USD', 'EUR']
const QUICK = [100e6, 500e6, 1e9, 5e9]

const goldToMoney = (code: Code, gold: number, rate: number) =>
  CURRENCIES[code].quote === 'gold-per-unit' ? gold / rate : (gold / 1_000_000) * rate
const moneyToGold = (code: Code, money: number, rate: number) =>
  CURRENCIES[code].quote === 'gold-per-unit' ? money * rate : (money / rate) * 1_000_000

const fmtMoney = (n: number) => n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const shortG = (n: number) => (n >= 1e9 ? `${n / 1e9}B` : `${n / 1e6}M`)

function loadRates(): Record<Code, string> {
  const defaults = Object.fromEntries(CODES.map((c) => [c, String(CURRENCIES[c].defaultRate)])) as Record<Code, string>
  try {
    return { ...defaults, ...readJson<Partial<Record<Code, string>>>(STORAGE_KEYS.goldCalculatorRates, {}) }
  } catch { return defaults }
}

function NumberInput({ value, onChange, className, placeholder }: { value: string; onChange: (v: string) => void; className: string; placeholder?: string }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={formatWithCommas(value)}
      placeholder={placeholder}
      onChange={(e) => {
        const stripped = e.target.value.replace(/,/g, '')
        if (stripped === '' || /^\d*\.?\d*$/.test(stripped)) onChange(stripped)
      }}
      className={className}
    />
  )
}

export default function GoldCalculator() {
  const { totalGold } = useGolds()
  const { stats } = useRucoyDashboard()
  const tradesGold = Number(stats?.kks_gold ?? 0)

  const [mode, setMode]   = useState<'toMoney' | 'toGold'>('toMoney')
  const [gold, setGold]   = useState('')
  const [money, setMoney] = useState('')
  const [moneyCode, setMoneyCode] = useState<Code>('PHP')
  const [rates, setRates] = useState<Record<Code, string>>(loadRates)

  useEffect(() => {
    writeJson(STORAGE_KEYS.goldCalculatorRates, rates)
  }, [rates])

  const rateNum = (c: Code) => {
    const n = parseFloat(rates[c])
    return isNaN(n) || n <= 0 ? null : n
  }

  // The gold amount every result is based on
  const goldNum = useMemo(() => {
    if (mode === 'toMoney') {
      const n = parseFloat(gold)
      return isNaN(n) ? null : n
    }
    const m = parseFloat(money)
    const r = rateNum(moneyCode)
    return isNaN(m) || r == null ? null : moneyToGold(moneyCode, m, r)
  }, [mode, gold, money, moneyCode, rates]) // eslint-disable-line react-hooks/exhaustive-deps

  const switchMode = () => {
    // Carry the current value across so flipping keeps the same amount
    if (mode === 'toMoney' && goldNum != null) {
      const r = rateNum(moneyCode)
      if (r) setMoney(String(Math.round(goldToMoney(moneyCode, goldNum, r) * 100) / 100))
    } else if (mode === 'toGold' && goldNum != null) {
      setGold(String(Math.round(goldNum)))
    }
    setMode((m) => (m === 'toMoney' ? 'toGold' : 'toMoney'))
  }

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success(`Copied ${text}`)).catch(() => {})
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Gold calculator</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Convert Rucoy gold to ₱, $ and € — or work out how much gold a price needs</p>
        </div>
        <button onClick={() => setRates(Object.fromEntries(CODES.map((c) => [c, String(CURRENCIES[c].defaultRate)])) as Record<Code, string>)}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <RotateCcw size={14} /> Reset rates
        </button>
      </div>

      {/* ── Hero: the input ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />
        <div className="absolute -top-16 left-1/3 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/20">
                <Calculator className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {mode === 'toMoney' ? 'Gold amount' : 'Price you want'}
              </span>
            </div>
            <button onClick={switchMode}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/20 transition-colors">
              <ArrowDownUp size={12} /> {mode === 'toMoney' ? 'Money → Gold' : 'Gold → Money'}
            </button>
          </div>

          {mode === 'toMoney' ? (
            <>
              <div className="flex items-center gap-3 rounded-xl border-2 border-white/10 bg-white/10 px-4 py-3 focus-within:border-amber-400">
                <Coins className="h-6 w-6 shrink-0 text-amber-400" />
                <NumberInput value={gold} onChange={setGold} placeholder="e.g. 1,000,000,000"
                  className="w-full bg-transparent text-3xl font-bold text-white placeholder:text-slate-500 focus:outline-none caret-amber-400" />
                <span className="text-xl font-semibold text-amber-400/70">G</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => setGold(String(q))}
                    className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/20 transition-colors">
                    {shortG(q)}
                  </button>
                ))}
                <span className="mx-1 h-4 w-px bg-white/10" />
                <button onClick={() => setGold(String(Math.max(0, totalGold)))} disabled={totalGold <= 0}
                  title={totalGold <= 0 ? 'Your stash is empty or negative' : undefined}
                  className="rounded-lg bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-400/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Use stash ({totalGold.toLocaleString()} G)
                </button>
                {tradesGold > 0 && (
                  <button onClick={() => setGold(String(tradesGold))}
                    className="rounded-lg bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-400/25 transition-colors">
                    Use trades gold ({tradesGold.toLocaleString()} G)
                  </button>
                )}
                {gold && (
                  <button onClick={() => setGold('')} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:text-white">Clear</button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl border-2 border-white/10 bg-white/10 px-4 py-3 focus-within:border-amber-400">
                <select value={moneyCode} onChange={(e) => setMoneyCode(e.target.value as Code)}
                  className="rounded-lg bg-white/10 px-2 py-1 text-lg font-bold text-white focus:outline-none">
                  {CODES.map((c) => <option key={c} value={c} className="text-gray-900">{CURRENCIES[c].symbol} {c}</option>)}
                </select>
                <NumberInput value={money} onChange={setMoney} placeholder="e.g. 1,000"
                  className="w-full bg-transparent text-3xl font-bold text-white placeholder:text-slate-500 focus:outline-none caret-amber-400" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[500, 1000, 5000, 10000].map((q) => (
                  <button key={q} onClick={() => setMoney(String(q))}
                    className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/20 transition-colors">
                    {CURRENCIES[moneyCode].symbol}{q.toLocaleString()}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* What it comes to */}
          <div className="flex items-center gap-2 pt-3 border-t border-white/10">
            <TrendingUp className="h-3.5 w-3.5 text-amber-400/70" />
            {goldNum != null && goldNum > 0 ? (
              <p className="text-sm text-slate-300">
                {mode === 'toGold' && <>You need </>}
                <button onClick={() => copy(`${Math.round(goldNum).toLocaleString()} G`)} className="font-bold text-amber-300 hover:underline">
                  {Math.round(goldNum).toLocaleString()} G
                </button>
                {mode === 'toGold' && <> at {CURRENCIES[moneyCode].rateLabel(rates[moneyCode])}</>}
              </p>
            ) : (
              <p className="text-sm text-slate-500">{mode === 'toMoney' ? 'Enter gold to see what it’s worth' : 'Enter a price to see how much gold it takes'}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Results per currency ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CODES.map((code) => {
          const c = CURRENCIES[code]
          const r = rateNum(code)
          const value = goldNum != null && r != null ? goldToMoney(code, goldNum, r) : null
          const isSource = mode === 'toGold' && code === moneyCode
          return (
            <Card key={code} className={['flex flex-col overflow-hidden', isSource ? 'ring-2 ring-amber-400/60' : ''].join(' ')}>
              <div className={['flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60', c.soft].join(' ')}>
                <span className="text-xl">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{c.label}</p>
                  <p className={['text-[11px] font-semibold tracking-wide', c.text].join(' ')}>{code}{isSource && ' · your input'}</p>
                </div>
              </div>

              <button
                onClick={() => value != null && copy(`${c.symbol}${fmtMoney(value)}`)}
                disabled={value == null}
                title={value != null ? 'Click to copy' : undefined}
                className="group flex flex-col items-center justify-center gap-1 px-5 py-6 border-b border-gray-100 dark:border-gray-700/60 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 disabled:hover:bg-transparent transition-colors"
              >
                {value != null ? (
                  <>
                    <p className={['text-3xl font-bold tabular-nums tracking-tight', c.text].join(' ')}>{c.symbol}{fmtMoney(value)}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" /> {code} equivalent
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-gray-200 dark:text-gray-700">—</p>
                )}
              </button>

              <div className="px-5 py-4">
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {c.quote === 'gold-per-unit' ? `Gold per ${c.symbol}1` : `${c.symbol} per 1M G`}
                </label>
                <div className="flex items-center gap-2">
                  <NumberInput value={rates[code]} onChange={(v) => setRates((p) => ({ ...p, [code]: v }))}
                    className={['w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 transition-colors', c.ring].join(' ')} />
                  <span className="shrink-0 text-xs text-gray-400">{c.quote === 'gold-per-unit' ? 'G' : c.symbol}</span>
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">{c.rateLabel(rates[code])}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Quick reference ────────────────────────────────────────── */}
      <Card className="flex flex-col">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quick reference</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Common amounts at your current rates · click a row to load it</p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-700/60">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Gold</th>
                {CODES.map((c) => (
                  <th key={c} className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{CURRENCIES[c].flag} {c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
              {[10e6, 50e6, 100e6, 250e6, 500e6, 1e9, 2e9, 5e9].map((g) => (
                <tr key={g} onClick={() => { setMode('toMoney'); setGold(String(g)) }}
                  className={['cursor-pointer transition-colors hover:bg-amber-50/50 dark:hover:bg-amber-900/10', goldNum === g && mode === 'toMoney' ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''].join(' ')}>
                  <td className="px-5 py-2.5 font-semibold text-amber-600 dark:text-amber-400">{g.toLocaleString()} G</td>
                  {CODES.map((c) => {
                    const r = rateNum(c)
                    return (
                      <td key={c} className={['px-5 py-2.5 text-right font-medium tabular-nums', CURRENCIES[c].text].join(' ')}>
                        {r != null ? `${CURRENCIES[c].symbol}${fmtMoney(goldToMoney(c, g, r))}` : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
