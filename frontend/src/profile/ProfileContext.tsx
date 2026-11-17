import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { profileApi, type Profile } from '../services/profileApi'

interface ProfileState {
  profile: Profile | null
  loading: boolean
  error: string
  refresh: () => Promise<void>
}

const ProfileContext = createContext<ProfileState>({
  profile: null, loading: true, error: '', refresh: async () => {},
})

export function ProfileProvider({
  children,
  load = profileApi.get,
}: {
  children: ReactNode
  load?: () => Promise<Profile>
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProfile(await load())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar o perfil.')
    } finally {
      setLoading(false)
    }
  }, [load])

  useEffect(() => { void refresh() }, [refresh])

  return (
    <ProfileContext.Provider value={{ profile, loading, error, refresh }}>
      {children}
    </ProfileContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useProfile = () => useContext(ProfileContext)