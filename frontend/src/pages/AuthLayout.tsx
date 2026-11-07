import type { ReactNode } from 'react'
import background from '../assets/studyflow-background-grid.png'
import logo from '../assets/studyflow-logo.png'
import styles from './AuthLayout.module.css'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page} style={{ backgroundImage: `url(${background})` }}>
      <img className={styles.logo} src={logo} alt="StudyFlow" />
      <section className={styles.card}>{children}</section>
    </main>
  )
}