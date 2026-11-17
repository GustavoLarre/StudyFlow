import { api as defaultApi } from './api'
import type { ApiClient } from './apiClient'

export interface Profile {
  uid: string
  email: string | null
  plan: string
  username: string | null
  name: string | null
  usernameChanged: boolean // <--- Adicionado aqui
  xp: { total: number; level: number; currentLevelXp: number; nextLevelXp: number }
}

export function createProfileApi(client: Pick<ApiClient, 'get' | 'put'>) {
  return {
    get: async () => (await client.get<{ user: Profile }>('/me')).user,
    update: async (data: { username?: string; name?: string }) =>
      (await client.put<{ user: Profile }>('/me', data)).user,
    checkUsername: async (name: string) => {
      const { available, reason } = await client.get<{ available: boolean; reason?: string }>(
        `/usernames/${encodeURIComponent(name)}/available`,
      )
      return { available, reason }
    },
  }
}

export type ProfileApi = ReturnType<typeof createProfileApi>

export const profileApi = createProfileApi(defaultApi)