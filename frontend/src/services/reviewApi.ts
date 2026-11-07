import { api as defaultApi } from './api'
import type { ApiClient } from './apiClient'
import type { Flashcard } from './flashcardsApi'

export type ReviewAction = 'again' | 'hard' | 'good' | 'easy'

export interface ReviewGamification {
  gainedXp: number
  totalXp: number
  level: number
  leveledUp: boolean
}

export function createReviewApi(client: Pick<ApiClient, 'get' | 'post'>) {
  return {
    due: async (subjectId?: string) => {
      const query = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''
      return (await client.get<{ flashcards: Flashcard[] }>(`/review/due${query}`)).flashcards
    },
    answer: async (flashcardId: string, action: ReviewAction) => {
      const { flashcard, gamification } = await client.post<{
        flashcard: Flashcard
        gamification: ReviewGamification | null
      }>(`/flashcards/${flashcardId}/review`, { action })
      return { flashcard, gamification }
    },
  }
}

export type ReviewApi = ReturnType<typeof createReviewApi>

export const reviewApi = createReviewApi(defaultApi)