import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SubjectsPage } from './SubjectsPage'
import { ApiError } from '../services/apiClient'

const S1 = { subjectId: 's1', title: 'Redes' }
const S2 = { subjectId: 's2', title: 'Banco de Dados' }

function setup(initial = [S1, S2]) {
  const subjects = {
    list: vi.fn().mockResolvedValue(initial),
    create: vi.fn().mockImplementation(async (title: string) => ({ subjectId: 'novo', title })),
    rename: vi.fn().mockImplementation(async (id: string, title: string) => ({ subjectId: id, title })),
    remove: vi.fn().mockResolvedValue({ notes: 0, flashcards: 0 }),
  }
  render(
    <MemoryRouter initialEntries={['/materias']}>
      <Routes>
        <Route path="/materias" element={<SubjectsPage subjects={subjects} />} />
        <Route path="/materias/:id" element={<p>Detalhe da matéria</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return { subjects, user: userEvent.setup() }
}

describe('SubjectsPage', () => {
  it('mostra carregando e depois as matérias', async () => {
    setup()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    expect(await screen.findByText('Redes')).toBeInTheDocument()
    expect(screen.getByText('Banco de Dados')).toBeInTheDocument()
  })

  it('mostra estado vazio sem matérias', async () => {
    setup([])
    expect(await screen.findByText('Você ainda não tem matérias.')).toBeInTheDocument()
  })

  it('cria matéria com título aparado e a exibe', async () => {
    const { subjects, user } = setup([])
    await screen.findByText('Você ainda não tem matérias.')

    await user.type(screen.getByLabelText('Nova matéria'), '  Sistemas  ')
    await user.click(screen.getByRole('button', { name: 'Criar' }))

    expect(subjects.create).toHaveBeenCalledWith('Sistemas')
    expect(await screen.findByText('Sistemas')).toBeInTheDocument()
  })

  it('não chama a API com título vazio', async () => {
    const { subjects, user } = setup([])
    await screen.findByText('Você ainda não tem matérias.')

    await user.click(screen.getByRole('button', { name: 'Criar' }))

    expect(screen.getByText('Informe o título da matéria.')).toBeInTheDocument()
    expect(subjects.create).not.toHaveBeenCalled()
  })

  it('mostra a mensagem do backend quando a criação falha', async () => {
    const { subjects, user } = setup([])
    subjects.create.mockRejectedValue(new ApiError('O título deve ter no máximo 100 caracteres.', 400))
    await screen.findByText('Você ainda não tem matérias.')

    await user.type(screen.getByLabelText('Nova matéria'), 'x')
    await user.click(screen.getByRole('button', { name: 'Criar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('O título deve ter no máximo 100 caracteres.')
  })

  it('renomeia uma matéria', async () => {
    const { subjects, user } = setup()
    await screen.findByText('Redes')

    await user.click(screen.getByRole('button', { name: 'Renomear Redes' }))
    const input = screen.getByLabelText('Título da matéria')
    await user.clear(input)
    await user.type(input, 'Redes de Computadores')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(subjects.rename).toHaveBeenCalledWith('s1', 'Redes de Computadores')
    expect(await screen.findByText('Redes de Computadores')).toBeInTheDocument()
  })

  it('exclui só depois da confirmação, avisando sobre o conteúdo', async () => {
    const { subjects, user } = setup()
    await screen.findByText('Redes')

    await user.click(screen.getByRole('button', { name: 'Excluir Redes' }))
    expect(subjects.remove).not.toHaveBeenCalled()

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/notas e flashcards/i)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    expect(subjects.remove).toHaveBeenCalledWith('s1')
    expect(screen.queryByText('Redes')).not.toBeInTheDocument()
  })

  it('cancelar a exclusão mantém a matéria', async () => {
    const { subjects, user } = setup()
    await screen.findByText('Redes')

    await user.click(screen.getByRole('button', { name: 'Excluir Redes' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))

    expect(subjects.remove).not.toHaveBeenCalled()
    expect(screen.getByText('Redes')).toBeInTheDocument()
  })

  it('clicar na matéria abre o detalhe', async () => {
    const { user } = setup()
    await user.click(await screen.findByRole('link', { name: 'Redes' }))

    expect(screen.getByText('Detalhe da matéria')).toBeInTheDocument()
  })
})