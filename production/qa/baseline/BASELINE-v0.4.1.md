# Baseline before the Phase 1 migration — v0.4.1

**Date**: 2026-11-05 · **Code**: commit `d7c4681` (game) on `main`; rollback branches `rollback/v0.4.1` (`d7c4681`) and `rollback/phase1-start` (`bc7e501`, same game plus the Phase 0 docs)

Every migration milestone is compared against this file (ADR-0002).

## 1. Tests

| Suite | Command (in `tests/`) | Result |
|---|---|---|
| Rule + playthrough | `npm test` | **65 / 65 pass**, 0 fail, 158 s (`unit-tap-v0.4.1.txt` lists every test by name) |
| Real-browser smoke | `npm run test:browser` | PASS (CI run 41978075882) |
| Peer-to-peer | `npm run test:p2p` | PASS (CI run 41978075882) |

The 65 tests are: 36 kinds × 25-day playthroughs, 15 engine-rule tests, 5 economy-balance tests, 9 action-combat and multiplayer-data tests.

## 2. Versions

| Item | Value |
|---|---|
| Three.js | **r128** (`THREE.REVISION` = "128"), loaded from cdnjs as `three.min.js` |
| Add-ons | `examples/js` from jsDelivr `three@0.128.0`: CopyShader, LuminosityHighPassShader, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass |
| Peer-to-peer | Trystero 0.26.0 (jsDelivr ESM, loaded only outside claude.ai) |
| Test tooling | node 22, jsdom 24.1.3, puppeteer-core 22.15.0, three 0.128.0 (npm, served to the browser tests) |

## 3. Build and download

There is no build step: `src/index.html` is the game.

| Asset | Size | Gzipped |
|---|---|---|
| `src/index.html` | 398,014 bytes, 2,613 lines | 202,269 bytes |
| of which the Aelarion portrait (base64 JPEG) | about 150 KB | |
| `three.min.js` r128 | 603,445 bytes | 149,206 bytes |
| Bloom add-ons (6 files) | about 25 KB | |
| Google Fonts | 2 families | |

World start-up in headless Chrome with software rendering: about 3.2 s on phone size and 3.5 s on desktop. This is not a real-device number. JS heap after start-up: 11–12 MB.

## 4. Rendering cost by scene

Measured with `node integration/perf-probe.js v0.4.1`; the raw data is in `perf-v0.4.1.json`. The camera sits behind the player at the default angle, facing north (yaw 0). "With bloom" adds the 14 full-screen bloom passes.

| Scene | Phone calls | Phone calls with bloom | Phone triangles | Desktop calls | Desktop calls with bloom | Desktop triangles |
|---|---|---|---|---|---|---|
| **The Veilmoor (night)**, worst | 396 | 410 | 170k | **862** | 876 | 224k |
| Thorngate spawn (day) | 341 | 355 | 169k | 737 | 751 | 215k |
| Your plot (night, market open) | 249 | 263 | 163k | 593 | 607 | 209k |
| Thorngate gate road (night) | 257 | 271 | 165k | 520 | 534 | 204k |
| Erelian (day) | 78 | 92 | 155k | 150 | 164 | 187k |
| Cindral Wastes (day) | 58 | 72 | 154k | 76 | 90 | 182k |
| Runekar's Deep | 54 | 68 | 154k | 54 | 68 | 181k |

Scene totals: 798 separate meshes, 170 sprites, 10 instanced meshes (4,900 instances), 22 shader programs, 93–104 geometries, 15–16 textures. There are 4 point lights on phones and 8 on desktop, pixel ratio 1–1.5, and no shadows.

## 5. Investigation: the 686 / 862 draw-call peak

**The peak is not one heavy asset. It is hundreds of small separate objects, mostly far away.** From the Veilmoor the camera looks north across all of Thorngate and the plot, and fog only hides objects beyond about 130 units.

Draw calls in the worst scene (Veilmoor at night, desktop, 862):

| Cause | Calls | Triangles | Why so many |
|---|---|---|---|
| Creatures (30, 3 per land) | 220 | 19.8k | Humanoid creatures are chibis of about 18 meshes each; beasts and golems are 6–9 meshes each |
| Plot build items | 209 | 6.2k | Each lantern, stall, torii or tea house is 3–15 meshes |
| People (11 NPC chibis) | 166 | 16.0k | About 18 meshes each, more with staff, hat or crown |
| Glow sprites | 136 | 0.3k | One sprite per lantern glow, string-light glow and spirit |
| Landmarks and other meshes | 61 | 2.2k | Houses, gate, spires, vents and domes, one mesh per part |
| Butterflies | 32 | 0.1k | 2 wing meshes each |
| Player chibi | 18 | 1.7k | |
| Instanced props (trees, rocks, grass, flowers) | 10 | 112k | Already efficient: 4,900 instances in 10 calls |
| Terrain + water | 2 | 65k | One heightfield, 170 × 192 |

**The worst scenes and assets**
1. The Veilmoor and Thorngate views at night, because they see the whole plot and the town.
2. The worst asset types are chibi characters, multi-part build items and glow sprites. They cost little in triangles but a lot in draw calls.
3. The largest triangle cost is the instanced props (112k). They are drawn in full even off screen, because frustum culling is disabled for the instanced meshes, and that is cheap in draw calls but not in vertex work.
4. The terrain is 65k triangles on desktop.

## 6. Optimisation leads (to investigate in milestone G; none applied yet)

| Lead | Expected effect | Visual risk |
|---|---|---|
| Distance culling or LOD for chibis, creatures and build items beyond fog distance | Large: most of the 600+ calls are far objects | Low if the cut-off stays inside the fog |
| Merge each static build item and landmark into one mesh per material | 200+ calls become tens | None (same geometry) |
| One instanced or point mesh for all glow sprites | 136 calls become 1–2 | Low; needs the same additive look |
| Merge the static parts of a chibi (head, body, cap and others on one pivot) | About 18 calls become about 6 per character | None; limbs stay separate |
| Material reuse: cache `mat(colour)` already exists; extend to build items | Fewer program switches | None |
| Re-enable frustum culling on instanced props with chunked instances | Less vertex work | None |
| Texture compression | Small today (only canvas textures); matters in Phase 2 with real art | n/a now |
| Shadows | None exist; no cost today. Adding them in Phase 2 needs a budget | n/a now |

Rule from Sola: do not sacrifice visual quality just to reduce draw calls. Every change above must pass the screenshot comparison.
