import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function RequestAccess() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: insertError } = await supabase
      .from('access_requests')
      .insert({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        message: form.message.trim() || null,
      })

    setSubmitting(false)

    if (insertError) {
      setError('Something went wrong. Please try again.')
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-logo">PROJECT K</div>
          <div className="request-success">
            <div className="request-success-icon">✓</div>
            <h2>Request received</h2>
            <p>We'll review your request and send an invite to <strong>{form.email}</strong> if approved. Keep an eye on your inbox.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">PROJECT K</div>
        <p className="auth-sub">Request access</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label>Why do you want to join? <span className="optional">(optional)</span></label>
            <textarea
              value={form.message}
              onChange={e => set('message', e.target.value)}
              placeholder="e.g. looking to cut for summer, friend referred me..."
              rows={3}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={!form.name || !form.email || submitting}>
            {submitting ? 'Sending...' : 'Request Access'}
          </button>

          <a href="/login" className="auth-link" style={{ textAlign: 'center', display: 'block', marginTop: 8 }}>
            Already have an account? Sign in
          </a>
        </form>

        <p className="auth-note">Access is reviewed manually. Invite-only.</p>
      </div>
    </div>
  )
}
