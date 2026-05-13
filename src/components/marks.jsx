// Treno brand marks — wordmark, locomotive sprite, monogram.
// Aligned to mobile-v0 design language: Bebas Neue / Syne / JetBrains Mono,
// signal-green accent (#39ff8a) on near-black surfaces.
// Source: design handoff "Project K — Design System" (2026-05-09).

import React from 'react'

// ─────────────────────────────────────────────────────────────
// Wordmark — TRENO. (Bebas Neue, optional signal-green dot)
// Used in TopBar, Login, Intake, splash.
// ─────────────────────────────────────────────────────────────
export function Wordmark({ size = 64, color = '#f2f2f2', accent = '#39ff8a', dot = true }) {
  return (
    <span style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: size,
      lineHeight: 1,
      letterSpacing: '0.08em',
      color,
      whiteSpace: 'nowrap',
      display: 'inline-block',
    }}>
      TRENO{dot && (
        <span style={{
          color: accent,
          textShadow: `0 0 ${size * 0.18}px ${accent}`,
          marginLeft: '-0.04em',
        }}>.</span>
      )}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Tagline — TRAIN › MOVE › FORWARD (mono caps, tracked-out)
// ─────────────────────────────────────────────────────────────
export function Tagline({ color = '#888892', size = 11, gap = 14 }) {
  const items = ['TRAIN', 'MOVE', 'FORWARD']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap,
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: size,
      letterSpacing: '0.24em',
      color,
    }}>
      {items.map((w, i) => (
        <React.Fragment key={w}>
          <span>{w}</span>
          {i < items.length - 1 && <span style={{ opacity: 0.5 }}>›</span>}
        </React.Fragment>
      ))}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// 16×16 pixel sprite — Locomotive (FACING RIGHT → forward motion)
// Headlight = signal green = "ready to train".
// ─────────────────────────────────────────────────────────────
export function Locomotive({ size = 64, accent = '#39ff8a' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      {/* smoke trail — drifting LEFT/up (away from forward motion) */}
      <rect x="8" y="0" width="2" height="1" fill="#5a5a66"/>
      <rect x="7" y="1" width="3" height="1" fill="#a0a0aa"/>
      <rect x="8" y="2" width="2" height="1" fill="#a0a0aa"/>
      <rect x="5" y="1" width="2" height="1" fill="#5a5a66"/>
      <rect x="6" y="2" width="1" height="1" fill="#5a5a66"/>

      {/* smokestack */}
      <rect x="8" y="3" width="3" height="1" fill="#1a1a1d"/>
      <rect x="9" y="4" width="2" height="2" fill="#1a1a1d"/>

      {/* boiler — silver cylinder, gold trim */}
      <rect x="3" y="6" width="11" height="4" fill="#c2c3c7"/>
      <rect x="3" y="6" width="11" height="1" fill="#fff7e2"/>
      <rect x="3" y="9" width="11" height="1" fill="#888892"/>
      <rect x="7" y="7" width="1" height="2" fill="#ffa300"/>
      <rect x="11" y="7" width="1" height="2" fill="#ffa300"/>

      {/* headlight — signal green, on the FRONT (right) */}
      <rect x="13" y="7" width="2" height="2" fill={accent}/>
      <rect x="14" y="7" width="1" height="1" fill="#fff7e2"/>

      {/* cab — deep blue with silver roof, on the BACK (left) */}
      <rect x="1" y="5" width="2" height="5" fill="#29366f"/>
      <rect x="1" y="5" width="2" height="1" fill="#c2c3c7"/>
      <rect x="1" y="7" width="2" height="1" fill="#fff7e2" opacity="0.4"/>

      {/* running board / frame */}
      <rect x="1" y="10" width="14" height="1" fill="#1a1a1d"/>
      <rect x="2" y="10" width="13" height="1" fill="#ffa300"/>

      {/* wheels — three pairs */}
      <rect x="4" y="11" width="2" height="2" fill="#1d2b53"/>
      <rect x="5" y="11" width="1" height="1" fill="#c2c3c7"/>
      <rect x="8" y="11" width="2" height="2" fill="#1d2b53"/>
      <rect x="9" y="11" width="1" height="1" fill="#c2c3c7"/>
      <rect x="12" y="11" width="2" height="2" fill="#1d2b53"/>
      <rect x="13" y="11" width="1" height="1" fill="#c2c3c7"/>

      {/* track — dashed gold */}
      <rect x="0" y="14" width="2" height="1" fill="#ffa300"/>
      <rect x="3" y="14" width="2" height="1" fill="#ffa300"/>
      <rect x="6" y="14" width="2" height="1" fill="#ffa300"/>
      <rect x="9" y="14" width="2" height="1" fill="#ffa300"/>
      <rect x="12" y="14" width="2" height="1" fill="#ffa300"/>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Pixel "T" monogram — for app icon, favicon
// ─────────────────────────────────────────────────────────────
export function MonogramT({ size = 64, fg = '#39ff8a', bg = 'transparent' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      {bg !== 'transparent' && <rect x="0" y="0" width="16" height="16" fill={bg}/>}
      <rect x="2" y="3" width="12" height="2" fill={fg}/>
      <rect x="7" y="5" width="2" height="9" fill={fg}/>
      <rect x="2" y="3" width="2" height="2" fill={fg}/>
      <rect x="12" y="3" width="2" height="2" fill={fg}/>
      <rect x="5" y="13" width="6" height="1" fill={fg}/>
      <rect x="2" y="15" width="2" height="1" fill={fg} opacity="0.5"/>
      <rect x="6" y="15" width="2" height="1" fill={fg} opacity="0.5"/>
      <rect x="10" y="15" width="2" height="1" fill={fg} opacity="0.5"/>
    </svg>
  )
}
