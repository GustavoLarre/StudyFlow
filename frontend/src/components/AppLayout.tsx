import { NavLink, Outlet } from 'react-router-dom'
import { logout } from '../services/authService'
import styles from './AppLayout.module.css'

const LINKS = [
  { to: '/materias', label: 'Matérias' },
  { to: '/revisao', label: 'Revisão' },
  { to: '/progresso', label: 'Progresso' },
  { to: '/tarefas', label: 'Tarefas' },
]

export function AppLayout({ onLogout = logout }: { onLogout?: () => Promise<unknown> }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <span className={styles.brand}>StudyFlow</span>
        <nav className={styles.nav} aria-label="Principal">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className={styles.logout} onClick={() => void onLogout()}>Sair</button>
      </aside>
      <main className={styles.content}><Outlet /></main>
    </div>
  )
}