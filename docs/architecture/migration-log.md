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
