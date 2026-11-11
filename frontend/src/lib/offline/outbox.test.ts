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
const { discardEntry, kindOf, newClientId, queueChange, queueEntry, refreshPending, syncPending } = await import('./outbox')

/** You approve everything waiting */
const approveAll = async () => syncPending((await refreshPending()).map((e) => e.client_id))
const { clearStore } = await import('./localStore')

/** What the fake server does with each request */
let server: (body: Record<string, unknown>, method: string, url: string) => 'ok' | 'offline' | 'invalid' | 'down' | 'gone'
let posted: Record<string, unknown>[] = []
/** Every request that got through, as "METHOD url" */
let requests: string[] = []
/** Idempotency-Key of each request that got through */
let keys: (string | undefined)[] = []
let bodies: unknown[] = []
const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const body = config.data instanceof FormData ? Object.fromEntries(config.data.entries()) : JSON.parse(String(config.data ?? '{}'))
  const method = (config.method ?? 'get').toUpperCase()
  const outcome = server(body, method, config.url ?? '')
  if (outcome === 'offline') throw Object.assign(new Error('Network Error'), { config, isAxiosError: true })
  if (outcome !== 'ok') {
    const status = outcome === 'invalid' ? 422 : outcome === 'gone' ? 404 : 503
    const data = outcome === 'invalid' ? { message: 'Validation failed.', errors: { category_id: ['The selected category is invalid.'] } } : { message: 'Down' }
    throw Object.assign(new Error('Request failed'), { config, isAxiosError: true, response: { status, data, headers: {}, config, statusText: '' } })
  }
  requests.push(`${method} ${config.url}`)
  keys.push(config.headers?.['Idempotency-Key'] as string | undefined)
  bodies.push(config.data)
  if (method === 'POST') posted.push(body)
  return { data: { id: posted.length, ...body }, status: 201, statusText: 'Created', headers: {}, config } as AxiosResponse
}
api.defaults.adapter = adapter

const entry = (description: string, amount = 100) =>
  ({ category_id: 1, type: 'expense', amount, description, date: '2026-11-10' })

describe('daily entries added offline', () => {
  beforeEach(async () => {
    userId = 7
    posted = []
    requests = []
    keys = []
    bodies = []
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

    expect(await approveAll()).toEqual({ sent: 2, refused: 0 })
    expect(posted.map((p) => p.description)).toEqual(['First', 'Second'])
    expect(await refreshPending()).toEqual([])
  })

  it('stops while still offline and keeps the rest for next time', async () => {
    await queueEntry(entry('A'), newClientId(), 1)
    await queueEntry(entry('B'), newClientId(), 2)
    server = (body) => (body.description === 'A' ? 'ok' : 'offline')

    expect(await approveAll()).toEqual({ sent: 1, refused: 0 })
    expect((await refreshPending()).map((e) => e.payload.description)).toEqual(['B'])
  })

  it('waits when the server is having trouble instead of giving up on the entry', async () => {
    await queueEntry(entry('A'))
    server = () => 'down'
    expect(await approveAll()).toEqual({ sent: 0, refused: 0 })
    expect((await refreshPending())[0].error).toBeNull()
  })

  it('marks an entry the server refuses with the reason, and carries on with the others', async () => {
    await queueEntry(entry('Bad'), newClientId(), 1)
    await queueEntry(entry('Good'), newClientId(), 2)
    server = (body) => (body.description === 'Bad' ? 'invalid' : 'ok')

    expect(await approveAll()).toEqual({ sent: 1, refused: 1 })
    const [bad] = await refreshPending()
    expect(bad.error).toBe('The selected category is invalid.')
    // Sent again only when you approve it again
    server = () => 'ok'
    expect(await syncPending([bad.client_id])).toEqual({ sent: 1, refused: 0 })
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
    expect(await approveAll()).toEqual({ sent: 0, refused: 0 })
    userId = 7
    expect((await refreshPending()).map((e) => e.payload.description)).toEqual(['Mine'])
  })
  describe('edits and deletes of existing entries', () => {
    const lunch = { id: 41, category_id: 1, category: { id: 1, name: 'Food' }, type: 'expense', scope: 'personal', amount: '250.00',
      description: 'Lunch', date: '2026-11-09', notes: null, balance_entry: null, created_at: '', updated_at: '' } as unknown as import('@/types').Transaction

    it('keeps an offline edit and sends it as an update when back online', async () => {
      server = () => 'offline'
      expect(await transactionsApi.updateOrQueue(41, entry('Lunch', 300))).toEqual({ queued: true })
      server = () => 'ok'
      expect(await approveAll()).toEqual({ sent: 1, refused: 0 })
      expect(requests).toEqual(['PUT /transactions/41'])
    })

    it('editing the same entry again keeps one edit with the latest values', async () => {
      await queueChange('update', 41, entry('Lunch', 300), 1)
      await queueChange('update', 41, entry('Lunch with drinks', 320), 2)
      const waiting = await refreshPending()
      expect(waiting).toHaveLength(1)
      expect(waiting[0].payload).toMatchObject({ description: 'Lunch with drinks', amount: 320 })
    })

    it("deleting drops the entry's waiting edits and sends only the delete", async () => {
      await queueChange('update', 41, entry('Lunch', 300), 1)
      server = () => 'offline'
      expect(await transactionsApi.deleteOrQueue(lunch)).toEqual({ queued: true })
      expect((await refreshPending()).map(kindOf)).toEqual(['delete'])
      server = () => 'ok'
      await approveAll()
      expect(requests).toEqual(['DELETE /transactions/41'])
    })

    it('an entry already deleted elsewhere: the delete counts as done', async () => {
      await queueChange('delete', 41, entry('Lunch'))
      server = () => 'gone'
      expect(await approveAll()).toEqual({ sent: 1, refused: 0 })
      expect(await refreshPending()).toEqual([])
    })

    it('an edit to an entry deleted elsewhere is refused with the reason', async () => {
      await queueChange('update', 41, entry('Lunch', 300))
      server = () => 'gone'
      expect(await approveAll()).toEqual({ sent: 0, refused: 1 })
      expect((await refreshPending())[0].error).toBe('It was deleted somewhere else in the meantime.')
    })

    it('keeps the order: a new entry, then an edit, then a delete', async () => {
      await queueEntry(entry('New'), newClientId(), 1)
      await queueChange('update', 41, entry('Lunch', 300), 2)
      await queueChange('delete', 42, entry('Old'), 3)
      await approveAll()
      expect(requests).toEqual(['POST /transactions', 'PUT /transactions/41', 'DELETE /transactions/42'])
    })
  })
  describe('asking first', () => {
    it('sends nothing that was not approved', async () => {
      await queueEntry(entry('Lunch'), newClientId(), 1)
      const [, dinner] = [await queueEntry(entry('Dinner'), newClientId(), 2)].map((e) => e)
      expect(await syncPending([])).toEqual({ sent: 0, refused: 0 })
      expect(requests).toEqual([])

      // Only the approved one goes; the other keeps waiting
      expect(await syncPending([(await refreshPending())[1].client_id])).toEqual({ sent: 1, refused: 0 })
      expect(posted.map((p) => p.description)).toEqual(['Dinner'])
      expect((await refreshPending()).map((e) => e.payload?.description)).toEqual(['Lunch'])
      void dinner
    })

    it('sends every change with its own Idempotency-Key, so a resend is done once', async () => {
      const e = await queueEntry(entry('Lunch'))
      await approveAll()
      expect(keys).toEqual([e.client_id])
    })
  })

  describe('business and other changes made offline', () => {
    it('keeps them instead of failing, with a label in words, and sends nothing on its own', async () => {
      server = () => 'offline'
      await expect(api.post('/rucoy/accounts/12/archive')).rejects.toMatchObject({ queued: true, offline: true, message: '' })
      await expect(api.post('/business/transactions', { description: '9/100 Crash', type: 'gold' })).rejects.toMatchObject({ queued: true })

      const waiting = await refreshPending()
      expect(waiting.map((e) => [kindOf(e), e.label])).toEqual([
        ['request', 'Sell account #12'],
        ['request', 'Add sale “9/100 Crash”'],
      ])
      expect(requests).toEqual([])
    })

    it('sends the approved ones as they were made, each with its key', async () => {
      server = () => 'offline'
      await api.put('/rucoy/trades/5', { description: 'T5', amount: 10 }).catch(() => {})
      await api.delete('/master/balance-entries/9').catch(() => {})
      server = () => 'ok'

      const waiting = await refreshPending()
      expect(await approveAll()).toEqual({ sent: 2, refused: 0 })
      expect(requests).toEqual(['PUT /rucoy/trades/5', 'DELETE /master/balance-entries/9'])
      expect(keys).toEqual(waiting.map((e) => e.client_id))
      expect(JSON.parse(String(bodies[0]))).toEqual({ description: 'T5', amount: 10 })
    })

    it('keeps a form with a file (an account with its screenshot) intact', async () => {
      server = () => 'offline'
      const form = new FormData()
      form.append('description', 'Leblanc 600 Dist')
      form.append('screenshot', new Blob(['png-bytes'], { type: 'image/png' }), 'shot.png')
      await api.post('/rucoy/accounts', form, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {})
      expect((await refreshPending())[0].label).toBe('Add account “Leblanc 600 Dist”')

      server = () => 'ok'
      await approveAll()
      const sent = bodies[0] as FormData
      expect(sent).toBeInstanceOf(FormData)
      expect(sent.get('description')).toBe('Leblanc 600 Dist')
      expect(await (sent.get('screenshot') as Blob).text()).toBe('png-bytes')
    })

    it('never keeps sign-ins, undo or publishing: those need a connection', async () => {
      server = () => 'offline'
      await expect(api.post('/master/operations/3/undo')).rejects.toMatchObject({ message: "You're offline. This needs an internet connection." })
      await expect(api.post('/business/listing/publish')).rejects.toMatchObject({ offline: true })
      expect(await refreshPending()).toEqual([])
    })
  })
})
