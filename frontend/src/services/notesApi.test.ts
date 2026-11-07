import { describe, it, expect, vi } from 'vitest'
import { createNotesApi } from './notesApi'

function build() {
  const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
  return { api, notes: createNotesApi(api) }
}

describe('notesApi', () => {
  it('list devolve as notas da matéria', async () => {
    const { api, notes } = build()
    api.get.mockResolvedValue({ success: true, notes: [{ noteId: 'n1' }] })

    expect(await notes.list('s1')).toEqual([{ noteId: 'n1' }])
    expect(api.get).toHaveBeenCalledWith('/subjects/s1/notes')
  })

  it('get devolve uma nota', async () => {
    const { api, notes } = build()
    api.get.mockResolvedValue({ success: true, note: { noteId: 'n1', title: 'HTTP' } })

    expect((await notes.get('n1')).title).toBe('HTTP')
    expect(api.get).toHaveBeenCalledWith('/notes/n1')
  })

  it('create, update e remove chamam as rotas certas', async () => {
    const { api, notes } = build()
    api.post.mockResolvedValue({ success: true, note: { noteId: 'n1' } })
    api.put.mockResolvedValue({ success: true, note: { noteId: 'n1', title: 'Novo' } })
    api.delete.mockResolvedValue({ success: true })

    await notes.create('s1', { title: 'T', content: 'c' })
    expect(api.post).toHaveBeenCalledWith('/subjects/s1/notes', { title: 'T', content: 'c' })

    expect((await notes.update('n1', { content: 'x' })).title).toBe('Novo')
    expect(api.put).toHaveBeenCalledWith('/notes/n1', { content: 'x' })

    await notes.remove('n1')
    expect(api.delete).toHaveBeenCalledWith('/notes/n1')
  })

  it('generate devolve flashcards, gamification e usage', async () => {
    const { api, notes } = build()
    api.post.mockResolvedValue({
      success: true,
      flashcards: [{ flashcardId: 'c1' }],
      gamification: { gainedXp: 1 },
      usage: { count: 1, limit: 3 },
    })

    const result = await notes.generate('n1')

    expect(api.post).toHaveBeenCalledWith('/notes/n1/generate-flashcards', {})
    expect(result.usage).toEqual({ count: 1, limit: 3 })
    expect(result.flashcards).toHaveLength(1)
  })
})