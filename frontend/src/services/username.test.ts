import { describe, it, expect } from 'vitest'
import { validateUsername, suggestUsername } from './username'

describe('validateUsername', () => {
  it('aceita nomes válidos', () => {
    expect(validateUsername('gustavo.dev')).toBeNull()
    expect(validateUsername('_ab')).toBeNull()
  })

  it.each([
    ['', 'Informe o nome de usuário.'],
    ['ab', 'O nome de usuário deve ter de 3 a 30 caracteres.'],
    ['com espaço', 'Use apenas letras, números, ponto e sublinhado.'],
    ['12345', 'O nome de usuário não pode ter só números.'],
  ])('rejeita %p', (value, message) => {
    expect(validateUsername(value)).toBe(message)
  })
})

describe('suggestUsername', () => {
  it('normaliza o nome: minúsculas, sem acentos e sem espaços', () => {
    expect(suggestUsername('João Silva', 'x@y.com')).toBe('joaosilva')
  })

  it('usa a parte do e-mail quando não há nome', () => {
    expect(suggestUsername(null, 'Gustavo.Dev@gmail.com')).toBe('gustavo.dev')
  })

  it('corta em 30 caracteres', () => {
    expect(suggestUsername('a'.repeat(40), null)).toBe('a'.repeat(30))
  })

  it('devolve vazio quando o resultado é inválido', () => {
    expect(suggestUsername('é', null)).toBe('')
    expect(suggestUsername('123456', null)).toBe('')
    expect(suggestUsername(null, null)).toBe('')
  })
})