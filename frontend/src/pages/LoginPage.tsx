import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { login, loginWithGoogle } from '../services/authService'
import { translateAuthError, validateEmail, validatePassword } from '../services/authErrors'
import styles from './AuthForm.module.css'

interface LoginPageProps {
  onLogin?: (email: string, password: string) => Promise<unknown>
  onGoogle?: () => Promise<unknown>
}

export function LoginPage({ onLogin = login, onGoogle = loginWithGoogle }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
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
    }
    setErrors(next)
    if (next.email || next.password) return

    void run(() => onLogin(email, password))
  }

  return (
    <AuthLayout>
      <h1 className={styles.title}>Bem-vindo de volta!</h1>
      <p className={styles.subtitle}>Faça login para continuar</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">E-mail</label>
          <input
            id="email"
            className={styles.input}
            type="email"
            placeholder="seuemail@exemplo.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Senha</label>
          <div className={styles.inputWrap}>
            <input
              id="password"
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              placeholder="**********"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className={styles.eye}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
        </div>

        <div className={styles.links}>
          <Link to="/recuperar-senha">Esqueceu sua senha?</Link>
        </div>

        {formError && <p className={styles.formError} role="alert">{formError}</p>}

        <button type="submit" className={styles.primary} disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
        <button
          type="button"
          className={styles.google}
          disabled={submitting}
          onClick={() => void run(onGoogle)}
        >
          Entrar com Google
        </button>
      </form>

      <p className={styles.footer}>
        Ainda não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </AuthLayout>
  )
}