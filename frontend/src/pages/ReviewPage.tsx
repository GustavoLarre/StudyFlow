import { useCallback, useEffect, useState } from 'react'
import { reviewApi, type ReviewAction, type ReviewApi } from '../services/reviewApi'
import { subjectsApi, type Subject, type SubjectsApi } from '../services/subjectsApi'
import type { Flashcard } from '../services/flashcardsApi'
import styles from './ReviewPage.module.css'

const BUTTONS: { label: string; action: ReviewAction }[] = [
  { label: 'De novo', action: 'again' },
  { label: 'Difícil', action: 'hard' },
  { label: 'Fácil', action: 'good' },
  { label: 'Muito fácil', action: 'easy' },
]

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.'

export function ReviewPage({
  subjects: subjectsSource = subjectsApi,
  review = reviewApi,
}: {
  subjects?: Pick<SubjectsApi, 'list'>
  review?: ReviewApi
}) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [queue, setQueue] = useState<Flashcard[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState('')
  const [lastXp, setLastXp] = useState<number | null>(null)
  const [leveledUp, setLeveledUp] = useState(false)
  const [totalXp, setTotalXp] = useState(0)
  const [answering, setAnswering] = useState(false)

  const load = useCallback(async (selected: string) => {
    setLoading(true)
    setAlert('')
    setIndex(0)
    setRevealed(false)
    setLastXp(null)
    setLeveledUp(false)
    setTotalXp(0)
    try {
      setQueue(await review.due(selected || undefined))
    } catch (e) {
      setQueue([])
      setAlert(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [review])

  useEffect(() => {
    subjectsSource.list().then(setSubjects).catch((e) => setAlert(errorMessage(e)))
  }, [subjectsSource])

  useEffect(() => { void load(subjectId) }, [load, subjectId])

  async function answer(action: ReviewAction) {
    const current = queue[index]
    setAlert('')
    setAnswering(true)
    try {
      const { gamification } = await review.answer(current.flashcardId, action)
      const gained = gamification?.gainedXp ?? 0
      setLastXp(gained)
      setLeveledUp(Boolean(gamification?.leveledUp))
      setTotalXp((prev) => prev + gained)
      setRevealed(false)
      setIndex((prev) => prev + 1)
    } catch (e) {
      setAlert(errorMessage(e))
    } finally {
      setAnswering(false)
    }
  }

  const current = queue[index]
  const finished = !loading && queue.length > 0 && index >= queue.length

  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>Revisão</h1>

      <div className={styles.filter}>
        <label htmlFor="review-subject">Matéria</label>
        <select id="review-subject" className={styles.select} value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Todas as matérias</option>
          {subjects.map((s) => <option key={s.subjectId} value={s.subjectId}>{s.title}</option>)}
        </select>
      </div>

      {alert && <p className={styles.alert} role="alert">{alert}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : queue.length === 0 ? (
        <p className={styles.empty}>Nenhum flashcard para revisar agora.</p>
      ) : finished ? (
        <div className={styles.summary}>
          <h2>Sessão concluída</h2>
          <p>{queue.length} {queue.length === 1 ? 'flashcard revisado' : 'flashcards revisados'}, +{totalXp} XP</p>
          <button type="button" className={styles.primary} onClick={() => void load(subjectId)}>Revisar de novo</button>
        </div>
      ) : (
        <div className={styles.session}>
          <p className={styles.progress}>Card {index + 1} de {queue.length}</p>
          {lastXp !== null && <p className={styles.xp} role="status">+{lastXp} XP</p>}
          {leveledUp && <p className={styles.level} role="status">Subiu de nível!</p>}

          <div className={styles.card}>
            <p className={styles.front}>{current.front}</p>
            {revealed && <p className={styles.back}>{current.back}</p>}
          </div>

          {revealed ? (
            <div className={styles.answers}>
              {BUTTONS.map((b) => (
                <button key={b.action} type="button" className={styles.answer} disabled={answering}
                  onClick={() => void answer(b.action)}>{b.label}</button>
              ))}
            </div>
          ) : (
            <button type="button" className={styles.primary} onClick={() => setRevealed(true)}>Mostrar resposta</button>
          )}
        </div>
      )}
    </section>
  )
}