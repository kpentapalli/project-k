# Project K — Mobile App PRD (Lite)

> **Status:** Planning · Pre-build
> **Last updated:** 2026-04-29
> **Owner:** Kalyan
> **Mode:** Strategic direction + mobile build path. Not engineering spec.

---

## 1. Vision

Take the current Project K web app to the iOS App Store as a **plain workout app for v1**, then layer sport-specific content + Apple Watch + voice logging in v1.1+. Users follow curated strength programs at their own pace, with full integration into the Apple Fitness ecosystem (HealthKit writes, ring credit, Apple Sign-In).

Two strategic shifts shape the long-term direction:

1. **Sport-specific positioning** (post-v1) instead of generic strength training — content track, not platform track.
2. **Completion-based pacing** instead of calendar-based programs — users finish when they finish.

Mobile (iOS) is the launch surface because fitness is a phone-in-hand activity and App Store presence is a credibility signal for non-technical users.

---

## 2. Strategic Direction

### 2.1 Sport-Specific Pivot (post-launch, v1.1+ content track)

Most fitness apps are generic strength loggers. The eventual wedge: **a consumer app for amateur athletes** — recreational tennis player, weekend basketball league, weekend skier, marathon trainee — where the program is designed around the sport they play.

| Existing landscape | Status |
|---|---|
| B2B / pro-level (Volt, TrainHeroic) | Not consumer-friendly, expensive |
| Single-sport apps (Runna, NRC) | Focused on the sport itself, not strength + injury prevention |
| Generic strength apps (Hevy, Strong, Fitbod) | No sport context |
| Mobility niche (Pliability, GOWOD) | Single-purpose, narrow |

**v1 launch ships as plain workout app (current Project K functionality).** Sport-specific content is authored in parallel as a content track — programs drafted with LLM assistance, reviewed by sports PTs, validated with real users — and ships as a v1.1+ in-app expansion. This decouples the platform launch from the content lift.

### 2.2 Completion-Based Pacing (the core behavioral insight)

Most users miss workouts. Designing around miss-free attendance is designing for fiction. A 6-week program completed in 12 weeks is still valuable.

| Today (calendar-based) | Proposed (completion-based) |
|---|---|
| "Week 3, Day 2" | "Workout 8 of 18" |
| "You missed Wednesday" | (nothing — there is no Wednesday) |
| Program duration: 6 weeks | Recommended pace: 3×/week (~6 weeks if consistent) |
| Streak = consecutive days | Streak = consecutive workouts without skipping |
| Muscle readiness = days since chest | Same — biology doesn't care about your schedule |

**Consequence:** the previously-shelved Phase 3 items around incomplete-workout tracking and dynamic adjustment become **non-problems** under this model. There is no missed workout, only "not yet completed."

### 2.3 Hidden LLM as Authoring Tool

The product ships **pre-built, human-curated programs only** — no exposed LLM/chat interface to the user. LLM use is restricted to **internal authoring** (Claude helps draft programs that are reviewed/edited before publishing). This lets you produce 100+ workouts in weeks instead of months while keeping the user-facing product predictable, safe, and reviewable.

Rationale for hiding it: trust, safety, App Store review tractability, and the fact that exposing freeform AI generation in a fitness app introduces injury liability concerns and quality variance.

---

## 3. v1.1+ Sport Catalog (post-launch content track)

Cannot ship 12 sports well. Initial sport content track = **3 program sets covering 4 sports**, ~9 programs total (3 sports × 3 levels), ~120–160 unique workouts authored.

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

## 5. Mobile Platform Decision

### 5.1 Capacitor (recommended) over React Native

| Path | Effort | When it makes sense |
|---|---|---|
| **Capacitor** | ~2 weeks to App Store submission | Reuses 100% of existing React + Vite code as a webview app. Native plugins for push, biometrics, HealthKit. |
| React Native + Expo | ~2–3 months | Full UI rewrite. Worth it only if native-quality interactions or shared iOS+Android polish is critical. |
| PWA only | ~1–2 days | No App Store presence — ruled out by product requirement. |
| Native Swift/SwiftUI | Months | Overkill for a logging-shaped app. |

**Conclusion:** Capacitor for iPhone. Apple Watch (when added) requires a native Swift/SwiftUI watchOS app added to the same Xcode project — Capacitor doesn't generate watchOS targets.

### 5.2 What this means for the codebase

The existing project is **unusually well-suited** for Capacitor:

```
React 18 + Vite 6 + React Router 7 + Supabase + 2 Vercel serverless functions
~10 source files. No canvas/WebGL/realtime/heavy graphics.
Already mobile-responsive.
```

Browser API usage is minimal and webview-compatible:

| API | Locations | Webview status |
|---|---|---|
| `localStorage` | `Program.jsx` (intro flag, settings) | ✅ Works (with persistence note — see §7) |
| `window.location` | `ProtectedRoute.jsx`, `Login.jsx` | ✅ Works (with one redirect adjustment — see §7) |
| `navigator.clipboard` | `Admin.jsx` | ✅ Works |

No rewrites required. Only targeted adjustments listed in §7.

### 5.3 Single repo, two deploy targets

Capacitor enables a single GitHub repo with two distribution channels from the same codebase:

```
project-k/  (single GitHub repo, single Vercel deploy)
├── src/                    ← React app, shared between web and iOS
├── api/                    ← Vercel serverless (used by both)
├── public/                 ← Web assets, manifest
├── ios/                    ← Generated Xcode project (added by Capacitor)
├── capacitor.config.json   ← App ID, web dir, plugin config
├── vite.config.js          ← Modified: `base: './'` for webview
└── package.json            ← Add @capacitor/core, @capacitor/cli, @capacitor/ios
```

| Target | How updates flow |
|---|---|
| **Web (Vercel)** | `git push origin main` → Vercel auto-deploys → live in ~30 seconds |
| **iOS (App Store)** | `npm run build && npx cap sync ios` → open Xcode → Archive → upload → Apple review (1–7 days) |

**Live Updates (OTA)** — Capacitor supports OTA updates for the JS/CSS bundle (anything in your React app), bypassing Apple review for non-native changes. Free options exist (`@capacitor/live-updates`, Capgo). This is what makes "one codebase, two deploys" actually pleasant — without OTA, every UI tweak requires a 1–7 day review cycle.

**Branch strategy:** `main` is the source for both. iOS submissions tagged (`v1.0.0-ios`, `v1.0.1-ios`). No iOS-specific branch — use `Capacitor.getPlatform()` for runtime branches when needed.

---

## 6. Build Phases

Each phase is independently shippable. v1 is plain workout app on iPhone. Sport content + watch + voice are layered after.

| Phase | Scope | Effort |
|---|---|---|
| **Phase 0 — Capacitor scaffolding + first build** | Install Capacitor, generate iOS project, configure Vite for webview, run in iOS Simulator | ~1 day |
| **Phase 1 — App Store submission baseline (v1)** | Apple Developer account, bundle ID, app icon, splash, safe-area, bottom tab bar, Apple Sign-In, account-deletion flow, privacy policy + support URL, metadata, screenshots, reviewer demo code | ~5–7 days |
| **Phase 2 — Mobile-native polish (v1)** | Biometric login, Universal Link for password reset, persistent Supabase session via `@capacitor/preferences`, native status bar | ~3–4 days |
| **Phase 3 — HealthKit on iPhone (Phase H1; v1)** | Write workouts to HealthKit, read body weight + body fat to auto-populate weight log | ~2–3 days |
| **Phase 4 — File-size refactor pre-mobile** | Break `Program.jsx` (~700 lines) and `Admin.jsx` (~550 lines) into smaller cohesive files. AI-readability (see §16). | ~1–2 days |
| **Phase 5 — Voice for weight entry (Phase V1; v1.1)** | Web Speech API hands-free weight input | ~2 days |
| **Phase 6 — Sport content track (v1.1+)** | v1 sport catalog programs authored, PT-reviewed, published via admin. No code changes after intake/auto-assign rewire. | ~3–4 weeks (mostly content) |
| **Phase 7 — Apple Watch app (Phase V3 + H2; v1.2+)** | Native SwiftUI watchOS target, HKWorkoutSession live tracking, tap-through-sets, Watch Connectivity sync | ~2–4 weeks |
| **Phase 8 — Voice freestyle logging (Phase V2; v1.2+)** | Voice → transcript → LLM-structured workout_log via `/api/structure-workout` | ~5–7 days |
| **Phase 9 — Voice on watch (Phase V4; v1.3+)** | Watch dictates sets, structures via backend, persistent confirmation UI | ~1–2 weeks |
| **Phase 10 — Multi-segment workouts (Phase H3; v1.3+)** | Warmup + strength + cooldown as sequential HKWorkoutSessions | ~2–3 days |

**v1 to App Store: ~2 weeks of focused work.** Subsequent phases ship as updates (OTA-eligible for non-native changes, full submission for native additions).

---

## 7. Codebase Adjustments Required

Specific touch-points where existing code needs changes for mobile.

| # | Issue | Location | Fix |
|---|---|---|---|
| 1 | Password reset `redirectTo` uses `window.location.origin` which is `capacitor://localhost` in webview | `Login.jsx:40` | Use Universal Link (HTTPS URL routed back to app via `apple-app-site-association`) — or short-term fall back to opening Safari |
| 2 | Supabase session uses `localStorage` which iOS may purge on app offload | Supabase client init | Configure custom storage adapter using `@capacitor/preferences` plugin |
| 3 | Vercel serverless functions called from web app | `api/invite.js`, `api/signup.js` | No backend changes. Mobile app calls same HTTPS endpoints. Verify all fetch calls use absolute URLs |
| 4 | Apple may reject invite-only apps with no demo path | Signup flow | Provide a permanent reviewer invite code (e.g., `APPLEREVIEW`) + include in App Store review notes |
| 5 | Microphone permission needed for voice features | `Info.plist` (Phase V1+) | Add `NSMicrophoneUsageDescription` with user-facing reason |
| 6 | HealthKit permissions needed for Apple Fitness integration | `Info.plist` (Phase H1+) | Add `NSHealthShareUsageDescription` + `NSHealthUpdateUsageDescription`; enable HealthKit capability in Xcode project |
| 7 | Apple Sign-In capability | Apple Developer + Xcode + Supabase Auth dashboard | Enable capability on App ID, create Service ID, generate `.p8` key, configure Supabase Apple provider |
| 8 | Large file sizes hurt AI-assisted dev | `Program.jsx` (~700 lines), `Admin.jsx` (~550 lines) | Refactor into smaller cohesive files, target 200–400 line max (see §16) |
| 9 | Account deletion flow | `Profile.jsx` or new screen + Supabase RPC | Apple **requires** in-app account deletion. New SECURITY DEFINER RPC cascades through user data |

---

## 8. Native Features (v1 scope)

Pick a v1 subset. Everything else can wait for v1.1+ updates.

### v1 (ships at first App Store submission)

| Feature | Effort | Notes |
|---|---|---|
| App icon + splash screen | 0.5 day | Required for submission |
| Safe-area + bottom tabs | 1 day | Native iOS expectation |
| Biometric login (Face ID) | 0.5 day | High polish, low effort |
| Universal Links (password reset) | 1 day | Polished auth |
| **Sign in with Apple** | 1 day | Native auth sheet via plugin → Supabase. Highly recommended (and Apple-policy aligned) |
| **HealthKit Phase H1** (iPhone write workouts, read weight/body fat) | 2–3 days | Real value: workouts in Apple Fitness, weight auto-pulls from Apple Health |
| Pull-to-refresh on dashboard | 0.5 day | Native expectation |

**v1 native scope: ~6–7 days** on top of Phase 0 and Phase 1 baseline.

### v1.1+ (subsequent updates)

| Feature | Effort | Notes |
|---|---|---|
| Voice for weight entry (V1) | 2 days | Web Speech API in webview, no backend |
| Push notifications | 2 days | Re-engagement nudges; needs server-side trigger logic |
| HealthKit Phase H2 (watch live session) | 3–5 days | Requires watchOS app first |
| Apple Watch app (V3) | 2–4 weeks | Native Swift; new platform |
| Offline workout logging | 3 days | Gym wifi often poor; queue + sync |
| Voice freestyle logging (V2) | 5–7 days | LLM-structured from transcript |
| Voice on watch (V4) | 1–2 weeks | Cooper's-Corner-style capture |
| HealthKit Phase H3 (multi-segment workouts) | 2–3 days | Warmup + strength + cooldown |

---

## 9. App Store Submission Requirements

Required for first submission. Treat this as a checklist.

### Account & identity
- [ ] Apple Developer Program membership ($99/yr; 1–2 day approval)
- [ ] Bundle ID chosen and locked (e.g., `com.kpentapalli.projectk`) — **permanent**
- [ ] App name (locked at submission; can be changed in updates but messy)

### Assets
- [ ] App icon — 1024×1024 source PNG, no transparency
- [ ] Splash screen image
- [ ] Screenshots — multiple device sizes (6.7", 6.1", 5.5" iPhone)
- [ ] Optional preview video

### Metadata
- [ ] Tagline (under 30 chars)
- [ ] Description (4000 chars; first 3 lines matter most)
- [ ] Keywords (100 chars total, comma-separated)
- [ ] Category: Health & Fitness
- [ ] Age rating (likely 12+)
- [ ] Promotional text (170 chars, updatable without re-review)

### Compliance
- [ ] Privacy policy URL (host on Vercel as `/privacy` route)
- [ ] Support URL (host on Vercel as `/support` route)
- [ ] Privacy nutrition labels — declare email, weight, workout data, link-to-identity status, **HealthKit reads + writes**
- [ ] **Account deletion flow** (Apple requirement) — in-app delete-my-account button, not just email-us. New Supabase RPC needed
- [ ] Demo account credentials for reviewer (use the permanent reviewer invite code from §7)

### HealthKit-specific (added at v1)
- [ ] HealthKit capability enabled in Xcode project
- [ ] `NSHealthShareUsageDescription` in `Info.plist` — user-facing reason for reading body weight + body fat
- [ ] `NSHealthUpdateUsageDescription` in `Info.plist` — user-facing reason for writing workouts
- [ ] Privacy policy explicitly mentions HealthKit data is **never used for advertising or sold to third parties** (Apple policy requirement)
- [ ] App Store review notes justify each HealthKit data type (Apple sometimes asks)
- [ ] Account deletion handles HealthKit data disconnection (data stays in Apple Health; your app's writes can be revoked)

### Sign in with Apple (added at v1)
- [ ] Sign in with Apple capability enabled on App ID
- [ ] Service ID created in Apple Developer
- [ ] `.p8` signing key generated and securely stored
- [ ] Supabase Auth dashboard configured: Team ID, Service ID, Key ID, key contents
- [ ] "Hide My Email" handling — backend tolerates Apple's relay email format

### Code signing
- [ ] Distribution certificate (Xcode handles)
- [ ] Provisioning profile (Xcode handles)
- [ ] Push notification entitlement if shipping push in v1

---

## 10. Design Decisions to Lock Before Code

These shape downstream work. Decide first.

### Branding & identity
- [ ] App name (Project K stays for v1; sport-themed rename considered for v1.1+ if positioning shifts)
- [ ] Logo / icon design direction
- [ ] Primary color + accent for status bar + system UI
- [ ] Typography continuation (Bebas Neue + Syne already in use)

### Mobile UX patterns
- [ ] Bottom tab labels — proposed: Home / Workout / Progress / Profile
- [ ] Safe-area handling strategy
- [ ] Modal vs full-screen sheet for Workout flow
- [ ] Pull-to-refresh on which surfaces

### Auth
- [x] **Sign in with Apple — yes for v1** (decided 2026-04-29; native plugin → Supabase)
- [ ] Keep invite-code-only signup, or add open signup for App Store launch?
- [ ] Apple "Hide My Email" handling — confirm backend gracefully accepts forwarding addresses

### Apple ecosystem
- [x] **HealthKit Phase H1 in v1** (decided 2026-04-29; iPhone write workouts + read weight)
- [ ] HealthKit Phase H2 (watch live sessions) — defer to v1.2+ when watchOS app exists
- [ ] Apple Watch primary use case — see §13 open question

### Sport pivot specifics (post-launch content track)
- [ ] Confirm initial sports (recommended: Pickleball/Tennis + Golf + Running)
- [ ] Lock level descriptions (§4 draft is a starting point)
- [ ] Decide initial program count target (recommended: 9 programs covering 4 sports)
- [ ] Decide who reviews program content (sports PT? S&C coach? self-curated with research backing?)

---

## 11. Sequence: Ship First, Pivot Second (DECIDED 2026-04-29)

| Option | Pros | Cons | Decision |
|---|---|---|---|
| A. Ship Project K as-is (no sport pivot ever) | Fastest; locks in current product | Misses the sport-specific differentiation | Rejected |
| B. Pivot first, then ship | Launches with the version you actually want to sell | Longer to launch; content lift before user feedback | Rejected |
| **C. Ship plain workout app v1, sport-pivot in v1.1+** | Fast platform launch; iterates with real users; content track runs in parallel | Bundle ID is permanent; rename mid-flight is messy if branding changes | ✅ **Decided** |

**Rationale:** Apple Store + Capacitor + HealthKit is the unknown — get that working first with real users. Sport-specific content is a content problem authored in parallel, blocked only by PT review cycles. Each track de-risks the other.

---

## 12. Open Questions

Decisions still being made. Documented for transparency.

1. **Workout sequence within a program** — must workouts be done in order, or freestyle? Recommended: ordered (periodization matters), but no skip-lock — next-unfinished is just the recommended one.
2. **Program completion definition** — all N workouts in order at any pace? Hit all N regardless of order? Recommended: in order, any pace.
3. **Re-engagement** — without calendar pressure, what brings users back? Push nudges, milestone moments, sport-relevant content. Decide before pushes ship.
4. **Cross-training audience** — sport-flavored general fitness vs. strict sport-specific. Are levels enough to span both, or do we need a "general fitness" track per sport below "just getting started"?
5. **Pricing model** — free? Freemium (one sport free, others paid)? Subscription? Affects App Store privacy labels, IAP setup, review process.
6. **Single program per sport-level, or multiple variants?** — e.g., Pickleball Regular Player gets one program, or chooses from "explosiveness focus" vs "longevity focus."
7. **Apple Watch primary use case** — tap through a planned program, or freestyle voice logging, or both? (See §13 — affects whether V3 alone is enough or whether V3+V4 are coupled.)
8. **Branding decision** — keep "Project K" or rename to something sport-themed at v1.1+? Tied to §11.

---

## 13. Voice & Apple Watch Roadmap

Phased plan for adding voice logging and Apple Watch support. Each phase ships independently.

### Why this is on the roadmap

Inspired by Terry Lin's **Cooper's Corner** approach (Lenny's Newsletter / How I AI). His insight: workout logging UX dies because manual entry mid-workout breaks consistency. Voice removes the friction. The Apple Watch is the natural capture device since it's already on your wrist in the gym.

**Important framing — Project K is not Cooper's Corner.** Cooper's Corner is freestyle-only (user dictates whatever they did, LLM extracts structure). Project K's primary flow is **structured programs** — the day's exercises are pre-planned, the user marks sets done. Voice in Project K is a **polish layer**, not the core interaction.

Where voice genuinely helps Project K:
1. **Hands-free weight entry** — sweaty hands, holding a dumbbell, can't type
2. **Freestyle workouts outside a program** — the Cooper's Corner use case, slotted in as P3-16 in the existing roadmap

### Phased plan

| Phase | Scope | Effort | Value | Depends on |
|---|---|---|---|---|
| **V0 — Foundations** | iPhone Capacitor app shipped (= v1 launch). No voice or watch yet. | Already in scope | — | — |
| **V1 — Voice for weight entry on iPhone** | Tap weight input → mic button → speak "65" → input fills. Web Speech API in webview, no backend, no LLM. Add `NSMicrophoneUsageDescription` to `Info.plist`. | ~2 days | Native polish; small but feels great in gym | V0 |
| **V2 — Freestyle voice workout logging** | "Log a freestyle workout" surface → record audio → transcript → LLM structures into workout_log. New `/api/structure-workout` Vercel function calling Claude API with constrained exercise vocabulary. Schema validation + vocabulary lock prevents hallucinations. | ~5–7 days | Covers off-program gym sessions; aligns with P3-16 | V0 |
| **V3 — Apple Watch companion app** | New native SwiftUI watchOS target in Xcode project (Capacitor doesn't help — pure Swift). Auth via Keychain sharing or Watch Connectivity. Watch screens: today's workout, tap-to-mark-sets-done, optional rest timer. Tap-only initially, no voice. | ~2–4 weeks | High for Apple Watch users; new platform to maintain | V0 |
| **V4 — Voice on the watch** | Native `SFSpeechRecognizer` on watch → same `/api/structure-workout` backend as V2. Persistent visual confirmation (Terry's specific UX: "saved" indicator stays on screen long enough for someone walking around the gym). | ~1–2 weeks | Cooper's-Corner-style capture; high if freestyle is real use case | V2, V3 |

### Architectural implication for Apple Watch

Capacitor builds iPhone apps, not watchOS apps. Three options for adding watch:

| Option | What it is | Effort |
|---|---|---|
| **A. Capacitor iPhone + native Swift watchOS sibling** ⭐ | iPhone stays a webview Capacitor app. Add a watchOS target to the same Xcode project as a fully native SwiftUI app, talking to the same Supabase backend. Auth shared via Keychain/App Groups. | Watch is ~2–4 weeks of native Swift work; iPhone unchanged |
| B. Pivot iPhone to native Swift to share watch code | Throw out the Capacitor approach. Native iPhone + native Watch in the same Swift codebase. | 2–3 months — abandons existing React app |
| C. iPhone-only, no watch | Skip watch entirely | Zero |

**Recommended: Option A.** Two tracks (React for iPhone, Swift for watch), each tractable on its own. Watch app is a separate concern talking to the same backend.

---

## 14. HealthKit & Apple Fitness Integration

Apple's Workout app on iPhone/Watch tracks heart rate, calories, time, and writes to HealthKit. Most users already use it. Forcing them to log twice (once in your app, once in Apple Workout) is exactly the friction that kills retention.

### The honest framing: don't launch Apple's Workout app — *be* it

There's no public API to programmatically launch Apple's Workout app and pre-select strength training. Even if there were, you don't want that — your app would background, the user would tap through Apple's UI, and you'd lose the in-app experience.

What you actually want is to **use HealthKit directly**. Your app starts the workout session itself, captures heart rate + calories + ring credit, and the workout shows up in Apple Fitness alongside everything else. The user never leaves Project K.

User-facing experience:

1. User taps **"Start Today's Workout"** in Project K
2. (Phase H2) Watch app starts an `HKWorkoutSession` of type `traditionalStrengthTraining` in the background
3. Heart rate sensor activates, calories tracked, Activity ring fills
4. User taps through sets in your app
5. User taps **"Finish & Log"** → session ends, workout written to HealthKit with metadata, synced to Supabase
6. Workout appears in Apple Fitness as "Project K · Strength Training · 47 min · 312 cal · avg HR 124"

### iPhone vs Watch responsibilities

| Device | What it does | When it makes sense |
|---|---|---|
| **iPhone** | Writes finished workouts to HealthKit (time + estimated calories, no heart rate). Reads weight + body fat from Apple Health to auto-populate weight tracking. | v1 — even without a watch, your app shows up in Apple Fitness |
| **Apple Watch** | Starts a *live* `HKWorkoutSession` with sensor-driven heart rate + accurate calories + ring credit. Final workout writes back to HealthKit. | v1.2+ when watchOS app exists |

### Phased plan

| Phase | Scope | Effort | Value | Depends on |
|---|---|---|---|---|
| **H1 — iPhone HealthKit write + read** | Request HealthKit auth on first workout finish. Write `HKWorkout` of type `traditionalStrengthTraining` with duration + estimated calories. Read latest body weight + body fat % to pre-fill Weight Log form. Optional: import past Apple Workout sessions into history. Use `@perfood/capacitor-healthkit` plugin. | ~2–3 days | Project K workouts in Apple Fitness; weight auto-pulls from Apple Health | iPhone v1 |
| **H2 — Apple Watch live workout session** | "Start Workout" on watch starts `HKWorkoutSession` (sensor-driven, heart-rate, ring credit). Watch UI shows current exercise + set + heart rate + elapsed time. Tap-to-mark-set-done flows back to phone via Watch Connectivity. "Finish" ends the session, saves to HealthKit with set-level metadata. | ~3–5 days on top of V3 | Real Apple Watch workout (heart rate, ring credit) without ever opening Apple's Workout app | V3 (watchOS app) |
| **H3 — Multi-segment workouts** | Add `HKWorkoutActivityType` selector at workout start: `traditionalStrengthTraining` (default) or composite warmup → strength → cooldown. Sequential sessions: each segment is its own `HKWorkoutSession` (e.g., 5 min `walking` warmup + 45 min `traditionalStrengthTraining` + 5 min `walking` cooldown). | ~2–3 days | Faithful tracking for users who do warmup + work + cooldown | H1 (or H2 for watch) |

### App Store gotchas specific to HealthKit

HealthKit triggers extra App Store review scrutiny. Specifics:

- **Privacy nutrition labels** must declare exactly what HealthKit data is read and written
- **Apple's HealthKit usage policy** prohibits using health data for advertising or selling to third parties
- **Justification in review notes**: explain why each HealthKit data type is needed
- **Authorization request flow** must use `HKHealthStore.requestAuthorization`, with `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` in `Info.plist`
- **Data deletion**: account deletion must handle HealthKit data disconnection (data stays in Apple Health; your app's writes can be revoked)

Add ~2 days to first review for HealthKit-specific back-and-forth.

### Cardio extensions

For future structured cardio days (running, cycling, etc.), each cardio session uses its own `HKWorkoutActivityType` (`running`, `cycling`, `indoorCycling`, `rowing`, `walking`, etc.). Same `HKWorkoutSession` plumbing, different activity type. No additional architecture needed — just expand the activity-type picker.

---

## 15. Apple Sign-In with Supabase

### Decision (2026-04-29): Sign in with Apple ships in v1

Apple SSO is the smoothest auth UX on iOS. Native sheet, no email/password to type, no verification email, instant sign-in. Apple may also require it given email login is offered.

### Architecture

| Surface | Mechanism |
|---|---|
| **Native iOS (Capacitor)** | `@capacitor-community/apple-sign-in` plugin → returns native Apple ID token via system sheet → pass to `supabase.auth.signInWithIdToken({ provider: 'apple', token })` |
| **Web (existing app)** | `supabase.auth.signInWithOAuth({ provider: 'apple' })` → opens Apple OAuth flow in browser |

Both flows ultimately authenticate the same Supabase user — Apple SSO and email/password sign-ins for the same email collide gracefully (Supabase merges by email).

### Setup checklist

#### Apple Developer side
- [ ] Enable **Sign in with Apple** capability on App ID
- [ ] Create a **Service ID** (used for OAuth callback URL on web)
- [ ] Configure web domain + redirect URL on Service ID (`https://<supabase-project>.supabase.co/auth/v1/callback`)
- [ ] Generate **Sign in with Apple key** (`.p8` file) — download once, store securely
- [ ] Note your **Team ID** (top-right of Apple Developer dashboard) and **Key ID** (from generated key)

#### Supabase side
- [ ] Auth → Providers → enable Apple
- [ ] Paste in: Team ID, Service ID, Key ID, contents of `.p8` file
- [ ] Configure redirect URLs (web origin + iOS bundle ID for native)

#### App side (iOS)
- [ ] Install `@capacitor-community/apple-sign-in`
- [ ] Add Sign in with Apple entitlement to Xcode project
- [ ] Add Apple Sign-In button per Apple HIG (specific styling required by Apple)
- [ ] Handle the token exchange in `Login.jsx` / `Signup.jsx`
- [ ] Test the "Hide My Email" flow — Apple may give back a relay email like `xyz@privaterelay.appleid.com`. Backend must accept this format gracefully.

### "Hide My Email" handling

When users choose "Hide My Email," Apple gives your app a relay email instead of the user's real email. Things to confirm:

- Supabase stores the relay email as the user's email — fine, no code changes
- If you ever plan to email users (password reset, notifications), the relay address forwards to their real inbox — works transparently
- If Apple invalidates the relay (e.g., user revokes app access), email delivery fails silently — long-term, monitor bounces

### Cost

Free. Sign in with Apple is included in the Apple Developer Program ($99/yr).

---

## 16. Development Methodology (Terry-inspired)

Patterns adopted from Terry Lin's Cooper's Corner build (Lenny's Newsletter / How I AI). Codified as Claude Code skills or `.claude/skills/*.md` so the project always uses them.

### The three-step PRD workflow

**Step 1 — PRD-Create.** Drop a ticket or feature request into the rule. The rule expands it into a structured plan: implementation steps, reference diagrams, goals, scenarios as Gherkin user stories ("Given X, when the user does Y, then Z"), and an investigation/checkpoint section flagging uncertainty (which files to touch, which DB tables/endpoints are involved).

**Step 2 — PRD-Review.** A second rule re-reads the PRD adversarially. Killer prompt: *"If another model with no prior context had to execute this plan, how would you rate it out of 10?"* If 7/10, ask "What are the three points you docked it for?" Iterate until 9–10/10. This straw-man pass makes the eventual execution close to one-shot.

**Step 3 — PRD-Execute.** A third rule turns the finalized PRD into a phased checklist. Each phase has built-in safety: no placeholder code, real data only, error handling addressed, paths verified. Git commit before and after each phase. Pause between phases for QA — don't one-shot the whole feature.

### Additional rules

**PRD-Refactor.** Mirrors PRD-Create structurally but aimed at restructuring existing code rather than adding features. Preserve behavior, define a QA plan that confirms nothing broke. Phased checklist with build-and-verify between phases.

**Rubber-Duck.** After the model generates code you don't fully understand, point this rule at a file and ask the model to walk through it line by line. Pop-quiz mode: "give me a function, ask me what it does." Reverse rubber ducking — model explains code to you to accelerate learning. Critical for non-engineer building apps without losing debug capability.

### File-size discipline

**Hard target: 200–400 lines per source file.** When files get large (>500 lines), the model reads them in chunks and starts hallucinating: making up file paths, inventing endpoints, getting confused. Smaller cohesive files help the LLM more than they help a human reader.

Current Project K offenders to refactor before mobile work begins:
- `Program.jsx` (~700 lines)
- `Admin.jsx` (~550 lines)

Fastest way to find offenders going forward: line count across the repo and ask the model "what are my biggest files / which are God-mode files we need to break apart?"

### Git commit cadence

- Commit before and after every ~3 tasks
- PRD-Execute rule itself commits between phases
- Existing Stop hook auto-commits at session end — keep, but don't rely on it for during-execution checkpoints
- Discipline: "let it rip" is psychologically and operationally safe only if rollback is one command away

### Design pipeline

Lo-fi → hi-fi belongs in the design pipeline, not the coding pipeline. Don't feed sketches directly to the coding model — input quality determines output quality.

```
Index card / sketch
  → ChatGPT / Claude image gen (upscale to hi-fi mockup)
  → UX Pilot (Figma components)
  → Figma w/ Apple's official UI Kit (HIG-compliant components)
  → Hand-off to coding model
```

The last 10% of design polish is where AI struggles most — that's where human craft still wins. As a one-person shop, ship the 90% and iterate.

### Testing in real context

The simulator is necessary but not sufficient. Two judgment calls:

1. **Test on a real device routinely.** Swiping with a mouse cursor feels different from swiping with a thumb.
2. **Real-world environment matters even more than device fidelity.** Audio capture quality at a desk is not the same as in a noisy gym. Walking around between sets changes how the UI is consumed. Get as close to the real user context as you can.

### Codify in the repo

Create `.claude/skills/`:
- `prd-create.md`
- `prd-review.md`
- `prd-execute.md`
- `prd-refactor.md`
- `rubber-duck.md`

Each skill is self-contained, ~200 lines max, points the model at the right project context (file locations, schema, conventions).

---

## 17. Deliberately Out of Scope (for v1)

Things consciously parked, not forgotten.

- Android port — iOS-only at v1
- React Native rewrite
- Web app feature parity in iOS — some admin functions can stay web-only
- User-facing LLM / chat interface — explicitly hidden
- Social / accountability / sharing
- Voice workout logging on iPhone (V1) — v1.1 update
- Voice workout logging on Watch (V4) — v1.3+
- Apple Watch app (V3) — v1.2+
- HealthKit Phase H2/H3 (watch sessions, multi-segment) — v1.2+
- In-app purchases (decide pricing model first)
- More than 4 sports (sport pivot v1.1+)
- Apple HealthKit *write* of body composition (only workouts written at v1; weight read-only)

---

## 18. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Content quality of sport programs is generic / unsafe | High (post-launch) | Sports PT review pass before publishing; LLM internally drafts, human curates |
| App Store reject for invite-only signup | Medium | Permanent reviewer code + clear notes |
| App Store reject for missing in-app account deletion | High | Build account-deletion RPC + UI in Phase 1 |
| App Store extra scrutiny on HealthKit usage | High | Detailed review notes per HealthKit data type; privacy policy explicitly mentions Apple's restrictions |
| Sign in with Apple required by Apple at review | Medium | Implementing in v1 alongside email/password |
| Supabase session loss on iOS offload | Medium | Phase 2 storage-adapter migration before launch |
| Sport pivot fails to resonate with users | Medium | Soft launch v1 (plain workout app) to family/friends first; sport content track is parallel |
| Content production timeline slips | High | Start with 1 sport (Pickleball), validate model, expand |
| Apple Watch native Swift learning curve | Medium | Use Cursor + Xcode dual-wielding (Terry's pattern); keep watch app scope tight in V3 |
| HealthKit data sync conflicts (e.g., user logs same workout in Apple Workout + Project K) | Low | Project K writes workouts as a single source; deduplication done by `HKWorkout.metadata.workoutId` matching Project K's `workout_logs.id` |

---

## 19. Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-28 | Choose Capacitor over React Native | Codebase is small, mobile-responsive, no native-interaction needs; 2 weeks vs 2–3 months effort |
| 2026-04-28 | Hide LLM from users; use internally for authoring only | Trust, safety, App Store reviewability, content quality control |
| 2026-04-28 | Pivot pacing model from calendar-based to completion-based | Behavioral honesty — users miss workouts; design around real life, not fiction |
| 2026-04-28 | Initial sport scope: Pickleball/Tennis + Golf + Running (3 program sets, 4 sports, 9 programs) | Market gap + content tractability balance; pickleball is the strongest wedge |
| 2026-04-29 | **Ship plain workout app v1, sport pivot in v1.1+ (Option C)** | Decouple platform launch from content lift; each track de-risks the other |
| 2026-04-29 | **Sign in with Apple ships in v1** | Best iOS auth UX; Apple-policy aligned; Supabase has native support |
| 2026-04-29 | **HealthKit Phase H1 (iPhone write workouts + read weight) ships in v1** | High-value low-effort; "be Apple's Workout app" positioning |
| 2026-04-29 | **Apple Watch is post-v1 (V3 + H2 in v1.2+)** | Native Swift work; separate concern from iPhone webview launch |
| 2026-04-29 | Voice logging is post-v1 (V1 in v1.1, V2 in v1.2+, V4 in v1.3+) | Polish layer for Project K's structured-program model, not core interaction |
| 2026-04-29 | Adopt Terry Lin's PRD-Create / Review / Execute / Refactor / Rubber-Duck rules as Claude Code skills | Improves AI-assisted dev quality; codifies discipline |
| 2026-04-29 | Refactor `Program.jsx` and `Admin.jsx` before mobile work begins | Files >500 lines hurt model accuracy; AI-readability matters |

---

*This document is a living plan. Update as decisions are made or scope changes.*
