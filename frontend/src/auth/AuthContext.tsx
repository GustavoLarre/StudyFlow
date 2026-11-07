import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'

export interface AuthUser {
  uid: string
  email: string | null
}

type Subscribe = (callback: (user: AuthUser | null) => void) => () => void

interface AuthState {
  user: AuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, loading: true })

const firebaseSubscribe: Subscribe = (callback) =>
  onAuthStateChanged(auth, (user) =>
    callback(user ? { uid: user.uid, email: user.email } : null),
  )

export function AuthProvider({
  children,
  subscribe = firebaseSubscribe,
}: {
  children: ReactNode
  subscribe?: Subscribe
}) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => subscribe((user) => setState({ user, loading: false })), [subscribe])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)