# Evolution — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`evoReqs`, `tryEvolve`, `bestPath`, `title`, `conversions`, `BLOOD`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

Characters evolve through four tiers at dawn. Tier 2 fixes a path based on the stat the player raised most; Tier 3 specialises that path; Tier 4 becomes a light or dark legend depending on whether Fate or Corruption is higher. Humans can awaken a hidden bloodline.

## Player Fantasy

"I woke up changed." The player never picks a class. They live, and the dawn tells them what they became.

## Detailed Rules

| Tier | Name | Requirements (all, checked at dawn) |
|---|---|---|
| 1 | Newly Born | start |
| 2 | Path (for example Shore Walker) | day ≥ 4, total stats ≥ 50 |
| 3 | Specialist (for example Tidewalker) | day ≥ 11, total stats ≥ 110, one element ≥ 30 |
| 4 | Legend or Dark Legend | day ≥ 21, total stats ≥ 180, one element ≥ 60, Fate or Corruption ≥ 50 |

- **Path choice at Tier 2**: the kind's path whose stat is highest (first in list on ties). Before Tier 2 the Self page shows the path the player is "leaning toward".
- **Each evolution**: path stat +3, every stat +1, HP fully restored, chronicle entry.
- **Tier 4**: Fate ≥ Corruption → kind's legend (Humans with a bloodline: the bloodline legend); otherwise the dark legend. The name is fixed once reached.
- **Humans** set their home element to their strongest affinity at Tier 2.
- **Bloodline** (luck event, Humans, Tier ≥ 2, Fate ≥ 25): Fae (Nature), Dragon (Fire), Angel (Light), or Demon (Shadow, when Corruption > Fate). +3 to two stats, +15 to the element, a 4th element slot.
- **Conversion**: Seraph → Fallen at Corruption ≥ 25; Fallen → Seraph at Fate ≥ 70 and Corruption ≤ 10. Runs before the evolution check.

## Formulas

- `total = Σ six stats`. Starting total 34 (36 for Humans).
- With about 3 actions/day at ~3 stat points each, totals reach ~60 by day 4, ~130 by day 11, ~220 by day 21, so day gates are usually the limit and element and Fate/Corruption gates decide Tier 3 and 4.
- Path: `path = argmax over kind paths of stat[path.stat]`.

## Edge Cases

- Only one tier can be gained per dawn.
- A faint triggers a dawn, so a faint can still evolve the player.
- Converting kind at Tier 2 or 3 re-picks the path from the new kind; Tier 4 keeps its legend name.
- Requirements met late in a day only apply at the next dawn.

## Dependencies

- **Reads**: [Stats and Daily Actions](stats-and-actions.md), [Elements and Affinity](elements-and-affinity.md), [Kinds and Bodies](kinds-and-bodies.md) (paths, legends), [People, Reputation and Fate](people-and-reputation.md) (Fate and Corruption).
- **Used by**: [Combat](combat.md) (tier scales creatures), [Companions](companions.md) (companion damage), [Interface and Controls](interface-and-controls.md) (title, Self page tree, Aelarion's advice).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Tier day gates | 4 / 11 / 21 | ±50% | Overall pacing |
| Stat totals | 50 / 110 / 180 | ±30% | Effort per tier |
| Element gates | — / 30 / 60 | 20–80 | Element investment |
| Fate/Corruption gate | 50 | 30–80 | Moral commitment for legends |
| Evolution bonus | +3 path, +1 all | 0–5 | Power spike per tier |

## Acceptance Criteria

1. On day 4 with total stats ≥ 50, the next dawn evolves to Tier 2 and names the highest-stat path.
2. Tier 3 is refused until an element reaches 30, even after day 11.
3. At Tier 4 with Corruption > Fate the dark legend is shown and recorded.
4. Asking Aelarion "How will I change?" lists exactly the unmet requirements.
