# Project K — Phase 1 Build Spec

**Last updated:** 2026-04-23  
**Status:** Live in production  
**Repo:** github.com/kpentapalli/project-k  
**Live:** https://project-k-ten-mu.vercel.app

---

## 1. What We're Building

A private, invite-only fitness training OS. An admin (Kalyan) assigns structured programs to users, tracks their intake, and manages the program library. Users log workouts against their assigned program.

---

## 2. Decisions Already Made

| Decision | Choice | Reason |
|----------|--------|--------|
| Frontend framework | React + Vite | Reusable with future React Native mobile app |
| Backend / Auth / DB | Supabase | BaaS, no server to manage, free tier covers 100 users |
| Hosting | Vercel | Auto-deploy from GitHub, handles routing, free tier |
| Domain | Deferred | Use vercel.app URL for beta; buy domain before wider launch |
| User model | Invite-only | Admin manually creates accounts for family/friends |
| Program model | Fixed programs only (Phase 1) | Custom builder is Phase 2 |
| Privacy | Fully private, no leaderboard | Phase 2+ consideration |
| Max users (Phase 1) | ~10, ceiling 100 | Supabase free tier handles this easily |

---

## 3. User Roles

### Admin (Kalyan)
- Only one admin account
- Can view all users and their intake forms
- Can assign any program to any user
- Can set a program start date per user
- Accesses a dedicated `/admin` dashboard (route-protected)

### User (family / friends)
- Invited by admin, receives email to set password
- Completes intake form on first login
- Views only their own data
- Logs workouts against their assigned program
- Cannot see other users

---

## 4. Phase 1 Feature List & Acceptance Criteria

### F1 — Authentication
**What:** Email + password login via Supabase Auth. Invite-only: admin creates user in Supabase dashboard, user receives invite email to set password.

**Done when:**
- [ ] Login page is the app entry point (unauthenticated users cannot access any other route)
- [ ] Supabase session persists across page refreshes
- [ ] Logout clears session and redirects to login
- [ ] Admin route `/admin` is inaccessible to non-admin users (redirects to `/dashboard`)
- [ ] No self-registration UI exists

---

### F2 — Intake Form
**What:** A one-time form shown to new users after their first login, before they can access their dashboard. Results are stored in Supabase and visible to admin.

**Fields:**
| Field | Type | Required |
|-------|------|----------|
| Full name | Text | Yes |
| Fitness goal | Select: Cut / Bulk / Maintain / Athletic Performance | Yes |
| Experience level | Select: Beginner / Intermediate / Advanced | Yes |
| Days available per week | Select: 3 / 4 / 5 / 6 | Yes |
| Equipment access | Select: Full Gym / Home Gym / Minimal (bands/bodyweight) | Yes |
| Injuries or limitations | Textarea | No |
| Current weight (lbs) | Number | No |
| Target weight (lbs) | Number | No |

**Done when:**
- [ ] New users are redirected to `/intake` after first login
- [ ] Intake form cannot be skipped (blocks access to `/dashboard`)
- [ ] On submission, data is written to `profiles` table in Supabase
- [ ] After submission, user is redirected to `/dashboard` with a "Program being assigned" state
- [ ] Returning users who have completed intake are never shown the form again
- [ ] Admin can view all intake submissions in the admin dashboard

---

### F3 — Fixed Program Library
**What:** 4 pre-built programs stored in Supabase that admin can assign to users.

**Programs (Phase 1):**

| # | Name | Duration | Days/Week | Goal | Level |
|---|------|----------|-----------|------|-------|
| 1 | The 6-Week Cut | 6 weeks | 6 days | Cut | Intermediate |
| 2 | The 8-Week Bulk | 8 weeks | 5 days | Bulk | Intermediate |
| 3 | Beginner Foundation | 8 weeks | 3 days | General fitness | Beginner |
| 4 | Athletic Performance | 6 weeks | 5 days | Athletic / Strength | Advanced |

> Programs 2–4 need to be designed and written. Program 1 (6-Week Cut) is already built in the existing app and will be migrated to Supabase.

**Done when:**
- [ ] All 4 programs are seeded into the `programs` table
- [ ] Programs include full week/day/exercise structure
- [ ] Each exercise has: name, sets, reps, technique note, swap category
- [ ] Each swap category has 5–8 alternatives

---

### F4 — Admin Dashboard
**What:** A protected `/admin` route. Shows all users, their intake data, and lets admin assign a program + start date.

**Sections:**
1. **User List** — Name, email, intake status, assigned program, program start date
2. **User Detail** — Full intake form data for a selected user
3. **Assign Program** — Dropdown of programs + date picker → saves to `program_assignments`

**Done when:**
- [ ] `/admin` redirects to `/dashboard` if logged-in user is not admin
- [ ] User list displays all registered users with their status
- [ ] Admin can click any user to view their full intake form
- [ ] Admin can select a program and start date and assign it to a user
- [ ] Reassigning a program overwrites the previous assignment
- [ ] Admin can see which users have not yet completed intake

---

### F5 — User Dashboard
**What:** The home screen for logged-in users. Shows their program status, muscle heatmap, streak, and recent workouts. Mirrors the existing dashboard but pulls from Supabase instead of localStorage.

**Sections (same as existing app):**
- Stats bar: total workouts completed, current streak, current week
- Muscle heatmap: 9 muscle groups, days-since-last-trained
- Recent workouts: last 8 logged sessions
- If no program assigned yet: friendly holding state ("Your program is being set up — check back soon!")

**Done when:**
- [ ] Dashboard shows only the logged-in user's data
- [ ] All data reads from Supabase (`workout_logs`, `program_assignments`)
- [ ] Muscle heatmap calculates correctly from workout history
- [ ] Streak calculates correctly from workout history
- [ ] Unassigned users see the holding state instead of program content

---

### F6 — Program View & Workout Logging
**What:** The workout execution screen. User sees their assigned program's week/day structure, tracks sets, logs exercise swaps, and marks the day complete. Same UX as the existing app but per-user data in Supabase.

**Features:**
- Week tabs, day tabs (matching existing UI)
- Exercise cards with set tracking (tap to complete each set)
- 60-second rest timer (cardio acceleration)
- Exercise swap modal (alternatives per swap category)
- "Finish & Log Workout" button

**Done when:**
- [ ] Users can only view their assigned program (not the full library)
- [ ] Set completion state persists in Supabase (`set_logs`) — not localStorage
- [ ] Exercise swaps persist in Supabase (`exercise_swaps`) — not localStorage
- [ ] Logging a workout writes to `workout_logs` with user_id, program_id, week, day, timestamp
- [ ] Completed days are visually marked in day tabs
- [ ] Progress bar reflects live set completion

---

## 5. Data Schema (Supabase / PostgreSQL)

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | matches `auth.users.id` |
| full_name | text | |
| role | text | `'admin'` or `'user'` |
| goal | text | cut / bulk / maintain / athletic |
| experience | text | beginner / intermediate / advanced |
| days_per_week | int | |
| equipment | text | full_gym / home_gym / minimal |
| limitations | text | nullable |
| weight_current | numeric | nullable, lbs |
| weight_target | numeric | nullable, lbs |
| intake_completed | boolean | default false |
| created_at | timestamptz | |

### `programs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | e.g. "The 6-Week Cut" |
| description | text | |
| duration_weeks | int | |
| days_per_week | int | |
| goal_tag | text | cut / bulk / maintain / athletic |
| difficulty | text | beginner / intermediate / advanced |
| is_active | boolean | admin can retire programs |
| structure | jsonb | full week/day/exercise tree (see below) |
| created_at | timestamptz | |

**`structure` JSON shape:**
```json
{
  "weeks": [
    {
      "label": "Week 1",
      "rep_note": "Days 1–3: 9–11 reps. Days 4–6: 12–15 reps.",
      "days": [
        {
          "title": "Chest · Triceps · Abs",
          "sub": "Day 1 — Multijoint (Heavy)",
          "groups": [
            {
              "name": "CHEST",
              "exercises": [
                {
                  "name": "Bench Press",
                  "sets": 4,
                  "reps": "9–11",
                  "note": "Flat bar — full ROM, elbows at 45°",
                  "swap_category": "chest_multi"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "swap_options": {
    "chest_multi": [
      { "name": "Neutral-Grip DB Press", "note": "Palms facing in..." },
      { "name": "Machine Chest Press", "note": "..." }
    ]
  }
}
```

### `program_assignments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| program_id | uuid (FK → programs) | |
| start_date | date | |
| assigned_by | uuid (FK → profiles) | admin's user id |
| assigned_at | timestamptz | |

### `workout_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| program_id | uuid (FK → programs) | |
| week_index | int | 0-based |
| day_index | int | 0-based |
| completed_at | timestamptz | |
| muscle_groups | text[] | e.g. ["Chest","Triceps","Abs"] |

### `set_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| program_id | uuid (FK → programs) | |
| week_index | int | |
| day_index | int | |
| group_index | int | |
| exercise_index | int | |
| set_states | boolean[] | e.g. [true, true, false, false] |
| updated_at | timestamptz | |

### `exercise_swaps`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| program_id | uuid (FK → programs) | |
| week_index | int | |
| day_index | int | |
| group_index | int | |
| exercise_index | int | |
| swap_name | text | chosen alternative name |

### `feedback` _(added post-launch)_
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles, nullable) | null if user deleted |
| user_name | text | snapshot of name at submission time |
| message | text | |
| rating | int | 1–5 (😤😐🙂😄🔥), nullable |
| created_at | timestamptz | |

### `access_requests` _(added Phase 2)_
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| name | text | |
| email | text | |
| message | text | nullable |
| status | text | pending / approved / rejected |
| created_at | timestamptz | |

### `weight_logs` _(added Phase 2)_
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid (FK → profiles) | |
| weight | numeric | lbs |
| body_fat | numeric | %, nullable |
| logged_at | date | back-datable |
| created_at | timestamptz | |

### RLS additions _(added post-launch)_
- `profiles`: added INSERT policy (`id = auth.uid()`) — needed because users created via Supabase dashboard don't trigger the auto-profile trigger
- `feedback`: insert for all authenticated users, select for admin only
- `access_requests`: anon + authenticated INSERT, admin SELECT/UPDATE
- `weight_logs`: users manage own rows, admin reads all

### DB trigger _(added Phase 2)_
- `auto_assign_program_on_intake()` — SECURITY DEFINER function, fires `AFTER UPDATE ON profiles` when `intake_completed` flips true. Inserts into `program_assignments` with mapped program. See `supabase/schema.sql` for full SQL.

---

## 6. Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Redirects to `/login` if unauthenticated, `/dashboard` if authenticated |
| `/login` | Public | Email + password login form + forgot password link |
| `/reset-password` | Public | Set new password after clicking email reset link |
| `/intake` | Authenticated (intake not done, non-admin) | First-login intake form |
| `/dashboard` | Authenticated | User dashboard |
| `/program` | Authenticated | Active program view + workout logging |
| `/admin` | Admin only | User list + program assignment + feedback viewer |

---

## 7. Design System (carry forward from existing app)

Keep the existing visual identity:
- Dark theme (`#080809` background)
- Lime green accent (`#39ff8a`)
- Bebas Neue + Syne + JetBrains Mono fonts
- CSS variable system (copy from existing `index.html`)
- Card-based layout, mobile-first

New components to design:
- Login page
- Intake form (multi-field, clean, single page)
- Admin user list table
- Program assignment UI (modal or inline)
- "No program assigned" holding state on dashboard

---

## 7b. Post-Launch Additions (shipped same session)

- **Feedback button** — floating 💬 button on Dashboard and Program pages. Modal with emoji rating (1–5) + free text. Stored in `feedback` table.
- **Admin feedback tab** — Admin dashboard has Users / Feedback tabs. Feedback shown with name, date, rating, message.
- **Forgot password flow** — "Forgot password?" link on login page. Supabase sends reset email. `/reset-password` page handles new password entry.
- **Supabase URL config** — Site URL set to Vercel app URL to prevent auth emails linking to localhost.

---

## 8. Out of Scope (Phase 1)

These are explicitly deferred to Phase 2+:

- Custom program builder for admin
- Progress charts / analytics
- Push notifications / reminders
- Leaderboard or social features
- Mobile app (React Native)
- Custom domain
- Stripe / payments
- In-app messaging (admin ↔ user)
- User-initiated program changes

---

## 9. Phase 2 — Shipped

### P1 — Date-accurate workout logging ✅
**Problem:** `completed_at` was always stamped `now()`, making the muscle heatmap and streak inaccurate and preventing back-dating.  
**What shipped:**
- "Finish & Log Workout" now opens a date picker modal (defaults to today, blocks future dates)
- Modal shows workout context (week, day, title) and a hint about back-dating
- Dates stored as noon UTC (`T12:00:00Z`) to keep `.slice(0, 10)` timezone-safe everywhere
- Enables historical logging: navigate to any past week/day and log it with the actual date

**Files changed:** `src/pages/Program.jsx`, `src/index.css`

---

### P2 — Self-service signup with admin approval ✅
**Problem:** Admin had to manually create users in the Supabase dashboard, hitting rate limits and not scaling.  
**What shipped:**
- `/request-access` — public page (no auth required): name, email, optional "why I want in" note
- `access_requests` table in Supabase (status: pending/approved/rejected, RLS: anon INSERT, admin SELECT/UPDATE)
- Admin dashboard **Requests tab** — shows pending count badge, each request has Approve/Reject buttons
- `/api/invite` — Vercel serverless function: verifies caller is admin, calls `supabase.auth.admin.inviteUserByEmail()` with service role key (server-side only, never exposed to browser), marks request approved
- Login page links to `/request-access`

**New route:** `/request-access` (public)  
**New files:** `api/invite.js`, `src/pages/RequestAccess.jsx`  
**Files changed:** `src/App.jsx`, `src/pages/Admin.jsx`, `src/pages/Login.jsx`, `supabase/schema.sql`, `vercel.json`

**Required Vercel env var:** `SUPABASE_SERVICE_ROLE_KEY`

---

### P3 — Weight tracking ✅ (revised in P8)
**What shipped:**
- `weight_logs` table: `weight` (lbs), `body_fat` (%, nullable), `logged_at` (date, back-datable)
- `WeightSection` component: log weight modal + stats row (current / change / BF% / target)
- Originally two separate `MiniLineChart` SVGs; replaced by `CombinedBodyChart` in P8

**Files changed:** `src/pages/Dashboard.jsx`, `src/components/WeightSection.jsx`, `src/index.css`, `supabase/schema.sql`

---

### P4 — Muscle recovery bars ✅ (revised in P8)
**What shipped:** 3-color recovery bars on muscle grid cards (red/orange/green based on 3-day recovery window). Replaced by 7-state readiness model in P8.

---

### P5 — Workout frequency chart ✅ (removed in P8)
**What shipped:** 8-week CSS bar chart. Removed in P8 dashboard revamp — not adding enough value alongside the muscle status data.

---

### P6 — Auto-assign program on intake ✅
**Problem:** Users completed intake but had to wait for admin to manually assign a program before they could start training.  
**What shipped:**
- `auto_assign_program_on_intake()` — `SECURITY DEFINER` Postgres function that fires via `after_intake_completed` trigger on `profiles`
- Fires only when `intake_completed` flips `false → true` and no assignment already exists
- Mapping logic: `experience = beginner` → Beginner Foundation; `goal = athletic_performance + ≥5 days` → Athletic Performance; `goal = cut + ≥6 days` → The 6-Week Cut; `goal = bulk + ≥5 days` → The 8-Week Bulk; all other combos → Beginner Foundation
- `assigned_by = NULL` marks it as a system assignment (admin override still works normally)
- Hard fallback: if mapped program not found, assigns any active program

**Files changed:** `supabase/schema.sql`, `src/pages/Dashboard.jsx`  
**Action required:** Run the trigger SQL block from `supabase/schema.sql` in Supabase SQL Editor to activate.

---

### P7 — Exercise YouTube search + About page + first-start intros ✅
**What shipped:**
- **YouTube link** — `▶` button on every exercise card opens `youtube.com/results?search_query={exercise} exercise form tutorial` in a new tab. Red hover to distinguish from swap button.
- **`/about` page** — overall training philosophy (3 pillars: progressive overload, compound first, recovery is training) + per-program cards with hand-written taglines. Accessible via "About" in TopBar.
- **First-start program intro** — full-screen overlay on first visit to `/program` per program. Tracked in `localStorage` (`pk_intro_{programId}`). Dismisses permanently, accessible after via collapsible "About this program ▼" toggle in program header.

**New files:** `src/pages/About.jsx`  
**Files changed:** `src/App.jsx`, `src/components/TopBar.jsx`, `src/pages/Program.jsx`, `src/index.css`

---

### P8 — Dashboard revamp ✅
**What shipped:**
- **Combined Weight & BF% chart** — single dual-axis SVG (`CombinedBodyChart`). Weight (green) on left Y-axis, BF% (orange) on right Y-axis. Shared date X-axis across both series. Sparse BF% points render as dots without breaking the weight line. Goal weight dashed line preserved.
- **Muscle Status 9-grid** — replaced Muscle Recovery + Muscle Training History + Workout Frequency with one section. Bar length = all-time sessions per muscle. Bar and label color = 7-state readiness (see `src/lib/readiness.js`). Cards sorted by training priority (Ready first, Detraining/Neglected surfaced). Grid layout preserved.
- **`src/lib/readiness.js`** — `READINESS_STATES` config array + `getReadinessState(days)` exported for future legend/tooltip. 7 states: untrained (red) → sore (red) → partial (orange) → ready (green) → stale (orange) → neglected (light blue #93c5fd) → detraining (blue #3b82f6). Piecewise time-decay: ramp 0→3d, plateau 3→7d, decay 7→17d.
- **Recent Workouts** — collapsed to 1 entry by default; "Show N more" expands to 8.
- **Removed:** Workout Frequency 8-week bar chart.

**Files changed:** `src/pages/Dashboard.jsx`, `src/components/WeightSection.jsx`, `src/index.css`  
**New files:** `src/lib/readiness.js`

---

### P9 — Three new programs seeded ✅
**What shipped:**
- **Push / Pull / Legs** — 6d/6wk, intermediate, `goal_tag: 'bulk'`. Two distinct Push, Pull, and Leg sessions (A/B variants hit different angles). Accumulation phase (weeks 1–3, 8–12 reps) → Intensification (weeks 4–6, 5–8 reps).
- **Upper / Lower Classic** — 4d/8wk, intermediate, `goal_tag: 'bulk'`. Upper Heavy / Lower Heavy / Upper Volume / Lower Volume rotation. Rep waves downward across 8 weeks: 10–12 → 8–10 → 6–8 → 4–6.
- **Rotating Split** — 6d/6wk (repeatable indefinitely), beginner, `goal_tag: 'maintain'`. 5-day rotation (Push / Pull / Legs / Upper / Full Body) + Day 6 mobility. No fixed rest day; small weight bumps at weeks 3 & 5. Designed to run continuously — complete the 6-week block and repeat.
- **Auto-assign trigger extended** — `auto_assign_program_on_intake()` now maps bulk + 6 days → PPL, bulk + 4 days → Upper/Lower, maintain + ≥5 days → Rotating Split.
- **About page** — 3 new program cards added (`PROGRAM_INTROS` in `About.jsx`) with taglines and philosophy blurbs.

**Files changed:** `supabase/schema.sql` (auto-assign trigger), `src/pages/About.jsx`  
**New files:** `scripts/seed-programs-v2.js`, `scripts/generate-seed-sql.js`, `supabase/seed-programs-v2.sql`

---

### P10 — Program switching + completion flow ✅
**What shipped:**
- **DB schema** — `status` column on `program_assignments` (`active` / `completed`, default `active`). Dropped `unique(user_id)` → replaced with partial unique index `program_assignments_one_active_per_user` on `(user_id) where status = 'active'`. Users now keep full program history; only one can be active.
- **RLS** — added "users update own assignment status" + "users insert own assignment" policies so the client can self-switch and self-complete without admin intervention.
- **Dashboard Program card** — shows current active program with a **Switch** button. When no active program, renders a dashed-border empty-state CTA ("Ready for your next block? → Choose Program") that opens the same switcher modal.
- **`ProgramSwitcher` modal** (`src/components/ProgramSwitcher.jsx`) — picks from all active programs, previews description, confirms with clear "your logs are preserved" copy. On confirm: marks current `active` → `completed`, inserts new `active` row. Handles both the switch path (with `currentAssignment`) and the fresh-choice path (no current assignment).
- **Program page "Mark as Complete"** — ghost button in the program hero. Confirms, updates status, shows a fade-in success toast, auto-reloads after 1.5s.
- **Admin assign** — changed from `upsert(onConflict: user_id)` to mark-current-complete + insert-new-active to work with the partial unique index.
- **Auto-assign guard** — trigger now only skips when user has an *active* assignment (previously skipped on any historical row).

**Files changed:** `supabase/schema.sql`, `src/pages/Dashboard.jsx`, `src/pages/Program.jsx`, `src/pages/Admin.jsx`, `src/index.css`  
**New files:** `src/components/ProgramSwitcher.jsx`

---

## 10. Phase 2 — Remaining Roadmap (priority order, as of 2026-04-24)

| # | Feature | Size | Notes |
|---|---------|------|-------|
| 1 | Program retrospective screen | ~2 hr | On program completion: X days trained, muscles hit, weight change. |
| 2 | Effort-mode logging (easy/medium/hard per set) | 1 day | Needs design pass first. RPE-lite, lower friction than weight logging. |
| 3 | Admin program builder | 1–2 days | After #1–2 surface what fields it needs. |
| 4 | Optional weight-per-set + PRs | 1 day | Advanced users only, fully optional input. |

### Phase 3 (deferred)
| # | Feature | Notes |
|---|---------|-------|
| 1 | Custom domain | projectk.fit or similar |
| 2 | Email reminders | "Haven't logged in 3 days" — Supabase Edge Functions + Resend |
| 3 | Exercise media | Per-exercise photos in Supabase Storage |
| 4 | Diet / nutrition tracking | Separate product surface |
| 5 | Mobile app | React Native, after web is solid |

### Backlog (parked — not scheduled)
| Feature | Why parked |
|---------|-----------|
| "Ready to train now" callout | Needs program customization / dynamic program selection |
| Weight goal progress bar in stats row | 10-min add — queue when doing next weight work |
| Muscle grouping (Push/Pull/Legs) | Too advanced for target users |
| Program-aware muscle priority | Waits for program flexibility feature |
| Admin-built custom programs per client | Needs admin program builder UX — revisit after #5 (admin program builder) is scoped |

### Exercise Media — Design Notes (when ready)
- **Quick version:** SVG icon per muscle group inline on exercise cards (low effort)
- **Full version:** 3-photo sequence per exercise (start → mid → end) stored in Supabase Storage
- JSON shape extension: `{ name, sets, reps, note, swap_category, media: { icon: "chest_press", photos: ["start.jpg", "mid.jpg", "end.jpg"] } }`
- Images: licensed library or custom-shot — decision needed before building

---

## 11. Build Order (Phase 1)

1. **Scaffold** — Create React + Vite project, connect Supabase, deploy to Vercel
2. **Auth** — Login page, session management, route protection
3. **Profiles + Intake** — Schema, intake form, first-login redirect
4. **Program seed** — Migrate 6-Week Cut to Supabase JSON, write 3 more programs
5. **Admin dashboard** — User list, intake viewer, program assignment
6. **User dashboard** — Port existing dashboard to read from Supabase
7. **Program view + logging** — Port existing workout UI, wire to Supabase
