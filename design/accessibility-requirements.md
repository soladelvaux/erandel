# Accessibility Requirements: Erandel

**Target**: standard · **Date**: 2026-11-03 · **Status**: current state recorded from v0.3.0, gaps listed

## Requirements and current state

| # | Requirement | Current state | Gap |
|---|---|---|---|
| A1 | All actions reachable by touch and by keyboard | Joystick, tap-to-walk, on-screen buttons; WASD/arrows, E, M, B, R, Esc | Journal and catalog need Tab navigation testing |
| A2 | Visible keyboard focus | Gold focus outline on all buttons | — |
| A3 | Icon buttons have text labels for screen readers | `aria-label` on tools, music, settings, joystick | Canvas world itself is not described |
| A4 | Text contrast ≥ 4.5:1 on panels | Parchment #ebe4d1 on night ink #11131b panels | Muted grey labels at small sizes need checking |
| A5 | Respect reduced motion | Banners, flash and fade do not animate with `prefers-reduced-motion` | Camera lerp and bobbing still move |
| A6 | No information by colour alone | Bars have numbers; conditions are named chips; build highlight is green/red | Add an icon or text to the build highlight (allowed / not allowed) |
| A7 | Audio is never required | Music optional; all feedback is text | — |
| A8 | Glare and flashing | Battle flash is a single 0.5 s white fade; storms flash rarely | Add a setting to disable flashes |
| A9 | Performance option | Glow toggle; tilt-shift toggle | Add a "low quality" preset |
| A10 | Readable text size on phones | 16 px body, 0.72–0.85 rem labels | Labels under 12 px on phones should grow |

## Next

Address A6, A8 and A10 in the next UI pass; verify A4 with a contrast checker.
