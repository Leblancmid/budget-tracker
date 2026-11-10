import { useEffect, useState } from 'react'
import { readString, STORAGE_KEYS, writeString } from './storage'
import { todayManila } from '@/utils/format'

/** Monday (Y-m-d) of a Y-m-d date's week: a new weekly brief starts every Monday. */
export function mondayOf(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const back = (date.getUTCDay() + 6) % 7 // Mon → 0 … Sun → 6
  date.setUTCDate(date.getUTCDate() - back)
  return date.toISOString().slice(0, 10) // a UTC calendar date here, not a local time
}

/** The two weekly briefs: Business (Stats) and Daily Expenses (Dashboard). */
export type BriefKind = 'business' | 'daily'

const KEYS = { business: STORAGE_KEYS.briefSeenWeek, daily: STORAGE_KEYS.briefSeenWeekDaily } as const

const EVENT = 'app:brief-seen'

/** Remember that this week's brief was opened (clears its "new brief" dot). */
export function markBriefSeen(week: string, kind: BriefKind = 'business'): void {
  if (readString(KEYS[kind]) === week) return
  writeString(KEYS[kind], week)
  window.dispatchEvent(new Event(EVENT))
}

const isUnseen = (kind: BriefKind) => readString(KEYS[kind]) !== mondayOf(todayManila())

/** True while this week's brief (Manila time) hasn't been opened yet. */
export function useBriefUnseen(kind: BriefKind = 'business'): boolean {
  const [unseen, setUnseen] = useState(() => isUnseen(kind))
  useEffect(() => {
    const update = () => setUnseen(isUnseen(kind))
    window.addEventListener(EVENT, update)
    // A new week can start while the app stays open
    const timer = window.setInterval(update, 60 * 60 * 1000)
    return () => { window.removeEventListener(EVENT, update); window.clearInterval(timer) }
  }, [kind])
  return unseen
}
