# Project K Mobile Previews

This folder collects mobile UX style explorations for Project K. These documents are preview briefs, not production app specs. They are meant to help compare visual language, screen naming, and motivational framing before committing to a mobile implementation.

The production webapp is unchanged. These previews should stay outside `src/`, `api/`, and `supabase/` unless a direction is chosen and promoted into implementation work.

## Current Concepts

Open the gallery first: [index.html](./index.html)

| Concept | Summary | Prototype | Brief |
|---|---|---|---|
| Retro Quest | A serious workout tracker presented with minimal cinematic platformer language: quests, archives, readiness maps, torchlit UI, and restrained pixel styling. | [retro-quest.html](./retro-quest.html) | [prince-of-persia-quest.md](./prince-of-persia-quest.md) |
| Mascot RPG | A pixel RPG wrapper where the user chooses a Knight or Queen archetype that evolves through training consistency, PRs, and milestones. | [mascot-rpg.html](./mascot-rpg.html) | [mascot-rpg.md](./mascot-rpg.md) |

## Preview Rules

- Keep workout tracking fast, clear, and serious underneath the style.
- Treat themed labels as presentation-layer copy, not database or domain model names.
- Avoid direct copying of any existing game IP, characters, logos, or exact visual compositions.
- Prefer reversible design tokens, copy maps, and reusable screen components so the app can switch concepts later.

## Shared Neutral Model

Use these neutral product terms as the underlying model:

| Product Term | Example Themed Labels |
|---|---|
| Workout | Quest, Session, Run |
| Program | Campaign, Path, Training Arc |
| Progress | Archive, Chronicle, Journey |
| Readiness | Readiness Map, Recovery Map, Status Board |
| Personal Record | PR Moment, Relic, Milestone |

## Assets

- [Retro quest concept image](./assets/retro-quest-concept.png)
- [Mascot original HTML](./assets/mascot-original.html)
