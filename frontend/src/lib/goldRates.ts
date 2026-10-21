import { readNumber, STORAGE_KEYS } from './storage'

/** Defaults until rates are set on Master → Overview: 1M G = $0.22, $1 = ₱61. */
export const DEFAULT_USD_PER_MILLION_GOLD = 0.22
export const DEFAULT_PHP_PER_USD          = 61

/** The rates saved on Master → Overview (also used for the sidebar net worth). */
export function savedGoldRates(): { usdRate: number; phpRate: number } {
  return {
    usdRate: readNumber(STORAGE_KEYS.masterUsdRate, DEFAULT_USD_PER_MILLION_GOLD),
    phpRate: readNumber(STORAGE_KEYS.masterPhpRate, DEFAULT_PHP_PER_USD),
  }
}

/** ₱ value of `gold` G at $usdRate per 1M G and ₱phpRate per $. */
export const goldToPhp = (gold: number, usdRate: number, phpRate: number) => (gold / 1_000_000) * usdRate * phpRate
