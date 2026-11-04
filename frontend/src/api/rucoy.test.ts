import { afterEach, describe, expect, it } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import api from './axios'
import { rucoyAccountsApi } from './rucoy'

const originalAdapter = api.defaults.adapter

/** Capture what the shared client would send, after axios's request transforms run. */
function captureRequests() {
  const sent: InternalAxiosRequestConfig[] = []
  api.defaults.adapter = async (config) => {
    sent.push(config)
    return { data: { id: 1 }, status: 200, statusText: 'OK', headers: {}, config }
  }
  return sent
}

afterEach(() => { api.defaults.adapter = originalAdapter })

describe('rucoyAccountsApi uploads', () => {
  const screenshot = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'stats.jpg', { type: 'image/jpeg' })

  it('sends the screenshot as a real file when creating', async () => {
    const sent = captureRequests()
    await rucoyAccountsApi.create({ email: 'a@example.com', description: 'Lv 572 Distance', screenshot, level: 572 })

    // Under the client's JSON default, axios would have turned this into a JSON string and lost the file
    expect(sent[0].data).toBeInstanceOf(FormData)
    const body = sent[0].data as FormData
    expect(body.get('screenshot')).toBeInstanceOf(File)
    expect(body.get('level')).toBe('572')
  })

  it('sends the screenshot as a real file when updating', async () => {
    const sent = captureRequests()
    await rucoyAccountsApi.update(1, { email: 'a@example.com', screenshot })

    const body = sent[0].data as FormData
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('_method')).toBe('PUT')
    expect(body.get('screenshot')).toBeInstanceOf(File)
  })
})
