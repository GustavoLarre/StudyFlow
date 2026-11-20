import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('mostra os links com ícone decorativo e nome acessível', () => {
    const { container } = render(<MemoryRouter><AppLayout /></MemoryRouter>)
    for (const name of ['Matérias', 'Revisão', 'Tarefas', 'Progresso', 'Perfil']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
    expect(container.querySelectorAll('nav svg[aria-hidden="true"]')).toHaveLength(5)
  })
})