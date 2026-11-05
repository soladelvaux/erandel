# Living world (Phase 5)

**Status**: v1 built and tested, 2026-11-05 · **Owner**: Sola · **Data**: `src/data/living-world.js` · **Code**: `src/world/living-world.js`, habits in `src/entities/creature-ai.js` · **Lore**: every schedule, line, habit, event and discovery is PROVISIONAL (`ERANDEL_LORE_REGISTRY.md` section 12, LW1–LW5)

## Design rule: the deed-based day stays

Erandel's day is measured in deeds: morning, afternoon and night end when you act, and a new day comes when you sleep. That rule is the game's progression, so **it is unchanged**. The world clock lives inside it:

- Each part of the day has hours: morning 06:00–12:00, afternoon 12:00–18:00, night 18:00–06:00.
- Inside a part, time flows at **45 real seconds per game hour**.
- The clock **waits at the end of the part** until you act; a deed or sleep moves it to the next part's start.
- The HUD shows the hour next to the part of the day.
- The light follows the hour: dawn (05:00–07:00), full day, late-afternoon gold, dusk (16:30–19:00), night. It is blended from the game's own three palettes, so nothing changes colour that did not before.

## 1. World clock

| Data | Value |
|---|---|
| `CLOCK.secPerHour` | 45 |
| `CLOCK.slots` | [6,12], [12,18], [18,30] (hours past 24 are the night) |

**Time-dependent events** read the hour (section 5).

## 2. Weather

- **Weather is still rolled at dawn** (the gameplay truth: gains, kinds' weaknesses).
- **Transitions:** rain and snow particles fade in and out over about 3 s instead of switching. The fog, light and sky already ease toward each weather; that stays.
- **Wind** by weather (`WIND`): clear 0.35, heat 0.2, fog 0.12, snow 0.55, rain 0.75, storm 1.35. It sets how hard grass, leaves, bushes and trees sway (the shared `uWind` uniform in the painted materials).
- **Rain** darkens the air (fog luminance 0.70 in rain against 0.81 clear in the test).

## 3. NPC behaviour

**Schedules** (`SCHEDULES`): `[fromHour, toHour, activity, point or route]`.

| NPC | Day |
|---|---|
| Elash (Erelian) | 06–10 tends the hero tree · 10–14 walks the groves · 14–17 rests · 17–20 walks over the old bridge · 20–06 sleeps by the spires |
| Ysolde (Thorngate) | 06–11 at the inn door · 11–15 market walk · 15–19 at the inn · 19–06 serves the night crowd |
| Queen Maren | keeps her court all day |
| Aelarion | never scheduled; the gatekeeper stays at the gate (canon C1) |
| Everyone else | works near home, walks a short loop at midday, rests at night (`SCHEDULE_DEFAULT`) |

- A position is a **pure function of the hour**, so every simulation level agrees, and a reload puts everyone back where they belong.
- **Activities** show as poses: kneeling to tend, sitting to rest, head down asleep, an arm at work.
- An NPC faces you when you come within 6 m (not while asleep).
- **Walking routes** loop as often as the window allows at 1.3 m/s. They avoid water, but the bridge is allowed.

**Simulation levels** (`SIM_LEVELS`):

| Distance to the player | Level | What runs |
|---|---|---|
| under 35 m | full | walks along the route every frame, walk animation, activity pose, faces you |
| 35–90 m | simplified | moves straight to the scheduled point twice a second, no animation |
| over 90 m | distant | the schedule is applied every 5 s; **the model is hidden** (fewer draw calls) |

**Dialogue, reactions and memory:**

- When you talk to an NPC, a line is chosen from `NPC_LINES`: the first whose condition holds. Elash has 11 lines, Ysolde 8. Everyone else gets a narration of what they are doing (`NPC_NARRATION`), so no speech is invented for them.
- **Conditions:**
  - first meeting;
  - you hunted two or more creatures in their region today;
  - your Corruption or Fate is high;
  - you helped them in the last 3 days;
  - you have been away for 3 days or more;
  - you fell today;
  - the weather;
  - their current activity and the hour.
- **Memory:** each NPC already kept your reputation, memories, help and gifts (`S.npcs[id]`). Phase 5 adds the day you first met, the day you last met and how many times you have talked.

## 4. Creature behaviour

The existing AI is kept: wander, chase (hunt), windup and strike (attack), recover, return home. Habits (`HABITS`) add:

| Behaviour | Rule |
|---|---|
| **Rest** | Day creatures (Thornback Boar, Frost Wolf, Reef Shark, Ash Drake Whelp, Storm Roc, Gale Harpy) rest at night. Night creatures (the wisps, wraiths, shades, ghouls, Drowned Sailor, Cutpurse Gang, Lunar Stag, Moon Moth Swarm) rest by day. A resting creature goes home and lies down (new `rest` clip for the rigged boar and stag). It does not hunt, unless you strike it or come within 2.5 m |
| **Idle** | A wandering creature pauses 1.5–4.5 s when it reaches a spot |
| **Wander** | as before |
| **Patrol** | Storm Roc, Gale Harpy, Cutpurse Gang, Fallen Templar, Cave Golem walk a 6 m loop around home. A waypoint they may not use (another region, your plot) is skipped |
| **Hunt / Attack** | as before |
| **Flee** | Beasts with `flee` run from you for 3.5 s when below 25% health, then go home |

## 5. World events and discoveries

| Event | When | Built on |
|---|---|---|
| Soul-lights drift from the Thorngate toward the Veilmoor | night 20:00–05:00, near the gate | W2 (canon), A4 |
| Lamps wake on Erelian's spires | dusk 18:00–22:00 in Erelian | L3, L11–L14 |
| A Lunar Stag stops and watches you | dusk 17:00–21:00 in Erelian, sometimes | B20 |
| The moon rises in Caelithra's Moonwell | night 21:00–04:00 at the Moonwell | L10 |

Each event shows a one-line toast and enters the chronicle the first time; later times are counted.

**Discoveries** (Erelian), found by standing near them and kept for good:
- the springs that feed the falls;
- the old stone bridge;
- the ruins whose builders no one can name.

None of them gives a reward. They only enter the journal and the chronicle, so the economy is unchanged.

## 6. Persistence

Everything lives in the existing single save (`S`), so there is still one file to back up:

| Kept | Where |
|---|---|
| Player progress | as before |
| Clock hour | `S.world.hour` |
| Weather | `S.weather` (as before) |
| Discoveries | `S.world.disc[id] = day found` |
| World events | `S.world.events[id] = {first, last, count}` |
| Hunting today, by region | `S.world.kills` |
| The day you fell | `S.world.fellDay` |
| NPC memory | `S.npcs[id]`: reputation, memories, help given, gifts (as before) + `met`, `lastDay`, `talks` |
| Completed tasks | NPC help is recorded per day (`S.npcs[id].helped`). Erandel has no quest log yet, and discoveries are the quest-like completions kept for good |

Old saves load: `worldDefaults()` adds the missing fields (the v0.4.1 save test passes).

## Acceptance test (`tests/integration/living-world.js`, `npm run test:world`, in CI)

| Part | Result (2026-11-05) |
|---|---|
| Clock | 11:30 + 11.25 s of game time = 11:45; waits at 11:59 for a deed; a deed starts the afternoon at 12:00; the light's night factor is 0.15 at 07:00, 0 at 13:00, 0.36 at 18:00 and 1 at 21:00 |
| Schedule | Elash tends the hero tree at 08:00, walks his bridge route at 18:30, sleeps by the spires at 22:00. Over 90 m away he is hidden and moved by schedule only; at middle distance he is simplified |
| Dialogue | First meeting, then a line for his activity, then a reaction after two of his grove's creatures were hunted; helping him is recorded |
| Weather | Rain fades in (51% after 2 s, 100% after 30 s), the particles show, the wind rises from 0.35 to 0.75, and the air darkens (fog luminance 0.70 against 0.81 clear) |
| Creatures | The boar rests at night and hunts by day; the wisp rests by day and hunts at night; a badly hurt boar flees (5 m to 10 m away); the Cutpurse Gang patrols its 6 m loop |
| Events | The soul-lights at the Thorngate at night (8 lights, recorded); the springs above the falls discovered |
| Persistence | After a reload: same day, hour (09:15) and weather (rain); discoveries and events kept; Elash's memory (3 talks) and the help you gave kept; Elash is back at the hero tree at 09:15; he does not greet you as a stranger |

Evidence: `production/qa/evidence/living-world/`.

## Defects found while testing, and fixed

| Defect | Fix |
|---|---|
| A patrol waypoint that fell on the player's plot sent the Cutpurse Gang home instead of on its loop | A patrol skips a waypoint it may not use |
| (test) Changing the part of the day without moving the clock with it restarted the morning at 06:00 | The test sets the clock with the part of the day; in play, deeds always move both together |
