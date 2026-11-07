import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FlashcardsTab } from './FlashcardsTab'
import { ApiError } from '../services/apiClient'
import type { Flashcard } from '../services/flashcardsApi'

const card = (over: Partial<Flashcard> = {}): Flashcard => ({
  flashcardId: 'c1', subjectId: 's1', noteId: null, source: 'manual',
  front: 'O que é HTTP?', back: 'Protocolo de aplicação.', rating: 1,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', ...over,
})

function setup(initial: Flashcard[] = [card()]) {
  const cards = {
    list: vi.fn().mockResolvedValue(initial),
    create: vi.fn().mockImplementation(async (_s: string, d: { front: string; back: string }) => ({
      flashcard: card({ flashcardId: 'novo', ...d, createdAt: '2026-06-01T00:00:00.000Z' }),
      gamification: { gainedXp: 1, totalXp: 1, level: 1 },
    })),
    update: vi.fn().mockImplementation(async (id: string, d: object) => card({ flashcardId: id, ...d })),
    remove: vi.fn().mockResolvedValue(undefined),
  }
  render(<FlashcardsTab subjectId="s1" cards={cards} />)
  return { cards, user: userEvent.setup() }
}

describe('FlashcardsTab', () => {
  it('lista cards com selo de origem, mais recentes primeiro', async () => {
    setup([
      card({ flashcardId: 'a', front: 'Antigo', createdAt: '2026-01-01T00:00:00.000Z' }),
      card({ flashcardId: 'b', front: 'Recente', source: 'ai', createdAt: '2026-05-01T00:00:00.000Z' }),
    ])

    const items = await screen.findAllByRole('listitem')
    expect(within(items[0]).getByText('Recente')).toBeInTheDocument()
    expect(within(items[0]).getByText('IA')).toBeInTheDocument()
    expect(within(items[1]).getByText('Manual')).toBeInTheDocument()
  })

  it('estado vazio', async () => {
    setup([])
    expect(await screen.findByText('Esta matéria ainda não tem flashcards.')).toBeInTheDocument()
  })

  it('cria card manual e mostra +1 XP', async () => {
    const { cards, user } = setup([])
    await screen.findByText('Esta matéria ainda não tem flashcards.')

    await user.type(screen.getByLabelText('Frente'), '  Pergunta?  ')
    await user.type(screen.getByLabelText('Verso'), 'Resposta.')
    await user.click(screen.getByRole('button', { name: 'Criar flashcard' }))

    expect(cards.create).toHaveBeenCalledWith('s1', { front: 'Pergunta?', back: 'Resposta.' })
    expect(await screen.findByText('Pergunta?')).toBeInTheDocument()
    expect(screen.getByText('+1 XP')).toBeInTheDocument()
    expect(screen.getByLabelText('Frente')).toHaveValue('')
  })

  it('valida frente e verso vazios e limite de 500', async () => {
    const { cards, user } = setup([])
    await screen.findByText('Esta matéria ainda não tem flashcards.')

    await user.click(screen.getByRole('button', { name: 'Criar flashcard' }))
    expect(screen.getByText('Informe a frente.')).toBeInTheDocument()
    expect(screen.getByText('Informe o verso.')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Frente'))
    await user.paste('a'.repeat(501))
    await user.type(screen.getByLabelText('Verso'), 'ok')
    await user.click(screen.getByRole('button', { name: 'Criar flashcard' }))
    expect(screen.getByText('A frente pode ter no máximo 500 caracteres.')).toBeInTheDocument()
    expect(cards.create).not.toHaveBeenCalled()
  })

  it('edita um card', async () => {
    const { cards, user } = setup()
    await screen.findByText('O que é HTTP?')

    await user.click(screen.getByRole('button', { name: 'Editar O que é HTTP?' }))
    const front = screen.getByLabelText('Frente')
    expect(front).toHaveValue('O que é HTTP?')
    await user.clear(front)
    await user.type(front, 'O que é TCP?')
    await user.click(screen.getByRole('button', { name: 'Salvar flashcard' }))

    expect(cards.update).toHaveBeenCalledWith('c1', { front: 'O que é TCP?', back: 'Protocolo de aplicação.' })
    expect(await screen.findByText('O que é TCP?')).toBeInTheDocument()
  })

  it('exclui só depois da confirmação', async () => {
    const { cards, user } = setup()
    await screen.findByText('O que é HTTP?')

    await user.click(screen.getByRole('button', { name: 'Excluir O que é HTTP?' }))
    expect(cards.remove).not.toHaveBeenCalled()
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))

    expect(cards.remove).toHaveBeenCalledWith('c1')
    expect(screen.queryByText('O que é HTTP?')).not.toBeInTheDocument()
  })

  it('mostra o erro do backend ao falhar', async () => {
    const { cards, user } = setup([])
    cards.create.mockRejectedValue(new ApiError('Matéria não encontrada.', 404))
    await screen.findByText('Esta matéria ainda não tem flashcards.')

    await user.type(screen.getByLabelText('Frente'), 'P')
    await user.type(screen.getByLabelText('Verso'), 'R')
    await user.click(screen.getByRole('button', { name: 'Criar flashcard' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Matéria não encontrada.')
  })
})