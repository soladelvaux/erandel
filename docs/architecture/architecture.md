# Erandel Architecture

---
**Status**: Reverse-Documented from `src/index.html` (v0.3.0) · **Date**: 2026-11-03
---

## Overview

Erandel is one self-contained HTML file. A plain-JavaScript game engine (state, rules, actions) sits underneath a three.js world layer and an HTML overlay UI. There is no build step and no server. See [ADR-0001](adr-0001-single-file-web.md).

## Layers

```
src/index.html
├── <style>          UI theme, HUD, dialogs, journal, build bar, tilt-shift, vignette
├── shell            <canvas id=world>, #app overlay, #controls (joystick, Talk)
├── <script> libs    three.js r128 (cdnjs) + bloom (jsDelivr examples/js)
└── <script> game
    ├── DATA         elements, weather, 36 kinds, regions, people, jobs, magic sources, forms,
    │                diets, conditions, foods, rivals
    ├── ENGINE       state S, helpers, evolution, luck, magic, combat, actions, doAction,
    │                hazards, dawn, sleep, faint, save/load, newChar
    ├── RENDER (2D)  journal pages: Act, Self, Magic, World, Chronicle (also the no-WebGL fallback)
    └── WORLD (3D)   terrain, instanced props, landmarks, chibi characters, monsters, building
                     meshes, customers, lights, bloom, camera, pointer/keyboard input, music,
                     HUD, dialogs, build bar, events, start()
```

## State

- One object `S` holds the whole save (kind, tier, path, stats, HP, day, actions used, weather, region, position, Fate, Corruption, gold, materials, affinities, traits, job, spells, sources, people, region reputation, log, chronicle, pet, bloodline, conditions, companion, build items, market fields, flags).
- Saved to `localStorage['erandel-save-v1']` after every action and every 1.5 s of walking. The spell codex is shared in `erandel-codex-v1`. Settings in `erandel-prefs-v1`.
- `valid()` migrates older saves by filling missing fields.
- UI-only state lives in `ui` (current tab, dialog, build tool, market session, banners, toasts).

## Flow of an action

`click → doAction(kind, arg)` → check cost, energy, rule check, gold → run the action (pushes log lines) → hazards and conditions → new magic sources → faint check → `save()` → `render()`.

Dawn: `sleep() → dawn()` → weather, heal, conditions, hunger, companion bond, conversion, evolution, luck, sources, `dawnHook()` (market close, ambience bonus).

## World layer

- `initWorld()` builds everything once: terrain grid (110 × 124, Phong flat-shaded, vertex colours), water plane, ~10 instanced meshes for props, landmarks, NPC chibis, monsters, particles, build grid, and the bloom composer.
- `loop()` each frame: lighting lerp, glows, wisps, butterflies, NPCs, player movement and region detection, companion follow, monsters and encounters, customers, talk target, weather particles, camera, build highlight, periodic save, render.
- Build items are separate groups keyed by item id; their lights join the light list the point-light pool draws from.

## External dependencies

| Dependency | Source | Fallback |
|---|---|---|
| three.js r128 | cdnjs | 2D journal-only mode |
| EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, CopyShader, LuminosityHighPassShader | jsDelivr `three@0.128.0/examples/js` | render without bloom |
| Google Fonts | fonts.googleapis.com | system serif/sans/mono |

## Testing

See `tests/README.md`. The engine is tested headless in jsdom (fallback mode). The 3D layer is tested in headless Chrome with software WebGL; time-based systems are tested by calling their update functions directly.
