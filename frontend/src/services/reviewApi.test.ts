import { describe, it, expect, vi } from 'vitest'
import { createReviewApi } from './reviewApi'

function build() {
  const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
  return { api, review: createReviewApi(api) }
}

describe('reviewApi', () => {
  it('due sem matéria busca todas misturadas', async () => {
    const { api, review } = build()
    api.get.mockResolvedValue({ success: true, flashcards: [{ flashcardId: 'c1' }], total: 1 })

    expect(await review.due()).toEqual([{ flashcardId: 'c1' }])
    expect(api.get).toHaveBeenCalledWith('/review/due')
  })

  it('due com matéria envia o subjectId codificado', async () => {
    const { api, review } = build()
    api.get.mockResolvedValue({ success: true, flashcards: [], total: 0 })

    await review.due('s 1')

    expect(api.get).toHaveBeenCalledWith('/review/due?subjectId=s%201')
  })

  it('answer envia a ação e devolve flashcard e gamification', async () => {
    const { api, review } = build()
    api.post.mockResolvedValue({
      success: true,
      flashcard: { flashcardId: 'c1' },
      gamification: { gainedXp: 4, totalXp: 4, level: 1, leveledUp: false },
    })

    const result = await review.answer('c1', 'easy')

    expect(api.post).toHaveBeenCalledWith('/flashcards/c1/review', { action: 'easy' })
    expect(result.gamification?.gainedXp).toBe(4)
  })
})