import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from './LoginPage'

function setup(props: Partial<React.ComponentProps<typeof LoginPage>> = {}) {
  const onLogin = vi.fn().mockResolvedValue(undefined)
  const onGoogle = vi.fn().mockResolvedValue(undefined)

  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={onLogin} onGoogle={onGoogle} {...props} />} />
        <Route path="/materias" element={<p>Área logada</p>} />
        <Route path="/cadastro" element={<p>Tela de cadastro</p>} />
        <Route path="/recuperar-senha" element={<p>Tela de recuperação</p>} />
      </Routes>
    </MemoryRouter>,
  )

  return { onLogin, onGoogle, user: userEvent.setup() }
}

const fill = async (user: ReturnType<typeof userEvent.setup>, email: string, password: string) => {
  if (email) await user.type(screen.getByLabelText('E-mail'), email)
  if (password) await user.type(screen.getByLabelText('Senha'), password)
}

describe('LoginPage', () => {
  it('mostra título, campos e links', () => {
    setup()

    expect(screen.getByText('Bem-vindo de volta!')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Esqueceu sua senha?' })).toHaveAttribute('href', '/recuperar-senha')
    expect(screen.getByRole('link', { name: 'Cadastre-se' })).toHaveAttribute('href', '/cadastro')
  })

  it('valida e-mail e senha sem chamar o login', async () => {
    const { onLogin, user } = setup()

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('rejeita e-mail inválido', async () => {
    const { onLogin, user } = setup()

    await fill(user, 'abc', '123456')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('E-mail inválido.')).toBeInTheDocument()
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('faz login com os dados e navega para /materias', async () => {
    const { onLogin, user } = setup()

    await fill(user, 'a@b.com', '123456')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(onLogin).toHaveBeenCalledWith('a@b.com', '123456')
    expect(await screen.findByText('Área logada')).toBeInTheDocument()
  })

  it('mostra erro traduzido e permanece na tela quando o login falha', async () => {
    const { user } = setup({ onLogin: vi.fn().mockRejectedValue({ code: 'auth/invalid-credential' }) })

    await fill(user, 'a@b.com', 'errada1')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument()
    expect(screen.getByText('Bem-vindo de volta!')).toBeInTheDocument()
  })

  it('desabilita o botão enquanto envia', async () => {
    let finish: () => void = () => {}
    const onLogin = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    const { user } = setup({ onLogin })

    await fill(user, 'a@b.com', '123456')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled()
    finish()
    await waitFor(() => expect(screen.getByText('Área logada')).toBeInTheDocument())
  })

  it('o olho alterna a visibilidade da senha', async () => {
    const { user } = setup()
    const input = screen.getByLabelText('Senha')

    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(input).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('entra com Google e navega para /materias', async () => {
    const { onGoogle, user } = setup()

    await user.click(screen.getByRole('button', { name: 'Entrar com Google' }))

    expect(onGoogle).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Área logada')).toBeInTheDocument()
  })

  it('mostra erro traduzido quando o Google é cancelado', async () => {
    const { user } = setup({ onGoogle: vi.fn().mockRejectedValue({ code: 'auth/popup-closed-by-user' }) })

    await user.click(screen.getByRole('button', { name: 'Entrar com Google' }))

    expect(await screen.findByText('Login com Google cancelado.')).toBeInTheDocument()
  })
})