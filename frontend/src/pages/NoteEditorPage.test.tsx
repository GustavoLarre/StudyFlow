import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { NoteEditorPage } from './NoteEditorPage'
import { ApiError } from '../services/apiClient'
import type { Note } from '../services/notesApi'

const N1: Note = {
  noteId: 'n1', subjectId: 's1', title: 'HTTP', content: 'Opera na camada de aplicação.',
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
}

function setup(path: string) {
  const store = new Map<string, Note>([[N1.noteId, N1]])
  const notes = {
    get: vi.fn(async (id: string) => {
      const note = store.get(id)
      if (!note) throw new ApiError('Nota não encontrada.', 404)
      return note
    }),
    create: vi.fn(async (_s: string, d: { title?: string; content: string }) => {
      const note = { ...N1, noteId: 'novo', title: d.title || 'Nota sem título', content: d.content }
      store.set('novo', note)
      return note
    }),
    update: vi.fn(async (id: string, d: { title?: string; content?: string }) => {
      const note = { ...store.get(id)!, ...d }
      store.set(id, note)
      return note
    }),
  }
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/materias/:id/notas/nova" element={<NoteEditorPage notes={notes} />} />
        <Route path="/materias/:id/notas/:noteId" element={<NoteEditorPage notes={notes} />} />
        <Route path="/materias/:id" element={<p>Lista de notas</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return { notes, user: userEvent.setup() }
}

describe('NoteEditorPage', () => {
  it('nota nova abre em branco com Salvar desabilitado', () => {
    setup('/materias/s1/notas/nova')

    expect(screen.getByLabelText('Título da nota')).toHaveValue('')
    expect(screen.getByLabelText('Conteúdo da nota')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('digitar habilita Salvar e mostra alterações não salvas', async () => {
    const { user } = setup('/materias/s1/notas/nova')

    await user.type(screen.getByLabelText('Conteúdo da nota'), 'abc')

    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled()
    expect(screen.getByText('3/6000')).toBeInTheDocument()
  })

  it('não salva conteúdo vazio nem acima de 6000', async () => {
    const { notes, user } = setup('/materias/s1/notas/nova')

    await user.type(screen.getByLabelText('Título da nota'), 'Só título')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(screen.getByText('Informe o conteúdo da nota.')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Conteúdo da nota'))
    await user.paste('a'.repeat(6001))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(screen.getByText('A nota pode ter no máximo 6000 caracteres.')).toBeInTheDocument()
    expect(notes.create).not.toHaveBeenCalled()
  })

  it('salva nota nova e permanece no editor', async () => {
    const { notes, user } = setup('/materias/s1/notas/nova')

    await user.type(screen.getByLabelText('Título da nota'), 'Grafos')
    await user.type(screen.getByLabelText('Conteúdo da nota'), 'Vértices')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(notes.create).toHaveBeenCalledWith('s1', { title: 'Grafos', content: 'Vértices' })
    expect(await screen.findByDisplayValue('Grafos')).toBeInTheDocument()
    expect(await screen.findByText('Salvo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('título vazio vira "Nota sem título"', async () => {
    const { notes, user } = setup('/materias/s1/notas/nova')

    await user.type(screen.getByLabelText('Conteúdo da nota'), 'texto')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(notes.create).toHaveBeenCalledWith('s1', { title: 'Nota sem título', content: 'texto' })
  })

  it('abre nota existente com o conteúdo carregado e sem pendências', async () => {
    setup('/materias/s1/notas/n1')

    expect(await screen.findByDisplayValue('HTTP')).toBeInTheDocument()
    expect(screen.getByLabelText('Conteúdo da nota')).toHaveValue(N1.content)
    expect(screen.getByText('Salvo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('edita nota existente e precisa salvar de novo', async () => {
    const { notes, user } = setup('/materias/s1/notas/n1')
    const area = await screen.findByLabelText('Conteúdo da nota')
    await screen.findByDisplayValue('HTTP')

    await user.clear(area)
    await user.type(area, 'Novo texto')
    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(notes.update).toHaveBeenCalledWith('n1', { title: 'HTTP', content: 'Novo texto' })
    expect(await screen.findByText('Salvo')).toBeInTheDocument()
  })

  it('Voltar sem alterações vai direto para a lista', async () => {
    const { user } = setup('/materias/s1/notas/n1')
    await screen.findByDisplayValue('HTTP')

    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByText('Lista de notas')).toBeInTheDocument()
  })

  it('Voltar com alterações pergunta; cancelar mantém e descartar volta', async () => {
    const { user } = setup('/materias/s1/notas/n1')
    await screen.findByDisplayValue('HTTP')
    await user.type(screen.getByLabelText('Conteúdo da nota'), ' extra')

    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/alterações não salvas/i)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByText('Lista de notas')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Descartar' }))
    expect(screen.getByText('Lista de notas')).toBeInTheDocument()
  })

  it('nota inexistente mostra mensagem e link de volta', async () => {
    setup('/materias/s1/notas/x')

    expect(await screen.findByText('Nota não encontrada.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar às notas' })).toHaveAttribute('href', '/materias/s1')
  })

  it('mostra o erro do backend quando salvar falha', async () => {
    const { notes, user } = setup('/materias/s1/notas/nova')
    notes.create.mockRejectedValue(new ApiError('Falha ao salvar.', 500))

    await user.type(screen.getByLabelText('Conteúdo da nota'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar.')
  })
})