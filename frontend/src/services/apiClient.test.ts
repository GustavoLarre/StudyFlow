import { describe, it, expect, vi } from 'vitest'
import { createApiClient, ApiError } from './apiClient'

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response

function build(overrides: Partial<Parameters<typeof createApiClient>[0]> = {}) {
  const fetchFn = vi.fn()
  const onUnauthorized = vi.fn()
  const client = createApiClient({
    baseUrl: 'http://api.test',
    getToken: async () => 'token-123',
    onUnauthorized,
    fetchFn,
    ...overrides,
  })
  return { client, fetchFn, onUnauthorized }
}

describe('apiClient', () => {
  it('envia o token e devolve o JSON', async () => {
    const { client, fetchFn } = build()
    fetchFn.mockResolvedValue(jsonResponse(200, { success: true, subjects: [] }))

    const data = await client.get('/subjects')

    expect(data).toEqual({ success: true, subjects: [] })
    const [url, options] = fetchFn.mock.calls[0]
    expect(url).toBe('http://api.test/subjects')
    expect(options.method).toBe('GET')
    expect(options.headers.Authorization).toBe('Bearer token-123')
  })

  it('envia corpo JSON em POST, PUT e PATCH', async () => {
    const { client, fetchFn } = build()
    fetchFn.mockResolvedValue(jsonResponse(201, { success: true }))

    await client.post('/subjects', { title: 'Redes' })
    await client.put('/subjects/s1', { title: 'Novo' })
    await client.patch('/tasks/t1/complete', { completed: false })

    const [, post] = fetchFn.mock.calls[0]
    expect(post.method).toBe('POST')
    expect(post.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(post.body)).toEqual({ title: 'Redes' })
    expect(fetchFn.mock.calls[1][1].method).toBe('PUT')
    expect(fetchFn.mock.calls[2][1].method).toBe('PATCH')
  })

  it('DELETE não envia corpo', async () => {
    const { client, fetchFn } = build()
    fetchFn.mockResolvedValue(jsonResponse(200, { success: true }))

    await client.delete('/subjects/s1')

    expect(fetchFn.mock.calls[0][1].method).toBe('DELETE')
    expect(fetchFn.mock.calls[0][1].body).toBeUndefined()
  })

  it('lança ApiError com status, mensagem e code em erro da API', async () => {
    const { client, fetchFn } = build()
    fetchFn.mockResolvedValue(
      jsonResponse(403, { success: false, error: 'Limite atingido.', code: 'PLAN_LIMIT_REACHED' }),
    )

    const error = await client.post('/notes/n1/generate-flashcards').catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 403, message: 'Limite atingido.', code: 'PLAN_LIMIT_REACHED' })
  })

  it('em 401 chama onUnauthorized e lança ApiError', async () => {
    const { client, fetchFn, onUnauthorized } = build()
    fetchFn.mockResolvedValue(jsonResponse(401, { success: false, error: 'Token inválido ou expirado.' }))

    await expect(client.get('/me')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('rede fora do ar vira ApiError com status 0', async () => {
    const { client, fetchFn } = build()
    fetchFn.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(client.get('/me')).rejects.toMatchObject({ status: 0 })
  })

  it('sem usuário logado lança 401 sem chamar a rede', async () => {
    const { client, fetchFn, onUnauthorized } = build({ getToken: async () => null })

    await expect(client.get('/me')).rejects.toMatchObject({ status: 401 })
    expect(fetchFn).not.toHaveBeenCalled()
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('resposta de erro sem JSON usa mensagem genérica', async () => {
    const { client, fetchFn } = build()
    fetchFn.mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error('x') } } as Response)

    await expect(client.get('/x')).rejects.toMatchObject({ status: 500, message: 'Erro inesperado (500).' })
  })
})