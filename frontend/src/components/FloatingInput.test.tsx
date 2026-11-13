import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FloatingInput } from './FloatingInput'

describe('FloatingInput', () => {
  it('associa o rótulo ao campo', () => {
    render(<FloatingInput id="n" label="Name" value="" onChange={() => {}} />)
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  it('mostra mensagem de erro quando informada', () => {
    render(<FloatingInput id="n" label="Name" value="" onChange={() => {}} error="Informe o nome." />)
    expect(screen.getByText('Informe o nome.')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true')
  })

  it('campo de senha alterna a visibilidade pelo olho', async () => {
    const user = userEvent.setup()
    render(<FloatingInput id="p" label="Crie senha" type="password" value="abc" onChange={() => {}} />)
    const input = screen.getByLabelText('Crie senha')

    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(input).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('campo comum não mostra o olho', () => {
    render(<FloatingInput id="e" label="E-mail" value="" onChange={() => {}} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})