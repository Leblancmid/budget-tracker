import { useCallback, useEffect, useState } from 'react'
import { rucoyAccountsApi } from '@/api/rucoy'
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

  const create = async (data: { description?: string; email: string; avatar?: string }) => {
    const account = await rucoyAccountsApi.create(data)
    setAccounts((prev) => [account, ...prev])
    return account
  }

  const update = async (id: number, data: Partial<Parameters<typeof create>[0]>) => {
    const account = await rucoyAccountsApi.update(id, data)
    setAccounts((prev) => prev.map((a) => (a.id === id ? account : a)))
    return account
  }

  const remove = async (id: number) => {
    await rucoyAccountsApi.delete(id)
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  return { accounts, loading, error, refetch: fetch, create, update, remove }
}
