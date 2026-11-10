import type { ReactNode } from 'react'

/**
 * Share of a whole as a ring, with a 2px gap between segments and the headline in the middle.
 * Only positive values take part (a negative part has no share to show).
 */
export function Donut({ parts, size = 148, thickness = 14, label, children }: {
  /** stroke-* classes per part */
  parts: { key: string; value: number; stroke: string }[]
  size?: number
  thickness?: number
  label: string
  children?: ReactNode
}) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const shown = parts.filter((p) => p.value > 0)
  const total = shown.reduce((s, p) => s + p.value, 0)
  const gap = shown.length > 1 ? 2 : 0
  let offset = 0

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90" role="img" aria-label={label}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-gray-100 dark:stroke-gray-800" />
        {total > 0 && shown.map((p) => {
          const len = (p.value / total) * c
          const seg = (
            <circle key={p.key} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className={p.stroke}
              strokeDasharray={`${Math.max(0, len - gap)} ${c}`} strokeDashoffset={-offset} />
          )
          offset += len
          return seg
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

/** A small trend line for a stat tile: 2px line, a dot on the latest value. */
export function Sparkline({ values, width = 96, height = 32, className = 'stroke-violet-500' }: { values: number[]; width?: number; height?: number; className?: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = 4
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2)
  const y = (v: number) => pad + (height - pad * 2) * (max === min ? 0.5 : 1 - (v - min) / (max - min))
  const last = values.length - 1
  return (
    <svg width={width} height={height} aria-hidden="true" className="shrink-0">
      <path d={`M${values.map((v, i) => `${x(i)},${y(v)}`).join('L')}`} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className={className} />
      <circle cx={x(last)} cy={y(values[last])} r={3} className={className.replace(/stroke-/g, 'fill-')} />
    </svg>
  )
}
