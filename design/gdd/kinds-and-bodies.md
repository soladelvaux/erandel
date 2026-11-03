# Kinds and Bodies — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`RACE_DEF`, `RACES`, `DIET_OF`, `WATER_BREATH`, `FIRE_SAFE`, `COLD_SAFE`, `charSpec`, `newChar`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

The player chooses one of 36 kinds in 8 groups when Aelarion asks what form their reborn soul will take. A kind sets starting stat bonuses, a home element, a weakness, a natural magic source, a diet, body rules (breathing, lava, cold, thin air, sunlight), 3 to 6 Tier-2 evolution paths with Tier-3 forms, and a light and a dark legendary form.

## Player Fantasy

"I am not a generic hero; I am a merfolk who must stay near water, or a vampire who works at night." The kind is an identity with real advantages and limits, and the world treats each kind differently.

## Detailed Rules

**Groups and kinds** (36):

| Group | Kinds |
|---|---|
| Sea | Merfolk, Sirens, Selkies, Nereids |
| Night | Vampires, Werewolves, Ghouls, Shades |
| Nature | Nymphs, Elves, Fae, Treants, Satyrs |
| Sky | Harpies, Birdfolk, Sylphs, Tengu |
| Elemental | Salamanders, Golems, Djinn, Frostkin |
| Beastfolk | Kitsune, Nekomata, Minotaurs, Centaurs, Lizardfolk |
| Divine & cursed | Seraphs, Fallen, Demons, Tieflings, Liches |
| Small folk & humans | Dwarves, Gnomes, Halflings, Goblins, Humans |

**Each kind defines**: name, singular, group, home element (Humans: none until Tier 2), weakness element, natural magic source, stat bonus string (for example `agi2 cha2`), trait text, paths `Name:stat:Tier3`, legend, dark legend.

**Starting state**: every stat 5 + kind bonus; home element affinity 12; gold 30; wood 10; stone 4; Halflings start with Fate 15; Liches Corruption 15; Fallen Corruption 10. Distrusted kinds (Ghouls, Demons, Tieflings, Goblins, Harpies, Liches, Fallen) start with Thorngate reputation −15 and Ysolde −10.

**Body rules**:
- Water breathers: Merfolk, Sirens, Selkies, Nereids, Lizardfolk.
- Sea group dries out away from water unless it rains or storms.
- Lava-safe: Salamanders, Djinn, Demons, Tieflings, Golems, and any kind whose home is Fire or Magma.
- Cold-safe: Frostkin, Werewolves, Selkies, Golems, Minotaurs, and home Ice.
- Sky group thrives in thin air.
- Night group: stung by sunlight (Vampires burned harder).
- Every kind with a weakness is sickened by places and weather of that element.

**Diets** (see [Survival and Diet](survival-and-diet.md)): fish (sea kinds, Frostkin, Nekomata, Lizardfolk), blood (Vampires), carrion (Ghouls), sun (Nymphs, Treants), nectar (Fae), fire (Salamanders, Djinn), ore (Golems), none (Shades, Sylphs, Liches), any (everyone else).

**Looks**: each kind has a chibi spec (skin, hair, robe in home-element colour, eyes, and features such as elf ears, horns, wings, tails, beards, hats).

## Formulas

- `stat_start(k) = 5 + bonus_k` where `bonus_k ∈ {0..3}`. Example: Merfolk Agility = 5 + 2 = 7.
- `HP_max = round(60 + 2 × Endurance)`. Example: Endurance 7 → 74.
- Total starting stats: 30 + Σbonus (4 for most kinds, 6 for Humans).

## Edge Cases

- **Humans** have no home element. At Tier 2 their strongest affinity becomes home; if they have none, home stays empty and elemental combat multipliers against them are 1.
- **Seraphs** turn into **Fallen** at dawn when Corruption ≥ 25; Fallen return to Seraphs at Fate ≥ 70 with Corruption ≤ 10. Home element, natural source and (if Tier 2 or 3) path are re-chosen; Tier 4 keeps its legendary name.
- A weakness that is also a region's element replaces the weather-sickness check in that region (no double penalty).

## Dependencies

- **Used by**: [Stats and Daily Actions](stats-and-actions.md), [Evolution](evolution.md), [Elements and Affinity](elements-and-affinity.md), [Survival and Diet](survival-and-diet.md), [Magic](magic.md), [Companions](companions.md), [People, Reputation and Fate](people-and-reputation.md), [Interface and Controls](interface-and-controls.md).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Base stat | 5 | 3–8 | Early difficulty for every kind |
| Kind bonus total | 4 (Humans 6) | 3–6 | Kind identity strength |
| Starting home affinity | 12 | 10–20 | Whether a kind can forge a spell on day 1 (needs 10) |
| Distrust penalty | −15 town, −10 innkeeper | −30 to 0 | How hard distrusted kinds start |

## Acceptance Criteria

1. All 36 kinds are selectable on the Thorngate screen and show home element, weakness, diet, body notes, paths and legends.
2. A new character's stats equal 5 + kind bonus; HP equals 60 + 2 × Endurance.
3. A Seraph with Corruption 25 at dawn becomes Fallen and the chronicle records it.
4. Each kind renders as a distinct chibi with its features in the 3D world.
5. Automated engine playthrough runs every kind for 25 days with no errors.
