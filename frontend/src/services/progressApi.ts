import { api as defaultApi } from './api'
import type { ApiClient } from './apiClient'

export interface XpInfo {
  total: number
  level: number
  currentLevelXp: number
  nextLevelXp: number
}

export interface SubjectProgress {
  subjectId: string
  title: string
  total: number
  stats: { novo: number; muitoFacil: number; facil: number; medio: number; dificil: number }
}

export interface Progress {
  xp: XpInfo
  subjects: SubjectProgress[]
}

export function createProgressApi(client: Pick<ApiClient, 'get'>) {
  return {
    get: async (): Promise<Progress> => {
      const { xp, subjects } = await client.get<Progress>('/progress')
      return { xp, subjects }
    },
  }
}

export type ProgressApi = ReturnType<typeof createProgressApi>

export const progressApi = createProgressApi(defaultApi)