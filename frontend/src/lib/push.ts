import api from '@/api/axios'

/**
 * Phone alerts (web push) for this device: whether it can get them, and turning them on and off.
 * On iPhone they only work in the app added to the Home Screen (iOS 16.4+), not in Safari itself.
 */

export type PushState =
  | 'unsupported'      // this browser can't get alerts
  | 'needs-install'    // iPhone/iPad in Safari: add to Home Screen first
  | 'blocked'          // the person said no; only the phone's settings can undo that
  | 'off'
  | 'on'

export interface PushInfo { configured: boolean; public_key: string | null; devices: number }

const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const installed = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  return (await navigator.serviceWorker.getRegistration()) ?? null
}

/** Where this device stands. */
export async function pushState(): Promise<PushState> {
  if (!supported()) return isIos() && !installed() ? 'needs-install' : 'unsupported'
  if (Notification.permission === 'denied') return 'blocked'
  const reg = await registration()
  const sub = await reg?.pushManager.getSubscription()
  return sub ? 'on' : 'off'
}

/** The server's public key as the browser wants it */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

const NO_QUEUE = { offlineQueue: false } as const

export const pushApi = {
  info: () => api.get<PushInfo>('/profile/push').then((r) => r.data),
  test: () => api.post<{ message: string }>('/profile/push/test', null, NO_QUEUE).then((r) => r.data.message),
}

/** Ask permission and sign this device up. Throws a plain message when it can't. */
export async function turnOn(publicKey: string): Promise<void> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Alerts weren\'t allowed. You can allow them in this device\'s settings.')
  const reg = (await registration()) ?? (await navigator.serviceWorker.ready)
  const existing = await reg.pushManager.getSubscription()
  const sub = existing ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) })
  await api.post('/profile/push', sub.toJSON(), NO_QUEUE)
}

export async function turnOff(): Promise<void> {
  const reg = await registration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  await api.delete('/profile/push', { data: { endpoint: sub.endpoint }, ...NO_QUEUE })
  await sub.unsubscribe()
}
