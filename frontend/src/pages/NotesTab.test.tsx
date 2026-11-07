import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { NotesTab } from './NotesTab'
import { ApiError } from '../services/apiClient'

const N1 = { noteId: 'n1', subjectId: 's1', title: 'HTTP', content: 'Opera na camada de aplicação.', createdAt: '2026-01-01T12:00:00.000Z', updatedAt: '2026-01-01T12:00:00.000Z' }

function setup(initial = [N1]) {
  const notes = {
    list: vi.fn().mockResolvedValue(initial),
    remove: vi.fn().mockResolvedValue(undefined),
    generate: vi.fn().mockResolvedValue({ flashcards: [{}, {}], gamification: { gainedXp: 2, totalXp: 2, level: 1 }, usage: { count: 1, limit: 3 } }),
  }
  render(<MemoryRouter><NotesTab subjectId="s1" notes={notes} /></MemoryRouter>)
  return { notes, user: userEvent.setup() }
}

describe('NotesTab', () => {
  it('lista as notas e o título abre o editor', async () => {
    setup()
    expect(await screen.findByRole('link', { name: 'HTTP' })).toHaveAttribute('href', '/materias/s1/notas/n1')
  })

  it('tem o botão Criar nota que abre o editor em branco', async () => {
    setup()
    expect(await screen.findByRole('link', { name: 'Criar nota' })).toHaveAttribute('href', '/materias/s1/notas/nova')
  })

  it('estado vazio', async () => {
    setup([])
    expect(await screen.findByText('Esta matéria ainda não tem notas.')).toBeInTheDocument()
  })

  it('trunca a prévia em 120 caracteres', async () => {
    setup([{ ...N1, content: 'a'.repeat(300) }])
    expect(await screen.findByText(`${'a'.repeat(120)}...`)).toBeInTheDocument()
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