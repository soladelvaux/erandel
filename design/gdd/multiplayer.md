# Multiplayer — Design Document

---
**Status**: Implemented (v0.4.0)
**Source**: `src/index.html` (`NET`, `initNet`, `netPeers`, `netSend`, `netFx`, `netFxIn`, `netChatIn`, `sendChat`, `updatePeers`, `renderNet`, `myPresence`, `sanitizePeer`, `sanitizeFx`, `cleanText`)
**Date**: 2026-11-05
**Verified By**: `tests/unit/engine/action-combat.test.js` (sanitizing), `tests/integration/browser-smoke.js` (fake room with three players)
**Implementation Status**: Fully implemented
---

## Overview

Everyone who has the published Erandel page open at the same time shares one world. Each player sees the others as their own kind's character with a name plate, sees their skill effects, and can chat. It runs on the claude.ai artifact `room` capability: presence for positions, two open event topics (`fx`, `chat`) for moments. Nothing is stored on a server: each player's save stays in their own browser, so progress, gold and buildings are personal. When the room is not available (a downloaded copy, signed out, no permission) the game is single-player with no change in rules.

## Player Fantasy

"Erandel is a place other people live in." I walk out of Thorngate and see a merfolk swimming in the Mere and a werewolf fighting a boar; they wave in chat and I see their Fire Wave light up the trees.

## Detailed Rules

**Joining**: on start the page asks `claude.use("room")`. A null answer means solo. The "N online · Chat" pill appears only when the room exists.

**Presence** (what I share, about 7 times a second while moving, once a second when idle, only when it changed): name (20 chars), kind, tier, title, position x/y/z, facing, animation (idle, run, jump, atk, cast, dodge, climb), HP and max HP, land. Under 600 bytes.

**Other players**: drawn from presence only. Up to 24 others. Positions are smoothed (interpolated). Name plates show name, kind and tier. Their chibi is rebuilt if they evolve into another kind. They leave the world when they close the page.

**Effects** (`fx` topic): my swings and spells are broadcast as cosmetic effects (slash, bolt, wave, summon spirit, ritual explosion) with the element colour. Other players' effects never deal damage to my creatures or to me. At most one effect per player per 120 ms is drawn.

**Chat** (`chat` topic): up to 80 characters. Shown as a speech bubble over the speaker for 6 s and in the chat log (last 3 lines fade after 20 s; open chat shows 8 lines and who is here). At most one message per player per 0.8 s is shown. My own message is shown immediately; my echo is ignored.

**Opening chat** (Chat pill or T): the chat bar replaces the controls; creatures leave you alone while it is open; Escape or the pill closes it.

**Trust**: everything from other players is untrusted data. Names and chat are inserted as text, never HTML. Kinds, lands, animations, effect kinds and elements must be in the game's own lists (own properties only, so `__proto__` or `constructor` fail). Numbers must be finite and are clamped to the world bounds. Invisible and control characters are removed.

**Permissions**: the artifact is published with `capabilities: { room: { topics: { fx: "interact", chat: "interact" } } }` so everyone who can open it at Contributor level or above can send effects and chat. Viewers below that level still see everyone and still share presence.

## Formulas

| Quantity | Rule |
|---|---|
| Presence send interval | 0.14 s while not idle, 1 s when idle, skipped when unchanged |
| Peer smoothing | `pos += (target − pos) × min(1, 8 × dt)` |
| Online count | `1 + others` |
| Effect rate limit | 1 per player per 120 ms |
| Chat rate limit | 1 per player per 800 ms; bubble 6 s; log fade 20 s |

## Edge Cases

- A peer with no numeric position is ignored until it sends one.
- A peer with an unknown kind is drawn as a Human; an unknown land shows no land.
- The 25th and later peers are not drawn (the count still shows everyone up to the room's limit).
- A terminal room error (access withdrawn) removes all peers and returns to solo; the page keeps working.
- My own other tab appears as another player.
- Agents (non-viewer participants) are not drawn.
- Two players can stand in the same spot; there is no player collision and no player-versus-player damage.

## Dependencies

- **Reads**: [Kinds and Bodies](kinds-and-bodies.md) (character look), [World and Regions](world-and-regions.md) (bounds, lands), [Action Combat and Movement](action-combat.md) (animations, effects), [Evolution](evolution.md) (tier, title).
- **Used by**: [Interface and Controls](interface-and-controls.md) (online pill, chat bar, name plates, minimap dots).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Max drawn peers | 24 | 8–40 | Phone performance |
| Presence interval (moving) | 0.14 s | 0.1–0.5 | Smoothness vs. message budget (room allows about 40 a second shared) |
| Chat length | 80 | 40–200 | Bubble size |
| Name plate range | 60 units | 30–100 | Clutter |

## Acceptance Criteria

1. With a room, my presence is sent and is under 4 KiB with identifier keys (unit + browser test).
2. Three other players in the room appear as three characters with name plates; a name containing HTML shows as plain text; an unknown kind becomes Human (browser test).
3. An effect with an unknown kind or non-number position is ignored; a valid Wave from another player draws a ring (unit + browser test).
4. A chat message from another player appears in the log and as a bubble; mine is sent once on the `chat` topic (browser test).
5. Without a room the game shows no chat pill and plays exactly as single-player (jsdom suite runs without a room).
