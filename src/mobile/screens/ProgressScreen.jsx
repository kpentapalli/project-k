import { HERO, Sprite } from '../lib/heroes';
import Label from '../components/Label';
import TabBar from '../components/TabBar';

const BARS = [40, 55, 38, 70, 50, 85, 60, 75, 45, 65, 90, 100, 72, 88];
const STATS = [
  { v: '47',  l: 'WORKOUTS',         acc: false },
  { v: '12',  l: 'PRS · ★',          acc: true  },
  { v: '38h', l: 'TIME UNDER LOAD',  acc: false },
  { v: '94%', l: 'PLAN ADHERENCE',   acc: true  },
];

export default function ProgressScreen({ hero, navigate }) {
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

        {/* heading */}
        <div style={{ marginBottom: 14 }}>
          <Label>PROGRESS · LAST 90 DAYS</Label>
          <h2 style={{
            fontFamily: 'var(--pk-font-display)',
            fontSize: 30, fontWeight: 800,
            letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1,
            marginTop: 6,
          }}>YOUR <span style={{ color: 'var(--pk-acc)' }}>RISE</span></h2>
        </div>

        {/* hero rank card */}
        <div style={{
          background: 'var(--pk-card)',
          border: '1px solid var(--pk-border)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 64, height: 64,
              background: h.deep,
              border: `2px solid ${h.cloth2}`,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sprite hero={hero} size={48}/>
            </div>
            <div style={{
              position: 'absolute', bottom: -6, right: -6,
              background: 'var(--pk-acc)', color: '#000',
              fontFamily: 'var(--pk-font-mono)', fontSize: 10, fontWeight: 700,
              padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em',
            }}>+3</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Label>RANK · LV 18</Label>
            <div style={{
              fontFamily: 'var(--pk-font-display)',
              fontSize: 18, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '-0.01em', marginTop: 2,
            }}>{h.rank.toUpperCase()}</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, marginTop: 6,
              fontFamily: 'var(--pk-font-mono)', fontSize: 11,
              color: 'var(--pk-text-2)', letterSpacing: '0.05em',
              flexWrap: 'wrap',
            }}>
              <span style={{ color: 'var(--pk-muted)' }}>FOOTMAN</span>
              <span>→</span>
              <span style={{ color: 'var(--pk-acc)' }}>{h.rank.toUpperCase()}</span>
              <span>→</span>
              <span style={{ color: 'var(--pk-muted-2)' }}>{hero === 'knight' ? 'KING' : 'EMPRESS'}</span>
            </div>
          </div>
        </div>

        {/* volume chart */}
        <div style={{
          background: 'var(--pk-card)',
          border: '1px solid var(--pk-border)',
          borderRadius: 12, padding: 16, marginBottom: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <Label>VOLUME · LB × WK</Label>
            <span style={{
              fontFamily: 'var(--pk-font-mono)', fontSize: 11,
              color: 'var(--pk-acc)', letterSpacing: '0.1em',
            }}>+18% ↑</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
            {BARS.map((v, i) => (
              <div key={i} style={{
                flex: 1, height: `${v}%`,
                background: i === BARS.length - 1 ? 'var(--pk-acc)' :
                            i === 11 ? h.trim : 'var(--pk-border-2)',
              }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Label>13 WK AGO</Label>
            <Label>NOW</Label>
          </div>
        </div>

        {/* stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {STATS.map(s => (
            <div key={s.l} style={{
              background: 'var(--pk-card)',
              border: '1px solid var(--pk-border)',
              borderRadius: 10, padding: '12px 14px',
            }}>
              <div style={{
                fontFamily: 'var(--pk-font-display)',
                fontSize: 26, fontWeight: 800,
                color: s.acc ? 'var(--pk-acc)' : 'var(--pk-text)',
                letterSpacing: '-0.01em', lineHeight: 1,
              }}>{s.v}</div>
              <Label style={{ marginTop: 4, display: 'block' }}>{s.l}</Label>
            </div>
          ))}
        </div>

        {/* recent PR */}
        <Label style={{ display: 'block', marginBottom: 8 }}>▼ RECENT PR</Label>
        <div style={{
          background: 'var(--pk-card)',
          border: '1px solid var(--pk-acc-line)',
          borderRadius: 10, padding: '12px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--pk-font-body)', fontSize: 14, fontWeight: 600 }}>
              BENCH PRESS · 1RM{' '}
              <span style={{ color: h.trim }}>★</span>
            </div>
            <Label style={{ marginTop: 2, display: 'block' }}>2 DAYS AGO</Label>
          </div>
          <div style={{
            fontFamily: 'var(--pk-font-display)',
            fontSize: 22, fontWeight: 800,
            color: 'var(--pk-acc)', letterSpacing: '-0.01em',
          }}>225 <span style={{ fontSize: 11, color: 'var(--pk-muted)' }}>LB</span></div>
        </div>

      </div>
      <TabBar active="progress" navigate={navigate}/>
    </div>
  );
}
