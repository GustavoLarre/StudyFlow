import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { notesApi, MAX_NOTE_CHARS, type Note, type NotesApi } from '../services/notesApi'
import styles from './NoteEditorPage.module.css'

const DEFAULT_TITLE = 'Nota sem título'

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'

// Faz o textarea crescer com o texto, como uma página (sem barra de rolagem interna).
function useAutoGrow(value: string, ready: boolean) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    if (el.scrollHeight) el.style.height = `${el.scrollHeight}px`
  }, [value, ready])
  return ref
}

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

  const titleRef = useAutoGrow(title, !loading)
  const contentRef = useAutoGrow(content, !loading)

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

  async function save() {
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void save()
  }

  function handleFormKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      if (dirty && !saving) void save()
    }
  }

  function handleTitleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      contentRef.current?.focus()
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
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} noValidate>
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
        <textarea id="note-title" ref={titleRef} className={styles.title} rows={1}
          placeholder="Sem título" maxLength={150} value={title}
          onKeyDown={handleTitleKeyDown}
          onChange={(e) => setTitle(e.target.value.replace(/\r?\n/g, ' '))} />

        <label htmlFor="note-content" className={styles.srOnly}>Conteúdo da nota</label>
        <textarea id="note-content" ref={contentRef} className={styles.sheet}
          placeholder="Escreva sua nota..." value={content}
          onChange={(e) => setContent(e.target.value)} />

        {contentError && <p className={styles.fieldError}>{contentError}</p>}
        {alert && <p className={styles.alert} role="alert">{alert}</p>}

        <div className={styles.footer}>
          <span className={content.length > MAX_NOTE_CHARS ? styles.counterOver : styles.counter}>
            {content.length}/{MAX_NOTE_CHARS}
          </span>
        </div>
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