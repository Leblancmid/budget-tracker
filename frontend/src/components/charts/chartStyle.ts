import { useEffect, useRef, useState } from 'react'

/**
 * Shared bits for the hand-drawn SVG charts: the container size (charts redraw to fit,
 * so text never stretches) and the recessive axis styling.
 */

/** Size of the element, kept up to date as it resizes. */
export function useSize<T extends HTMLElement>(): [React.RefObject<T | null>, { width: number; height: number }] {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setSize({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size]
}

/**
 * Where a chart sits: it fills the slot it's given (at least `MIN_CHART_HEIGHT` tall), so a card
 * stretched to match its neighbour shows a bigger chart instead of empty space.
 */
export const MIN_CHART_HEIGHT = 220
export const CHART_SLOT = 'relative w-full flex-1'
export const CHART_FILL = 'absolute inset-0'

/** Recessive grid and axis text */
export const GRID = 'stroke-gray-100 dark:stroke-gray-800'
export const BASELINE = 'stroke-gray-300 dark:stroke-gray-600'
export const AXIS_TEXT = 'fill-gray-400 text-[10px] dark:fill-gray-500'
/** The card surface, used for the 2px gaps between touching fills */
export const SURFACE_STROKE = 'stroke-white dark:stroke-gray-900'
