import { api as defaultApi } from './api'
import type { ApiClient } from './apiClient'

export interface Subject {
  subjectId: string
  title: string
}

export function createSubjectsApi(client: Pick<ApiClient, 'get' | 'post' | 'put' | 'delete'>) {
  return {
    list: async () => (await client.get<{ subjects: Subject[] }>('/subjects')).subjects,
    create: async (title: string) =>
      (await client.post<{ subject: Subject }>('/subjects', { title })).subject,
    rename: async (id: string, title: string) =>
      (await client.put<{ subject: Subject }>(`/subjects/${id}`, { title })).subject,
    remove: async (id: string) =>
      (await client.delete<{ deleted: { notes: number; flashcards: number } }>(`/subjects/${id}`)).deleted,
  }
}

export type SubjectsApi = ReturnType<typeof createSubjectsApi>

export const subjectsApi = createSubjectsApi(defaultApi)