import { useEffect, useState, type FormEvent } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  flashcardsApi, MAX_CARD_TEXT, type Flashcard, type FlashcardsApi,
} from '../services/flashcardsApi'
import styles from './FlashcardsTab.module.css'

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'

const newestFirst = (list: Flashcard[]) =>
  [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

export function FlashcardsTab({
  subjectId,
  cards: api = flashcardsApi,
}: {
  subjectId: string
  cards?: FlashcardsApi
}) {
  const [items, setItems] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({})
  const [toDelete, setToDelete] = useState<Flashcard | null>(null)

  useEffect(() => {
    api.list(subjectId)
      .then((list) => setItems(newestFirst(list)))
      .catch((e) => setAlert(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [api, subjectId])

  function resetForm() {
    setEditingId(null)
    setFront('')
    setBack('')
    setErrors({})
  }

  function validate() {
    const next: { front?: string; back?: string } = {}
    if (!front.trim()) next.front = 'Informe a frente.'
    else if (front.trim().length > MAX_CARD_TEXT) next.front = `A frente pode ter no máximo ${MAX_CARD_TEXT} caracteres.`
    if (!back.trim()) next.back = 'Informe o verso.'
    else if (back.trim().length > MAX_CARD_TEXT) next.back = `O verso pode ter no máximo ${MAX_CARD_TEXT} caracteres.`
    setErrors(next)
    return !next.front && !next.back
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setAlert('')
    setNotice('')
    if (!validate()) return

    const data = { front: front.trim(), back: back.trim() }
    try {
      if (editingId) {
        const updated = await api.update(editingId, data)
        setItems((prev) => prev.map((c) => (c.flashcardId === editingId ? updated : c)))
      } else {
        const { flashcard, gamification } = await api.create(subjectId, data)
        setItems((prev) => newestFirst([flashcard, ...prev]))
        if (gamification) setNotice(`+${gamification.gainedXp} XP`)
      }
      resetForm()
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    const { flashcardId } = toDelete
    setToDelete(null)
    try {
      await api.remove(flashcardId)
      setItems((prev) => prev.filter((c) => c.flashcardId !== flashcardId))
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  return (
    <div>
      <form className={styles.form} onSubmit={(e) => void handleSave(e)} noValidate>
        <label htmlFor="card-front" className={styles.label}>Frente</label>
        <textarea id="card-front" className={styles.textarea} rows={2} value={front}
          onChange={(e) => setFront(e.target.value)} />
        {errors.front && <span className={styles.fieldError}>{errors.front}</span>}

        <label htmlFor="card-back" className={styles.label}>Verso</label>
        <textarea id="card-back" className={styles.textarea} rows={2} value={back}
          onChange={(e) => setBack(e.target.value)} />
        {errors.back && <span className={styles.fieldError}>{errors.back}</span>}

        <div className={styles.actions}>
          <button type="submit" className={styles.primary}>
            {editingId ? 'Salvar flashcard' : 'Criar flashcard'}
          </button>
          {editingId && <button type="button" className={styles.ghost} onClick={resetForm}>Cancelar</button>}
        </div>
      </form>

      {alert && <p className={styles.alert} role="alert">{alert}</p>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Esta matéria ainda não tem flashcards.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((c) => (
            <li key={c.flashcardId} className={styles.item}>
              <div className={styles.text}>
                <span className={c.source === 'ai' ? styles.badgeAi : styles.badge}>
                  {c.source === 'ai' ? 'IA' : 'Manual'}
                </span>
                <strong>{c.front}</strong>
                <p>{c.back}</p>
              </div>
              <div className={styles.itemActions}>
                <button type="button" className={styles.ghost} aria-label={`Editar ${c.front}`}
                  onClick={() => { setEditingId(c.flashcardId); setFront(c.front); setBack(c.back); setErrors({}) }}>
                  Editar
                </button>
                <button type="button" className={styles.ghostDanger} aria-label={`Excluir ${c.front}`}
                  onClick={() => setToDelete(c)}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Excluir o flashcard "${toDelete.front}"? Esta ação não pode ser desfeita.`}
          onConfirm={() => void handleDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}