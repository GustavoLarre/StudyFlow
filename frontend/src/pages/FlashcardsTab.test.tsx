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

const EMPTY = 'Esta matéria ainda não tem flashcards.'

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
    expect(await screen.findByText(EMPTY)).toBeInTheDocument()
  })

  it('frente e verso só aparecem no popup depois de clicar em Criar flashcard', async () => {
    const { user } = setup([])
    await screen.findByText(EMPTY)

    expect(screen.queryByLabelText('Frente')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Criar flashcard' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText('Frente')).toHaveValue('')
    expect(within(dialog).getByLabelText('Verso')).toHaveValue('')
  })

  it('cria card manual pelo popup, fecha e mostra +1 XP', async () => {
    const { cards, user } = setup([])
    await screen.findByText(EMPTY)

    await user.click(screen.getByRole('button', { name: 'Criar flashcard' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Frente'), '  Pergunta?  ')
    await user.type(within(dialog).getByLabelText('Verso'), 'Resposta.')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(cards.create).toHaveBeenCalledWith('s1', { front: 'Pergunta?', back: 'Resposta.' })
    expect(await screen.findByText('Pergunta?')).toBeInTheDocument()
    expect(screen.getByText('+1 XP')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valida frente e verso vazios e limite de 500 no popup de criação', async () => {
    const { cards, user } = setup([])
    await screen.findByText(EMPTY)

    await user.click(screen.getByRole('button', { name: 'Criar flashcard' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    expect(within(dialog).getByText('Informe a frente.')).toBeInTheDocument()
    expect(within(dialog).getByText('Informe o verso.')).toBeInTheDocument()

    await user.click(within(dialog).getByLabelText('Frente'))
    await user.paste('a'.repeat(501))
    await user.type(within(dialog).getByLabelText('Verso'), 'ok')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    expect(within(dialog).getByText('A frente pode ter no máximo 500 caracteres.')).toBeInTheDocument()
    expect(cards.create).not.toHaveBeenCalled()
  })

  it('cancelar a criação fecha o popup sem criar', async () => {
    const { cards, user } = setup([])
    await screen.findByText(EMPTY)

    await user.click(screen.getByRole('button', { name: 'Criar flashcard' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cards.create).not.toHaveBeenCalled()
  })

  it('erro do backend na criação aparece no popup, que continua aberto', async () => {
    const { cards, user } = setup([])
    cards.create.mockRejectedValue(new ApiError('Matéria não encontrada.', 404))
    await screen.findByText(EMPTY)

    await user.click(screen.getByRole('button', { name: 'Criar flashcard' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Frente'), 'P')
    await user.type(within(dialog).getByLabelText('Verso'), 'R')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Matéria não encontrada.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('o lápis abre o popup de edição preenchido', async () => {
    const { user } = setup()
    await screen.findByText('O que é HTTP?')

    await user.click(screen.getByRole('button', { name: 'Editar O que é HTTP?' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Editar flashcard')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Frente')).toHaveValue('O que é HTTP?')
    expect(within(dialog).getByLabelText('Verso')).toHaveValue('Protocolo de aplicação.')
  })

  it('edita um card pelo popup e fecha', async () => {
    const { cards, user } = setup()
    await screen.findByText('O que é HTTP?')

    await user.click(screen.getByRole('button', { name: 'Editar O que é HTTP?' }))
    const dialog = screen.getByRole('dialog')
    const front = within(dialog).getByLabelText('Frente')
    await user.clear(front)
    await user.type(front, 'O que é TCP?')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(cards.update).toHaveBeenCalledWith('c1', { front: 'O que é TCP?', back: 'Protocolo de aplicação.' })
    expect(await screen.findByText('O que é TCP?')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cancelar a edição fecha o popup sem salvar', async () => {
    const { cards, user } = setup()
    await screen.findByText('O que é HTTP?')

    await user.click(screen.getByRole('button', { name: 'Editar O que é HTTP?' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cards.update).not.toHaveBeenCalled()
  })

  it('valida o popup de edição: frente vazia não salva', async () => {
    const { cards, user } = setup()
    await screen.findByText('O que é HTTP?')

    await user.click(screen.getByRole('button', { name: 'Editar O que é HTTP?' }))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByLabelText('Frente'))
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(within(dialog).getByText('Informe a frente.')).toBeInTheDocument()
    expect(cards.update).not.toHaveBeenCalled()
  })

  it('erro do backend na edição aparece no popup, que continua aberto', async () => {
    const { cards, user } = setup()
    cards.update.mockRejectedValue(new ApiError('Flashcard não encontrado.', 404))
    await screen.findByText('O que é HTTP?')

    await user.click(screen.getByRole('button', { name: 'Editar O que é HTTP?' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Flashcard não encontrado.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
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
})