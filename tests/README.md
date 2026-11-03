# Erandel tests

Run from this folder:

```
npm install
npm test               # unit rules + seeded playthrough of all 36 kinds (jsdom, no browser needed)
npm run test:browser   # real headless Chrome smoke test; saves screenshots to production/qa/evidence/
```

| Suite | File | What it proves |
|---|---|---|
| Unit | `unit/engine/engine-rules.test.js` | Rules from the GDD acceptance criteria: stats, actions, survival, diets, evolution, elements, people, companions, building, market |
| Integration | `integration/playthrough.test.js` | Every kind plays 25 seeded days pressing every kind of button with no errors, no broken numbers, nothing "undefined" on screen |
| Integration (visual) | `integration/browser-smoke.js` | The 3D world starts, the market completes, and screenshots of each key screen are retained as evidence |

Notes:
- jsdom has no WebGL, so `npm test` exercises the 2D fallback, which runs the same engine rules.
- Headless Chrome uses software WebGL at ~5 fps, so the browser test drives time-based systems (customers) by calling their update functions directly.
- `CHROME=/path/to/chrome npm run test:browser` if Chrome is not at `/usr/bin/google-chrome`.
