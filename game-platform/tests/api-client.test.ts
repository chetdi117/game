import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import axios from 'axios'
import { createApiClient } from '../src/common/api/create-api-client.ts'

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost')
  response.setHeader('Content-Type', 'application/json')
  if (url.pathname === '/api/stall') return
  if (url.pathname === '/api/missing') {
    response.writeHead(404)
    response.end(JSON.stringify({ code: 'NOT_FOUND' }))
    return
  }
  if (request.method === 'POST') {
    let body = ''
    for await (const chunk of request) body += chunk
    response.end(JSON.stringify({ received: JSON.parse(body) }))
    return
  }
  response.end(JSON.stringify({ lang: url.searchParams.get('lang'), accept: request.headers.accept }))
})
let baseURL: string

before(async () => {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  baseURL = 'http://127.0.0.1:' + address.port + '/api'
})

after(async () => {
  const closed = new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
  })
  server.closeAllConnections()
  await closed
})

test('GET combines the API prefix and query parameters and accepts JSON', async () => {
  const client = createApiClient({ baseURL })
  const { data } = await client.get<{ lang: string; accept: string }>('/ping', { params: { lang: 'vi' } })
  assert.equal(data.lang, 'vi')
  assert.equal(data.accept, 'application/json')
})

test('POST serializes the request and keeps the response data', async () => {
  const client = createApiClient({ baseURL })
  const { data } = await client.post('/echo', { gameId: 'lucky-wheel' })
  assert.deepEqual(data, { received: { gameId: 'lucky-wheel' } })
})

test('HTTP errors retain the status and backend error body', async () => {
  const client = createApiClient({ baseURL })
  await assert.rejects(client.get('/missing'), error => {
    assert.ok(axios.isAxiosError(error))
    assert.equal(error.response?.status, 404)
    assert.deepEqual(error.response?.data, { code: 'NOT_FOUND' })
    return true
  })
})

test('a request can be canceled when a game is unmounted', async () => {
  const controller = new AbortController()
  const client = createApiClient({ baseURL })
  const pending = client.get('/stall', { signal: controller.signal })
  controller.abort()
  await assert.rejects(pending, error => {
    assert.ok(axios.isCancel(error))
    return true
  })
})

test('a stalled backend request times out', async () => {
  const client = createApiClient({ baseURL, timeout: 50 })
  await assert.rejects(client.get('/stall'), error => {
    assert.ok(axios.isAxiosError(error))
    assert.equal(error.code, 'ECONNABORTED')
    return true
  })
})
