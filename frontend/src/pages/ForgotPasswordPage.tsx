import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { resetPassword } from '../services/authService'
import { translateAuthError, validateEmail } from '../services/authErrors'
import styles from './AuthForm.module.css'

const NEUTRAL = 'Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.'

interface ForgotPasswordPageProps {
  onReset?: (email: string) => Promise<unknown>
}

export function ForgotPasswordPage({ onReset = resetPassword }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setFormError('')

    const error = validateEmail(email)
    setEmailError(error ?? '')
    if (error) return

    setSubmitting(true)
    try {
      await onReset(email)
      setMessage(NEUTRAL)
    } catch (err) {
      // Não revela quais e-mails têm conta
      if ((err as { code?: string })?.code === 'auth/user-not-found') {
        setMessage(NEUTRAL)
      } else {
        setFormError(translateAuthError(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className={styles.title}>Recuperar senha</h1>
      <p className={styles.subtitle}>Enviaremos um link para o seu e-mail</p>

      <form onSubmit={(e) => void handleSubmit(e)} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">E-mail</label>
          <input id="email" className={styles.input} type="email" placeholder="seuemail@exemplo.com"
            autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {emailError && <span className={styles.fieldError}>{emailError}</span>}
        </div>

        {message && <p className={styles.formSuccess} role="status">{message}</p>}
        {formError && <p className={styles.formError} role="alert">{formError}</p>}

        <button type="submit" className={styles.primary} disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>

      <p className={styles.footer}>
        <Link to="/login">Voltar ao login</Link>
      </p>
    </AuthLayout>
  )
}