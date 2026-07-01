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

function RateInput({
  label, symbol, value, onChange,
}: {
  label: string; symbol: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label} Rate</label>
      <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent transition-colors">
        <span className="px-3 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
          {symbol}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (v === '' || /^\d*\.?\d*$/.test(v)) onChange(v)
          }}
          className="flex-1 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none"
        />
      </div>
    </div>
  )
}

function ResultCard({
  label, symbol, amount, color,
}: {
  label: string; symbol: string; amount: number | null; color: string
}) {
  const formatted = amount === null
    ? '—'
    : symbol === '₱'
      ? `₱${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${symbol}${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Card className="flex flex-col gap-1 px-5 py-4">
      <p className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{formatted}</p>
    </Card>
  )
}

export default function GoldCalculator() {
  const { totalGold } = useGolds()

  const [gold, setGold] = useState('')
  const [phpRate, setPhpRate] = useState('9.5')
  const [usdRate, setUsdRate] = useState('0.18')
  const [eurRate, setEurRate] = useState('0.17')

  const goldNum = useMemo(() => {
    const n = parseFloat(gold.replace(/,/g, ''))
    return isNaN(n) ? null : n
  }, [gold])

  const calc = (rate: string) => {
    if (goldNum === null) return null
    const r = parseFloat(rate)
    if (isNaN(r)) return null
    return (goldNum / 1_000_000_000) * r
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

      {/* Gold Input */}
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

      {/* Rate Inputs */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Exchange Rates <span className="text-xs font-normal text-gray-400">(per 100M G — edit to update)</span></p>
        <div className="grid grid-cols-3 gap-4">
          <RateInput label="PHP" symbol="₱" value={phpRate} onChange={setPhpRate} />
          <RateInput label="USD" symbol="$" value={usdRate} onChange={setUsdRate} />
          <RateInput label="EUR" symbol="€" value={eurRate} onChange={setEurRate} />
        </div>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-3 gap-4">
        <ResultCard label="Philippine Peso" symbol="₱" amount={calc(phpRate)} color="text-blue-700 dark:text-blue-400" />
        <ResultCard label="US Dollar" symbol="$" amount={calc(usdRate)} color="text-emerald-700 dark:text-emerald-400" />
        <ResultCard label="Euro" symbol="€" amount={calc(eurRate)} color="text-indigo-700 dark:text-indigo-400" />
      </div>
    </div>
  )
}
