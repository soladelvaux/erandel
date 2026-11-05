# Erelian: the first benchmark region (Phase 3)

**Status**: v1 built and tested, 2026-11-05 · **Owner**: Sola · **Art direction**: `ERANDEL_ART_BIBLE.md` · **Code**: `src/world/erelian-layout.js`, `src/world/region-erelian.js`, `src/rendering/painted-materials.js`, `src/core/gfx.js` · **Assets**: `tools/assets/author-erelian.mjs` → `assets/game/`

## Lore status

| What | Category | Source |
|---|---|---|
| The name Erelian | **CANON** (L3) | Sola |
| The Aethwyn river runs through it | **CANON** river (L0); its course in the game is PROVISIONAL | Sola / game |
| Elash keeps its groves | **CANON** name (C5); the role is PROVISIONAL | Sola / game |
| "City of the White Boughs" | PROVISIONAL (L3 note) | game |
| The look: pale spires, bridges, waterfalls, white butterflies, green rune magic | Art direction from Sola's Aelarion artwork (R1) | `ERANDEL_ART_BIBLE.md` §8.2, §12 |
| The western plateau and its two waterfalls; the stairs up the cliff; the stone bridge over the Aethwyn; ruins of an older age (arches, walls, broken pillars) | **PROVISIONAL** (registry L11–L14) | Phase 3 layout |

Who built the ruins, and when, is **not answered** here. The ruins only show the art bible's "layered eras" look (§8.1).

## What the region contains

| Part | How it is made | Draw calls |
|---|---|---|
| Terrain shaping: western plateau (6.5 m) with a climbable cliff, two pools, two streams to the Aethwyn, two springs on the plateau, a stair ramp, raised banks at the bridge | `erelianShape()` inside the shared `heightAt()`; walkable bridge deck in `groundY()` via `bridgeY()` | (terrain: 1, shared) |
| Water: the Aethwyn through Erelian, streams, pools, plateau springs | One mesh, flowing painted shader (turquoise shallows to deep shade, flow streaks, edge foam, sky fresnel, night) | 1 |
| Two waterfalls, mist glows, spray | Curtain mesh with a falling-streak shader; one animated Points cloud | 2 + 2 sprites |
| 20 authored prefabs: 5 trees (1 ancient hero tree), 4 rocks and a cliff boulder cluster, a fallen log, 2 spires, 2 arches, a wall, 2 broken pillars, the stairs, the bridge, 6 kinds of ground cover | GLB packs placed with instancing, CPU culling and 2 LODs | about 25–45 in view |
| Distant mountain ridges (3 layers) | Generated ring, tinted to the haze; shown only near Erelian | 1 |
| Light shafts (day), pollen motes (day) and fireflies (night) | One additive mesh; one Points cloud wrapping around the camera | 2 |
| Atmosphere | Blends into the existing day/night lighting by how deep the player is in Erelian: mist-tinted fog, less sky fill under the canopy, warmer sun | — |

Before the region, Erelian was primitive shapes: white cylinders for spires, icosahedron canopies. Those old props are no longer placed inside Erelian. Everywhere else they are exactly as before, which the acceptance test checks.

## Assets

Generated deterministically by `tools/assets/author-erelian.mjs` (run `npm install && npm run erelian` in `tools/assets/`). They are real 3D meshes authored in code, the region's **v1 assets**. Each one can be replaced by a hand-made or AI-assisted asset with the same name through the art bible pipeline (§2.3), with no code change.

| File | Size | Contents |
|---|---|---|
| `assets/game/erelian/env_erelian_ruins.glb` | 137 KB | spires, arches, wall, pillars, stairs, bridge (lod0 + lod1) |
| `assets/game/erelian/env_erelian_rocks.glb` | 42 KB | rocks, cliff boulder cluster, log |
| `assets/game/erelian/veg_erelian_trees.glb` | 391 KB | 5 trees with painted leaf-card canopies |
| `assets/game/erelian/veg_all_groundcover.glb` | 16 KB | grass, tall grass, flowers, fern, reeds, bush |
| `assets/game/all/tex_all_foliage-atlas.ktx2` | 189 KB | the painted foliage atlas, Basis ETC1S with mipmaps (GPU-compressed) |
| `assets/game/all/tex_all_foliage-atlas.png` | 650 KB | fallback, loaded only if KTX2 cannot be transcoded |
| **Download for the region** | **776 KB** | GLBs + KTX2 |

- **Meshes:** meshopt-compressed and quantized (`EXT_meshopt_compression`, `KHR_mesh_quantization`). Vertex colour carries the painted colour, and a `_WIND` attribute carries sway weight.
- **Triangles:** a tree is 0.8k–1.6k triangles at lod0 and 0.3k–0.6k at lod1; a structure is 0.5k–1.9k.
- **Naming:** follows the art bible §16.3.

## Runtime

- **Progressive loading:** the generated parts (water, falls, mountains, light, particles) exist from the first frame. The assets stream 0.7 s after the world is built, in order: atlas, ruins, rocks, trees, ground cover. Each pack appears as soon as it arrives. The loaders (`GLTFLoader`, `KTX2Loader`, meshopt decoder) are only imported then.
- **Instancing:** one `InstancedMesh` per prefab part per LOD. About 5 times a second, and at once when the camera jumps more than 4 m, the CPU culls instances by distance and frustum and picks lod0 or lod1. Wind and the painted brush variation run in the shader. Ground cover is tinted per instance from the terrain colour.
- **Materials:** `paintedMat()`, a Lambert material with vertex colour, painted brush variation in world space and wind. It uses an ordered dither to dissolve objects between the camera and the player. Ground cover, rocks, the bridge and the stairs only fade right at the camera, so walkable surfaces never turn see-through.
- **Graceful degradation:** `?region=off` turns the region off. If assets fail to load, the region stays playable without them (tested), and the generated parts still show.

### Graphics tiers (`src/core/gfx.js`)

| Tier | Default for | Density | Ground cover drawn to | lod0 to | Trees drawn to | Motes | Light shafts |
|---|---|---|---|---|---|---|---|
| low | — | 45% | 16 m | 16 m | 75 m | 60 | off |
| medium | phones | 70% | 24 m | 24 m | 105 m | 140 | on |
| high | desktop | 100% | 34 m | 34 m | 140 m | 240 | on |

Change it in Settings → Graphics (it applies after a reload), or with `?gfx=low|medium|high`.

## Acceptance test (`tests/integration/region-erelian.js`, `npm run test:region`, in CI)

| # | Criterion | Result (2026-11-05) |
|---|---|---|
| 1 | The region loads | PASS: 4/4 packs, KTX2 atlas, no errors. Placed: 74 trees, 1,156 ground-cover clumps, 16 structures, 130 rocks |
| 2 | The player can explore | PASS: real `W` key presses walk at the normal 7 m/s; the bridge deck is walkable (player at 2.80 m, deck 2.80 m, river bed −2.97 m); halfway up the stairs the player stands at 4.0 m |
| 3 | The camera works | PASS in all 6 views: 7 m from the player, 1.6–3.9 m above ground |
| 4 | Visual depth | PASS in all 6 views: near detail (lod0), far detail (lod1) and the mountain ridges all drawn |
| 5 | Lighting | PASS: day frames mean luminance 0.47–0.50 with spread 0.20–0.23, night 0.23–0.39; under 1% of samples clipped. The look is reviewed by eye in the evidence screenshots |
| 6 | Mobile performance | PASS: phone viewport gets the medium tier; worst view 154 draw calls and 191k triangles (budget 250 and 300k); region download 776 KB |
| 7 | Existing gameplay | PASS: an action and a melee hit work in Erelian; the full suite still passes (67 unit tests, browser, two-player, old saves, fallbacks) |
| 8 | Other regions unchanged | PASS: every old prop outside Erelian is identical with the region on and off |
| — | Assets blocked | PASS: the region reports `failed`, and the game starts and plays |

Evidence: `production/qa/evidence/region-erelian/` (8 desktop and 4 phone screenshots).

## Known limits (v1)

- **Frame rate is not measured here.** The tests run in software rendering, which says nothing about frame time on a real phone. Run `production/qa/mobile-perf-test-plan.md` at `https://soladelvaux.github.io/erandel/?perf` in Erelian before calling mobile performance proven.
- **The characters are still the old chibi characters.** Art bible decision D1 retires them, but characters are their own phase.
- **Most draw calls in a busy view come from the existing characters and creatures,** each built from many separate meshes. That is milestone G of Phase 1. The region itself adds about 25–45.
- **Dissolve:** trees between the camera and the player still dissolve with a dither pattern. It's ordered now, so it reads as an even screen rather than noise, but it's visible on phones.
- **The terrain mesh is about 1 m per cell,** so the cliff, the streams and the stair ramp are soft at close range. A finer terrain patch for the region is the next upgrade.
- **The claude.ai preview** gets no region assets, because they aren't published with the preview. It runs the region without them. The public site is the production home and has them.

## Defects found while testing, and fixed

| Found by | Defect | Fix | Guard |
|---|---|---|---|
| Screenshot diff against the last release, then a prop count with the region on and off | My first version left the "skip Erelian's old props" switch on after the scatter loop, so **every lantern and lily pad placed after it disappeared world-wide** (Thorngate road lanterns, river lanterns and lilies) | The switch now applies to the scatter loop only, and skips a prop by where the prop stands | Acceptance check 8 compares every old prop outside Erelian with `?region=off`. It was watched failing (0/20 lanterns, 0/6 lily pads) before the fix |
| The two-player test, failing 1 run in 3 | Attack or dodge pressed before the player's character model exists threw an error. In the test, a background tab had not drawn its first frame. In the game, the window is the first frame after "begin" | `canAct()` also requires the character to exist | `npm run test:fallback` presses attack and dodge with no character. It was watched failing without the guard. The two-player test now waits for each character and runs without background throttling: 6 of 6 passes |
| The acceptance test's own numbers | At under 1 frame per second (software rendering), instance culling, which was timed in game seconds, lagged behind teleports | Culling refreshes on wall-clock time and at once when the camera jumps more than 4 m | Every view in the acceptance test |
| Looking at the screenshots | The game's random-noise dissolve made big tree canopies near the camera a field of speckle, and the bridge deck turned see-through | Ordered (Bayer) dither for the new materials; walkable structures only fade right at the camera | Evidence screenshots |
