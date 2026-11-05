# Stats and Daily Actions — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`STATS`, `addStat`, `gainMult`, `ACTS`, `SP`, `doAction`, `dawn`, `sleep`, `faint`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

Six stats (Strength, Agility, Mind, Spirit, Charm, Endurance) grow only through what the player does. Each in-game day has a small action budget split into Morning, Afternoon and Night. Sleeping ends the day and triggers dawn, where the world reacts.

## Player Fantasy

Every choice of the day matters. "Do I train, help someone, or gather wood for my market?" Days feel like pages of a life.

## Detailed Rules

**Action budget**: 3 actions per day, 4 when Endurance ≥ 25. Actions used decide the time: 0 = Morning, 1 = Afternoon, 2+ = Night. Free actions (eating, buying tonics, charms, timber, stone, taking a job, forgetting a spell, building) cost no time.

**Common actions** (1 action each):

| Action | Effect |
|---|---|
| Train | Strength +2, Endurance +1, −4 HP |
| Explore | Agility +2, Endurance +1; find chance gives gold 10–25, herbs (+15 HP) or carving (Mind +2) |
| Study | Mind +2 (+3 in Thorngate and Dawnspire) |
| Meditate | Spirit +2, Spirit affinity +2 |
| Socialize | Charm +2, local reputation +2, local person +2 |
| Hunt | Fight a local creature (see [Combat](combat.md)) |
| Rest | +25 HP |
| Work | Job pay and experience (see [Night Market and Economy](night-market-and-economy.md)) |
| Practice element | Chosen affinity +4 (with multipliers), Mind +1 |

Region actions (pearls, planting, burning, forging, climbing, enduring, mining, honouring the dead, dark rites, praying, moonbathing, gathering wood, quarrying, the night market) are listed in [World and Regions](world-and-regions.md).

**After every timed action**: hazards apply ([Survival and Diet](survival-and-diet.md)), condition damage applies, new magic sources are checked, HP is capped at max. If HP ≤ 0 the player faints.

**Dawn** (Sleep): day +1, actions reset, new weather, +30 HP, conditions tick down, hunger check, companion bond check, Seraph/Fallen conversion, evolution check, luck rolls, building ambience bonus.

**Faint**: lose 30% of gold, carried to Thorngate, HP set to 1, then a dawn happens.

## Formulas

`gain = n × M`, where `M = night × pet × Π(conditions)`.

| Variable | Values |
|---|---|
| n | the action's base amount (1–3) |
| night | Night kinds: 1.3 at Night, 0.8 in daytime sun (clear or heatwave, not underground); others 1 |
| pet | 1.1 with a companion pet, else 1 |
| conditions | hungry 0.75, fed 1.1, sick 0.7, chilled 0.85 |

Example: a well-fed Vampire training at Night: Strength gain = 2 × 1.3 × 1.1 = 2.86.

- Explore find chance = `20 + 0.2 × Fate` percent (20–40%).
- Endurance 25 adds the 4th action: reachable around day 10–15 with steady Endurance training.

## Edge Cases

- An action with 0 actions left shows "You are too tired. Sleep until dawn" and does nothing.
- An action that fails its check (wrong region, not enough gold) costs nothing.
- Fainting during a hunt still ends with a dawn; the market (if open) closes first.
- The 4th action appears mid-day if Endurance crosses 25; the time label is based on actions used, so the day simply gets one more Night slot.

## Dependencies

- **Reads**: [Kinds and Bodies](kinds-and-bodies.md) (starting stats), [Survival and Diet](survival-and-diet.md) (conditions).
- **Used by**: [Action Combat and Movement](action-combat.md) (Str, Agi, Mind, End), [Evolution](evolution.md), [Combat](combat.md), [Magic](magic.md), [People, Reputation and Fate](people-and-reputation.md), [Night Market and Economy](night-market-and-economy.md), [World and Regions](world-and-regions.md), [Interface and Controls](interface-and-controls.md).
- **Also connected**: [Companions](companions.md) (Charm raises compatibility).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Actions per day | 3 | 2–5 | Pace of the whole game |
| Endurance for extra action | 25 | 20–40 | Reward for training Endurance |
| Dawn heal | 30 HP | 20–50 | Forgiveness of hazards |
| Faint gold loss | 30% | 10–50% | Risk of dangerous regions |
| Night-kind multipliers | 1.3 / 0.8 | 1.1–1.5 / 0.6–0.9 | Night identity |

## Acceptance Criteria

1. A new character has 3 action pips; using 3 timed actions leaves 0 and disables timed buttons.
2. Endurance ≥ 25 shows 4 pips.
3. Training once raises Strength by 2 × the current multiplier and lowers HP by 4.
4. Sleeping moves to the next day, restores 30 HP (capped) and rolls weather.
5. Reaching 0 HP returns the player to Thorngate with 70% of their gold.
