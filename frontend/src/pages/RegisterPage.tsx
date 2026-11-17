import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SignupLayout } from '../components/SignupLayout'
import { FloatingInput } from '../components/FloatingInput'
import { register } from '../services/authService'
import { profileApi } from '../services/profileApi'
import { translateAuthError, validateEmail, validatePassword } from '../services/authErrors'
import { validateUsername } from '../services/username'
import styles from './AuthForm.module.css'

interface RegisterPageProps {
  onRegister?: (email: string, password: string) => Promise<unknown>
  onProfile?: (data: { username?: string; name?: string }) => Promise<unknown>
}

type Errors = Partial<Record<'name' | 'username' | 'email' | 'password' | 'confirm', string>>

export function RegisterPage({
  onRegister = register,
  onProfile = profileApi.update,
}: RegisterPageProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next: Errors = {
      name: name.trim() ? (name.trim().length > 50 ? 'O nome pode ter no máximo 50 caracteres.' : undefined) : 'Informe o nome.',
      username: validateUsername(username) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirm: password && confirm !== password ? 'As senhas não conferem.' : undefined,
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    setFormError('')
    setSubmitting(true)

    try {
      await onRegister(email, password)
    } catch (error) {
      setFormError(translateAuthError(error))
      setSubmitting(false)
      return
    }

    // A conta já existe: falhas daqui em diante não são erro de cadastro
    const finalName = name.trim()
    try {
      await onProfile({ username: username.trim(), name: finalName })
      navigate('/materias')
    } catch {
      try {
        await onProfile({ name: finalName })
      } catch {
        // o name pode ser editado depois no Perfil
      }
      navigate('/escolher-username')
    }
  }

  return (
    <SignupLayout>
      <h1 className={styles.title}>Crie sua conta</h1>
      <p className={styles.subtitle}>Comece sua jornada de estudos</p>

      <form onSubmit={(e) => void handleSubmit(e)} noValidate>
        <FloatingInput id="name" label="Name" autoComplete="name" value={name} onChange={setName} error={errors.name} />
        <FloatingInput id="username" label="UserName" autoComplete="username" value={username} onChange={setUsername} error={errors.username} />
        <FloatingInput id="email" label="E-mail" type="email" autoComplete="email" value={email} onChange={setEmail} error={errors.email} />
        <FloatingInput id="password" label="Crie senha" type="password" autoComplete="new-password" value={password} onChange={setPassword} error={errors.password} />
        <FloatingInput id="confirm" label="Confirmar senha" type="password" autoComplete="new-password" value={confirm} onChange={setConfirm} error={errors.confirm} />

        {formError && <p className={styles.formError} role="alert">{formError}</p>}

        <button type="submit" className={styles.primary} disabled={submitting}>
          {submitting ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>

      <p className={styles.footer}>
        Já tem uma conta? <Link to="/login">Entrar</Link>
      </p>
    </SignupLayout>
  )
}