import { useState } from 'react'
import { ChartTooltip } from './chartKit'
import { AXIS_TEXT, BASELINE, GRID, SURFACE_STROKE, useSize, CHART_FILL, CHART_SLOT, MIN_CHART_HEIGHT } from './chartStyle'
import { niceTicks } from '@/lib/overview'

export interface AreaSeries {
  key: string
  label: string
  /** fill-* classes */
  fill: string
  /** bg-* classes for the tooltip swatch */
  dot: string
  values: number[]
}

interface Props {
  labels: string[]
  /** Hover titles ("November 2026"); defaults to labels */
  titles?: string[]
  series: AreaSeries[]
  /** Axis ticks and the end label */
  formatShort: (v: number) => string
  /** Tooltip values */
  formatFull: (v: number) => string
  totalLabel?: string
}

const PAD = { top: 12, right: 64, bottom: 22, left: 48 }

/**
 * Stacked areas over time with the total as a line on top. The first series sits at the bottom.
 * Negative parts are drawn as zero (the total line and tooltip still use the real numbers).
 */
export function StackedAreaChart({ labels, titles = labels, series, formatShort, formatFull, totalLabel = 'Total' }: Props) {
  const [ref, { width, height }] = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const n = labels.length

  const totals = labels.map((_, i) => series.reduce((s, ser) => s + ser.values[i], 0))
  const stackedTop = labels.map((_, i) => series.reduce((s, ser) => s + Math.max(0, ser.values[i]), 0))
  const ticks = niceTicks(Math.min(0, ...totals), Math.max(...stackedTop, ...totals))
  const yMin = ticks[0]
  const yMax = ticks[ticks.length - 1]

  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const plotH = height - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const y = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH

  // Cumulative bottoms/tops per series
  const layers = series.map((ser, si) => {
    const lower = labels.map((_, i) => series.slice(0, si).reduce((s, p) => s + Math.max(0, p.values[i]), 0))
    const upper = lower.map((l, i) => l + Math.max(0, ser.values[i]))
    const top = upper.map((v, i) => `${x(i)},${y(v)}`)
    const bottom = lower.map((v, i) => `${x(i)},${y(v)}`).reverse()
    return { ...ser, d: `M${top.join('L')}L${bottom.join('L')}Z` }
  })
  const totalPath = `M${totals.map((v, i) => `${x(i)},${y(v)}`).join('L')}`
  const last = n - 1

  const pick = (clientX: number, rect: DOMRect) => {
    if (n === 0 || plotW <= 0) return
    const rel = (clientX - rect.left - PAD.left) / plotW
    setHover(Math.max(0, Math.min(last, Math.round(rel * (n - 1)))))
  }

  return (
    <div className={CHART_SLOT} style={{ minHeight: MIN_CHART_HEIGHT }}>
      <div ref={ref} className={CHART_FILL}>
        {width > 0 && height > 0 && n > 0 && (
          <svg width={width} height={height} role="img" aria-label={`${totalLabel} by month`}
            onMouseMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
            onMouseLeave={() => setHover(null)}
            onTouchStart={(e) => pick(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} className={t === 0 ? BASELINE : GRID} />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className={AXIS_TEXT}>{formatShort(t)}</text>
              </g>
            ))}
            {labels.map((l, i) => (
              <text key={l + i} x={x(i)} y={height - 6} textAnchor="middle" className={AXIS_TEXT}>{l}</text>
            ))}
  
            {layers.map((l) => (
              <path key={l.key} d={l.d} className={[l.fill, SURFACE_STROKE].join(' ')} strokeWidth={1.5} strokeLinejoin="round" fillOpacity={0.85} />
            ))}
            <path d={totalPath} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-gray-800 dark:stroke-gray-100" />
  
            {/* Direct label: where the total is now */}
            <circle cx={x(last)} cy={y(totals[last])} r={4} strokeWidth={2} className={['fill-gray-800 dark:fill-gray-100', SURFACE_STROKE].join(' ')} />
            <text x={x(last) + 8} y={y(totals[last])} dy="0.32em" className="fill-gray-800 text-[11px] font-semibold dark:fill-gray-100">{formatShort(totals[last])}</text>
  
            {hover !== null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} strokeWidth={1} className="stroke-gray-400 dark:stroke-gray-500" />
                <circle cx={x(hover)} cy={y(totals[hover])} r={4} strokeWidth={2} className={['fill-gray-800 dark:fill-gray-100', SURFACE_STROKE].join(' ')} />
              </g>
            )}
          </svg>
        )}
        {hover !== null && width > 0 && (
          <ChartTooltip x={x(hover)} width={width} title={titles[hover]}
            rows={[
              ...[...series].reverse().map((s) => ({ label: s.label, value: formatFull(s.values[hover]), dot: s.dot })),
              { label: totalLabel, value: formatFull(totals[hover]), strong: true },
            ]} />
        )}
      </div>
    </div>
  )
}
