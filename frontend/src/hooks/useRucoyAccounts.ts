import { useCallback, useEffect, useState } from 'react'
import { rucoyAccountsApi, type AccountPayload } from '@/api/rucoy'
import type { RucoyAccount } from '@/types'

export function useRucoyAccounts() {
  const [accounts, setAccounts] = useState<RucoyAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAccounts(await rucoyAccountsApi.getAll())
    } catch (err: unknown) {
      setError((err as { message: string }).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

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

  return { accounts, loading, error, refetch: fetch, create, update, archive, unarchive, remove }
}
