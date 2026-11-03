# Magic — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`SRC`, `FORMS`, `FUSION`, `spellPower`, `forgeState`, forge action, `CODEX`, `checkSources`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

A spell is Source + Element (+ optional second element) + Form. Players invent spells in the forge; the first person to make a combination in this browser's world is recorded as its creator in the spell codex. Spells are used automatically in battles.

## Player Fantasy

"I invented Storm Surge, and my name is in the codex." Magic is a creative act, not a skill tree.

## Detailed Rules

**Sources** (unlocked when the requirement is met; each kind starts with its natural source):

| Source | Power stat | Requirement | Side effect |
|---|---|---|---|
| Mana | Mind | Mind 12 | — |
| Life Essence | Endurance | Corruption 10 | −3 HP per cast |
| Nature Pact | Spirit | Nature 10 | ×1.3 in Erelian, Moonwell, Mere; ×0.6 in Thorngate |
| Spirit Bond | Spirit | Spirit 14 | — |
| Voice & Song | Charm | Charm 14 | — |
| Faith | Spirit | Spirit 12 and Fate 15 | Silent while Corruption > Fate |
| Contract | Charm | Charm 12 and Corruption 5 | +1 Corruption per cast |
| Runes | Mind | Mind 14 and Strength 10 | ×1.15 power |

**Forms**: Bolt (×1.1), Wave (×1.0), Summon (×0.9, enemies hit 15% softer), Ritual (×1.6, fails half the time), Ward (passive −40% damage), Weave (passive heal 12 after a win), Shape (passive weapon +30%), Enchant (passive weapon +20%).

**Forging** (1 action, Mind +1): needs an unlocked source and an element at Spark (10). Fusion needs both elements at Flow (30). Max 6 spells; Forget is free. A spell already in your book cannot be forged again.

**Names**: auto name = element word + form noun (Frost Lance, Tide Surge), or a fusion word (Storm, Eclipse, Steam, Bloom...) + noun; the player may type a name (28 characters). If the combination already exists in the codex, the player learns it under the creator's name.

## Formulas

`power = (5 + 0.6 × stat[source] + 0.3 × A) × sourceMod`, where `A = affinity` (fusion: `(a1 + a2) / 2 + 5`).

Example: Mana Ice Bolt with Mind 15, Ice 40: power = 5 + 9 + 12 = 26; Bolt damage vs an Air creature = 26 × 1.5 × 1.1 ≈ 43.

## Edge Cases

- The codex lives in browser storage and is shared by every character made in that browser; it survives starting over.
- Faith spells stay in the book while silent and show "Silent".
- Losing an element's affinity is not possible, so spells never become invalid.

## Dependencies

- **Reads**: [Elements and Affinity](elements-and-affinity.md), [Stats and Daily Actions](stats-and-actions.md), [People, Reputation and Fate](people-and-reputation.md) (Fate and Corruption gates).
- **Used by**: [Combat](combat.md), [Interface and Controls](interface-and-controls.md) (Magic page).
- **Also connected**: [Kinds and Bodies](kinds-and-bodies.md) (each kind starts with its natural source).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Power stat weight | 0.6 | 0.3–1 | Stat vs affinity balance |
| Affinity weight | 0.3 | 0.2–0.6 | Value of living with elements |
| Spellbook size | 6 | 4–10 | Build variety |
| Ritual fail chance | 50% | 30–60% | Risk/reward |

## Acceptance Criteria

1. With Mind below 12 and no natural Mana, Mana is shown locked with "Needs Mind 12".
2. Forging a new combination records the player as creator in the codex table.
3. Forging the same combination with a second character learns it under the first creator's name.
4. A 7th spell is refused until one is forgotten.
