import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const { session, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', code: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && session && profile !== undefined) {
      navigate('/', { replace: true })
    }
  }, [authLoading, session, profile])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        code: form.code.trim(),
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(result.error || 'Something went wrong. Please try again.')
      return
    }

    // Account created — sign in immediately
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    })

    setLoading(false)

    if (signInError) {
      setError('Account created but sign-in failed. Try signing in manually.')
      return
    }

    // onAuthStateChange fires → AuthContext loads → ProtectedRoute sends to /intake
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">PROJECT K</div>
        <p className="auth-sub">Create your account</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Invite code</label>
            <input
              type="text"
              value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase())}
              placeholder="PK-XXXXXXXX"
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label>Password <span className="optional">(min 8 characters)</span></label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={!form.email || !form.password || !form.code || loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-note">
          Already have an account?{' '}
          <a href="/login" className="auth-link-inline">Sign in</a>
        </p>
        <p className="auth-note">
          No code?{' '}
          <a href="/request-access" className="auth-link-inline">Request access</a>
        </p>
      </div>
    </div>
  )
}
