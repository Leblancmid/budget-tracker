import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

let userId: number | null = 7
vi.mock('@/lib/authSession', () => ({
  loadSession: () => (userId === null ? null : { token: 't', user: { id: userId }, expiresAt: '' }),
  sessionToken: () => 't',
  clearSession: vi.fn(),
}))

const { default: api, offlineKey, OFFLINE_TIMEOUT_MS, READ_TIMEOUT_MS, UPLOAD_TIMEOUT_MS, WRITE_TIMEOUT_MS } = await import('./axios')
const { getOfflineStatus, markOnline } = await import('@/lib/offline/offlineStatus')
const { clearResponses, pruneResponses, responseKey, saveResponse, savedResponse } = await import('@/lib/offline/responseCache')

let online = true
let calls = 0
let lastConfig: InternalAxiosRequestConfig | null = null
const adapter: AxiosAdapter = async (config) => {
  calls++
  lastConfig = config
  if (!online) throw Object.assign(new Error('Network Error'), { config, isAxiosError: true })
  return { data: { month: config.params?.month ?? null, call: calls }, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse
}
api.defaults.adapter = adapter
const settle = () => new Promise((r) => setTimeout(r, 0))

describe('offline viewing', () => {
  beforeEach(async () => {
    online = true
    userId = 7
    markOnline()
    await clearResponses()
  })

  it('shows the last saved copy of a page when there is no connection', async () => {
    const fresh = await api.get('/dashboard', { params: { month: 11 } })
    await settle()

    online = false
    const offline = await api.get('/dashboard', { params: { month: 11 } })
    expect(offline.data).toEqual(fresh.data)
    expect(offline.statusText).toBe('Saved copy')
    expect(getOfflineStatus().offline).toBe(true)
    expect(getOfflineStatus().showingSince).toEqual(expect.any(Number))
  })

  it('keeps each set of filters apart', async () => {
    await api.get('/dashboard', { params: { month: 10 } })
    await settle()
    online = false
    await expect(api.get('/dashboard', { params: { month: 11 } })).rejects.toMatchObject({
      message: 'You\'re offline, and this page hasn\'t been opened on this device yet.',
    })
  })

  it('says changes need a connection', async () => {
    online = false
    await expect(api.post('/transactions', {})).rejects.toMatchObject({ message: 'You\'re offline. This needs an internet connection.' })
    expect(getOfflineStatus()).toEqual({ offline: true, showingSince: null })
  })

  it('goes back online with the next answer from the server', async () => {
    online = false
    await api.get('/x').catch(() => {})
    online = true
    await api.get('/x')
    expect(getOfflineStatus()).toEqual({ offline: false, showingSince: null })
  })

  it('never shows one user\'s saved pages to another', async () => {
    await api.get('/dashboard')
    await settle()
    userId = 8
    online = false
    await expect(api.get('/dashboard')).rejects.toBeTruthy()
  })

  it('only keeps JSON reads, not logins or downloads', () => {
    expect(offlineKey({ method: 'get', url: '/dashboard', params: { month: 11 } })).toBe(responseKey(7, '/api/v1/dashboard?month=11'))
    expect(offlineKey({ method: 'post', url: '/transactions' })).toBeNull()
    expect(offlineKey({ method: 'get', url: '/auth/me' })).toBeNull()
    expect(offlineKey({ method: 'get', url: '/reports/export', responseType: 'blob' })).toBeNull()
    userId = null
    expect(offlineKey({ method: 'get', url: '/dashboard' })).toBeNull()
  })

  it('drops copies older than 60 days', async () => {
    const now = Date.parse('2026-11-10T00:00:00Z')
    await saveResponse('7|old', 1, now - 61 * 86_400_000)
    await saveResponse('7|new', 2, now - 59 * 86_400_000)
    expect(await pruneResponses(now)).toBe(1)
    expect(await savedResponse('7|old')).toBeUndefined()
    expect((await savedResponse('7|new'))?.data).toBe(2)
  })
})

describe('not waiting long without a connection', () => {
  beforeEach(async () => {
    online = true
    userId = 7
    markOnline()
    await clearResponses()
    vi.unstubAllGlobals()
  })

  it('gives reads, changes and uploads a time limit', async () => {
    await api.get('/dashboard')
    expect(lastConfig?.timeout).toBe(READ_TIMEOUT_MS)
    await api.post('/business/transactions', { a: 1 })
    expect(lastConfig?.timeout).toBe(WRITE_TIMEOUT_MS)
    await api.post('/rucoy/accounts', new FormData())
    expect(lastConfig?.timeout).toBe(UPLOAD_TIMEOUT_MS)
    expect(WRITE_TIMEOUT_MS).toBeLessThanOrEqual(15_000)
  })

  it('gives up sooner once it already knows there is no connection', async () => {
    online = false
    await api.get('/x').catch(() => {})
    online = true
    await api.post('/business/transactions', { a: 1 }).catch(() => {})
    expect(lastConfig?.timeout).toBe(OFFLINE_TIMEOUT_MS)
    // That one got through, so the normal limit is back
    await api.post('/business/transactions', { a: 1 })
    expect(lastConfig?.timeout).toBe(WRITE_TIMEOUT_MS)
  })

  it('sends every change that can be kept with an Idempotency-Key, but never sign-in', async () => {
    await api.post('/business/transactions', { a: 1 })
    const first = lastConfig?.headers['Idempotency-Key']
    expect(first).toMatch(/^[0-9a-f-]{36}$/)
    await api.post('/business/transactions', { a: 1 })
    expect(lastConfig?.headers['Idempotency-Key']).not.toBe(first)
    await api.get('/dashboard')
    expect(lastConfig?.headers['Idempotency-Key']).toBeUndefined()
    await api.post('/auth/login', { email: 'x' })
    expect(lastConfig?.headers['Idempotency-Key']).toBeUndefined()
  })

  it('fails straight away, without sending, when the device has no network', async () => {
    await api.get('/dashboard', { params: { month: 11 } })
    await settle()
    vi.stubGlobal('navigator', { onLine: false })
    const before = calls

    const saved = await api.get('/dashboard', { params: { month: 11 } })
    expect(saved.statusText).toBe('Saved copy')
    await expect(api.post('/transactions', {})).rejects.toMatchObject({ offline: true })
    expect(calls).toBe(before)
    expect(getOfflineStatus().offline).toBe(true)
  })
})
