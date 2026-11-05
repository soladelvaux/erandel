# Erandel Architecture

---
**Status**: Reverse-Documented from `src/index.html`, updated for v0.4.1 · **Date**: 2026-11-05
---

## Overview

Erandel is one self-contained HTML file. A plain-JavaScript game engine (state, rules, actions) sits underneath a three.js world layer and an HTML overlay UI. There is no server. See [ADR-0001](adr-0001-single-file-web.md).

**Current state (v0.4.1, the Phase 1 baseline):**
- Three.js r128, loaded from CDNs.
- One 398 KB file, 2,613 lines, mapped section by section in the Phase 1 audit (the claude.ai doc "Erandel — Phase 1 Technical Audit").
- Measured numbers are in `production/qa/baseline/BASELINE-v0.4.1.md`.
- Built by `tools/build.js` into the production page and the preview page ([deployment.md](deployment.md)).
- The planned move to modern Three.js and modules is [ADR-0002](adr-0002-modernise-threejs.md); networking goes behind [ADR-0003](adr-0003-net-folder.md).

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

- `initWorld()` builds everything once: terrain grid (170 × 192 on desktop, 130 × 146 on phones; Phong with vertex colours plus a painted grass/rock shader chosen by slope, `paintTerrain`), climbable crags (`CRAGS` in `heightAt`), a collider grid for trees, rocks and landmarks (`COL`), sky (stars, sun or moon), water plane, ~10 instanced meshes for props, landmarks, NPC chibis, monsters, particles, build grid, and the bloom composer.
- `loop()` each frame: lighting lerp, glows, wisps, butterflies, NPCs, third-person movement (camera-relative input, jump, dodge, climb, collisions), region detection, companion follow, creature AI, projectiles, summons, rituals, effects, other players, customers, talk target, weather particles, camera (third-person with terrain and landmark clearance; overhead in build mode), build highlight, screen tags (name plates, HP bars), action HUD and minimap at 10 Hz, presence send, periodic save, render.
- Props and landmarks use `nearFade`: a dithered discard for fragments near the camera or between the camera and the player. three.js r128 does not upload `cameraPosition` to Lambert or Basic materials, so the camera position is passed as its own uniform (`FADE_CAM`).
- Multiplayer (`NET`) uses the artifact `room` capability when present: presence carries position and look, the `fx` and `chat` topics carry cosmetic effects and chat. All incoming data passes `sanitizePeer`, `sanitizeFx` or `cleanText`. See `design/gdd/multiplayer.md`.
- Build items are separate groups keyed by item id; their lights join the light list the point-light pool draws from.

## External dependencies

| Dependency | Source | Fallback |
|---|---|---|
| three.js r128 | cdnjs | 2D journal-only mode |
| EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, CopyShader, LuminosityHighPassShader | jsDelivr `three@0.128.0/examples/js` | render without bloom |
| Google Fonts | fonts.googleapis.com | system serif/sans/mono |
| Artifact `room` capability | `claude.use("room")` on claude.ai | peer-to-peer world |
| Trystero 0.26.0 (WebRTC over public Nostr relays) | jsDelivr `trystero@0.26.0/+esm`, loaded only when there is no claude.ai room | single-player |

## Testing

See `tests/README.md`. The engine is tested headless in jsdom (fallback mode). The 3D layer is tested in headless Chrome with software WebGL; time-based systems are tested by calling their update functions directly.
