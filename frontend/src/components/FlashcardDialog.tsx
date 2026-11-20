import { useEffect, useState } from 'react'
import { MAX_CARD_TEXT } from '../services/flashcardsApi'
import styles from './FlashcardDialog.module.css'

type Data = { front: string; back: string }

export function FlashcardDialog({
  title, initial, onSave, onCancel,
}: {
  title: string
  initial?: Data
  onSave: (data: Data) => Promise<void>
  onCancel: () => void
}) {
  const [front, setFront] = useState(initial?.front ?? '')
  const [back, setBack] = useState(initial?.back ?? '')
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({})
  const [alert, setAlert] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  async function submit() {
    const next: { front?: string; back?: string } = {}
    if (!front.trim()) next.front = 'Informe a frente.'
    else if (front.trim().length > MAX_CARD_TEXT) next.front = `A frente pode ter no máximo ${MAX_CARD_TEXT} caracteres.`
    if (!back.trim()) next.back = 'Informe o verso.'
    else if (back.trim().length > MAX_CARD_TEXT) next.back = `O verso pode ter no máximo ${MAX_CARD_TEXT} caracteres.`
    setErrors(next)
    if (next.front || next.back) return

    setAlert('')
    setSaving(true)
    try {
      await onSave({ front: front.trim(), back: back.trim() })
    } catch (e) {
      setAlert(e instanceof Error ? e.message : 'Não foi possível concluir. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="card-dialog-title">
        <h2 id="card-dialog-title" className={styles.title}>{title}</h2>

        <label htmlFor="dialog-front" className={styles.label}>Frente</label>
        <textarea id="dialog-front" className={styles.textarea} rows={3} value={front} autoFocus
          onChange={(e) => setFront(e.target.value)} />
        {errors.front && <span className={styles.fieldError}>{errors.front}</span>}

        <label htmlFor="dialog-back" className={styles.label}>Verso</label>
        <textarea id="dialog-back" className={styles.textarea} rows={3} value={back}
          onChange={(e) => setBack(e.target.value)} />
        {errors.back && <span className={styles.fieldError}>{errors.back}</span>}

        {alert && <p className={styles.alert} role="alert">{alert}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>Cancelar</button>
          <button type="button" className={styles.save} disabled={saving} onClick={() => void submit()}>Salvar</button>
        </div>
      </div>
    </div>
  )
}