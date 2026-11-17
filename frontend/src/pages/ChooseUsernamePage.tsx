import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { FloatingInput } from '../components/FloatingInput'
import { useProfile } from '../profile/ProfileContext'
import { profileApi as defaultProfileApi, type ProfileApi } from '../services/profileApi'
import { suggestUsername, validateUsername } from '../services/username'
import styles from './AuthForm.module.css'

type Status =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'error'; message: string }

const DEBOUNCE_MS = 500

export function ChooseUsernamePage({
  profileApi = defaultProfileApi,
}: {
  profileApi?: Pick<ProfileApi, 'checkUsername' | 'update'>
}) {
  const navigate = useNavigate()
  const { profile, refresh } = useProfile()
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (profile && !initialized.current) {
      initialized.current = true
      setUsername(suggestUsername(profile.name, profile.email))
    }
  }, [profile])

  useEffect(() => {
    if (!username) {
      setStatus({ kind: 'idle' })
      return
    }

    const formatError = validateUsername(username)
    if (formatError) {
      setStatus({ kind: 'error', message: formatError })
      return
    }

    setStatus({ kind: 'checking' })
    let cancelled = false
    const timer = setTimeout(() => {
      profileApi.checkUsername(username.trim())
        .then(({ available, reason }) => {
          if (cancelled) return
          setStatus(available
            ? { kind: 'available' }
            : { kind: 'error', message: reason ?? 'Esse nome de usuário já está em uso.' })
        })
        .catch(() => {
          if (!cancelled) setStatus({ kind: 'error', message: 'Não foi possível verificar agora.' })
        })
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [username, profileApi])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (status.kind !== 'available') return

    setFormError('')
    setSubmitting(true)
    try {
      await profileApi.update({ username: username.trim() })
      await refresh()
      navigate('/materias')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className={styles.title}>Escolha seu usuário</h1>
      <p className={styles.subtitle}>Ele será seu nome público</p>

      <form onSubmit={(e) => void handleSubmit(e)} noValidate>
        <FloatingInput
          id="username"
          label="Nome de usuário"
          autoComplete="username"
          value={username}
          onChange={setUsername}
          error={status.kind === 'error' ? status.message : undefined}
        />
        {status.kind === 'available' && <p className={styles.formSuccess} role="status">Disponível</p>}
        {status.kind === 'checking' && <p className={styles.footer}>Verificando...</p>}

        <p className={styles.footer}>Você poderá alterar o nome de usuário apenas uma vez depois.</p>

        {formError && <p className={styles.formError} role="alert">{formError}</p>}

        <button type="submit" className={styles.primary} disabled={status.kind !== 'available' || submitting}>
          {submitting ? 'Salvando...' : 'Confirmar'}
        </button>
      </form>
    </AuthLayout>
  )
}