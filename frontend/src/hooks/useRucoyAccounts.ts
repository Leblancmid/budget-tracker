import { rucoyAccountsApi, type AccountPayload } from '@/api/rucoy'
import type { RucoyAccount } from '@/types'
import { useAsyncData } from './useAsyncData'

const NONE: RucoyAccount[] = []

export function useRucoyAccounts() {
  const { data: accounts, setData: setAccounts, loading, error, refetch } = useAsyncData(rucoyAccountsApi.getAll, NONE)

  const create = async (data: AccountPayload) => {
    const account = await rucoyAccountsApi.create(data)
    setAccounts((prev) => [account, ...prev])
    return account
  }

  const update = async (id: number, data: AccountPayload) => {
    const account = await rucoyAccountsApi.update(id, data)
    setAccounts((prev) => prev.map((a) => (a.id === id ? account : a)))
    return account
  }

  const archive = async (id: number) => {
    await rucoyAccountsApi.archive(id)
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  const unarchive = async (id: number) => {
    const account = await rucoyAccountsApi.unarchive(id)
    setAccounts((prev) => [account, ...prev])
  }

  const remove = async (id: number) => {
    await rucoyAccountsApi.delete(id)
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  return { accounts, loading, error, refetch, create, update, archive, unarchive, remove }
}
