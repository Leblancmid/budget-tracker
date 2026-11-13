import { useCallback } from 'react'
import { profileApi, usersApi, type DeviceSession, type AccountUser, type UserFilters, type UserPage } from '@/api/users'
import { useAsyncData } from './useAsyncData'

const EMPTY_PAGE: UserPage = {
  data: [], current_page: 1, last_page: 1, per_page: 10, from: null, to: null, total: 0,
  counts: { all: 0, admin: 0, daily_only: 0, deactivated: 0 },
}

/** One page of the user list for these filters. */
export function useUsers(filters: UserFilters) {
  const { search, role, status, page } = filters
  const load = useCallback(() => usersApi.list({ search, role, status, page }), [search, role, status, page])
  return useAsyncData<UserPage>(load, EMPTY_PAGE)
}

/** Your own account and the devices you're signed in on. */
export function useProfile() {
  return useAsyncData<{ user: AccountUser | null; sessions: DeviceSession[] }>(profileApi.get, { user: null, sessions: [] })
}
