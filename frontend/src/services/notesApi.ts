import { api as defaultApi } from './api'
import type { ApiClient } from './apiClient'

export interface Note {
  noteId: string
  subjectId: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface GenerationResult {
  flashcards: unknown[]
  gamification: { gainedXp: number; totalXp: number; level: number } | null
  usage: { count: number; limit: number }
}

export const MAX_NOTE_CHARS = 6000

export function createNotesApi(client: Pick<ApiClient, 'get' | 'post' | 'put' | 'delete'>) {
  return {
    list: async (subjectId: string) =>
      (await client.get<{ notes: Note[] }>(`/subjects/${subjectId}/notes`)).notes,
    get: async (noteId: string) =>
      (await client.get<{ note: Note }>(`/notes/${noteId}`)).note,
    create: async (subjectId: string, data: { title?: string; content: string }) =>
      (await client.post<{ note: Note }>(`/subjects/${subjectId}/notes`, data)).note,
    update: async (noteId: string, data: { title?: string; content?: string }) =>
      (await client.put<{ note: Note }>(`/notes/${noteId}`, data)).note,
    remove: async (noteId: string) => {
      await client.delete(`/notes/${noteId}`)
    },
    generate: async (noteId: string) => {
      const { flashcards, gamification, usage } = await client.post<GenerationResult>(
        `/notes/${noteId}/generate-flashcards`,
        {},
      )
      return { flashcards, gamification, usage } as GenerationResult
    },
  }
}

export type NotesApi = ReturnType<typeof createNotesApi>

export const notesApi = createNotesApi(defaultApi)