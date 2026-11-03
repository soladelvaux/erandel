# Interaction Pattern Library: Erandel

**Date**: 2026-11-03 · **Source**: v0.3.0 UI

| Pattern | Where | Behaviour | Rules |
|---|---|---|---|
| Joystick | bottom left | Drag to move; release stops | Lives outside the re-rendered UI so touches survive re-renders |
| Tap to walk | world | Tap ground: walk there; any joystick or key input cancels | Not active while a dialog, journal, build or photo mode is open |
| Contextual Talk | bottom right | Button names the nearest person within ~3.5 units; disabled when none | E / Enter / Space does the same |
| JRPG dialog | bottom | Portrait, name, text, ▸ choices; disabled choices stay visible with the reason | Every choice that costs an action says so ("· 1 action") |
| Confirm before big moments | Sleep | Moon icon opens a dialog warning about unused actions and hunger | Destructive or day-ending actions always confirm |
| Pill action | top centre | Open/Close night market; shows live sales | Only shown where it can be used (Thorngate) |
| Counters | top centre | Gold, wood, stone with icons | Update on every change |
| Tool column | left | Build, Photo, Sleep | Build dims outside Thorngate and explains why on tap |
| Journal | book icon / M | Full-screen tabs; scrollable; "Back to the world" | Tabs: Act, Self, Magic, World, Chronicle |
| Build catalog | bottom in build mode | Horizontal cards with cost, ambience, sells; unaffordable cards dim | Tap a card to select; Remove and Rotate toggles; ✓ exits |
| Tile placement | build mode | Tap tile to place; drag pans; pinch zooms; ghost preview on hover (desktop) | Green = allowed, red = not; errors explain the rule |
| Toast | below top HUD | Short message for 3.2 s | Errors say what went wrong and how to fix it |
| Banner | upper third | "Now entering" + land + tagline for 3.2 s | Hidden in journal, build and photo modes |
| Photo mode | camera icon | Hides all UI; tap anywhere to return | Esc also returns |
