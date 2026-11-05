# Art Bible: Erandel

---
**Status**: Reverse-Documented from v0.3.0 · **Date**: 2026-11-03 · **Owner**: Sola
---

## 1. Visual Identity Statement

A cozy 3D fantasy world of small chibi people, lantern-lit at night, glowing warm against dark water. Mythic, gentle, never grim.

**Since v0.4.0 (third-person)**: the world is seen from close behind the player, like a third-person action game, at the creator's request (reference: a hand-painted cliff-climbing game made with three.js). The ground is painted, not flat colour: brushed grass on level ground and streaked stone on slopes, chosen per pixel by slope. Ten rock crags give cliffs to climb. Bloom is reserved for night and for spells; daylight stays crisp. Trees and landmarks between the camera and the player dissolve with a dither. Build mode keeps the original overhead diorama view.

## 2. Mood & Atmosphere

- **Night (signature)**: amber-brown haze, dusky violet sky light, warm lantern pools, glowing floating lanterns, fireflies.
- **Morning**: warm cream light, soft. **Afternoon**: clear and bright, pale blue fog.
- **Veilmoor**: blue-white wisps in fog, graves, dead trees: quiet, not scary.
- Tilt-shift blur at the top and bottom of the screen and a soft vignette make it read as a miniature.

## 3. Shape Language

- Characters: round. Big sphere heads (about half the height), small cone bodies, stubby limbs.
- Nature: low-poly, faceted, flat-shaded icosahedron canopies, stacked cones for pines.
- Architecture: simple boxes, four-sided cone roofs, round posts, clean silhouettes.
- Light sources are simple glowing boxes and spheres, always with a soft glow sprite.

## 4. Color System

| Role | Colour | Use |
|---|---|---|
| Lantern warm | #ffc870 / #ffd08a | point lights, lamps, paper lanterns |
| Gold UI | #d9aa52 | frames, selected states, title text |
| Night ink | #11131b | UI panels |
| Parchment text | #ebe4d1 | UI text |
| Fate | #7fc3e4 | Fate bar, good events |
| Corruption | #c65f86 | Corruption bar, dark deeds |
| HP | #d4735f | HP bar, warnings |
| Torii red | #b8322a | gates |
| Water night | #18303e | pond and river at night |

Each element has a signature colour used for chips, robes and creatures (Fire #e8613f, Water #4fa3dc, Nature #71bf6c, Moon #c9cde3, and so on).

## 5. Character Design Direction

- Every kind is readable at phone size by one or two features: elf ears, horns, wings, tails, a beard, a crown, a hood, a hat.
- Robe colour follows the kind's home element. Glowing eyes mark supernatural kinds (Vampires red, Shades cyan, Liches violet).
- Named people have a fixed look: Aelarion (pale-gold hair, green robe with gold trim, staff with green light), Runekar (short, red beard, rune hammer), Queen Maren (teal hair, gold crown).
- Blob shadow under every character.

## 6. Environment Design Language

- Each land has one colour identity and one prop family: Thorngate (oaks, thorn bushes, bamboo, string lights), Erelian (white-trunk trees, white spires with green tops, butterflies), Hrimwold (snow pines, ice spikes, domes), Cindral (ash pillars, glowing vents), Veilmoor (dead trees, graves, wisps), Moonwell (crystals, glowing pool), Runekar's Deep (rock, crystals, forge-lit cave mouth), Mere (coral, sunken pillar court).
- The player's plot follows the night-market style: wooden boardwalks on piles over a dark pond, lily pads with pink lotus, floating lanterns.

## 7. UI/HUD Visual Direction

- Dark translucent panels with thin gold borders; rounded pills for counters and the market button.
- Fonts: Grenze Gotisch (display), Alegreya Sans (body), IBM Plex Mono (labels and numbers).
- JRPG dialog box: double gold frame, portrait on the left, ▸ choices.
- Line icons (stroke 1.8) for tools: hammer, camera, moon, book, gear.

## 8. Asset Standards

- No external assets. All geometry is three.js primitives; textures are generated on canvases (glow, coin bubble).
- Repeated props must use InstancedMesh with a full-size instance colour buffer.
- Glow sprites: additive, no depth write, small (≤ 2.2 units for item lights).
- Keep total point lights ≤ 8; materials and geometries cached.

## 9. Reference Direction

- Cozy night-market diorama builders (warm lantern isometric scenes, chibi customers queueing at stalls).
- The creator's Aelarion artwork (`src/index.html` embeds it as the threshold image and dialog portrait).
- Classic JRPG dialog and region banners.
