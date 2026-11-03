# Game Concept: Erandel

---
**Status**: Reverse-Documented (from the playable build `src/index.html`, v0.3.0)
**Date**: 2026-11-03
**Owner**: Sola (creator)
---

## Elevator Pitch

Be reborn at the Thorngate as any of 36 kinds, from merfolk to liches, and live a life in a cozy, lantern-lit open world where what you do each day decides what you become. By night, light up your own plot by the pond and run a night market for travelers of every kind.

## Core Identity

| Field | Value |
|---|---|
| Genre | Cozy open-world JRPG with life-sim evolution and light building |
| Platform | Web browser, phone-first (touch), desktop supported |
| Session length | 10–30 minutes; one in-game day is about 3–4 actions |
| Perspective | Isometric-style 3D diorama camera, chibi characters |
| Tone | Warm, contemplative, a little mythic |

## Core Fantasy

You are a soul who chose rebirth over eternity. Nobody hands you a class. You become a Tide Sovereign, a Blood Tyrant or a Fae Monarch because of how you lived: where you went, who you helped, what you ate, which elements you lived among, what you stole. The world remembers you, and every dawn it shows you who you are turning into.

## Unique Hook

A life-sim evolution system (36 kinds × paths × light/dark legends, driven by daily deeds) wrapped in a cozy night-market diorama you build yourself. Most cozy builders have no identity arc; most evolution RPGs have no home. Erandel has both.

## Player Experience Analysis (MDA Framework)

- **Mechanics**: daily action budget, stats and elements fed by actions, dawn evolution checks, Fate/Corruption, NPC memory, survival hazards and diets, grid building, market sales.
- **Dynamics**: players plan days around their body (a merfolk avoids the desert, a vampire works at night), chase an evolution path, and loop back to Thorngate to spend gold on the plot.
- **Aesthetics**: Discovery (36 kinds, 10 lands, hidden bloodlines), Expression (spell invention, plot decoration), Fantasy (becoming a legend), Submission (cozy lantern evenings, ambient music).

## Player Motivation Profile

- **Primary**: Expression and Discovery. "What will my character become?" and "Make my corner of the world beautiful."
- **Secondary**: Mastery (elements, fusion spells, market optimisation), Social-lite (NPC bonds, companions).
- **Not targeted**: competitive mastery, twitch combat.

## Core Loop

1. **Day**: spend 3 actions (4 at Endurance 25) on training, exploring, working, helping people, hunting, gathering wood and stone.
2. **Evening**: return to Thorngate, decorate the plot, open the night market, watch travelers buy.
3. **Dawn**: the world checks your deeds; you may evolve, catch luck events, wake hungry or healed.
4. Repeat, with each dawn changing your body, powers and reputation.

## Game Pillars

1. **You become what you do.** No class picker. Every system feeds the dawn evolution check.
2. **The world remembers.** NPCs, places and the spell codex keep a record of your deeds.
3. **Every body is different.** Kinds breathe, eat and suffer differently; the world is not equally safe for all.
4. **Cozy by lantern light.** Warm, slow, beautiful; failure costs gold and time, never progress.
5. **Plays on a phone.** Touch first, one-thumb movement, short sessions.

## Inspiration and References

- Night-market diorama builders (cozy isometric lantern scenes) for the look and the build/market loop.
- Classic JRPGs for dialog boxes, battle-on-contact and region title banners.
- Life-sim RPGs for the "life shapes the character" idea.
- Erandel lore (Sola's YouTube channel): Aelarion Silverbough, the Thorngate, the Aethwyn river, souls choosing rebirth or eternity.

## Target Player Profile

Phone players who like cozy games, fantasy worldbuilding and character growth, and who play in short evening sessions. Viewers of the Erandel channel who want to step into the world.

## Technical Considerations

Single-file web game (three.js r128) published as an Artifact. No external assets: all art is generated in code. Saves live in the browser's localStorage, so progress is per device. See `docs/architecture/architecture.md` and ADR-0001.

## Risks and Open Questions

- **Performance on low-end phones** with bloom and point lights. Mitigation: Glow toggle, 4 lights on phones.
- **Save is per device.** Open question: add an export/import code or cloud save?
- **Canon assumptions** to confirm with the creator: Caelithra's role (moon oracle), Elash's role (warden of the white boughs), the mermaid queen's name (Queen Maren).
- **Balance**: the night market is the strongest gold source by design; watch that it does not make other jobs pointless.

## MVP Definition

Already playable (v0.3.0): character creation with Aelarion, 10 lands, 36 kinds with evolution to Tier 4, elements, magic forge, survival and diets, NPC memory, companions, combat on contact, building, night market, music. Missing for a 1.0: save export, more quests per NPC, sound effects, story beats tied to Aelarion and the rebirth/eternity myth.

## Next Steps

1. Confirm canon assumptions with the creator.
2. Run `/review-all-gdds` and `/balance-check` on the economy (market vs work vs hunting).
3. Plan the next milestone with `/create-epics` (save export, NPC questlines, Veilmoor story).
