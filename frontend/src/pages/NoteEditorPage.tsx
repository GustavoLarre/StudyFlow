import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { notesApi, MAX_NOTE_CHARS, type Note, type NotesApi } from '../services/notesApi'
import styles from './NoteEditorPage.module.css'

const DEFAULT_TITLE = 'Nota sem título'

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'

export function NoteEditorPage({
  notes: api = notesApi,
}: {
  notes?: Pick<NotesApi, 'get' | 'create' | 'update'>
}) {
  const { id: subjectId = '', noteId } = useParams()
  const navigate = useNavigate()
  const loadedId = useRef<string | null>(null)

  const [loading, setLoading] = useState(Boolean(noteId))
  const [loadError, setLoadError] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState({ title: '', content: '' })
  const [contentError, setContentError] = useState('')
  const [alert, setAlert] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  function apply(note: Note) {
    loadedId.current = note.noteId
    setTitle(note.title)
    setContent(note.content)
    setSaved({ title: note.title, content: note.content })
  }

  useEffect(() => {
    if (!noteId || loadedId.current === noteId) return
    api.get(noteId)
      .then(apply)
      .catch((e) => setLoadError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [api, noteId])

  const dirty = title !== saved.title || content !== saved.content
  const backTo = `/materias/${subjectId}`

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setAlert('')

    if (!content.trim()) return setContentError('Informe o conteúdo da nota.')
    if (content.length > MAX_NOTE_CHARS) {
      return setContentError(`A nota pode ter no máximo ${MAX_NOTE_CHARS} caracteres.`)
    }
    setContentError('')

    const finalTitle = title.trim() || DEFAULT_TITLE
    setSaving(true)
    try {
      if (noteId) {
        apply(await api.update(noteId, { title: finalTitle, content }))
      } else {
        const created = await api.create(subjectId, { title: finalTitle, content })
        apply(created)
        navigate(`/materias/${subjectId}/notas/${created.noteId}`, { replace: true })
      }
    } catch (e) {
      setAlert(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  function handleBack() {
    if (dirty) setConfirmLeave(true)
    else navigate(backTo)
  }

  if (loadError) {
    return (
      <section>
        <p>{loadError}</p>
        <Link to={backTo}>Voltar às notas</Link>
      </section>
    )
  }
  if (loading) return <p>Carregando...</p>

  return (
    <section className={styles.page}>
      <form onSubmit={(e) => void handleSave(e)} noValidate>
        <div className={styles.toolbar}>
          <button type="button" className={styles.ghost} onClick={handleBack}>Voltar</button>
          <span className={dirty ? styles.dirty : styles.clean} role="status">
            {dirty ? 'Alterações não salvas' : noteId ? 'Salvo' : ''}
          </span>
          <button type="submit" className={styles.primary} disabled={!dirty || saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        <label htmlFor="note-title" className={styles.srOnly}>Título da nota</label>
        <input id="note-title" className={styles.title} placeholder="Título da nota" maxLength={150}
          value={title} onChange={(e) => setTitle(e.target.value)} />

        <label htmlFor="note-content" className={styles.srOnly}>Conteúdo da nota</label>
        <textarea id="note-content" className={styles.sheet} placeholder="Escreva sua nota..."
          value={content} onChange={(e) => setContent(e.target.value)} />

        <div className={styles.footer}>
          <span className={content.length > MAX_NOTE_CHARS ? styles.counterOver : styles.counter}>
            {content.length}/{MAX_NOTE_CHARS}
          </span>
          {contentError && <span className={styles.fieldError}>{contentError}</span>}
        </div>
        {alert && <p className={styles.alert} role="alert">{alert}</p>}
      </form>

      {confirmLeave && (
        <ConfirmDialog
          message="Você tem alterações não salvas. Deseja descartá-las e sair?"
          confirmLabel="Descartar"
          onConfirm={() => navigate(backTo)}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
    </section>
  )
}