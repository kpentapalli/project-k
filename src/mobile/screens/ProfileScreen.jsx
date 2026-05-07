import { HERO, Sprite } from '../lib/heroes';
import Label from '../components/Label';
import TabBar from '../components/TabBar';

export default function ProfileScreen({ hero, setHero, navigate }) {
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

        <Label style={{ marginBottom: 8, display: 'block' }}>HERO</Label>
        <h2 style={{
          fontFamily: 'var(--pk-font-display)',
          fontSize: 30, fontWeight: 800,
          letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1,
          marginBottom: 20,
        }}>{h.title}</h2>

        {/* hero display */}
        <div style={{
          background: 'var(--pk-card)',
          border: '1px solid var(--pk-border)',
          borderRadius: 12, padding: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginBottom: 20,
        }}>
          <div style={{
            width: 120, height: 120,
            background: h.deep,
            border: `3px solid ${h.cloth2}`,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Sprite hero={hero} size={96}/>
          </div>
          <div style={{
            fontFamily: 'var(--pk-font-display)',
            fontSize: 24, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '-0.01em',
          }}>{h.rank.toUpperCase()}</div>
          <Label style={{ marginTop: 6 }}>LEVEL 18 · 1,820 XP</Label>
          <div style={{ marginTop: 16, width: '100%' }}>
            <div style={{
              height: 6, borderRadius: 3,
              background: 'var(--pk-border)', overflow: 'hidden',
            }}>
              <div style={{ width: '64%', height: '100%', background: 'var(--pk-acc)' }}/>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: 6,
              fontFamily: 'var(--pk-font-mono)', fontSize: 10,
              letterSpacing: '0.10em', color: 'var(--pk-muted)',
            }}>
              <span>1,820 XP</span><span>2,850 TO {hero === 'knight' ? 'KING' : 'EMPRESS'}</span>
            </div>
          </div>
        </div>

        {/* switch hero */}
        <Label style={{ display: 'block', marginBottom: 8 }}>▼ SWITCH HERO</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {(['knight', 'queen']).map(id => {
            const opt = HERO[id];
            const active = id === hero;
            return (
              <button
                key={id}
                onClick={() => { setHero(id); localStorage.setItem('pk_hero', id); }}
                style={{
                  background: active ? 'var(--pk-acc-bg)' : 'var(--pk-card)',
                  border: `1.5px solid ${active ? 'var(--pk-acc)' : 'var(--pk-border)'}`,
                  borderRadius: 10, padding: '12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  cursor: active ? 'default' : 'pointer',
                }}
              >
                <div style={{
                  width: 52, height: 52,
                  background: opt.deep,
                  border: `2px solid ${opt.cloth2}`,
                  borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sprite hero={id} size={40}/>
                </div>
                <Label color={active ? 'var(--pk-acc)' : 'var(--pk-muted)'}>{opt.name.toUpperCase()}</Label>
              </button>
            );
          })}
        </div>

        {/* palette unlocks placeholder */}
        <Label style={{ display: 'block', marginBottom: 8 }}>▼ UNLOCKED PALETTES</Label>
        <div style={{
          background: 'var(--pk-card)',
          border: '1px solid var(--pk-border)',
          borderRadius: 10, padding: '14px 16px',
          fontFamily: 'var(--pk-font-mono)', fontSize: 11,
          color: 'var(--pk-muted)', letterSpacing: '0.06em',
          textAlign: 'center',
        }}>
          HIT A PR TO UNLOCK YOUR FIRST PALETTE
        </div>

      </div>
      <TabBar active="profile" navigate={navigate}/>
    </div>
  );
}
