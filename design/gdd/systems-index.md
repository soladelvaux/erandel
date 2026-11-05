# Systems Index: Erandel

---
**Status**: Reverse-Documented from `src/index.html` (v0.3.0)
**Date**: 2026-11-03
---

## Overview

Erandel is a cozy open-world life-sim JRPG. Fourteen systems make up the game. All of them already exist in code; these documents capture current behaviour so future work can be designed, reviewed and tested against them.

## Systems Enumeration

| # | System | GDD | Category | Layer | Status |
|---|---|---|---|---|---|
| 1 | Kinds and Bodies | [kinds-and-bodies.md](kinds-and-bodies.md) | Core | Foundation | Implemented |
| 2 | Stats and Daily Actions | [stats-and-actions.md](stats-and-actions.md) | Core | Foundation | Implemented |
| 3 | World and Regions | [world-and-regions.md](world-and-regions.md) | Gameplay | Foundation | Implemented |
| 4 | Elements and Affinity | [elements-and-affinity.md](elements-and-affinity.md) | Progression | Core | Implemented |
| 5 | Evolution | [evolution.md](evolution.md) | Progression | Core | Implemented |
| 6 | Survival and Diet | [survival-and-diet.md](survival-and-diet.md) | Gameplay | Core | Implemented |
| 7 | People, Reputation and Fate | [people-and-reputation.md](people-and-reputation.md) | Gameplay | Core | Implemented |
| 8 | Combat | [combat.md](combat.md) | Gameplay | Feature | Implemented |
| 9 | Magic | [magic.md](magic.md) | Progression | Feature | Implemented |
| 10 | Companions | [companions.md](companions.md) | Gameplay | Feature | Implemented |
| 11 | Building | [building.md](building.md) | Gameplay | Feature | Implemented |
| 12 | Night Market and Economy | [night-market-and-economy.md](night-market-and-economy.md) | Economy | Feature | Implemented |
| 13 | Interface and Controls | [interface-and-controls.md](interface-and-controls.md) | UI | Presentation | Implemented |
| 14 | Audio and Atmosphere | [audio-and-atmosphere.md](audio-and-atmosphere.md) | Audio | Polish | Implemented |
| 15 | Action Combat and Movement | [action-combat.md](action-combat.md) | Gameplay | Feature | Implemented |
| 16 | Multiplayer | [multiplayer.md](multiplayer.md) | Meta | Feature | Implemented |
| 17 | Accounts and Cloud Saves | [accounts.md](accounts.md) | Persistence | Feature | Implemented |

## Categories

- **Core**: Kinds and Bodies, Stats and Daily Actions
- **Gameplay**: World, Survival, People, Combat, Companions, Building
- **Progression**: Elements, Evolution, Magic
- **Economy**: Night Market and Economy
- **UI**: Interface and Controls
- **Audio**: Audio and Atmosphere

## Priority Tiers

| Tier | Systems |
|---|---|
| P0 (the game does not exist without it) | Kinds, Stats and Actions, World, Evolution, Interface |
| P1 (core identity) | Elements, Survival, People, Building, Night Market |
| P2 (depth) | Combat, Action Combat and Movement, Magic, Companions, Multiplayer, Accounts and Cloud Saves |
| P3 (polish) | Audio and Atmosphere |

## Dependency Map

### Foundation Layer (no dependencies)
Kinds and Bodies, Stats and Daily Actions, World and Regions

### Core Layer (depends on foundation)
Elements (World, Kinds), Evolution (Stats, Elements, Kinds, People), Survival (Kinds, World, Elements, Stats), People (Stats, World)

### Feature Layer (depends on core)
Combat (Stats, Elements, Magic, Companions, World), Magic (Elements, Stats, People), Companions (Kinds, Survival, Combat), Building (World, Economy), Night Market and Economy (Building, People, Stats)

### Presentation Layer (depends on features)
Interface and Controls (all systems)

### Polish Layer (depends on everything)
Audio and Atmosphere (World time and weather, Interface)

## Recommended Design Order

For new work: Foundation → Core → Feature → Presentation → Polish. Change Kinds, Stats or World only with a full `/review-all-gdds` pass, because every other system reads them.

## Circular Dependencies

- **Evolution ↔ Kinds**: Seraph/Fallen conversion changes the kind, and the kind decides evolution paths. Resolved by running conversion before the evolution check at dawn.
- **Building ↔ Economy**: building costs gold; selling needs buildings. Resolved by a free 30-piece starter plot with one stall.

## High-Risk Systems

| System | Risk | Mitigation |
|---|---|---|
| Night Market and Economy | Out-earns every other gold source | Balance check 2026-11-03: market held to 2–5× work at start, ≤ 8× late; regression tests in `tests/unit/engine/economy-balance.test.js` |
| Interface and Controls | Phone performance with bloom and point lights | Glow toggle; 4 point lights on phones; pixel ratio capped at 1.25 |
| Survival and Diet | Can feel punishing for sea and night kinds | Every hazard names a fix in the UI; Aelarion's daily blessing |

## Progress Tracker

| System | Designed | Implemented | Tested (automated) | Visual evidence |
|---|---|---|---|---|
| All 14 systems | Reverse-documented | Yes | Engine playthrough for all 36 kinds; market simulation; build rules | `production/qa/evidence/` |

## Next Steps

1. Creator review of every GDD (Status: pending review).
2. `/review-all-gdds` for cross-system consistency.
3. `/balance-check` on the economy.
