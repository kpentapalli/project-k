# Mascot RPG Mobile Preview

## Summary

This direction adds a lightweight pixel RPG mascot layer to Project K. The user chooses a Knight or Queen archetype during onboarding, then sees that character evolve as they train consistently, hit PRs, and complete milestones.

The mascot is motivational flavor. The app remains a workout tracker underneath, and the mascot should never block logging, program selection, or progress review.

Original visual source: [mascot-original.html](./assets/mascot-original.html)

## Product Mapping

| Product Term | Themed Label | Notes |
|---|---|---|
| Workout | Quest | A completed workout grants progression. |
| Program | Campaign | A program becomes the training arc for the mascot. |
| Progress | Hero Journey | Shown as evolution, milestones, and records. |
| Personal Record | Reward / Dye / Relic | PRs can unlock cosmetic changes. |
| Recovery | Rest State | Mascot can look recovered, training-ready, or weary. |

## Mascot System

| Archetype | Visual Identity | Progression |
|---|---|---|
| Knight | Silver/red, open-face helm, sword and shield. | Squire to Footman to Knight to Champion to King. |
| Queen | Violet/gold, crown, cloak, rapier and orb. | Page to Lady to Queen to High Queen to Empress. |

Both archetypes share the same XP economy, level thresholds, and reward rules. The difference is silhouette, palette, and flavor.

## Progression Inputs

- Completed workouts increase progression.
- Program completions trigger major evolution moments.
- PRs unlock cosmetic rewards such as crimson, jade, frost, obsidian, or gold palette swaps.
- Consistency streaks can unlock small accessories, banners, or frame upgrades.
- Long inactivity can show a gentle "weary" state, but it should invite return rather than shame the user.

## Sample Screens

| Screen | Purpose | Visual Treatment |
|---|---|---|
| Onboarding | Choose Knight or Queen and optionally name the hero. | Two equal cards with sprite, archetype name, and short tone description. |
| Home | Show today's workout, current hero, level, and next milestone. | Mascot beside the active program card; progress bar toward next evolution. |
| Workout | Complete sets, effort, weights, rest, and finish. | Mascot reacts subtly to set completion or PRs, but controls stay primary. |
| Progress | Show training history and unlocks. | Evolution row, cosmetic rewards, completed campaigns, PR records. |

## Visual System

- Palette: deep blue base, cream text, amber/gold accents, archetype-specific red/silver or violet/gold.
- Typography: pixel-style headings paired with readable system text for forms and workout data.
- Sprite style: crisp 16x16 or 32x32 pixel silhouettes scaled cleanly with `image-rendering: pixelated`.
- Rewards: palette swaps and small sprite accessories over large complex animations.
- Tone: charming and classic RPG, not childish or noisy.

## Guardrails

- Mascot progress must not replace real training progress.
- Do not require users to manage inventory, stats, battles, or character builds.
- Do not create failure or damage metaphors around missed workouts.
- Keep workout logging faster than mascot interaction.
- Make the mascot optional or visually de-emphasizable if users prefer a cleaner app.

## Best Fit

This direction is best if Project K should feel more personal and habit-forming. It creates an emotional anchor through a character system, but carries more brand risk than the Retro Quest direction because the mascot can become the app's identity.
