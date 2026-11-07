import { describe, it, expect, vi } from 'vitest'
import { createTasksApi } from './tasksApi'

function build() {
  const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
  return { api, tasks: createTasksApi(api) }
}

describe('tasksApi', () => {
  it('list devolve as tarefas', async () => {
    const { api, tasks } = build()
    api.get.mockResolvedValue({ success: true, tasks: [{ taskId: 't1' }] })

    expect(await tasks.list()).toEqual([{ taskId: 't1' }])
    expect(api.get).toHaveBeenCalledWith('/tasks')
  })

  it('create, update, setCompleted e remove chamam as rotas certas', async () => {
    const { api, tasks } = build()
    api.post.mockResolvedValue({ success: true, task: { taskId: 't1' } })
    api.put.mockResolvedValue({ success: true, task: { taskId: 't1', text: 'Novo' } })
    api.patch.mockResolvedValue({ success: true, task: { taskId: 't1', completed: true } })
    api.delete.mockResolvedValue({ success: true })

    await tasks.create({ date: '2026-11-10', text: 'Estudar' })
    expect(api.post).toHaveBeenCalledWith('/tasks', { date: '2026-11-10', text: 'Estudar' })

    expect((await tasks.update('t1', { text: 'Novo' })).text).toBe('Novo')
    expect(api.put).toHaveBeenCalledWith('/tasks/t1', { text: 'Novo' })

    expect((await tasks.setCompleted('t1', true)).completed).toBe(true)
    expect(api.patch).toHaveBeenCalledWith('/tasks/t1/complete', { completed: true })

    await tasks.remove('t1')
    expect(api.delete).toHaveBeenCalledWith('/tasks/t1')
  })
})