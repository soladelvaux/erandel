# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 49 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

- **Engine**: Web browser, three.js r151 as ES modules from jsDelivr (import map in `src/ui/shell/body.html`, loaded by `loadThree()` in `src/core/start.js`) + UnrealBloomPass from `three@0.151.0/examples/jsm` (r128 until milestone C1; plan: `docs/architecture/adr-0002-modernise-threejs.md`, log: `docs/architecture/migration-log.md`)
- **Language**: JavaScript (ES2019), HTML, CSS — one self-contained page
- **Code root**: `src/` — the game is the module files under `src/`, joined in the order of `src/manifest.json` by `node tools/build.js` into `src/index.html` (generated; never edit it by hand). Module map: `docs/architecture/architecture.md` › Layers
- **Version Control**: Git with trunk-based development
- **Build System**: `node tools/build.js` (joins the modules, writes `src/index.html` and `dist/`); open `src/index.html` in a browser; production is the public site, the claude.ai Artifact is the dev preview
- **Asset Pipeline**: none — all art is generated in code (3D primitives, canvas textures); no external assets
- **Tests**: Node — `tests/` (jsdom engine playthrough, puppeteer-core real-browser smoke test, market simulation). Run `npm install` then `npm test` inside `tests/`

> **Engine note**: `engine.name` in `project.yaml` only accepts Godot, Unity or Unreal,
> so it is intentionally left unset. Skills will report the engine as not configured
> and skip engine-specialist reviews; treat `lead-programmer` and
> `gameplay-programmer` as the code owners. Never run `/setup-engine` on this project.
>
> **Look**: cozy 3D night diorama — chibi characters, warm lanterns with bloom, dark
> reflective water, tilt-shift. See `design/art/art-bible.md`. The design docs in
> `design/gdd/` were reverse-documented from the working game.

## Project Structure

@.claude/docs/directory-structure.md

## Engine Version Reference

<!-- ENGINE-REFERENCE-IMPORT: the line below is engine-specific. /setup-engine
     rewrites it to @docs/engine-reference/<engine>/VERSION.md for the chosen
     engine, so a Unity or Unreal project stops loading the Godot reference every
     session. It defaults to Godot (the template's example engine); skills that
     need the pinned version read docs/engine-reference/<engine>/VERSION.md on
     demand regardless of this import. -->
Erandel does not use Godot, Unity or Unreal, so no engine reference is imported.
The pinned stack is three.js r128 (see Technology Stack above and
docs/architecture/adr-0001-single-file-web.md).


## Technical Preferences

`project.yaml` at the repo root is the primary config store — engine, specialists,
naming, platform, performance, modes. Skills resolve it via `resolve_config`
(see `.claude/docs/config-resolution.md`).

`.claude/docs/technical-preferences.md` is the **legacy fallback**, read on demand
when a key is absent from `project.yaml`. It is not imported here: before
`/setup-engine` runs it is almost entirely `[TO BE CONFIGURED]` placeholders, and
after it runs `project.yaml` holds the real values.

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
  (exempt: `active.md` appends, agent memory, a subagent's new file at the path
  its orchestrating skill named; see `.claude/rules/agent-memory.md`)
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction
- A skipped or dismissed question is not an answer: act on nothing, re-ask in
  plain text and wait
- Started outside this file's folder? Warn first: hooks, deny rules and the
  ask-first mode load only when Claude Code starts here

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/start` to begin the guided onboarding flow.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

Read `.claude/docs/context-management.md` on demand — it is a reference, not
session context. Two of its conventions are load-bearing and cited by name
elsewhere in the repo, so they are restated here rather than lost:

- **`production/session-state/active.md` is the session checkpoint.** The file is
  the memory, not the conversation. Read it first after any compaction, crash, or
  `/clear`.
- **Helpers in `.claude/scripts/` emit observations, never verdicts.** A script
  that scores or judges will eventually contradict a mode or override it cannot
  see. (Cited by `artifact-check.sh` and `adr-dep-graph.sh`.)
