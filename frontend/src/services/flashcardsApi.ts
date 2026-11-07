import { api as defaultApi } from './api'
import type { ApiClient } from './apiClient'

export interface Flashcard {
  flashcardId: string
  subjectId: string
  noteId: string | null
  source: 'manual' | 'ai'
  front: string
  back: string
  rating: number
  createdAt: string
  updatedAt: string
}

export interface CreateResult {
  flashcard: Flashcard
  gamification: { gainedXp: number; totalXp: number; level: number } | null
}

export const MAX_CARD_TEXT = 500

export function createFlashcardsApi(client: Pick<ApiClient, 'get' | 'post' | 'put' | 'delete'>) {
  return {
    list: async (subjectId: string) =>
      (await client.get<{ flashcards: Flashcard[] }>(`/subjects/${subjectId}/flashcards`)).flashcards,
    create: async (subjectId: string, data: { front: string; back: string }) => {
      const { flashcard, gamification } = await client.post<CreateResult>(
        `/subjects/${subjectId}/flashcards`,
        data,
      )
      return { flashcard, gamification } as CreateResult
    },
    update: async (id: string, data: { front?: string; back?: string }) =>
      (await client.put<{ flashcard: Flashcard }>(`/flashcards/${id}`, data)).flashcard,
    remove: async (id: string) => {
      await client.delete(`/flashcards/${id}`)
    },
  }
}

export type FlashcardsApi = ReturnType<typeof createFlashcardsApi>

export const flashcardsApi = createFlashcardsApi(defaultApi)