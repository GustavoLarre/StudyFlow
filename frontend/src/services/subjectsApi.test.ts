import { describe, it, expect, vi } from 'vitest'
import { createSubjectsApi } from './subjectsApi'

function build() {
  const api = {
    get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(),
  }
  return { api, subjects: createSubjectsApi(api) }
}

describe('subjectsApi', () => {
  it('list devolve o array de matérias', async () => {
    const { api, subjects } = build()
    api.get.mockResolvedValue({ success: true, subjects: [{ subjectId: 's1', title: 'Redes' }] })

    expect(await subjects.list()).toEqual([{ subjectId: 's1', title: 'Redes' }])
    expect(api.get).toHaveBeenCalledWith('/subjects')
  })

  it('create, rename e remove chamam as rotas certas', async () => {
    const { api, subjects } = build()
    api.post.mockResolvedValue({ success: true, subject: { subjectId: 's1', title: 'BD' } })
    api.put.mockResolvedValue({ success: true, subject: { subjectId: 's1', title: 'Novo' } })
    api.delete.mockResolvedValue({ success: true, deleted: { notes: 1, flashcards: 2 } })

    expect((await subjects.create('BD')).title).toBe('BD')
    expect(api.post).toHaveBeenCalledWith('/subjects', { title: 'BD' })

    expect((await subjects.rename('s1', 'Novo')).title).toBe('Novo')
    expect(api.put).toHaveBeenCalledWith('/subjects/s1', { title: 'Novo' })

    await subjects.remove('s1')
    expect(api.delete).toHaveBeenCalledWith('/subjects/s1')
  })

    it('get devolve uma matéria', async () => {
    const { api, subjects } = build()
    api.get.mockResolvedValue({ success: true, subject: { subjectId: 's1', title: 'Redes' } })

    expect((await subjects.get('s1')).title).toBe('Redes')
    expect(api.get).toHaveBeenCalledWith('/subjects/s1')
  })
})