# ADR-0001: Single-file web game on three.js instead of Godot, Unity or Unreal

## Status

Accepted. Superseded in part by ADR-0002 (2026-11-05): the r128 pin ends at step U1 and the single-file layout ends at step U2.

## Date

2026-11-03

## Last Verified

2026-11-03 (v0.3.0 builds and runs; tests pass)

## Decision Makers

Sola (creator), with Claude acting as technical director

## Summary

Erandel is built as one HTML file using three.js r128, published as a claude.ai Artifact, instead of a Godot, Unity or Unreal project. This keeps the game playable on a phone with no install and editable without an engine.

## Engine Compatibility

| Field | Value |
|---|---|
| Engine | Web browser, three.js r128 (not a template-supported engine; `engine.name` left unset) |
| Domain | All (rendering, input, audio, persistence) |
| Knowledge risk | Low: r128 is well documented and pinned |
| Post-cutoff APIs used | None |

## ADR Dependencies

None.

## Context

### Problem Statement

The creator mostly works from a phone; their laptop is an office machine where installing software is restricted. The game must be playable and shareable instantly.

### Current State

The game started as a 2D prototype, became an HD-2D pixel world, and is now a cozy 3D diorama, all in one file.

### Constraints

- No installs on the creator's devices; no build server.
- Artifact hosting allows scripts only from a few CDNs and no other network requests.
- Phones are the main target.

### Requirements

- Open-world 3D with lighting and bloom; touch controls; saves; no external assets.

## Decision

Keep the whole game in `src/index.html`: data and rules as plain JavaScript, a three.js world layer, an HTML overlay UI, localStorage saves, procedural art and music.

### Architecture Diagram

See `docs/architecture/architecture.md`.

### Key Interfaces

`doAction(kind, arg)`, `dawn()`, `save()/loadSaved()`, `render()`, `initWorld()/loop()`, `buildPlace/buildRemove`, `openMarket/closeMarket`.

### Implementation Guidelines

- Engine rules must work without WebGL (fallback mode) so they can be tested in jsdom.
- 3D code reads engine state; engine code never depends on three.js objects.

## Alternatives Considered

### Alternative 1: Godot 4

Template-supported with specialist agents, better tooling and performance. Rejected for now: needs an install the creator cannot do, and an export step for every playtest.

### Alternative 2: Multi-file web project with a bundler

Cleaner code organisation. Rejected for now: Artifact publishing prefers one file, and a build step adds friction from a phone.

## Consequences

### Positive

- Plays instantly on any phone; one link to share; no install.
- The whole game can be reviewed and tested from one file.

### Negative

- One very large file (~350 KB); harder to navigate.
- Template engine-specialist reviews do not apply.
- Saves are per browser.

### Neutral

- All art is procedural, which suits the stylised look but limits detail.

## Risks

- Low-end phone performance (mitigated by Glow toggle, light pool size, pixel-ratio cap).
- CDN availability (mitigated by the 2D fallback and no-bloom path).

## GDD Requirements Addressed

All systems in `design/gdd/systems-index.md`; especially Interface and Controls (phone-first) and Audio and Atmosphere (bloom, lights).

## Performance Implications

Target 30+ fps on mid-range phones: instanced props, ≤ 8 point lights, pixel ratio ≤ 1.25 on phones, bloom at half resolution.

## Migration Plan

If the game outgrows one file: split DATA, ENGINE and WORLD into modules with a small bundler, keep the single-file build as the published output. A Godot port would reuse the GDDs and data tables.

## Validation Criteria

The test suite passes; the game loads on a phone with no console errors; screenshots in `production/qa/evidence/` show the plot by night without glare.

## Related

`docs/architecture/architecture.md`, `design/art/art-bible.md`, `tests/README.md`.
