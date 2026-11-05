# ADR-0004: Colyseus for future multiplayer rooms and state sync

## Status
Proposed (2026-11-06). Becomes Accepted when Sola answers Q1–Q3 in `multiplayer-architecture.md` §11.

## Context
Erandel will become an MMORPG. Today it is single-player, with display-only presence and chat over the claude.ai room or peer-to-peer (Trystero). An authoritative server is needed before currency, items, combat and progression can be shared. Phase 6 asked for an evaluation of Colyseus and a plan that preserves the playable game.

## Decision
- Use **Colyseus 0.18** (MIT; `colyseus` 0.18.11, `@colyseus/sdk` 0.18.9, `@colyseus/schema` 5.0.45 on 2026-11-06) for rooms, matchmaking and delta state sync, with one room per region.
- Keep authentication and the database our own: PostgreSQL, with the parked Supabase accounts as the likely auth (Q3).
- The server runs the **same shared rules files** as the client (`src/rules/*` after M1, `src/net/protocol.js` now).
- Colyseus is isolated behind `src/net/`, and exact versions are pinned.

## Alternatives
- Nakama: authoritative logic in its own runtime, not our shared JavaScript.
- Supabase Realtime alone: no authoritative game loop.
- Raw WebSockets: we would rebuild rooms, sync and reconnection.
- Staying peer-to-peer: never authoritative.

See §8 of the specification.

## Consequences
- A Node/TypeScript server becomes a second deployable, from milestone M2.
- Colyseus has shipped breaking changes between minor versions (0.16 → 0.18). Upgrades need a migration step, contained in `src/net/`.
- Schema classes hold at most 63 fields, so large views are nested.
- Single-player keeps working through a `LocalAuthority` with the same rules.

## ADR Dependencies
- ADR-0002 (three.js migration and module split): the shared rules depend on the modules.
- ADR-0003 (net folder): this ADR fills it.

## Engine Compatibility
- Browser client on three.js r151; the server has no renderer.
- The shared files must avoid DOM and `THREE` (tested by loading `protocol.js` in an empty VM).

## GDD Requirements Addressed
- `design/gdd/multiplayer.md`: shared world, chat, presence.
- Phase 6 brief: authentication, sessions, rooms, movement sync, state sync, chat, shared NPC events, server-side combat validation, persistent accounts, database.
