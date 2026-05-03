# Project K — Mobile App PRD (Lite)

> **Status:** Planning · Pre-build
> **Last updated:** 2026-04-29
> **Owner:** Kalyan
> **Mode:** Strategic direction + native iOS build path. Not engineering spec.

---

## 1. Vision

Build **Project K iOS** as a native Swift/SwiftUI app for iPhone + Apple Watch, shipping to the App Store as a plain workout app. Sport-specific content layers in v1.1+. The existing web app continues as the admin interface (program builder, user management, signup codes) and remains alive for legacy/web-only users.

Two strategic shifts shape the long-term direction:

1. **Sport-specific positioning** (post-v1) instead of generic strength training — content track, not platform track
2. **Completion-based pacing** instead of calendar-based programs — users finish when they finish

**Native Swift over Capacitor** because the eventual roadmap is heavily Apple-ecosystem (Watch live workout sessions, HealthKit, voice on watch). A webview wrapper would force a native watchOS sibling regardless, and we'd end up maintaining two paradigms. Native commits to one paradigm and unlocks the whole Apple platform cleanly.

The tradeoff: ~12–14 weeks of focused work to v1 (vs ~2 weeks for Capacitor). Justified by the eventual Apple-ecosystem depth.

---

## 2. Strategic Direction

### 2.1 Sport-Specific Pivot (post-launch, v1.1+ content track)

Most fitness apps are generic strength loggers. The eventual wedge: **a consumer app for amateur athletes** — recreational tennis player, weekend basketball league, weekend skier, marathon trainee — where the program is designed around the sport they play.

**v1 ships as plain workout app (current Project K functionality).** Sport-specific content is authored in parallel as a content track — programs drafted with LLM assistance, reviewed by sports PTs — and ships as v1.1+ in-app expansions. This decouples the platform launch from the content lift.

### 2.2 Completion-Based Pacing (the core behavioral insight)

Most users miss workouts. Designing around miss-free attendance is designing for fiction. A 6-week program completed in 12 weeks is still valuable.

| Today (calendar-based) | Proposed (completion-based) |
|---|---|
| "Week 3, Day 2" | "Workout 8 of 18" |
| "You missed Wednesday" | (nothing — there is no Wednesday) |
| Program duration: 6 weeks | Recommended pace: 3×/week (~6 weeks if consistent) |
| Streak = consecutive days | Streak = consecutive workouts without skipping |
| Muscle readiness = days since chest | Same — biology doesn't care about your schedule |

**Consequence:** previously-shelved Phase 3 items around incomplete-workout tracking and dynamic adjustment become **non-problems** under this model. There is no missed workout, only "not yet completed."

### 2.3 Hidden LLM as Authoring Tool

The product ships **pre-built, human-curated programs only** — no exposed LLM interface to the user. LLM use is restricted to **internal authoring** (Claude helps draft programs that are reviewed/edited before publishing). This produces 100+ workouts in weeks instead of months while keeping the user-facing product predictable, safe, and reviewable.

Rationale: trust, safety, App Store review tractability, and the fact that exposing freeform AI generation in a fitness app introduces injury liability concerns and quality variance.

---

## 3. v1.1+ Sport Catalog (post-launch content track)

Initial sport content track = **3 program sets covering 4 sports**, ~9 programs total (3 sports × 3 levels), ~120–160 unique workouts authored.

| Sport | Priority | Rationale |
|---|---|---|
| **Pickleball** | ⭐ High | Explosive growth, older affluent demographic, real injury problem, no serious competition |
| **Tennis** (shared with pickleball) | ⭐ High | ~80% program overlap with pickleball — one program set covers both as "racquet sports" |
| **Golf** | ⭐ High | Older affluent demographic, rotational power + back health, underserved by apps |
| **Running** | Maybe | Huge market but very crowded; the *strength-for-runners* angle is less crowded |
| Climbing | Later | Niche, expertise-heavy programming |
| Hiking / mountaineering | Later | Bundle as "endurance + leg" |
| Cycling | Later | Strength-for-cyclists is real need, less competition |
| Racquetball | Bundle | Add to racquet-sports bucket post-validation |
| Soccer / football | Skip | Younger audience, team training already exists |
| Swimming | Skip | Niche, very technique-driven (less strength-program territory) |

**Recommended initial catalog:** Pickleball/Tennis (shared) + Golf + Running.

---

## 4. Level System (for sport-specific content track)

Three tiers per sport. Honest descriptions are critical — otherwise everyone picks "athlete."

| Level | Description | Frequency |
|---|---|---|
| **Just Getting Started** | New to the sport or returning after time off. Focus on movement quality, base strength, injury prevention. | 1–2× / week |
| **Regular Player** | Plays the sport ~weekly, wants to stay healthy + improve. Balanced strength + sport-specific work. | 2–3× / week |
| **Athlete** | Competes or trains seriously. Higher volume, sport power/explosiveness, periodized progression. | 3–5× / week |

**Intake validation:** 3 questions (years playing, current weekly training volume, prior structured-strength experience) cross-check the self-pick. If answers conflict with chosen level, soft-suggest the right one.

---

## 5. Architecture

### 5.1 Native Swift / SwiftUI

iOS + watchOS in a single Xcode project, written in Swift/SwiftUI. **iOS 17 minimum** (Swift Charts matured, ~95% of active iPhones). The watchOS target shares Swift models and business logic with iOS — programs, workout state, set logging — but has its own SwiftUI views tuned for the small screen.

### 5.2 Local-first SwiftData + Supabase sync

The architectural backbone of the iOS app. Standard pattern for serious native apps with a backend (Things, Bear, Day One all do this).

```
[ iPhone / Watch (SwiftUI) ]
            ↓
   SwiftData (local cache)
            ↓ ↑ background sync
   supabase-swift SDK
            ↓
   Supabase Postgres (canonical source)
            ↑
[ Web admin (React) ] ─── reads/writes the same data
```

**Why this matters:**

| Without local-first | With local-first |
|---|---|
| Open app → spinner while loading | Instant — UI from local cache |
| Log a set in the gym (bad wifi) | ❌ Save fails or silently retries | ✅ Saves locally, syncs when online |
| Phone offline mid-workout | App becomes useless | App keeps working, syncs after |
| Workout history view | Network round-trip per scroll | Instant from local |

**Implementation pattern:**

- **Read path:** SwiftData local query (instant). Background pull from Supabase populates/updates cache.
- **Write path:** SwiftData write (local). Queue for sync. Push to Supabase when online.
- **Sync conflict resolution:** `updated_at` timestamp + last-write-wins. Workout logs are append-only so conflicts are rare in practice.
- **Auth:** `supabase-swift` handles tokens. SwiftData queries respect user's session; RLS enforced server-side on sync.
- **Sync triggers:** app open, post-write debounced (~5s), pull-to-refresh, app foreground after backgrounding.

**Build vs buy for sync layer:**

| Option | Effort | Notes |
|---|---|---|
| Hand-rolled sync | ~1 week | Tailored to Project K's tables; full control |
| **PowerSync** ⭐ | ~3 days | OSS, Supabase-native sync engine. Free for personal scale. Recommended unless we hit a limitation. |
| GRDB + custom | ~1 week | Alternative to SwiftData; more battle-tested but more boilerplate |

Recommendation: try PowerSync first. Fall back to hand-rolled if it doesn't fit.

### 5.3 Two repos, three components

```
┌──────────────────────────────────────┐    ┌──────────────────────────┐
│ project-k  (existing repo)            │    │ project-k-ios  (new)      │
│ ├─ src/      (React admin web)        │    │ Native Swift Xcode proj   │
│ ├─ api/      (Vercel functions)       │    │ ├─ ProjectK iOS target    │
│ └─ supabase/ (schema, RLS, seeds)     │    │ ├─ ProjectK watchOS target│
│                                       │    │ └─ Shared Swift package   │
└──────────────────────────────────────┘    └──────────────────────────┘
              ↓                                          ↓
       Vercel hosting                       App Store + TestFlight
              │                                          │
              └────────── Supabase project ──────────────┘
                          (shared backend)
```

**Schema source of truth: `project-k/supabase/schema.sql`.** iOS app consumes the deployed schema; doesn't own it. Schema migrations applied via the existing repo's Supabase deploy workflow.

**Cross-repo coordination:** the MOBILE_PRD.md (this file) lives in `project-k` as the canonical product plan covering both surfaces. iOS-implementation-specific notes live in `project-k-ios/README.md`.

### 5.4 What stays on the web app (admin-only over time)

| Surface | Status | Why |
|---|---|---|
| `/admin` — program builder, user management, feedback, requests, codes | ✅ Web only | Desktop-shaped work; complex forms; rare actions |
| `/about` — training philosophy + program intros | ✅ Both | Marketing surface, also useful in-app |
| `/dashboard`, `/program`, `/retrospective` (user-facing) | ⚠️ Kept alive for existing users; not actively developed | Native iOS is the new user-facing surface |
| `/login`, `/signup`, `/request-access` | ✅ Both | New iOS users sign up via the app; web signup remains for browser-only access |

**No forced migration.** Existing web users continue at `project-k-ten-mu.vercel.app`. iOS is a parallel surface.

### 5.5 What stays on Vercel

The 2 existing serverless functions stay; 1 future function added. Same backend, called by both clients.

| Function | Used by | Why server-side |
|---|---|---|
| `/api/invite.js` | Web admin (when approving access requests) | Uses Supabase service role key — must stay server-side |
| `/api/signup.js` | Web signup form, **iOS signup screen** | Validates invite code atomically, creates confirmed user. Same logic for both clients. |
| `/api/structure-workout.js` (future, V2) | iOS voice freestyle logging | Calls Anthropic API — key must stay server-side |

iOS Sign in with Apple goes direct to Supabase via `supabase-swift` (no Vercel function needed for auth itself).

### 5.6 Cost projection

Both Supabase and Vercel free tiers easily handle Project K through 10k MAU. At unrealistic 10k-MAU scale, cost is ~$2/mo. Cost is not a real concern at any plausible scale.

---

## 6. Build Phases — Native Swift v1

Each phase shippable independently as a TestFlight build. Total to App Store: **~12–14 weeks of focused work** with watch in v1.

| Phase | Scope | Effort |
|---|---|---|
| **0 — Foundation** | New Xcode project (`project-k-ios`). iOS + watchOS targets. Apple Developer account, bundle ID (`com.kpentapalli.projectk`), capabilities. `supabase-swift` SDK. Folder structure, navigation skeleton, design tokens (colors, fonts, spacing). | 1 week |
| **1 — Auth** | Sign in with Apple via `ASAuthorizationController` → Supabase. Email/password fallback. Keychain session persistence. Account-deletion RPC + UI. Universal Link for password reset. | 1 week |
| **2 — Intake** | Form for new users. Maps to existing `profiles` schema. Auto-assign trigger handles program selection (no client-side logic). | 3 days |
| **3 — Dashboard + Programs** | Bottom tab navigation (Home / Workout / Progress / Profile). Muscle grid (9 cards w/ readiness states). Weight chart via Swift Charts. Recent workouts. Program card with current assignment. Fetch programs from Supabase, hydrate SwiftData. | 2 weeks |
| **4 — Workout Logging** | Today's workout view. Set chips, effort cycling (E/M/H), weight inputs. Save to `set_logs` + `workout_logs` (via SwiftData → Supabase sync). Rest timer. Exercise swap. PR detection. | 2 weeks |
| **5 — HealthKit Phase H1 (iPhone write)** | `HKHealthStore` authorization. Write `HKWorkout` of type `traditionalStrengthTraining` on workout finish. Read body weight + body fat to pre-fill weight log. `Info.plist` privacy descriptions. | 1 week |
| **6 — Weight Tracking** | Weight log form. Combined dual-axis chart (weight + BF%) via Swift Charts. Auto-pull latest from HealthKit. | 3 days |
| **7 — SwiftData Local-First Sync** | Set up SwiftData models mirroring `programs`, `program_assignments`, `workout_logs`, `set_logs`, `weight_logs`, `profiles`. Sync layer (PowerSync evaluation first, hand-rolled fallback). Offline write queue. Conflict resolution. | 1 week |
| **8 — Polish** | App icon, splash screen, native animations, pull-to-refresh, error handling, offline detection banners, haptics on set-complete + workout-finish. Accessibility (VoiceOver, Dynamic Type). | 1 week |
| **9 — Apple Watch + HealthKit H2** | watchOS target activated. Shared Swift models via internal Swift Package. Watch Connectivity for phone↔watch session/auth propagation. Today's workout view on watch (program day). Tap-to-mark-sets-done UI. `HKWorkoutSession` live tracking with heart rate + ring credit. Persistent confirmation indicators. | 2–3 weeks |
| **10 — App Store submission** | Screenshots (all required device sizes), metadata, privacy nutrition labels (HealthKit + Apple SSO), TestFlight beta with 5–10 users, reviewer demo flow + permanent invite code, submit, iterate on feedback. | 1 week |

**Total: ~12–14 weeks to App Store v1 with watch.**

---

## 7. Backend Stays As-Is

The existing Project K backend is reused unchanged. iOS is a new client.

### What carries over

| Asset | Status |
|---|---|
| Supabase auth, profiles, RLS | ✅ Unchanged. iOS uses `supabase-swift` SDK |
| `/api/invite.js`, `/api/signup.js` Vercel functions | ✅ Called from Swift via `URLSession` |
| Programs JSONB schema | ✅ Decode in Swift via `Codable` |
| `workout_logs`, `set_logs`, `weight_logs`, `profiles` tables | ✅ Same schema, SwiftData models mirror them |
| Muscle readiness model (`src/lib/readiness.js` logic) | ⚠️ Reimplement in Swift (~50 lines) |
| Muscles + categories (`src/lib/muscles.js` logic) | ⚠️ Reimplement in Swift (~30 lines) |
| 7 seeded programs | ✅ Live in Supabase, untouched |
| Existing web app | ✅ Stays alive at `project-k-ten-mu.vercel.app` |

### What's new for iOS

- `supabase-swift` SDK
- SwiftData local cache mirroring core tables
- Background sync layer (PowerSync or hand-rolled)
- WatchConnectivity for phone↔watch session propagation
- Native auth via `ASAuthorizationController`
- HealthKit framework integration

### User migration

**No migration.** No active users today. iOS users sign up fresh. Web users continue at the existing site. Both auth systems write to the same Supabase users table — Supabase merges by email if anyone signs in on both surfaces with the same address.

### iOS API surface

Functions called by iOS:
- `POST /api/signup` — invite-code validation + user creation (mirror of web flow)
- Direct Supabase queries for everything else (profiles, programs, workouts, weights)
- Direct Supabase auth (Sign in with Apple, email/password)
- Future: `POST /api/structure-workout` for voice freestyle (V2)

No new endpoints needed for v1.

---

## 8. v1 Native Features

What ships at first App Store submission.

| Feature | Effort | Notes |
|---|---|---|
| **Sign in with Apple** | 1 day | Native `ASAuthorizationController` → Supabase |
| **Email/password fallback** | 0.5 day | For users without Apple ID |
| **Account deletion (in-app)** | 1 day | Apple-required. SECURITY DEFINER RPC + confirmation UI |
| **Bottom tab navigation** | 0.5 day | Home / Workout / Progress / Profile |
| **HealthKit Phase H1** (iPhone write workouts, read weight/body fat) | 2–3 days | Workouts in Apple Fitness; weight auto-pulls from Apple Health |
| **HealthKit Phase H2** (watch live `HKWorkoutSession`) | 3–5 days | Heart rate + ring credit during strength sessions |
| **Apple Watch tap-through workout** | 2 weeks | Today's workout on watch; tap-to-mark-sets-done |
| **Universal Links** (password reset routes back to app) | 0.5 day | Polished auth |
| **Biometric login** (Face ID re-auth) | 0.5 day | Native polish |
| **Pull-to-refresh** on dashboard + history | 0.5 day | Native expectation |
| **Haptics** on set-complete + workout-finish | 0.5 day | Tactile feedback |
| **App icon + splash screen** | 0.5 day | Required for submission |
| **Offline workout logging** | (built into Phase 7 SwiftData) | Gym wifi resilience |
| **Onboarding tutorial** | 1 day | iOS users expect first-launch guidance |

### Deferred to v1.1+

- Voice for weight entry (V1)
- Voice freestyle logging (V2)
- Voice on watch (V4)
- Multi-segment workouts — warmup + strength + cooldown (H3)
- Push notifications
- Sport-specific content track

---

## 9. App Store Submission Requirements

### Account & identity
- [ ] Apple Developer Program membership ($99/yr; 1–2 day approval)
- [ ] Bundle ID locked: `com.kpentapalli.projectk` — **permanent**
- [ ] App name: TBD (likely "Project K" for v1; sport-themed rename considered for v1.1+)

### Assets
- [ ] App icon — 1024×1024 source PNG, no transparency
- [ ] Splash screen image
- [ ] Screenshots — multiple device sizes (6.7", 6.1", 5.5" iPhone; Apple Watch screenshots required if watch is bundled)
- [ ] Optional preview video

### Metadata
- [ ] Tagline (under 30 chars)
- [ ] Description (4000 chars; first 3 lines matter most)
- [ ] Keywords (100 chars total, comma-separated)
- [ ] Category: Health & Fitness
- [ ] Age rating (likely 12+)
- [ ] Promotional text (170 chars, updatable without re-review)

### Compliance
- [ ] Privacy policy URL (host on Vercel as `/privacy` route on existing web app)
- [ ] Support URL (host on Vercel as `/support` route)
- [ ] Privacy nutrition labels — declare email, weight, workout data, link-to-identity status, **HealthKit reads + writes**
- [ ] **Account deletion flow** (Apple requirement) — in-app delete-my-account button, not just email-us
- [ ] Demo account credentials for reviewer (use a permanent reviewer invite code, e.g., `APPLEREVIEW`)

### HealthKit-specific
- [ ] HealthKit capability enabled in Xcode project (iOS + watchOS)
- [ ] `NSHealthShareUsageDescription` in `Info.plist` — user-facing reason for reading body weight + body fat
- [ ] `NSHealthUpdateUsageDescription` in `Info.plist` — user-facing reason for writing workouts
- [ ] Privacy policy explicitly mentions HealthKit data is **never used for advertising or sold to third parties** (Apple policy requirement)
- [ ] App Store review notes justify each HealthKit data type
- [ ] Account deletion handles HealthKit data disconnection

### Sign in with Apple
- [ ] Sign in with Apple capability enabled on App ID
- [ ] Service ID created in Apple Developer (for OAuth callback if web flow is also used)
- [ ] `.p8` signing key generated and stored securely
- [ ] Supabase Auth dashboard configured: Team ID, Service ID, Key ID, key contents
- [ ] "Hide My Email" handling — backend tolerates Apple's relay email format

### Code signing
- [ ] Distribution certificate (Xcode handles)
- [ ] Provisioning profile (Xcode handles)
- [ ] Push notification entitlement only if shipping push in v1 (deferred)

### Watch-specific
- [ ] watchOS target included in App Store record
- [ ] Watch screenshots
- [ ] Watch app description (separate from iOS app description, shorter)

---

## 10. Design Decisions Locked

### Locked (decided 2026-04-29)

- ✅ **Native Swift / SwiftUI** for iOS + watchOS
- ✅ **iOS 17 minimum** (Swift Charts maturity + ~95% device coverage)
- ✅ **Sign in with Apple** ships in v1 (native `ASAuthorizationController`)
- ✅ **HealthKit Phase H1 + H2** in v1 (iPhone write + watch live session)
- ✅ **Apple Watch app in v1** (Phase 9 — last phase before submission; can drop to v1.1 if scope creeps)
- ✅ **Local-first SwiftData + Supabase sync** (PowerSync first, hand-rolled fallback)
- ✅ **Separate repo** for iOS (`project-k-ios`) — keeps web/admin/schema in `project-k`
- ✅ **No user migration** — iOS and web are parallel surfaces
- ✅ **Web app stays alive** as admin interface + legacy access
- ✅ **Sport pivot is post-launch** content track (v1.1+)

### Still to decide

- [ ] App name and brand identity (Project K stays for v1?)
- [ ] App icon design direction
- [ ] Bottom tab labels finalization (Home / Workout / Progress / Profile is provisional)
- [ ] Onboarding tutorial flow + content
- [ ] Pricing model (free / freemium / subscription) — see Open Questions §12
- [ ] Push notifications strategy for v1.1+
- [ ] Sport pivot specifics (initial sports, level descriptions, content review process)

---

## 11. Sequence: Ship Plain Workout App First (DECIDED)

| Option | Pros | Cons | Decision |
|---|---|---|---|
| A. Ship Project K as-is (no sport pivot ever) | Fastest; locks in current product | Misses the sport-specific differentiation | Rejected |
| B. Pivot first, then ship | Launches with the version you actually want to sell | Longer to launch; content lift before user feedback | Rejected |
| **C. Ship plain workout app v1, sport-pivot in v1.1+** | Platform launch + content track in parallel; iterates with real users | Bundle ID is permanent; rename mid-flight is messy if branding changes | ✅ **Decided** |

**Rationale:** Apple Store + native Swift + Apple Watch + HealthKit is the unknown — get that working first with real users. Sport-specific content is a content problem authored in parallel, blocked only by PT review cycles. Each track de-risks the other.

---

## 12. Open Questions

1. **Workout sequence within a program** — must workouts be done in order, or freestyle? Recommended: ordered (periodization matters), no skip-lock.
2. **Program completion definition** — all N workouts in order at any pace? Recommended: in order, any pace.
3. **Re-engagement** — without calendar pressure, what brings users back? Push nudges (v1.1+), milestone moments, streak surfaces. Decide before pushes ship.
4. **Cross-training audience** — sport-flavored general fitness vs. strict sport-specific. Are levels enough to span both?
5. **Pricing model** — free? Freemium (one sport free, others paid)? Subscription? Affects App Store privacy labels, IAP setup, review process.
6. **Single program per sport-level, or multiple variants?** — e.g., Pickleball Regular Player gets one program, or chooses from "explosiveness focus" vs "longevity focus."
7. **Apple Watch primary use case** — tap through a planned program, or freestyle voice logging, or both? Decided as tap-only for v1; voice on watch deferred to v1.3+.
8. **Branding decision** — keep "Project K" or rename to something sport-themed at v1.1+?

---

## 13. Voice & Apple Watch Roadmap

Phased plan for adding voice logging on top of the watch app. Each phase ships independently.

### Why this is on the roadmap

Inspired by Terry Lin's **Cooper's Corner** approach (Lenny's Newsletter / How I AI). His insight: workout logging UX dies because manual entry mid-workout breaks consistency. Voice removes the friction.

**Important framing — Project K is not Cooper's Corner.** Cooper's Corner is freestyle-only (user dictates whatever they did, LLM extracts structure). Project K's primary flow is **structured programs** — the day's exercises are pre-planned, the user marks sets done. Voice in Project K is a **polish layer**, not the core interaction.

Where voice genuinely helps Project K:
1. **Hands-free weight entry** — sweaty hands, holding a dumbbell, can't type
2. **Freestyle workouts outside a program** — the Cooper's Corner use case, slotted in as P3-16

### Phased plan

| Phase | Scope | Effort | Value | When |
|---|---|---|---|---|
| **V0 — Foundations** | iOS + Watch native Swift app shipped (= v1 launch). No voice yet. | (= v1 build) | — | v1 |
| **V3 — Apple Watch tap-through workout** | watchOS target, today's workout view, tap-to-mark-sets-done, `HKWorkoutSession` integration. **Promoted to v1** under native Swift architecture. | 2–3 weeks | High for Apple Watch users | v1 |
| **V1 — Voice for weight entry on iPhone** | Tap weight input → mic button → speak "65" → input fills. Native `SFSpeechRecognizer`. Add `NSMicrophoneUsageDescription` to `Info.plist`. | ~2 days | Native polish; small but feels great in gym | v1.1 |
| **V2 — Freestyle voice workout logging on iPhone** | "Log a freestyle workout" surface → record audio → transcript → LLM structures into workout_log. New `/api/structure-workout` Vercel function calling Claude API with constrained exercise vocabulary. Schema validation prevents hallucinations. | ~5–7 days | Covers off-program gym sessions | v1.2 |
| **V4 — Voice on the watch** | Native `SFSpeechRecognizer` on watch → same `/api/structure-workout` backend as V2. Persistent visual confirmation (Terry's specific UX: "saved" indicator stays on screen long enough for someone walking around the gym). | ~1–2 weeks | Cooper's-Corner-style capture; high if freestyle is real use case | v1.3 |

### Architectural note — native Swift makes everything easier

Under the original Capacitor plan, watch was a separate-paradigm bolt-on. Under native Swift:

- Watch app is a sibling target in the same Xcode project
- Shared Swift Package contains models, business logic, sync code
- WatchConnectivity for session/auth propagation
- Same `HKWorkoutSession` API used on both devices
- Voice uses native `SFSpeechRecognizer` instead of Web Speech API

This is the architectural reason the native Swift pivot was chosen — V3 + V4 + H2 are all dramatically cleaner.

---

## 14. HealthKit & Apple Fitness Integration

### The honest framing: don't launch Apple's Workout app — *be* it

There's no public API to programmatically launch Apple's Workout app and pre-select strength training. What you actually want is to **use HealthKit directly**. Your app starts the workout session itself, captures heart rate + calories + ring credit, and the workout shows up in Apple Fitness alongside everything else. The user never leaves Project K.

User-facing experience:

1. User taps **"Start Today's Workout"** in Project K (iPhone or Watch)
2. Watch starts an `HKWorkoutSession` of type `traditionalStrengthTraining` in the background
3. Heart rate sensor activates, calories tracked, Activity ring fills
4. User taps through sets in your app
5. User taps **"Finish & Log"** → session ends, workout written to HealthKit with metadata, synced to Supabase via SwiftData
6. Workout appears in Apple Fitness as "Project K · Strength Training · 47 min · 312 cal · avg HR 124"

### iPhone vs Watch responsibilities

| Device | What it does | When |
|---|---|---|
| **iPhone** | Writes finished workouts to HealthKit (time + estimated calories, no heart rate). Reads weight + body fat from Apple Health to auto-populate weight tracking. | v1 (Phase 5) |
| **Apple Watch** | Starts a *live* `HKWorkoutSession` with sensor-driven heart rate + accurate calories + ring credit. Final workout writes back to HealthKit. | v1 (Phase 9) |

### Phased plan

| Phase | Scope | Effort | When |
|---|---|---|---|
| **H1 — iPhone HealthKit write + read** | Request HealthKit auth on first workout finish. Write `HKWorkout` of type `traditionalStrengthTraining`. Read latest body weight + body fat % to pre-fill Weight Log. | 2–3 days | v1 (Phase 5) |
| **H2 — Apple Watch live workout session** | "Start Workout" on watch starts `HKWorkoutSession` (sensor-driven). Heart rate UI. Tap-to-mark-set-done flows back to phone via Watch Connectivity. "Finish" ends session, saves to HealthKit with set-level metadata. | 3–5 days on top of V3 | v1 (Phase 9) |
| **H3 — Multi-segment workouts** | Add activity-type selector at workout start. Sequential sessions: warmup (`walking`) + strength (`traditionalStrengthTraining`) + cooldown (`walking`). | 2–3 days | v1.2+ |

### App Store gotchas specific to HealthKit

- **Privacy nutrition labels** must declare exactly what HealthKit data is read and written
- **Apple's HealthKit usage policy** prohibits health data for advertising or selling to third parties
- **Justification in review notes** for each HealthKit data type
- **`HKHealthStore.requestAuthorization`** flow with `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` strings
- **Account deletion** handles HealthKit data disconnection

Add ~2 days to first review for HealthKit-specific back-and-forth.

### Cardio extensions (future)

For structured cardio days (running, cycling, etc.), each session uses its own `HKWorkoutActivityType` (`running`, `cycling`, `indoorCycling`, `rowing`, etc.). Same `HKWorkoutSession` plumbing, different activity type. No additional architecture needed.

---

## 15. Apple Sign-In with Supabase

### Decision (2026-04-29): Sign in with Apple ships in v1, native iOS path

Native iOS uses `ASAuthorizationController` directly — no Capacitor plugin, no webview. Cleanest possible iOS auth UX.

### Architecture

| Surface | Mechanism |
|---|---|
| **iOS app (native)** | `ASAuthorizationController` → returns Apple ID token via system sheet → pass to `supabase.auth.signInWithIdToken(provider: .apple, idToken:)` |
| **Web admin (existing)** | `supabase.auth.signInWithOAuth({ provider: 'apple' })` → Apple OAuth flow in browser |

Both flows authenticate the same Supabase user — Apple SSO and email/password sign-ins for the same email collide gracefully (Supabase merges by email).

### Setup checklist

#### Apple Developer side
- [ ] Enable **Sign in with Apple** capability on App ID
- [ ] Create a **Service ID** (used for OAuth callback URL on web)
- [ ] Configure web domain + redirect URL on Service ID (`https://<supabase-project>.supabase.co/auth/v1/callback`)
- [ ] Generate **Sign in with Apple key** (`.p8` file) — download once, store securely
- [ ] Note your **Team ID** and **Key ID**

#### Supabase side
- [ ] Auth → Providers → enable Apple
- [ ] Paste in: Team ID, Service ID, Key ID, contents of `.p8` file
- [ ] Configure redirect URLs (web origin + iOS bundle ID for native)

#### iOS app
- [ ] Add Sign in with Apple entitlement in Xcode project
- [ ] Add Apple Sign-In button per Apple HIG (specific styling required)
- [ ] Wire `ASAuthorizationController` → token → Supabase
- [ ] Test "Hide My Email" — Apple may give back relay email like `xyz@privaterelay.appleid.com`. Backend must accept this format.

### "Hide My Email" handling

When users choose "Hide My Email," Apple returns a relay email instead of the user's real email. Things to confirm:

- Supabase stores the relay email as the user's email — fine, no code changes
- If you ever email users (password reset, notifications), the relay forwards transparently
- If Apple invalidates the relay (user revokes app access), email delivery fails silently — long-term, monitor bounces

### Cost

Free. Sign in with Apple is included in the Apple Developer Program ($99/yr).

---

## 16. Development Methodology

Patterns adopted from Terry Lin's Cooper's Corner build (Lenny's Newsletter / How I AI). Codified as Claude Code skills in the `project-k-ios` repo.

### The "dual-wielding" workflow: Cursor + Xcode (or Claude Code + Xcode)

- Both editor and Xcode point at the same project folder on disk
- **Editor (Cursor / Claude Code)** handles all code authoring + AI-driven edits/refactors
- **Xcode** handles building, running on Simulator/device, and **debugging compile + runtime errors** (the editor can't see Xcode's build output)
- Building to Apple Watch must happen separately in Xcode (selecting watch target/scheme)

Mobile is fundamentally not like web dev — there's no localhost preview that mirrors the real experience. Test on real iPhone + Watch, ideally in the actual gym.

### The three-step PRD workflow

**Step 1 — PRD-Create.** Drop a feature request into the rule. Expands into structured plan: implementation steps, reference diagrams, goals, scenarios as Gherkin user stories ("Given X, when the user does Y, then Z"), and an investigation/checkpoint section flagging uncertainty (which files to touch, which DB tables/endpoints).

**Step 2 — PRD-Review.** Adversarial re-read. Killer prompt: *"If another model with no prior context had to execute this plan, how would you rate it out of 10?"* If 7/10, ask "What are the three points you docked it for?" Iterate until 9–10/10. This straw-man pass makes execution close to one-shot.

**Step 3 — PRD-Execute.** Phased checklist with safety: no placeholder code, real data only, error handling addressed, paths verified. Git commit before and after each phase. Pause between phases for QA.

### Additional rules

**PRD-Refactor.** Mirrors PRD-Create but aimed at restructuring existing code. Preserve behavior, define a QA plan that confirms nothing broke.

**Rubber-Duck.** Model walks through code line-by-line for the human's benefit. Pop-quiz mode: "give me a function, ask me what it does." Accelerates learning Swift/SwiftUI without losing debug capability.

### File-size discipline

**Hard target: 200–400 lines per Swift file.** When files get large (>500 lines), models read them in chunks and start hallucinating. Smaller cohesive files help the model more than they help a human reader.

For `project-k-ios`: enforce from day one. Don't let any view file grow past 400 lines — extract subviews, computed properties, helper functions.

### Git commit cadence

- Commit before and after every ~3 tasks
- PRD-Execute rule itself commits between phases
- "Let it rip" is psychologically and operationally safe only if rollback is one command away

### Design pipeline (revised for native Swift)

Native Swift is different from web — SwiftUI's preview canvas is so productive that Figma-first is overkill. Recommended flow:

```
Web screen as IA reference (already exists)
  → Describe iOS version to Claude
     (bottom tabs, native sheets, SF Symbols, 44pt touch targets, safe areas)
  → Claude generates SwiftUI code
  → Iterate in Xcode preview live
  → Polish on real device
  → Figma only for App Store screenshots
```

Skip Figma for the build itself. Use it only for:
- App icon design
- App Store screenshots (with device frames)
- If a specific screen needs design exploration before code

### Codify in the repo

Create `project-k-ios/.claude/skills/`:
- `prd-create.md`
- `prd-review.md`
- `prd-execute.md`
- `prd-refactor.md`
- `rubber-duck.md`

Each skill is self-contained, ~200 lines max, points the model at the right project context (file locations, schema, conventions, SwiftUI patterns).

### Testing in real context

The simulator is necessary but not sufficient.

1. **Test on real device routinely.** Touch, gestures, haptics, performance — none of these are accurate in Simulator.
2. **Test in real environment.** A gym is loud, your hands are sweaty, you're moving. The app behaves differently than at your desk.

For watch specifically: test the app *while wearing* the watch through an actual workout, including walking around between sets.

---

## 17. Deliberately Out of Scope (for v1)

Things consciously parked, not forgotten.

- Android port — iOS-only at v1
- iPad-optimized layout (works on iPad via iPhone scaling at v1)
- Mac Catalyst port
- Web app feature parity for user-facing surfaces (web stays admin-only over time)
- User-facing LLM / chat interface — explicitly hidden
- Social / accountability / sharing
- Voice workout logging (V1, V2, V4 — all v1.1+)
- HealthKit Phase H3 (multi-segment workouts) — v1.2+
- Push notifications — v1.1+
- In-app purchases (decide pricing model first)
- Sport-specific content (v1.1+ content track)
- Sign in with Google / other providers — Apple SSO + email is enough for v1

---

## 18. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| 12–14 week timeline slips | Medium | Phase 9 (Watch) is the most-droppable; can defer to v1.1 if iPhone slips |
| Swift/SwiftUI learning curve | Medium-High | Use Cursor + Xcode dual-wielding (Terry's pattern); rubber-duck rule for unfamiliar code; ship Phase 1–4 first to build fluency before HealthKit/Watch |
| App Store reject for invite-only signup | Medium | Permanent reviewer code + clear notes |
| App Store reject for missing in-app account deletion | High | Build account-deletion RPC + UI in Phase 1 |
| App Store extra scrutiny on HealthKit usage | High | Detailed review notes per HealthKit data type; privacy policy explicitly mentions Apple's restrictions |
| HealthKit live session battery drain on watch | Medium | Use `HKWorkoutBuilder` lifecycle correctly; pause sensors between sets |
| SwiftData sync conflicts with Supabase | Medium | PowerSync evaluation first; fall back to hand-rolled with `updated_at` last-write-wins |
| Watch Connectivity unreliability | Medium | Both clients sync independently to Supabase; Watch Connectivity is for low-latency UX, not source of truth |
| Sport pivot fails to resonate post-launch | Medium | Soft-launch v1 to family/friends first; sport content is parallel content track |
| Existing web users miss user-facing functionality | Low | Web stays alive; user-facing surfaces deprecated organically not forcibly |

---

## 19. Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-28 | Choose Capacitor over React Native | Initial decision based on "small codebase, fast launch" |
| 2026-04-28 | Hide LLM from users; use internally for authoring only | Trust, safety, App Store reviewability, content quality control |
| 2026-04-28 | Pivot pacing model from calendar-based to completion-based | Behavioral honesty — users miss workouts; design around real life |
| 2026-04-28 | Initial sport scope: Pickleball/Tennis + Golf + Running | Market gap + content tractability; pickleball is the strongest wedge |
| 2026-04-29 | Ship plain workout app v1, sport pivot in v1.1+ (Option C) | Decouple platform launch from content lift |
| 2026-04-29 | Sign in with Apple ships in v1 | Best iOS auth UX; Apple-policy aligned |
| 2026-04-29 | HealthKit Phase H1 ships in v1 | High-value low-effort; "be Apple's Workout app" positioning |
| 2026-04-29 | Adopt Terry Lin's PRD-Create / Review / Execute / Refactor / Rubber-Duck rules as Claude Code skills | Improves AI-assisted dev quality |
| 2026-04-29 | **Pivot from Capacitor → native Swift / SwiftUI** | Eventual roadmap is heavily Apple-ecosystem (Watch, HealthKit, voice on watch); webview wrapper would force native watchOS sibling regardless |
| 2026-04-29 | **iOS 17 minimum** | Swift Charts maturity + ~95% device coverage |
| 2026-04-29 | **Apple Watch in v1** (Phase 9) | Native Swift makes watch much more tractable; under Capacitor it would have been v1.2+ |
| 2026-04-29 | **Local-first SwiftData + Supabase sync** | Standard pattern for native apps with backends; offline-resilient gym usage; instant UI |
| 2026-04-29 | **Separate iOS repo** (`project-k-ios`) | Clean separation; web/admin/schema stays in `project-k` |
| 2026-04-29 | **Web app stays alive as admin interface** | Existing users keep access; admin features built once in React not duplicated in iOS |
| 2026-04-29 | **No user migration** | No active users today; iOS and web are parallel surfaces |
| 2026-04-29 | **Try PowerSync first for SwiftData ↔ Supabase sync** | OSS, Supabase-native; ~3 days vs ~1 week hand-rolled. Fall back if it doesn't fit. |
| 2026-04-29 | **Skip Figma-first design pipeline** | SwiftUI previews are productive enough for solo build; Figma for App Store screenshots only |

---

*This document is a living plan. Update as decisions are made or scope changes.*
