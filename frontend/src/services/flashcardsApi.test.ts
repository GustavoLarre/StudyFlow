import { describe, it, expect, vi } from 'vitest'
import { createFlashcardsApi } from './flashcardsApi'

function build() {
  const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
  return { api, cards: createFlashcardsApi(api) }
}

describe('flashcardsApi', () => {
  it('list devolve os cards da matéria', async () => {
    const { api, cards } = build()
    api.get.mockResolvedValue({ success: true, flashcards: [{ flashcardId: 'c1' }] })

    expect(await cards.list('s1')).toEqual([{ flashcardId: 'c1' }])
    expect(api.get).toHaveBeenCalledWith('/subjects/s1/flashcards')
  })

  it('create devolve flashcard e gamification', async () => {
    const { api, cards } = build()
    api.post.mockResolvedValue({
      success: true,
      flashcard: { flashcardId: 'c1' },
      gamification: { gainedXp: 1, totalXp: 1, level: 1 },
    })

    const result = await cards.create('s1', { front: 'P?', back: 'R.' })

    expect(api.post).toHaveBeenCalledWith('/subjects/s1/flashcards', { front: 'P?', back: 'R.' })
    expect(result.flashcard.flashcardId).toBe('c1')
    expect(result.gamification?.gainedXp).toBe(1)
  })

  it('update e remove chamam as rotas certas', async () => {
    const { api, cards } = build()
    api.put.mockResolvedValue({ success: true, flashcard: { flashcardId: 'c1', front: 'Novo' } })
    api.delete.mockResolvedValue({ success: true })

    expect((await cards.update('c1', { front: 'Novo' })).front).toBe('Novo')
    expect(api.put).toHaveBeenCalledWith('/flashcards/c1', { front: 'Novo' })

    await cards.remove('c1')
    expect(api.delete).toHaveBeenCalledWith('/flashcards/c1')
  })
})