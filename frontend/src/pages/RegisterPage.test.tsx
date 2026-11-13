import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { RegisterPage } from './RegisterPage'

function setup(props: Partial<React.ComponentProps<typeof RegisterPage>> = {}) {
  const onRegister = vi.fn().mockResolvedValue(undefined)
  render(
    <MemoryRouter initialEntries={['/cadastro']}>
      <Routes>
        <Route path="/cadastro" element={<RegisterPage onRegister={onRegister} {...props} />} />
        <Route path="/materias" element={<p>Área logada</p>} />
        <Route path="/login" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return { onRegister, user: userEvent.setup() }
}

const fill = async (
  user: ReturnType<typeof userEvent.setup>,
  v: { name?: string; username?: string; email?: string; pass?: string; confirm?: string },
) => {
  if (v.name) await user.type(screen.getByLabelText('Name'), v.name)
  if (v.username) await user.type(screen.getByLabelText('UserName'), v.username)
  if (v.email) await user.type(screen.getByLabelText('E-mail'), v.email)
  if (v.pass) await user.type(screen.getByLabelText('Crie senha'), v.pass)
  if (v.confirm) await user.type(screen.getByLabelText('Confirmar senha'), v.confirm)
}

const VALID = { name: 'Gustavo', username: 'gustavo.dev', email: 'a@b.com', pass: '123456', confirm: '123456' }

describe('RegisterPage', () => {
  it('mostra título, subtítulo, campos e link para o login', () => {
    setup()
    expect(screen.getByText('Crie sua conta')).toBeInTheDocument()
    expect(screen.getByText('Comece sua jornada de estudos')).toBeInTheDocument()
    for (const l of ['Name', 'UserName', 'E-mail', 'Crie senha', 'Confirmar senha']) {
      expect(screen.getByLabelText(l)).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
  })

  it('valida campos vazios sem cadastrar', async () => {
    const { onRegister, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(screen.getByText('Informe o nome.')).toBeInTheDocument()
    expect(screen.getByText('Informe o nome de usuário.')).toBeInTheDocument()
    expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(onRegister).not.toHaveBeenCalled()
  })

  it.each([
    ['ab', 'O nome de usuário deve ter de 3 a 30 caracteres.'],
    ['a'.repeat(31), 'O nome de usuário deve ter de 3 a 30 caracteres.'],
    ['com espaço', 'Use apenas letras, números, ponto e sublinhado.'],
    ['usuário', 'Use apenas letras, números, ponto e sublinhado.'],
    ['12345', 'O nome de usuário não pode ter só números.'],
  ])('rejeita username inválido (%s)', async (username, message) => {
    const { onRegister, user } = setup()
    await fill(user, { ...VALID, username })
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(onRegister).not.toHaveBeenCalled()
  })

  it('rejeita senhas diferentes', async () => {
    const { onRegister, user } = setup()
    await fill(user, { ...VALID, confirm: '654321' })
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(screen.getByText('As senhas não conferem.')).toBeInTheDocument()
    expect(onRegister).not.toHaveBeenCalled()
  })

  it('cadastra e navega para /materias', async () => {
    const { onRegister, user } = setup()
    await fill(user, VALID)
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(onRegister).toHaveBeenCalledWith('a@b.com', '123456')
    expect(await screen.findByText('Área logada')).toBeInTheDocument()
  })

  it('mostra erro traduzido quando o e-mail já existe', async () => {
    const { user } = setup({ onRegister: vi.fn().mockRejectedValue({ code: 'auth/email-already-in-use' }) })
    await fill(user, VALID)
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))
    expect(await screen.findByText('Este e-mail já está cadastrado.')).toBeInTheDocument()
  })
})