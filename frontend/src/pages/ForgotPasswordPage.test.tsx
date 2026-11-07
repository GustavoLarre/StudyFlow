import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ForgotPasswordPage } from './ForgotPasswordPage'

const NEUTRAL = 'Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.'

function setup(onReset = vi.fn().mockResolvedValue(undefined)) {
  render(
    <MemoryRouter initialEntries={['/recuperar-senha']}>
      <Routes>
        <Route path="/recuperar-senha" element={<ForgotPasswordPage onReset={onReset} />} />
        <Route path="/login" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return { onReset, user: userEvent.setup() }
}

describe('ForgotPasswordPage', () => {
  it('valida e-mail sem enviar', async () => {
    const { onReset, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Enviar link' }))
    expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument()
    expect(onReset).not.toHaveBeenCalled()
  })

  it('envia e mostra a mensagem neutra', async () => {
    const { onReset, user } = setup()
    await user.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await user.click(screen.getByRole('button', { name: 'Enviar link' }))
    expect(onReset).toHaveBeenCalledWith('a@b.com')
    expect(await screen.findByText(NEUTRAL)).toBeInTheDocument()
  })

  it('não revela e-mail inexistente: user-not-found mostra a mesma mensagem', async () => {
    const { user } = setup(vi.fn().mockRejectedValue({ code: 'auth/user-not-found' }))
    await user.type(screen.getByLabelText('E-mail'), 'x@y.com')
    await user.click(screen.getByRole('button', { name: 'Enviar link' }))
    expect(await screen.findByText(NEUTRAL)).toBeInTheDocument()
  })

  it('mostra erro real (rede)', async () => {
    const { user } = setup(vi.fn().mockRejectedValue({ code: 'auth/network-request-failed' }))
    await user.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await user.click(screen.getByRole('button', { name: 'Enviar link' }))
    expect(await screen.findByText('Sem conexão. Verifique sua internet.')).toBeInTheDocument()
  })

  it('tem link para voltar ao login', () => {
    setup()
    expect(screen.getByRole('link', { name: 'Voltar ao login' })).toHaveAttribute('href', '/login')
  })
})