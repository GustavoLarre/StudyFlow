import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { NotesTab } from './NotesTab'
import { ApiError } from '../services/apiClient'

const N1 = { noteId: 'n1', subjectId: 's1', title: 'HTTP', content: 'Opera na camada de aplicação.', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }

function setup(initial = [N1]) {
  const notes = {
    list: vi.fn().mockResolvedValue(initial),
    create: vi.fn().mockImplementation(async (_s: string, d: { title?: string; content: string }) => ({ ...N1, noteId: 'novo', title: d.title || 'Nota sem título', content: d.content })),
    update: vi.fn().mockImplementation(async (id: string, d: { title?: string; content?: string }) => ({ ...N1, noteId: id, ...d })),
    remove: vi.fn().mockResolvedValue(undefined),
    generate: vi.fn().mockResolvedValue({ flashcards: [{}, {}], gamification: { gainedXp: 2, totalXp: 2, level: 1 }, usage: { count: 1, limit: 3 } }),
  }
  render(<MemoryRouter><NotesTab subjectId="s1" notes={notes} /></MemoryRouter>)
  return { notes, user: userEvent.setup() }
}

describe('NotesTab', () => {
  it('lista as notas e mostra estado vazio', async () => {
    setup()
    expect(await screen.findByText('HTTP')).toBeInTheDocument()
  })

  it('estado vazio', async () => {
    setup([])
    expect(await screen.findByText('Esta matéria ainda não tem notas.')).toBeInTheDocument()
  })

  it('trunca a prévia em 120 caracteres', async () => {
    setup([{ ...N1, content: 'a'.repeat(300) }])
    expect(await screen.findByText(`${'a'.repeat(120)}...`)).toBeInTheDocument()
  })

  it('cria nota inline e mostra o contador', async () => {
    const { notes, user } = setup([])
    await screen.findByText('Esta matéria ainda não tem notas.')

    await user.type(screen.getByLabelText('Título da nota'), 'Grafos')
    await user.type(screen.getByLabelText('Conteúdo da nota'), 'Vértices e arestas')
    expect(screen.getByText('18/6000')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Salvar nota' }))

    expect(notes.create).toHaveBeenCalledWith('s1', { title: 'Grafos', content: 'Vértices e arestas' })
    expect(await screen.findByText('Grafos')).toBeInTheDocument()
  })

  it('não permite conteúdo vazio nem acima de 6000', async () => {
    const { notes, user } = setup([])
    await screen.findByText('Esta matéria ainda não tem notas.')

    await user.click(screen.getByRole('button', { name: 'Salvar nota' }))
    expect(screen.getByText('Informe o conteúdo da nota.')).toBeInTheDocument()

    const area = screen.getByLabelText('Conteúdo da nota')
    await user.click(area)
    await user.paste('a'.repeat(6001))
    await user.click(screen.getByRole('button', { name: 'Salvar nota' }))
    expect(screen.getByText('A nota pode ter no máximo 6000 caracteres.')).toBeInTheDocument()
    expect(notes.create).not.toHaveBeenCalled()
  })

  it('edita uma nota', async () => {
    const { notes, user } = setup()
    await screen.findByText('HTTP')

    await user.click(screen.getByRole('button', { name: 'Editar HTTP' }))
    const area = screen.getByLabelText('Conteúdo da nota')
    expect(area).toHaveValue(N1.content)
    await user.clear(area)
    await user.type(area, 'Novo texto')
    await user.click(screen.getByRole('button', { name: 'Salvar nota' }))

    expect(notes.update).toHaveBeenCalledWith('n1', { title: 'HTTP', content: 'Novo texto' })
  })

  it('exclui com aviso de que os flashcards permanecem', async () => {
    const { notes, user } = setup()
    await screen.findByText('HTTP')

    await user.click(screen.getByRole('button', { name: 'Excluir HTTP' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/flashcards gerados a partir dela permanecem/i)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    expect(notes.remove).toHaveBeenCalledWith('n1')
    expect(screen.queryByText('HTTP')).not.toBeInTheDocument()
  })

  it('gera flashcards: mostra gerando, resultado, cota e link', async () => {
    let finish: (v: unknown) => void = () => {}
    const { notes, user } = setup()
    notes.generate.mockImplementation(() => new Promise((r) => { finish = r }))
    await screen.findByText('HTTP')

    await user.click(screen.getByRole('button', { name: 'Gerar flashcards de HTTP' }))
    expect(screen.getByRole('button', { name: 'Gerando...' })).toBeDisabled()

    finish({ flashcards: [{}, {}], gamification: { gainedXp: 2, totalXp: 2, level: 1 }, usage: { count: 1, limit: 3 } })
    expect(await screen.findByText(/2 flashcards criados \(\+2 XP\)/)).toBeInTheDocument()
    expect(screen.getByText('Gerações usadas: 1/3')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver flashcards' })).toHaveAttribute('href', '/materias/s1?aba=flashcards')
  })

  it.each([
    [new ApiError('x', 403, 'PLAN_LIMIT_REACHED'), 'Você atingiu o limite de gerações do seu plano.'],
    [new ApiError('x', 409, 'AI_GENERATION_IN_PROGRESS'), 'Já existe uma geração em andamento.'],
    [new ApiError('Serviço de IA indisponível.', 502, 'AI_SERVICE_UNAVAILABLE'), 'Serviço de IA indisponível.'],
  ])('erro da geração %#', async (error, message) => {
    const { notes, user } = setup()
    notes.generate.mockRejectedValue(error)
    await screen.findByText('HTTP')

    await user.click(screen.getByRole('button', { name: 'Gerar flashcards de HTTP' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
  })
})