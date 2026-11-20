import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ProfilePage } from './ProfilePage'
import { ProfileProvider } from '../profile/ProfileContext'
import { ApiError } from '../services/apiClient'
import type { Profile } from '../services/profileApi'

const PROFILE: Profile = {
  uid: 'u1', email: 'a@b.com', plan: 'free', username: 'gustavo', name: 'Gustavo',
  usernameChanged: false,
  xp: { total: 120, level: 2, currentLevelXp: 20, nextLevelXp: 200 },
}

function setup(profile: Profile = PROFILE, overrides: Record<string, unknown> = {}) {
  const api = {
    update: vi.fn().mockImplementation(async (d: object) => ({ ...profile, ...d })),
    checkUsername: vi.fn().mockResolvedValue({ available: true }),
    remove: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  const onLogout = vi.fn().mockResolvedValue(undefined)
  render(
    <ProfileProvider load={() => Promise.resolve(profile)}>
      <MemoryRouter>
        <ProfilePage profileApi={api as never} onLogout={onLogout} />
      </MemoryRouter>
    </ProfileProvider>,
  )
  return { api, onLogout, user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime }) }
}

const debounce = () => act(async () => { await vi.advanceTimersByTimeAsync(500) })

describe('ProfilePage', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  it('mostra nome, @username, e-mail, nível e XP', async () => {
    setup()
    expect(await screen.findByText('@gustavo')).toBeInTheDocument()
    expect(screen.getByText('a@b.com')).toBeInTheDocument()
    expect(screen.getByText('Nível 2')).toBeInTheDocument()
    expect(screen.getByText('XP total: 120')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20')
  })

  it('não exibe o plano', async () => {
    setup()
    await screen.findByText('@gustavo')
    expect(screen.queryByText(/plano/i)).not.toBeInTheDocument()
  })

  it('salva o nome aparado', async () => {
    const { api, user } = setup()
    const input = await screen.findByDisplayValue('Gustavo')
    await user.clear(input)
    await user.type(input, '  Gus  ')
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }))

    expect(api.update).toHaveBeenCalledWith({ name: 'Gus' })
    expect(await screen.findByText('Nome atualizado.')).toBeInTheDocument()
  })

  it('nome vazio não chama a API', async () => {
    const { api, user } = setup()
    const input = await screen.findByDisplayValue('Gustavo')
    await user.clear(input)
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }))

    expect(await screen.findByText('Informe o nome.')).toBeInTheDocument()
    expect(api.update).not.toHaveBeenCalled()
  })

   it('altera o username depois de checar a disponibilidade', async () => {
    const { api, user } = setup()
    const input = await screen.findByDisplayValue('gustavo')
    await user.clear(input)
    await user.type(input, 'novo.nome')
    await debounce()
    expect(await screen.findByText('Disponível')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Alterar nome de usuário' }))

    expect(api.update).toHaveBeenCalledWith({ username: 'novo.nome' })
    expect(await screen.findByText('Nome de usuário atualizado.')).toBeInTheDocument()
  })

  it('avisa que só pode trocar uma vez', async () => {
    setup()
    expect(await screen.findByText(/apenas uma vez/)).toBeInTheDocument()
  })

  it('username indisponível bloqueia o botão', async () => {
    const { user } = setup(PROFILE, { checkUsername: vi.fn().mockResolvedValue({ available: false }) })
    const input = await screen.findByLabelText('Nome de usuário')
    await user.clear(input)
    await user.type(input, 'ocupado')
    await debounce()

    expect(await screen.findByText('Esse nome de usuário já está em uso.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alterar nome de usuário' })).toBeDisabled()
  })

  it('se já trocou, o campo fica desabilitado com explicação', async () => {
    setup({ ...PROFILE, usernameChanged: true })
    const input = await screen.findByLabelText('Nome de usuário')
    expect(input).toBeDisabled()
    expect(screen.getByText(/já alterou/)).toBeInTheDocument()
  })

   it('mostra o erro do backend ao falhar', async () => {
    const { user } = setup(PROFILE, { update: vi.fn().mockRejectedValue(new ApiError('Falha ao salvar.', 500)) })
    await screen.findByDisplayValue('Gustavo')
    await user.click(screen.getByRole('button', { name: 'Salvar nome' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar.')
  })

    it('mostra o resumo da conta numa coluna lateral, com Sair', async () => {
    setup()
    await screen.findByText('@gustavo')

    const side = screen.getByRole('complementary', { name: 'Resumo do perfil' })
    expect(within(side).getByText('Gustavo')).toBeInTheDocument()
    expect(within(side).getByText('@gustavo')).toBeInTheDocument()
    expect(within(side).getByText('a@b.com')).toBeInTheDocument()
    expect(within(side).getByText('Nível 2')).toBeInTheDocument()
    expect(within(side).getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('agrupa nome e username em Informações da conta', async () => {
    setup()
    await screen.findByText('@gustavo')

    const group = screen.getByRole('region', { name: 'Informações da conta' })
    expect(within(group).getByLabelText('Nome')).toBeInTheDocument()
    expect(within(group).getByLabelText('Nome de usuário')).toBeInTheDocument()
  })

  it('a zona de perigo é uma seção própria com o botão Apagar conta', async () => {
    setup()
    await screen.findByText('@gustavo')

    const danger = screen.getByRole('region', { name: 'Zona de perigo' })
    expect(within(danger).getByRole('button', { name: 'Apagar conta' })).toBeInTheDocument()
  })

  it('Sair chama o logout', async () => {
    const { onLogout, user } = setup()
    await screen.findByText('@gustavo')
    await user.click(screen.getByRole('button', { name: 'Sair' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})