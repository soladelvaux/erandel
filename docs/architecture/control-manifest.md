# Control Manifest: Erandel

**Manifest Version:** 2026-11-03
**Applies to:** `src/index.html` · **Source ADRs:** ADR-0001

## Engine layer (DATA, ENGINE)

**Required**
- All rules work without WebGL (2D fallback) so `npm test` can run them in jsdom.
- Every player action goes through `doAction(kind, arg)`; it owns cost, checks, hazards, saving and rendering.
- New state fields get a default in `newChar()` and a migration in `valid()`.
- Gameplay numbers live in the data tables (`RACE_DEF`, `REG`, `CATALOG`, `SRC`, `FORMS`, `COND`, `FOODS`, `JOBS`) and are documented in the matching GDD.

**Forbidden**
- Engine code referencing three.js objects or `W3`.
- Writing to `localStorage` outside `save()`, `saveCodex()` and `savePrefs()`, or without try/catch.

## World layer (3D)

**Required**
- InstancedMesh for repeated props, with `instanceColor` allocated at full size before use and `frustumCulled = false`.
- Cached materials and geometries (`mat`, `bmat`, `geo`).
- Point lights only through the pool (≤ 4 phone, ≤ 8 desktop); new light sources are added to `W3.LIGHTS`.
- Glow sprites additive, no depth write, small.

**Forbidden**
- New per-frame allocations in `loop()` (reuse `_v`, `_c1`, `_c2`).
- Loading scripts from hosts other than cdnjs / jsDelivr / unpkg.

## UI layer

**Required**
- The overlay is re-rendered from `S` and `ui`; persistent touch controls stay outside `#app`.
- Every player-visible change is verified with a screenshot in `production/qa/evidence/` (run `npm run test:browser`).
- Errors and refusals explain what to do next.

## Guardrails

- Run `npm test` and `npm run test:browser` in `tests/` before publishing.
- Update the GDD and its tests when a rule changes.
