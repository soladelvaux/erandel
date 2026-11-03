# GDD Cross-Review — 2026-11-03

**Scope**: all 14 system GDDs in `design/gdd/` (reverse-documented from `src/index.html` v0.3.0)
**Reviewer**: Claude (acting for creative-director and systems-designer)
**Verdict**: CONCERNS (no blockers; three design concerns and two open questions below)

## Phase 1: Structure

`bash .claude/scripts/gdd-structure-check.sh`: all 14 GDDs have all 8 sections (Overview, Player Fantasy, Detailed Rules, Formulas, Edge Cases, Dependencies, Tuning Knobs, Acceptance Criteria). No placeholders.

## Phase 2: Consistency

| Check | Result |
|---|---|
| Dependencies are bidirectional | **Fixed**: 10 one-sided links found and added (Building→People, Companions→Stats, Evolution→Companions, Interface→Elements/People/Survival, Kinds→Magic/People, Market→Survival, Stats→World). Re-check passes |
| Numbers match the code | Every formula and table was taken from the source; the 13 unit tests in `tests/unit/engine/` assert the key ones (stats, action budget, hazards, diets, evolution gates, slots, help limit, rivals, building rules, refunds, market cap) |
| Shared terms | Fate, Corruption, ambience, affinity levels (Spark/Flow/Bond/Avatar) used identically in all docs |
| Land and person names | Match `REG` and `NPCS` and the canon in CLAUDE.md |

## Phase 3: Design theory

1. **CONCERN — Economy dominance.** The night market (~120 gold per action at start, more with a tea house) out-earns work (10–40) and hunting (10–40). Intended as the build payoff and capped once per day, but jobs may feel pointless after day 3. Recommend `/balance-check` and possibly scaling work pay with job rank more steeply.
2. **CONCERN — Early punishment for some kinds.** Sea kinds lose 6 HP per action on land away from rain, and Night kinds lose 4–8 in daytime sun. Every hazard names its fix and Aelarion heals once a day, but a first-time player picking Merfolk may faint on day 1 if they explore. Recommend a one-line tip from Aelarion on spawn tailored to the kind's body notes.
3. **CONCERN — Light vs dark pacing.** Fate rises +4 per help (one person per land per day); Corruption rises +6 per theft, +8 per rite, +10 per burn. Dark legends are reachable faster. Acceptable as a temptation, but worth a playtest.
4. Pillar check: every system feeds "You become what you do" (evolution reads stats, elements, Fate/Corruption); "The world remembers" is served by memory, reputation and the codex; "Every body is different" by survival and diets; "Cozy by lantern light" by building, market and atmosphere; "Plays on a phone" by the interface. No system works against a pillar.

## Open questions for the creator

- Canon: Caelithra's role (moon oracle?), Elash's role (warden of the white boughs?), the mermaid queen's name (Queen Maren?).
- Saves are per browser. Add an export/import code?

## Resolution (v0.3.1, same day)

All three concerns were addressed by the economy balance check (`design/balance/balance-check-economy-2026-11-03.md`): the market now earns 4–7× work instead of 10–24×, ambience rewards variety, decorations cost more per copy, sea kinds dry out for 4 HP, Aelarion gives a kind-specific tip on spawn, and helping gives Fate +5.

## Next

`/create-epics` for 1.0.
