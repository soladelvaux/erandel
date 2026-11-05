# Erandel

A 3D open-world fantasy action RPG you play together. Be reborn at the Thorngate as one of 36 kinds, live a life that decides what you become, fight and climb in real time from a third-person camera, meet other players in the same world, and light up your own lantern plot for a night market.

Built by **Sola** with Claude, using the [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) template (49 role agents, 74 workflow skills). The template's own README is in [`docs/template-README.md`](docs/template-README.md).

## Play

Open `src/index.html` in a browser (phone or desktop). Everything is in that one file: no install, no build.

Controls (phone): joystick to move · drag the screen to look around · Attack, Jump, Dodge and four spell buttons on the right · Talk near a person · online pill to chat.

Controls (keyboard and mouse): W A S D move · drag to look · Space jump · Shift dodge · F or click a creature to attack · 1–4 spells · E talk · T chat · M journal · B build in Thorngate · wheel zoom.

Play online: **https://soladelvaux.github.io/erandel/**. Everyone who has that page open at the same time shares one world (peer-to-peer, no server). The published claude.ai page has its own separate shared world.

## What's in the repo

| Path | What |
|---|---|
| `src/index.html` | The whole game |
| `design/gdd/` | Game concept, systems index, 14 system design docs, cross-review |
| `design/balance/` | Balance check reports |
| `design/art/art-bible.md` | The cozy night-diorama look |
| `design/ux/`, `design/accessibility-requirements.md` | Interaction patterns and accessibility |
| `docs/architecture/` | Architecture, ADR-0001, control manifest, architecture review |
| `tests/` | Automated tests (`npm install && npm test`, `npm run test:browser`) |
| `production/qa/evidence/` | Screenshots from the browser test |
| `.claude/` | The studio: agents, skills, hooks, rules |

## Working on it with Claude Code

Open this folder in Claude Code and type `/help` to see the next step. Useful skills: `/balance-check`, `/create-epics`, `/sprint-plan`, `/design-review design/gdd/<system>.md`, `/team-qa`. Do not run `/setup-engine`: Erandel is a web game and the template's engine setting only supports Godot, Unity and Unreal.

## Status

v0.4.0 · stage: Pre-Production. Third-person action combat, climbing and live multiplayer added (`design/gdd/action-combat.md`, `design/gdd/multiplayer.md`). Design docs complete; economy balance check done (`design/balance/`). Next: `/create-epics` and a first sprint for 1.0.
