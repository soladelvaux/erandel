# Companions — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`compat`, `RIVALS`, `isRival`, `SP.seek`, invite/decline/dismiss actions, companion bond in `dawn` and `envEffects`, `updateComp`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

At Thorngate the player can meet a traveler of a random kind. Compatibility depends on rival kinds, shared groups, element harmony, diet, Fate/Corruption and Charm. A companion follows the player in the world, fights in battles, and has a bond that grows or shrinks each dawn and suffers when taken to places that hurt their kind.

## Player Fantasy

"Not everyone can travel together." A vampire and a werewolf will never team up; a merfolk and a nereid are natural partners.

## Detailed Rules

- **Look for a companion** (Thorngate, 1 action): meet a random-kind traveler with a name, compatibility score and the reasons.
- **Invite** (free): refused below 35. Inviting replaces the current companion.
- **Starting bond**: `30 + compat / 5`.
- **Dawn**: bond +3 if compat ≥ 60, +1 if ≥ 40, −3 otherwise. Bond 0: they leave (chronicle). Bond 80: sworn companion (chronicle, once).
- **Hazards**: every timed action in a place that hurts their kind: bond −2 per hazard, with a message.
- **Battles**: they add damage each round; each win gives bond +2.
- The candidate disappears at dawn if not invited.

**Rival pairs**: Vampires–Werewolves, Seraphs–Demons, Seraphs–Liches, Fae–Dwarves, Salamanders–Frostkin, Salamanders–Merfolk, Salamanders–Treants, Salamanders–Nymphs, Elves–Goblins, Harpies–Birdfolk, Kitsune–Werewolves, Nekomata–Werewolves.

## Formulas

`compat = clamp(40 + rival + group + element + diet + moral + round(0.5 × Charm), 0, 100)`

| Term | Value |
|---|---|
| rival | −50 if rival kinds |
| group | +15 if same group |
| element | −15 if their home element is strong against yours; +15 if your two homes form a known fusion |
| diet | −10 if you drink blood or eat carrion and they don't |
| moral | −25 if they are Seraph and your Corruption ≥ 25; −15 if they are Demon or Lich and your Fate ≥ 50 |

Example: a Merfolk (Charm 7) meeting a Nereid: 40 + 15 (same group) + 4 = 59 → invites; bond starts at 41 and grows +1 per dawn.

## Edge Cases

- A rival's score can reach 0; the invite button is disabled and the reason is shown.
- Starting over clears the companion; dismissing is free and recorded.
- Companion hazards use only their kind's rules (no affinity protections).

## Dependencies

- **Reads**: [Kinds and Bodies](kinds-and-bodies.md), [Elements and Affinity](elements-and-affinity.md), [Survival and Diet](survival-and-diet.md), [People, Reputation and Fate](people-and-reputation.md), [Stats and Daily Actions](stats-and-actions.md) (Charm).
- **Used by**: [Action Combat and Movement](action-combat.md) (companion damage per swing), [Combat](combat.md) (companion damage), [Interface and Controls](interface-and-controls.md) (companion panel, following chibi).
- **Also connected**: [Evolution](evolution.md) (tier raises companion damage).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Base compatibility | 40 | 30–50 | How picky travelers are |
| Invite threshold | 35 | 25–50 | Rival enforcement |
| Rival penalty | −50 | −30 to −80 | Strength of rivalries |
| Dawn bond changes | +3 / +1 / −3 | ±1–5 | Bond pacing |

## Acceptance Criteria

1. A Vampire meeting a Werewolf sees "old enemies" and cannot invite them.
2. A companion follows the player and adds damage in battles.
3. Taking a Merfolk companion to Cindral Wastes lowers bond each action with a message.
4. A companion at bond 0 leaves at dawn and the chronicle records it.
