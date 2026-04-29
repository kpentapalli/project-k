# Project K — Mobile + Sport Pivot PRD (Lite)

> **Status:** Planning · Pre-build
> **Last updated:** 2026-04-28
> **Owner:** Kalyan
> **Mode:** Strategic direction + mobile build path. Not engineering spec.

---

## 1. Vision

Take the current Project K web app to the iOS App Store as a **sport-specific training companion**. Users pick their sport (pickleball, golf, tennis, running...) and a level (just-getting-started, regular player, athlete) and follow a curated strength + injury-prevention program designed around how often they can actually train, not a calendar deadline.

Two strategic shifts shape this work:

1. **Sport-specific positioning** instead of generic strength training.
2. **Completion-based pacing** instead of calendar-based programs — users finish when they finish.

Mobile (iOS) is the launch surface because fitness is a phone-in-hand activity and App Store presence is a credibility signal for non-technical users.

---

## 2. Strategic Direction

### 2.1 Sport-Specific Pivot

Most fitness apps are generic strength loggers. The wedge: **a consumer app for amateur athletes** — recreational tennis player, weekend basketball league, weekend skier, marathon trainee — where the program is designed around the sport they play, not just "get stronger."

| Existing landscape | Status |
|---|---|
| B2B / pro-level (Volt, TrainHeroic) | Not consumer-friendly, expensive |
| Single-sport apps (Runna, NRC) | Focused on the sport itself, not strength + injury prevention |
| Generic strength apps (Hevy, Strong, Fitbod) | No sport context |
| Mobility niche (Pliability, GOWOD) | Single-purpose, narrow |

The slot Project K targets is mostly empty for non-elite users. **Pickleball especially has zero credible options.**

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

The product ships **pre-built, human-curated programs only** — no exposed LLM/chat interface to the user. LLM use is restricted to **internal authoring** (Claude helps draft programs that you review/edit before publishing). This lets you produce 100+ workouts in weeks instead of months while keeping the user-facing product predictable, safe, and reviewable.

Rationale for hiding it: trust, safety, App Store review tractability, and the fact that exposing freeform AI generation in a fitness app introduces injury liability concerns and quality variance.

---

## 3. v1 Sport Catalog

Cannot ship 12 sports well at launch. v1 = **3 program sets covering 4 sports**, ~9 programs total (3 sports × 3 levels), ~120–160 unique workouts authored.

| Sport | v1? | Rationale |
|---|---|---|
| **Pickleball** | ⭐ Yes | Explosive growth, older affluent demographic, real injury problem, no serious competition |
| **Tennis** (shared with pickleball) | ⭐ Yes | ~80% program overlap with pickleball — one program set covers both as "racquet sports" |
| **Golf** | ⭐ Yes | Older affluent demographic, rotational power + back health, underserved by apps |
| **Running** | Maybe | Huge market but very crowded; the *strength-for-runners* angle is less crowded |
| Climbing | Phase 2 | Niche, expertise-heavy programming |
| Hiking / mountaineering | Phase 2 | Bundle as "endurance + leg" |
| Cycling | Phase 2 | Strength-for-cyclists is real need, less competition |
| Racquetball | Bundle | Add to racquet-sports bucket post-validation |
| Soccer / football | Skip v1 | Younger audience, team training already exists |
| Swimming | Skip v1 | Niche, very technique-driven (less strength-program territory) |

**Recommended v1 ship list:** Pickleball/Tennis (shared) + Golf + Running.

---

## 4. Level System

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

**Conclusion:** Capacitor. The current codebase is small, mobile-responsive, has no heavy graphics or realtime needs. App Store presence is the goal, not native interaction polish.

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
| `localStorage` | `Program.jsx` (intro flag, settings) | ✅ Works (with a persistence note — see §7) |
| `window.location` | `ProtectedRoute.jsx`, `Login.jsx` | ✅ Works (with one redirect adjustment — see §7) |
| `navigator.clipboard` | `Admin.jsx` | ✅ Works |

No rewrites required. Only four small, targeted adjustments (§7).

---

## 6. Build Phases

Each phase is independently shippable. Phase 0 is the platform setup; phases 1–3 layer features.

| Phase | Scope | Effort |
|---|---|---|
| **Phase 0 — Capacitor scaffolding + first build** | Install Capacitor, generate iOS project, configure Vite for webview, run in iOS Simulator, get app loading the existing UI | ~1 day |
| **Phase 1 — App Store submission baseline** | Apple Developer account, bundle ID, app icon, splash, safe-area handling, bottom tab bar replacement for top nav, privacy policy + support URL, metadata, screenshots, account-deletion flow, reviewer demo code | ~5–7 days |
| **Phase 2 — Mobile-native polish** | Biometric login (Face ID), Universal Link for password reset, persistent Supabase session via `@capacitor/preferences`, native status bar, splash transitions | ~3–4 days |
| **Phase 3 — Sport pivot content + UX** | Intake redesign (sport + level), program model evolution (recommended_frequency + completion-index), dashboard rework ("workout 8 of 18"), v1 sport program library (~120 workouts), auto-assign rewire | ~3–4 weeks |
| Phase 4 (post-v1) | Push notifications, HealthKit weight sync, offline workout logging, more sports | — |

**Total to App Store v1: ~5–6 weeks**, dominated by content authoring (Phase 3), not engineering.

---

## 7. Codebase Adjustments Required

The four specific touch-points where existing code needs changes for mobile.

| # | Issue | Location | Fix |
|---|---|---|---|
| 1 | Password reset `redirectTo` uses `window.location.origin` which is `capacitor://localhost` in webview | `Login.jsx:40` | Use Universal Link (HTTPS URL routed back to app via `apple-app-site-association`) — or short-term fall back to opening Safari |
| 2 | Supabase session uses `localStorage` which iOS may purge on app offload | Supabase client init | Configure custom storage adapter using `@capacitor/preferences` plugin |
| 3 | Vercel serverless functions called from web app | `api/invite.js`, `api/signup.js` | No backend changes. Mobile app calls same HTTPS endpoints. Verify all fetch calls use absolute URLs (or configure base URL) |
| 4 | Apple may reject invite-only apps with no demo path | Signup flow | Provide a permanent reviewer invite code (e.g., `APPLEREVIEW`) + include in App Store review notes |

Outside these four points, the code ports unchanged.

---

## 8. Native Features (v1 scope)

Pick a v1 subset. Everything else can wait for v1.1 updates.

| Feature | Effort | v1? | Notes |
|---|---|---|---|
| **App icon + splash screen** | 0.5 day | ⭐ Yes | Required for submission |
| **Safe-area + bottom tabs** | 1 day | ⭐ Yes | Native iOS expectation |
| **Biometric login (Face ID)** | 0.5 day | ⭐ Yes | High polish, low effort |
| **Universal Links (password reset)** | 1 day | ⭐ Yes | Polished auth |
| **Sign in with Apple** | 1 day | ⭐ Yes (likely required by Apple) | Apple may mandate if email login is offered |
| **Pull-to-refresh on dashboard** | 0.5 day | ⭐ Yes | Native expectation |
| Push notifications | 2 days | v1.1 | Needs server-side trigger logic for nudges |
| Apple HealthKit (weight read) | 2–3 days | v1.1 | Real value but not blocking launch |
| Offline workout logging | 3 days | v1.1 | Gym wifi often poor; valuable but adds queue/sync complexity |

**v1 native scope total: ~4 days** on top of the Phase 1 baseline.

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
- [ ] Screenshots — multiple device sizes (6.7", 6.5", 5.5" iPhone)
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
- [ ] Support URL (host on Vercel as `/support` or use a contact form)
- [ ] Privacy nutrition labels — declare email, weight, workout data, link-to-identity status
- [ ] **Account deletion flow** (Apple requirement) — in-app delete-my-account button, not just email-us. New Supabase RPC needed.
- [ ] Demo account credentials for reviewer (use the permanent reviewer invite code from §7)

### Code signing
- [ ] Distribution certificate (Xcode handles)
- [ ] Provisioning profile (Xcode handles)
- [ ] Push notification entitlement if shipping push in v1

---

## 10. Design Decisions to Lock Before Code

These shape downstream work. Decide first.

### Branding & identity
- [ ] App name (Project K? Sport-themed rename? Don't lock until §11 sequence is decided)
- [ ] Logo / icon design direction
- [ ] Primary color + accent for status bar + system UI
- [ ] Typography continuation (Bebas Neue + Syne already in use)

### Mobile UX patterns
- [ ] Bottom tab labels — proposed: Home / Workout / Progress / Profile
- [ ] Safe-area handling strategy
- [ ] Modal vs full-screen for Workout flow
- [ ] Pull-to-refresh on which surfaces

### Sport pivot specifics
- [ ] Confirm v1 sports (recommended: Pickleball/Tennis + Golf + Running)
- [ ] Lock level descriptions (§4 draft is a starting point)
- [ ] Decide v1 program count target (recommended: 9 programs covering 4 sports)
- [ ] Decide who reviews program content (sports PT? S&C coach? self-curated with research backing?)

### Account + auth
- [ ] Keep invite-code-only signup, or add open signup for App Store launch?
- [ ] Sign in with Apple — yes for v1 (Apple likely requires it)

---

## 11. Sequence Question: Pivot First or Ship First?

A decision that shapes the next 6 weeks.

| Option | Pros | Cons |
|---|---|---|
| **A. Ship Project K as-is to App Store** | Fastest path, validates Capacitor + review process, gets Apple Developer experience | Locks brand + ASO around generic strength training; messy rename later |
| **B. Pivot first, then ship** | Launches with the version you actually want to sell; clean ASO from day one | Longer to first launch (~5–6 wks vs ~2 wks); content lift before any user feedback |
| **C. Ship Project K v1, sport-pivot in v1.1 update** | Gets to App Store fast + iterates with real users | Bundle ID is permanent; rename + reposition mid-flight is messy and resets reviews |

**Recommended: Option B.** If the sport pivot is the product you actually want to sell, launch as that. App Store rebrands are workable but eat your 0-review reset and confuse early users.

**Counter-argument worth considering:** Option C is faster to feedback, and the content lift in Option B is the riskiest, slowest part. If you're unsure of the sport-pivot direction, ship Option A/C first to de-risk the platform side, then iterate.

---

## 12. Open Questions

Decisions still being made. Documented for transparency.

1. **Workout sequence within a program** — must workouts be done in order, or freestyle? Recommended: ordered (periodization matters), but no skip-lock — next-unfinished is just the recommended one.
2. **Program completion definition** — all N workouts in order at any pace? Hit all N regardless of order? Recommended: in order, any pace.
3. **Re-engagement** — without calendar pressure, what brings users back? Push nudges, milestone moments, sport-relevant content. Decide before pushes ship.
4. **Cross-training audience** — sport-flavored general fitness vs. strict sport-specific. Are levels enough to span both, or do we need a "general fitness" track per sport below "just getting started"?
5. **Pricing model** — free? Freemium (one sport free, others paid)? Subscription? Affects App Store privacy labels, IAP setup, review process.
6. **Single program per sport-level, or multiple variants?** — e.g., Pickleball Regular Player gets one program, or chooses from "explosiveness focus" vs "longevity focus."
7. **Branding decision** — keep "Project K" or rename to something sport-themed? Tied to §11.

---

## 13. Deliberately Out of Scope (for v1)

Things consciously parked, not forgotten.

- Android port — iOS-only at v1
- React Native rewrite
- Web app feature parity in iOS — some admin functions can stay web-only
- User-facing LLM / chat interface — explicitly hidden
- Social / accountability / sharing
- Voice workout logging
- In-app purchases (decide pricing model first)
- Apple Watch companion (post-v1.1 at earliest)
- More than 4 sports
- Apple HealthKit *write* (only read in v1.1, never write at launch)

---

## 14. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Content quality of sport programs is generic / unsafe | High | Sports PT review pass before launch; use LLM internally to draft, human curates |
| App Store reject for invite-only signup | Medium | Permanent reviewer code + clear notes |
| App Store reject for missing in-app account deletion | High | Build account-deletion RPC + UI in Phase 1 |
| Sign in with Apple required by Apple at review | High | Implement in v1 alongside email/password |
| Supabase session loss on iOS offload | Medium | Phase 2 storage-adapter migration before launch |
| Sport pivot fails to resonate with users | Medium | Soft launch to family/friends first, validate with 10–20 real users before broad ASO push |
| Content production timeline slips | High | Start with 1 sport (Pickleball), validate model, expand |

---

## 15. Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-28 | Choose Capacitor over React Native | Codebase is small, mobile-responsive, no native-interaction needs; 2 weeks vs 2–3 months effort |
| 2026-04-28 | Hide LLM from users; use internally for authoring only | Trust, safety, App Store reviewability, content quality control |
| 2026-04-28 | Pivot pacing model from calendar-based to completion-based | Behavioral honesty — users miss workouts; design around real life, not fiction |
| 2026-04-28 | v1 sport scope: Pickleball/Tennis + Golf + Running (3 program sets, 4 sports, 9 programs) | Market gap + content tractability balance; pickleball is the strongest wedge |

---

*This document is a living plan. Update as decisions are made or scope changes.*
