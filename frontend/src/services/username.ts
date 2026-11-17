export function validateUsername(value: string): string | null {
  const username = value.trim()
  if (!username) return 'Informe o nome de usuário.'
  if (username.length < 3 || username.length > 30) return 'O nome de usuário deve ter de 3 a 30 caracteres.'
  if (!/^[a-zA-Z0-9._]+$/.test(username)) return 'Use apenas letras, números, ponto e sublinhado.'
  if (/^\d+$/.test(username)) return 'O nome de usuário não pode ter só números.'
  return null
}

export function suggestUsername(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split('@')[0] || ''
  const normalized = source
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 30)

  return validateUsername(normalized) ? '' : normalized
}