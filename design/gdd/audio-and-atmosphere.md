# Audio and Atmosphere — Design Document

---
**Status**: Reverse-Documented
**Source**: `src/index.html` (`TRACKS`, `MUS`, `mInit`, `mSched`, `mVoice`, `mPad`, `LIGHT`, `loop` lighting, glows, bloom, weather particles, tilt-shift CSS)
**Date**: 2026-11-03
**Verified By**: pending review
**Implementation Status**: Fully implemented (no sound effects yet)
---

## Overview

The mood layer: procedural ambient music, light that changes with time of day and weather, glowing lanterns with bloom, rain and snow, fog, fireflies, Veilmoor wisps, Erelian butterflies, tilt-shift blur and vignette.

## Player Fantasy

"I keep it open just to sit by the lanterns." Erandel should feel like a lofi evening.

## Detailed Rules

**Music**: three generated tracks: "Calm" (Thorngate at dusk, major pentatonic, 64 BPM, triangle plucks), "Lantern Night" (minor pentatonic, 56 BPM, sine), "White Boughs" (major with a 7th, 74 BPM, sine). Each has a slow pad chord every 32 eighth notes, a low bass note, a wandering melody with rests, and occasional high sparkles, all through a generated reverb. It starts only when the player taps play (browsers block autoplay). Prev/next switch tracks.

**Light presets** (lerped each frame):

| Time | Sky / ground | Sun | Fog | Night factor |
|---|---|---|---|---|
| Morning | warm cream / green | warm, 0.95 | sandy | 0.15 |
| Afternoon | pale blue / green | white, 1.05 | sky blue | 0 |
| Night | dusky violet / dark brown | moonlight, 0.26 | amber-brown haze | 1 |

Rain/storm darken the light and add 0.25 night factor; storms flash; fog shortens view distance; snow brightens fog.

**Lanterns**: a pool of point lights (4 on phones, 8 on desktop) moves every 0.3 s to the light sources nearest the camera; glow sprites brighten at night; floating lanterns and moon wells pulse; house windows light up at night; Runekar's Deep counts as half-night.

**Bloom**: on by default (Settings → Glow). Strength and threshold follow the night factor so daylight and snow do not wash out.

## Formulas

- Point light intensity target = `strength × 1.15 × nightFactor`, distance 13, decay 2.
- Bloom strength = `0.15 + 0.55 × min(1, nightFactor)`; threshold = `0.96 − 0.12 × min(1, nightFactor)`.
- Music step length = `60 / BPM / 2` seconds; master volume = `0.5 × volume setting`.

## Edge Cases

- Browsers without Web Audio show "Music is not available in this browser."
- Bloom scripts missing (blocked CDN): the game renders without bloom.
- Reduced-motion users: banners, flash and fade do not animate.

## Dependencies

- **Reads**: [World and Regions](world-and-regions.md) (time, weather, land), [Building](building.md) (item lights), [Interface and Controls](interface-and-controls.md) (music buttons, settings).
- **Used by**: none (presentation only).

## Tuning Knobs

| Knob | Current | Safe range | Affects |
|---|---|---|---|
| Point lights | 4 phone / 8 desktop | 2–12 | Look vs performance |
| Light intensity factor | 1.15 | 0.8–1.6 | Glare risk |
| Bloom max strength | 0.7 | 0.3–1 | Glow intensity |
| Music tempo | 56–74 BPM | 50–90 | Calmness |

## Acceptance Criteria

1. Tapping play starts music; pause stops it; next changes the track name.
2. At Night, lanterns and the plot glow visibly without white blow-out (screenshot check).
3. Turning Glow off removes bloom immediately.
4. Rain shows falling particles; snow in Hrimwold drifts.
