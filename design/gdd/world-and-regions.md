# World and Regions — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`REG`, `CENTERS`, `BIOME`, `TAGLINE`, `heightAt`, `regionAt`, `WEATHER`, `weatherHere`, `SP`, `NPC_POS`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

Erandel is one open world of ten lands around the Thorngate. The player walks freely between them; crossing a border shows a JRPG title banner. Each land has elements, weather rules, a resident person, two kinds of roaming creatures, special actions and its own look.

## Player Fantasy

"I can see the whole of Erandel and walk anywhere." Each land feels like a different place to live, with its own dangers for my kind.

## Detailed Rules

**Map**: x −80 to 80, z −80 to 100 (world units). Region = nearest region centre. Terrain height and colour blend between region biomes; the Aethwyn river is carved from Vetharn's Pass through Erelian into the Mere; the map border rises into mountains.

| Land | Centre | Elements | Person | Special actions | Creatures |
|---|---|---|---|---|---|
| Thorngate | (0, 38) | none (town) | Ysolde, innkeeper | night market, inn, tonic, fortune charm, look for companion, buy timber, buy stone | Rat King, Cutpurse Gang |
| Erelian | (−46, 8) | Nature | Elash | plant trees, gather wood, burn the woods | Thornback Boar, Will-o'-Wisp |
| Aethwyn Mere | (−52, 58) | Water (underwater) | Queen Maren | dive for pearls | Reef Shark, Drowned Sailor |
| Dawnspire | (40, 30) | Light | Brother Aldric | pray | Fallen Templar, Corrupted Acolyte |
| Caelithra's Moonwell | (10, −8) | Moon, Spirit | Caelithra | moonbathe | Moon Moth Swarm, Lunar Stag |
| Vetharn's Pass | (−4, −50) | Air, Lightning | Tovin | climb, quarry stone | Storm Roc, Gale Harpy |
| Hrimwold | (−48, −46) | Ice | Hilde | endure the cold, gather wood | Frost Wolf, Rime Wraith |
| Cindral Wastes | (56, −12) | Fire, Magma | Kesh | forge at the vents | Ember Wisp, Ash Drake Whelp |
| Runekar's Deep | (46, −54) | Earth (underground) | Runekar | mine ore | Cave Golem, Deep Crawler |
| The Veilmoor | (0, 84) | Death, Shadow | Nyx | honour the dead, dark rite | Restless Ghoul, Wailing Shade |

**Thorngate layout**: the road runs north–south (x −3 to 3); the thorn arch gate stands at z 52 with Aelarion at (2.6, 53.2); the player spawns south of the gate at (0, 60); the player's plot lies east of the road (see [Building](building.md)).

**Weather** is rolled at dawn from clear ×3, rain ×2, storm, fog, heatwave, snow. Local overrides: Runekar's Deep is always Underground; Hrimwold turns rain, heat and storm to snow; Cindral turns rain, snow and fog to heatwave; the Mere and temperate lands turn snow to rain; the Veilmoor turns heat to fog; Erelian turns heat to clear.

| Weather | Boosts | Weakens |
|---|---|---|
| Rain | Water, Nature | Fire |
| Storm | Lightning, Air | Fire |
| Snow | Ice | Nature |
| Heatwave | Fire, Magma | Ice |
| Fog | Shadow, Spirit | Light |
| Underground | Earth | — |

**Time of day** comes from actions used (see [Stats and Daily Actions](stats-and-actions.md)) and changes lighting, glow and some multipliers.

## Formulas

- `region(x, z) = argmin over centres of (x − cx)² + (z − cz)²`.
- Biome weight `w = exp(−d² / (2 × 22²))`; height = Σw·h / Σw + noise × amplitude.
- River carve: `−3.4 × exp(−d² / 9)` within 7 units of the river line.
- Weather probabilities: clear 3/9, rain 2/9, storm, fog, heat, snow 1/9 each.

## Edge Cases

- Walking across a border mid-market closes the market and leaves build mode.
- Underwater areas: the camera tints teal and the water surface fades so the player can see.
- Faint always returns the player to Thorngate (2, 46).

## Dependencies

- **Used by**: [Action Combat and Movement](action-combat.md) (terrain, crags), [Multiplayer](multiplayer.md) (world bounds, lands), [Elements and Affinity](elements-and-affinity.md) (region and weather multipliers), [Survival and Diet](survival-and-diet.md) (hazards), [People, Reputation and Fate](people-and-reputation.md) (residents, region reputation), [Combat](combat.md) (creatures), [Building](building.md) (plot in Thorngate), [Night Market and Economy](night-market-and-economy.md) (materials, market), [Audio and Atmosphere](audio-and-atmosphere.md) (weather and light), [Interface and Controls](interface-and-controls.md) (banners).
- **Also connected**: [Stats and Daily Actions](stats-and-actions.md) (land actions, study bonus in Thorngate and Dawnspire).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Biome blend radius | 22 | 15–30 | How sharp land borders look |
| Weather weights | 3/2/1/1/1/1 | any | How often hazards and boosts appear |
| Creatures per land | 3 | 1–6 | Encounter density |

## Acceptance Criteria

1. Walking from Thorngate to every land shows its title banner and updates the HUD land name.
2. Each land shows its person, creatures and special actions.
3. Runekar's Deep always reports Underground weather; Hrimwold never reports rain.
4. The river is visible as water from Vetharn's Pass to the Mere.
