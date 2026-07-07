import { useState, useMemo } from 'react'
import { Calculator, Coins, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useGolds } from '@/hooks/useGolds'
import { formatWithCommas } from '@/utils/format'

function GoldInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={formatWithCommas(value)}
      onChange={(e) => {
        const stripped = e.target.value.replace(/,/g, '')
        if (stripped === '' || /^\d*\.?\d*$/.test(stripped)) onChange(stripped)
      }}
      placeholder="e.g. 1,000,000,000"
      className={[
        'block w-full rounded-xl border-2 bg-white/10 px-4 py-3 text-xl font-bold text-white placeholder:text-slate-500',
        'focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400 border-white/10',
        'transition-colors caret-amber-400',
      ].join(' ')}
    />
  )
}

function RateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={formatWithCommas(value)}
      onChange={(e) => {
        const stripped = e.target.value.replace(/,/g, '')
        if (stripped === '' || /^\d*\.?\d*$/.test(stripped)) onChange(stripped)
      }}
      className={[
        'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
        'px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 font-medium',
        'focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-colors',
      ].join(' ')}
    />
  )
}

interface CurrencyConfig {
  symbol: string
  flag: string
  label: string
  code: string
  divisor: string
  multiplier: string
  operation: 'multiply' | 'divide'
  resultColor: string
  accentBg: string
  accentText: string
}

const INITIAL_CONFIGS: CurrencyConfig[] = [
  {
    symbol: '₱', flag: '🇵🇭', label: 'Philippine Peso', code: 'PHP',
    divisor: '10000', multiplier: '9.5', operation: 'divide',
    resultColor: 'text-rose-600 dark:text-rose-400',
    accentBg: 'bg-rose-50 dark:bg-rose-900/20',
    accentText: 'text-amber-500 dark:text-amber-400',
  },
  {
    symbol: '$', flag: '🇺🇸', label: 'US Dollar', code: 'USD',
    divisor: '1000000', multiplier: '0.18', operation: 'multiply',
    resultColor: 'text-sky-600 dark:text-sky-400',
    accentBg: 'bg-sky-50 dark:bg-sky-900/20',
    accentText: 'text-emerald-500 dark:text-emerald-400',
  },
  {
    symbol: '€', flag: '🇪🇺', label: 'Euro', code: 'EUR',
    divisor: '1000000', multiplier: '0.17', operation: 'multiply',
    resultColor: 'text-violet-600 dark:text-violet-400',
    accentBg: 'bg-violet-50 dark:bg-violet-900/20',
    accentText: 'text-violet-500 dark:text-violet-400',
  },
]

function CurrencyCard({
  config,
  goldNum,
  onMultiplierChange,
}: {
  config: CurrencyConfig
  goldNum: number | null
  onMultiplierChange: (v: string) => void
}) {
  const result = useMemo(() => {
    if (goldNum === null) return null
    const d = parseFloat(config.divisor)
    const m = parseFloat(config.multiplier)
    if (isNaN(d) || isNaN(m) || d === 0 || m === 0) return null
    return config.operation === 'divide'
      ? (goldNum / d) / m
      : (goldNum / d) * m
  }, [goldNum, config.divisor, config.multiplier, config.operation])

  const formatted = result === null
    ? null
    : result.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const formula = config.operation === 'divide' ? 'G ÷ div ÷ rate' : 'G ÷ div × rate'

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Header */}
      <div className={['flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700/60', config.accentBg].join(' ')}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{config.label}</p>
          <p className={['text-[11px] font-semibold tracking-wide', config.accentText].join(' ')}>{config.code}</p>
        </div>
        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 shrink-0">{formula}</span>
      </div>

      {/* Result */}
      <div className="flex flex-col items-center justify-center py-6 px-5 gap-1 border-b border-gray-100 dark:border-gray-700/60">
        {formatted ? (
          <>
            <p className={['text-3xl font-bold tabular-nums tracking-tight', config.resultColor].join(' ')}>
              {config.symbol}{formatted}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {config.code} equivalent
            </p>
          </>
        ) : (
          <p className="text-2xl font-bold text-gray-200 dark:text-gray-700">—</p>
        )}
      </div>

      {/* Rate input */}
      <div className="px-5 py-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">
          Rate ({config.symbol} per unit)
        </label>
        <RateInput value={config.multiplier} onChange={onMultiplierChange} />
      </div>
    </Card>
  )
}

export default function GoldCalculator() {
  const { totalGold } = useGolds()

  const [gold, setGold] = useState('')
  const [configs, setConfigs] = useState<CurrencyConfig[]>(INITIAL_CONFIGS)

  const goldNum = useMemo(() => {
    const n = parseFloat(gold.replace(/,/g, ''))
    return isNaN(n) ? null : n
  }, [gold])

  const updateConfig = (i: number, value: string) => {
    setConfigs((prev) => prev.map((c, idx) => idx === i ? { ...c, multiplier: value } : c))
  }

  const loadCurrentGold = () => {
    if (totalGold > 0) setGold(String(totalGold))
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Hero input banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-6 shadow-lg shadow-slate-900/30 dark:shadow-black/40">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/[0.03]" />

        <div className="relative flex flex-col gap-4">
          {/* Label row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/20">
                <Calculator className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Gold Amount
              </span>
            </div>
            <button
              onClick={loadCurrentGold}
              disabled={totalGold === 0}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/8 hover:bg-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw size={11} />
              Use Current Gold
            </button>
          </div>

          {/* Input */}
          <GoldInput value={gold} onChange={setGold} />

          {/* Parsed display */}
          <div className="flex items-center gap-2">
            <Coins className="h-3.5 w-3.5 text-amber-400/60" />
            <p className="text-xs text-slate-400">
              {goldNum !== null
                ? <span className="text-amber-400 font-semibold">{goldNum.toLocaleString()} G</span>
                : 'Enter a gold amount to see conversions below'}
            </p>
          </div>
        </div>
      </div>

      {/* Currency cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {configs.map((cfg, i) => (
          <CurrencyCard
            key={cfg.symbol}
            config={cfg}
            goldNum={goldNum}
            onMultiplierChange={(v) => updateConfig(i, v)}
          />
        ))}
      </div>

    </div>
  )
}
