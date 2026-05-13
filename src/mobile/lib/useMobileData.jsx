import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { getReadinessState } from '../../lib/readiness';
import { musclesFromDay } from '../../lib/muscles';

const MUSCLES = ['Chest', 'Shoulders', 'Triceps', 'Back', 'Traps', 'Biceps', 'Legs', 'Calves', 'Abs'];
const PALETTE_SEQUENCE = ['crimson', 'jade', 'frost', 'obsidian', 'gold'];
const XP = { workout: 100, pr: 250, streak7: 500, program: 1000 };

function daysSince(dateStr) {
  if (!dateStr) return 999;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000));
}

export function calcStreak(logs) {
  if (!logs.length) return 0;
  const dates = [...new Set(logs.map(l => l.completed_at.slice(0, 10)))].sort().reverse();
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (const d of dates) {
    const logDate = new Date(d);
    const diff = Math.round((cursor - logDate) / 86400000);
    if (diff > 1) break;
    streak++;
    cursor = logDate;
  }
  return streak;
}

export function calcReadiness(workoutLogs) {
  const muscleLastTrained = {};
  for (const log of workoutLogs) {
    for (const muscle of (log.muscle_groups || [])) {
      if (!muscleLastTrained[muscle] || log.completed_at > muscleLastTrained[muscle]) {
        muscleLastTrained[muscle] = log.completed_at;
      }
    }
  }
  return MUSCLES.map(muscle => ({
    muscle,
    state: getReadinessState(daysSince(muscleLastTrained[muscle])),
  }));
}

export function calcLevel(xp) {
  const thresholds = [0, 500, 1500, 3500, 7000];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
  }
  const nextXp = thresholds[level] || null;
  return { level, nextXp };
}

export function getTodayWorkout(assignment, workoutLogs) {
  if (!assignment?.programs?.structure) return null;
  const structure = assignment.programs.structure;
  const weeks = structure.weeks || [];
  if (!weeks.length) return null;

  const startDate = new Date(assignment.start_date);
  const weekIdx = Math.min(
    Math.floor((Date.now() - startDate.getTime()) / (7 * 86400000)),
    weeks.length - 1
  );
  const week = weeks[Math.max(0, weekIdx)];
  if (!week?.days?.length) return null;

  const daysPerWeek = assignment.programs.days_per_week;
  const completedThisWeek = workoutLogs.filter(l => l.week_index === weekIdx);
  const completedDayIdxs = new Set(completedThisWeek.map(l => l.day_index));

  let dayIdx = 0;
  for (let i = 0; i < daysPerWeek; i++) {
    if (!completedDayIdxs.has(i)) { dayIdx = i; break; }
    dayIdx = Math.min(i + 1, daysPerWeek - 1);
  }

  const day = week.days[dayIdx];
  if (!day) return null;

  return {
    weekIdx,
    dayIdx,
    title: day.title || `Day ${dayIdx + 1}`,
    sub: day.sub || '',
    muscles: musclesFromDay(day),
    groups: day.groups || [],
    repNote: week.rep_note || null,
    swapOptions: structure.swap_options || {},
    programId: assignment.program_id,
    daysPerWeek,
    totalWeeks: weeks.length,
    isComplete: workoutLogs.some(l => l.week_index === weekIdx && l.day_index === dayIdx),
  };
}

export function useMobileData(userId) {
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [setLogs, setSetLogs] = useState([]);
  const [unlocks, setUnlocks] = useState([]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [assignRes, logsRes, unlocksRes] = await Promise.all([
      supabase
        .from('program_assignments')
        .select('*, programs(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false }),
      supabase
        .from('hero_unlocks')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: true }),
    ]);

    const assign = assignRes.data || null;
    setAssignment(assign);
    const logs = logsRes.data || [];
    setWorkoutLogs(logs);
    setUnlocks(unlocksRes.data || []);

    if (assign?.program_id) {
      const { data: sl } = await supabase
        .from('set_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('program_id', assign.program_id);
      setSetLogs(sl || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Get set log row for a specific exercise position
  function getSetLog(weekIdx, dayIdx, gi, ei) {
    return setLogs.find(s =>
      s.week_index === weekIdx && s.day_index === dayIdx &&
      s.group_index === gi && s.exercise_index === ei
    );
  }

  // Best weight ever for this exercise position (excluding current session)
  function getBestWeight(gi, ei, excludeWk, excludeDay) {
    let max = 0;
    for (const log of setLogs) {
      if (log.group_index !== gi || log.exercise_index !== ei) continue;
      if (log.week_index === excludeWk && log.day_index === excludeDay) continue;
      for (const w of (log.weights || [])) {
        if (w && w > max) max = w;
      }
    }
    return max;
  }

  // Most recent prior weights for pre-fill
  function getPriorWeights(gi, ei, excludeWk, excludeDay) {
    let best = null, bestKey = -1;
    for (const log of setLogs) {
      if (log.group_index !== gi || log.exercise_index !== ei) continue;
      if (log.week_index === excludeWk && log.day_index === excludeDay) continue;
      if (!log.weights?.some(w => w != null)) continue;
      const key = log.week_index * 100 + log.day_index;
      if (key > bestKey) { bestKey = key; best = log; }
    }
    return best?.weights || [];
  }

  async function toggleSet(weekIdx, dayIdx, gi, ei, si, totalSets, programId) {
    const existing = getSetLog(weekIdx, dayIdx, gi, ei);
    const bools = Array(totalSets).fill(false);
    if (existing?.set_states) existing.set_states.forEach((v, i) => { if (i < totalSets) bools[i] = !!v; });
    bools[si] = !bools[si];

    const now = new Date().toISOString();
    let updated;
    if (existing) {
      await supabase.from('set_logs').update({ set_states: bools, updated_at: now }).eq('id', existing.id);
      updated = { ...existing, set_states: bools };
      setSetLogs(prev => prev.map(s => s.id === existing.id ? updated : s));
    } else {
      const { data } = await supabase.from('set_logs').insert({
        user_id: userId, program_id: programId,
        week_index: weekIdx, day_index: dayIdx, group_index: gi, exercise_index: ei,
        set_states: bools, effort_states: Array(totalSets).fill(null), weights: Array(totalSets).fill(null),
      }).select().single();
      if (data) { updated = data; setSetLogs(prev => [...prev, data]); }
    }
    return updated;
  }

  async function saveWeights(weekIdx, dayIdx, gi, ei, totalSets, weights, programId) {
    const parsed = Array(totalSets).fill(null).map((_, i) => {
      const v = parseFloat(weights[i]);
      return isNaN(v) ? null : v;
    });
    const existing = getSetLog(weekIdx, dayIdx, gi, ei);
    const now = new Date().toISOString();
    if (existing) {
      await supabase.from('set_logs').update({ weights: parsed, updated_at: now }).eq('id', existing.id);
      setSetLogs(prev => prev.map(s => s.id === existing.id ? { ...s, weights: parsed } : s));
    } else {
      const { data } = await supabase.from('set_logs').insert({
        user_id: userId, program_id: programId,
        week_index: weekIdx, day_index: dayIdx, group_index: gi, exercise_index: ei,
        set_states: Array(totalSets).fill(false), effort_states: Array(totalSets).fill(null), weights: parsed,
      }).select().single();
      if (data) setSetLogs(prev => [...prev, data]);
    }
    return parsed;
  }

  // PR detection: returns true if currentMax > historical best for this position
  function detectPR(gi, ei, weekIdx, dayIdx, currentWeights) {
    const best = getBestWeight(gi, ei, weekIdx, dayIdx);
    if (best === 0) return false;
    const currentMax = Math.max(...(currentWeights || []).map(w => parseFloat(w) || 0));
    return currentMax > best;
  }

  async function awardPR(userId, workoutLogId) {
    const nextPalette = PALETTE_SEQUENCE[unlocks.length] || null;
    if (!nextPalette) return null;
    const { data } = await supabase.from('hero_unlocks').insert({
      user_id: userId,
      unlock_type: 'palette',
      unlock_key: nextPalette,
      triggered_by_log: workoutLogId || null,
    }).select().single();
    if (data) setUnlocks(prev => [...prev, data]);

    // Add XP — read current, increment, write back
    const { data: prof } = await supabase.from('profiles').select('hero_xp').eq('id', userId).single();
    if (prof != null) {
      await supabase.from('profiles').update({ hero_xp: (prof.hero_xp || 0) + XP.pr }).eq('id', userId);
    }
    return nextPalette;
  }

  async function finishWorkout(today, day) {
    const completedAt = new Date().toISOString();
    const { data } = await supabase.from('workout_logs').insert({
      user_id: userId,
      program_id: today.programId,
      week_index: today.weekIdx,
      day_index: today.dayIdx,
      day_title: day.title,
      muscle_groups: musclesFromDay(day),
      completed_at: completedAt,
    }).select().single();
    if (data) {
      setWorkoutLogs(prev => [data, ...prev]);
      // Add workout XP
      const { data: prof } = await supabase.from('profiles').select('hero_xp').eq('id', userId).single();
      if (prof != null) {
        await supabase.from('profiles').update({ hero_xp: (prof.hero_xp || 0) + XP.workout }).eq('id', userId);
      }
    }
    return data;
  }

  const todayWorkout = assignment ? getTodayWorkout(assignment, workoutLogs) : null;
  const streak = calcStreak(workoutLogs);
  const readiness = calcReadiness(workoutLogs);

  return {
    loading,
    assignment,
    workoutLogs,
    setLogs,
    unlocks,
    todayWorkout,
    streak,
    readiness,
    reload: load,
    getSetLog,
    getBestWeight,
    getPriorWeights,
    toggleSet,
    saveWeights,
    detectPR,
    awardPR,
    finishWorkout,
  };
}
