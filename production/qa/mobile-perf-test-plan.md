# Real-device mobile performance test plan

**Purpose**: measure Erandel on real phones. The lab numbers in `baseline/BASELINE-v0.4.1.md` come from software rendering, so they show draw calls and triangles but not real frame rates.
**When**: once on the current version (the baseline), then after each migration milestone that touches rendering.
**Who**: Sola, on his own phone(s). It takes about 10 minutes per phone.

## What you need

- Your phone, charged above 50%, not in power-saving mode.
- Wi-Fi.
- A screenshot for each step. That is all the recording needed.

## Steps

1. Close other apps. Let the phone rest for 1 minute so it is not warm.
2. Open this address in the phone's normal browser (Chrome on Android, Safari on iPhone):
   **https://soladelvaux.github.io/erandel/?perf**
3. Tap **Be reborn**, and close Aelarion's welcome by tapping it.
4. A green box appears at the top left. It shows the frames per second (fps), the frame time, the draw calls, the land, the screen size and the GPU name. Under it are buttons **1 Spawn**, **2 Gate**, **3 Plot**, **4 Erelian**, **5 Cindral**, **6 Deep**, **7 Veilmoor** and **Night: off**.
5. Tap **1 Spawn**. Do not touch the screen for 10 seconds, then take a screenshot.
6. Repeat step 5 for buttons **2** to **7**.
7. Tap **Night: off** so it says **Night: on**. Repeat step 5 for **2 Gate**, **3 Plot** and **7 Veilmoor**.
8. Tap the gear icon and set **Glow: Off**. Repeat step 5 for **7 Veilmoor** only.
9. Walk around Thorngate with the stick for 30 seconds, then take one more screenshot. The "worst" number in the box shows the slowest frame.
10. Send the screenshots to Claude, together with the phone model (for example "Samsung A54" or "iPhone 13").

The buttons only move your character and change the lighting for the test. Your gold, day and items are not changed. Creatures leave you alone for 60 seconds after each jump.

## What Claude records from each screenshot

| Field | From |
|---|---|
| Phone model | Your message |
| GPU | Last line of the box |
| Screen and pixel ratio | Third line |
| Spot, day or night, glow on or off | The button tapped |
| fps and average frame time | First line |
| Worst frame | First line |
| Draw calls and triangles | Second line |

The results go into `production/qa/device-results.md`, one table per phone and per version.

## Targets (proposed, to confirm after the first real-device run)

| Measure | Phone | Desktop |
|---|---|---|
| Average fps at every spot | 30 or more | 60 |
| Worst frame while walking | under 50 ms | under 25 ms |
| Draw calls at every spot | under 250 | under 400 |

The draw-call targets apply once milestone G is done. Today's peak is 396 on phone and 862 on desktop.
