# ADR-0002: Modernise Three.js in controlled steps (r128 → r186.1), then Vite + TypeScript modules

## Status

Accepted (2026-11-05, by Sola)

## Date

2026-11-05

## Last Verified

2026-11-05. Not implemented yet. This ADR fixes the rules and the step plan before any code moves.

## Decision Makers

Sola (creator), with Claude acting as technical director

## Summary

Keep Three.js and upgrade it from r128 to r186.1 one step at a time. Change only one kind of thing per step: the Three.js version, the module system, or the look. Never combine a step with a gameplay rewrite. Every step ends with the 65 rule and playthrough tests passing and a tagged rollback point. This supersedes ADR-0001 in part: the "single file" decision ends at step U2 below, and the "three.js r128 pinned" decision ends at step U1.

## Engine Compatibility

| Field | Value |
|---|---|
| Engine | Web browser, Three.js r128 now; r186.1 at the end (the newest release at least two weeks old on 2026-11-05; r187 is from 2026-10-30) |
| Domain | Rendering, build, module layout |
| Knowledge risk | Medium. The breaking changes come from the official Migration Guide (see Related), checked against every Three.js API the game calls |
| Post-cutoff APIs used | None planned. `THREE.Timer` (core since r179) replaces `THREE.Clock` at step U7 |

## ADR Dependencies

ADR-0001 (single-file web, now partly superseded). ADR-0003 (`net/` folder) is independent of this one.

## Context

The Phase 1 audit (`claude.ai` doc "Erandel — Phase 1 Technical Audit", 2026-11-05) found that Erandel already runs on Three.js r128 (2021). That version is loaded as UMD globals with the `examples/js` add-ons, which Three.js removed in r148. The target, a painterly anime 3D world, needs glTF characters, skinning, animation, compressed textures and a smaller draw-call budget. All of those are much easier on current Three.js with ES modules.

Sola set five requirements:
1. All 65 existing tests must pass after every migration milestone.
2. Upgrade Three.js in controlled steps.
3. Identify the breaking API changes.
4. Keep a rollback point.
5. Don't combine a major rendering migration with a gameplay rewrite.

## Decision

### Rules for every step

- **One kind of change per step:** a Three.js version change, a module or build change, or a look change. Gameplay rules (`doAction`, hazards, evolution, magic, economy, `ACT` tuning) are **frozen**. They are moved verbatim and never edited during U1–U7.
- **Gate, all must pass:**
  1. `npm test` passes 65 of 65.
  2. `npm run test:browser` and `npm run test:p2p` pass.
  3. The screenshots in `production/qa/evidence/` are compared side by side with the baseline from tag `v0.4.1`, and any visible difference is either fixed or written down and accepted by Sola.
  4. A v0.4.1 save loads and plays.
- **Rollback:**
  - Tag `v0.4.1` (commit `d7c4681`) is the baseline.
  - Each passed step gets a tag `migrate-uN`.
  - Work happens on a branch `migrate/uN` and merges to `main` only after its gate passes.
  - The public site keeps serving the last passed tag until the next gate passes, so a failed step never reaches players.
  - Rolling back means redeploying the previous tag.

### Steps

| Step | Change | Three.js | What the game must adapt (from the Migration Guide, checked against our code) |
|---|---|---|---|
| U0 | Rollback point; record a baseline | r128 | Tag `v0.4.1`; keep the current screenshots as the baseline |
| U1 | Version only, still one file with script tags | r128 → r147 (the last release with `examples/js`) | **r144:** `MeshLambertMaterial` switches to per-fragment shading. Chibis, props and creatures will look smoother; re-check the look. **r147:** `PointLight` default `decay` becomes 2. Our pool lights and night lamp already pass `decay` explicitly, so there is no change. **r140:** `fog` moved to the materials that support it, with no change for us. **r137:** sRGB decoding removed in GLSL, with no effect while output stays linear. Our `onBeforeCompile` patches (`#include <common>`, `<begin_vertex>`, `<color_fragment>`, `void main() {`) do not use renamed chunks |
| U2 | Module system and build only, same r147 | r147 via npm | Vite 8 + TypeScript 7 (TypeScript in loose mode first). Use `three/examples/jsm` add-ons. Split into the target folders (`core/`, `rendering/`, `gameplay/`, `world/`, `entities/`, `ui/`, `persistence/`, `data/`, `audio/`, `net/`). Gameplay code is moved verbatim. Build a single-file export for the claude.ai page. No API changes in this step |
| U3 | Version | r147 → r151 | **r148:** default segment counts rose for Circle, Ring, Cylinder, Cone and Torus geometries. All of our calls (about 50) pass their segment counts, so there is no change. **r150:** `ColorManagement.legacyMode` and `physicallyCorrectLights` are renamed; we use neither. **r151:** `InstancedMesh.frustumCulled` defaults to true. We set false explicitly, so it is unchanged. `Points` gain uv |
| U4 | Version | r151 → r152 | **Colour management:** `outputColorSpace` defaults to sRGB and `ColorManagement.enabled` to true. Every hex colour, vertex colour and canvas texture would look different. To keep the look unchanged in this step, set `ColorManagement.enabled = false` and `renderer.outputColorSpace = LinearSRGBColorSpace`. Then set `CanvasTexture.colorSpace` to match. The real sRGB workflow is adopted later, in the art phase, as a look change |
| U5 | Version | r152 → r155 | **r153:** `EffectComposer` uses `HalfFloatType` targets (bloom may shift a little). **r154:** chunk renames (`encodings_fragment`, `output_fragment`), which we do not patch. **r155:** physically based light units are the default and `useLegacyLights` is deprecated. Convert our intensities: hemisphere and sun about ×π, and point lights re-tuned with their `decay` and `distance`. Add an `OutputPass` after bloom for colour and tone mapping |
| U6 | Version | r155 → r163 | **r157:** `GeometricContext` removed, which our patches do not use. **r163:** WebGL 1 removed. Phones without WebGL 2 fall back to the 2D journal mode, which already exists; record this in the accessibility doc |
| U7 | Version | r163 → r186.1 | **r170:** `Material.type` becomes read-only, which we never set. **r183:** `Clock` is deprecated, so replace `THREE.Clock` with `THREE.Timer` (core since r179; call `timer.connect(document)` to keep pause-on-hidden). **r177** and **r181** affect colour-management helpers and PBR materials, neither of which we use |

After U7, the art phase (Phase 2) changes the look on purpose: sRGB colour, toon materials, glTF assets. Gameplay changes come only after the migration has closed.

## Alternatives Considered

- **One jump r128 → r186:** rejected. A visual difference could not be traced to a release.
- **Modules first, then versions:** rejected for U1. Upgrading to r147 while still one file keeps the first step tiny and needs no build.
- **Keep r128:** rejected. No glTF, skinning or compressed-texture pipeline without the removed `examples/js`.
- **Another engine (Babylon.js, PlayCanvas, Godot web):** rejected in the Phase 1 audit, because it would throw away tested code.

## Consequences

- Positive: each step is small, testable and reversible. The asset pipeline opens at U2. `Timer`, `BatchedMesh` and compressed textures become available.
- Negative: there are seven steps, each with a screenshot review. Old phones without WebGL 2 lose 3D after U6. There is now a build step, so the public site deploys from CI instead of a hand copy.

## Risks

| Risk | Mitigation |
|---|---|
| Light and colour steps (U4, U5) change the look | Legacy-equivalent settings first; screenshot compare; the look changes only in Phase 2 |
| The jsdom tests stop loading the game once it is modules | At U2 the tests load the built single-file export, so they keep testing what players get |
| Saves from v0.4.1 break when ids are renamed to canon (`bramble` → `elash` …) | The renames are a data change after U7, with a v1 → v2 save migration and its own test, never inside a version step |
| The migration guide misses something | Each step's gate includes the full browser tests and a screenshot review |

## GDD Requirements Addressed

None changed. The rules in `design/gdd/*` stay as written. The gate proves it.

## Performance Implications

No budget is set in this ADR. Draw calls (140–686 measured in the audit) are addressed in Phase 2. U2 adds tree-shaking (a smaller bundle). U5 should be neutral.

## Migration Plan

U0 → U7 as above. Each step is one branch, one gate and one tag.

## Validation Criteria

At every tag `migrate-uN`:
- 65 of 65 tests pass, and the browser and P2P tests pass.
- Screenshots are compared and accepted.
- A v0.4.1 save loads.
- The public site is deployed from that tag.

## Related

- Three.js Migration Guide: https://github.com/mrdoob/three.js/wiki/Migration-Guide (read 2026-11-05)
- r155 lighting changes: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733
- ADR-0001, ADR-0003, `docs/architecture/architecture.md`
