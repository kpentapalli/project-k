# Project K — Phase 1 Build Spec

**Last updated:** 2026-04-21 (Phase 1 shipped)
**Status:** Live in production  
**Repo:** github.com/kpentapalli/project-k  
**Live:** kpentapalli.github.io/project-k (migrating to Vercel)

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

### RLS additions _(added post-launch)_
- `profiles`: added INSERT policy (`id = auth.uid()`) — needed because users created via Supabase dashboard don't trigger the auto-profile trigger
- `feedback`: insert for all authenticated users, select for admin only

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

## 9. Phase 2 Preview (not spec'd yet)

- Admin custom program builder (drag-and-drop week/day/exercise editor)
- Per-user progress charts (weight over time, volume over time)
- Custom domain + branding
- Email reminders (Supabase Edge Functions + Resend)
- Program completion flow (what happens when a user finishes their program)

---

## 10. Build Order (Phase 1)

1. **Scaffold** — Create React + Vite project, connect Supabase, deploy to Vercel
2. **Auth** — Login page, session management, route protection
3. **Profiles + Intake** — Schema, intake form, first-login redirect
4. **Program seed** — Migrate 6-Week Cut to Supabase JSON, write 3 more programs
5. **Admin dashboard** — User list, intake viewer, program assignment
6. **User dashboard** — Port existing dashboard to read from Supabase
7. **Program view + logging** — Port existing workout UI, wire to Supabase

---

*This spec covers Phase 1 only. Phase 2 will be spec'd after Phase 1 ships.*
