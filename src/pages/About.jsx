import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TopBar from '../components/TopBar'

const PROGRAM_INTROS = {
  'The 6-Week Cut': {
    tagline: 'Burn fat. Keep every pound of muscle you earned.',
    philosophy: 'Most cut programs make you small. This one doesn\'t. Undulating periodization means you\'re never doing the same thing two days in a row — heavy compound work preserves strength and muscle, while high-rep isolation days accelerate fat burn. Six days a week, six weeks. By the end, you\'ll be leaner and still strong.',
  },
  'The 8-Week Bulk': {
    tagline: 'Build real muscle. No fluff, no filler.',
    philosophy: 'Eight weeks, two phases. The first four weeks (Accumulation) build the training volume your muscles need to grow. The second four weeks (Intensification) shift to heavier loads so that size becomes strength. Push, pull, legs, upper, lower — a split designed so every muscle gets hit twice a week while still recovering fully.',
  },
  'Beginner Foundation': {
    tagline: 'Learn to move right. Build a base that lasts.',
    philosophy: 'Beginners don\'t need complicated programs — they need to master movement. Three days a week, alternating between two full-body workouts, every session is a chance to get better at the fundamentals: squat, hinge, push, pull, carry. Progress here is fast because everything is new. Don\'t rush it.',
  },
  'Athletic Performance': {
    tagline: 'Power. Speed. Strength. In that order.',
    philosophy: 'This program is for people who already train and want more out of their body. Olympic lifting derivatives build explosive power from the ground up. Heavy strength work adds the mass to express it. Conditioning ties it together. Two phases: build the engine (weeks 1–3), then push its limits (weeks 4–6).',
  },
}

export default function About() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('programs')
      .select('id, name, description, duration_weeks, days_per_week, goal_tag, difficulty')
      .eq('is_active', true)
      .order('created_at')
      .then(({ data }) => {
        setPrograms(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="page">
      <TopBar active="about" />
      <div className="page-content">

        <div className="hero">
          <div className="hero-label">TRAINING PHILOSOPHY</div>
          <h1 className="hero-title">WHY WE TRAIN</h1>
        </div>

        <div className="about-philosophy">
          <p>
            Most training programs are built around aesthetics and ego. These aren't.
            Every program here is built around one idea: <strong>make you harder to hurt and harder to beat</strong>.
          </p>
          <p>
            That means compound movements first, isolation second. It means progressive overload
            built into the structure — not something you have to figure out yourself.
            It means rest is part of the program, not a sign you're slacking.
          </p>
          <p>
            You don't need to train like an elite athlete to get elite results.
            You need consistency, the right stimulus, and enough recovery.
            That's what these programs are built to deliver.
          </p>
          <div className="about-pillars">
            <div className="pillar">
              <div className="pillar-title">Progressive Overload</div>
              <div className="pillar-body">Every week asks more of you than the last. Rep ranges shift, sets increase, intensity builds. Your body adapts to what you consistently do.</div>
            </div>
            <div className="pillar">
              <div className="pillar-title">Compound First</div>
              <div className="pillar-body">Squats, deadlifts, presses, rows. These build the most muscle and burn the most energy. Isolation work finishes the job — it doesn't start it.</div>
            </div>
            <div className="pillar">
              <div className="pillar-title">Recovery Is Training</div>
              <div className="pillar-body">Muscle is built outside the gym. Sleep, food, and rest days are not optional — they're where the adaptation happens. Earn your rest days by showing up on training days.</div>
            </div>
          </div>
        </div>

        <div className="about-programs-section">
          <div className="hero-label" style={{ marginBottom: '20px' }}>THE PROGRAMS</div>
          {loading ? (
            <div className="muted">Loading programs...</div>
          ) : (
            <div className="about-program-grid">
              {programs.map(p => {
                const intro = PROGRAM_INTROS[p.name] || {}
                return (
                  <div className="about-program-card" key={p.id}>
                    <div className="apc-tags">
                      <span className="apc-tag">{p.difficulty}</span>
                      <span className="apc-tag">{p.duration_weeks}wk</span>
                      <span className="apc-tag">{p.days_per_week}d/wk</span>
                    </div>
                    <div className="apc-name">{p.name.toUpperCase()}</div>
                    {intro.tagline && <div className="apc-tagline">{intro.tagline}</div>}
                    <div className="apc-body">{intro.philosophy || p.description}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
