import { useCallback } from 'react'
import { buyersApi, type LikelyBuyer } from '@/api/business'
import { useAuth } from '@/context/auth'
import { can } from '@/lib/access'
import { useAsyncData } from './useAsyncData'

const NONE: Record<string, LikelyBuyer[]> = {}

/**
 * For each account for sale (by id): past buyers of a similar one. Buyers are part of Trading, so
 * without it (or if the request fails) every account simply has none.
 */
export function useLikelyBuyers(): Record<string, LikelyBuyer[]> {
  const { user } = useAuth()
  const allowed = can(user, 'trading')
  const load = useCallback(() => (allowed ? buyersApi.likely().catch(() => NONE) : Promise.resolve(NONE)), [allowed])
  return useAsyncData(load, NONE).data
}
