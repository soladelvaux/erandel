# ADR-0003: A lightweight `net/` layer, local first, no server dependency

## Status

Accepted (2026-11-05, by Sola)

## Date

2026-11-05

## Last Verified

2026-11-05. The structure is decided. The folder is created in the first commit of ADR-0002 step U2, because that is when the project gets its `src/` modules.

## Decision Makers

Sola (creator), with Claude acting as technical director

## Summary

All networking goes through one small interface in `src/net/`. The game must run fully with no network at all. No game server, account server or other backend is introduced now. The existing transports (the claude.ai room and the peer-to-peer world) move behind the interface unchanged.

## Engine Compatibility

| Field | Value |
|---|---|
| Engine | Independent of Three.js |
| Domain | Networking |
| Knowledge risk | Low |
| Post-cutoff APIs used | None |

## ADR Dependencies

ADR-0002 (the folder appears at step U2).

## Context

Today, networking code is spread through `src/index.html` (`NET`, `initNet`, `p2pRoom`, `netPeers`, `netFx`, the chat functions and the sanitizers). The Phase 1 audit proposed a `net/` folder so that a future game server can replace the current transports without touching gameplay. Sola approved it with two conditions: keep it lightweight, and keep the game operating locally with no server dependencies yet. The structure Sola meant to attach did not arrive, so the structure below is Claude's proposal and can be replaced.

## Decision

```
src/net/
  NetClient.ts           interface the game uses: presence(), emit(), on(), onPeers(), connected()
  LocalTransport.ts      default: works offline, no peers, every call is a no-op
  ClaudeRoomTransport.ts wraps claude.use("room") on the claude.ai page (today's code)
  P2PTransport.ts        Trystero peer-to-peer world (today's p2pRoom, unchanged)
  sanitize.ts            sanitizePeer, sanitizeFx, cleanText (moved with their unit tests)
  index.ts               connect(): Claude room if available, else peer-to-peer, else LocalTransport
```

Rules:
- Gameplay never imports a transport directly, only `NetClient`.
- `LocalTransport` is always the fallback, and the game must pass every test with it.
- No new dependency. Trystero is already in use and stays optional: if it fails to load, `LocalTransport` takes over.
- No server code in this repository until Phase 4. Then a `ServerTransport.ts` is added behind the same interface.
- Everything from other players stays untrusted and goes through `sanitize.ts`.

## Alternatives Considered

- **No `net/` until Phase 4:** rejected by Sola. Adding it now keeps transport code out of gameplay during the port.
- **Default to LocalTransport even when peers are reachable:** possible if "operate locally" means no live multiplayer at all for now. It is not chosen, because peer-to-peer multiplayer is already live at `soladelvaux.github.io/erandel`. Sola can switch it with one line in `index.ts`.

## Consequences

- Positive: a server can arrive later without touching gameplay, and the game runs offline by design.
- Negative: one extra interface to keep in step with the transports.

## Risks

| Risk | Mitigation |
|---|---|
| Behaviour drifts while moving the transports | `npm run test:p2p` and the fake-room checks in `test:browser` run at every step |

## GDD Requirements Addressed

`design/gdd/multiplayer.md`, unchanged.

## Performance Implications

None.

## Migration Plan

Created at ADR-0002 step U2. The code moves verbatim. `LocalTransport` is new, at about 20 lines.

## Validation Criteria

- With networking disabled, all 65 tests and the browser test pass.
- With peers available, `test:p2p` passes.

## Related

ADR-0002, `design/gdd/multiplayer.md`
