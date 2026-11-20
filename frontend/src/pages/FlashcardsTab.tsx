import { useEffect, useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { FlashcardDialog } from '../components/FlashcardDialog'
import editIcon from '../assets/tarefas-editar.png'
import deleteIcon from '../assets/tarefas-excluir.png'
import { flashcardsApi, type Flashcard, type FlashcardsApi } from '../services/flashcardsApi'
import styles from './FlashcardsTab.module.css'

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'

const newestFirst = (list: Flashcard[]) =>
  [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

type DialogState = { mode: 'create' } | { mode: 'edit'; card: Flashcard } | null

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
  const [dialog, setDialog] = useState<DialogState>(null)
  const [toDelete, setToDelete] = useState<Flashcard | null>(null)

  useEffect(() => {
    api.list(subjectId)
      .then((list) => setItems(newestFirst(list)))
      .catch((e) => setAlert(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [api, subjectId])

  // Os dois handlers lançam o erro: o popup o mostra e continua aberto.
  async function handleCreate(data: { front: string; back: string }) {
    const { flashcard, gamification } = await api.create(subjectId, data)
    setItems((prev) => newestFirst([flashcard, ...prev]))
    setNotice(gamification ? `+${gamification.gainedXp} XP` : '')
    setDialog(null)
  }

  async function handleUpdate(id: string, data: { front: string; back: string }) {
    const updated = await api.update(id, data)
    setItems((prev) => prev.map((c) => (c.flashcardId === id ? updated : c)))
    setDialog(null)
  }

  async function handleDelete() {
    if (!toDelete) return
    const { flashcardId } = toDelete
    setToDelete(null)
    setAlert('')
    try {
      await api.remove(flashcardId)
      setItems((prev) => prev.filter((c) => c.flashcardId !== flashcardId))
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <button type="button" className={styles.primary}
          onClick={() => { setAlert(''); setNotice(''); setDialog({ mode: 'create' }) }}>
          Criar flashcard
        </button>
      </div>

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
                <button type="button" className={styles.iconBtn} aria-label={`Editar ${c.front}`}
                  title="Editar" onClick={() => { setNotice(''); setDialog({ mode: 'edit', card: c }) }}>
                  <img src={editIcon} alt="" />
                </button>
                <button type="button" className={styles.iconBtn} aria-label={`Excluir ${c.front}`}
                  title="Excluir" onClick={() => setToDelete(c)}>
                  <img src={deleteIcon} alt="" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {dialog?.mode === 'create' && (
        <FlashcardDialog title="Novo flashcard" onSave={handleCreate} onCancel={() => setDialog(null)} />
      )}
      {dialog?.mode === 'edit' && (
        <FlashcardDialog
          title="Editar flashcard"
          initial={{ front: dialog.card.front, back: dialog.card.back }}
          onSave={(data) => handleUpdate(dialog.card.flashcardId, data)}
          onCancel={() => setDialog(null)}
        />
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