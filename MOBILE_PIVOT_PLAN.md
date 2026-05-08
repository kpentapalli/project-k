# Mobile Pivot: Web Wrapper v0 + Native Swift v1

> **Note:** Some referenced files (`MOBILE_MVP_PLAN.md`, `src/mobile/*`, `capacitor.config.json`, `ios/`) live only on the `claude/practical-robinson-ef7ef5` branch (Mascot RPG snapshot, tagged `mascot-rpg-snapshot`). Browse them at [github.com/kpentapalli/project-k/tree/mascot-rpg-snapshot](https://github.com/kpentapalli/project-k/tree/mascot-rpg-snapshot).

## Context

The Mascot RPG hedge ([MOBILE_MVP_PLAN.md](MOBILE_MVP_PLAN.md)) is on TestFlight but the trial never started — an audit before launch surfaced gaps in the *core* (no reps, no effort, no exercise swap, no warm-up/cool-down). Stacking a game layer on a half-finished workout core was the wrong order. The decision: drop the game layer entirely and ship the existing web app to mobile users fast, while starting native Swift in parallel.

**Two tracks, both starting now:**

- **Track A — Capacitor v0 (ship in 1–2 weeks).** Wrap the existing web app. New bundle ID, new App Store Connect record, new TestFlight group. Get something usable in friends' hands while v1 is built.
- **Track B — Native Swift v1 (12–14 weeks).** Start the [MOBILE_PRD.md](MOBILE_PRD.md) plan in a separate repo / Xcode project. Eventually replaces v0.

The Mascot RPG work (current branch `claude/practical-robinson-ef7ef5`, current TestFlight build) is **left alone** — preserved in git history and App Store Connect, but no further work happens on it.

---

## Track A — Capacitor v0 Web Wrapper

### Step 1: Branch hygiene (preserve Mascot RPG)

- Tag the current commit on `claude/practical-robinson-ef7ef5` as `mascot-rpg-snapshot` so the work is findable later.
- Do **not** merge `claude/practical-robinson-ef7ef5` to `main`. PR #9 stays open or gets closed without merge — your call.
- Create new branch from `main`: `mobile-v0`. All Track A work lives here.

### Step 2: New Apple identifiers

Mascot RPG owns `com.kpentapalli.projectk`. The v0 needs a separate App Store Connect record so the existing TestFlight build is untouched.

- Register new App ID at [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers) — recommend `com.kpentapalli.projectk.lift` (or your preferred suffix).
- Create new App Store Connect record at [appstoreconnect.apple.com](https://appstoreconnect.apple.com): name "Project K" (since "Project K: Train" is taken by Mascot RPG slot — pick a distinct name).
- Same Apple Developer account, same registered device — no new account/device work needed.

### Step 3: Capacitor setup on the new branch

Reuses the patterns we just learned. From the `mobile-v0` branch:

- `npm install @capacitor/core @capacitor/cli @capacitor/ios`
- `npx cap init "Project K" "com.kpentapalli.projectk.lift" --web-dir dist`
- Edit `capacitor.config.json`: `webDir: "dist"`, `ios.contentInset: "always"`, `SplashScreen.backgroundColor: "#0a0a0a"` (or web app theme color — see `src/index.css`).
- `npm run build && npx cap add ios && cd ios/App && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install`
- Set Podfile `platform :ios, '15.0'` (Capacitor 8 requires 15+).
- In Xcode: User Script Sandboxing = No (Build Settings); Minimum Deployment iOS 15.0 (General + Project).

### Step 4: Default route — open web app, not /m

Currently [src/App.jsx:51](src/App.jsx) on the Mascot RPG branch routes Capacitor to `/m`. On `mobile-v0` (which forks from `main`), `/m` doesn't exist. Capacitor will open `/` → catch-all → `/dashboard` → ProtectedRoute → `/login` if not authenticated. That's correct behavior for the web wrapper. **No code change needed for routing on `mobile-v0`** — `Capacitor.isNativePlatform()` check from the Mascot branch is irrelevant here.

### Step 5: Mobile-friendly audit + fixes

The existing web app has partial responsive CSS — already has `@media` queries in [src/index.css](src/index.css) at 480px, 600px, 640px, 700px breakpoints. Audit each page in mobile viewport (390×844 or smaller) and fix issues iteratively. Priority order:

1. **[src/pages/Login.jsx](src/pages/Login.jsx)** — first impression. Tap targets, form sizing, keyboard behavior on iOS Safari.
2. **[src/pages/Dashboard.jsx](src/pages/Dashboard.jsx)** — 9-card muscle grid (verify it stacks cleanly), weight chart SVG (verify it scales), stats row, ProgramSwitcher modal sizing.
3. **[src/pages/Program.jsx](src/pages/Program.jsx)** — most-used screen. Set chips, effort cells, weight inputs, rest timer, swap modal, finish modal — all need to feel fast on a touchscreen.
4. **[src/pages/Intake.jsx](src/pages/Intake.jsx)** — first-login flow.
5. **[src/components/TopBar.jsx](src/components/TopBar.jsx)** — nav. Likely needs collapsing or repositioning on mobile (dashboard / program / about / admin links).
6. **[src/pages/Retrospective.jsx](src/pages/Retrospective.jsx)** — post-program completion screen.
7. **[src/pages/Admin.jsx](src/pages/Admin.jsx)** — hide entirely on mobile or send to web. Not a priority for testers.

For each: load page in a 390-wide viewport, identify what breaks, edit CSS in [src/index.css](src/index.css) (don't introduce a new styling system), verify with preview tools.

**Specific known concerns to check:**
- 44×44px minimum tap targets (iOS HIG).
- Date input behavior on iOS Safari (workout date picker — see [src/pages/Program.jsx:325–341](src/pages/Program.jsx)).
- Rest timer button reachability (currently floating mid-card).
- Weight + body-fat chart legibility on narrow widths ([src/components/WeightSection.jsx](src/components/WeightSection.jsx)).
- Top bar hamburger or bottom-tab pattern — current TopBar is horizontal nav, may not fit.

### Step 6: Splash + icon

- Generate a 1024×1024 app icon. Replace `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (use a tool like Bakery, Icon Set Creator, or Figma export).
- Splash: replace `Splash.imageset/*.png` with brand-aligned art on dark background (or generate from existing app theme).

### Step 7: Archive + upload + invite testers

- Build pipeline same as before:
  - `npm run build && npx cap sync ios && npx cap open ios`
  - Xcode → Product → Archive → Distribute App → TestFlight Internal Only
- New App Store Connect → TestFlight tab → External Testing group → add tester emails per the [MVP plan §8](MOBILE_MVP_PLAN.md) — but **without the decision gate**, since this isn't a hedge anymore. Just gather usability feedback.

### Step 8: Track usage + iterate

This is your real product to friends. Watch:
- Daily-active users (Supabase auth logs).
- Workout-log volume per user per week.
- What pages they get stuck on (qualitative feedback).
- Crash reports from TestFlight.

### Track A: Critical files

| File | Change |
|---|---|
| New `mobile-v0` branch from `main` | All Track A work |
| `package.json` | Add `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` |
| `capacitor.config.json` (new) | `appId: com.kpentapalli.projectk.lift`, `webDir: dist`, splash bg matching web theme |
| `ios/` (new, generated) | `npx cap add ios` output |
| `src/index.css` | Mobile-tuned breakpoints, tap target sizing, layout fixes per audit |
| `src/components/TopBar.jsx` | Collapse to hamburger or bottom nav on mobile |
| `src/pages/Program.jsx`, `src/pages/Dashboard.jsx`, etc. | Per-page mobile fixes as discovered |
| `.gitignore` | Add `ios/App/Pods`, `ios/App/App.xcworkspace/xcuserdata`, `ios/App/App/public`, `ios/App/capacitor-cordova-ios-plugins` |

---

## Track B — Native Swift v1 Kickoff

This is the [MOBILE_PRD.md](MOBILE_PRD.md) plan. Full execution is a 12–14 week multi-session effort — this plan only covers kickoff.

### Step 1: Repo decision

Two options:
- **(a)** New separate repo `project-k-ios` (cleaner separation, matches MOBILE_PRD.md §5.3).
- **(b)** Subdirectory `ios-native/` in this repo (single source of truth, but mixes JS + Swift).

PRD recommends (a). Confirm before kickoff.

### Step 2: Apple identifiers (third bundle ID)

- Mascot RPG owns `com.kpentapalli.projectk`.
- Track A v0 owns `com.kpentapalli.projectk.lift`.
- Native v1 needs a third — e.g., `com.kpentapalli.projectk.native` (or eventually swap with v0 once native is mature).

### Step 3: Xcode project bootstrap

Per MOBILE_PRD.md §6 Phase 0:
- New Xcode project, iOS + watchOS targets.
- iOS 17 minimum (per PRD).
- Add `supabase-swift` SPM dependency.
- Folder structure, navigation skeleton, design tokens (colors, fonts, spacing matching web theme — not the Mascot HUD aesthetic).
- Apple Developer account + bundle ID + capabilities (Sign in with Apple, HealthKit later).

### Step 4: Schema mirror in SwiftData

Per MOBILE_PRD.md §5.2, model these tables in SwiftData:
- `programs`, `program_assignments`, `workout_logs`, `set_logs`, `weight_logs`, `profiles`.
- Skip `hero_unlocks` and the `hero_*` columns on `profiles` — those were Mascot RPG only.

### Step 5: Build phases

Follow MOBILE_PRD.md §6 phase table. Adjust for "no game layer" — phases stay roughly the same since the PRD never had a game layer; that was a mid-stream addition.

### Track B: Critical files (when v1 starts)

| Item | Change |
|---|---|
| New repo `project-k-ios` (or `ios-native/` subdir) | All v1 work |
| Xcode project (new) | iOS + watchOS targets, iOS 17+ |
| Swift Package: supabase-swift | Auth + DB + storage |
| SwiftData models | Mirror `programs`, `program_assignments`, `workout_logs`, `set_logs`, `weight_logs`, `profiles` |
| Reuse from web | `src/lib/readiness.js` logic → port to Swift; `src/lib/muscles.js` `swap_category → muscle` map → port to Swift; program JSONB schema → Swift `Codable` |

---

## What about the Mascot RPG work?

- **Branch `claude/practical-robinson-ef7ef5`**: tag as `mascot-rpg-snapshot`. Don't merge to main. Don't delete (preserves learning + the design tokens + the working PR detection logic that may inform native v1).
- **TestFlight build (`com.kpentapalli.projectk`)**: leave it alone. You can still install it on your device for nostalgia. Don't add testers to it.
- **PR #9** ([github.com/kpentapalli/project-k/pull/9](https://github.com/kpentapalli/project-k/pull/9)): close without merging or leave open as historical reference. Recommend closing with a comment noting the pivot.
- **`supabase/mobile-mvp-hero.sql` migration**: already applied to production Supabase. The `hero_archetype`, `hero_name`, `hero_xp`, `hero_unlocks` columns/table are harmless leftovers — not used by Track A or B. Can drop later if cleanup matters.

---

## Verification

### Track A verification (when v0 ships)

- **Local dev**: `npm run dev` → open `localhost:5173` in mobile viewport (Chrome DevTools device mode, iPhone 14 Pro 390×844). Walk through: login → dashboard → program → log a set → finish workout → see updated dashboard. No layout breaks, no scrollbars, no tiny tap targets.
- **TestFlight build**: archive + upload → install on device → repeat the full flow. Verify auth, set logging, weight section, intake (if a fresh user).
- **Tester feedback loop**: 1-week check-in with 3–5 testers. Collect: workout-log frequency, pages they couldn't figure out, anything that crashed.

### Track B verification (when v1 phases ship)

- Per [MOBILE_PRD.md](MOBILE_PRD.md) phase table — each phase has its own acceptance criteria.

---

## Open question (deferred from earlier session)

**App naming.** Without the game narrative, the naming exercise is simpler. Suggested directions for v0 / v1:

- "Project K" (current, generic, ships fine for friends-only TestFlight).
- "Iron" / "Forge" / "Rep" / "Lift" / "Tally" / "Kettle" — short, declarative, lifting-adjacent.
- A real name when ready for App Store public launch (later — not blocking).

For Track A: keeping "Project K" is fine for the TestFlight slot. Revisit when planning App Store submission.

---

## Recommended next session

Start Track A Step 1 (branch hygiene) + Step 2 (new bundle ID). Those are 30 minutes and unblock everything else. Then start the mobile-friendly audit (Step 5) — that's the bulk of the work and benefits from iterative preview-driven editing.
