import { useState, useEffect } from 'react';
import { HERO, Sprite } from '../lib/heroes';
import Label from '../components/Label';
import TabBar from '../components/TabBar';

export default function WorkoutScreen({ hero, navigate, data, userId, onPR }) {
  const h = HERO[hero];
  const { todayWorkout, getSetLog, getBestWeight, getPriorWeights,
          toggleSet, saveWeights, detectPR, awardPR, finishWorkout } = data;

  const [weightInputs, setWeightInputs] = useState({});
  const [openCard, setOpenCard] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(todayWorkout?.isComplete || false);

  useEffect(() => {
    setFinished(todayWorkout?.isComplete || false);
  }, [todayWorkout?.isComplete]);

  if (!todayWorkout) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--pk-bg)', color: 'var(--pk-text)',
        fontFamily: 'var(--pk-font-body)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32,
        paddingBottom: 96 }}>
        <div style={{ fontFamily: 'var(--pk-font-display)', fontSize: 28, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '-0.01em', textAlign: 'center' }}>
          NO ACTIVE PROGRAM
        </div>
        <Label style={{ textAlign: 'center' }}>
          Assign a program from the web app to start training.
        </Label>
        <TabBar active="workout" navigate={navigate}/>
      </div>
    );
  }

  const { weekIdx, dayIdx, title, groups, repNote, swapOptions, programId, totalWeeks, daysPerWeek } = todayWorkout;

  function cardKey(gi, ei) { return `${gi}-${ei}`; }

  function getWeightArr(gi, ei) {
    const key = cardKey(gi, ei);
    if (weightInputs[key] !== undefined) return weightInputs[key];
    const saved = getSetLog(weekIdx, dayIdx, gi, ei);
    const prior = getPriorWeights(gi, ei, weekIdx, dayIdx);
    const totalSets = groups[gi]?.exercises[ei]?.sets || 3;
    const fallback = prior.find(w => w != null);
    return Array(totalSets).fill('').map((_, i) => {
      if (saved?.weights?.[i] != null) return String(saved.weights[i]);
      if (prior[i] != null) return String(prior[i]);
      if (fallback != null) return String(fallback);
      return '';
    });
  }

  function handleWeightChange(gi, ei, si, value) {
    const key = cardKey(gi, ei);
    const ex = groups[gi]?.exercises[ei];
    const totalSets = ex?.sets || 3;
    const arr = [...getWeightArr(gi, ei)];
    arr[si] = value;
    if (value !== '') {
      for (let i = si + 1; i < arr.length; i++) { if (!arr[i]) arr[i] = value; }
    }
    setWeightInputs(prev => ({ ...prev, [key]: arr }));
  }

  async function handleWeightBlur(gi, ei) {
    const ex = groups[gi]?.exercises[ei];
    if (!ex) return;
    const weights = getWeightArr(gi, ei);
    await saveWeights(weekIdx, dayIdx, gi, ei, ex.sets, weights, programId);
  }

  async function handleToggleSet(gi, ei, si) {
    const ex = groups[gi]?.exercises[ei];
    if (!ex) return;
    await toggleSet(weekIdx, dayIdx, gi, ei, si, ex.sets, programId);

    // PR check on set completion — compare current weights vs historical best
    const weights = getWeightArr(gi, ei);
    if (detectPR(gi, ei, weekIdx, dayIdx, weights)) {
      const palette = await awardPR(userId, null);
      if (palette) onPR(palette);
    }
  }

  async function handleFinish() {
    if (finished || finishing) return;
    setFinishing(true);
    const day = { title, groups, sub: '' };

    // Final PR sweep across all exercises
    let prsHit = [];
    for (let gi = 0; gi < groups.length; gi++) {
      for (let ei = 0; ei < (groups[gi]?.exercises?.length || 0); ei++) {
        const weights = getWeightArr(gi, ei);
        if (detectPR(gi, ei, weekIdx, dayIdx, weights)) prsHit.push({ gi, ei });
      }
    }

    const logEntry = await finishWorkout(todayWorkout, day);

    for (const { gi, ei } of prsHit) {
      const palette = await awardPR(userId, logEntry?.id);
      if (palette) { onPR(palette); break; } // show one at a time
    }

    setFinished(true);
    setFinishing(false);
  }

  // Aggregate progress
  let totalSets = 0, doneSets = 0;
  for (let gi = 0; gi < groups.length; gi++) {
    for (let ei = 0; ei < (groups[gi]?.exercises?.length || 0); ei++) {
      const ex = groups[gi].exercises[ei];
      const log = getSetLog(weekIdx, dayIdx, gi, ei);
      totalSets += ex.sets;
      doneSets += (log?.set_states || []).filter(Boolean).length;
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--pk-bg)', color: 'var(--pk-text)',
      fontFamily: 'var(--pk-font-body)', paddingTop: 60, paddingBottom: 96 }}>
      <div style={{ padding: '12px 20px 20px' }}>

        {/* top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button onClick={() => navigate('home')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--pk-font-mono)', fontSize: 20, color: 'var(--pk-muted)',
          }}>×</button>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center',
            fontFamily: 'var(--pk-font-mono)', fontSize: 11,
            letterSpacing: '0.12em', color: 'var(--pk-text-2)' }}>
            W{weekIdx + 1} · D{dayIdx + 1}
            <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
              {groups.map((_, i) => (
                <span key={i} style={{ width: 18, height: 4,
                  background: i < groups.length ? 'var(--pk-acc)' : 'var(--pk-border-2)' }}/>
              ))}
            </div>
          </div>
          <Sprite hero={hero} size={28}/>
        </div>

        {/* title */}
        <div style={{ marginBottom: 12 }}>
          <Label color={h.cloth2}>TODAY'S QUEST</Label>
          <h2 style={{ fontFamily: 'var(--pk-font-display)', fontSize: 30, fontWeight: 800,
            letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1.05,
            marginTop: 6, marginBottom: 6 }}>{title.toUpperCase()}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--pk-border)', overflow: 'hidden' }}>
              <div style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%`,
                height: '100%', background: 'var(--pk-acc)', transition: 'width 0.3s' }}/>
            </div>
            <Label>{doneSets}/{totalSets} SETS</Label>
          </div>
          {repNote && (
            <div style={{ marginTop: 8, padding: '8px 12px',
              background: 'var(--pk-card)', border: '1px solid var(--pk-border)',
              borderRadius: 6, fontFamily: 'var(--pk-font-mono)', fontSize: 11,
              color: 'var(--pk-text-2)', letterSpacing: '0.06em' }}
              dangerouslySetInnerHTML={{ __html: repNote }}/>
          )}
        </div>

        {/* exercise cards */}
        {groups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 16 }}>
            <Label style={{ display: 'block', marginBottom: 6 }}>{group.name}</Label>
            {(group.exercises || []).map((ex, ei) => {
              const key = cardKey(gi, ei);
              const isOpen = openCard === key;
              const log = getSetLog(weekIdx, dayIdx, gi, ei);
              const setStates = log?.set_states || Array(ex.sets).fill(false);
              const allDone = setStates.length === ex.sets && setStates.every(Boolean);
              const weights = getWeightArr(gi, ei);
              const bestPrior = getBestWeight(gi, ei, weekIdx, dayIdx);
              const currentMax = Math.max(...weights.map(w => parseFloat(w) || 0));
              const isPR = bestPrior > 0 && currentMax > bestPrior;

              return (
                <div key={ei} style={{
                  background: 'var(--pk-card)',
                  border: `1px solid ${allDone ? 'var(--pk-acc-line)' : 'var(--pk-border)'}`,
                  borderRadius: 10, marginBottom: 8, overflow: 'hidden',
                }}>
                  {/* card header */}
                  <div onClick={() => setOpenCard(isOpen ? null : key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}>
                    <div style={{ fontFamily: 'var(--pk-font-mono)', fontSize: 12,
                      color: allDone ? 'var(--pk-acc)' : 'var(--pk-muted)', minWidth: 24 }}>
                      {String(ei + 1).padStart(2, '0')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--pk-font-body)', fontSize: 14, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 8 }}>
                        {ex.name}
                        {isPR && <span style={{ color: h.trim, fontSize: 12 }}>★ PR</span>}
                      </div>
                      <Label style={{ marginTop: 2 }}>{ex.sets} × {ex.reps}</Label>
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {Array(ex.sets).fill(0).map((_, si) => (
                        <span key={si} style={{
                          width: 8, height: 8, borderRadius: 2,
                          background: setStates[si] ? 'var(--pk-acc)' : 'var(--pk-border-2)',
                        }}/>
                      ))}
                    </div>
                    <span style={{ color: 'var(--pk-muted)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--pk-border)', padding: '12px 14px' }}>
                      {ex.note && (
                        <div style={{ fontFamily: 'var(--pk-font-mono)', fontSize: 11,
                          color: 'var(--pk-text-2)', marginBottom: 10, letterSpacing: '0.06em' }}>
                          {ex.note}
                        </div>
                      )}

                      {/* set rows */}
                      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px',
                        gap: 0, marginBottom: 4, alignItems: 'center', paddingBottom: 6,
                        borderBottom: '1px solid var(--pk-border)' }}>
                        <Label>SET</Label><Label>WEIGHT</Label><Label>REPS</Label><Label>✓</Label>
                      </div>
                      {Array(ex.sets).fill(0).map((_, si) => {
                        const done = !!setStates[si];
                        return (
                          <div key={si} style={{
                            display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px',
                            alignItems: 'center', padding: '10px 0',
                            borderBottom: '1px solid var(--pk-border)',
                            background: !done && si === setStates.filter(Boolean).length ? 'var(--pk-acc-bg)' : 'transparent',
                            margin: '0 -14px', paddingLeft: 14, paddingRight: 14,
                          }}>
                            <span style={{ fontFamily: 'var(--pk-font-mono)', fontSize: 12,
                              color: done ? 'var(--pk-acc)' : 'var(--pk-muted)' }}>
                              {String(si + 1).padStart(2, '0')}
                            </span>
                            <input
                              type="number" min="0" step="2.5"
                              value={weights[si] ?? ''}
                              placeholder="lbs"
                              onChange={e => handleWeightChange(gi, ei, si, e.target.value)}
                              onBlur={() => handleWeightBlur(gi, ei)}
                              onClick={e => e.stopPropagation()}
                              style={{
                                background: 'transparent', border: 'none', outline: 'none',
                                fontFamily: 'var(--pk-font-display)', fontSize: 20, fontWeight: 800,
                                color: done ? 'var(--pk-text)' : 'var(--pk-acc)',
                                letterSpacing: '-0.01em', width: '80%',
                              }}
                            />
                            <span style={{ fontFamily: 'var(--pk-font-display)', fontSize: 18,
                              fontWeight: 800, color: done ? 'var(--pk-text)' : 'var(--pk-text-2)',
                              letterSpacing: '-0.01em' }}>{ex.reps}</span>
                            <button onClick={() => handleToggleSet(gi, ei, si)} style={{
                              width: 26, height: 26, borderRadius: 4, cursor: 'pointer',
                              border: `1px solid ${done ? 'var(--pk-acc)' : 'var(--pk-border-2)'}`,
                              background: done ? 'var(--pk-acc)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#000', fontSize: 13, fontWeight: 700,
                            }}>{done ? '✓' : ''}</button>
                          </div>
                        );
                      })}

                      {bestPrior > 0 && (
                        <div style={{ marginTop: 10, fontFamily: 'var(--pk-font-mono)', fontSize: 10,
                          color: isPR ? h.trim : 'var(--pk-muted)', letterSpacing: '0.08em' }}>
                          {isPR ? `★ NEW PR · PREV BEST ${bestPrior} LB` : `PREV BEST ${bestPrior} LB`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* finish */}
        <button onClick={handleFinish} disabled={finished || finishing}
          style={{
            width: '100%', marginTop: 8,
            background: finished ? 'var(--pk-card)' : 'var(--pk-acc)',
            color: finished ? 'var(--pk-acc)' : '#000',
            border: `1px solid ${finished ? 'var(--pk-acc-line)' : 'transparent'}`,
            borderRadius: 10, padding: '16px',
            fontFamily: 'var(--pk-font-display)', fontWeight: 800,
            fontSize: 16, letterSpacing: '0.16em', textTransform: 'uppercase',
            cursor: finished ? 'default' : 'pointer',
          }}>
          {finished ? '✓ QUEST COMPLETE' : finishing ? 'SAVING...' : 'FINISH QUEST'}
        </button>

      </div>
      <TabBar active="workout" navigate={navigate}/>
    </div>
  );
}
