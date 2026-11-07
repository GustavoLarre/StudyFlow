import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ApiError } from '../services/apiClient'
import { notesApi, MAX_NOTE_CHARS, type GenerationResult, type Note, type NotesApi } from '../services/notesApi'
import styles from './NotesTab.module.css'

const PREVIEW = 120

const preview = (text: string) => (text.length > PREVIEW ? `${text.slice(0, PREVIEW)}...` : text)

function generationError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'PLAN_LIMIT_REACHED') return 'Você atingiu o limite de gerações do seu plano.'
    if (error.code === 'AI_GENERATION_IN_PROGRESS') return 'Já existe uma geração em andamento.'
    return error.message
  }
  return 'Não foi possível concluir. Tente novamente.'
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'

export function NotesTab({ subjectId, notes: api = notesApi }: { subjectId: string; notes?: NotesApi }) {
  const [items, setItems] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentError, setContentError] = useState('')
  const [toDelete, setToDelete] = useState<Note | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)

  useEffect(() => {
    api.list(subjectId)
      .then(setItems)
      .catch((e) => setAlert(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [api, subjectId])

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setContent('')
    setContentError('')
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setAlert('')

    if (!content.trim()) return setContentError('Informe o conteúdo da nota.')
    if (content.length > MAX_NOTE_CHARS) return setContentError(`A nota pode ter no máximo ${MAX_NOTE_CHARS} caracteres.`)
    setContentError('')

    try {
      if (editingId) {
        const updated = await api.update(editingId, { title, content })
        setItems((prev) => prev.map((n) => (n.noteId === editingId ? updated : n)))
      } else {
        const created = await api.create(subjectId, { title: title.trim() || undefined, content })
        setItems((prev) => [...prev, created])
      }
      resetForm()
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    const { noteId } = toDelete
    setToDelete(null)
    try {
      await api.remove(noteId)
      setItems((prev) => prev.filter((n) => n.noteId !== noteId))
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  async function handleGenerate(noteId: string) {
    setAlert('')
    setResult(null)
    setGeneratingId(noteId)
    try {
      setResult(await api.generate(noteId))
    } catch (e) {
      setAlert(generationError(e))
    } finally {
      setGeneratingId(null)
    }
  }

  return (
    <div>
      <form className={styles.form} onSubmit={(e) => void handleSave(e)} noValidate>
        <label htmlFor="note-title" className={styles.label}>Título da nota</label>
        <input id="note-title" className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />

        <label htmlFor="note-content" className={styles.label}>Conteúdo da nota</label>
        <textarea id="note-content" className={styles.textarea} rows={6} value={content}
          onChange={(e) => setContent(e.target.value)} />
        <div className={styles.formFooter}>
          <span className={content.length > MAX_NOTE_CHARS ? styles.counterOver : styles.counter}>
            {content.length}/{MAX_NOTE_CHARS}
          </span>
          {contentError && <span className={styles.fieldError}>{contentError}</span>}
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.primary}>Salvar nota</button>
          {editingId && <button type="button" className={styles.ghost} onClick={resetForm}>Cancelar</button>}
        </div>
      </form>

      {alert && <p className={styles.alert} role="alert">{alert}</p>}
      {result && (
        <div className={styles.success} role="status">
          <p>
            {result.flashcards.length} flashcards criados
            {result.gamification ? ` (+${result.gamification.gainedXp} XP)` : ''}
          </p>
          <p>Gerações usadas: {result.usage.count}/{result.usage.limit}</p>
          <Link to={`/materias/${subjectId}?aba=flashcards`}>Ver flashcards</Link>
        </div>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Esta matéria ainda não tem notas.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((n) => (
            <li key={n.noteId} className={styles.item}>
              <div className={styles.itemText}>
                <strong>{n.title}</strong>
                <p>{preview(n.content)}</p>
              </div>
              <div className={styles.itemActions}>
                <button type="button" className={styles.primary} disabled={generatingId !== null}
                  aria-label={generatingId === n.noteId ? 'Gerando...' : `Gerar flashcards de ${n.title}`}
                  onClick={() => void handleGenerate(n.noteId)}>
                  {generatingId === n.noteId ? 'Gerando...' : 'Gerar flashcards'}
                </button>
                <button type="button" className={styles.ghost} aria-label={`Editar ${n.title}`}
                  onClick={() => { setEditingId(n.noteId); setTitle(n.title); setContent(n.content) }}>Editar</button>
                <button type="button" className={styles.ghostDanger} aria-label={`Excluir ${n.title}`}
                  onClick={() => setToDelete(n)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Excluir a nota "${toDelete.title}"? Os flashcards gerados a partir dela permanecem.`}
          onConfirm={() => void handleDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}