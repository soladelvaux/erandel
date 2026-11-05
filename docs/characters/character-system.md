# Character and animation system (Phase 4)

**Status**: v1 built and tested, 2026-11-05 · **Owner**: Sola · **Art direction**: `ERANDEL_ART_BIBLE.md` §6 (characters), §7 (creatures), §15 (animation) · **Code**: `src/entities/rigged.js` · **Assets**: `tools/assets/author-characters.mjs` (`npm run characters` in `tools/assets/`)

## What changed for the player

The player is now a **rigged anime adventurer** instead of the chibi, following art bible decision D1 (chibi retired). Movement, combat, skills, climbing, progression and saves are unchanged. The animation reads the state the game already keeps and never drives it.

| | Chibi (before) | Adventurer (now) |
|---|---|---|
| Proportions | head ≈ half the body | 6.3 heads, 1.9 m (1.7 m model scaled by 1.12 so it holds the frame like the chibi did) |
| Build | 18 primitive meshes, posed by code | one skinned model: 24 bones, 9 visible draw calls, 5.2k triangles |
| Look | flat colours | painted vertex colour, rim light, painted face texture (eyes with iris gradient and two highlights, lashes, brows, mouth, blush), blinking |
| Clothing and gear | robe | tunic with flared skirt, mantle on its own 3-bone chain, belt and buckle, satchel, leather pauldron, gloves, knee boots, sword |
| Hair | sphere | clumped hair cap with an anime hairline, bangs, side locks, back locks on a sway bone |
| Kind | colours | hair, skin, clothing and eye colours from the kind; elves and fae get long ears; supernatural kinds keep glowing eyes |

**Not yet per kind:** wings, tails, horns, fins and large bodies (art bible §6.5). Every kind uses the adventurer body with its colours and ears for now.

## Clips and the state machine

| Clip | Length (authored) | Plays when (game state) | Timing |
|---|---|---|---|
| idle | 3.0 s loop | standing | breathing, mantle and hair sway, blinks every 2.5–5 s |
| walk | 1.0 s loop | ground speed 0.35–3.6 m/s (phone stick pushed partway, or hold **C**) | timeScale = speed / 1.7 m/s |
| run | 0.62 s loop | ground speed above 3.6 m/s | timeScale = speed / 7 m/s (the game's run speed) |
| jump | 0.72 s, holds | `!p.ground` | matches the game's 0.72 s airtime |
| dodge | 0.5 s | `p.dodgeT > 0` | scaled to the game's 0.28 s dodge |
| attack | 0.45 s | `p.atkAnim > 0` | ×1.25, so the slash fits between the game's 0.55 s cooldowns |
| cast | 0.5 s | `p.castAnim > 0` (skills) | — |
| hit | 0.35 s | `p.hitT > 0`, set in `damagePlayer` | — |
| interact | 1.4 s | `doAction()`, or a conversation starting | — |
| death | 1.6 s, holds | `p.downT > 0`, set in `playerDown` | the existing return to the Thorngate waits 1.8 s, so the fall can be seen |
| climb | 0.8 s loop | `p.climb` | slows to a quarter when not moving |

**Priority:** death > dodge > attack > cast > hit > climb > jump > run > walk > interact > idle.

- **Blending:** every switch is a cross-fade (0.05 s into one-shots, 0.16–0.2 s between locomotion clips).
- **Sync:** the ground speed is measured from the player's real displacement, so the feet follow the movement code. A teleport (more than 3 m in one frame) resets the measure instead of playing a run.
- **Responsiveness:** attack and dodge show on the very next frame.

## Creatures (registry section 5; both rows stay PROVISIONAL)

| Creature | Role | Model | Clips | Behaviour |
|---|---|---|---|---|
| **Thornback Boar** (B5) | hostile, Erelian's existing creature | quadruped, 18 bones, 1.3k triangles, bristled mane, tusks, hump | idle, walk, run, attack (head-down charge), hit, death | **The existing creature AI is unchanged.** The model follows it: wander → walk, chase → run, windup → charge (timed so the hit lands when the AI strikes), struck → hit, killed → the death clip plays, then the body hides as before |
| **Lunar Stag** (B20) | **neutral wildlife in Erelian, chosen by Sola 2026-11-05.** This role is PROVISIONAL (registry B20 note) | quadruped, 18 bones, 1.3k triangles, pale coat, softly glowing silver antlers | idle (grazes), walk, run (gallop), attack, hit, death | 3 stags graze and wander near their homes and flee from anyone within 7 m. They are never a combat target. Their Moonwell entry in the creature list is unchanged |

## Files

| File | Size | |
|---|---|---|
| `assets/game/all/chr_all_adventurer.glb` | 136 KB | skinned, 11 clips, face texture embedded |
| `assets/game/erelian/cre_erelian_thornback-boar.glb` | 36 KB | skinned, 6 clips |
| `assets/game/erelian/cre_erelian_lunar-stag.glb` | 35 KB | skinned, 6 clips |
| `assets/source/all/tex_chr_face.png` | — | the painted face texture (master) |

All three are meshopt-compressed. They are v1 assets: a hand-made or AI-assisted model can replace any of them if it keeps the bone names and clip names (the art bible pipeline, §2.3). Loading starts 0.25 s after the world is built. If a file fails, the chibi or the primitive creature stays (`?chars=off` forces that).

## Acceptance test (`tests/integration/characters.js`, `npm run test:chars`)

It drives every state through the game's own functions and controls, checks the cross-fade weights mid-switch, checks that walk and run play at the measured ground speed, checks the creatures against their AI, and checks that falling still returns the player to the Thorngate. Evidence: `production/qa/evidence/characters/`.

## Defects found while testing, and fixed

| Found by | Defect | Fix |
|---|---|---|
| The acceptance test (attack showed as "dodge") | My first walk control used Shift, which is already the dodge key, and the game only tracks movement keys | Walk is a held **C** |
| The acceptance test (the player stayed where they fell) | Delaying the return to the Thorngate let the 1.5 s autosave overwrite its destination | The autosave keeps a pending move's destination |
| The acceptance test (idle read as walk after a teleport) | A teleport looked like a burst of speed | More than 3 m in one frame resets the speed measure |
| The acceptance test (interact never ended) | Interact retriggered on every dialog object | It fires only when a conversation starts |
| Viewing the face | Face texture coordinates were dropped in the merge; the decals sat inside the head; the hair cap covered the eyes; the skin shaded in stripes | Coordinates kept; decals follow the head surface; anime hairline above the brows; parts welded before smooth normals |
