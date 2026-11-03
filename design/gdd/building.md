# Building — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`PLOT`, `POND`, `CATALOG`, `STARTER`, `canPlace`, `buildPlace`, `buildRemove`, `ambience`, `ITEM_BUILD`, `addItemMesh`, `initPointer`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented (3D only; the 2D fallback has no build mode)
---

## Overview

The player owns a lantern plot east of the Thorngate road: a 14 × 10 grid, half land and half pond. In build mode they place decks, lights, stalls, gates and plants. Every piece adds ambience, which makes the night market better and brings blessings at high values.

## Player Fantasy

"This glowing little night market by the water is mine." Decorating is calm, free of time pressure, and visibly changes the world.

## Detailed Rules

- **Plot**: 14 columns × 10 rows of 2-unit tiles, x 4–32, z 28–48. Pond: ellipse centred (23, 38), radii 8.5 × 7. A tile is water if its centre is in the pond.
- **Layers**: each tile has a floor layer and an object layer.
- **Placement rules**: inside the plot; layer free; water-only items (lilies, floating lanterns) need open water with no deck; land-only items (stone path, flowers, bamboo) need land; other objects on water need a boardwalk first; a deck cannot be laid over water items.
- **Removing**: removes the object first, then the floor; a deck with something on it cannot be removed; refunds half of each cost (rounded down).
- **Rotation**: 4 directions; multi-tile items swap width and depth.
- **Cost**: building takes no actions; gold, wood and stone are paid on placement.
- **Starter plot**: new characters get 30 free pieces (boardwalk into the pond, a market stall, lanterns, a paper lantern, a stone lantern, a moon ring, a garland, a parasol, flowers, bamboo, lilies, floating lanterns) for ambience 69.
- **Access**: hammer button or B key, only while in Thorngate. The camera moves overhead; drag to pan, pinch or wheel to zoom, tap a tile to place. Green highlight = allowed, red = not.

**Catalog**:

| Item | Cost | Ambience | Size | Where | Notes |
|---|---|---|---|---|---|
| Boardwalk | 2 wood | 1 | 1×1 | any (floor) | build over the pond |
| Stone path | 1 stone | 1 | 1×1 | land (floor) | |
| Lantern post | 8 gold, 1 wood | 3 | 1×1 | any | light |
| Paper lantern | 15 gold | 5 | 1×1 | any | light |
| Stone lantern | 3 stone | 4 | 1×1 | any | light |
| Light garland | 12 gold | 4 | 1×1 | any | string lights |
| Torii gate | 50 gold, 6 wood | 12 | 3×1 | any | |
| Market stall | 70 gold, 8 wood | 6 | 2×2 | any | sells 5 |
| Tea house | 140 gold, 12 wood, 4 stone | 10 | 2×2 | any | sells 8 |
| Parasol table | 20 gold, 2 wood | 4 | 1×1 | any | |
| Flower bed | 6 gold | 2 | 1×1 | land | |
| Wisteria arch | 14 gold, 1 wood | 5 | 1×1 | any | |
| Bamboo | 4 gold | 2 | 1×1 | land | |
| Lily pads | 3 gold | 2 | 1×1 | water | |
| Floating lanterns | 6 gold | 4 | 1×1 | water | light |
| Bench | 3 wood | 2 | 1×1 | any | |
| Moon ring | 40 gold, 2 stone | 8 | 1×1 | any | light |

## Formulas

- `ambience = round(Σ over items of amb × 0.8^(k − 1))`, where k is the item's copy number of its type (the 1st lantern counts 3, the 2nd 2.4, the 3rd 1.92...). One type repeated forever adds at most 5× its single value. Starter: 69.
- Cost of the next copy of a decoration = `ceil(base × 1.1^n)` per resource, where n = copies already placed; floors (boardwalk, stone path) never grow. Example: the 4th lantern post costs 11 gold and 2 wood.
- Refund = `floor(base cost / 2)` per resource. Example: lantern post → refund 4 gold 0 wood.
- Dawn bonus: ambience ≥ 100 → Fate +1; ambience ≥ 150 → Thorngate reputation +2.

## Edge Cases

- Leaving Thorngate closes build mode.
- Not enough materials: "You need 70 gold · 8 wood." and nothing is placed.
- Items whose footprint crosses the plot edge are refused.
- Saves from before building existed get the starter plot once on load.

## Dependencies

- **Reads**: [World and Regions](world-and-regions.md) (Thorngate plot, pond), [Night Market and Economy](night-market-and-economy.md) (gold, wood, stone).
- **Used by**: [Night Market and Economy](night-market-and-economy.md) (sellers, ambience), [People, Reputation and Fate](people-and-reputation.md) (dawn Fate bonus), [Interface and Controls](interface-and-controls.md) (build bar, camera), [Audio and Atmosphere](audio-and-atmosphere.md) (item lights and glows).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Plot size | 14 × 10 | 10–20 per side | Creative space |
| Item costs | table | ±50% | Build pacing |
| Ambience values | table | 1–15 | Market strength |
| Refund rate | 50% of base | 0–100% | Freedom to redesign |
| Ambience decay per copy | 0.8 | 0.6–0.95 | Reward for variety |
| Cost growth per copy | 1.1 | 1.0–1.3 | Late gold sink |
| Ambience bonus thresholds | 100 / 150 | 80–250 | Long-term goals |

## Acceptance Criteria

1. Placing a lantern on open water is refused with "Build a boardwalk over the water first."
2. Lily pads on land are refused; bamboo on water is refused.
3. Removing a lantern post returns 4 gold (half the base cost); the 4th lantern post costs 11 gold.
4. A torii does not fit where its 3 tiles would leave the plot.
5. New characters start with ambience 69 and one market stall.
