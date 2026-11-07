import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ProgressPage } from './ProgressPage'
import { ApiError } from '../services/apiClient'
import type { Progress } from '../services/progressApi'

const DATA: Progress = {
  xp: { total: 120, level: 2, currentLevelXp: 20, nextLevelXp: 200 },
  subjects: [
    { subjectId: 's1', title: 'Redes', total: 22, stats: { novo: 2, muitoFacil: 7, facil: 9, medio: 3, dificil: 1 } },
    { subjectId: 's2', title: 'Vazia', total: 0, stats: { novo: 0, muitoFacil: 0, facil: 0, medio: 0, dificil: 0 } },
  ],
}

const setup = (get = vi.fn().mockResolvedValue(DATA)) => render(<ProgressPage progress={{ get }} />)

describe('ProgressPage', () => {
  it('mostra nível, XP total e barra de progresso', async () => {
    setup()

    expect(await screen.findByText('Nível 2')).toBeInTheDocument()
    expect(screen.getByText('XP total: 120')).toBeInTheDocument()
    expect(screen.getByText('20 / 200 XP')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20')
  })

  it('mostra o diagnóstico de cada matéria com as 5 categorias', async () => {
    setup()
    const card = (await screen.findByText('Redes')).closest('li') as HTMLElement

    expect(within(card).getByText('Novo: 2')).toBeInTheDocument()
    expect(within(card).getByText('Muito fácil: 7')).toBeInTheDocument()
    expect(within(card).getByText('Fácil: 9')).toBeInTheDocument()
    expect(within(card).getByText('Médio: 3')).toBeInTheDocument()
    expect(within(card).getByText('Difícil: 1')).toBeInTheDocument()
    expect(within(card).getByText('22 flashcards')).toBeInTheDocument()
  })

  it('matéria sem cards aparece zerada', async () => {
    setup()
    const card = (await screen.findByText('Vazia')).closest('li') as HTMLElement

    expect(within(card).getByText('Nenhum flashcard ainda')).toBeInTheDocument()
    expect(within(card).getByText('Muito fácil: 0')).toBeInTheDocument()
    expect(within(card).getByText('Novo: 0')).toBeInTheDocument()
  })

  it('sem matérias mostra mensagem', async () => {
    setup(vi.fn().mockResolvedValue({ ...DATA, subjects: [] }))
    expect(await screen.findByText('Você ainda não tem matérias.')).toBeInTheDocument()
  })

  it('mostra a legenda dos rótulos', async () => {
    setup()
    expect(await screen.findByText(/"Novo" são flashcards ainda não revisados/)).toBeInTheDocument()
  })

  it('mostra o erro do backend', async () => {
    setup(vi.fn().mockRejectedValue(new ApiError('Erro interno do servidor.', 500)))
    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno do servidor.')
  })
})