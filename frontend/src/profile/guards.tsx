import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useProfile } from './ProfileContext'

function Status() {
  const { loading, error, refresh } = useProfile()
  if (loading) return <p>Carregando...</p>
  return (
    <section>
      <p>{error}</p>
      <button type="button" onClick={() => void refresh()}>Tentar de novo</button>
    </section>
  )
}

export function UsernameGate({ children }: { children: ReactNode }) {
  const { profile, loading, error } = useProfile()
  if (loading || error || !profile) return <Status />
  return profile.username ? <>{children}</> : <Navigate to="/escolher-username" replace />
}

export function NeedsUsernameRoute({ children }: { children: ReactNode }) {
  const { profile, loading, error } = useProfile()
  if (loading || error || !profile) return <Status />
  return profile.username ? <Navigate to="/materias" replace /> : <>{children}</>
}