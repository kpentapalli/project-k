import { useState } from 'react';
import { HERO, Sprite } from '../lib/heroes';
import Label from '../components/Label';
import TabBar from '../components/TabBar';

const SETS_INIT = [
  { n: 1, w: '95', r: '10', done: true,  pr: false, active: false },
  { n: 2, w: '95', r: '10', done: true,  pr: true,  active: false },
  { n: 3, w: '95', r: '',   done: false, pr: false,  active: true  },
];

export default function WorkoutScreen({ hero, navigate }) {
  const h = HERO[hero];
  const [sets, setSets] = useState(SETS_INIT);

  function logSet() {
    setSets(prev => prev.map((s, i) => {
      if (s.active) return { ...s, done: true, active: false, r: s.r || '10' };
      return s;
    }));
  }

  const activeSet = sets.find(s => s.active);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--pk-bg)',
      color: 'var(--pk-text)',
      fontFamily: 'var(--pk-font-body)',
      paddingTop: 60,
      paddingBottom: 96,
    }}>
      <div style={{ padding: '12px 20px 20px' }}>

        {/* top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button
            onClick={() => navigate('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--pk-font-mono)', fontSize: 20, color: 'var(--pk-muted)' }}>×</button>
          <div style={{
            display: 'flex', gap: 3, alignItems: 'center',
            fontFamily: 'var(--pk-font-mono)', fontSize: 11,
            letterSpacing: '0.12em', color: 'var(--pk-text-2)',
          }}>
            EXERCISE 2/4
            <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
              <span style={{ width: 18, height: 4, background: 'var(--pk-acc)' }}/>
              <span style={{ width: 18, height: 4, background: 'var(--pk-acc)' }}/>
              <span style={{ width: 18, height: 4, background: 'var(--pk-border-2)' }}/>
              <span style={{ width: 18, height: 4, background: 'var(--pk-border-2)' }}/>
            </div>
          </div>
          <Sprite hero={hero} size={28}/>
        </div>

        {/* exercise name */}
        <div style={{ marginBottom: 16 }}>
          <Label color={h.cloth2}>EXERCISE 02</Label>
          <h2 style={{
            fontFamily: 'var(--pk-font-display)',
            fontSize: 34, fontWeight: 800,
            letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1,
            marginTop: 6, marginBottom: 6,
          }}>OVERHEAD<br/>PRESS</h2>
          <Label>3 × 10 · BARBELL</Label>
        </div>

        {/* set grid */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 1fr 36px',
            alignItems: 'center',
            padding: '0 0 6px',
            borderBottom: '1px solid var(--pk-border)',
            marginBottom: 4,
          }}>
            <Label>SET</Label>
            <Label>WEIGHT</Label>
            <Label>REPS</Label>
            <Label>✓</Label>
          </div>

          {sets.map(s => (
            <div key={s.n} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 1fr 36px',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid var(--pk-border)',
              background: s.active ? 'var(--pk-acc-bg)' : 'transparent',
              margin: s.active ? '0 -8px' : 0,
              paddingLeft: s.active ? 8 : 0,
              paddingRight: s.active ? 8 : 0,
              borderRadius: s.active ? 6 : 0,
            }}>
              <span style={{
                fontFamily: 'var(--pk-font-mono)', fontSize: 13,
                color: s.active ? 'var(--pk-acc)' : 'var(--pk-muted)',
              }}>0{s.n}</span>
              <span style={{
                fontFamily: 'var(--pk-font-display)', fontSize: 22, fontWeight: 800,
                color: s.active ? 'var(--pk-acc)' : s.done ? 'var(--pk-text)' : 'var(--pk-muted)',
                letterSpacing: '-0.01em',
              }}>
                {s.w || '—'}{' '}
                <span style={{ fontSize: 11, color: 'var(--pk-muted)', letterSpacing: '0.1em' }}>LB</span>
              </span>
              <span style={{
                fontFamily: 'var(--pk-font-display)', fontSize: 22, fontWeight: 800,
                color: s.active ? 'var(--pk-acc)' : s.done ? 'var(--pk-text)' : 'var(--pk-muted)',
                letterSpacing: '-0.01em',
              }}>
                {s.r || '?'}{' '}
                {s.pr && <span style={{ color: h.trim, fontSize: 12, marginLeft: 4 }}>★</span>}
              </span>
              <span style={{
                width: 24, height: 24, borderRadius: 4,
                border: `1px solid ${s.done ? 'var(--pk-acc)' : 'var(--pk-border-2)'}`,
                background: s.done ? 'var(--pk-acc)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#000', fontSize: 13, fontWeight: 700,
              }}>{s.done ? '✓' : ''}</span>
            </div>
          ))}
        </div>

        {/* rest timer */}
        <div style={{
          background: 'var(--pk-card)',
          border: '1px solid var(--pk-border)',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 14,
        }}>
          <div>
            <Label>⏱ REST · TARGET 90s</Label>
            <div style={{
              fontFamily: 'var(--pk-font-display)',
              fontSize: 32, fontWeight: 800,
              color: h.trim, letterSpacing: '-0.01em', lineHeight: 1, marginTop: 4,
            }}>0:42</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['−15', '+15'].map(label => (
              <button key={label} style={{
                width: 44, height: 44, borderRadius: 6,
                border: '1px solid var(--pk-border-2)',
                background: 'transparent', color: 'var(--pk-text)',
                fontSize: 13, fontFamily: 'var(--pk-font-mono)',
                cursor: 'pointer',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* primary CTA */}
        <button
          onClick={logSet}
          style={{
            width: '100%',
            background: activeSet ? 'var(--pk-acc)' : 'var(--pk-card)',
            color: activeSet ? '#000' : 'var(--pk-muted)',
            border: `1px solid ${activeSet ? 'transparent' : 'var(--pk-border)'}`,
            borderRadius: 10,
            padding: '16px',
            fontFamily: 'var(--pk-font-display)', fontWeight: 800,
            fontSize: 16, letterSpacing: '0.16em', textTransform: 'uppercase',
            cursor: activeSet ? 'pointer' : 'default',
          }}>
          {activeSet ? `LOG SET 0${activeSet.n}` : '✓ ALL SETS DONE'}
        </button>

      </div>
      <TabBar active="workout" navigate={navigate}/>
    </div>
  );
}
