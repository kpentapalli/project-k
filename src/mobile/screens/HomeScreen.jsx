import { HERO, Sprite } from '../lib/heroes';
import Label from '../components/Label';
import Stat from '../components/Stat';
import TabBar from '../components/TabBar';
import { calcLevel } from '../lib/useMobileData';

const READINESS_PRIORITY = {
  ready: 1, partial: 2, stale: 3, neglected: 4, detraining: 5, sore: 6, untrained: 7,
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildWeekGrid(workoutLogs, assignment) {
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const isToday = i === 0;
    const logged = workoutLogs.some(l => l.completed_at?.slice(0, 10) === iso);
    days.push({
      label: DAY_LABELS[d.getDay()],
      iso, isToday,
      status: logged ? 'done' : isToday ? 'today' : d < today ? 'rest' : 'plan',
    });
  }
  return days;
}

export default function HomeScreen({ hero, navigate, data, profile }) {
  const h = HERO[hero];
  const { assignment, workoutLogs, todayWorkout, streak, readiness } = data;
  const heroXp = profile?.hero_xp || 0;
  const { level, nextXp } = calcLevel(heroXp);

  const rankNames = {
    knight: ['Squire', 'Footman', 'Knight', 'Champion', 'King'],
    queen:  ['Page', 'Lady', 'Queen', 'High Queen', 'Empress'],
  };
  const rank = rankNames[hero]?.[level - 1] || h.rank;
  const nextRank = rankNames[hero]?.[level] || null;

  const weekGrid = buildWeekGrid(workoutLogs, assignment);

  const topMuscles = [...readiness]
    .sort((a, b) => (READINESS_PRIORITY[a.state.key] || 9) - (READINESS_PRIORITY[b.state.key] || 9))
    .slice(0, 6);

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--pk-bg)', color: 'var(--pk-text)',
      fontFamily: 'var(--pk-font-body)', paddingTop: 60, paddingBottom: 96 }}>
      <div style={{ padding: '12px 20px 20px' }}>

        {/* top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Label>{dateLabel}</Label>
          {streak > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              border: '1px solid var(--pk-acc-line)', background: 'var(--pk-acc-bg)',
              borderRadius: 4, fontFamily: 'var(--pk-font-mono)', fontSize: 11,
              letterSpacing: '0.12em', color: 'var(--pk-acc)',
            }}>
              <span style={{ width: 6, height: 6, background: 'var(--pk-acc)',
                borderRadius: '50%', boxShadow: '0 0 6px var(--pk-acc)' }}/>
              {streak} DAY STREAK
            </div>
          )}
        </div>

        {/* hero card */}
        <div style={{ background: 'var(--pk-card)', border: '1px solid var(--pk-border)',
          borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 72, height: 72, background: h.deep, border: `2px solid ${h.cloth2}`,
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sprite hero={hero} size={56}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Label color={h.cloth2}>{rank.toUpperCase()} · LV {level}</Label>
            <div style={{ fontFamily: 'var(--pk-font-display)', fontSize: 22, fontWeight: 800,
              letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1, marginTop: 4 }}>
              {h.title}
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--pk-border)', overflow: 'hidden' }}>
                <div style={{ width: nextXp ? `${Math.min((heroXp / nextXp) * 100, 100)}%` : '100%',
                  height: '100%', background: 'var(--pk-acc)' }}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4,
                fontFamily: 'var(--pk-font-mono)', fontSize: 10,
                letterSpacing: '0.10em', color: 'var(--pk-muted)' }}>
                <span>{heroXp.toLocaleString()} XP</span>
                {nextXp && nextRank
                  ? <span>{nextXp.toLocaleString()} TO {nextRank.toUpperCase()}</span>
                  : <span>MAX LEVEL</span>}
              </div>
            </div>
          </div>
        </div>

        {/* today's session */}
        <Label style={{ marginBottom: 8, display: 'block' }}>▼ TODAY'S SESSION</Label>
        {todayWorkout ? (
          <div style={{ background: 'var(--pk-card)', border: '1px solid var(--pk-acc-line)',
            borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: 'var(--pk-font-display)', fontSize: 22, fontWeight: 800,
                  letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1 }}>
                  {todayWorkout.title.toUpperCase()}
                </div>
                <Label style={{ marginTop: 4, display: 'block' }}>
                  {todayWorkout.muscles.slice(0, 3).join(' · ')}
                </Label>
              </div>
              <span style={{ fontFamily: 'var(--pk-font-mono)', fontSize: 11,
                color: 'var(--pk-acc)', letterSpacing: '0.12em' }}>+100 XP</span>
            </div>
            <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid var(--pk-border)' }}>
              <Stat v={`W${todayWorkout.weekIdx + 1}`} l="WEEK"/>
              <Stat v={`D${todayWorkout.dayIdx + 1}`} l="DAY"/>
              <Stat v={todayWorkout.groups.length} l="GROUPS"/>
            </div>
            {todayWorkout.isComplete ? (
              <div style={{ marginTop: 14, width: '100%', padding: '14px 16px', textAlign: 'center',
                background: 'var(--pk-card)', border: '1px solid var(--pk-acc-line)', borderRadius: 8,
                fontFamily: 'var(--pk-font-display)', fontWeight: 700, fontSize: 15,
                letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--pk-acc)' }}>
                ✓ QUEST COMPLETE
              </div>
            ) : (
              <button onClick={() => navigate('workout')} style={{
                marginTop: 14, width: '100%',
                background: 'var(--pk-acc)', color: '#000',
                border: 'none', borderRadius: 8, padding: '14px 16px',
                fontFamily: 'var(--pk-font-display)', fontWeight: 700,
                fontSize: 15, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer',
              }}>▶ BEGIN QUEST</button>
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--pk-card)', border: '1px solid var(--pk-border)',
            borderRadius: 12, padding: 20, marginBottom: 14, textAlign: 'center' }}>
            <Label>NO PROGRAM ASSIGNED</Label>
            <div style={{ fontFamily: 'var(--pk-font-body)', fontSize: 14, color: 'var(--pk-text-2)',
              marginTop: 8, lineHeight: 1.5 }}>
              Head to the web app to assign a program.
            </div>
          </div>
        )}

        {/* week grid */}
        <Label style={{ marginBottom: 8, display: 'block' }}>▼ THIS WEEK</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 14 }}>
          {weekGrid.map((day, i) => (
            <div key={i} style={{
              aspectRatio: '1',
              background: day.isToday ? 'var(--pk-acc-bg)' : 'var(--pk-card)',
              border: `1px solid ${
                day.isToday ? 'var(--pk-acc)' :
                day.status === 'done' ? 'var(--pk-border-2)' : 'var(--pk-border)'
              }`,
              borderRadius: 6,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            }}>
              <span style={{ fontFamily: 'var(--pk-font-mono)', fontSize: 10,
                color: day.isToday ? 'var(--pk-acc)' : 'var(--pk-muted)', letterSpacing: '0.1em' }}>
                {day.label}
              </span>
              <span style={{ fontSize: 12,
                color: day.status === 'done' ? 'var(--pk-acc)' :
                       day.isToday ? 'var(--pk-acc)' :
                       day.status === 'rest' ? 'var(--pk-muted-2)' : 'var(--pk-text-2)' }}>
                {day.status === 'done' ? '✓' : day.isToday ? '●' : day.status === 'rest' ? '·' : '○'}
              </span>
            </div>
          ))}
        </div>

        {/* readiness */}
        <Label style={{ marginBottom: 8, display: 'block' }}>▼ READINESS MAP</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {topMuscles.map(({ muscle, state }) => (
            <div key={muscle} style={{ background: 'var(--pk-card)', border: '1px solid var(--pk-border)',
              borderRadius: 8, padding: '8px 12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--pk-font-body)', fontSize: 13, fontWeight: 600 }}>{muscle}</span>
              <Label color={state.color}>{state.label.split(' — ')[0]}</Label>
            </div>
          ))}
        </div>

      </div>
      <TabBar active="home" navigate={navigate}/>
    </div>
  );
}
