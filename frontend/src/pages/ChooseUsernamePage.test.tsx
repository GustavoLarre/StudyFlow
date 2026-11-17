import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ChooseUsernamePage } from './ChooseUsernamePage'
import { ProfileProvider } from '../profile/ProfileContext'
import { ApiError } from '../services/apiClient'
import type { Profile } from '../services/profileApi'

const PROFILE: Profile = {
  uid: 'u1', email: 'gustavo.dev@gmail.com', plan: 'free', username: null, name: 'Gustavo',
  usernameChanged: false, // <--- Adicionado aqui
  xp: { total: 0, level: 1, currentLevelXp: 0, nextLevelXp: 100 },
}

function setup(overrides: Record<string, unknown> = {}) {
  const profileApi = {
    checkUsername: vi.fn().mockResolvedValue({ available: true }),
    update: vi.fn().mockResolvedValue({ ...PROFILE, username: 'gustavo' }),
    ...overrides,
  }
  const load = vi.fn().mockResolvedValue(PROFILE)
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

  render(
    <ProfileProvider load={load}>
      <MemoryRouter initialEntries={['/escolher-username']}>
        <Routes>
          <Route path="/escolher-username" element={<ChooseUsernamePage profileApi={profileApi as never} />} />
          <Route path="/materias" element={<p>Área logada</p>} />
        </Routes>
      </MemoryRouter>
    </ProfileProvider>,
  )
  return { profileApi, user }
}

const debounce = () => act(async () => { await vi.advanceTimersByTimeAsync(500) })

describe('ChooseUsernamePage', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  it('sugere o username a partir do nome e checa a disponibilidade', async () => {
    const { profileApi } = setup()

    expect(await screen.findByDisplayValue('gustavo')).toBeInTheDocument()
    await debounce()

    expect(profileApi.checkUsername).toHaveBeenCalledWith('gustavo')
    expect(await screen.findByText('Disponível')).toBeInTheDocument()
  })

  it('só consulta depois de 500 ms sem digitar', async () => {
    const { profileApi, user } = setup()
    const input = await screen.findByLabelText('Nome de usuário')
    await debounce()
    profileApi.checkUsername.mockClear()

    await user.clear(input)
    await user.type(input, 'novo.nome')
    expect(profileApi.checkUsername).not.toHaveBeenCalled()

    await debounce()
    expect(profileApi.checkUsername).toHaveBeenCalledTimes(1)
    expect(profileApi.checkUsername).toHaveBeenCalledWith('novo.nome')
  })

  it('formato inválido mostra erro sem consultar a API', async () => {
    const { profileApi, user } = setup()
    const input = await screen.findByLabelText('Nome de usuário')
    await debounce()
    profileApi.checkUsername.mockClear()

    await user.clear(input)
    await user.type(input, 'ab')
    await debounce()

    expect(screen.getByText('O nome de usuário deve ter de 3 a 30 caracteres.')).toBeInTheDocument()
    expect(profileApi.checkUsername).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  })

  it('indisponível mostra o motivo e bloqueia o botão', async () => {
    const { user } = setup({ checkUsername: vi.fn().mockResolvedValue({ available: false, reason: 'Esse nome de usuário não está disponível.' }) })
    const input = await screen.findByLabelText('Nome de usuário')
    await user.clear(input)
    await user.type(input, 'admin')
    await debounce()

    expect(await screen.findByText('Esse nome de usuário não está disponível.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  })

  it('indisponível sem motivo usa a mensagem padrão', async () => {
    setup({ checkUsername: vi.fn().mockResolvedValue({ available: false }) })
    await screen.findByDisplayValue('gustavo')
    await debounce()

    expect(await screen.findByText('Esse nome de usuário já está em uso.')).toBeInTheDocument()
  })

  it('confirma, grava o username e navega para /materias', async () => {
    const { profileApi, user } = setup()
    await screen.findByDisplayValue('gustavo')
    await debounce()
    await screen.findByText('Disponível')

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(profileApi.update).toHaveBeenCalledWith({ username: 'gustavo' })
    expect(await screen.findByText('Área logada')).toBeInTheDocument()
  })

  it('409 na confirmação mostra a mensagem e permanece na tela', async () => {
    const { user } = setup({ update: vi.fn().mockRejectedValue(new ApiError('Esse nome de usuário já está em uso.', 409, 'USERNAME_TAKEN')) })
    await screen.findByDisplayValue('gustavo')
    await debounce()
    await screen.findByText('Disponível')

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Esse nome de usuário já está em uso.')
    expect(screen.queryByText('Área logada')).not.toBeInTheDocument()
  })

  it('avisa que só pode trocar uma vez depois', async () => {
    setup()
    expect(await screen.findByText(/apenas uma vez/)).toBeInTheDocument()
  })
})