# Three.js migration log (ADR-0002)

One entry per milestone: what changed, the breaking API changes met, the gate results, and the rollback point. Baseline: `production/qa/baseline/BASELINE-v0.4.1.md`.

## C1 — r128 → r147, still one file (ADR-0002 step U1) — 2026-11-05

**Changed**
- `src/index.html`: the 7 script URLs now load `three.js/0.147.0` (cdnjs) and `three@0.147.0/examples/js` (jsDelivr). The same 6 add-on files exist in r147 with the same load order; `Pass` and `FullScreenQuad` live inside `EffectComposer.js` as in r128.
- `src/index.html`: removed `flatShading: true` from 8 `MeshLambertMaterial`s (canopies, cones, rocks and the landmarks spire cap, vent cone, and others).
- `tests/package.json`: `three` 0.147.0 for the browser tests, plus `three-r128` (an npm alias of 0.128.0) so the baseline can still be measured.
- `tests/helpers/serve-three.js` (new): serves whichever Three.js version the page asks for. `browser-smoke`, `p2p-smoke` and `perf-probe` use it.
- `tools/screen-diff.py` (new): screenshot comparison against the baseline.

**Breaking API changes met, and what was done**

| Release | Change | Effect on Erandel | Action |
|---|---|---|---|
| r144 | `MeshLambertMaterial` is lit per pixel and honours `flatShading` | r128 ignored `flatShading` on Lambert and logged "'flatShading' is not a property of this material" 6 times at start. r147 would facet every tree, rock and cone | Removed the flag, so the look stays as it was. Real faceting is a look decision for Phase 2 |
| r144 | Per-pixel Lambert lighting | Slightly smoother light on chibis and props | Accepted after screenshot review (below) |
| r147 | `PointLight` default `decay` = 2 | None: every point light passes `decay` explicitly | — |
| r140 | `fog` moved off the base `Material` | None | — |
| r137 | sRGB decoding removed from GLSL | None while output stays linear (until r152, step U4) | — |
| r136 | `gammaFactor` and `GammaEncoding` removed | Not used | — |
| r145 | `*BufferGeometry` alias names deprecated | Not used | — |
| — | Our `onBeforeCompile` patches (`#include <common>`, `<begin_vertex>`, `<color_fragment>`, `void main() {`) | Still present in the r147 Lambert and Phong shaders | Painted terrain and the camera fade still work (screenshots) |

**Gate**

| Check | Result |
|---|---|
| `npm test` | 65 / 65 pass |
| `npm run test:browser` | PASS |
| `npm run test:p2p` | PASS |
| Console | No warnings (r128 logged 6 `flatShading` warnings) |
| Screenshots against the baseline | 13 of 21 differ by 1.2% of pixels or less, and 3 more by 2–3%. The 5 above 4% were viewed side by side: build mode 8.7% (lantern flicker), phone combat 6.9% (golem pose and chat-bubble timing), two players 16.5% (peer positions), and Erelian at night, 6.0% desktop and 4.1% phone. **Erelian at night shows one real look change:** with per-pixel Lambert lighting (r144), the night lamp's highlight on the character's head is softer and that scene reads slightly darker. r147 offers per-vertex lighting only as an ES module, so it cannot be restored before the split. Recorded for Sola's review; no other material or colour change was seen |
| Draw calls (perf probe) | Unchanged within noise. Desktop Veilmoor at night: 862 → 869 (creatures wander). Phone: 396 → 397 |
| Save from v0.4.1 | `npm run test:save` PASS: a save made in the r128 build (merfolk, after two actions, 321 gold) loads in r147 with identical name, kind, day, gold, actions, buildings and stats, and keeps playing. Added to CI |

**Rollback point:** branch `rollback/milestone-c1`.

**Remaining risk:** the r147 library is 4 KB larger. The JS heap after start-up is 16 MB on desktop against 12 MB before, measured in software rendering; recheck it on a real device.

**Next:** U2, the module split (milestone D). Three.js stays at r147 during the split; r147 → r186.1 (C2: U3–U7) follows the split.

## D — module split (ADR-0002 step U2) — 2026-11-05

**Changed**
- `src/`: the single file was cut at its 43 section comments into module files in the approved folders (`ui/`, `data/`, `core/`, `gameplay/`, `persistence/`, `world/`, `entities/`, `rendering/`, `net/`, `audio/`). No line of code was changed or moved. Module map: `architecture.md` › Layers.
- `src/manifest.json` (new): the join order.
- `tools/build.js`: joins the modules in manifest order; fails if a module file is missing from the manifest or listed twice; writes `src/index.html` (now generated) and `dist/`; `--check` only compares.
- Tests: `helpers/load-game.js`, `browser-smoke`, `p2p-smoke`, `perf-probe` and the new side of `save-compat` now load the game joined from the modules. New guard `tests/unit/build/assembly.test.js` (2 tests; watched failing on a one-line drift first). CI runs `npm run check:build`.

**Breaking API changes:** none. The modules stay classic scripts in one shared scope, so every global (`S`, `ui`, `W3`, `doAction`, …) is exactly where it was. Moving to ES modules with imports and exports comes with C2, because r163+ loads Three.js add-ons only as ES modules.

**Proof that nothing changed:** the joined page is byte-for-byte the C1 file: 400,479 bytes, SHA-256 `26064d201212985d…` for both. So the deployed page is identical, and performance cannot have changed.

**Gate**

| Check | Result |
|---|---|
| `npm test` | 67 / 67 pass (the 65 originals + 2 split guards) |
| `npm run test:browser` | PASS |
| `npm run test:p2p` | PASS |
| `npm run test:save` | PASS (v0.4.1 r128 save loads and plays) |
| `npm run check:build` | PASS |

**Rollback point:** branch `rollback/milestone-d`.

**Remaining risk:** `src/index.html` is now generated but still in git, so someone could edit it by hand; the guard test and CI catch that. The modules depend on load order (shared scope), which the manifest pins; real imports come with C2.

## C2 step U3 — r147 → r151, loaded as ES modules — 2026-11-05

**Changed**
- `src/ui/shell/body.html`: the 7 classic `<script src>` tags are replaced by one import map: `three` → jsDelivr `three@0.151.0/build/three.module.min.js` (minified on the fly by jsDelivr, 161 KB gzip against 153 KB for r147's `three.min.js`; the unminified module is 241 KB), and `three/addons/` → `three@0.151.0/examples/jsm/`.
- `src/core/start.js`: new `loadThree()` imports `three` and the 4 post-processing add-ons with `import()` and joins them into the same `window.THREE` object the game always used (`THREE.EffectComposer`, `THREE.UnrealBloomPass`, …), so no other game code changed. The game starts once that is done (`boot()`). Without WebGL, or if the load fails, it starts at once in the 2D journal mode, as before. The claude.ai hot-reload hooks are unchanged.
- `src/world/world-data.js`: the WebGL check is stored as `CAN3D`; `HAS3D` becomes true when three.js has loaded.
- Tests: `helpers/serve-three.js` serves the module builds with CORS headers, picks the package by version (r128, r147, r151), can delay answers (`THREE_DELAY_MS`) and can serve a real copy of the CDN's minified file (`THREE_MIN_FILE`). New `helpers/wait-start.js`: browser tests wait for the game to start instead of a fixed time. `perf-probe` waits until the camera reaches each scene.

**Breaking API changes met**

| Release | Change | Effect on Erandel | Action |
|---|---|---|---|
| r148 | `examples/js` removed; add-ons only as ES modules in `examples/jsm` | The bloom chain could not load as classic scripts | Import map + `loadThree()` (above) |
| r148 | Higher default segment counts for Circle, Ring, Cylinder, Cone, Torus | None: every call passes its segment counts | — |
| r150 | `ColorManagement.legacyMode`, `physicallyCorrectLights` renamed | Not used | — |
| r151 | `InstancedMesh.frustumCulled` default | None: set to false explicitly | — |
| — | Start-up is now asynchronous (the module load finishes after the page's load event) | Players: none (the old blocking script tags also showed nothing until three.js arrived). Tests: clicked "begin" before it existed on a slow machine; seen failing with `THREE_DELAY_MS=2500`, fixed with `waitForStart` | Fixed in the tests |

**Gate**

| Check | Result |
|---|---|
| `npm test` | 67 / 67 pass |
| `npm run test:browser` | PASS, using the real CDN minified file |
| `npm run test:p2p` | PASS (also with a 2.5 s slow load, and with the real CDN file) |
| `npm run test:save` | PASS: a v0.4.1 r128 save loads and plays in r151 |
| `npm run test:fallback` (new, in CI) | PASS: with the bloom files blocked the 3D world starts without bloom; with three.js blocked the 2D journal starts. My first loader dropped to 2D when only bloom failed, a regression against the old script tags. This test caught it (watched failing) before the fix |
| Console | No three.js warnings |
| Screenshots against r147 | 15 of 21 within 2.6%. The 6 larger ones were viewed side by side: build mode 40.9% (camera at a different point of its glide, because the game now starts slightly later), plot at night 12.9% and the two-player view 9.2% (NPC, creature and peer positions), Erelian at night on phone 13% (character turned the other way), phone build mode 6.7% and phone combat 4.7% (lantern flicker, pose). **No colour, light, bloom or material change seen** |
| Draw calls (perf probe, `perf-r151-u3.json`) | Unchanged within noise. Desktop Veilmoor at night 869 → 854, phone 397 → 407; other scenes within ±10 |
| JS heap after start | Desktop 16 → 13 MB, phone 11 → 12 MB (software rendering) |

**Probe fix found on the way:** the perf probe sometimes measured the previous scene, because it waited a fixed time after a teleport. That happened on r147 too (seen once at the Veilmoor). It now waits until the camera is at the scene, and stops with an error if it isn't. Numbers from earlier runs that look identical for two scenes were affected: in `perf-r147-c1.json` all scenes are distinct, so the C1 comparison stands.

**Rollback point:** branch `rollback/milestone-c2-u3`.

**Remaining risk:** jsDelivr's on-the-fly minified file is generated by jsDelivr, not published by three.js. It was tested here as downloaded. If it ever fails to load, the game starts in 2D mode; switching the import map back to `three.module.js` fixes it.
