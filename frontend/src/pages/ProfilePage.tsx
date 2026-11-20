import { useEffect, useState } from 'react'
import { useProfile } from '../profile/ProfileContext'
import { profileApi as defaultApi, type ProfileApi } from '../services/profileApi'
import {
  getSignInMethod,
  logout,
  reauthenticate,
  type SignInMethod,
} from '../services/authService'
import { validateUsername } from '../services/username'
import { DeleteAccountDialog } from '../components/DeleteAccountDialog'
import styles from './ProfilePage.module.css'

type Status =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'error'; message: string }

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Não foi possível concluir. Tente novamente.'

export function ProfilePage({
  profileApi = defaultApi,
  onLogout = logout,
  signInMethod = getSignInMethod(),
  onReauth = reauthenticate,
  onDeleted = () => logout(),
}: {
  profileApi?: Pick<ProfileApi, 'update' | 'checkUsername' | 'remove'>
  onLogout?: () => Promise<unknown>
  signInMethod?: SignInMethod
  onReauth?: (password?: string) => Promise<void>
  onDeleted?: () => Promise<unknown> | void
}) {
  const { profile, refresh } = useProfile()
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [notice, setNotice] = useState('')
  const [alert, setAlert] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setUsername(profile.username ?? '')
    }
  }, [profile])

  useEffect(() => {
    if (!profile || profile.usernameChanged || !username || username === profile.username) {
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
          if (!cancelled) {
            setStatus(available
              ? { kind: 'available' }
              : { kind: 'error', message: reason ?? 'Esse nome de usuário já está em uso.' })
          }
        })
        .catch(() => { if (!cancelled) setStatus({ kind: 'error', message: 'Não foi possível verificar agora.' }) })
    }, 500)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [username, profile, profileApi])

  if (!profile) return null

  const { xp } = profile
  const pct = Math.min(100, Math.round((xp.currentLevelXp / xp.nextLevelXp) * 100))

  async function saveName() {
    setNotice(''); setAlert('')
    const trimmed = name.trim()
    if (!trimmed) return setNameError('Informe o nome.')
    if (trimmed.length > 50) return setNameError('O nome pode ter no máximo 50 caracteres.')
    setNameError('')
    try {
      await profileApi.update({ name: trimmed })
      await refresh()
      setNotice('Nome atualizado.')
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  async function saveUsername() {
    setNotice(''); setAlert('')
    try {
      await profileApi.update({ username: username.trim() })
      await refresh()
      setNotice('Nome de usuário atualizado.')
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>Perfil</h1>

      <div className={styles.layout}>
        <aside className={styles.side} aria-label="Resumo do perfil">
          <h2 className={styles.name}>{profile.name || 'Sem nome'}</h2>
          <p className={styles.username}>@{profile.username}</p>
          <p className={styles.muted}>{profile.email}</p>

          <div className={styles.divider} />

          <h3 className={styles.levelTitle}>Nível {xp.level}</h3>
          <p className={styles.xpTotal}>XP total: {xp.total}</p>
          <div className={styles.bar} role="progressbar" aria-valuenow={xp.currentLevelXp}
            aria-valuemin={0} aria-valuemax={xp.nextLevelXp}>
            <div className={styles.barFill} style={{ width: `${pct}%` }} />
          </div>
          <p className={styles.muted}>{xp.currentLevelXp} / {xp.nextLevelXp} XP</p>

          <div className={styles.divider} />

          <button type="button" className={styles.ghost} onClick={() => void onLogout()}>Sair</button>
        </aside>

        <div className={styles.main}>
          {notice && <p className={styles.ok} role="status">{notice}</p>}
          {alert && <p className={styles.error} role="alert">{alert}</p>}

          <section className={styles.group} aria-labelledby="account-title">
            <h2 id="account-title" className={styles.groupTitle}>Informações da conta</h2>

            <div className={styles.field}>
              <label htmlFor="profile-name" className={styles.label}>Nome</label>
              <input id="profile-name" className={styles.input} value={name}
                onChange={(e) => setName(e.target.value)} />
              {nameError && <span className={styles.error}>{nameError}</span>}
              <div>
                <button type="button" className={styles.primary} onClick={() => void saveName()}>Salvar nome</button>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="profile-username" className={styles.label}>Nome de usuário</label>
              <input id="profile-username" className={styles.input} value={username}
                disabled={profile.usernameChanged} onChange={(e) => setUsername(e.target.value)} />
              {profile.usernameChanged ? (
                <p className={styles.helper}>Você já alterou seu nome de usuário e não pode mudar de novo.</p>
              ) : (
                <>
                  <p className={styles.helper}>Você pode alterar o nome de usuário apenas uma vez.</p>
                  {status.kind === 'available' && <span className={styles.ok} role="status">Disponível</span>}
                  {status.kind === 'error' && <span className={styles.error}>{status.message}</span>}
                  <div>
                    <button type="button" className={styles.primary} disabled={status.kind !== 'available'}
                      onClick={() => void saveUsername()}>Alterar nome de usuário</button>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className={styles.danger} aria-labelledby="danger-title">
            <h2 id="danger-title" className={styles.dangerTitle}>Zona de perigo</h2>
            <div className={styles.dangerRow}>
              <div>
                <strong>Excluir esta conta</strong>
                <p className={styles.helper}>Remove para sempre sua conta, matérias, notas, flashcards e tarefas.</p>
              </div>
              <button type="button" className={styles.dangerBtn} onClick={() => setShowDelete(true)}>Apagar conta</button>
            </div>
          </section>
        </div>
      </div>

      {showDelete && (
        <DeleteAccountDialog
          method={signInMethod}
          onReauth={onReauth}
          onDelete={profileApi.remove}
          onCancel={() => setShowDelete(false)}
          onDeleted={() => void onDeleted()}
        />
      )}
    </section>
  )
}