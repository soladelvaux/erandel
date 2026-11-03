# Elements and Affinity — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`ELEM`, `elemMult`, `addAff`, `affLevel`, `practicable`, `timeMult`, `WEATHER`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

Thirteen elements in three layers. Each character can bond with at most three (four with an awakened bloodline). Affinity grows by living among an element: practising it, working with it, and acting in matching places, weather and times. Affinity unlocks spells, protects the body, reshapes it, and gates evolution.

## Player Fantasy

"Months by the sea gave me gills." Elements are a relationship with the world, not a menu pick.

## Detailed Rules

**Elements**: Primal Fire, Water, Earth, Air; Fused Ice, Lightning, Nature, Magma; Soul Light, Shadow, Spirit, Moon, Death.

**Wheel** (strong against / weak against):

| Element | Strong vs | Weak vs |
|---|---|---|
| Fire | Ice, Nature | Water |
| Water | Fire, Magma | Lightning, Nature |
| Earth | Lightning | Air, Nature |
| Air | Earth | Ice |
| Ice | Air, Nature | Fire, Magma |
| Lightning | Water, Air | Earth |
| Nature | Water, Earth | Fire, Ice |
| Magma | Ice, Earth | Water |
| Light | Shadow, Death | Moon |
| Shadow | Light, Spirit | Light |
| Spirit | Death | Shadow |
| Moon | Light, Shadow | Spirit |
| Death | Light, Nature | Spirit, Light |

**Slots**: an element with affinity > 0 uses a slot. With all slots used, new elements cannot grow ("Your soul has no room"). Bloodline Humans get a 4th slot.

**Practice** is allowed for elements you already hold, or that the current land or weather offers.

**Levels**: Faint (>0), Spark 10, Flow 30, Bond 60, Avatar 100 (cap).

**Body traits**: reaching Bond (Humans: Flow) adds the element's trait, for example Water "gill slits along the neck", Fire "ember eyes", Moon "silver irises".

**Protection**: Water 30 breathes underwater; Fire or Magma 30 walks on lava; Ice 30 resists cold; Air 30 handles thin air; Death or Spirit 10 resists miasma.

## Formulas

`gain = n × H × R × W × T`

| Variable | Meaning | Values |
|---|---|---|
| n | base amount | practice 4, special actions 2–5, job 1, hunt win 2 |
| H | Human adaptation | 1.5 for Humans, else 1 |
| R | land offers the element | 1.5 or 1 |
| W | weather | 1.5 if boosted, 0.5 if weakened, else 1 |
| T | time | Night: Moon 1.5, Shadow 1.3, Light 0.7; day: Light 1.2, Moon 0.6 |

Example: a Human practising Water in Aethwyn Mere during rain: 4 × 1.5 × 1.5 × 1.5 = 13.5.

Elemental damage multiplier `elemMult(a, d)`: 1.5 if `a` is strong against `d`; 0.67 if weak; 1.2 if both (mutual clash, for example Shadow vs Light); else 1.

## Edge Cases

- Gains above 100 are capped at 100.
- Bloodline awakening and Seraph/Fallen conversion may add an element even when slots are full (forced).
- Jobs add affinity quietly and skip the "no room" message.
- Fusion spells use the better of their two elements against the target.

## Dependencies

- **Reads**: [World and Regions](world-and-regions.md) (land elements, weather), [Kinds and Bodies](kinds-and-bodies.md) (home element, Humans).
- **Used by**: [Evolution](evolution.md) (Flow and Bond requirements), [Magic](magic.md) (spells), [Survival and Diet](survival-and-diet.md) (protection), [Combat](combat.md) (multipliers), [Companions](companions.md) (element harmony).
- **Also connected**: [Interface and Controls](interface-and-controls.md) (Self page, practice menu).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Slots | 3 (+1 bloodline) | 2–5 | Specialisation pressure |
| Practice base | 4 | 2–8 | Speed to Flow/Bond |
| Level thresholds | 10/30/60/100 | keep ratios | Spell and evolution pacing |
| Strong / weak multipliers | 1.5 / 0.67 | 1.25–2 / 0.5–0.8 | Importance of elements in fights |

## Acceptance Criteria

1. With three elements held, practising a fourth is refused with the "no room" message.
2. A Human reaching Water 30 gains the gill trait and stops losing HP underwater.
3. Moon practice at Night gains 1.5× the daytime-neutral amount.
4. Fire spells deal 1.5× damage to Nature creatures and 0.67× to Water creatures.
