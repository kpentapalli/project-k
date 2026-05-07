import { HERO, Sprite } from '../lib/heroes';
import Label from '../components/Label';
import Stat from '../components/Stat';
import TabBar from '../components/TabBar';

const WEEK = [
  { d: 'M', s: 'done' }, { d: 'T', s: 'today' }, { d: 'W', s: 'rest' },
  { d: 'T', s: 'plan' }, { d: 'F', s: 'plan' },  { d: 'S', s: 'rest' },
  { d: 'S', s: 'plan' },
];

export default function HomeScreen({ hero, navigate }) {
  const h = HERO[hero];

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
          <Label>TUE · MAY 7</Label>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            border: '1px solid var(--pk-acc-line)',
            background: 'var(--pk-acc-bg)',
            borderRadius: 4,
            fontFamily: 'var(--pk-font-mono)', fontSize: 11,
            letterSpacing: '0.12em', color: 'var(--pk-acc)',
          }}>
            <span style={{
              width: 6, height: 6,
              background: 'var(--pk-acc)',
              borderRadius: '50%',
              boxShadow: '0 0 6px var(--pk-acc)',
            }}/>
            12 DAY STREAK
          </div>
        </div>

        {/* hero card */}
        <div style={{
          background: 'var(--pk-card)',
          border: '1px solid var(--pk-border)',
          borderRadius: 12,
          padding: 18,
          display: 'flex', alignItems: 'center', gap: 16,
          marginBottom: 16,
        }}>
          <div style={{
            width: 72, height: 72,
            background: h.deep,
            border: `2px solid ${h.cloth2}`,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Sprite hero={hero} size={56}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Label color={h.cloth2}>{h.rank.toUpperCase()} · LV 18</Label>
            <div style={{
              fontFamily: 'var(--pk-font-display)',
              fontSize: 22, fontWeight: 800,
              letterSpacing: '-0.01em', textTransform: 'uppercase',
              lineHeight: 1, marginTop: 4,
            }}>{h.title}</div>
            <div style={{ marginTop: 10 }}>
              <div style={{
                height: 4, borderRadius: 2,
                background: 'var(--pk-border)', overflow: 'hidden',
              }}>
                <div style={{ width: '64%', height: '100%', background: 'var(--pk-acc)' }}/>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginTop: 4,
                fontFamily: 'var(--pk-font-mono)', fontSize: 10,
                letterSpacing: '0.10em', color: 'var(--pk-muted)',
              }}>
                <span>1,820 XP</span><span>2,850 NEXT</span>
              </div>
            </div>
          </div>
        </div>

        {/* today's session */}
        <Label style={{ marginBottom: 8, display: 'block' }}>▼ TODAY'S SESSION</Label>
        <div style={{
          background: 'var(--pk-card)',
          border: '1px solid var(--pk-acc-line)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{
                fontFamily: 'var(--pk-font-display)',
                fontSize: 22, fontWeight: 800,
                letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1,
              }}>PUSH DAY</div>
              <Label style={{ marginTop: 4, display: 'block' }}>CHEST · SHOULDERS · TRI</Label>
            </div>
            <span style={{
              fontFamily: 'var(--pk-font-mono)', fontSize: 11,
              color: 'var(--pk-acc)', letterSpacing: '0.12em',
            }}>+170 XP</span>
          </div>
          <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid var(--pk-border)' }}>
            <Stat v="5"   l="SETS"/>
            <Stat v="~45" l="MIN"/>
            <Stat v="4"   l="LIFTS"/>
          </div>
          <button
            onClick={() => navigate('workout')}
            style={{
              marginTop: 14, width: '100%',
              background: 'var(--pk-acc)', color: '#000',
              border: 'none', borderRadius: 8,
              padding: '14px 16px',
              fontFamily: 'var(--pk-font-display)', fontWeight: 700,
              fontSize: 15, letterSpacing: '0.16em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>▶ BEGIN QUEST</button>
        </div>

        {/* week grid */}
        <Label style={{ marginBottom: 8, display: 'block' }}>▼ THIS WEEK</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {WEEK.map((day, i) => (
            <div key={i} style={{
              aspectRatio: '1',
              background: day.s === 'today' ? 'var(--pk-acc-bg)' : 'var(--pk-card)',
              border: `1px solid ${
                day.s === 'today' ? 'var(--pk-acc)' :
                day.s === 'done'  ? 'var(--pk-border-2)' : 'var(--pk-border)'
              }`,
              borderRadius: 6,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 2,
            }}>
              <span style={{
                fontFamily: 'var(--pk-font-mono)', fontSize: 10,
                color: day.s === 'today' ? 'var(--pk-acc)' : 'var(--pk-muted)',
                letterSpacing: '0.1em',
              }}>{day.d}</span>
              <span style={{
                fontSize: 12,
                color: day.s === 'done'  ? 'var(--pk-acc)' :
                       day.s === 'today' ? 'var(--pk-acc)' :
                       day.s === 'rest'  ? 'var(--pk-muted-2)' : 'var(--pk-text-2)',
              }}>
                {day.s === 'done'  ? '✓' :
                 day.s === 'today' ? '●' :
                 day.s === 'rest'  ? '·' : '○'}
              </span>
            </div>
          ))}
        </div>

      </div>
      <TabBar active="home" navigate={navigate}/>
    </div>
  );
}
