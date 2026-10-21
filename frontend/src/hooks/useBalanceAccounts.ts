import { balanceAccountsApi, type BalanceAccountPayload } from '@/api/master'
import type { BalanceAccountConfig } from '@/types'
import { useAsyncData } from './useAsyncData'

const NONE: BalanceAccountConfig[] = []

export function useBalanceAccounts() {
  const { data: accounts, setData: setAccounts, loading, refetch } = useAsyncData(balanceAccountsApi.getAll, NONE)

  const create = async (data: BalanceAccountPayload) => {
    const a = await balanceAccountsApi.create(data)
    setAccounts((prev) => [...prev, a])
    return a
  }

  const update = async (id: number, data: Partial<BalanceAccountPayload> & { hidden?: boolean }) => {
    const a = await balanceAccountsApi.update(id, data)
    setAccounts((prev) => prev.map((x) => (x.id === id ? a : x)))
    return a
  }

  const reorder = async (ids: number[]) => {
    // Optimistic: reorder locally first, then sync with the server's order
    setAccounts((prev) => ids.map((id) => prev.find((a) => a.id === id)!).filter(Boolean))
    setAccounts(await balanceAccountsApi.reorder(ids))
  }

  const remove = async (id: number) => {
    await balanceAccountsApi.delete(id)
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  return { accounts, loading, refetch, create, update, reorder, remove }
}
