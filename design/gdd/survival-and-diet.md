# Survival and Diet — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`hazards`, `envEffects`, `COND`, `addCond`, `cure`, `FOODS`, `DIETS`, `DIET_OF`, `dawn`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

Each kind's body reacts to places, weather, time of day and food. Hazards cost HP on every timed action and may cause conditions that last days. Each kind has a diet; eating the wrong food makes you sick and skipping food makes you hungry.

## Player Fantasy

"The world is not equally safe for everyone." A merfolk plans a desert trip around rain; a vampire works by night; a golem buys iron filings.

## Detailed Rules

**Hazards** (checked after every timed action, at the player's land, weather and time):

| Hazard | When | HP per action | Condition chance | Fix shown to the player |
|---|---|---|---|---|
| Can't breathe | Underwater (Aethwyn Mere), not a water breather | 8 | — | Water affinity 30 |
| Drying out | Sea kinds away from water, not raining or storming | 6 | — | Rain or storms |
| Weak element land | Land has the kind's weakness | 6 | — | — |
| Weak element weather | Weather boosts the weakness (outside such lands) | 4 | Sick 15% | — |
| Lava | Cindral Wastes, not lava-safe | 5 | Burned 30% | Fire or Magma 30 |
| Deep cold | Hrimwold, not cold-safe | 4 | Chilled 30% | Ice 30 or Endurance 30 |
| Thin air | Vetharn's Pass, not a sky kind | 3 | — | Air 30 or Endurance 25 |
| Miasma | Veilmoor, living kinds (not Night, not Liches) | 2 | Sick 25% | Death or Spirit 10 |
| Sunlight | Night kinds, daytime, clear or heatwave | 4 (Vampires 8) | — | Act at night or underground |

**Conditions**:

| Condition | Effect | Duration | Cured by |
|---|---|---|---|
| Hungry | Gains ×0.75; −10 HP each dawn | Until you eat suitable food | Eating |
| Well fed | Gains ×1.1 | Until dawn | — |
| Sick | Gains ×0.7, −3 HP per action | 2 dawns | Inn, tonic, Aelarion's blessing |
| Burned | −4 HP per action | 1 dawn | Inn, tonic, blessing |
| Chilled | Gains ×0.85 | 1 dawn | Inn, blessing |

**Diets** (food types each accepts): any = meal, fish, nectar; fish = fish, meal; blood = blood; carrion = carrion, blood; sun = sun, nectar; nectar = nectar, sun; fire = fire; ore = ore; none = never hungry.

**Foods**: Thorngate stew (meal, 6 g), smoked fish (5 g), brazier coals (fire, 4 g), iron filings (ore, 4 g), drink from a sleeper (blood, Night only, Corruption +5, Fate −3); blessed bread (Dawnspire), goat jerky (Pass, 3 g), reef fish (Mere), ice-hole fish (Hrimwold), berries and nectar (Erelian), moon dew (Moonwell), vent coal (Cindral), raw ore (Deep), grave offerings (Veilmoor), sunlight (anywhere, daytime sun), blood from today's hunt (after a hunt win).

**Eating** costs no time. Suitable food: first meal of the day gives Well fed, +5 HP, clears Hungry. Unsuitable: Sick for 2 days.

**Hunger check** at dawn: if the player did not eat suitable food during the day that just ended, they become Hungry and lose 10 HP (not below 1). Day 1 counts as fed.

## Formulas

- HP loss per action = Σ hazard HP + Σ condition HP. Example: a Merfolk in Cindral on a clear day: drying 6 + Fire land 6 = 12 per action.
- Condition roll per hazard per action: `rand < chance`.
- Gains multiplier: see [Stats and Daily Actions](stats-and-actions.md).

## Edge Cases

- A kind whose weakness is the land's element takes the land penalty and skips the weather check and the matching lava/cold hazard (no double counting).
- Kinds with diet "none" cannot eat ("needs no food") and never get hungry.
- Being Sick from a hazard while already Sick keeps the longer duration.
- Hazards never apply to free actions (eating, building).

## Dependencies

- **Reads**: [Kinds and Bodies](kinds-and-bodies.md) (body rules, diet), [World and Regions](world-and-regions.md) (land, weather, time), [Elements and Affinity](elements-and-affinity.md) (protections), [Stats and Daily Actions](stats-and-actions.md) (Endurance protections).
- **Used by**: [Stats and Daily Actions](stats-and-actions.md) (gain multipliers, faint), [Companions](companions.md) (companions suffer the same hazards, losing bond), [Combat](combat.md) (blood from hunts), [People, Reputation and Fate](people-and-reputation.md) (sleeper feeding).
- **Also connected**: [Interface and Controls](interface-and-controls.md) (hazard warnings, food row), [Night Market and Economy](night-market-and-economy.md) (food costs gold).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Hazard HP | 2–8 | 1–12 | Danger of lands |
| Condition chances | 15–30% | 5–50% | Lingering punishment |
| Hunger dawn damage | 10 | 5–20 | Importance of eating |
| Protection thresholds | 10 / 25 / 30 | 10–60 | How fast a body adapts |

## Acceptance Criteria

1. A Human acting in Aethwyn Mere loses 8 HP per action until Water affinity reaches 30.
2. A Vampire eating stew becomes Sick for 2 days.
3. A Golem eating iron filings is fed and not Hungry the next dawn.
4. A Lich has no food row and never becomes Hungry.
5. The Act page names each active hazard with its HP cost and fix.
