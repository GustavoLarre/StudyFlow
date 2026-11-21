import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteAccountDialog } from './DeleteAccountDialog'

function setup(method: 'password' | 'google' = 'password', overrides = {}) {
  const props = {
    method,
    onReauth: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    onDeleted: vi.fn(),
    ...overrides,
  }
  render(<DeleteAccountDialog {...props} />)
  return { ...props, user: userEvent.setup() }
}

describe('DeleteAccountDialog', () => {
  it('avisa que é irreversível', () => {
    setup()
    expect(screen.getByText(/irreversível/i)).toBeInTheDocument()
  })

  it('o botão só habilita com EXCLUIR exato', async () => {
    const { user } = setup('google')
    const button = screen.getByRole('button', { name: 'Apagar definitivamente' })
    expect(button).toBeDisabled()

    await user.type(screen.getByLabelText('Digite EXCLUIR para confirmar'), 'excluir')
    expect(button).toBeDisabled()

    await user.clear(screen.getByLabelText('Digite EXCLUIR para confirmar'))
    await user.type(screen.getByLabelText('Digite EXCLUIR para confirmar'), 'EXCLUIR')
    expect(button).toBeEnabled()
  })

  it('conta de senha pede a senha e a envia na reautenticação', async () => {
    const { user, onReauth, onDelete, onDeleted } = setup('password')
    await user.type(screen.getByLabelText('Digite EXCLUIR para confirmar'), 'EXCLUIR')
    await user.type(screen.getByLabelText('Sua senha'), 'segredo')
    await user.click(screen.getByRole('button', { name: 'Apagar definitivamente' }))

    expect(onReauth).toHaveBeenCalledWith('segredo')
    expect(onDelete).toHaveBeenCalled()
    expect(onDeleted).toHaveBeenCalled()
  })

  it('conta de senha sem senha mostra erro e não apaga', async () => {
    const { user, onDelete } = setup('password')
    await user.type(screen.getByLabelText('Digite EXCLUIR para confirmar'), 'EXCLUIR')
    await user.click(screen.getByRole('button', { name: 'Apagar definitivamente' }))

    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('conta Google não pede senha', async () => {
    const { user, onReauth, onDeleted } = setup('google')
    expect(screen.queryByLabelText('Sua senha')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Digite EXCLUIR para confirmar'), 'EXCLUIR')
    await user.click(screen.getByRole('button', { name: 'Apagar definitivamente' }))

    expect(onReauth).toHaveBeenCalledWith(undefined)
    expect(onDeleted).toHaveBeenCalled()
  })

  it('falha na reautenticação mostra erro traduzido e não apaga', async () => {
    const { user, onDelete } = setup('password', {
      onReauth: vi.fn().mockRejectedValue({ code: 'auth/invalid-credential' }),
    })
    await user.type(screen.getByLabelText('Digite EXCLUIR para confirmar'), 'EXCLUIR')
    await user.type(screen.getByLabelText('Sua senha'), 'errada')
    await user.click(screen.getByRole('button', { name: 'Apagar definitivamente' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('Cancelar chama onCancel', async () => {
    const { user, onCancel } = setup()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalled()
  })

    it('tem título acessível e o campo de senha esconde o que é digitado', () => {
    setup('password')

    expect(screen.getByRole('dialog', { name: 'Apagar sua conta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Sua senha')).toHaveAttribute('type', 'password')
  })
})