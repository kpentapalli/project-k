// WelcomeScreen — Treno animated welcome shown on initial app mount.
// Wordmark + tagline + locomotive sliding across a track.
// Dismisses once auth resolves AND a minimum display time has elapsed.
// Does NOT re-show on logout/login (one-shot per React mount).

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Wordmark, Tagline, Locomotive } from './marks'

// Splash duration is configurable via URL query for tuning:
//   ?splash=3     → 3s
//   ?splash=5     → 5s
//   ?splash=10    → 10s
//   ?splash=long  → 10s (back-compat)
//   ?splash=off   → skip entirely
//   ?nosplash     → skip (back-compat)
// Default: 10000ms — full brand moment with locomotive animation cycle.
const DEFAULT_MIN_DISPLAY_MS = 10000

function getMinDisplay() {
  if (typeof window === 'undefined') return DEFAULT_MIN_DISPLAY_MS
  const sp = new URLSearchParams(window.location.search)
  const v = sp.get('splash')
  if (v === 'off' || sp.has('nosplash')) return 0
  if (v === 'long') return 10000
  if (v !== null) {
    const n = Number(v)
    if (Number.isFinite(n) && n >= 0 && n <= 30) return n * 1000
  }
  return DEFAULT_MIN_DISPLAY_MS
}

const MIN_DISPLAY_MS = getMinDisplay()
const FADE_OUT_MS    = 320    // fade duration

// Inject CSS keyframes once per app session.
function ensureKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById('treno-welcome-keyframes')) return
  const style = document.createElement('style')
  style.id = 'treno-welcome-keyframes'
  style.textContent = `
    @keyframes treno-loco-slide {
      0%   { transform: translateX(-60px); }
      100% { transform: translateX(180px); }
    }
    @keyframes treno-dot-pulse {
      0%, 100% { opacity: 0.25; transform: scale(0.85); }
      50%      { opacity: 1.00; transform: scale(1.00); }
    }
    @keyframes treno-splash-fade {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
  `
  document.head.appendChild(style)
}

export default function WelcomeScreen() {
  const { loading } = useAuth()
  const mountedAt = useRef(Date.now())
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => { ensureKeyframes() }, [])

  // Dismiss once auth resolves AND min display has elapsed.
  useEffect(() => {
    if (!visible) return
    if (loading) return
    const elapsed = Date.now() - mountedAt.current
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed)
    const t1 = setTimeout(() => setFading(true), remaining)
    const t2 = setTimeout(() => setVisible(false), remaining + FADE_OUT_MS)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [visible, loading])

  if (!visible) return null
  if (MIN_DISPLAY_MS === 0) return null  // ?splash=off / ?nosplash

  return (
    <div
      role="status"
      aria-label="Welcome to Treno"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#080809',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 24px calc(40px + env(safe-area-inset-bottom)) 24px',
        paddingTop: 'calc(60px + env(safe-area-inset-top))',
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_OUT_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Top: version stamp */}
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 11,
        letterSpacing: '0.36em',
        color: '#5a5a66',
        textTransform: 'uppercase',
      }}>
        v1.0 · alpha
      </div>

      {/* Center: wordmark + tagline */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
      }}>
        <Wordmark size={92} />
        <Tagline color="#888892" size={11} gap={14} />
      </div>

      {/* Lower: track + locomotive + loading dots */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
      }}>
        <Track />
        <LoadingDots />
      </div>

      {/* Footer microcopy */}
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 9,
        letterSpacing: '0.32em',
        color: '#3a3a42',
        textTransform: 'uppercase',
      }}>
        [ gr. trénο · locomotive ]
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Track region — 300px wide, 22 ties, locomotive slides L→R
// ─────────────────────────────────────────────────────────────
const TRACK_W = 300
const NUM_TIES = 22

function Track() {
  return (
    <div style={{
      position: 'relative',
      width: TRACK_W,
      height: 80,
    }}>
      {/* Locomotive — slides across */}
      <div style={{
        position: 'absolute',
        bottom: 18,
        left: 0,
        animation: 'treno-loco-slide 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      }}>
        <Locomotive size={80} />
      </div>

      {/* Track ties */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        {Array.from({ length: NUM_TIES }).map((_, i) => (
          <span key={i} style={{
            display: 'inline-block',
            width: 8,
            height: 1,
            background: '#2e2e34',
          }}/>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Loading dots — three signal-green dots pulsing in sequence
// ─────────────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            display: 'inline-block',
            width: 6, height: 6, borderRadius: '50%',
            background: '#39ff8a',
            animation: 'treno-dot-pulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}/>
        ))}
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 10,
        letterSpacing: '0.32em',
        color: '#5a5a66',
        textTransform: 'uppercase',
      }}>
        loading
      </span>
    </div>
  )
}
