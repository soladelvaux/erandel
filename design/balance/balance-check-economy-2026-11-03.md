## Balance Check: Economy (night market, work, hunting, building)

**Date**: 2026-11-03 · **Build**: `src/index.html` v0.3.0 → v0.3.1 · **Reviewer**: Claude (acting for economy-designer)

### Data Sources Analyzed
- `src/index.html` data and formulas: `CATALOG`, `salesCap`, `salePrice`, `ambience`, `JOBS`/work pay, `REG` beast gold, trade formula, `hazards`, help action
- `design/gdd/night-market-and-economy.md`, `design/gdd/building.md`, `design/gdd/survival-and-diet.md`, `design/gdd/people-and-reputation.md` (targets)
- `design/gdd/gdd-cross-review-2026-11-03.md` (concerns 1–3)
- `design/registry/entities.yaml`: ABSENT entries (empty stub) — GDDs used as the only target source
- Measured by running the engine headless (Humans, Charm 7, Thorngate reputation 0 unless stated)

### Health Summary (before fixes): CRITICAL ISSUES
### Health Summary (after fixes, v0.3.1): HEALTHY against the targets below

### Targets used
- Night market is the best gold action but needs investment: **2–5× an apprentice work shift at the start, ≤ 8× a master shift late** (set in this review; recorded in `night-market-and-economy.md`)
- Decorating should reward variety: **one decoration repeated adds at most 5× its single ambience**
- Late gold must have somewhere to go

### Outliers Detected (before)

| Item/Value | Expected Range | Actual | Issue |
|---|---|---|---|
| Market income, starter plot | 24–60 (2–5× work 12) | 126 | 10× work |
| Market income, late rich plot | ≤ 352 (8× master work 44) | 1,064 | 24× work |
| 40 floating lanterns, ambience | ≤ 20 | 160 | Cheapest ambience spam |
| Master vs apprentice work | ≥ 3.5× | 3.2× | Jobs flatten out |

### Degenerate Strategies Found (before)
1. **Market-only gold.** Once a stall exists, one action a day out-earns every other gold source by 10–25×; nothing else is worth doing for money. (CRITICAL: one choice dominates.)
2. **Lantern spam.** One stall + 40 floating lanterns (240 gold) gave ambience 166 and a 264-gold night. Variety never paid off.
3. **No late sink.** Building costs were flat, so late gold piled up with nothing to buy. (CRITICAL: economy loop without a sink.)

### Progression Analysis

| Gold per action | Start | Mid | Late |
|---|---|---|---|
| Work (stat 10 → 20 → 30) | 12 | 24 | 44 |
| Hunting (tier 1 → 4) | 17 | 26–34 | 43 |
| Trade | 10 | 14 | 20 |
| Night market, before | 126 | 275 | 1,064 |
| **Night market, after** | **54** | **118** | **327** |

### Recommendations (all applied in v0.3.1)

| Priority | Issue | Fix applied | Impact |
|---|---|---|---|
| 1 | Market dominance | Stall sells 5 (was 6), tea house 8 (was 10); ambience price factor /300 (was /200); travelers per night `min(24, 3×stalls + 5×tea houses + ambience/10)` (was `min(40, 4× + 6× + /8)`) | Market 4–7× work instead of 10–24× |
| 2 | Lantern spam | Each extra copy of the same item counts 0.8× the previous (`AMB_DECAY`) | 40 floating lanterns: 26 ambience instead of 160 |
| 3 | No late sink | Each extra copy of a decoration costs 1.1× more (`COST_GROWTH`); floors stay flat | Late gold goes into building |
| 4 | Flat jobs | Work pay `8 + 8×rank + 0.4×stat` (was `8 + 6×rank + 0.3×stat`) | Master 3.7× apprentice |
| 5 | Early punishment (cross-review concern 2) | Drying out 4 HP (was 6); Aelarion's welcome adds a body/diet tip for the chosen kind | New sea/night players survive day 1 |
| 6 | Light vs dark pacing (concern 3) | Helping gives Fate +5 (was +4) | Closer to theft's +6 Corruption |

### Values That Need Attention
- Ambience dawn bonuses (100 Fate, 150 reputation) now need a varied plot (starter 69). Keep; revisit after playtests.
- Fortune charm (40 gold → Fate +3, once a day) is now the main gold-to-Fate converter; watch it with richer players.

### Verification
- New regression tests `tests/unit/engine/economy-balance.test.js` (5 tests) were run against v0.3.0 first: 4 failed as expected (market 126 vs 12; 1,064 vs 44; spam 160; flat cost 8), the job test was tightened to 3.5× so it failed too. All pass on v0.3.1.
- Full suite: 56 tests pass (20 unit, 36 seeded playthroughs); browser smoke test passes; screenshots refreshed in `production/qa/evidence/`.
