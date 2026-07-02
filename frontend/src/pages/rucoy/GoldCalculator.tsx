import { useState, useMemo } from 'react'
import { Calculator, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useGolds } from '@/hooks/useGolds'

function formatWithCommas(raw: string): string {
  if (!raw) return ''
  const [integer, decimal] = raw.split('.')
  return decimal !== undefined
    ? `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimal}`
    : integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

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
      className="block w-full rounded-lg border border-gray-300 hover:border-gray-400 bg-white px-4 py-3 text-lg font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:placeholder:text-gray-600 transition-colors"
    />
  )
}

function NumInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={formatWithCommas(value)}
      onChange={(e) => {
        const stripped = e.target.value.replace(/,/g, '')
        if (stripped === '' || /^\d*\.?\d*$/.test(stripped)) onChange(stripped)
      }}
      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
    />
  )
}

interface CurrencyConfig {
  symbol: string
  label: string
  divisor: string
  multiplier: string
  operation: 'multiply' | 'divide'
  color: string
  resultColor: string
}

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

  const formulaLabel = config.operation === 'divide'
    ? 'gold ÷ div ÷ rate'
    : 'gold ÷ div × rate'

  const formatted = result === null
    ? '—'
    : `${config.symbol}${result.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <p className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>{config.label}</p>
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
          {formulaLabel}
        </span>
      </div>

      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rate ({config.symbol})</p>
        <NumInput value={config.multiplier} onChange={onMultiplierChange} />
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
        <p className={`text-2xl font-bold ${config.resultColor}`}>{formatted}</p>
      </div>
    </Card>
  )
}

export default function GoldCalculator() {
  const { totalGold } = useGolds()

  const [gold, setGold] = useState('')

  const [configs, setConfigs] = useState<CurrencyConfig[]>([
    { symbol: '₱', label: 'Philippine Peso', divisor: '10000', multiplier: '9.5',  operation: 'divide'   as const, color: 'text-blue-600 dark:text-blue-400',    resultColor: 'text-blue-700 dark:text-blue-400'    },
    { symbol: '$', label: 'US Dollar',        divisor: '1000000', multiplier: '0.18', operation: 'multiply' as const, color: 'text-emerald-600 dark:text-emerald-400', resultColor: 'text-emerald-700 dark:text-emerald-400' },
    { symbol: '€', label: 'Euro',             divisor: '1000000', multiplier: '0.17', operation: 'multiply' as const, color: 'text-indigo-600 dark:text-indigo-400',  resultColor: 'text-indigo-700 dark:text-indigo-400'  },
  ])

  const goldNum = useMemo(() => {
    const n = parseFloat(gold.replace(/,/g, ''))
    return isNaN(n) ? null : n
  }, [gold])

  const updateConfig = (i: number, field: 'divisor' | 'multiplier', value: string) => {
    setConfigs((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  const loadCurrentGold = () => {
    if (totalGold > 0) setGold(String(totalGold))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gold Calculator</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Calculate the real-world value of your Rucoy gold</p>
        </div>
        <button
          onClick={loadCurrentGold}
          disabled={totalGold === 0}
          className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
        >
          <RefreshCw size={14} />
          Use Current Gold
        </button>
      </div>

      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Calculator size={16} className="text-amber-500" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Rucoy Gold Amount</p>
        </div>
        <GoldInput value={gold} onChange={setGold} />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {goldNum !== null ? `${goldNum.toLocaleString()} G` : 'Enter an amount to calculate'}
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {configs.map((cfg, i) => (
          <CurrencyCard
            key={cfg.symbol}
            config={cfg}
            goldNum={goldNum}
            onMultiplierChange={(v) => updateConfig(i, 'multiplier', v)}
          />
        ))}
      </div>
    </div>
  )
}
