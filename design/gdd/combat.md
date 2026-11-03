# Combat — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`hunt`, `encounter`, monster roaming in `loop`, `makeMonster`, `respawnMonsters`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

JRPG-style battle on contact. Three creatures roam each land. Touching one starts an auto-resolved battle of up to six rounds using the player's weapon, best spell, passive spells and companion. Winning removes the creature until dawn and pays gold and stats.

## Player Fantasy

"Creatures chase me across the moor, and my Frost Lance makes short work of fire beasts." Combat is quick, readable and element-driven, never twitchy.

## Detailed Rules

- **Roaming**: creatures wander within 8 units of home. They chase the player within 7 units. Contact distance 1.5 starts a battle. After any encounter there is a 2.5 s grace period.
- **Refusals**: with 0 actions left or HP ≤ 10, the creature is pushed back and a message says why. The Hunt button (journal) uses the same checks.
- **Rounds** (max 6, stops if the player's HP ≤ 10):
  1. Player picks the best of weapon or each damage spell (Bolt, Wave, Summon, Ritual) by expected damage.
  2. Companion adds damage.
  3. Creature hits back unless defeated.
- **Passive spells** (known and usable): Ward (−40% damage taken), Weave (heal 12 after a win), Shape (+30% weapon), Enchant (+20% weapon), Summon known (creature hits 15% softer).
- **Spell side costs**: Life source −3 HP per cast; Contract source +1 Corruption per cast; Faith spells are skipped while Corruption > Fate.
- **Outcome**: win: gold, Strength +1, Agility +1, +2 affinity to elements used, blood available for blood-drinkers, companion bond +2; HP ≤ 10: retreat; 6 rounds: creature escapes. The battle result shows in a dialog box with a white flash.
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
- **Used by**: [Survival and Diet](survival-and-diet.md) (blood from hunts), [Night Market and Economy](night-market-and-economy.md) (gold source), [Interface and Controls](interface-and-controls.md) (battle dialog).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Tier scale step | 0.5 | 0.3–0.8 | Late-game threat |
| Max rounds | 6 | 4–10 | Escape frequency |
| Retreat HP | 10 | 5–20 | Safety |
| Chase radius | 7 | 4–12 | Encounter pressure |

## Acceptance Criteria

1. Touching a creature with actions left starts a battle, uses 1 action and shows a result dialog.
2. With HP ≤ 10, touching a creature shows "too badly hurt" and costs nothing.
3. A defeated creature disappears and returns after sleeping.
4. A Water spell beats a Fire creature faster than the weapon alone.
