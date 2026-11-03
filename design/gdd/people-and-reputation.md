# People, Reputation and Fate — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`NPCS`, `actionDef` help/trade/steal, `attitude`, `addRep`, `addReg`, `npcMem`, `GOOD_EVENTS`, `DARK_EVENTS`, `luckRoll`, Aelarion dialog)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

Ten residents (one per land) plus Aelarion at the gate. Each resident has a reputation score and remembers the player's last deeds. Each land has its own reputation. Two hidden-in-spirit meters, Fate and Corruption, record the moral shape of the player's deeds and drive luck, magic sources and legendary forms.

## Player Fantasy

"The world remembers me." Helping Elash every morning makes her light up; getting caught stealing from Kesh changes how Cindral treats me.

## Detailed Rules

**Residents**: Ysolde (innkeeper, Thorngate), Queen Maren (mermaid queen, Mere), Elash (warden of the white boughs, Erelian), Kesh (vent smith, Cindral), Tovin (mountain guide, Pass), Hilde (ice harvester, Hrimwold), Runekar (rune-smith, Deep), Nyx (keeper of lingering souls, Veilmoor), Brother Aldric (priest, Dawnspire), Caelithra (moon oracle, Moonwell). Each has three daily needs that rotate by day.

**Attitude** from reputation (−100 to 100): Hostile ≤ −40, Wary ≤ −10, Neutral < 10, Friendly < 40, Devoted ≥ 40.

**Deeds** (talk to a resident in their land; each costs 1 action):

| Deed | Effect |
|---|---|
| Help (once per resident per day) | Fate +5, Corruption −1, resident +10, land +5, Charm +1, resident's stat +1, remembered |
| Trade (refused if resident < −20 or land ≤ −40) | Gold, resident +2, Charm +1 |
| Steal | Corruption +6, Fate −3; unseen: 15–35 gold; caught: resident −30, land −15, −5 HP, remembered |

**Ally**: the first time a resident reaches 60, they teach a secret: their stat +4 and their land's element +6.

**Land reputation** also changes from socialising (+2), helping (+5), selling at the market (+0.3 per sale), planting (+3), burning Erelian (−20). Land ≤ −40: work pays half, residents refuse trade.

**Fate and Corruption** (0–100): raised and lowered by deeds listed across systems (helping, praying, honouring the dead, planting raise Fate; stealing, dark rites, burning, contract magic raise Corruption).

**Luck at dawn**: good event chance and dark event chance (below). Good events: singing shell (Charm +3), a pet companion (+10% gains, once), Human bloodline awakening, divine relic (once), purse (+40 gold), lore dream (Mind +3), full heal. Dark events: whispers (Shadow +5, Corruption +3), cursed coin (+40 gold, Fate −5), nightmares (−15 HP).

**Aelarion**: tells lore (7 lines), explains unmet evolution requirements, and gives a blessing once per day (full HP, cures Sick/Burned/Chilled, Fate +1).

## Formulas

| Formula | Range / example |
|---|---|
| Trade gold = round(8 + 0.4 × Charm + 0.1 × max(0, rep)) | Charm 10, rep 30 → 15 |
| Steal success = min(0.9, 0.35 + 0.012 × Agility) | Agility 10 → 47% |
| Good luck chance = 8 + 0.3 × Fate (%) | 8–38% |
| Dark luck chance = 0.25 × Corruption (%) | 0–25% |

## Edge Cases

- A resident outside their land cannot be helped ("They are not here").
- Stealing always adds Corruption, even when unseen; only being caught is remembered.
- Memory keeps the last 6 deeds; the dialog shows the last 2, the World page the last 3.
- Distrusted kinds start at Thorngate −15 and Ysolde −10 (see [Kinds and Bodies](kinds-and-bodies.md)).

## Dependencies

- **Reads**: [Stats and Daily Actions](stats-and-actions.md) (Charm, Agility), [World and Regions](world-and-regions.md) (residents' lands).
- **Used by**: [Evolution](evolution.md) (Fate/Corruption for legends and conversion), [Magic](magic.md) (Faith, Life, Contract sources), [Night Market and Economy](night-market-and-economy.md) (Thorngate reputation raises prices; work pay), [Companions](companions.md) (Fate and Corruption affect some kinds' compatibility), [Survival and Diet](survival-and-diet.md) (blessing cures).
- **Also connected**: [Building](building.md) (ambience 100 gives Fate +1 at dawn), [Interface and Controls](interface-and-controls.md) (dialogs, World page), [Kinds and Bodies](kinds-and-bodies.md) (distrusted kinds start with lower reputation).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Help Fate gain | +5 | 2–6 | Speed of light legends |
| Steal Corruption | +6 | 3–10 | Speed of dark legends |
| Ally threshold | 60 | 40–80 | Bond depth |
| Luck base | 8% + 0.3×Fate | 5–15% base | Frequency of surprises |

## Acceptance Criteria

1. Helping a resident twice in one day is refused the second time.
2. Reaching reputation 60 with Elash grants Spirit +4 and Nature +6 once, with a chronicle entry.
3. A caught theft drops the resident by 30 and adds a memory line.
4. Aelarion's blessing works once per day and fully heals.
