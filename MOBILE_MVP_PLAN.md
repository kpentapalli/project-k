# Project K Mobile MVP — Capacitor + Mascot RPG Hedge

> **Mode:** 4–5 week validation hedge before committing to the 12-week native Swift build in [MOBILE_PRD.md](./MOBILE_PRD.md).
> **Status:** Plan. Not started.

## 1. Purpose

A plain workout tracker isn't differentiated. The Mascot RPG concept ([brief](../mobile-previews/mascot-rpg.md)) might be — but committing 12 weeks of native Swift work on a hunch is a bad hedge.

This plan ships the **smallest possible Mascot RPG mobile app** via Capacitor in ~2 weeks, puts it in front of 5–10 real users for 2–3 weeks, and uses the result to make the native commit decision with real signal instead of intuition.

The Capacitor build is **disposable**. We are buying information, not infrastructure.

## 2. Decision Gate (write-it-down-now)

After the user trial, the native Swift build proceeds **only if at least 2 of these 3 fire**:

1. **Engagement:** ≥60% of testers open the app on 4+ days/week during the trial window.
2. **Qualitative novelty:** ≥3 testers, unprompted, mention the mascot, sprite, evolution, or PR reward in feedback (Slack DM, form, or call).
3. **PR moment lands:** ≥5 PR unlocks logged across the cohort, AND ≥2 testers comment positively on the reward feel.

**If gate fails:** stop. Do not start native. Reassess concept (different theme, no theme, different product entirely).

**If gate passes:** start the native Swift v1 per [MOBILE_PRD.md](./MOBILE_PRD.md). Capacitor app gets archived, not maintained.

**Anti-fudge clause:** these criteria are locked before the trial starts. "Lukewarm but maybe" = fail. The whole point of a hedge is to be willing to walk away.

## 3. Scope

### 3.1 In

- Capacitor wrapper around a mobile-tuned subset of the existing React app
- iOS only (TestFlight distribution)
- Mascot RPG visual theme — single concept, no toggle
- **Onboarding:** Knight or Queen archetype selection + optional hero name
- **Home:** today's workout, current hero sprite + level, streak, readiness map
- **Workout logging:** sets, weight, effort (E/M/H), rest timer, exercise swap, finish
- **Progress / Hero Journey:** evolution row, recent workouts, weight trend, PR list
- **PR detection → cosmetic palette swap** (the headline novelty moment)
- Bottom tab nav (Home / Workout / Progress / Profile)
- Existing Supabase auth (email + magic link) — reused as-is
- Existing program assignment + readiness logic — reused from [src/lib/](src/lib/)

### 3.2 Out (deliberately)

- watchOS, HealthKit, voice — all native-only, deferred to v1
- Sign in with Apple — defer; existing email auth is fine for a 5–10 person trial
- Push notifications, Live Activities, haptics polish
- Android (Capacitor supports it but doubles QA surface)
- Offline mode / local-first sync — online-only is acceptable for trial
- Multiple themes — Mascot RPG only
- Heavy animation polish — sprite reactions yes, particle effects no
- Admin / program builder — stays on the existing webapp
- Accessibility audit beyond the basics (WCAG full pass deferred to native)

## 4. Stack

| Piece | Choice | Notes |
|---|---|---|
| App shell | Capacitor 6 (iOS) | Wraps the Vite-built React bundle |
| Framework | Existing React 18 + Vite + react-router | Reuse [src/](src/) |
| Mobile entry | New route prefix `/m/*` OR new Vite entry | Decide in week 1 — see §5 |
| Theme system | New `MascotTheme` module under `src/themes/mascot/` | Tokens, components, label map |
| Sprites | Inline SVG (already prototyped in [mascot-rpg.html](../mobile-previews/mascot-rpg.html)) | `image-rendering: pixelated` |
| Backend | Existing Supabase + Vercel functions | Zero changes |
| Auth | Existing email + magic link | Zero changes |
| Distribution | TestFlight | Apple Developer account required (already needed for native) |

**Architecture rule:** the mobile React code lives under `src/mobile/` (or similar) and shares `src/lib/` (readiness, muscles, supabase client) with the existing webapp. Do not fork business logic.

## 5. Build Phases (~2 weeks)

| Phase | Work | Duration |
|---|---|---|
| **0 — Setup** | Capacitor install, iOS target, Apple dev signing, build pipeline. Decide mobile route strategy (subroute vs separate entry). Theme tokens module. | 1–2 days |
| **1 — Onboarding + Home** | Hero selection screen (Knight/Queen, name input, persist to `profiles`). Mobile Home: today's workout card, sprite + level, streak, readiness grid. | 2–3 days |
| **2 — Workout logging** | Mobile workout view: set chips, weight input, effort cycling, rest timer, exercise swap, finish. Wire to existing `set_logs` / `workout_logs` writes. | 3–4 days |
| **3 — PR detection + cosmetic reward** | PR detection logic (compare new lift to historical max). On PR: trigger palette-swap moment with sprite reaction. Persist unlocked palettes to a new `hero_unlocks` table. | 2 days |
| **4 — Progress screen** | Evolution row (level + sprite history), recent workouts list, weight chart, unlocked palettes display. | 2 days |
| **5 — TestFlight + onboarding doc** | App icon, splash, Capacitor build, TestFlight upload, 1-page tester guide. Recruit 5–10 testers. | 1–2 days |

**Total:** ~10 working days. Buffer to 14 calendar days.

## 6. Schema Changes

Minimal. Two additions:

```sql
-- Hero archetype + name on profile
alter table profiles add column hero_archetype text check (hero_archetype in ('knight', 'queen'));
alter table profiles add column hero_name text;
alter table profiles add column hero_xp integer default 0;

-- Cosmetic unlocks (palette swaps from PRs)
create table hero_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  unlock_type text not null,  -- 'palette' | 'accessory' | 'frame'
  unlock_key text not null,   -- 'crimson' | 'jade' | etc.
  unlocked_at timestamptz default now(),
  triggered_by_log_id uuid references workout_logs
);
```

Both are additive and safe to leave in place even if the hedge fails.

## 7. XP / Progression Rules (v0)

Keep dead simple. Tune later if hedge passes.

| Action | XP |
|---|---|
| Complete a workout | 100 |
| Hit a PR | 250 |
| Complete a program | 1000 |
| 7-day streak | 500 |

| Level | XP threshold | Knight title | Queen title |
|---|---|---|---|
| 1 | 0 | Squire | Page |
| 2 | 500 | Footman | Lady |
| 3 | 1500 | Knight | Queen |
| 4 | 3500 | Champion | High Queen |
| 5 | 7000 | King | Empress |

PR-triggered palette unlocks (in order of first PR, second PR, etc.): crimson, jade, frost, obsidian, gold.

These numbers are **placeholders for the trial**. The point is to make sure testers experience at least one level-up and one PR unlock during the 2–3 week window, not to design a balanced economy.

## 8. Tester Trial

- **Cohort:** 5–10 people. Mix of strength-training regulars and casual lifters. Avoid friends-who-will-just-be-nice — bias toward people who'll churn if it sucks.
- **Window:** 2–3 weeks of active use.
- **Instrumentation:** lightweight. Daily active sessions, workouts logged, PRs hit, palette unlocks. Plus a short feedback form at week 1 and week 3.
- **Cadence:** check in twice — once at day 3 (smoke test, fix obvious bugs), once at the end (decision-gate review).

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Capacitor feels janky and testers blame the *concept* not the *wrapper* | Be explicit with testers in the onboarding doc: "this is a UX prototype, native version comes later." Watch qualitative feedback for stack-vs-concept signal. |
| 2 weeks balloons to 4 | Hard cut: any phase that runs over by 50% gets descoped, not extended. Better to ship fewer features clean than all features broken. |
| Trial is inconclusive | Decision gate forces a call. If 1 of 3 criteria fires, treat as fail and walk. The cost of a false-positive 12-week commit is much higher than the cost of a false-negative walk. |
| Testers can't get TestFlight working | Have a backup web URL (PWA install) for the same build. Capacitor + PWA share the React bundle. |
| The novelty *is* there but lives in moments Capacitor can't deliver well (haptics, sprite animation feel) | Trial answers the bigger question (is the *direction* right). If yes, native v1 delivers the moments properly. |

## 10. What This Plan Is Not

- Not a spec for the native app. That's [MOBILE_PRD.md](./MOBILE_PRD.md), which proceeds unchanged if the gate passes.
- Not the production mobile app. The Capacitor build is throwaway.
- Not a feature-complete v1. Watch, HealthKit, voice, offline, Sign in with Apple, polish, accessibility — all deferred to native.
- Not a commitment to Capacitor as a long-term path. If the gate passes, native starts immediately and Capacitor is archived.

## 11. Next Concrete Step

1. Confirm this plan.
2. Commit `mobile-previews/` and this file to the repo.
3. Decide mobile route strategy (subroute vs separate entry) — 1 hour design call with self.
4. Start Phase 0 (Capacitor install + iOS target).
