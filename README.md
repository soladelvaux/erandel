# Erandel

A cozy 3D open-world JRPG. Be reborn at the Thorngate as one of 36 kinds, live a life that decides what you become, and light up your own lantern plot for a night market.

Built by **Sola** with Claude, using the [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) template (49 role agents, 74 workflow skills). The template's own README is in [`docs/template-README.md`](docs/template-README.md).

## Play

Open `src/index.html` in a browser (phone or desktop). Everything is in that one file: no install, no build.

Controls: joystick or tap the ground to walk · Talk button or E · book icon or M for the journal · hammer or B to build in Thorngate · pinch or mouse wheel to zoom.

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

v0.3.1 · stage: Pre-Production. Design docs complete; economy balance check done (`design/balance/`). Next: `/create-epics` and a first sprint for 1.0.
