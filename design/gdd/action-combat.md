# Action Combat and Movement — Design Document

---
**Status**: Implemented (v0.4.0)
**Source**: `src/index.html` (`ACT`, `mpMax`, `meleeBase`, `compDamage`, `skillSlots`, `skillDamage`, `enemyStats`, `enemyHitDamage`, `killReward`, `playerAttack`, `castSkill`, `playerDodge`, `playerJump`, `updateMonster`, `monsterStrike`, `damagePlayer`, `playerDown`, `camClear`, movement and camera in `loop`)
**Date**: 2026-11-05
**Verified By**: `tests/unit/engine/action-combat.test.js`, `tests/integration/browser-smoke.js`
**Implementation Status**: Fully implemented
---

## Overview

In the 3D world the player is seen from a close third-person camera and fights in real time. They run, jump, dodge, climb steep rock, swing a weapon and cast up to four damage spells from a hotbar that uses a Focus (MP) pool. Creatures wind up visible attacks that can be dodged or jumped. Kills cost no daily action and pay a smaller reward than a Hunt, capped per day. The Hunt action in the journal (see [Combat](combat.md)) stays as the auto-resolved option and the fallback when WebGL is missing.

## Player Fantasy

"I am in the world, not watching it." The camera sits behind my character, I turn it with a drag, I scramble up a crag to see the land, and when a boar charges I read its red warning circle, roll away, and answer with a Frost Lance.

## Detailed Rules

**Camera**: third person, field of view 58°. Drag anywhere on the world (finger or mouse) to orbit: horizontal drag turns (yaw), vertical drag tilts (pitch, clamped 0.12–1.15 rad). Pinch or mouse wheel zooms. The camera never goes below the ground; terrain and large landmarks between camera and player pull it closer (never nearer than 3 units). Trees, rocks and landmarks between the camera and the player dissolve with a dither so they never hide the character. Build mode keeps the overhead camera.

**Movement**: stick or W A S D, relative to where the camera looks. Tap the ground to walk there. Run speed 7. Jump (Space or Jump button) with gravity; 85% steering in the air. Trees, rocks and landmarks are solid.

**Climbing**: when the ground ahead rises steeper than 1.05 (rise over run), the character grips the rock and climbs: vertical speed about 2.6 units per second, climbing pose, arms alternating. Jumping from a climb kicks off the wall. Ten rock crags with flat tops are placed across the lands (`CRAGS`).

**Dodge** (Shift or Dodge button): a quick dash in the input direction (or facing direction) with invulnerability frames. Cooldown 1.2 s.

**Attack** (F, Attack button, or tap a creature): melee swing in a 72° arc in front, range 2.7 (golems +0.7). Faces the current target if one is within 4.2. Cooldown 0.55 s.

**Spells** (1–4 or the four round buttons): the first four damage spells in the spellbook (Bolt, Wave, Summon, Ritual). Passive spells (Ward, Weave, Shape, Enchant) work automatically.

| Form | Focus | Cooldown | Behaviour |
|---|---|---|---|
| Bolt | 10 | 1.2 s | Homing projectile to the target, range 18 |
| Wave | 18 | 4 s | Ring burst around you, radius 4.5 |
| Summon | 25 | 12 s | A spirit orbits you for 8 s and shoots the nearest creature (radius 7) every second for 30% of a hit |
| Ritual | 30 | 8 s | A rune circle on the target; 1.2 s later it explodes, radius 3.5 |

Spell side costs are unchanged: Life source −3 HP per cast, Contract +1 Corruption per cast, Faith silent while Corruption > Fate.

**Focus (MP)** regenerates 4 per second and refills when play starts.

**Creatures**: wander near home; aggro within 9 units or when hit; chase until 24 units from home (or when the player is more than 20 away and they were not hit), then return home and heal. In reach they wind up (0.7 s, golems 0.95 s) with a red circle growing under them, then strike. Wisps keep 7 units away and fire slow projectiles (9 units/s). A strike only lands if the player is in reach, not in dodge frames, and not more than 1.2 above the ground (a jump clears it). Creatures hit by the player are knocked back slightly.

**Defeat**: a creature at 0 HP vanishes and respawns 75 s later at home (all respawn at dawn).

**Player down**: HP 0 triggers the faint rule (carried to Thorngate, −30% gold, dawn) with a "You fell" dialog. Creatures give 5 s of grace after any fall.

**Peace**: creatures ignore the player while a dialog, the journal, build mode, photo mode or chat is open.

## Formulas

| Quantity | Formula | Example |
|---|---|---|
| Focus max | `50 + 2 × Mind` | Mind 7 → 64 |
| Swing damage | `(4 + 0.5 × Str + 0.3 × Agi) × shape(1.3) × enchant(1.2) + companion` then `× rand(0.85, 1.15)` | Str 5, Agi 5 → 8 |
| Companion per swing | `(5 + 3 × tier + 0.05 × bond) × elemMult(companion home, creature) × 0.5` | Tier 1, bond 40 → 5 |
| Spell hit | `spellPower × spellMult(spell, creature element) × formMult × rand(0.9, 1.1)` | power 10, Fire on Nature (×1.5), Bolt ×1.1 → 16.5 |
| Creature HP / attack | `base × (1 + 0.5 × (tier − 1))` | Rat King tier 3 → 60 HP, 10 attack |
| Strike damage | `max(1, round(atk × scale × elemMult(creature, player home) × ward(0.6) × summon(0.85) − 0.2 × End))` | Rat King, End 0 → 5; with Ward → 3 |
| Kill gold | `max(1, round(base gold × scale × 0.4))` for the first 8 kills each day; 0 after | Rat King → 3 |
| Kill gains | Strength +0.3, Agility +0.3 (× gain multiplier), +1 affinity per spell element used on it, Weave heals 4, companion bond +1 | — |

Rationale for the kill reward: a Hunt (1 action, about 15–28 gold at tier 1) must stay worth an action. Eight capped kills pay at most about 60 gold a day at tier 1, about one day's Work, so the [Night Market](night-market-and-economy.md) balance targets (market 2–5× work at the start) still hold.

## Edge Cases

- Casting with an empty slot shows how to forge spells; with too little Focus shows "Not enough focus" over the character.
- A Life spell that drops HP to 0 triggers the fall before the spell fires.
- Kills after the daily cap still remove the creature but pay nothing and say so.
- A Bolt with no target flies straight ahead and expires at range 18.
- Creatures cannot be fought in the 2D journal-only mode; the Hunt action is used there.
- Tapping a creature too far away walks to it instead of swinging.
- Fall damage does not exist; jumping off a crag is safe.

## Dependencies

- **Reads**: [Stats and Daily Actions](stats-and-actions.md) (Str, Agi, Mind, End), [Magic](magic.md) (spell power, forms, sources), [Elements and Affinity](elements-and-affinity.md) (multipliers, affinity gains), [Companions](companions.md), [Evolution](evolution.md) (tier scaling), [World and Regions](world-and-regions.md) (terrain, crags, creatures per land), [Combat](combat.md) (shared formulas).
- **Used by**: [Survival and Diet](survival-and-diet.md) (a kill makes blood available), [Night Market and Economy](night-market-and-economy.md) (capped gold source), [Interface and Controls](interface-and-controls.md) (action buttons, target frame, damage numbers), [Multiplayer](multiplayer.md) (shared effects).

## Tuning Knobs

All in `ACT` in `src/index.html`.

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| `runSpeed` | 7 | 5–10 | Travel time |
| `jumpV` / `gravity` | 9 / 25 | 7–12 / 18–35 | Jump height (1.6) and feel |
| `atkCd` | 0.55 s | 0.35–0.9 | Melee pace |
| `dodgeCd` / `iframes` | 1.2 s / 0.4 s | 0.8–2 / 0.2–0.6 | Defensive skill ceiling |
| `windup` | 0.7 s | 0.4–1.2 | How readable enemy attacks are |
| `aggro` / `leash` | 9 / 24 | 6–14 / 16–40 | Encounter pressure |
| `killCap` / `killGold` | 8 / 0.4 | 4–15 / 0.2–0.6 | Economy impact of fighting |
| `respawn` | 75 s | 30–300 | Creature density |
| `skill.*.mp` / `cd` | see table | ±50% | Spell rhythm |

## Acceptance Criteria

1. A new character's Focus is 50 + 2 × Mind and refills when play begins (unit + browser test).
2. A swing on a creature in front within 2.7 units removes HP equal to the swing formula (browser test).
3. Casting a Bolt spends 10 Focus and damages the target; the hotbar shows the first four damage spells only (unit + browser test).
4. A creature in reach winds up with a red circle, then deals the strike formula; during dodge frames the strike deals 0 (browser test).
5. A kill pays 40% of hunt gold, costs no action, and the 9th kill of a day pays nothing (unit test).
6. Walking into a crag switches to the climbing pose and the character rises (browser test).
7. A tree between the camera and the character dissolves instead of hiding them (screenshot `production/qa/evidence/*-05-climbing.png`).
