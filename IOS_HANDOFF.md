# Treno iOS — Developer Handoff PRD

> **Status:** Ready for development · v1 build kickoff
> **Last updated:** 2026-05-12
> **Audience:** iOS engineer (contractor or in-house) building the native Swift v1
> **Companion documents:**
> - [MOBILE_PRD.md](MOBILE_PRD.md) — strategic vision, market positioning, sport-specific roadmap (read once for context)
> - [MOBILE_PIVOT_PLAN.md](MOBILE_PIVOT_PLAN.md) — why the Capacitor v0 exists alongside this v1
> - [SPEC.md](SPEC.md) — the web app's product spec (your reference for v1 feature parity)

---

## 0. TL;DR for the developer

You are building the **native Swift / SwiftUI iOS app for Treno**, a personal training tracker. There is already a working web app (and a Capacitor wrapper of it on TestFlight as v0); your build replaces the Capacitor v0 with a real native experience over the same Supabase backend.

- **New repo:** `project-k-ios` (suggested — single-purpose, separate from the web monorepo)
- **Bundle ID:** `com.kpentapalli.projectk.native` (suggested — third bundle, separate from Mascot RPG `com.kpentapalli.projectk` and Capacitor v0 `com.kpentapalli.projectk.original`)
- **Stack:** Swift 5.9+, SwiftUI, SwiftData, [supabase-swift](https://github.com/supabase/supabase-swift), iOS 17+, watchOS 10+
- **Backend:** Existing Supabase project — **do not modify the schema**. You are a consumer.
- **Timeline:** 12–14 weeks of focused work to v1 (per [MOBILE_PRD §1](MOBILE_PRD.md))
- **Brand:** Treno (wordmark `TRENO.` with signal-green dot)
- **Existing reference apps:** [github.com/kpentapalli/project-k](https://github.com/kpentapalli/project-k) — branches `main` (web), `mobile-v0` (Capacitor wrapper)
- **Live web app:** https://project-k-ten-mu.vercel.app

---

## 1. What you're building

### 1.1 Product in one sentence

A personal training tracker that lets users follow structured strength programs, log every set, track muscle readiness over time, and see progress — designed around the reality that real people miss workouts and resume.

### 1.2 v1 feature set

| Area | What | Source of truth |
|---|---|---|
| **Auth** | Sign in with Apple + email magic link (existing Supabase auth) | `web: src/contexts/AuthContext.jsx` |
| **Onboarding (intake)** | Goal, experience, days/week, equipment, limitations, current/target weight | `web: src/pages/Intake.jsx` |
| **Auto-program assignment** | Server-side trigger picks best program based on intake | `supabase: auto_assign_program_on_intake()` |
| **Dashboard** | Today's workout card, muscle readiness 9-grid, weight chart, streak, recent workouts | `web: src/pages/Dashboard.jsx` |
| **Workout logging** | Set chips (done/undone), optional effort cycling (E/M/H), weight per set, rest timer, exercise swap, finish-with-date-picker, PR detection | `web: src/pages/Program.jsx` |
| **Programs** | 12 seeded programs (7 general + 5 sport-specific). Switch program flow, mark-complete flow | `supabase/seed-programs-v2.sql`, `supabase/seed-sport-programs.sql` |
| **Weight tracking** | Weight + body-fat log with dual-axis chart | `web: src/components/WeightSection.jsx` |
| **Retrospective** | Post-program completion summary screen | `web: src/pages/Retrospective.jsx` |
| **Apple Watch v1** | Today's workout view, tap-to-mark-set-done, live HKWorkoutSession (HR + ring credit) | New (does not exist on web) |
| **HealthKit** | Read weight + active energy; write workout sessions | New |

### 1.3 Out of scope for v1

| Item | Why deferred |
|---|---|
| **Game / mascot / XP layer** | Tried in Capacitor v0, abandoned. See [MOBILE_PIVOT_PLAN.md](MOBILE_PIVOT_PLAN.md). Don't reintroduce. |
| **Push notifications** | v1.1+ |
| **Voice logging on iPhone** | v1.1+ (only on Watch in v1) |
| **Custom program builder** | Admin uses web app for this. Don't build a UI for it. |
| **Admin / user management** | Admin work happens on the web app at `/admin`. No iOS admin surface. |
| **Sport-specific programs as a separate browse experience** | They exist in the catalog and can be admin-assigned; v1 doesn't surface a sport-picker UI |
| **Social features / sharing** | v1.1+ |
| **Apple Health bidirectional sync (writing weight back to Health)** | Read-only from Health in v1; write-back v1.1+ |
| **Background sync / silent push** | v1 syncs on app open and on Foreground events only |

---

## 2. Architecture

### 2.1 Local-first SwiftData + Supabase sync

```
┌─────────────────────────────────────────────────┐
│  iPhone / Watch (SwiftUI views)                 │
└────────┬────────────────────────────────────────┘
         │ reads / writes
         ▼
┌─────────────────────────────────────────────────┐
│  SwiftData (local cache, source of UI truth)    │
└────────┬────────────────────────────────────────┘
         │ background sync
         ▼
┌─────────────────────────────────────────────────┐
│  supabase-swift SDK                             │
└────────┬────────────────────────────────────────┘
         │ HTTPS + Postgres realtime
         ▼
┌─────────────────────────────────────────────────┐
│  Supabase: Postgres + Auth + RLS + Storage      │
└─────────────────────────────────────────────────┘
```

**Read path:** SwiftData query (instant). Background fetch from Supabase populates / updates cache.

**Write path:** SwiftData write (instant). Queue for sync. Push to Supabase when online. Gracefully retry on failure.

**Offline:** All read paths must work offline. Writes queue and replay on reconnect.

### 2.2 Sync engine — recommended approach

Two viable paths:

**Option A (recommended): Hand-roll a simple sync layer.**
- ~3–4 days of work
- Maps SwiftData entities ↔ Supabase rows
- Last-write-wins conflict resolution (acceptable for single-user-per-device data)
- Track per-row `synced_at` to know what's pending push
- Simpler to debug, no third-party dependency

**Option B: PowerSync.**
- ~3 days but adds a dependency
- OSS, Supabase-native sync engine
- Free tier should be plenty
- Worth evaluating only if hand-rolled becomes painful

**Start with hand-rolled.** Move to PowerSync only if you hit a wall.

### 2.3 Two-repo strategy

| Repo | Purpose | Status |
|---|---|---|
| **kpentapalli/project-k** | Web app + Capacitor v0 + Supabase migrations + program seeds | Exists |
| **project-k-ios** (new) | Native Swift Xcode project — iOS + watchOS targets | You create |

Web and iOS share **only**: the Supabase backend, the program JSONB structure, and the brand assets (which you copy into iOS).

### 2.4 Project structure (suggested)

```
project-k-ios/
├── Treno.xcodeproj
├── Treno/                          # iOS app target
│   ├── App/
│   │   ├── TrenoApp.swift          # @main App entry
│   │   ├── AppDelegate.swift       # if needed for SiwA / push
│   │   └── RootView.swift          # auth-guarded root
│   ├── Features/
│   │   ├── Auth/
│   │   │   ├── LoginView.swift
│   │   │   ├── SignInWithAppleButton.swift
│   │   │   └── AuthViewModel.swift
│   │   ├── Intake/
│   │   ├── Dashboard/
│   │   │   ├── DashboardView.swift
│   │   │   ├── MuscleReadinessGrid.swift
│   │   │   ├── WeightChart.swift
│   │   │   └── DashboardViewModel.swift
│   │   ├── Workout/
│   │   │   ├── WorkoutView.swift
│   │   │   ├── ExerciseCard.swift
│   │   │   ├── SetChip.swift
│   │   │   ├── EffortCell.swift
│   │   │   ├── WeightInput.swift
│   │   │   ├── RestTimer.swift
│   │   │   ├── SwapExerciseSheet.swift
│   │   │   └── WorkoutViewModel.swift
│   │   ├── Program/
│   │   │   ├── ProgramSwitcherView.swift
│   │   │   └── ProgramListViewModel.swift
│   │   ├── Weight/
│   │   ├── Retrospective/
│   │   └── Welcome/                # the brand splash on launch
│   ├── Core/
│   │   ├── Models/                 # SwiftData @Model classes
│   │   ├── Sync/                   # SupabaseSync engine
│   │   ├── Auth/                   # AuthService wrapping supabase-swift
│   │   ├── Readiness.swift         # ported from web src/lib/readiness.js
│   │   ├── Muscles.swift           # ported from web src/lib/muscles.js
│   │   └── PRDetector.swift        # ported from web Program.jsx PR logic
│   ├── Design/
│   │   ├── Tokens.swift            # colors, fonts, spacing — ported from BRAND.md
│   │   ├── Components/             # Wordmark, Locomotive, MonogramT
│   │   └── Modifiers/              # Treno-styled modifiers
│   └── Resources/
│       ├── Assets.xcassets/
│       │   ├── AppIcon.appiconset
│       │   └── Splash.imageset
│       └── Info.plist
├── TrenoWatch Watch App/           # watchOS target
│   ├── TrenoWatchApp.swift
│   ├── Features/
│   │   ├── Today/
│   │   └── ActiveWorkout/
│   └── Core/                       # shared with iOS via Swift Package (see below)
├── TrenoShared/                    # Local Swift Package — shared between iOS + Watch
│   ├── Package.swift
│   └── Sources/
│       └── TrenoShared/
│           ├── Models/             # Codable structs for API
│           ├── Services/           # SupabaseClient, AuthService
│           └── Logic/              # Readiness, Muscles, PRDetector
├── TrenoTests/
└── TrenoUITests/
```

The shared `TrenoShared` Swift Package keeps iOS and Watch in sync. Anything that's not view-specific lives there.

---

## 3. Tech stack & dependencies

| Dependency | Version | Why |
|---|---|---|
| **Swift** | 5.9+ | Modern concurrency, observation |
| **SwiftUI** | iOS 17+ | Declarative UI, Observation framework, Swift Charts |
| **SwiftData** | iOS 17+ | Local-first persistence, type-safe queries |
| **supabase-swift** | latest | Auth + DB + storage. SPM. https://github.com/supabase/supabase-swift |
| **Swift Charts** | iOS 16+ | Weight + body-fat dual-axis chart |
| **HealthKit** | system | Read weight + active energy; write workout sessions |
| **AuthenticationServices** | system | Sign in with Apple |
| **Watch Connectivity** | system | iPhone ↔ Watch session/auth/data sharing |
| **HKWorkoutSession** | system | Live workout tracking on Watch (HR + ring credit) |

**Do NOT use:**
- Combine for new code (use async/await + Observation instead)
- UIKit (SwiftUI only — exception: edge cases in modal presentation if needed)
- Third-party UI frameworks (no SnapKit, no Texture, etc.)
- React Native, Capacitor, or any cross-platform tech (we already tried; that's the v0)
- Realm or other competing local DBs (SwiftData)

---

## 4. Backend (existing Supabase — do not modify)

### 4.1 Project info

The backend is shared with the web app. **You do not have schema-write privileges and should not request them.** Schema changes go through the web/admin path.

- **Project URL:** comes from `VITE_SUPABASE_URL` in the web app's env (you'll get this from Kalyan)
- **Anon key:** comes from `VITE_SUPABASE_ANON_KEY` (also from Kalyan)
- **Service role key:** server-side only (Vercel functions). **Never include in iOS app.**

### 4.2 What the backend provides

| Surface | Endpoint | Used for |
|---|---|---|
| **Postgres tables** | via supabase-swift | All CRUD |
| **Row Level Security** | enforced server-side | Users only see their own data; admins see all |
| **Auth** | `supabase.auth.*` | Sign in, sign out, session refresh |
| **Realtime** | optional | Not used in v1 — sync is pull-based |
| **Storage** | not used in v1 | Future: progress photos, exercise media |
| **Vercel function: `/api/invite`** | external HTTPS POST | Admin sends invite. **iOS doesn't call this.** |
| **Vercel function: `/api/signup`** | external HTTPS POST | Validates invite code, creates user. **iOS doesn't call this in v1** — assume invite-only via web. |

### 4.3 Tables to mirror in SwiftData

Schema source: [supabase/schema.sql](supabase/schema.sql). Read it once before starting.

| Table | Mirror as | Notes |
|---|---|---|
| `profiles` | `Profile` @Model | id = auth user id; intake fields + role |
| `programs` | `Program` @Model | `structure` is JSONB — decode as nested Codable structs (see §6) |
| `program_assignments` | `ProgramAssignment` @Model | `status: "active" | "completed"`, one active per user |
| `workout_logs` | `WorkoutLog` @Model | `completed_at` stored as noon UTC |
| `set_logs` | `SetLog` @Model | Three parallel arrays: `set_states bool[]`, `effort_states text[]`, `weights numeric[]` |
| `exercise_swaps` | `ExerciseSwap` @Model | Per-position override of exercise name |
| `weight_logs` | `WeightLog` @Model | weight (lbs) + body_fat (%, nullable) + logged_at (date) |
| `feedback` | not mirrored | Submit-only, server-side |
| `access_requests` | not mirrored | Admin-only |
| `signup_codes` | not mirrored | Server-side only |

**Tables you can ignore entirely:**
- `hero_unlocks`, and the `hero_*` columns on `profiles` — leftovers from the abandoned game layer

### 4.4 RLS expectations

You don't need to write RLS policies (they exist). Just trust the server: every read returns only the current user's data (admins get all). Don't try to filter by user_id in Swift — RLS handles it. **But**: always pass `auth.uid()` correctly via the supabase-swift session.

---

## 5. Authentication

### 5.1 Two auth methods supported

1. **Sign in with Apple** (primary on iOS — required by Apple if you offer 3rd-party OAuth, which you don't, but SiwA is the obvious choice for an iOS-native app)
2. **Email magic link** (fallback for users who already exist via the web app)

### 5.2 Sign in with Apple → Supabase

Use `ASAuthorizationController` (AuthenticationServices framework) → get the Apple ID token → pass to `supabase.auth.signInWithIdToken(.apple, idToken)`.

```swift
// Pseudocode — full implementation per supabase-swift docs
import AuthenticationServices
import Supabase

func handleAppleSignIn(_ authorization: ASAuthorization) async throws {
    guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
          let identityToken = credential.identityToken,
          let tokenString = String(data: identityToken, encoding: .utf8)
    else { throw AuthError.invalidCredential }

    let session = try await supabase.auth.signInWithIdToken(
        credentials: .init(provider: .apple, idToken: tokenString)
    )
    // session.user.id matches profiles.id (server creates row via trigger if first login)
}
```

### 5.3 Email magic link

Use `supabase.auth.signInWithOtp(email:)` — Supabase emails a link. The link uses a custom URL scheme (`treno://auth-callback?token=...`) that you handle via SwiftUI's `onOpenURL`.

Configure the URL scheme in Info.plist + add the redirect URL in Supabase Auth settings.

### 5.4 First-login flow

After successful auth:
1. Fetch `profiles` row (might be auto-created by Supabase trigger on first sign-in — confirm with Kalyan)
2. If `profile.intake_completed == false` → present Intake flow
3. Else → DashboardView

### 5.5 Session persistence

`supabase-swift` handles token refresh automatically. Tokens stored in iOS Keychain via the SDK's default persistence.

---

## 6. Data model (Codable + SwiftData mirrors)

### 6.1 Profile

```swift
@Model
final class Profile {
    @Attribute(.unique) var id: UUID            // auth.users.id
    var fullName: String?
    var role: String                            // "user" | "admin"
    var goal: String?                           // "cut" | "bulk" | "maintain" | "athletic_performance"
    var experience: String?                     // "beginner" | "intermediate" | "advanced"
    var daysPerWeek: Int?
    var equipment: String?
    var limitations: String?
    var weightCurrent: Double?
    var weightTarget: Double?
    var intakeCompleted: Bool
    var createdAt: Date
    var syncedAt: Date?

    init(from row: ProfileRow) { /* map */ }
}

// Codable for API
struct ProfileRow: Codable {
    let id: UUID
    let full_name: String?
    let role: String
    let goal: String?
    let experience: String?
    let days_per_week: Int?
    let equipment: String?
    let limitations: String?
    let weight_current: Double?
    let weight_target: Double?
    let intake_completed: Bool
    let created_at: Date
}
```

### 6.2 Program (with JSONB structure)

The `programs.structure` column is JSONB. Here's the full shape — decode it as nested Codable.

```swift
@Model
final class Program {
    @Attribute(.unique) var id: UUID
    var name: String
    var programDescription: String?
    var durationWeeks: Int
    var daysPerWeek: Int
    var goalTag: String?
    var difficulty: String?            // "beginner" | "intermediate" | "advanced"
    var isActive: Bool
    var structureData: Data            // JSON-encoded ProgramStructure
    var createdAt: Date
    var syncedAt: Date?

    var structure: ProgramStructure {
        try! JSONDecoder().decode(ProgramStructure.self, from: structureData)
    }
}

struct ProgramStructure: Codable {
    let weeks: [Week]
    let swap_options: [String: [SwapOption]]   // key is swap_category

    struct Week: Codable {
        let label: String
        let rep_note: String?                  // HTML allowed (e.g., "<b>Base.</b> ...")
        let days: [Day]
    }

    struct Day: Codable {
        let title: String                      // e.g., "Push A — Chest · Shoulders · Triceps"
        let sub: String?                       // e.g., "Day 1 — Push A"
        let groups: [Group]
    }

    struct Group: Codable {
        let name: String                       // e.g., "CHEST" (display label, not a muscle source!)
        let exercises: [Exercise]
    }

    struct Exercise: Codable {
        let name: String
        let sets: Int
        let reps: String                       // string — supports ranges "8-12"
        let note: String?
        let swap_category: String?             // canonical: "chest_multi", "legs_single", etc.
    }

    struct SwapOption: Codable {
        let name: String
        let note: String?
    }
}
```

**Critical:** the muscle a workout trains comes from `exercise.swap_category`, NOT from `group.name`. See `web: src/lib/muscles.js` and the `CATEGORY_TO_MUSCLE` mapping. Port that mapping to Swift exactly.

### 6.3 ProgramAssignment

```swift
@Model
final class ProgramAssignment {
    @Attribute(.unique) var id: UUID
    var userId: UUID
    var programId: UUID
    var startDate: Date
    var assignedAt: Date
    var assignedBy: UUID?
    var status: String                         // "active" | "completed"
    var syncedAt: Date?

    @Relationship var program: Program?
}
```

Constraint: at most one assignment per user has `status == "active"`. The DB enforces this with a partial unique index. When a user switches programs, the existing active row is set to "completed" first, then a new "active" row is inserted.

### 6.4 WorkoutLog

```swift
@Model
final class WorkoutLog {
    @Attribute(.unique) var id: UUID
    var userId: UUID
    var programId: UUID
    var weekIndex: Int
    var dayIndex: Int
    var dayTitle: String?
    var muscleGroups: [String]                 // canonical names from CATEGORY_TO_MUSCLE
    var completedAt: Date                      // stored as noon UTC for timezone safety
    var syncedAt: Date?
}
```

**Timezone gotcha (from F023 in `web: FIXES.md`):** `completedAt` is stored at noon UTC of the workout date. When computing "days since last trained", clamp the result to `max(0, ...)` to avoid -1 edge cases for workouts logged before noon UTC on the same day.

### 6.5 SetLog

The most complex table — three parallel arrays per exercise position.

```swift
@Model
final class SetLog {
    @Attribute(.unique) var id: UUID
    var userId: UUID
    var programId: UUID
    var weekIndex: Int
    var dayIndex: Int
    var groupIndex: Int
    var exerciseIndex: Int
    var setStates: [Bool]                      // done / not done per set
    var effortStates: [String?]                // "easy" | "medium" | "hard" | nil per set
    var weights: [Double?]                     // weight per set (lbs); nil = not recorded
    var updatedAt: Date
    var syncedAt: Date?
}
```

**Per-set arrays must stay aligned**: if exercise has 4 sets, all three arrays have length 4.

### 6.6 ExerciseSwap

```swift
@Model
final class ExerciseSwap {
    @Attribute(.unique) var id: UUID
    var userId: UUID
    var programId: UUID
    var weekIndex: Int
    var dayIndex: Int
    var groupIndex: Int
    var exerciseIndex: Int
    var swapName: String                       // user's chosen replacement name
    var syncedAt: Date?
}
```

The swap is keyed by exercise position. When rendering a workout, check for a swap row matching `(week, day, group, exercise)` and substitute the name.

### 6.7 WeightLog

```swift
@Model
final class WeightLog {
    @Attribute(.unique) var id: UUID
    var userId: UUID
    var weight: Double                         // lbs
    var bodyFat: Double?                       // percent, nullable
    var loggedAt: Date                         // date only (no time component meaningful)
    var syncedAt: Date?
}
```

---

## 7. Core logic to port from web

These three files are 200 lines combined. Port them as-is to Swift; they're well-tested and define the product.

### 7.1 `src/lib/readiness.js` → `Readiness.swift`

Seven-state time-decay model: ramp up (days 0–3) → plateau (days 3–7) → decay (days 7+).

| Days since last trained | State | Color |
|---|---|---|
| Never | `untrained` | red |
| 0–1 | `sore` | red |
| 2 | `partial` | amber |
| 3–7 | `ready` | signal green |
| 8–10 | `stale` | amber |
| 11–14 | `neglected` | sky blue |
| 15+ | `detraining` | blue |

Port `READINESS_STATES`, `READINESS_PRIORITY`, and `getReadinessState(days)` exactly. The colors should reference your design tokens (see §9), not be hardcoded.

### 7.2 `src/lib/muscles.js` → `Muscles.swift`

```swift
let CANONICAL_MUSCLES = ["Chest", "Shoulders", "Triceps", "Back", "Traps", "Biceps", "Legs", "Calves", "Abs"]

let CATEGORY_TO_MUSCLE: [String: String] = [
    "chest_multi":  "Chest",
    "chest_single": "Chest",
    "shoulders":    "Shoulders",
    "triceps":      "Triceps",
    "back_multi":   "Back",
    "back_single":  "Back",
    "traps":        "Traps",
    "biceps":       "Biceps",
    "legs_multi":   "Legs",
    "legs_single":  "Legs",
    "calves":       "Calves",
    "abs":          "Abs",
]

func musclesFromDay(_ day: ProgramStructure.Day) -> [String] {
    var set: Set<String> = []
    for group in day.groups {
        for ex in group.exercises {
            if let cat = ex.swap_category, let m = CATEGORY_TO_MUSCLE[cat] {
                set.insert(m)
            }
        }
    }
    return Array(set)
}
```

### 7.3 PR detection (from `web: src/pages/Program.jsx`)

Per exercise position `(group_index, exercise_index)`, scan all prior `SetLog` rows for the same program + position. The historical max weight is the highest non-nil value across `weights[]` from those rows. If the current session's max weight exceeds it, it's a PR.

```swift
func detectPR(programId: UUID, gi: Int, ei: Int, currentWeights: [Double?], excluding currentLog: SetLog?) -> Bool {
    // Query prior SetLog rows for same program + position
    // Compare currentWeights.compactMap { $0 }.max() vs historical max
}
```

The `★ PR` badge appears on the exercise card while logging.

---

## 8. Workout logging — the most-used flow

This is the screen users will spend 90% of their time on. Get the UX right.

### 8.1 Entry point

From Dashboard's "Today's workout" card → tap → WorkoutView.

### 8.2 Layout (single screen, scrollable)

1. **Header:** week/day tabs (let the user navigate to a different day if they want)
2. **Day title + subtitle**
3. **Progress bar:** sets completed / sets total
4. **`⚙ Track effort + weight` toggle** — collapses/expands the optional rows
5. **For each exercise group:**
   - Group name (label)
   - For each exercise (collapsible card):
     - Header row: exercise name + `[YouTube ▶]` + `[Swap ⇄]` + sets×reps meta
     - Body (when expanded):
       - Optional note
       - **Row 1:** set chips (always shown — single tap toggles done)
       - **Row 2:** effort cells (only when "Track effort + weight" is on; tap cycles E → M → H → empty)
       - **Row 3:** weight inputs (only when "Track effort + weight" is on; numeric input per set)
       - Rest button + countdown timer

### 8.3 Critical UX rules (learned from web + v0 testing)

1. **Set chips are ALWAYS visible**, regardless of the track-more toggle. Done/undone is the minimum viable logging.
2. **Weight cascade:** typing a weight in set 1 cascades to all empty subsequent sets. **Critical bug we fixed in v0:** when the user types `60`, the cascade fires on `6` first, then doesn't update on `0` because the cells aren't empty anymore. **Fix:** also cascade to cells whose value matches the *old* value of the edited cell. Drop sets (cells with a different value) are preserved. See `web: src/pages/Program.jsx handleWeightChange()`.
3. **Rest timer:** 60s countdown. **Bug we fixed in v0:** once the timer hit "GO!", the start button was permanently blocked because `if (timers[key])` treated the string as truthy. **Fix:** only block restart when timer is actively counting (numeric value); auto-clear "GO!" after 3s. Even better in native: just kill the previous timer and start fresh on tap.
4. **Pre-fill weights** from the most recent prior session of the same exercise position. If no prior weight, leave empty.
5. **PR badge** appears live as the user types — recompute on every weight change.
6. **Swap modal:** filtered by `swap_category`; shows note for each option; "↩ Reset to original" reverts.
7. **Finish:** opens a date-picker modal (default today, allow back-dating). Stores `completed_at` as **noon UTC** of the chosen date. Inserts `WorkoutLog` row with `muscle_groups` derived via `musclesFromDay()`.

### 8.4 Save behavior

- **Set toggle:** save immediately on tap (debounce not needed — single tap intent is clear)
- **Effort cycle:** save immediately
- **Weight input:** save on blur, NOT on every keystroke (avoid hammering the server / sync queue)

Use SwiftData write + queue for sync. UI updates instantly from local state.

---

## 9. Design system

### 9.1 Source of truth

The brand is codified in:
- `web: src/index.css` — design tokens (CSS variables `--bg`, `--acc`, etc.)
- `BRAND.md` (in `/tmp/treno-design/treno-brand/BRAND.md` — get a copy from Kalyan, or pull from the design package)
- `web: src/components/marks.jsx` — Wordmark, Locomotive, MonogramT components (reference for SVG values)

Port the tokens into a Swift `Tokens.swift` file:

```swift
import SwiftUI

enum Tokens {
    enum Color {
        static let bg          = SwiftUI.Color(hex: 0x080809)
        static let surface     = SwiftUI.Color(hex: 0x101012)
        static let card        = SwiftUI.Color(hex: 0x141416)
        static let cardHi      = SwiftUI.Color(hex: 0x1a1a1d)
        static let border      = SwiftUI.Color(hex: 0x222226)
        static let border2     = SwiftUI.Color(hex: 0x2e2e34)
        static let text        = SwiftUI.Color(hex: 0xf2f2f2)
        static let muted       = SwiftUI.Color(hex: 0x5a5a66)
        static let muted2      = SwiftUI.Color(hex: 0x888892)
        static let accent      = SwiftUI.Color(hex: 0x39ff8a)   // signal green
        static let warn        = SwiftUI.Color(hex: 0xff9f38)
        static let danger      = SwiftUI.Color(hex: 0xff4747)
    }

    enum Type {
        // Bebas Neue — display, wordmark, hero titles
        // Syne — body, UI labels (consider replacing with SF Pro on iOS for native feel)
        // JetBrains Mono — data, dates, labels
        static func display(_ size: CGFloat) -> Font { .custom("BebasNeue-Regular", size: size) }
        static func body(_ size: CGFloat)    -> Font { .system(size: size) }    // SF Pro on iOS
        static func mono(_ size: CGFloat)    -> Font { .custom("JetBrainsMono-Regular", size: size) }
    }

    enum Spacing {
        static let unit: CGFloat = 4
        static let s4: CGFloat = 4
        static let s8: CGFloat = 8
        static let s12: CGFloat = 12
        static let s16: CGFloat = 16
        static let s20: CGFloat = 20
        static let s24: CGFloat = 24
        static let s32: CGFloat = 32
    }

    enum Radius {
        static let sm: CGFloat = 4
        static let md: CGFloat = 8
        static let lg: CGFloat = 10
        static let xl: CGFloat = 16
    }
}

extension SwiftUI.Color {
    init(hex: UInt32) {
        self.init(
            red:   Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >>  8) & 0xFF) / 255,
            blue:  Double(hex         & 0xFF) / 255
        )
    }
}
```

### 9.2 Fonts

Bundle `BebasNeue-Regular.ttf` and `JetBrainsMono-Regular.ttf` in `Resources/`. Register them in `Info.plist` under `UIAppFonts`. Both are open-source.

For body text, **strongly prefer SF Pro (system default)** over Syne — it's already on the device, looks more native, and supports all weights/styles. The web app uses Syne, but iOS conventions argue for system fonts in body copy. Check with Kalyan before making this swap, but it's recommended.

### 9.3 Brand marks

Reuse the SVG specs from `web: src/components/marks.jsx`. Recreate them as SwiftUI `Shape` types or as `Image` from rendered PNG assets.

| Mark | What | Use |
|---|---|---|
| **Wordmark** | "TRENO." with signal-green dot | Welcome screen, top of auth screens |
| **Locomotive** | 16×16 pixel sprite, faces right | Welcome screen animation |
| **MonogramT** | Pixel "T" | App icon (already generated PNG exists at `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` in `mobile-v0` branch — copy it) |

The wordmark spec from `BRAND.md`:
- Font: Bebas Neue, letter-spacing `0.08em`, all caps
- Trailing period in `#39ff8a` with `text-shadow: 0 0 0.18em #39ff8a` glow
- `margin-left: -0.04em` on the dot

### 9.4 Welcome screen (first-launch brand moment)

Spec is in `BRAND.md` and the working implementation is at `web: src/components/WelcomeScreen.jsx`. Recreate as a SwiftUI view that:
- Covers full screen
- Shows for `MIN_DISPLAY_MS` (start at 2000ms; tune)
- Layout (top to bottom):
  - "v1.0 · ALPHA" mono caps
  - TRENO. wordmark (large)
  - TRAIN › MOVE › FORWARD tagline
  - Locomotive sliding L→R across a 22-tie track (CSS keyframe animation port → SwiftUI `withAnimation` repeating)
  - Pulsing dots + LOADING caption
  - Footer: "[ Gr. trénο · locomotive ]"
- Fades out over 320ms once auth is resolved AND min display elapsed
- One-shot per app launch (do not re-show on logout/login)

### 9.5 App icon + native launch screen

- App icon source PNG (1024×1024) exists at `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` in `mobile-v0` branch. Copy it into your Xcode asset catalog. iOS handles all the smaller sizes from this.
- Native launch screen: use a static storyboard with `#080809` background and the locomotive sprite centered. Keep it minimal — the JS-side WelcomeScreen does the brand work after launch.

---

## 10. Screens (full v1 list)

Each screen has a corresponding web reference. Match the visual language; SwiftUI gives you natural improvements (haptics, native modals, native pickers).

| # | Screen | Web reference | Notes |
|---|---|---|---|
| 1 | Welcome | `src/components/WelcomeScreen.jsx` | First-launch brand moment |
| 2 | Login | `src/pages/Login.jsx` | Sign in with Apple primary, email magic link secondary |
| 3 | Request Access | `src/pages/RequestAccess.jsx` | Public request form (or skip in v1 — invite-only via web) |
| 4 | Intake (multi-step) | `src/pages/Intake.jsx` | Goal, experience, days/week, equipment, limitations, weight |
| 5 | Dashboard | `src/pages/Dashboard.jsx` | Today's workout card, muscle 9-grid, weight chart, stats, recent workouts |
| 6 | Program day (workout) | `src/pages/Program.jsx` | The big one. See §8. |
| 7 | Program switcher | `src/components/ProgramSwitcher.jsx` | Modal / sheet listing all programs |
| 8 | Weight log | `src/components/WeightSection.jsx` | Modal sheet, weight + body-fat input, date picker |
| 9 | About / training philosophy | `src/pages/About.jsx` | Static content + per-program cards |
| 10 | Retrospective | `src/pages/Retrospective.jsx` | Post-program completion screen, "Choose Next Program" CTA |
| 11 | Profile / settings | new for iOS | Sign out, manage HealthKit permissions, version info |
| 12 | Today (Watch) | new | Today's workout day-card; tap exercise → set chips |
| 13 | Active workout (Watch) | new | HKWorkoutSession running; tap-to-mark sets done; HR + ring credit |

### 10.1 Navigation pattern

Use `TabView` for the primary navigation:

| Tab | Icon | Screen |
|---|---|---|
| Train | dumbbell.fill | Dashboard (today's workout entry point) |
| Progress | chart.line.uptrend.xyaxis | Weight + workout history |
| About | book.fill | About / philosophy / programs |
| Profile | person.crop.circle.fill | Settings, sign out |

Admin tab hidden — admins go to web for admin tasks.

---

## 11. Apple Watch v1

### 11.1 Scope

| Feature | v1 | Why |
|---|---|---|
| Today's workout view (read) | ✅ | Glance at the day's exercises |
| Tap-to-mark-set-done (write) | ✅ | The Watch is for during-workout, between-sets |
| HKWorkoutSession (live HR + ring credit) | ✅ | Killer iOS-ecosystem feature |
| Weight input on Watch | ⬜ | Defer to v1.1 — keyboard on Watch is bad UX |
| Effort cycling on Watch | ⬜ | Defer (compress: just done/not-done is fine) |
| Exercise swap on Watch | ⬜ | Defer (do on iPhone before workout) |
| Voice "fifteen reps at one twenty-five" | ⬜ | Defer to v1.2 (Watch voice) |

### 11.2 Architecture

- **Shared models** via `TrenoShared` Swift Package — same SwiftData entities, same Codable structs, same Readiness/Muscles logic
- **Auth propagation:** iPhone signs in → Watch Connectivity transfers session token → Watch's `supabase-swift` instance picks it up
- **Sync:** Watch can read from local SwiftData immediately. Writes queue and either sync directly (if Watch has connectivity) or relay through iPhone via Watch Connectivity

### 11.3 HKWorkoutSession

```swift
import HealthKit

let workoutConfig = HKWorkoutConfiguration()
workoutConfig.activityType = .traditionalStrengthTraining
workoutConfig.locationType = .indoor

let session = try HKWorkoutSession(healthStore: store, configuration: workoutConfig)
let builder = session.associatedWorkoutBuilder()
builder.dataSource = HKLiveWorkoutDataSource(healthStore: store, workoutConfiguration: workoutConfig)

session.startActivity(with: Date())
try await builder.beginCollection(at: Date())

// On finish:
session.end()
try await builder.endCollection(at: Date())
let workout = try await builder.finishWorkout()
// workout has totalEnergyBurned, totalDistance, etc.
```

The session gives the user ring-closing credit, HR data in the workout summary, and a proper entry in the Health app.

---

## 12. HealthKit integration

### 12.1 Permissions to request

Request on first launch of relevant feature, not at app start:

| Type | Read | Write | When |
|---|---|---|---|
| `HKQuantityType(.bodyMass)` | ✅ | ⬜ (v1) | When user opens Weight log |
| `HKQuantityType(.activeEnergyBurned)` | ✅ | ⬜ | Read into workout sessions only |
| `HKQuantityType(.heartRate)` | ✅ | ⬜ | During HKWorkoutSession |
| `HKWorkoutType` | ⬜ | ✅ | When workout finishes |

### 12.2 Reading body weight

On Weight log open, query the most recent `bodyMass` sample. Pre-fill the input. Let the user override before saving.

```swift
let store = HKHealthStore()
let weightType = HKQuantityType(.bodyMass)
let predicate = HKQuery.predicateForSamples(withStart: nil, end: Date(), options: .strictEndDate)
let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
let query = HKSampleQuery(sampleType: weightType, predicate: predicate, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
    if let sample = samples?.first as? HKQuantitySample {
        let kg = sample.quantity.doubleValue(for: .gramUnit(with: .kilo))
        let lbs = kg * 2.20462
        // pre-fill input with lbs
    }
}
store.execute(query)
```

### 12.3 Writing workout sessions

On workout finish (the "Finish" button on Watch or iPhone Workout view):
- Build an `HKWorkout` via `HKWorkoutBuilder`
- Activity type: `.traditionalStrengthTraining`
- Duration: end - start
- (Optional) Add `HKWorkoutEvent` markers for each set if you want fine-grained data

Save via `HKHealthStore.save(_:)`.

---

## 13. Build phases

Each phase is 1–2 weeks. Each ships a working target (no big-bang final integration). Acceptance criteria per phase listed below.

| Phase | Duration | Deliverable |
|---|---|---|
| **0 — Bootstrap** | 1 week | New `project-k-ios` repo, Xcode project, iOS + watchOS targets, supabase-swift SPM, Tokens.swift, MonogramT app icon, SwiftUI navigation skeleton (TabView with empty tabs), runs on simulator |
| **1 — Auth** | 1 week | Sign in with Apple working end-to-end; email magic link working; session persists across app restarts; sign-out flow |
| **2 — Intake + Profile** | 1 week | Multi-step intake form; on submit, write `Profile` row; auto-assign trigger fires server-side; if intake_completed, skip to Dashboard |
| **3 — Sync engine + Dashboard read** | 2 weeks | SwiftData models for all tables; sync engine pulls down `programs`, `program_assignments`, `workout_logs`, `weight_logs`; Dashboard renders muscle-readiness 9-grid, weight chart, recent workouts, streak |
| **4 — Workout logging** | 2 weeks | Workout view per §8; set chips, effort cycling, weight inputs, rest timer, exercise swap, finish with date picker; PR detection live; writes to `set_logs` + `workout_logs`; sync queue; offline writes |
| **5 — Programs surface** | 1 week | Program switcher; About page; Retrospective screen on program completion |
| **6 — Weight tracking** | 3 days | Weight log modal; HealthKit pre-fill from Health app's most recent bodyMass; Swift Charts dual-axis weight + BF% |
| **7 — Polish** | 1 week | Welcome screen, splash refinement, haptics on set complete + workout finish, pull-to-refresh, error handling, offline detection banners, accessibility (VoiceOver, Dynamic Type) |
| **8 — Apple Watch** | 2–3 weeks | Watch target activated; shared models via `TrenoShared` Swift Package; Watch Connectivity for session/auth propagation; Today view; tap-to-mark-set-done; HKWorkoutSession + HR + ring credit |
| **9 — TestFlight + iteration** | 1 week | Beta with 5–10 testers; collect crashes via Xcode Organizer; fix top issues |
| **10 — App Store submission** | 3 days | App Store Connect metadata, screenshots, app review notes, demo account credentials, Sign in with Apple notes for review |

**Total: ~12–14 weeks.**

---

## 14. Acceptance criteria per phase

### Phase 0
- [ ] `project-k-ios` repo created, gitignored properly (`xcuserdata`, `.DS_Store`, etc.)
- [ ] Xcode project has iOS + watchOS targets, both build for simulator
- [ ] supabase-swift SPM dependency added
- [ ] App icon installed (the MonogramT pixel-T)
- [ ] TabView shell with 4 empty tabs renders
- [ ] Tokens.swift has every color/font/spacing from design system

### Phase 1
- [ ] Tap "Sign in with Apple" → iOS modal → returns to app authenticated
- [ ] Email magic link → email arrives → tapping link opens app authenticated
- [ ] Sign out clears session; relaunching app shows Login
- [ ] Session persists across cold launches without re-auth

### Phase 2
- [ ] First-time user sees Intake; cannot skip to Dashboard
- [ ] Intake submits successfully; profile row in Supabase has all fields
- [ ] Auto-assign trigger fires; user has an active program assignment after intake
- [ ] Returning user goes straight to Dashboard

### Phase 3
- [ ] Cold launch with cached SwiftData renders Dashboard in <300ms
- [ ] Background sync updates the cache after Supabase fetch
- [ ] Offline mode: app loads with cached data, no errors, banner shown
- [ ] Muscle 9-grid shows correct readiness state per muscle, sorted by priority
- [ ] Weight chart matches the web app's dual-axis treatment

### Phase 4
- [ ] Tap-to-toggle set chip writes to SwiftData immediately, syncs to Supabase within 5s online
- [ ] Weight cascade works correctly (re-test the `60` → all-cells `60` bug; verify drop sets preserved)
- [ ] Rest timer can be started multiple times in a row
- [ ] PR badge appears live as user types a weight that exceeds the historical max
- [ ] Exercise swap modal lists category-filtered options; selection persists
- [ ] Finish workout: date picker → noon-UTC `completed_at` written; muscle_groups derived correctly
- [ ] Offline workout logging works; writes sync on reconnect

### Phase 5
- [ ] Program switcher lists all 12 programs; switching marks current as completed and inserts new active
- [ ] About page renders the same content as the web app
- [ ] On "Mark as Complete" flow, Retrospective screen shows days-trained, weight delta, BF% delta

### Phase 6
- [ ] Weight log opens with most recent HealthKit `bodyMass` pre-filled
- [ ] Saving weight inserts row, updates chart immediately
- [ ] Body fat is optional and nullable

### Phase 7
- [ ] Welcome screen plays on cold launch, dismisses after auth resolves + min duration
- [ ] Haptic on set complete (`UIImpactFeedbackGenerator(.light)`)
- [ ] Haptic on workout finish (`UINotificationFeedbackGenerator(.success)`)
- [ ] Pull-to-refresh on Dashboard re-syncs from Supabase
- [ ] VoiceOver labels every interactive element correctly
- [ ] Dynamic Type works at largest accessibility size without layout breaking

### Phase 8
- [ ] Watch app launches; reads cached data from SwiftData
- [ ] Watch shows today's workout; tap-to-mark-set-done writes locally and propagates to iPhone
- [ ] HKWorkoutSession starts on workout begin; ends on workout finish; session appears in Health app with HR + active energy
- [ ] Ring credit awarded for workout duration

### Phase 9
- [ ] At least 5 internal testers using TestFlight build for >7 days
- [ ] Crash-free sessions >99% (per Xcode Organizer)
- [ ] Top 3 reported issues fixed

### Phase 10
- [ ] App Store Connect listing complete (description, keywords, screenshots, support URL, privacy policy URL)
- [ ] Demo account credentials supplied to App Review
- [ ] Sign in with Apple compliance notes added
- [ ] Health usage descriptions clear in Info.plist
- [ ] App passes review

---

## 15. Testing

### 15.1 Unit tests (XCTest)

**Cover at minimum:**
- `Readiness.getReadinessState(days:)` — every state boundary
- `Muscles.musclesFromDay(_:)` — all 12 swap categories → correct muscle, no duplicates
- PR detector — known historical max, verify true/false correctly
- Weight cascade logic — the `60` regression test
- Sync engine round-trip — local write → push → pull → local read returns same value

### 15.2 Snapshot / UI tests

Optional but useful:
- Welcome screen layout
- Dashboard layout with mocked data
- Workout view at various states (empty, mid-workout, complete)

Use [swift-snapshot-testing](https://github.com/pointfreeco/swift-snapshot-testing) if you want this — or just rely on visual review during development.

### 15.3 Manual test plan (every release)

1. Fresh install → cold launch → Welcome plays
2. Sign in with Apple → reaches Dashboard or Intake
3. Complete a workout end-to-end, including effort + weights + swap + rest timer + finish
4. Force-quit and re-open: data persists
5. Airplane mode: log a set; turn airplane off; verify it synced
6. Weight log: pre-fill from Health; save; chart updates
7. Watch: complete a workout; verify HKWorkoutSession in Health app

---

## 16. App Store submission

### 16.1 Account & identity

- Apple Developer account: existing (Kalyan Pentapalli, individual). No team setup needed.
- Bundle ID: `com.kpentapalli.projectk.native` (suggested — register at developer.apple.com)
- App Store Connect record: create new, name "Treno" (NOT "Project K: Treno" — that's the Capacitor v0 placeholder)

### 16.2 Required metadata

- App name (what shows in App Store): **Treno**
- Subtitle (30 chars): something like "Strength training that fits"
- Promotional text (170 chars): one-paragraph hook
- Description (4000 chars): TBD with Kalyan
- Keywords (100 chars, comma-separated)
- Support URL, marketing URL, privacy policy URL
- Categories: Health & Fitness (primary), Sports (secondary)
- Age rating: 4+

### 16.3 Screenshots

Required sizes (iOS 17+):
- 6.7" iPhone (15 Pro Max): 1290×2796
- 6.5" iPhone (XS Max / 11 Pro Max — kept for back-compat in App Store): 1242×2688
- iPad Pro 13": 2064×2752 (only if iPad-supported; v1 is iPhone-first, can skip iPad)

Take from a real device or simulator. Show: Dashboard, Workout view, Weight chart, Welcome screen.

### 16.4 Privacy

Apple requires a privacy nutrition label. Declare:
- Data linked to user: email (auth), body weight, body fat, workout history
- Data NOT linked: none
- Data used for tracking: none

Privacy policy URL is required. Kalyan will draft.

### 16.5 Review notes

- App is invite-only — provide a working test account
- Mention HealthKit usage and specific data types
- Mention Sign in with Apple is implemented

### 16.6 HealthKit declaration

Info.plist requires:
- `NSHealthShareUsageDescription`: "Treno reads your body weight to pre-fill the weight log and uses heart rate during workout sessions."
- `NSHealthUpdateUsageDescription`: "Treno saves completed workout sessions to Apple Health for ring credit."

---

## 17. Critical files & references

### 17.1 Existing codebase (read these before starting)

| File | What | Why |
|---|---|---|
| `MOBILE_PRD.md` | Strategic vision, market positioning | Read once for context |
| `SPEC.md` | Web app's product spec | Source of feature parity for v1 |
| `MOBILE_PIVOT_PLAN.md` | Why Capacitor v0 exists | Context on what NOT to repeat |
| `supabase/schema.sql` | Full DB schema + RLS | Your data model bible |
| `supabase/seed-programs-v2.sql` | 3 newer programs | Example program JSONB |
| `supabase/seed-sport-programs.sql` | 5 sport-specific programs | Example sport program JSONB |
| `src/lib/readiness.js` | 7-state readiness model | Port to Swift |
| `src/lib/muscles.js` | swap_category → muscle mapping | Port to Swift |
| `src/contexts/AuthContext.jsx` | Auth pattern (note F019 fix re: getSession) | Reference for Swift auth |
| `src/pages/Program.jsx` | Workout logging — the most complex component | Recreate in SwiftUI |
| `src/pages/Dashboard.jsx` | Dashboard composition | Recreate in SwiftUI |
| `src/components/WeightSection.jsx` | Weight log + dual-axis chart | Recreate with Swift Charts |
| `src/components/marks.jsx` | Brand marks (Wordmark, Locomotive, MonogramT) | Recreate in SwiftUI |
| `src/components/WelcomeScreen.jsx` | Welcome animation | Recreate in SwiftUI |
| `src/index.css` | Design tokens | Source for `Tokens.swift` |
| `BRAND.md` | Brand spec (in design package) | Read once for visual identity |
| `FIXES.md` | 21+ bug fixes with root causes | Avoid re-introducing fixed bugs |

### 17.2 External docs

- [supabase-swift](https://github.com/supabase/supabase-swift) — README + examples
- [SwiftData docs](https://developer.apple.com/documentation/swiftdata)
- [Swift Charts](https://developer.apple.com/documentation/charts)
- [HKWorkoutSession](https://developer.apple.com/documentation/healthkit/hkworkoutsession)
- [Sign in with Apple integration with Supabase](https://supabase.com/docs/guides/auth/social-login/auth-apple)

### 17.3 Live URLs

- Web app: https://project-k-ten-mu.vercel.app
- Repo: https://github.com/kpentapalli/project-k
- Capacitor v0 (TestFlight Internal Only): "Project K: Treno" via Apple TestFlight (Kalyan can invite)

### 17.4 Brand assets to copy from `mobile-v0` branch

- `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` — 1024×1024 app icon (use as-is)
- `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png` — splash with locomotive (use as-is or recreate)

---

## 18. Open questions for Kalyan before starting

These should be answered before Phase 0 work begins:

1. **Repo:** new `project-k-ios` repo, or subdirectory `ios-native/` in this monorepo? (Recommendation: new repo.)
2. **Bundle ID:** confirm `com.kpentapalli.projectk.native` (or pick another).
3. **Body font:** swap Syne for SF Pro on iOS body copy? (Recommendation: yes.)
4. **Email magic link:** is email auth still needed in v1, or can we go Sign-in-with-Apple-only? (Recommendation: keep email for users who already exist via web invite.)
5. **Watch UI complexity:** what's the bare-minimum Watch surface? (Recommendation: Today view + tap-to-mark-set-done + HKWorkoutSession only. No effort, no weight input on Watch in v1.)
6. **Custom programs:** confirm web admin remains the only program-builder surface; iOS reads only.
7. **Test account for App Review:** create a dedicated demo account with sample data before submission.
8. **Sport programs in v1:** include the 5 sport programs (Swim/Run/Cycle/Golf/Tennis) in the v1 catalog, or hold for v1.1? (Recommendation: include — they're already authored and assigned via admin.)

---

## 19. Don'ts (lessons from prior work)

- **Do not reintroduce the Knight/Queen mascot or any game/XP layer.** It was tried in Capacitor v0 and abandoned. See [MOBILE_PIVOT_PLAN.md](MOBILE_PIVOT_PLAN.md). The decision is final.
- **Do not modify the Supabase schema.** Schema changes go through the web team / Kalyan.
- **Do not re-implement RLS in Swift.** Trust the server. Supabase enforces it.
- **Do not store the service role key in the iOS app.** Anon key only.
- **Do not use `Capacitor.isNativePlatform()` checks or any Capacitor-specific code.** This is native — no webview.
- **Do not invent new design tokens.** If a color/font/spacing isn't in `Tokens.swift`, add it there first.
- **Do not skip the welcome screen.** It's the brand moment users remember.
- **Do not skip offline support in the workout view.** Users will lose connection in basement gyms; logging must work.
- **Do not add Combine for new code.** Async/await + Observation framework only.
- **Do not call `getSession()` in addition to `onAuthStateChange`.** See `web: AuthContext.jsx` comment about F019 — the same race exists in any client SDK.

---

## 20. Definition of done (v1)

The iOS app is "done" and ready to submit to App Store when:

1. All 10 phases above complete with their acceptance criteria checked
2. App is on TestFlight with at least 5 internal testers using it for 7+ days
3. Crash-free rate >99% per Xcode Organizer
4. All P0 / P1 bugs from internal testing fixed
5. App Store Connect listing fully populated and screenshots uploaded
6. Privacy policy URL live and accurate
7. Apple Developer Program agreement is in good standing
8. App Review feedback (if any) addressed
9. Build is signed with Distribution certificate (not Development)
10. Kalyan signs off on the final build before submission

---

*End of handoff document. Questions: kpentapalli@gmail.com.*
