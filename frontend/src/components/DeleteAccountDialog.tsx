import { useState } from 'react'
import { translateAuthError } from '../services/authErrors'
import styles from './ConfirmDialog.module.css'

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
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <p>
          Esta ação é irreversível. Suas matérias, notas, flashcards, tarefas, XP e nome de usuário
          serão apagados definitivamente.
        </p>

        <label htmlFor="del-confirm">Digite EXCLUIR para confirmar</label>
        <input id="del-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

        {method === 'password' && (
          <>
            <label htmlFor="del-pass">Sua senha</label>
            <input id="del-pass" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </>
        )}

        {error && <p role="alert">{error}</p>}

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