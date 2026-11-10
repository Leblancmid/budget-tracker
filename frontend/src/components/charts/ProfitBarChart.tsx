import { useState } from 'react'
import { ChartTooltip } from './chartKit'
import { AXIS_TEXT, BASELINE, GRID, useSize, CHART_FILL, CHART_SLOT, MIN_CHART_HEIGHT } from './chartStyle'
import { niceTicks } from '@/lib/overview'

export interface BarSeries {
  key: string
  label: string
  fill: string
  dot: string
  values: number[]
}

interface Props {
  labels: string[]
  titles?: string[]
  /** Two series drawn side by side per month */
  series: [BarSeries, BarSeries]
  formatShort: (v: number) => string
  formatFull: (v: number) => string
  totalLabel?: string
  /** Month to emphasise (e.g. the current one) */
  highlight?: number
}

const PAD = { top: 12, right: 8, bottom: 22, left: 48 }

/** A bar from the zero line to `v`, square at the baseline and rounded (up to 4px) at the value end. */
function barPath(x: number, w: number, y0: number, y1: number): string {
  const h = Math.abs(y1 - y0)
  if (h < 0.5) return ''
  const r = Math.min(4, w / 2, h)
  if (y1 < y0) {
    // Up from the baseline
    return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`
  }
  return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`
}

/**
 * Two series per month as bars from zero (up = gain, down = loss), plus a short line marking the
 * month's total. Hovering a month shows both parts and the total.
 */
export function ProfitBarChart({ labels, titles = labels, series, formatShort, formatFull, totalLabel = 'Total', highlight }: Props) {
  const [ref, { width, height }] = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const n = labels.length

  const totals = labels.map((_, i) => series[0].values[i] + series[1].values[i])
  const all = [...series[0].values, ...series[1].values, ...totals]
  const ticks = niceTicks(Math.min(...all), Math.max(...all))
  const yMin = ticks[0]
  const yMax = ticks[ticks.length - 1]

  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const plotH = height - PAD.top - PAD.bottom
  const band = n ? plotW / n : 0
  const barW = Math.max(3, Math.min(18, band * 0.3))
  const gap = 2
  const groupW = barW * 2 + gap
  const y = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH
  const groupX = (i: number) => PAD.left + band * i + (band - groupW) / 2

  return (
    <div className={CHART_SLOT} style={{ minHeight: MIN_CHART_HEIGHT }}>
      <div ref={ref} className={CHART_FILL}>
        {width > 0 && height > 0 && n > 0 && (
          <svg width={width} height={height} role="img" aria-label={`${series[0].label} and ${series[1].label} by month`} onMouseLeave={() => setHover(null)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + plotW} y1={y(t)} y2={y(t)} className={t === 0 ? BASELINE : GRID} />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className={AXIS_TEXT}>{formatShort(t)}</text>
              </g>
            ))}
            {labels.map((l, i) => (
              <g key={l + i}>
                {/* Hover target: the whole month column, wider than the bars */}
                <rect x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} fill="transparent"
                  onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}
                  className={hover === i ? 'fill-gray-100/70 dark:fill-gray-800/60' : undefined} />
                <text x={PAD.left + band * i + band / 2} y={height - 6} textAnchor="middle"
                  className={[AXIS_TEXT, highlight === i ? '!fill-gray-700 font-semibold dark:!fill-gray-200' : ''].join(' ')}>{l}</text>
              </g>
            ))}
            <g pointerEvents="none">
              {labels.map((_, i) => (
                <g key={i}>
                  {series.map((s, si) => (
                    <path key={s.key} d={barPath(groupX(i) + si * (barW + gap), barW, y(0), y(s.values[i]))} className={s.fill} />
                  ))}
                  {/* The month's total (none for a month with nothing in it) */}
                  {(series[0].values[i] !== 0 || series[1].values[i] !== 0) && (
                    <line x1={groupX(i) - 3} x2={groupX(i) + groupW + 3} y1={y(totals[i])} y2={y(totals[i])}
                      strokeWidth={2} strokeLinecap="round" className="stroke-gray-800 dark:stroke-gray-100" />
                  )}
                </g>
              ))}
            </g>
          </svg>
        )}
        {hover !== null && width > 0 && (
          <ChartTooltip x={PAD.left + band * hover + band / 2} width={width} title={titles[hover]}
            rows={[
              ...series.map((s) => ({ label: s.label, value: formatFull(s.values[hover]), dot: s.dot })),
              { label: totalLabel, value: formatFull(totals[hover]), strong: true },
            ]} />
        )}
      </div>
    </div>
  )
}
