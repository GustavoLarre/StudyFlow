import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProfileProvider } from './ProfileContext'
import { UsernameGate, NeedsUsernameRoute } from './guards'
import type { Profile } from '../services/profileApi'

const profile = (username: string | null): Profile => ({
  uid: 'u1', email: 'a@b.com', plan: 'free', username, name: null,
  xp: { total: 0, level: 1, currentLevelXp: 0, nextLevelXp: 100 },
})

function setup(load: () => Promise<Profile>, path = '/materias') {
  render(
    <ProfileProvider load={load}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/materias" element={<UsernameGate><p>Área logada</p></UsernameGate>} />
          <Route path="/escolher-username" element={<NeedsUsernameRoute><p>Escolha o username</p></NeedsUsernameRoute>} />
        </Routes>
      </MemoryRouter>
    </ProfileProvider>,
  )
  return userEvent.setup()
}

describe('ProfileProvider e guardas', () => {
  it('mostra carregando e não redireciona antes de responder', () => {
    setup(() => new Promise(() => {}))
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('sem username, a área logada redireciona para /escolher-username', async () => {
    setup(() => Promise.resolve(profile(null)))
    expect(await screen.findByText('Escolha o username')).toBeInTheDocument()
  })

  it('com username, a área logada é exibida', async () => {
    setup(() => Promise.resolve(profile('gus')))
    expect(await screen.findByText('Área logada')).toBeInTheDocument()
  })

  it('com username, /escolher-username redireciona para /materias', async () => {
    setup(() => Promise.resolve(profile('gus')), '/escolher-username')
    expect(await screen.findByText('Área logada')).toBeInTheDocument()
  })

  it('falha ao carregar mostra erro e tentar de novo recarrega', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValue(profile('gus'))
    const user = setup(load)

    expect(await screen.findByText('Sem conexão')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByText('Área logada')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })
})