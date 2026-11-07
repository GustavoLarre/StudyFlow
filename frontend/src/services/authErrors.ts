const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
  'auth/popup-closed-by-user': 'Login com Google cancelado.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
}

const GENERIC = 'Não foi possível concluir. Tente novamente.'

export function translateAuthError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code
  return (code && MESSAGES[code]) || GENERIC
}

export function validateEmail(value: string): string | null {
  const email = value.trim()
  if (!email) return 'Informe o e-mail.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido.'
  return null
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Informe a senha.'
  if (value.length < 6) return 'A senha deve ter pelo menos 6 caracteres.'
  return null
}