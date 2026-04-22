import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const GOALS = ['Cut', 'Bulk', 'Maintain', 'Athletic Performance']
const EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced']
const DAYS = ['3', '4', '5', '6']
const EQUIPMENT = ['Full Gym', 'Home Gym', 'Minimal (bands/bodyweight)']

export default function Intake() {
  const { session, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    goal: '',
    experience: '',
    days_per_week: '',
    equipment: '',
    limitations: '',
    weight_current: '',
    weight_target: '',
  })

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        goal: form.goal.toLowerCase().replace(' ', '_'),
        experience: form.experience.toLowerCase(),
        days_per_week: parseInt(form.days_per_week),
        equipment: form.equipment.toLowerCase().replace(/[^a-z]/g, '_').replace(/_+/g, '_'),
        limitations: form.limitations || null,
        weight_current: form.weight_current ? parseFloat(form.weight_current) : null,
        weight_target: form.weight_target ? parseFloat(form.weight_target) : null,
        intake_completed: true,
      })
      .eq('id', session.user.id)

    setSaving(false)

    if (error) {
      setError('Something went wrong: ' + error.message)
    } else {
      await refreshProfile(session.user.id)
      navigate('/dashboard')
    }
  }

  const required = form.full_name && form.goal && form.experience && form.days_per_week && form.equipment

  return (
    <div className="intake-screen">
      <div className="intake-card">
        <div className="intake-header">
          <div className="intake-logo">PROJECT K</div>
          <h1 className="intake-title">Tell us about yourself</h1>
          <p className="intake-sub">This helps us assign the right program for you.</p>
        </div>

        <form onSubmit={handleSubmit} className="intake-form">
          <div className="field">
            <label>Full name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="field">
            <label>Fitness goal</label>
            <div className="chip-group">
              {GOALS.map(g => (
                <button
                  key={g}
                  type="button"
                  className={`chip ${form.goal === g ? 'chip-active' : ''}`}
                  onClick={() => set('goal', g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Experience level</label>
            <div className="chip-group">
              {EXPERIENCE.map(e => (
                <button
                  key={e}
                  type="button"
                  className={`chip ${form.experience === e ? 'chip-active' : ''}`}
                  onClick={() => set('experience', e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Days available per week</label>
            <div className="chip-group">
              {DAYS.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`chip ${form.days_per_week === d ? 'chip-active' : ''}`}
                  onClick={() => set('days_per_week', d)}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Equipment access</label>
            <div className="chip-group">
              {EQUIPMENT.map(eq => (
                <button
                  key={eq}
                  type="button"
                  className={`chip ${form.equipment === eq ? 'chip-active' : ''}`}
                  onClick={() => set('equipment', eq)}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Injuries or limitations <span className="optional">(optional)</span></label>
            <textarea
              value={form.limitations}
              onChange={e => set('limitations', e.target.value)}
              placeholder="e.g. bad left knee, no overhead pressing..."
              rows={3}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Current weight <span className="optional">(lbs, optional)</span></label>
              <input
                type="number"
                value={form.weight_current}
                onChange={e => set('weight_current', e.target.value)}
                placeholder="e.g. 185"
                min={50}
                max={500}
              />
            </div>
            <div className="field">
              <label>Target weight <span className="optional">(lbs, optional)</span></label>
              <input
                type="number"
                value={form.weight_target}
                onChange={e => set('weight_target', e.target.value)}
                placeholder="e.g. 170"
                min={50}
                max={500}
              />
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={!required || saving}>
            {saving ? 'Saving...' : 'Submit & Get Started'}
          </button>
        </form>
      </div>
    </div>
  )
}
