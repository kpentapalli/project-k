import { useMemo } from 'react';
import { HERO, Sprite } from '../lib/heroes';
import Label from '../components/Label';
import TabBar from '../components/TabBar';
import { calcLevel } from '../lib/useMobileData';

const PALETTE_COLORS = {
  crimson:  '#dc2626', jade: '#10b981', frost: '#67e8f9',
  obsidian: '#6366f1', gold: '#f59e0b',
};

function buildVolumeChart(setLogs, numWeeks = 14) {
  const weeks = Array(numWeeks).fill(0);
  for (const log of setLogs) {
    const done = (log.set_states || []).filter(Boolean).length;
    if (done === 0) continue;
    const wk = log.week_index ?? 0;
    const idx = Math.min(wk, numWeeks - 1);
    weeks[idx] += done;
  }
  return weeks;
}

export default function ProgressScreen({ hero, navigate, data, profile }) {
  const h = HERO[hero];
  const { workoutLogs, setLogs, unlocks, assignment } = data;
  const heroXp = profile?.hero_xp || 0;
  const { level, nextXp } = calcLevel(heroXp);

  const rankNames = {
    knight: ['Squire', 'Footman', 'Knight', 'Champion', 'King'],
    queen:  ['Page', 'Lady', 'Queen', 'High Queen', 'Empress'],
  };
  const rank = rankNames[hero]?.[level - 1] || h.rank;
  const prevRank = rankNames[hero]?.[level - 2] || null;
  const nextRank = rankNames[hero]?.[level] || null;

  const totalWorkouts = workoutLogs.length;
  const totalPRs = unlocks.filter(u => u.unlock_type === 'palette').length;
  const mostRecentPR = unlocks.filter(u => u.unlock_type === 'palette').at(-1);
  const mostRecentLog = workoutLogs[0];

  const volumeBars = useMemo(() => buildVolumeChart(setLogs), [setLogs]);
  const maxVol = Math.max(...volumeBars, 1);

  // Week-over-week trend
  const lastTwo = volumeBars.slice(-2);
  const trend = lastTwo[1] > lastTwo[0] ? '↑' : lastTwo[1] < lastTwo[0] ? '↓' : '—';
  const trendPct = lastTwo[0] > 0
    ? Math.round(((lastTwo[1] - lastTwo[0]) / lastTwo[0]) * 100)
    : null;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--pk-bg)', color: 'var(--pk-text)',
      fontFamily: 'var(--pk-font-body)', paddingTop: 60, paddingBottom: 96 }}>
      <div style={{ padding: '12px 20px 20px' }}>

        {/* heading */}
        <div style={{ marginBottom: 14 }}>
          <Label>PROGRESS · LAST 90 DAYS</Label>
          <h2 style={{ fontFamily: 'var(--pk-font-display)', fontSize: 30, fontWeight: 800,
            letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1, marginTop: 6 }}>
            YOUR <span style={{ color: 'var(--pk-acc)' }}>RISE</span>
          </h2>
        </div>

        {/* hero rank card */}
        <div style={{ background: 'var(--pk-card)', border: '1px solid var(--pk-border)',
          borderRadius: 12, padding: 16, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 64, height: 64, background: h.deep, border: `2px solid ${h.cloth2}`,
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sprite hero={hero} size={48}/>
            </div>
            {level > 1 && (
              <div style={{ position: 'absolute', bottom: -6, right: -6,
                background: 'var(--pk-acc)', color: '#000',
                fontFamily: 'var(--pk-font-mono)', fontSize: 10, fontWeight: 700,
                padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>
                LV{level}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Label>RANK · LV {level}</Label>
            <div style={{ fontFamily: 'var(--pk-font-display)', fontSize: 18, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '-0.01em', marginTop: 2 }}>
              {rank.toUpperCase()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6,
              fontFamily: 'var(--pk-font-mono)', fontSize: 11,
              color: 'var(--pk-text-2)', letterSpacing: '0.05em', flexWrap: 'wrap' }}>
              {prevRank && <><span style={{ color: 'var(--pk-muted)' }}>{prevRank.toUpperCase()}</span><span>→</span></>}
              <span style={{ color: 'var(--pk-acc)' }}>{rank.toUpperCase()}</span>
              {nextRank && <><span>→</span><span style={{ color: 'var(--pk-muted-2)' }}>{nextRank.toUpperCase()}</span></>}
            </div>
          </div>
        </div>

        {/* volume chart */}
        <div style={{ background: 'var(--pk-card)', border: '1px solid var(--pk-border)',
          borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <Label>SETS LOGGED · BY WEEK</Label>
            {trendPct !== null && (
              <span style={{ fontFamily: 'var(--pk-font-mono)', fontSize: 11,
                color: trendPct >= 0 ? 'var(--pk-acc)' : 'var(--pk-danger)', letterSpacing: '0.1em' }}>
                {trendPct >= 0 ? '+' : ''}{trendPct}% {trend}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
            {volumeBars.map((v, i) => (
              <div key={i} style={{ flex: 1, height: `${maxVol > 0 ? (v / maxVol) * 100 : 0}%`, minHeight: v > 0 ? 3 : 0,
                background: i === volumeBars.length - 1 ? 'var(--pk-acc)' :
                            i === volumeBars.length - 2 ? h.trim : 'var(--pk-border-2)' }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Label>EARLIER</Label><Label>NOW</Label>
          </div>
        </div>

        {/* stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { v: totalWorkouts, l: 'WORKOUTS', acc: false },
            { v: totalPRs,      l: 'PRS · ★',  acc: true  },
            { v: `${heroXp.toLocaleString()}`, l: 'TOTAL XP', acc: false },
            { v: `LV${level}`,  l: 'HERO LEVEL', acc: true  },
          ].map(s => (
            <div key={s.l} style={{ background: 'var(--pk-card)', border: '1px solid var(--pk-border)',
              borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--pk-font-display)', fontSize: 26, fontWeight: 800,
                color: s.acc ? 'var(--pk-acc)' : 'var(--pk-text)',
                letterSpacing: '-0.01em', lineHeight: 1 }}>{s.v}</div>
              <Label style={{ marginTop: 4, display: 'block' }}>{s.l}</Label>
            </div>
          ))}
        </div>

        {/* palette unlocks */}
        {unlocks.length > 0 && (
          <>
            <Label style={{ display: 'block', marginBottom: 8 }}>▼ PALETTES UNLOCKED</Label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {unlocks.map(u => (
                <div key={u.id} style={{ width: 40, height: 40,
                  background: PALETTE_COLORS[u.unlock_key] || 'var(--pk-border-2)',
                  borderRadius: 6, border: '1px solid rgba(0,0,0,0.3)' }}
                  title={u.unlock_key}/>
              ))}
            </div>
          </>
        )}

        {/* most recent workout */}
        {mostRecentLog && (
          <>
            <Label style={{ display: 'block', marginBottom: 8 }}>▼ LAST SESSION</Label>
            <div style={{ background: 'var(--pk-card)', border: '1px solid var(--pk-border)',
              borderRadius: 10, padding: '12px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--pk-font-body)', fontSize: 14, fontWeight: 600 }}>
                  {mostRecentLog.day_title || `W${(mostRecentLog.week_index ?? 0) + 1} · D${(mostRecentLog.day_index ?? 0) + 1}`}
                </div>
                <Label style={{ marginTop: 2, display: 'block' }}>
                  {(mostRecentLog.muscle_groups || []).slice(0, 3).join(' · ')}
                </Label>
              </div>
              <Label>{new Date(mostRecentLog.completed_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric' }).toUpperCase()}</Label>
            </div>
          </>
        )}

      </div>
      <TabBar active="progress" navigate={navigate}/>
    </div>
  );
}
