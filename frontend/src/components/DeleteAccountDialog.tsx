import { useState } from 'react'
import { translateAuthError } from '../services/authErrors'
import styles from './DeleteAccountDialog.module.css'

interface Props {
  method: 'password' | 'google'
  onReauth: (password?: string) => Promise<unknown>
  onDelete: () => Promise<unknown>
  onCancel: () => void
  onDeleted: () => void
}

export function DeleteAccountDialog({ method, onReauth, onDelete, onCancel, onDeleted }: Props) {
  const [confirm, setConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    setError('')
    if (method === 'password' && !password) return setError('Informe sua senha.')
    setBusy(true)
    try {
      await onReauth(method === 'password' ? password : undefined)
      await onDelete()
      onDeleted()
    } catch (e) {
      const apiMessage = e instanceof Error && !(e as { code?: string }).code ? e.message : ''
      setError(apiMessage || translateAuthError(e))
      setBusy(false)
    }
  }

    return (
    <div className={styles.backdrop}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="del-title">
        <h2 id="del-title" className={styles.title}>Apagar sua conta</h2>
        <p className={styles.warning}>
          Esta ação é irreversível. Suas matérias, notas, flashcards, tarefas, XP e nome de usuário
          serão apagados definitivamente.
        </p>

        <div className={styles.field}>
          <label htmlFor="del-confirm" className={styles.label}>
            Digite <strong>EXCLUIR</strong> para confirmar
          </label>
          <input id="del-confirm" className={styles.input} value={confirm}
            autoComplete="off" onChange={(e) => setConfirm(e.target.value)} />
        </div>

        {method === 'password' && (
          <div className={styles.field}>
            <label htmlFor="del-pass" className={styles.label}>Sua senha</label>
            <input id="del-pass" className={styles.input} type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </div>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>Cancelar</button>
          <button type="button" className={styles.danger}
            disabled={confirm !== 'EXCLUIR' || busy} onClick={() => void handleDelete()}>
            Apagar definitivamente
          </button>
        </div>
      </div>
    </div>
  )
}