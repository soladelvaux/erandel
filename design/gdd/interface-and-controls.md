# Interface and Controls — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`render`, `renderHud3`, `renderBuildBar`, `renderJournal`, `renderDialog`, `renderThreshold`, `initPointer`, key handlers, joystick, `PREFS`)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented
---

## Overview

A phone-first overlay on the 3D world, styled after cozy night-market builders: compact status card, resource counters and market pill, a music player, side tool icons, JRPG dialog boxes, a full-screen journal, and a build catalog bar. Movement by joystick, tap-to-walk or keys, seen from a close third-person camera; real-time combat buttons, a minimap, a target frame, name plates and multiplayer chat (v0.4.0, see [Action Combat and Movement](action-combat.md) and [Multiplayer](multiplayer.md)).

## Player Fantasy

"It feels like a calm little diorama I can play with one thumb on the bus."

## Detailed Rules

**Screens**:
- **Threshold** (new game): Aelarion art, his speech, name field, kind detail (element, weakness, diet, body notes, paths, legends), 36 kind buttons grouped, Begin and Random.
- **World HUD**: top left: name, kind, tier, title, HP/Fate/Corruption bars, action pips, time and weather, conditions. Top centre: gold/wood/stone counters, the Open/Close night market pill (Thorngate only), day and land. Top right: music player (prev, play/pause, next), Settings, Journal. Left side: Build (hammer), Photo, Sleep (moon). Right, under the icons: minimap of the whole world (you as a white arrow with a view cone, people gold, creatures red, other players cyan). Top centre under the counters: target frame (creature name, element, HP bar). Bottom left: joystick, and above it the online pill and the last chat lines. Bottom right: Talk (only near a person), four round spell buttons with element colours and cooldown sweeps, the Focus bar, and Dodge, Jump and a large Attack button. In the world: name plates over people and players, HP bars over hurt or targeted creatures, floating damage numbers, speech bubbles.
- **Dialogs**: portrait, name, text, ▸ choices. Types: Aelarion (lore, evolution advice, blessing), resident (Help/Trade/Steal with costs), battle result, sleep confirmation.
- **Journal** (book icon, M/J): tabs Act, Self, Magic, World, Chronicle; full-screen and scrollable.
- **Build mode**: overhead camera, grid, green/red tile highlight, ghost preview, catalog cards (name, cost, ambience, sells), tools: Remove, Rotate, Done.
- **Banners**: "Now entering <land>" with tagline for 3.2 s.
- **Photo mode**: hides all UI; tap to return.
- **Settings**: Glow on/off, Tilt-shift on/off, music volume (saved separately from the game).
- **Toasts**: short messages below the top HUD.

**Controls**:

| Input | Phone | Keyboard / mouse |
|---|---|---|
| Move | joystick, or tap the ground to walk there | W A S D / arrows |
| Look around | drag the world | drag with the mouse |
| Jump | Jump button | Space |
| Dodge | Dodge button | Shift |
| Attack | Attack button, or tap a creature | F, or click a creature |
| Spells | four round buttons | 1, 2, 3, 4 |
| Chat | online pill | T to open, Enter to send, Escape to close |
| Talk | Talk button | E, Enter |
| Journal | book icon | M or J |
| Build | hammer icon (Thorngate) | B, R rotates |
| Zoom | pinch | mouse wheel |
| Pan (build) | drag | drag |
| Close | on-screen buttons | Esc |

**Fallback**: without WebGL, the game runs as the journal only, with a Travel menu, and every system except building and the visible market still works.

## Formulas

- Camera distance multiplier `k = clamp(1.3 / aspect, 1, 2.6) × zoom`, zoom 0.5–1.7. Portrait phones (aspect ~0.48) get k ≈ 2.6 so ~22 units are visible across.
- Fog near/far follow camera distance (`d + 12`, `d + 120`; fog weather `d − 8`, `d + 45`).

## Edge Cases

- Keys are ignored while typing in the name or spell-name fields.
- The joystick and Talk button live outside the re-rendered overlay so touches survive re-renders.
- Movement is blocked while a dialog, journal, build mode, photo mode or fade is open.
- On narrow screens the counters move to a second row and the music titles hide.

## Dependencies

- **Reads**: [Action Combat and Movement](action-combat.md), [Multiplayer](multiplayer.md), every other system ([Kinds and Bodies](kinds-and-bodies.md), [Stats and Daily Actions](stats-and-actions.md), [World and Regions](world-and-regions.md), [Elements and Affinity](elements-and-affinity.md), [Evolution](evolution.md), [Survival and Diet](survival-and-diet.md), [People, Reputation and Fate](people-and-reputation.md), [Combat](combat.md), [Magic](magic.md), [Companions](companions.md), [Building](building.md), [Night Market and Economy](night-market-and-economy.md)).
- **Used by**: [Audio and Atmosphere](audio-and-atmosphere.md) (music controls, settings).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Walk speed | 8 u/s | 5–12 | Travel time |
| Zoom range | 0.5–1.7 | 0.4–2 | View control |
| Talk radius | √12 ≈ 3.5 u | 2–5 | Ease of starting dialogs |
| Banner time | 3.2 s | 2–5 s | Interruption |

## Acceptance Criteria

1. At 412 × 860 every HUD element is visible without overlap; the journal scrolls.
2. Tapping the ground walks the player there; pinching zooms.
3. Standing near a person changes the Talk button to "Talk · <name>".
4. Build mode is unavailable outside Thorngate with a message.
5. Photo mode hides all UI and a tap restores it.
