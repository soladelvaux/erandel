# Architecture Review — 2026-11-03

**Scope**: `docs/architecture/architecture.md`, ADR-0001, `src/index.html` v0.3.0
**Reviewer**: Claude (acting for technical-director)
**Verdict**: CONCERNS (ship-ready for a prototype; three structural risks to plan for)

## Engine audit

NOT ASSESSED by an engine specialist: `engine.name` is unset because the template supports only Godot, Unity and Unreal (see ADR-0001). Reviewed instead against the control manifest.

## Findings

| # | Area | Finding | Severity | Recommendation |
|---|---|---|---|---|
| 1 | Code size | One ~350 KB file mixes data, engine, 3D and UI | Medium | Split into modules with a single-file build step once a second contributor joins (ADR-0001 migration plan) |
| 2 | Testability | Engine rules run without WebGL; 13 unit tests + 36 seeded playthroughs + browser smoke test | Good | Keep the "engine never touches three.js" rule |
| 3 | Persistence | Saves are per browser; no export | Medium | Add save export/import (string code) before 1.0 |
| 4 | Performance | Instancing, light pool, pixel-ratio cap, Glow toggle | Low | Profile on a low-end Android phone; add a low-quality preset |
| 5 | External dependencies | three.js and bloom from public CDNs | Low | Fallbacks exist (2D mode, no bloom) |
| 6 | Global state | `S` and `ui` are globals | Low | Acceptable for one file; wrap in a module when splitting |

## GDD coverage

All 14 systems in `design/gdd/systems-index.md` map to code sections listed in `architecture.md`. No GDD requirement lacks an implementation.

## Next

Plan findings 1 and 3 as stories when running `/create-epics`.
