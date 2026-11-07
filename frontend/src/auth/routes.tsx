import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function Loading() {
  return <p>Carregando...</p>
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  return user ? <Navigate to="/materias" replace /> : <>{children}</>
}