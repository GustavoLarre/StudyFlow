import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { register, loginWithGoogle } from '../services/authService'
import { translateAuthError, validateEmail, validatePassword } from '../services/authErrors'
import styles from './AuthForm.module.css'

interface RegisterPageProps {
  onRegister?: (email: string, password: string) => Promise<unknown>
  onGoogle?: () => Promise<unknown>
}

export function RegisterPage({ onRegister = register, onGoogle = loginWithGoogle }: RegisterPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function run(action: () => Promise<unknown>) {
    setFormError('')
    setSubmitting(true)
    try {
      await action()
      navigate('/materias')
    } catch (error) {
      setFormError(translateAuthError(error))
      setSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const next = {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirm: password && confirm !== password ? 'As senhas não conferem.' : undefined,
    }
    setErrors(next)
    if (next.email || next.password || next.confirm) return

    void run(() => onRegister(email, password))
  }

  return (
    <AuthLayout>
      <h1 className={styles.title}>Crie sua conta</h1>
      <p className={styles.subtitle}>Comece a estudar com o StudyFlow</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">E-mail</label>
          <input id="email" className={styles.input} type="email" placeholder="seuemail@exemplo.com"
            autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Senha</label>
          <input id="password" className={styles.input} type="password" placeholder="**********"
            autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="confirm">Confirmar senha</label>
          <input id="confirm" className={styles.input} type="password" placeholder="**********"
            autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {errors.confirm && <span className={styles.fieldError}>{errors.confirm}</span>}
        </div>

        {formError && <p className={styles.formError} role="alert">{formError}</p>}

        <button type="submit" className={styles.primary} disabled={submitting}>
          {submitting ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        <button type="button" className={styles.google} disabled={submitting} onClick={() => void run(onGoogle)}>
          Cadastrar com Google
        </button>
      </form>

      <p className={styles.footer}>
        Já tem uma conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthLayout>
  )
}