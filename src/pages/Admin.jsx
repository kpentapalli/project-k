import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [programs, setPrograms] = useState([])
  const [selected, setSelected] = useState(null)
  const [assignForm, setAssignForm] = useState({ program_id: '', start_date: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [usersRes, programsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at'),
        supabase.from('programs').select('*').eq('is_active', true).order('name'),
      ])
      const profiles = usersRes.data || []

      // Load each user's current assignment
      const assignments = await Promise.all(
        profiles.map(p =>
          supabase
            .from('program_assignments')
            .select('*, programs(name)')
            .eq('user_id', p.id)
            .order('assigned_at', { ascending: false })
            .limit(1)
            .single()
        )
      )

      const enriched = profiles.map((p, i) => ({
        ...p,
        assignment: assignments[i].data || null,
      }))

      setUsers(enriched)
      setPrograms(programsRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  function selectUser(user) {
    setSelected(user)
    setAssignForm({
      program_id: user.assignment?.program_id || '',
      start_date: user.assignment?.start_date || new Date().toISOString().slice(0, 10),
    })
  }

  async function assignProgram() {
    if (!assignForm.program_id || !assignForm.start_date) return
    setSaving(true)

    const { data: adminProfile } = await supabase.from('profiles').select('id').eq('role', 'admin').single()

    await supabase.from('program_assignments').upsert({
      user_id: selected.id,
      program_id: assignForm.program_id,
      start_date: assignForm.start_date,
      assigned_by: adminProfile.id,
      assigned_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    const prog = programs.find(p => p.id === assignForm.program_id)
    setUsers(prev => prev.map(u => u.id === selected.id
      ? { ...u, assignment: { program_id: assignForm.program_id, start_date: assignForm.start_date, programs: { name: prog?.name } } }
      : u
    ))
    setSelected(prev => ({ ...prev, assignment: { program_id: assignForm.program_id, start_date: assignForm.start_date, programs: { name: prog?.name } } }))
    setSaving(false)
  }

  if (loading) return <div className="loading-screen">Loading...</div>

  return (
    <div className="page">
      <TopBar active="admin" />
      <div className="page-content">
        <div className="hero">
          <div className="hero-label">ADMIN</div>
          <h1 className="hero-title">USER MANAGEMENT</h1>
        </div>

        <div className="admin-layout">
          <div className="admin-user-list">
            <div className="section-title">Users ({users.length})</div>
            {users.map(user => (
              <div
                key={user.id}
                className={`admin-user-row ${selected?.id === user.id ? 'active' : ''}`}
                onClick={() => selectUser(user)}
              >
                <div className="admin-user-name">{user.full_name || '(no name)'}</div>
                <div className="admin-user-meta">
                  {user.intake_completed
                    ? <span className="badge badge-green">Intake done</span>
                    : <span className="badge badge-warn">Awaiting intake</span>}
                  {user.assignment
                    ? <span className="badge badge-acc">{user.assignment.programs?.name}</span>
                    : <span className="badge badge-muted">No program</span>}
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="admin-user-detail">
              <div className="section-title">{selected.full_name || 'User'}</div>

              {selected.intake_completed ? (
                <div className="intake-view">
                  <div className="intake-row"><span>Goal</span><span>{selected.goal}</span></div>
                  <div className="intake-row"><span>Experience</span><span>{selected.experience}</span></div>
                  <div className="intake-row"><span>Days/week</span><span>{selected.days_per_week}</span></div>
                  <div className="intake-row"><span>Equipment</span><span>{selected.equipment}</span></div>
                  {selected.limitations && <div className="intake-row"><span>Limitations</span><span>{selected.limitations}</span></div>}
                  {selected.weight_current && <div className="intake-row"><span>Current weight</span><span>{selected.weight_current} lbs</span></div>}
                  {selected.weight_target && <div className="intake-row"><span>Target weight</span><span>{selected.weight_target} lbs</span></div>}
                </div>
              ) : (
                <p className="empty-state">Intake not completed yet.</p>
              )}

              <div className="assign-section">
                <div className="section-title">Assign Program</div>
                <div className="field">
                  <label>Program</label>
                  <select
                    value={assignForm.program_id}
                    onChange={e => setAssignForm(prev => ({ ...prev, program_id: e.target.value }))}
                  >
                    <option value="">Select a program...</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.duration_weeks}wk · {p.difficulty})</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Start date</label>
                  <input
                    type="date"
                    value={assignForm.start_date}
                    onChange={e => setAssignForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <button
                  className="btn-primary"
                  onClick={assignProgram}
                  disabled={!assignForm.program_id || !assignForm.start_date || saving}
                >
                  {saving ? 'Saving...' : selected.assignment ? 'Update Assignment' : 'Assign Program'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
