import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SubjectDetailPage } from './SubjectDetailPage'
import { ApiError } from '../services/apiClient'

function setup(path: string, get = vi.fn().mockResolvedValue({ subjectId: 's1', title: 'Redes' })) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/materias/:id" element={
          <SubjectDetailPage subjects={{ get }}
            renderNotes={(id) => <p>Aba notas {id}</p>}
            renderFlashcards={(id) => <p>Aba flashcards {id}</p>} />
        } />
      </Routes>
    </MemoryRouter>,
  )
  return { user: userEvent.setup() }
}

describe('SubjectDetailPage', () => {
  it('mostra o título e a aba Notas por padrão', async () => {
    setup('/materias/s1')
    expect(await screen.findByRole('heading', { name: 'Redes' })).toBeInTheDocument()
    expect(screen.getByText('Aba notas s1')).toBeInTheDocument()
  })

  it('abre a aba Flashcards pela URL e alterna pelos botões', async () => {
    const { user } = setup('/materias/s1?aba=flashcards')
    expect(await screen.findByText('Aba flashcards s1')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Notas' }))
    expect(screen.getByText('Aba notas s1')).toBeInTheDocument()
  })

  it('mostra mensagem amigável quando a matéria não existe', async () => {
    setup('/materias/x', vi.fn().mockRejectedValue(new ApiError('Matéria não encontrada.', 404)))
    expect(await screen.findByText('Matéria não encontrada.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar às matérias' })).toHaveAttribute('href', '/materias')
  })
})