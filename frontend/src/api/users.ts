import api from './axios'
import { MULTIPART } from './rucoy'
import type { AuthUser, Module, UserRole } from '@/context/auth'

/** A user as the profile page and the user list see them. */
export interface AccountUser extends AuthUser {
  modules: Module[]
  avatar_url: string | null
  deactivated_at: string | null
  created_at: string | null
  /** When any of their devices last used the app */
  last_active_at: string | null
  /** This is the person looking */
  is_self: boolean
}

export interface DeviceSession {
  id: number
  /** The browser's user agent */
  device: string
  created_at: string | null
  last_used_at: string | null
  expires_at: string | null
  current: boolean
}

export interface UserCounts {
  all: number
  admin: number
  trader: number
  daily_only: number
  deactivated: number
}

export interface UserPage {
  data: AccountUser[]
  current_page: number
  last_page: number
  per_page: number
  from: number | null
  to: number | null
  total: number
  counts: UserCounts
}

export interface UserFilters {
  search?: string
  role?: UserRole | ''
  status?: 'active' | 'deactivated' | ''
  page?: number
}

export interface UserInput {
  name: string
  email: string
  role: UserRole
  /** Modules picked for this person (left out: their role's) */
  modules?: Module[]
  password?: string
}

export const profileApi = {
  get: () => api.get<{ user: AccountUser; sessions: DeviceSession[] }>('/profile').then((r) => r.data),
  update: (data: Partial<Pick<AccountUser, 'name' | 'email'>>) =>
    api.patch<{ user: AccountUser }>('/profile', data).then((r) => r.data.user),
  uploadAvatar: (file: Blob) => {
    const form = new FormData()
    // The server stores it under its own name; this one only says what kind of image it is
    form.append('avatar', file, file.type === 'image/png' ? 'avatar.png' : file.type === 'image/jpeg' ? 'avatar.jpg' : 'avatar.webp')
    return api.post<{ user: AccountUser }>('/profile/avatar', form, MULTIPART).then((r) => r.data.user)
  },
  removeAvatar: () => api.delete<{ user: AccountUser }>('/profile/avatar').then((r) => r.data.user),
  changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    api.put<{ message: string }>('/profile/password', data).then((r) => r.data.message),
  signOutDevice: (id: number) => api.delete<{ message: string }>(`/profile/sessions/${id}`).then((r) => r.data.message),
}

/** One thing a person did (from the activity log) */
export interface UserActivity {
  id: number
  module: string
  type: string
  description: string | null
  amount: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface UserDetail {
  user: AccountUser
  sessions: DeviceSession[]
  failed_sign_ins: {
    last_30_days: number
    recent: { type: string; description: string | null; ip_address: string | null; user_agent: string | null; created_at: string }[]
  }
  activity: UserActivity[]
}

export const usersApi = {
  get: (id: number) => api.get<UserDetail>(`/users/${id}`).then((r) => r.data),
  signOutDevice: (id: number, token: number) => api.delete<{ message: string }>(`/users/${id}/sessions/${token}`).then((r) => r.data.message),
  signOutEverywhere: (id: number) => api.post<{ message: string }>(`/users/${id}/sign-out-everywhere`).then((r) => r.data.message),
  list: (filters: UserFilters) => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null))
    return api.get<UserPage>('/users', { params }).then((r) => r.data)
  },
  create: (data: UserInput) => api.post<{ user: AccountUser }>('/users', data).then((r) => r.data.user),
  update: (id: number, data: Partial<UserInput>) => api.patch<{ user: AccountUser }>(`/users/${id}`, data).then((r) => r.data.user),
  setPassword: (id: number, password: string) => api.put<{ message: string }>(`/users/${id}/password`, { password }).then((r) => r.data.message),
  deactivate: (id: number) => api.post<{ user: AccountUser }>(`/users/${id}/deactivate`).then((r) => r.data.user),
  reactivate: (id: number) => api.post<{ user: AccountUser }>(`/users/${id}/reactivate`).then((r) => r.data.user),
}
