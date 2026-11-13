import api from './axios'

export interface AppNotification {
  id: string
  /** access | details | password | reactivated */
  kind: string
  title: string
  body: string
  /** Who did it (an admin's name) */
  by: string
  read_at: string | null
  created_at: string
}

export const notificationsApi = {
  list: () => api.get<{ data: AppNotification[]; unread: number }>('/notifications').then((r) => r.data),
  read: (id: string) => api.post<{ unread: number }>(`/notifications/${id}/read`, null, { offlineQueue: false }).then((r) => r.data.unread),
  readAll: () => api.post<{ unread: number }>('/notifications/read-all', null, { offlineQueue: false }).then((r) => r.data.unread),
}
