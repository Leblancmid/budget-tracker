import { useCallback } from 'react'
import { buyersApi, type BuyerSort, type BuyersPage } from '@/api/business'
import { useAsyncData } from './useAsyncData'

const EMPTY: BuyersPage = {
  data: [], current_page: 1, last_page: 1, per_page: 15, from: null, to: null, total: 0,
  summary: { buyers: 0, repeat: 0, repeat_share: null, repeat_sales_php: 0, total_php: 0 },
}

/** One page of the people you sell to, for this search and order. */
export function useBuyers({ q, sort, page }: { q: string; sort: BuyerSort; page: number }) {
  const load = useCallback(() => buyersApi.list({ q: q || undefined, sort, page }), [q, sort, page])
  return useAsyncData<BuyersPage>(load, EMPTY)
}
