import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './routes'

type Listener = (user: { uid: string; email: string } | null) => void

function setup(initialPath: string) {
  let listener: Listener = () => {}
  const subscribe = vi.fn((cb: Listener) => {
    listener = cb
    return () => {}
  })

  render(
    <AuthProvider subscribe={subscribe}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><p>Tela de login</p></PublicOnlyRoute>} />
          <Route path="/materias" element={<ProtectedRoute><p>Área logada</p></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

  return { emit: (user: Parameters<Listener>[0]) => act(() => listener(user)) }
}

describe('AuthProvider + rotas', () => {
  it('mostra carregando e não redireciona antes do Firebase responder', () => {
    setup('/materias')

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument()
  })

  it('sem usuário, rota protegida redireciona para /login', () => {
    const { emit } = setup('/materias')

    emit(null)

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it('com usuário, rota protegida mostra a página', () => {
    const { emit } = setup('/materias')

    emit({ uid: 'u1', email: 'a@b.com' })

    expect(screen.getByText('Área logada')).toBeInTheDocument()
  })

  it('com usuário, /login redireciona para /materias', () => {
    const { emit } = setup('/login')

    emit({ uid: 'u1', email: 'a@b.com' })

    expect(screen.getByText('Área logada')).toBeInTheDocument()
  })

  it('reage ao logout: sai da área logada para o login', () => {
    const { emit } = setup('/materias')
    emit({ uid: 'u1', email: 'a@b.com' })
    expect(screen.getByText('Área logada')).toBeInTheDocument()

    emit(null)

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })
})