import { describe, it, expect } from 'vitest'
import { translateAuthError, validateEmail, validatePassword } from './authErrors'

describe('translateAuthError', () => {
  it.each([
    ['auth/invalid-credential', 'E-mail ou senha incorretos.'],
    ['auth/wrong-password', 'E-mail ou senha incorretos.'],
    ['auth/user-not-found', 'E-mail ou senha incorretos.'],
    ['auth/email-already-in-use', 'Este e-mail já está cadastrado.'],
    ['auth/weak-password', 'A senha deve ter pelo menos 6 caracteres.'],
    ['auth/invalid-email', 'E-mail inválido.'],
    ['auth/too-many-requests', 'Muitas tentativas. Tente novamente mais tarde.'],
    ['auth/popup-closed-by-user', 'Login com Google cancelado.'],
    ['auth/network-request-failed', 'Sem conexão. Verifique sua internet.'],
  ])('%s', (code, message) => {
    expect(translateAuthError({ code })).toBe(message)
  })

  it('usa mensagem genérica para código desconhecido ou erro sem código', () => {
    expect(translateAuthError({ code: 'auth/xyz' })).toBe('Não foi possível concluir. Tente novamente.')
    expect(translateAuthError(new Error('x'))).toBe('Não foi possível concluir. Tente novamente.')
    expect(translateAuthError(null)).toBe('Não foi possível concluir. Tente novamente.')
  })
})

describe('validateEmail', () => {
  it('aceita e-mails válidos e rejeita inválidos', () => {
    expect(validateEmail('a@b.com')).toBeNull()
    expect(validateEmail('  a@b.com ')).toBeNull()
    expect(validateEmail('')).toBe('Informe o e-mail.')
    expect(validateEmail('abc')).toBe('E-mail inválido.')
    expect(validateEmail('a@b')).toBe('E-mail inválido.')
  })
})

describe('validatePassword', () => {
  it('exige ao menos 6 caracteres', () => {
    expect(validatePassword('123456')).toBeNull()
    expect(validatePassword('')).toBe('Informe a senha.')
    expect(validatePassword('12345')).toBe('A senha deve ter pelo menos 6 caracteres.')
  })
})