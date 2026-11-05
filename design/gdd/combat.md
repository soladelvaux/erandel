# Combat — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`hunt`, `encounter`, monster roaming in `loop`, `makeMonster`, `respawnMonsters`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

Since v0.4.0, creatures in the 3D world are fought in real time (see [Action Combat and Movement](action-combat.md), which reuses the formulas below). This document now covers the **Hunt** action: from the journal (and in the 2D journal-only mode) the player picks a fight with a local creature, resolved automatically of up to six rounds using the player's weapon, best spell, passive spells and companion. Winning removes the creature until dawn and pays gold and stats.

## Player Fantasy

"Creatures chase me across the moor, and my Frost Lance makes short work of fire beasts." Combat is quick, readable and element-driven, never twitchy.

## Detailed Rules

- **Roaming and real-time fights**: see [Action Combat and Movement](action-combat.md). Touching a creature no longer starts a battle.
- **Refusals**: with 0 actions left or HP ≤ 10 the Hunt action is refused with a message.
- **Rounds** (max 6, stops if the player's HP ≤ 10):
  1. Player picks the best of weapon or each damage spell (Bolt, Wave, Summon, Ritual) by expected damage.
  2. Companion adds damage.
  3. Creature hits back unless defeated.
- **Passive spells** (known and usable): Ward (−40% damage taken), Weave (heal 12 after a win), Shape (+30% weapon), Enchant (+20% weapon), Summon known (creature hits 15% softer).
- **Spell side costs**: Life source −3 HP per cast; Contract source +1 Corruption per cast; Faith spells are skipped while Corruption > Fate.
- **Outcome**: win: gold, Strength +1, Agility +1, +2 affinity to elements used, blood available for blood-drinkers, companion bond +2; HP ≤ 10: retreat; 6 rounds: creature escapes. The result is written to the log.
- **Respawn**: all creatures return at dawn.

## Formulas

| Quantity | Formula |
|---|---|
| Creature scale | `s = 1 + 0.5 × (tier − 1)` (HP and attack) |
| Weapon damage | `(4 + 0.5 × Str + 0.3 × Agi) × shape × enchant × rand(0.85, 1.15)` |
| Spell damage | `power × elemMult(spell, creature) × formMult × rand(0.85, 1.15)`; Ritual: 50% chance of 0, else `power × mult × 1.6` |
| Companion damage | `(5 + 3 × tier + 0.05 × bond) × elemMult(companion home, creature) × rand(0.85, 1.15)` |
| Damage taken | `max(1, atk × s × elemMult(creature, player home) × ward × summon × rand(0.8, 1.2) − 0.2 × End)` |
| Gold won | `round(base gold × s × rand(0.8, 1.2))` |

Example: Tier 1, Str 7, Agi 9: weapon ≈ (4 + 3.5 + 2.7) = 10.2 per round; a Reef Shark (45 HP, 8 atk) falls in about 5 rounds and deals about 6–8 per round to Endurance 7.

## Edge Cases

- Fainting from battle damage triggers the faint rule (Thorngate, −30% gold, dawn).
- If the creature's land differs from the player's at the border, a random creature of the player's land is fought.
- Creatures never enter the player's plot or leave their land.

## Dependencies

- **Reads**: [Stats and Daily Actions](stats-and-actions.md), [Elements and Affinity](elements-and-affinity.md), [Magic](magic.md), [Companions](companions.md), [World and Regions](world-and-regions.md), [Evolution](evolution.md) (tier scaling).
- **Used by**: [Action Combat and Movement](action-combat.md) (shared formulas), [Survival and Diet](survival-and-diet.md) (blood from hunts), [Night Market and Economy](night-market-and-economy.md) (gold source), [Interface and Controls](interface-and-controls.md) (battle dialog).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Tier scale step | 0.5 | 0.3–0.8 | Late-game threat |
| Max rounds | 6 | 4–10 | Escape frequency |
| Retreat HP | 10 | 5–20 | Safety |
| Chase radius | 7 | 4–12 | Encounter pressure |

## Acceptance Criteria

1. The Hunt action with actions left uses 1 action and logs a battle result.
2. With HP ≤ 10, Hunt shows "too badly hurt" and costs nothing.
3. A creature defeated in the 3D world disappears and returns after 75 s or at dawn.
4. A Water spell beats a Fire creature faster than the weapon alone.
