# Night Market and Economy — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`salesCap`, `salePrice`, `marketCheck`, `openMarket`, `closeMarket`, `updateCustomers`, `spawnCustomer`, `dawnHook`, `JOBS`, `JOB_RANKS`, `SP` buywood/buystone/chop/quarry/mine, `FOODS`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

Three resources: gold, wood and stone. Gold comes from jobs, trading, hunting, exploring, pearls, mining, luck and, most of all, the night market. Wood and stone are gathered in specific lands or bought in Thorngate and spent on building. Once a day the player can open a night market: chibi travelers of every kind walk in through the gate, queue at the stalls, and buy.

## Player Fantasy

"The lanterns are lit and the travelers are coming." Watching gold tick up as a queue forms at a stall I built is the payoff of the day.

## Detailed Rules

**Night market**:
- Open from the top pill or the Act page, in Thorngate only, once per day, costs 1 action, needs at least one stall or tea house.
- Travelers (random kinds, some in straw hats) spawn at the gate, walk the road, queue in front of a random seller, wait 2.2 s with a coin bubble, pay, and leave.
- Up to 9 travelers on screen. The market closes when every allowed sale is done, when the player leaves Thorngate, sleeps, or taps Close.
- Each sale: gold + price, Thorngate reputation +0.3.
- 2D fallback (no WebGL): all sales settle instantly.

**Jobs** (taken at the Thorngate guild, free; changing resets experience): 27 jobs, each with a stat and often an element (Blacksmith: Strength/Fire, Fisher: Endurance/Water, Thief: Agility/Shadow with Corruption +2 per shift...). Ranks: Apprentice 0, Journeyman 30, Expert 80, Master 160 experience.

**Materials**: Gather wood (Erelian, Hrimwold): +3 wood, Strength +1. Quarry stone (Vetharn's Pass): +3 stone, Strength +1, Endurance +1. Mine ore (Runekar's Deep): 5–14 gold, +2 stone. Buy timber: 10 gold → 3 wood. Buy cut stone: 12 gold → 3 stone (both free actions).

**Gold sinks**: building, inn 8, tonic 15, fortune charm 40 (Fate +3, once a day), food 3–6, faint loss 30%.

## Formulas

| Quantity | Formula | Example (starter plot) |
|---|---|---|
| Sales cap | `min(24, 3 × stalls + 5 × tea houses + floor(ambience / 10))` | 3 + 6 = 9 |
| Price per sale | `round(sells × (1 + ambience/300) × (1 + max(0, repThorngate)/200) × (1 + Charm/200))` | 5 × 1.23 × 1 × 1.035 ≈ 6 |
| Night income | cap × price | ≈ 54 gold for 1 action (late rich plot ≈ 330) |
| Spawn interval | `max(1.6, 5 − 0.03 × ambience)` s | 2.5 s |
| Work pay | `round(8 + 8 × rank + 0.4 × stat)`, halved if land reputation ≤ −40 | Apprentice, stat 10 → 12; Master, stat 30 → 44 |
| Job experience | 3 per shift, 4.5 in a land matching the job's element | |
| Fallback reputation | `+min(8, 0.3 × cap)` | |

**Balance targets** (balance check 2026-11-03, `design/balance/balance-check-economy-2026-11-03.md`): the market is the best gold action but earns 2–5× an apprentice work shift at the start and at most 8× a master shift late. Measured: 54 at start (work 12), 118 mid, 327 late (work 44). Pinned by `tests/unit/engine/economy-balance.test.js`.

## Edge Cases

- Opening twice in a day: "You already held the market today."
- Removing a stall during a market sends its queued travelers home without paying.
- A faint or sleep closes the market and reports sales so far.
- Customers walk over water on the surface (spirits), never under it.

## Dependencies

- **Reads**: [Building](building.md) (sellers, ambience), [People, Reputation and Fate](people-and-reputation.md) (Thorngate reputation), [Stats and Daily Actions](stats-and-actions.md) (Charm, job stats), [World and Regions](world-and-regions.md) (material lands).
- **Used by**: [Building](building.md) (costs), [Survival and Diet](survival-and-diet.md) (food prices), [Combat](combat.md) (gold rewards), [Interface and Controls](interface-and-controls.md) (counters, market pill).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Stall / tea house sells | 5 / 8 | 3–12 | Market income |
| Ambience price factor | /300 | /150–/500 | Value of decorating |
| Cap per stall / tea house | 3 / 5 | 2–8 | Travelers per night |
| Travelers per night, max | 24 | 15–40 | Late-game market ceiling |
| Starting materials | 10 wood, 4 stone | 0–20 | First builds |
| Material buy prices | 10 / 12 per 3 | 6–20 | Gather vs buy |

## Acceptance Criteria

1. With the starter plot, opening the market produces exactly 9 sales and then closes itself with a summary.
2. The market cannot be opened outside Thorngate or twice on the same day.
3. Gather wood in Erelian adds 3 wood; buying timber costs 10 gold for 3 wood.
4. Leaving Thorngate during a market closes it and reports sales so far.
