import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function FeedbackButton() {
  const { session, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!message.trim()) return
    setSaving(true)
    await supabase.from('feedback').insert({
      user_id: session.user.id,
      user_name: profile?.full_name || null,
      message: message.trim(),
      rating,
    })
    setSaving(false)
    setDone(true)
    setTimeout(() => {
      setOpen(false)
      setDone(false)
      setMessage('')
      setRating(null)
    }, 2000)
  }

  return (
    <>
      <button className="feedback-fab" onClick={() => setOpen(true)} title="Send feedback">
        💬
      </button>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <div className="modal feedback-modal" onClick={e => e.stopPropagation()}>
            {done ? (
              <div className="feedback-done">
                <div className="feedback-done-icon">✓</div>
                <div>Thanks for the feedback!</div>
              </div>
            ) : (
              <>
                <div className="modal-title">Send Feedback</div>
                <div className="modal-sub">What's working? What could be better?</div>

                <div className="rating-row">
                  {['😤', '😐', '🙂', '😄', '🔥'].map((emoji, i) => (
                    <button
                      key={i}
                      className={`rating-chip ${rating === i + 1 ? 'active' : ''}`}
                      onClick={() => setRating(i + 1)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us what you think..."
                  rows={4}
                  autoFocus
                />

                <div className="feedback-actions">
                  <button className="modal-close" onClick={() => setOpen(false)}>Cancel</button>
                  <button
                    className="btn-primary"
                    style={{ width: 'auto', padding: '10px 24px' }}
                    onClick={submit}
                    disabled={!message.trim() || saving}
                  >
                    {saving ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
