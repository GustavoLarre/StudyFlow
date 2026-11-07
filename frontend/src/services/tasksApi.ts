import { api as defaultApi } from './api'
import type { ApiClient } from './apiClient'

export interface Task {
  taskId: string
  date: string
  text: string
  completed: boolean
  completedAt: string | null
}

export const MAX_TASK_TEXT = 300

export function createTasksApi(client: Pick<ApiClient, 'get' | 'post' | 'put' | 'patch' | 'delete'>) {
  return {
    list: async () => (await client.get<{ tasks: Task[] }>('/tasks')).tasks,
    create: async (data: { date: string; text: string }) =>
      (await client.post<{ task: Task }>('/tasks', data)).task,
    update: async (id: string, data: { date?: string; text?: string }) =>
      (await client.put<{ task: Task }>(`/tasks/${id}`, data)).task,
    setCompleted: async (id: string, completed: boolean) =>
      (await client.patch<{ task: Task }>(`/tasks/${id}/complete`, { completed })).task,
    remove: async (id: string) => {
      await client.delete(`/tasks/${id}`)
    },
  }
}

export type TasksApi = ReturnType<typeof createTasksApi>

export const tasksApi = createTasksApi(defaultApi)