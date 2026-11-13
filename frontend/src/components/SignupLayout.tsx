import type { ReactNode } from 'react'
import background from '../assets/studyflow-background-purple.png'
import keyboard from '../assets/keyboard-illustration.png'
import styles from './SignupLayout.module.css'

export function SignupLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page} style={{ backgroundImage: `url(${background})` }}>
      <section className={styles.form}>{children}</section>
      <img className={styles.keyboard} src={keyboard} alt="" />
    </main>
  )
}