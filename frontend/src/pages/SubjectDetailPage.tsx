import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { subjectsApi, type Subject, type SubjectsApi } from '../services/subjectsApi'
import { NotesTab } from './NotesTab'
import { FlashcardsTab } from './FlashcardsTab'
import styles from './SubjectDetailPage.module.css'

interface Props {
  subjects?: Pick<SubjectsApi, 'get'>
  renderNotes?: (subjectId: string) => ReactNode
  renderFlashcards?: (subjectId: string) => ReactNode
}

export function SubjectDetailPage({
  subjects = subjectsApi,
  renderNotes = (id) => <NotesTab subjectId={id} />,
  renderFlashcards = (id) => <FlashcardsTab subjectId={id} />,
}: Props) {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const [subject, setSubject] = useState<Subject | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    subjects.get(id)
      .then(setSubject)
      .catch((e) => setError(e instanceof Error ? e.message : 'Não foi possível carregar a matéria.'))
  }, [subjects, id])

  const tab = params.get('aba') === 'flashcards' ? 'flashcards' : 'notas'

  if (error) {
    return (
      <section>
        <p>{error}</p>
        <Link to="/materias">Voltar às matérias</Link>
      </section>
    )
  }
  if (!subject) return <p>Carregando...</p>

  return (
    <section>
      <Link to="/materias" className={styles.back}>← Matérias</Link>
      <h1 className={styles.heading}>{subject.title}</h1>

      <div role="tablist" className={styles.tabs}>
        {(['notas', 'flashcards'] as const).map((t) => (
          <button key={t} role="tab" type="button" aria-selected={tab === t}
            className={tab === t ? `${styles.tab} ${styles.active}` : styles.tab}
            onClick={() => setParams(t === 'notas' ? {} : { aba: t })}>
            {t === 'notas' ? 'Notas' : 'Flashcards'}
          </button>
        ))}
      </div>

      {tab === 'notas' ? renderNotes(id) : renderFlashcards(id)}
    </section>
  )
}