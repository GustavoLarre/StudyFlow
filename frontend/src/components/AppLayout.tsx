import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { logout } from '../services/authService'
import styles from './AppLayout.module.css'

const Icon = ({ children }: { children: ReactNode }) => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const LINKS = [
  { to: '/materias', label: 'Matérias', icon: (
    <Icon>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </Icon>) },
  { to: '/revisao', label: 'Revisão', icon: (
    <Icon>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
      <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
    </Icon>) },
  { to: '/tarefas', label: 'Tarefas', icon: (
    <Icon>
      <rect width="8" height="4" x="8" y="2" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
    </Icon>) },
  { to: '/progresso', label: 'Progresso', icon: (
    <Icon>
      <path d="M12 16v5M16 14v7M20 10v11M4 18v3M8 14v7" />
      <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
    </Icon>) },
  { to: '/perfil', label: 'Perfil', icon: (
    <Icon>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </Icon>) },
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
              {l.icon}
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className={styles.logout} onClick={() => void onLogout()}>Sair</button>
      </aside>
      <main className={styles.content}><Outlet /></main>
    </div>
  )
}