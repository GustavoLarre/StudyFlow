import { useEffect, useState } from 'react'
import { progressApi, type Progress, type ProgressApi } from '../services/progressApi'
import styles from './ProgressPage.module.css'

const CATEGORIES = [
  { key: 'novo', label: 'Novo' },
  { key: 'muitoFacil', label: 'Muito fácil' },
  { key: 'facil', label: 'Fácil' },
  { key: 'medio', label: 'Médio' },
  { key: 'dificil', label: 'Difícil' },
] as const

export function ProgressPage({ progress: api = progressApi }: { progress?: ProgressApi }) {
  const [data, setData] = useState<Progress | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Não foi possível carregar o progresso.'))
  }, [api])

  if (error) return <p className={styles.alert} role="alert">{error}</p>
  if (!data) return <p>Carregando...</p>

  const { xp, subjects } = data
  const pct = Math.min(100, Math.round((xp.currentLevelXp / xp.nextLevelXp) * 100))

  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>Progresso</h1>

      <div className={styles.xpCard}>
        <h2>Nível {xp.level}</h2>
        <p>XP total: {xp.total}</p>
        <div className={styles.bar} role="progressbar" aria-valuenow={xp.currentLevelXp}
          aria-valuemin={0} aria-valuemax={xp.nextLevelXp}>
          <div className={styles.barFill} style={{ width: `${pct}%` }} />
        </div>
        <p className={styles.muted}>{xp.currentLevelXp} / {xp.nextLevelXp} XP</p>
      </div>

      <h2 className={styles.sub}>Diagnóstico por matéria</h2>
      {subjects.length === 0 ? (
        <p className={styles.muted}>Você ainda não tem matérias.</p>
      ) : (
        <ul className={styles.list}>
          {subjects.map((s) => (
            <li key={s.subjectId} className={styles.item}>
              <div className={styles.itemHead}>
                <strong>{s.title}</strong>
                <span className={styles.muted}>
                  {s.total === 0 ? 'Nenhum flashcard ainda' : `${s.total} flashcards`}
                </span>
              </div>
              {CATEGORIES.map((c) => {
                const value = s.stats[c.key]
                const width = s.total ? Math.round((value / s.total) * 100) : 0
                return (
                  <div key={c.key} className={styles.row}>
                    <span className={styles.rowLabel}>{c.label}: {value}</span>
                    <div className={styles.rowBar}>
                      <div className={`${styles.rowFill} ${styles[c.key]}`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                )
              })}
            </li>
          ))}
        </ul>
      )}

      <p className={styles.legend}>
        Legenda: "Novo" são flashcards ainda não revisados. 
      </p>
    </section>
  )
}