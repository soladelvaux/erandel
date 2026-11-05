# Erandel multiplayer architecture (Phase 6)

**Status**: Proposed, awaiting Sola's decisions (§11) · **Date**: 2026-11-06 · **Owner**: Sola · **Decision record**: `adr-0004-colyseus.md` (Proposed)
**Scope**: specification, data model, API design and phased plan. **No production server is built in this phase**, and the single-player game is unchanged.
**Built now**: the state boundary `src/sim/state.js` and the client-message rules `src/net/protocol.js`, with 8 unit tests.

---

## 1. Summary

Erandel becomes an MMORPG in a specific order: a solid single-player game first, then authority, then networking.

1. **Separate simulation from presentation.** The game's state and rules become plain data and pure functions that run with no renderer (started now).
2. **Route every player choice through one authority.** It is local first, so single-player play exercises exactly the code a server will run.
3. **Add a Colyseus server** that runs that same authority for a region and syncs what each player may see.
4. **Then add accounts, persistence and scale.**

The non-negotiable rule throughout: **the client asks, the server decides.** Clients send intents (move here, attack that, take this action). Gold, items, damage, health, rewards and progression are computed and stored on the server only.

---

## 2. Where the game is today

| Area | Today | Trust |
|---|---|---|
| Game state | one object `S` in the browser, saved to `localStorage` | the player can edit it freely; fine for single-player |
| Rules | `doAction`, combat formulas, creature AI, living world, all in the page | run on the client |
| Other players | presence and chat over the claude.ai room or peer-to-peer (Trystero) | display only: peer data is sanitised (`sanitizePeer`, `cleanText`) and never changes your state |
| Accounts | built on the `feat/accounts` branch (Supabase: guest or email, unique names, cloud save), **parked, not deployed** | — |
| Presentation | three.js r151 scene `W3`, rigged characters, the region, the HUD | client |

**What works in our favour:**
- The rules already live in plain functions, apart from where they reach into `W3`.
- The save is already one JSON document.
- Peers can already only affect what you *see*.

---

## 3. The state model

`simState()` (`src/sim/state.js`) returns all of this as plain JSON. `SIM_AUTHORITY` records who decides each field:
- **server:** authoritative.
- **predicted:** the client moves first and the server corrects it.
- **client:** presentation only, never trusted.

| State | Contents | Authority | Synced to | Persisted |
|---|---|---|---|---|
| **Player** | name, kind, tier, path, legend, stats, HP/MP, Fate, Corruption, affinities, traits, conditions, region, job, magic sources, deeds used, day | server | owner: all; others: public subset (name, kind, tier, HP %, region) | yes |
| | position, facing | **predicted** | everyone nearby, 10–20 Hz | last position |
| | animation | client | everyone nearby (as a state name) | no |
| **World** | day, hour, weather, regional reputation, the day you fell | server | everyone in the region | yes (world: shared; reputation: per player) |
| **NPC** | position, activity (from schedule), and per player: reputation, help given, gifts, met / last met / talks | server | position and activity: everyone nearby; relationship: owner only | relationship per player |
| **Creature** | name, region, alive, HP, AI state, position, home, respawn time | server | everyone nearby | no (respawning world) |
| **Inventory** | gold, wood and stone, spells, plot buildings, pet, companion, blood bond | server | **owner only** | yes, every change in a ledger (§6) |
| **Quest** | NPC help per day, discoveries, flags, current evolution candidate | server | owner only | yes |
| **Event** | world events (first, last, count), hunting today, night-market sales | server | world events: the region; the rest: owner only | yes |

**Boundary rule:**
- Presentation (`W3`, three.js, UI, audio) may **read** sim state and **send intents**. It never changes sim state directly.
- Sim code never touches `THREE`, the DOM or `W3`.

**Code today versus the target:**

| Mixed today | Target |
|---|---|
| `updateMonster` moves creatures and updates their meshes in one function | creature AI in `src/rules/creatures.js` updates data; the presentation reads it |
| `doAction` writes log lines and calls `render()` | the rules return results and events; the UI renders them |
| player movement and physics live in the game loop with the camera | a movement rule `step(player, input, dt)`; the loop only presents |
| the living-world clock and schedules read `S` and set NPC meshes | the schedule is already a pure function of the hour (`npcWhere`); only the mesh update moves out |

---

## 4. Target architecture

```
 Browser (presentation)                       Server (authority)                     Storage
 ┌──────────────────────────┐  intents (WS)  ┌──────────────────────────────┐  SQL  ┌───────────────┐
 │ three.js scene, UI, audio │ ─────────────▶ │ Colyseus RegionRoom          │ ────▶ │ PostgreSQL    │
 │ input → intent            │                │  validate (net/protocol.js)  │       │ accounts,     │
 │ prediction (own movement) │ ◀───────────── │  rules (src/rules/*, shared) │       │ characters,   │
 │ interpolation (others)    │  state deltas  │  fixed tick, AI, events      │       │ ledger, world │
 └──────────┬───────────────┘  + messages    └──────────┬───────────────────┘       └───────────────┘
            │ HTTPS (login, characters)                 │ Redis (presence, rooms across processes, later)
            ▼                                           ▼
     Auth API (tokens)  ◀──── verifies tokens ──── room onAuth
```

- **One room per region** (Thorngate, Erelian, ...), with capacity and overflow instances ("Erelian 2") when full. Crossing a region boundary means leaving one room and joining the next, carrying the character from storage.
- **Fixed server tick**: 20 Hz for movement and combat, 1 Hz for the world clock, schedules and events.
- **Shared rules code** (`src/rules/*`, `src/net/protocol.js`, `src/data/*`) is plain JavaScript with no DOM. The browser and the Node server run the same files. That is why `protocol.js` is tested in an empty VM.
- **Single-player stays.** The game keeps working with no server through a `LocalAuthority` that runs the same rules in the page (§10, M1).

---

## 5. API design

### 5.1 Client → server: intents (WebSocket, Colyseus messages)

Defined and validated in `src/net/protocol.js` (`INTENTS`, `validateIntent`, `acceptClientMessage`). Every intent carries `seq`, a sequence number: the server ignores anything stale or replayed.

| Intent | Fields | Server decides |
|---|---|---|
| `move` | x, z, seq | accepts if the distance fits run speed × time (+ dodge); otherwise corrects the client |
| `jump` | seq | — |
| `dodge` | dx, dz (unit vector), seq | cooldown, invulnerable frames |
| `attack` | target, seq | range, arc, cooldown, damage, kill, loot, gold |
| `cast` | slot 0–3, target, seq | Focus cost, effect, damage |
| `action` | kind, arg, seq | the whole deed (`doAction` rules): eligibility, cost, gains, log lines |
| `talk` | npc, seq | the line, and memory updates |
| `chat` | text (≤ 120 characters) | moderation, rate limit, broadcast |

**Forbidden in any client message** (`NET_FORBIDDEN`): `gold`, `hp`, `hpMax`, `damage`, `xp`, `fate`, `corr`, `stats`, `items`, `inventory`, `tier`, `loot`, `reward`, `level`, `killed`, `sales`. A message containing any of these, at any depth, is rejected.

### 5.2 Server → client

- **Synced state** (Colyseus Schema, delta-encoded), the public region view:
  - `RegionState { clock: { day, hour }, weather, players: Map<sessionId, PlayerView>, creatures: Map<id, CreatureView>, npcs: Map<id, NpcView>, events: Map<id, EventView> }`
  - `PlayerView { name, kind, tier, x, z, facing, anim, hpPct, mpPct, title }`
  - `CreatureView { name, x, z, facing, state, hpPct, alive }`
  - `NpcView { x, z, activity }`
  - `EventView { active, since }`
- **Private state**, owner only: inventory, quests, full stats, relationships. It is sent through a per-client view (or a direct message after each change). It is never part of the shared region state.
- **One-off messages**: `result` (the outcome of an intent: log lines, toasts, the next dialog), `chat`, `correction` (authoritative position after a rejected move), `event` (a world event starting).
- **Request/response**: `talk` and `action` use Colyseus 0.18 request/response, so the UI can await the result.

### 5.3 HTTP API (outside the room)

| Method and path | Purpose | Auth |
|---|---|---|
| `POST /auth/guest` | create a guest account, return a session token | none, rate-limited |
| `POST /auth/register`, `POST /auth/login` | email and password | — |
| `POST /auth/link` | turn a guest into an email account (keeps characters) | token |
| `GET /characters` | list the account's characters | token |
| `POST /characters` | create a character (unique name, kind) | token |
| `POST /characters/:id/import` | import a local single-player save, under the policy chosen in §11 | token |
| `GET /characters/:id` | the owner's full character | token, owner |
| `POST /matchmake/region/:region` | join or create the region room for a character | token, owner |

Tokens are short-lived (minutes) with a refresh token. The room checks the token in `onAuth` and loads the character itself; the client never sends its own character data into a room.

---

## 6. Data model (PostgreSQL)

| Table | Key columns | Notes |
|---|---|---|
| `accounts` | id, email (nullable for guests), password hash (per-password salt), created, banned | guests can link an email later |
| `characters` | id, account_id, name (unique, case-insensitive), kind, created, last_seen, region, x, z | the name rule from the parked accounts branch |
| `character_state` | character_id, version, state jsonb, updated | the server-owned player, inventory, quest and event state (the shapes of `simState()`), versioned for migrations |
| `ledger` | id, character_id, at, kind (gold / wood / stone / item), delta, reason, ref | **every currency or item change**, so balances can be rebuilt and audited; the balance in `character_state` is a cache |
| `npc_relations` | character_id, npc_id, rep, helped_day, gifted, met, last_day, talks | per player, per NPC |
| `discoveries` | character_id, discovery_id, day | |
| `world_state` | region, day, hour, weather, updated | shared world (see the time question in §11) |
| `world_events` | region, event_id, first, last, count | shared world events |
| `chat_log` | id, region, character_id, at, text, flagged | kept short-term for moderation |
| `sessions` | id, account_id, created, expires, ip_hash | |

Writes happen **on the server only**, in transactions:
- the ledger row and the cached balance change together;
- a character's state is saved on region change, on logout, and every 30–60 s.

---

## 7. Security model

**Never trust the client for currency, inventory, combat outcomes or progression.**

| Threat | Defence |
|---|---|
| Editing gold, items, stats in the browser | the server owns them; client messages naming them are rejected (`NET_FORBIDDEN`); the ledger records every change |
| Speed or teleport hacks | each `move` is checked against run speed × elapsed time (+ dodge); otherwise the server sends a `correction` |
| Damage or kill spoofing | combat runs on the server with the shared rules; the client only sends `attack`/`cast` with a target |
| Replays and floods | per-intent sequence numbers; per-session rate limits (for example 30 moves/s, 4 actions/s, 1 chat/s) |
| Chat abuse | length limit 120; control characters stripped (the existing `cleanText`); rate limit; report and mute; short-term log |
| Impersonation | unique case-insensitive names; the room takes identity from the token, never from the client |
| Save tampering on import | a local save is untrusted; it can only be imported under the §11 policy, with caps |
| Leaked secrets | no database password, service key or signing secret is ever in browser code or in this repo. They live in server environment variables and the host's secret store. The browser holds only its own short-lived session token. A public key, such as Supabase's anon key, is acceptable only when row-level security stops it from doing anything a player could not |
| Peer-to-peer cheating today | peers can only change what you see (positions, names, chat), never your state; the P2P mode is retired when the server arrives |

---

## 8. Colyseus evaluation

| Criterion | Colyseus 0.18 (checked 2026-11-06 on npm) |
|---|---|
| Fit | Node.js room-based server with authoritative state; matches regions as rooms |
| Versions | server `colyseus` 0.18.11; client `@colyseus/sdk` 0.18.9; `@colyseus/schema` 5.0.45 |
| Licence | MIT (server, schema, SDK, auth, Redis packages) |
| State sync | Schema with delta encoding; **at most 63 fields per schema** (nest larger ones) |
| Netcode | `setFixedTimestep()`, `defineInput()`, `allowRewindState()` for lag compensation, client-side `Predict` and `room.clock` (all new in 0.18) |
| Auth | `@colyseus/auth`, or any token checked in `onAuth` (we can keep our own auth) |
| Scale | `@colyseus/redis-presence` and `@colyseus/redis-driver` for rooms across processes and machines |
| Persistence | new optional `@colyseus/database` in 0.18; we would use our own PostgreSQL access |
| Hosting | self-host on any Node host, or Colyseus Cloud |
| Risks | breaking changes between minor versions (0.16 → 0.17 → 0.18 changed packages, the client SDK name and the schema major); a small core team; the server is Node/TypeScript, a second codebase to run |

**Alternatives considered:**

| Option | Why not first |
|---|---|
| Nakama (Go, open source) | strong, with accounts, storage and chat built in, but authoritative logic is written in Lua, Go or TypeScript in its runtime, not our shared JavaScript rules |
| Supabase Realtime only | good for presence and chat (we already built accounts on Supabase), but not an authoritative game loop |
| Raw WebSockets (`ws` / uWebSockets.js) | full control and the least overhead, but we would rebuild rooms, matchmaking, sync and reconnection |
| Keep P2P (Trystero) | free and serverless, but can never be authoritative; fine for presence until the server exists |

**Recommendation:** Colyseus 0.18 for rooms and sync, with **our own auth and PostgreSQL** (or the parked Supabase accounts as the auth and database layer). Pin exact versions and isolate Colyseus behind the `src/net/` transport interface, so a version upgrade or a change of framework touches one folder.

---

## 9. Synchronisation design

| What | How | Rate |
|---|---|---|
| Own movement | client predicts immediately; sends `move` with seq; server validates and acks the last seq; on correction the client snaps or eases back | send 15–20 Hz |
| Others' movement | server state deltas; client interpolates about 100 ms behind | 10–20 Hz |
| Combat | client plays the swing at once (responsiveness, as today); the server resolves hit, damage and kill and sends the result; hit flashes and numbers show from the result | per intent |
| Creatures | server AI, state deltas; clients animate from state (the rigged boar already animates from AI state, Phase 4) | 10 Hz |
| NPCs | positions are a pure function of the world hour (`npcWhere`), so clients compute them locally; only the hour is synced | 1 Hz |
| World clock, weather, events | server-owned, 1 Hz | 1 Hz |
| Chat | message to the room; server moderates and broadcasts | per message |
| Interest management | send only creatures and players within about 90 m (the Phase 5 simulation levels); regions are separate rooms | — |

---

## 10. Phased implementation plan

Each milestone keeps the game fully playable and ends with the full test gate green.

| Milestone | Work | Exit test | Infrastructure cost |
|---|---|---|---|
| **M0 — Boundaries** (done 2026-11-06) | `simState()` with the 7 states and an authority per field; `protocol.js` intent rules, reusable on a server | 8 unit tests (state is plain JSON without a renderer, follows play, authorities; protocol accepts intents and rejects outcomes, cheats and malformed messages) | none |
| **M1 — Rules out of presentation** | move movement, combat resolution, creature AI and deed rules into `src/rules/*` with no `W3`/DOM; the loop and UI become readers; a `LocalAuthority` takes intents and returns results in single-player | the whole existing gate still green; rules tests run in plain Node; no behaviour change (screenshot diff) | none |
| **M2 — Local dev server** | a Colyseus 0.18 server in `server/` running `LocalAuthority`'s rules for one region; the client connects with `?server=` in development only; P2P stays the public default | two browsers in one region on localhost: moves, combat and chat authoritative; a client that edits its gold sees no effect | none (localhost) |
| **M3 — Accounts and persistence** | auth (decide: the parked Supabase accounts or our own, §11); PostgreSQL schema (§6); characters, ledger, save on region change and logout; local-save import under the chosen policy | register, play, reload on another device, same character; the ledger rebuilds the balance | small database |
| **M4 — Online movement, presence and chat** | public server for Thorngate and Erelian; replace P2P; interpolation, prediction, corrections; moderation tools | 20 test clients in one region, stable for 30 minutes; latency and bandwidth measured | one small server |
| **M5 — Server-side combat and creatures** | shared creatures per region; loot and gold from the server only; rate limits | cheat tests (speed, damage, gold) all rejected; combat feel unchanged at 100 ms simulated latency | as M4 |
| **M6 — Shared world** | server world clock and weather; shared NPC schedules and events (soul-lights for everyone at once); group play | everyone in a region sees the same hour, weather and events | as M4 |
| **M7 — Scale and operations** | Redis presence and driver; region overflow instances; backups, monitoring, admin tools; load tests | target concurrency from §11 met in a load test | grows with players |

---

## 11. Decisions for Sola

| # | Question | Why it matters | Recommendation |
|---|---|---|---|
| Q1 | **Shared world time or personal deed-days?** Today each player's day advances by their own deeds and sleep. In a shared world, the clock must be shared | the biggest design change multiplayer brings; it touches progression | keep **deeds per player** (actions per day, gains) but run **one shared world clock** for light, NPCs and events; sleeping becomes "rest until dawn" for that player |
| Q2 | **Local saves when accounts arrive** | a local save is fully editable | let players carry over **name, kind and appearance only**, with a fresh start; or import with caps (gold, tier) |
| Q3 | **Accounts**: resume the parked Supabase accounts, or `@colyseus/auth` with our own PostgreSQL | both work; Supabase is already built and tested on its branch | resume Supabase for auth and the database; Colyseus verifies its tokens |
| Q4 | **PvP** | changes combat validation and region rules | none at first; maybe opt-in duels later |
| Q5 | **Target players** per region and in total for the first public test | sizes the server and the load tests | 50 per region room, 200 in total, then measure |
| Q6 | **Hosting budget** | Colyseus Cloud or a self-managed Node host | decide at M2 with measured numbers |
| Q7 | **P2P mode** | keep it as the free fallback for presence until M4 | keep until M4 |

---

## 12. What was built in this phase

- `src/sim/state.js`: `simState()` returns the seven states as plain data, renderer-free. `SIM_AUTHORITY` and `simAuthority()` give who decides each field. `simIsPlain()` checks a snapshot.
- `src/net/protocol.js`: the intent catalogue, `validateIntent()`, `containsForbidden()` and `acceptClientMessage()`. It has no dependencies, so it is ready to run on a server.
- `tests/unit/sim/state.test.js` (4 tests) and `tests/unit/net/protocol.test.js` (4 tests): all pass. The full suite is 75 tests.
- **No gameplay changes.** These files are additive; nothing calls them during play yet. M1 starts routing play through them.
- This completes Phase 1's milestone E, "lightweight network abstraction": interfaces and types now, no servers.
