import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewPage } from './ReviewPage'
import { ApiError } from '../services/apiClient'
import type { Flashcard } from '../services/flashcardsApi'

const card = (id: string, front: string, back: string): Flashcard => ({
  flashcardId: id, subjectId: 's1', noteId: null, source: 'manual', front, back, rating: 1,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
})

const C1 = card('c1', 'O que é HTTP?', 'Protocolo.')
const C2 = card('c2', 'O que é TCP?', 'Transporte.')

function setup(due: Flashcard[] = [C1, C2]) {
  const subjects = { list: vi.fn().mockResolvedValue([{ subjectId: 's1', title: 'Redes' }, { subjectId: 's2', title: 'BD' }]) }
  const review = {
    due: vi.fn().mockResolvedValue(due),
    answer: vi.fn().mockResolvedValue({ flashcard: C1, gamification: { gainedXp: 4, totalXp: 4, level: 1, leveledUp: false } }),
  }
  render(<ReviewPage subjects={subjects} review={review} />)
  return { review, user: userEvent.setup() }
}

describe('ReviewPage', () => {
  it('carrega todas as matérias misturadas e mostra a frente do primeiro card', async () => {
    const { review } = setup()

    expect(await screen.findByText('O que é HTTP?')).toBeInTheDocument()
    expect(review.due).toHaveBeenCalledWith(undefined)
    expect(screen.getByText('Card 1 de 2')).toBeInTheDocument()
    expect(screen.queryByText('Protocolo.')).not.toBeInTheDocument()
  })

  it('sem cards vencidos mostra a mensagem', async () => {
    setup([])
    expect(await screen.findByText('Nenhum flashcard para revisar agora.')).toBeInTheDocument()
  })

  it('trocar a matéria recarrega a fila filtrada', async () => {
    const { review, user } = setup()
    await screen.findByText('O que é HTTP?')

    await user.selectOptions(screen.getByLabelText('Matéria'), 's2')

    expect(review.due).toHaveBeenLastCalledWith('s2')
  })

  it('mostrar resposta revela o verso e os 4 botões', async () => {
    const { user } = setup()
    await screen.findByText('O que é HTTP?')

    await user.click(screen.getByRole('button', { name: 'Mostrar resposta' }))

    expect(screen.getByText('Protocolo.')).toBeInTheDocument()
    for (const name of ['Muito fácil', 'Fácil', 'Difícil', 'De novo']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it.each([
    ['Muito fácil', 'easy'], ['Fácil', 'good'], ['Difícil', 'hard'], ['De novo', 'again'],
  ])('%s envia a ação %s, mostra o XP e avança', async (label, action) => {
    const { review, user } = setup()
    await screen.findByText('O que é HTTP?')
    await user.click(screen.getByRole('button', { name: 'Mostrar resposta' }))

    await user.click(screen.getByRole('button', { name: label }))

    expect(review.answer).toHaveBeenCalledWith('c1', action)
    expect(await screen.findByText('O que é TCP?')).toBeInTheDocument()
    expect(screen.getByText('+4 XP')).toBeInTheDocument()
    expect(screen.getByText('Card 2 de 2')).toBeInTheDocument()
  })

  it('avisa quando sobe de nível', async () => {
    const { review, user } = setup()
    review.answer.mockResolvedValue({ flashcard: C1, gamification: { gainedXp: 4, totalXp: 102, level: 2, leveledUp: true } })
    await screen.findByText('O que é HTTP?')
    await user.click(screen.getByRole('button', { name: 'Mostrar resposta' }))

    await user.click(screen.getByRole('button', { name: 'Muito fácil' }))

    expect(await screen.findByText('Subiu de nível!')).toBeInTheDocument()
  })

  it('ao terminar mostra o resumo e permite revisar de novo', async () => {
    const { review, user } = setup([C1])
    await screen.findByText('O que é HTTP?')
    await user.click(screen.getByRole('button', { name: 'Mostrar resposta' }))
    await user.click(screen.getByRole('button', { name: 'Fácil' }))

    expect(await screen.findByText('Sessão concluída')).toBeInTheDocument()
    expect(screen.getByText('1 flashcard revisado, +4 XP')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Revisar de novo' }))
    expect(review.due).toHaveBeenCalledTimes(2)
  })

  it('erro ao avaliar mostra o alerta e mantém o card', async () => {
    const { review, user } = setup()
    review.answer.mockRejectedValue(new ApiError('Flashcard não encontrado.', 404))
    await screen.findByText('O que é HTTP?')
    await user.click(screen.getByRole('button', { name: 'Mostrar resposta' }))

    await user.click(screen.getByRole('button', { name: 'Fácil' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Flashcard não encontrado.')
    expect(screen.getByText('O que é HTTP?')).toBeInTheDocument()
  })
})