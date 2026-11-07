import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { RegisterPage } from './RegisterPage'

function setup(props: Partial<React.ComponentProps<typeof RegisterPage>> = {}) {
  const onRegister = vi.fn().mockResolvedValue(undefined)
  const onGoogle = vi.fn().mockResolvedValue(undefined)
  render(
    <MemoryRouter initialEntries={['/cadastro']}>
      <Routes>
        <Route path="/cadastro" element={<RegisterPage onRegister={onRegister} onGoogle={onGoogle} {...props} />} />
        <Route path="/materias" element={<p>Área logada</p>} />
        <Route path="/login" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return { onRegister, onGoogle, user: userEvent.setup() }
}

const fill = async (user: ReturnType<typeof userEvent.setup>, email: string, pass: string, confirm: string) => {
  if (email) await user.type(screen.getByLabelText('E-mail'), email)
  if (pass) await user.type(screen.getByLabelText('Senha'), pass)
  if (confirm) await user.type(screen.getByLabelText('Confirmar senha'), confirm)
}

describe('RegisterPage', () => {
  it('mostra título, campos e link para o login', () => {
    setup()
    expect(screen.getByText('Crie sua conta')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
  })

  it('valida campos vazios sem cadastrar', async () => {
    const { onRegister, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(onRegister).not.toHaveBeenCalled()
  })

  it('rejeita senhas diferentes', async () => {
    const { onRegister, user } = setup()
    await fill(user, 'a@b.com', '123456', '654321')
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument()
    expect(onRegister).not.toHaveBeenCalled()
  })

  it('cadastra e navega para /materias', async () => {
    const { onRegister, user } = setup()
    await fill(user, 'a@b.com', '123456', '123456')
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(onRegister).toHaveBeenCalledWith('a@b.com', '123456')
    expect(await screen.findByText('Área logada')).toBeInTheDocument()
  })

  it('mostra erro traduzido quando o e-mail já existe', async () => {
    const { user } = setup({ onRegister: vi.fn().mockRejectedValue({ code: 'auth/email-already-in-use' }) })
    await fill(user, 'a@b.com', '123456', '123456')
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(await screen.findByText('Este e-mail já está cadastrado.')).toBeInTheDocument()
  })

  it('cadastra com Google', async () => {
    const { onGoogle, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Cadastrar com Google' }))
    expect(onGoogle).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Área logada')).toBeInTheDocument()
  })
})