import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ProgramSwitcher({ currentAssignment, userId, onSwitched, onClose }) {
  const [programs, setPrograms] = useState([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('programs')
      .select('id, name, description, duration_weeks, days_per_week, goal_tag, difficulty')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setPrograms(data || [])
        setLoading(false)
      })
  }, [])

  async function handleSwitch() {
    if (!selected || selected === currentAssignment?.program_id) return
    setSaving(true)
    setError(null)

    // Mark current as completed
    if (currentAssignment?.id) {
      const { error: completeErr } = await supabase
        .from('program_assignments')
        .update({ status: 'completed' })
        .eq('id', currentAssignment.id)

      if (completeErr) {
        setError('Could not complete current program. Try again.')
        setSaving(false)
        return
      }
    }

    // Insert new active assignment
    const { data, error: insertErr } = await supabase
      .from('program_assignments')
      .insert({
        user_id: userId,
        program_id: selected,
        start_date: new Date().toISOString().slice(0, 10),
        assigned_by: userId,
        status: 'active',
      })
      .select('*, programs(*)')
      .single()

    if (insertErr) {
      setError('Could not assign new program. Try again.')
      setSaving(false)
      return
    }

    onSwitched(data)
  }

  const chosenProgram = programs.find(p => p.id === selected)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Switch Program</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="modal-body"><p className="empty-state">Loading programs...</p></div>
        ) : (
          <div className="modal-body">
            {currentAssignment && (
              <div className="switcher-current">
                <div className="switcher-current-label">Current program</div>
                <div className="switcher-current-name">{currentAssignment.programs?.name}</div>
              </div>
            )}

            <div className="field">
              <label>Switch to</label>
              <select value={selected} onChange={e => setSelected(e.target.value)}>
                <option value="">Select a program...</option>
                {programs.map(p => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={p.id === currentAssignment?.program_id}
                  >
                    {p.name} — {p.duration_weeks}wk · {p.days_per_week}d/wk · {p.difficulty}
                    {p.id === currentAssignment?.program_id ? ' (current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {chosenProgram && chosenProgram.id !== currentAssignment?.program_id && (
              <div className="switcher-preview">
                <p className="switcher-preview-desc">{chosenProgram.description}</p>
              </div>
            )}

            {error && <p className="form-error">{error}</p>}

            <div className="switcher-warning">
              Your current program will be marked complete. All past workout logs are preserved.
            </div>

            <button
              className="btn-primary"
              onClick={handleSwitch}
              disabled={!selected || selected === currentAssignment?.program_id || saving}
            >
              {saving ? 'Switching...' : 'Switch Program'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
