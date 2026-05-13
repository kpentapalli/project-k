import { useState } from 'react';
import { HERO, Sprite } from '../lib/heroes';
import Label from '../components/Label';

export default function OnboardingScreen({ onComplete }) {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--pk-bg)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 20px 40px',
      fontFamily: 'var(--pk-font-body)',
      color: 'var(--pk-text)',
    }}>
      {/* progress dots */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 32, marginTop: 8 }}>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{
            width: i === 4 ? 24 : 6,
            height: 6,
            borderRadius: 3,
            background: i <= 4 ? 'var(--pk-acc)' : 'var(--pk-border-2)',
          }}/>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Label>STEP 04 OF 05</Label>
        <h2 style={{
          fontFamily: 'var(--pk-font-display)',
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          lineHeight: 1,
          marginTop: 10,
        }}>
          CHOOSE YOUR<br/>
          <span style={{ color: 'var(--pk-acc)' }}>HERO</span>
        </h2>
        <p style={{
          fontFamily: 'var(--pk-font-body)',
          fontSize: 14,
          color: 'var(--pk-text-2)',
          marginTop: 12,
          maxWidth: '32ch',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.5,
        }}>
          Your sigil while you train. Reskinnable later — same XP, same evolution.
        </p>
      </div>

      {/* hero choices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
        {(['knight', 'queen']).map(id => {
          const h = HERO[id];
          const sel = selected === id;
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              style={{
                background: sel ? 'var(--pk-acc-bg)' : 'var(--pk-card)',
                border: `1.5px solid ${sel ? 'var(--pk-acc)' : 'var(--pk-border)'}`,
                borderRadius: 12,
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'border-color var(--pk-dur-fast), background var(--pk-dur-fast)',
              }}
            >
              {sel && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--pk-acc)', color: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>✓</div>
              )}
              <div style={{
                width: 90, height: 90,
                background: h.deep,
                border: `2px solid ${h.cloth2}`,
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Sprite hero={id} size={72}/>
              </div>
              <div style={{
                fontFamily: 'var(--pk-font-display)',
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
                color: sel ? 'var(--pk-acc)' : 'var(--pk-text)',
              }}>{h.name.toUpperCase()}</div>
              <Label color={sel ? 'var(--pk-text-2)' : 'var(--pk-muted)'} style={{ marginTop: 4 }}>
                {h.weapon}
              </Label>
              <div style={{ display: 'flex', gap: 3, marginTop: 12 }}>
                {[h.cloth, h.cloth2, h.deep, h.plume].map((c, i) => (
                  <span key={i} style={{
                    width: 12, height: 12, background: c,
                    border: '1px solid rgba(0,0,0,0.3)',
                    borderRadius: 2,
                  }}/>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <p style={{
        fontFamily: 'var(--pk-font-mono)',
        fontSize: 10,
        color: 'var(--pk-muted)',
        textAlign: 'center',
        letterSpacing: '0.06em',
        marginTop: 16,
        marginBottom: 16,
      }}>BOTH ARE GENDER-NEUTRAL ROLES, NOT BODIES.</p>

      <button
        disabled={!selected}
        onClick={() => selected && onComplete(selected)}
        style={{
          width: '100%',
          background: selected ? 'var(--pk-acc)' : 'var(--pk-card)',
          color: selected ? '#000' : 'var(--pk-muted)',
          border: `1px solid ${selected ? 'transparent' : 'var(--pk-border)'}`,
          borderRadius: 10,
          padding: '16px',
          fontFamily: 'var(--pk-font-display)',
          fontWeight: 800,
          fontSize: 16,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          cursor: selected ? 'pointer' : 'default',
          transition: 'all var(--pk-dur-fast)',
        }}
      >
        {selected ? 'CONTINUE →' : 'SELECT A HERO'}
      </button>
    </div>
  );
}
