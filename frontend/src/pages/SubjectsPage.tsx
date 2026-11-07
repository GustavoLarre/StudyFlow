import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { subjectsApi, type Subject, type SubjectsApi } from '../services/subjectsApi'
import styles from './SubjectsPage.module.css'

type SubjectsPageApi = Pick<SubjectsApi, 'list' | 'create' | 'rename' | 'remove'>

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'

export function SubjectsPage({ subjects: api = subjectsApi }: { subjects?: SubjectsPageApi }) {
  const [items, setItems] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState('')
  const [alert, setAlert] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [toDelete, setToDelete] = useState<Subject | null>(null)

  useEffect(() => {
    api.list()
      .then(setItems)
      .catch((e) => setAlert(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [api])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setAlert('')
    const trimmed = title.trim()
    if (!trimmed) {
      setTitleError('Informe o título da matéria.')
      return
    }
    setTitleError('')
    try {
      const created = await api.create(trimmed)
      setItems((prev) => [...prev, created])
      setTitle('')
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  async function handleRename(id: string) {
    setAlert('')
    try {
      const updated = await api.rename(id, editTitle.trim())
      setItems((prev) => prev.map((s) => (s.subjectId === id ? updated : s)))
      setEditingId(null)
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    const { subjectId } = toDelete
    setToDelete(null)
    setAlert('')
    try {
      await api.remove(subjectId)
      setItems((prev) => prev.filter((s) => s.subjectId !== subjectId))
    } catch (e) {
      setAlert(errorMessage(e))
    }
  }

  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>Matérias</h1>

      <form className={styles.createForm} onSubmit={(e) => void handleCreate(e)} noValidate>
        <label htmlFor="new-subject" className={styles.srOnly}>Nova matéria</label>
        <input id="new-subject" className={styles.input} placeholder="Nova matéria"
          value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit" className={styles.primary}>Criar</button>
      </form>
      {titleError && <p className={styles.fieldError}>{titleError}</p>}
      {alert && <p className={styles.alert} role="alert">{alert}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Você ainda não tem matérias.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((s) => (
            <li key={s.subjectId} className={styles.item}>
              {editingId === s.subjectId ? (
                <>
                  <label htmlFor={`edit-${s.subjectId}`} className={styles.srOnly}>Título da matéria</label>
                  <input id={`edit-${s.subjectId}`} className={styles.input} value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)} />
                  <button type="button" className={styles.primary} onClick={() => void handleRename(s.subjectId)}>Salvar</button>
                  <button type="button" className={styles.ghost} onClick={() => setEditingId(null)}>Cancelar</button>
                </>
              ) : (
                <>
                  <Link className={styles.itemLink} to={`/materias/${s.subjectId}`}>{s.title}</Link>
                  <button type="button" className={styles.ghost} aria-label={`Renomear ${s.title}`}
                    onClick={() => { setEditingId(s.subjectId); setEditTitle(s.title) }}>Renomear</button>
                  <button type="button" className={styles.ghostDanger} aria-label={`Excluir ${s.title}`}
                    onClick={() => setToDelete(s)}>Excluir</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Excluir "${toDelete.title}"? As notas e flashcards desta matéria também serão apagados. Esta ação não pode ser desfeita.`}
          onConfirm={() => void handleDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </section>
  )
}