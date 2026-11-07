import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ApiError } from '../services/apiClient'
import { notesApi, type GenerationResult, type Note, type NotesApi } from '../services/notesApi'
import styles from './NotesTab.module.css'

type NotesTabApi = Pick<NotesApi, 'list' | 'remove' | 'generate'>

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

export function NotesTab({ subjectId, notes: api = notesApi }: { subjectId: string; notes?: NotesTabApi }) {
  const [items, setItems] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState('')
  const [toDelete, setToDelete] = useState<Note | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [result, setResult] = useState<GenerationResult | null>(null)

  useEffect(() => {
    api.list(subjectId)
      .then(setItems)
      .catch((e) => setAlert(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [api, subjectId])

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
      <div className={styles.header}>
        <Link className={styles.createLink} to={`/materias/${subjectId}/notas/nova`}>Criar nota</Link>
      </div>

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
                <Link className={styles.titleLink} to={`/materias/${subjectId}/notas/${n.noteId}`}>{n.title}</Link>
                <p>{preview(n.content)}</p>
                <span className={styles.date}>{new Date(n.updatedAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className={styles.itemActions}>
                <button type="button" className={styles.primary} disabled={generatingId !== null}
                  aria-label={generatingId === n.noteId ? 'Gerando...' : `Gerar flashcards de ${n.title}`}
                  onClick={() => void handleGenerate(n.noteId)}>
                  {generatingId === n.noteId ? 'Gerando...' : 'Gerar flashcards'}
                </button>
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