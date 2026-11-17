import { describe, it, expect, vi } from 'vitest'
import { createProfileApi } from './profileApi'

function build() {
  const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
  return { api, profile: createProfileApi(api) }
}

describe('profileApi', () => {
  it('get devolve o perfil', async () => {
    const { api, profile } = build()
    api.get.mockResolvedValue({ success: true, user: { uid: 'u1', username: null } })

    expect((await profile.get()).uid).toBe('u1')
    expect(api.get).toHaveBeenCalledWith('/me')
  })

  it('update envia username e name e devolve o perfil', async () => {
    const { api, profile } = build()
    api.put.mockResolvedValue({ success: true, user: { uid: 'u1', username: 'gus' } })

    const result = await profile.update({ username: 'gus', name: 'Gustavo' })

    expect(api.put).toHaveBeenCalledWith('/me', { username: 'gus', name: 'Gustavo' })
    expect(result.username).toBe('gus')
  })

  it('checkUsername codifica o nome e devolve a disponibilidade', async () => {
    const { api, profile } = build()
    api.get.mockResolvedValue({ success: true, available: false, reason: 'x' })

    const result = await profile.checkUsername('a b')

    expect(api.get).toHaveBeenCalledWith('/usernames/a%20b/available')
    expect(result).toEqual({ available: false, reason: 'x' })
  })
})