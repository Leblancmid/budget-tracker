import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

let userId: number | null = 7
vi.mock('@/lib/authSession', () => ({
  loadSession: () => (userId === null ? null : { token: 't', user: { id: userId }, expiresAt: '' }),
  sessionToken: () => 't',
  clearSession: vi.fn(),
}))
vi.mock('@/lib/dataEvents', () => ({ emitDataChanged: vi.fn() }))

const { default: api } = await import('@/api/axios')
const { transactionsApi } = await import('@/api/transactions')
const { discardEntry, newClientId, queueEntry, refreshPending, retryEntry, syncPending } = await import('./outbox')
const { clearStore } = await import('./localStore')

/** What the fake server does with each POST */
let server: (body: Record<string, unknown>) => 'ok' | 'offline' | 'invalid' | 'down'
let posted: Record<string, unknown>[] = []
const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const body = JSON.parse(String(config.data ?? '{}'))
  const outcome = server(body)
  if (outcome === 'offline') throw Object.assign(new Error('Network Error'), { config, isAxiosError: true })
  if (outcome !== 'ok') {
    const status = outcome === 'invalid' ? 422 : 503
    const data = outcome === 'invalid' ? { message: 'Validation failed.', errors: { category_id: ['The selected category is invalid.'] } } : { message: 'Down' }
    throw Object.assign(new Error('Request failed'), { config, isAxiosError: true, response: { status, data, headers: {}, config, statusText: '' } })
  }
  posted.push(body)
  return { data: { id: posted.length, ...body }, status: 201, statusText: 'Created', headers: {}, config } as AxiosResponse
}
api.defaults.adapter = adapter

const entry = (description: string, amount = 100) =>
  ({ category_id: 1, type: 'expense', amount, description, date: '2026-11-10' })

describe('daily entries added offline', () => {
  beforeEach(async () => {
    userId = 7
    posted = []
    server = () => 'ok'
    await clearStore('outbox')
    await refreshPending()
  })

  it('saves straight away when online, with an id the server can recognise', async () => {
    const result = await transactionsApi.createOrQueue(entry('Lunch'))
    expect(result.queued).toBe(false)
    expect(posted[0].client_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(await refreshPending()).toEqual([])
  })

  it('keeps an entry on the device when offline, with the same id it tried to send', async () => {
    let tried: unknown
    server = (body) => { tried = body.client_id; return 'offline' }
    expect(await transactionsApi.createOrQueue(entry('Lunch'))).toEqual({ queued: true })
    const [waiting] = await refreshPending()
    expect(waiting).toMatchObject({ client_id: tried, user_id: 7, error: null, payload: { description: 'Lunch' } })
  })

  it('sends waiting entries in the order they were added, then forgets them', async () => {
    await queueEntry(entry('Second'), newClientId(), 2000)
    await queueEntry(entry('First'), newClientId(), 1000)

    expect(await syncPending()).toEqual({ sent: 2, refused: 0 })
    expect(posted.map((p) => p.description)).toEqual(['First', 'Second'])
    expect(await refreshPending()).toEqual([])
  })

  it('stops while still offline and keeps the rest for next time', async () => {
    await queueEntry(entry('A'), newClientId(), 1)
    await queueEntry(entry('B'), newClientId(), 2)
    server = (body) => (body.description === 'A' ? 'ok' : 'offline')

    expect(await syncPending()).toEqual({ sent: 1, refused: 0 })
    expect((await refreshPending()).map((e) => e.payload.description)).toEqual(['B'])
  })

  it('waits when the server is having trouble instead of giving up on the entry', async () => {
    await queueEntry(entry('A'))
    server = () => 'down'
    expect(await syncPending()).toEqual({ sent: 0, refused: 0 })
    expect((await refreshPending())[0].error).toBeNull()
  })

  it('marks an entry the server refuses with the reason, and carries on with the others', async () => {
    await queueEntry(entry('Bad'), newClientId(), 1)
    await queueEntry(entry('Good'), newClientId(), 2)
    server = (body) => (body.description === 'Bad' ? 'invalid' : 'ok')

    expect(await syncPending()).toEqual({ sent: 1, refused: 1 })
    const [bad] = await refreshPending()
    expect(bad.error).toBe('The selected category is invalid.')
    // Not sent again on its own…
    expect(await syncPending()).toEqual({ sent: 0, refused: 0 })
    // …only when asked to try again
    server = () => 'ok'
    expect(await retryEntry(bad)).toEqual({ sent: 1, refused: 0 })
  })

  it('can be discarded', async () => {
    const e = await queueEntry(entry('Oops'))
    await discardEntry(e)
    expect(await refreshPending()).toEqual([])
  })

  it('only shows and sends the signed-in user\'s entries', async () => {
    await queueEntry(entry('Mine'))
    userId = 8
    expect(await refreshPending()).toEqual([])
    expect(await syncPending()).toEqual({ sent: 0, refused: 0 })
    userId = 7
    expect((await refreshPending()).map((e) => e.payload.description)).toEqual(['Mine'])
  })
})
