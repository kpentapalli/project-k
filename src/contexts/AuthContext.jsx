import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on subscribe — no need for getSession().
    // Using both caused a race: INITIAL_SESSION would set profile=null (no session),
    // then on SIGNED_IN the loading gate (profile===undefined) was already false,
    // so ProtectedRoute rendered with stale null profile → wrongly redirected to /intake.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Reset profile to undefined so loading=true while we re-fetch.
        // Without this, profile stays null from the prior INITIAL_SESSION(null) call
        // and loading never gates the routing decision.
        setProfile(undefined)
      }
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  async function refreshProfile(userId) {
    await fetchProfile(userId)
  }

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  const isAdmin = profile?.role === 'admin'
  const intakeCompleted = profile?.intake_completed === true
  const loading = session === undefined || (session !== null && profile === undefined)

  return (
    <AuthContext.Provider value={{ session, profile, isAdmin, intakeCompleted, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
