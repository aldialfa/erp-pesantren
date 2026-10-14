import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Role } from './roles'

export interface Profile {
  id: string
  full_name: string
  role: Role | null
  is_active: boolean
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileError: string | null
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  // 1. Pantau status login
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) {
        setProfile(null)
        setLoading(false)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  async function loadProfile() {
    if (!userId) return
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, is_active')
      .eq('id', userId)
      .maybeSingle()
    if (error) setProfileError('Gagal memuat profil: ' + error.message)
    else {
      setProfileError(null)
      setProfile(data as Profile | null)
    }
    setLoading(false)
  }

  // 2. Ambil profil setelah login
  useEffect(() => {
    if (userId) {
      setLoading(true)
      loadProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <Ctx.Provider value={{ session, profile, loading, profileError, refreshProfile: loadProfile, signOut }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return c
}
