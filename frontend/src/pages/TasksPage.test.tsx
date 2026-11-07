import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TasksPage } from './TasksPage'
import { ApiError } from '../services/apiClient'
import type { Task } from '../services/tasksApi'

const task = (over: Partial<Task> = {}): Task => ({
  taskId: 't1', date: '2026-11-10', text: 'Estudar grafos', completed: false, completedAt: null, ...over,
})

function setup(initial: Task[] = [task()]) {
  const tasks = {
    list: vi.fn().mockResolvedValue(initial),
    create: vi.fn().mockImplementation(async (d: { date: string; text: string }) => task({ taskId: 'novo', ...d })),
    update: vi.fn().mockImplementation(async (id: string, d: object) => task({ taskId: id, ...d })),
    setCompleted: vi.fn().mockImplementation(async (id: string, completed: boolean) =>
      task({ taskId: id, completed, completedAt: completed ? '2026-11-07T00:00:00.000Z' : null })),
    remove: vi.fn().mockResolvedValue(undefined),
  }
  render(<TasksPage tasks={tasks} />)
  return { tasks, user: userEvent.setup() }
}

describe('TasksPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-07T12:00:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('separa pendentes e concluídas, com data dd/mm/aaaa', async () => {
    setup([task(), task({ taskId: 't2', text: 'Revisar redes', completed: true })])

    const pending = (await screen.findByRole('region', { name: 'Pendentes' }))
    const done = screen.getByRole('region', { name: 'Concluídas' })
    expect(within(pending).getByText('Estudar grafos')).toBeInTheDocument()
    expect(within(pending).getByText('10/11/2026')).toBeInTheDocument()
    expect(within(done).getByText('Revisar redes')).toBeInTheDocument()
  })

  it('ordena as pendentes por data crescente', async () => {
    setup([task({ taskId: 'a', text: 'Depois', date: '2026-12-01' }), task({ taskId: 'b', text: 'Antes', date: '2026-11-08' })])

    const items = within(await screen.findByRole('region', { name: 'Pendentes' })).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Antes')
  })

  it('mostra mensagens de seção vazia', async () => {
    setup([])
    expect(await screen.findByText('Nenhuma tarefa pendente.')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma tarefa concluída.')).toBeInTheDocument()
  })

  it('a data padrão do formulário é hoje', async () => {
    setup([])
    await screen.findByText('Nenhuma tarefa pendente.')
    expect(screen.getByLabelText('Data')).toHaveValue('2026-11-07')
  })

  it('cria tarefa com texto aparado', async () => {
    const { tasks, user } = setup([])
    await screen.findByText('Nenhuma tarefa pendente.')

    await user.type(screen.getByLabelText('Nova tarefa'), '  Ler capítulo 3  ')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(tasks.create).toHaveBeenCalledWith({ date: '2026-11-07', text: 'Ler capítulo 3' })
    expect(await screen.findByText('Ler capítulo 3')).toBeInTheDocument()
  })

  it('valida texto vazio e acima de 300', async () => {
    const { tasks, user } = setup([])
    await screen.findByText('Nenhuma tarefa pendente.')

    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(screen.getByText('Informe o texto da tarefa.')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Nova tarefa'))
    await user.paste('a'.repeat(301))
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(screen.getByText('A tarefa pode ter no máximo 300 caracteres.')).toBeInTheDocument()
    expect(tasks.create).not.toHaveBeenCalled()
  })

  it('concluir move para Concluídas e reabrir volta', async () => {
    const { tasks, user } = setup()
    await screen.findByText('Estudar grafos')

    await user.click(screen.getByRole('checkbox', { name: 'Concluir Estudar grafos' }))
    expect(tasks.setCompleted).toHaveBeenCalledWith('t1', true)
    const done = screen.getByRole('region', { name: 'Concluídas' })
    expect(await within(done).findByText('Estudar grafos')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Reabrir Estudar grafos' }))
    expect(tasks.setCompleted).toHaveBeenLastCalledWith('t1', false)
    const pending = screen.getByRole('region', { name: 'Pendentes' })
    expect(await within(pending).findByText('Estudar grafos')).toBeInTheDocument()
  })

  it('edita texto e data', async () => {
    const { tasks, user } = setup()
    await screen.findByText('Estudar grafos')

    await user.click(screen.getByRole('button', { name: 'Editar Estudar grafos' }))
    const input = screen.getByLabelText('Texto da tarefa')
    await user.clear(input)
    await user.type(input, 'Estudar árvores')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(tasks.update).toHaveBeenCalledWith('t1', { text: 'Estudar árvores', date: '2026-11-10' })
    expect(await screen.findByText('Estudar árvores')).toBeInTheDocument()
  })

  it('exclui só depois da confirmação', async () => {
    const { tasks, user } = setup()
    await screen.findByText('Estudar grafos')

    await user.click(screen.getByRole('button', { name: 'Excluir Estudar grafos' }))
    expect(tasks.remove).not.toHaveBeenCalled()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))

    expect(tasks.remove).toHaveBeenCalledWith('t1')
    expect(screen.queryByText('Estudar grafos')).not.toBeInTheDocument()
  })

  it('mostra o erro do backend', async () => {
    const { tasks, user } = setup([])
    tasks.create.mockRejectedValue(new ApiError('Data inválida.', 400))
    await screen.findByText('Nenhuma tarefa pendente.')

    await user.type(screen.getByLabelText('Nova tarefa'), 'x')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Data inválida.')
  })
})