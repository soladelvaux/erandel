# ERANDEL ART BIBLE

**Owner**: Sola · **Version**: 1.1 (Sola's decisions D1–D6 applied) · **Date**: 2026-11-05
**Authority**: every future asset, shader, effect and screen is judged against this file.
**Supersedes**: `design/art/art-bible.md` (v0.3 "cozy chibi diorama"). That file stays as the record of the current build's look until the visual transformation ships.
**Lore boundary**: this bible decides how things *look*. It does not decide what is true in Erandel. Every name, place and culture here comes from `ERANDEL_LORE_REGISTRY.md` and keeps its category there. Where this bible gives a region a look, that look is an art-direction choice, marked **[visual direction]**. It adds no history, faction or event to the lore.

---

## How to use this file

| You are making | Read |
|---|---|
| Any asset at all | §1 Vision, §2 Reference workflow, §17 Quality standards |
| A character or a kind (every kind is a playable main character) | §4 Palette, §5 Lighting, §6 Characters, §15 Animation |
| A creature | §7 Creatures, §13 VFX |
| A building or a prop | §8 Architecture, §12 the region's sheet |
| Ground, rock, trees or water | §9 Forest, §10 Terrain, §11 Water and materials |
| A spell or an effect | §13 Magic and VFX |
| A screen or a HUD element | §14 UI |
| A file to hand to the engine | §16 Technical rules and naming, §17 Quality standards |

Rules marked **MUST** are gates: an asset that breaks one is sent back. Rules marked **SHOULD** are the default; break one only with a reason written in the asset's review note.

---

## 1. Vision

### 1.1 One sentence

**Erandel is a painterly anime fantasy world in real-time 3D: an ancient, living land where every forest, ruin and river looks hand-painted, lit like a film still, and inhabited by stylized anime heroes of 36 kinds.**

### 1.2 The look in three references

| Ref | What it is | What we take from it | What we do NOT take |
|---|---|---|---|
| **R1** | Sola's Aelarion Silverbough artwork, embedded in the game (`src/data/aelarion-portrait.js`; the canon character C1 in the registry) | The master reference for Erandel's look: painterly anime rendering, layered atmospheric depth, overgrown pale-stone spires, turquoise water, white butterflies, green rune-circle magic, warm lantern accents against cool green shadow | Nothing is excluded. Where R1 and any other reference disagree, R1 wins |
| **R2** | The painterly three.js cliff-climbing game Sola shared (made with Flux, GPT Image, Tripo, Blender and three.js) | Proof the look runs in a browser: hand-painted textures on real 3D forms, a close third-person camera, big readable cliffs, soft stylized lighting | Its characters, world, palette and specific assets. It is a technique reference, never a source to copy |
| **R3** | The current game (v0.4.1 screenshots, `production/qa/evidence/`) | What already works and stays: night lantern warmth with bloom, the painted slope-aware ground, the dissolving foreground, the night-market plot, readable kind silhouettes | Chibi proportions, primitive-shape props, flat untextured materials (see decision D1) |

**Decided (D2): Aelarion (R1) is Erandel's style reference.** Every asset is judged against R1. R2 is kept only as proof that the technique runs in a browser, and R3 only as a record of the current build. Neither sets the look. New references may be added later as R4, R5 and so on (§2.2), always below R1.

### 1.3 Art pillars

Each pillar is a test an asset passes or fails.

1. **Painted, not plastic.** Every surface reads as if a painter laid it in: visible brush direction, colour shifts within a material, soft edges where light turns. No glossy CG sheen, no uniform flat colour on a large surface.
2. **Ancient and alive.** The world is older than its people (registry V1, PROVISIONAL). Stone is worn and overgrown, trees are older than the buildings, and something is always growing, drifting or glowing.
3. **Light tells the feeling.** Every scene has one clear light idea (a shaft of morning sun, a lantern pool, moonlight on water) and the composition serves it.
4. **One world, many lands.** Each region has its own palette, shape and material family, all painted by the same hand under the same rules (§12).
5. **Readable at a glance.** On a phone screen, a player tells friend from foe, kind from kind and safe from dangerous in under a second, by silhouette and value first and by colour second.

---

## 2. Reference workflow and asset consistency

### 2.1 The rule

**Every asset starts from this bible and a named reference, and ends with a review against §17.** No asset enters the game, a video or a promotional image without a passed review note.

### 2.2 Reference board

References live in `design/art/references/` (created with the first asset brief), one image per file:
`R<number>_<subject>_<source>.<ext>`, for example `R1_aelarion-portrait_sola.jpg`. A table in `design/art/references/README.md` lists each one with the three columns from §1.2: what it is, what we take, what we don't take.

Rules:
- **MUST**: a reference from outside Erandel (another game, a film, a painting) is used for technique, light or mood only. Its characters, designs, logos or recognisable compositions are never reproduced.
- **MUST**: AI-generated images are concepts, not finished art, until they pass review. Their prompt and tool are recorded in the asset brief.
- **SHOULD**: each region gets at least three references before its first asset: one for light, one for shape, one for material.

### 2.3 The asset pipeline, step by step

| Step | Output | Who checks |
|---|---|---|
| 1. **Brief** | One page in `design/art/briefs/<asset-id>.md`: purpose, region, registry ids of any lore it shows, references, budgets from §16 | Creative Director (Claude) against this bible |
| 2. **Concept** | 2–4 painted or AI-generated concept images in the brief folder | Sola chooses one, or asks for another round |
| 3. **Blockout** | Grey mesh in the game at true scale, seen from the real gameplay camera | Silhouette and scale check (§17, criteria 1 and 2) |
| 4. **Model and texture** | glTF with painted textures (§16) | Material check (§11, §17 criterion 3) |
| 5. **In-engine review** | Screenshots in the target scene at day and night, desktop and phone, saved to `production/qa/evidence/art/<asset-id>/` | Full rubric (§17). Pass at 4.0 average, no criterion below 3 |
| 6. **Approval** | Review note in the brief: scores, date, Sola's yes | Sola |
| 7. **Lore check** | If the asset shows a named person, place or kind: its registry row is checked. A PROVISIONAL design is labelled "provisional look" in the brief | Narrative lead, against the registry |

AI tools (concept images, image-to-3D) may be used in steps 2 and 4. Their output is treated exactly like a human artist's draft: it passes the same review.

### 2.4 Consistency rules across regions

- **MUST**: one master material family (§11.1), one lighting model (§5) and one brush language (§10.2) for the whole world. A region changes palette, shapes and props, never the rendering style.
- **MUST NOT**: give a region its own art style: no cel-shaded region, no photoreal region, no pixel-art region, no "darker realistic" dungeon.
- **MUST**: a region's palette is drawn from the master palette (§4), shifted in hue and value, never replaced.

---

## 3. Global visual rules

Sola's eight rules, each turned into something a reviewer can check.

| # | Rule | How it is checked |
|---|---|---|
| V1 | Environment textures have a painterly quality | Albedo textures show brush strokes at gameplay distance. No photo-sourced textures. No tiling repeat visible within 3 tiles (§10.2) |
| V2 | Characters have consistent proportions and material treatment | Every character fits the proportion sheet (§6.2) and uses the character shader (§11.3). Tested by a line-up screenshot with Aelarion |
| V3 | Forests feel dense, ancient and magical | Every forest scene has 3+ depth layers, at least one ancient "hero tree", undergrowth and drifting life (§9) |
| V4 | Architecture reflects each region's history and culture | Each building uses its region's shape and material family (§12). Its story elements trace to registry rows, or are marked [visual direction] |
| V5 | Lighting creates emotional atmosphere | Each scene's lighting sheet names its mood and its one light idea (§5.3) |
| V6 | No generic plastic-looking surfaces | Specular is never white and sharp; roughness stays at or above 0.55 except for water, ice, crystal, wet stone and metal (§11.2) |
| V7 | Magic has a distinctive visual language | Every spell uses the rune-circle grammar and element colours (§13) |
| V8 | Every region has its own identity within one art direction | Each region has a filled sheet in §12, and a side-by-side screenshot of two regions still reads as one game |

---

## 4. Colour palette

### 4.1 Master palette (sampled from R1)

These values were measured from Sola's Aelarion artwork, not invented. They are the base every region shifts from.

| Role | Hex | From R1 | Use |
|---|---|---|---|
| Deep shadow green | `#212a23` | Robe, darkest folds | Darkest value in any daylight scene; never pure black |
| Forest shadow | `#334036` | Whole image, 22% | Shadowed foliage, deep forest floor |
| Moss mid | `#516152` | Whole image, 24% (the dominant colour) | Mid foliage, mossy stone in shade |
| Sage light | `#657c67` | Whole image | Lit foliage at distance |
| Lichen | `#91a283` | Whole image | Lit stone, far spires, haze-touched leaves |
| Mist pale | `#bbcca6` | Whole image | Atmospheric haze, distant silhouettes |
| Spire stone | `#acb8a5` / `#d0d9c5` | Far spires | Pale weathered stone (Erelian-style architecture) |
| Water shade | `#303f39` / `#5f746b` | River | Water in shade, before the turquoise accent |
| Water light | `#a5baaf` | River highlights | Reflected sky on water |
| Elven gold hair | `#a9b48b` / `#ced4ad` | Hair and face | Pale-gold hair (Aelarion); warm skin highlight |
| Magic green core | `#f1fbe5` | Orb centre | Hottest point of nature magic, almost white |
| Magic green glow | `#a5c89a` / `#c0e0b2` | Orb and staff | Nature magic glow and rune lines |
| Magic green deep | `#6f966d` / `#5f7b43` | Orb rim, staff | Outer falloff of nature magic |
| Lantern brass | `#8a8664` | Lantern frame | Old brass and bronze |
| Lantern light | `#d6cfa2` | Lantern glass | Warm lamp light (pushed warmer in-engine, §4.3) |
| Butterfly white | `#d3cfb2` | Butterflies | Drifting white life, petals, spirit motes |

**The R1 principle:** the image is about 85% cool desaturated greens in a narrow value band, with small, bright, warm or saturated accents: the glowing orb, the lantern, the turquoise pool, the butterflies. Erandel's scenes follow that ratio. **Large areas stay muted, and saturation is spent on the focal point.**

### 4.2 Accent colours (set by design, not sampled)

R1's turquoise water and its brightest lantern light read stronger than the averaged samples, so these accents are set by eye to match the painting:

| Role | Hex | Use |
|---|---|---|
| Aethwyn turquoise | `#3fa7a0` | Shallow clear water, the Aethwyn river, Mere surface by day |
| Lantern warm | `#ffc870` (existing game value) | Point lights, lantern cores, firelight |
| Lantern ember | `#ffd08a` (existing game value) | Lantern glow sprites, bloom tint |
| Torii red | `#b8322a` (existing game value) | Gate lacquer, Thorngate accents |

### 4.3 Element colours (from the game; the element list is PROVISIONAL, registry M2)

These are the hex values the game already uses. They stay, so spells, UI chips and creatures stay consistent.

| Element | Hex | | Element | Hex |
|---|---|---|---|---|
| Fire | `#e8613f` | | Light | `#f3e7a9` |
| Water | `#4fa3dc` | | Shadow | `#9b8fd0` |
| Earth | `#b48d5c` | | Spirit | `#9fe0d0` |
| Air | `#c7d9c0` | | Moon | `#c9cde3` |
| Ice | `#8fd4f0` | | Death | `#93a08b` |
| Lightning | `#ead85a` | | Magma | `#ff9142` |
| Nature | `#71bf6c` | | | |

Rule: **an element colour appears at full strength only on magic, glowing eyes and emissive details.** On cloth, armour and buildings, the same hue is used desaturated by 40–60% and pulled toward the region palette.

### 4.4 Value and saturation rules

- **MUST**: every scene keeps a clear value structure. Squint at the screenshot: the focal point (player, enemy, quest object) is the strongest value contrast on screen.
- **MUST**: no pure black (`#000000`) or pure white (`#ffffff`) except the core of a light source and UI text.
- **SHOULD**: shadows lean cool (blue-green) and lit areas lean warm (gold-cream) by day; at night lantern pools are warm and everything else is cool violet-blue.
- **SHOULD**: atmospheric perspective. Distant layers lose contrast and saturation and shift toward the region's haze colour (Mist pale `#bbcca6` in green lands).

### 4.5 Fate and Corruption colours (UI and VFX)

| Meaning | Hex | Note |
|---|---|---|
| Fate | `#7fc3e4` | Existing game value |
| Corruption | `#c65f86` | Existing game value |
| HP | `#d4735f` | Existing game value |

---

## 5. Lighting guide

### 5.1 The lighting model

Erandel uses **stylized physically-based lighting**: real sun, sky and point-light directions, with a painted response. Shadows have soft, coloured edges, and surfaces turn from light to shadow through a painted ramp (§11.1), not a hard CG terminator.

Every lit scene has, in this order:
1. **Key light**: the sun, the moon or a dominant lantern cluster. It decides the scene's direction and mood.
2. **Sky fill**: hemisphere light tinted by the time of day (cool above, warm bounce from the ground).
3. **Rim or back light**: a thin bright edge on characters, so they separate from busy backgrounds (R1: the backlit hair).
4. **Atmosphere**: height fog and depth haze in the region's haze colour, plus light shafts where the canopy breaks.
5. **Practicals**: lanterns, magic and vents. They are warm or element-coloured and carry bloom at night.

### 5.2 Time of day

| Time | Key | Sky and fog | Bloom | Mood |
|---|---|---|---|---|
| Dawn | Low gold sun, long shadows | Rose-cream haze, cool blue shadows | Off | Hope, beginning |
| Day | High warm-white sun | Clear sky, pale blue-green haze, god rays through canopy | Off (spells only) | Wonder, clarity |
| Dusk | Low amber sun, warm rim on everything | Amber-violet sky, haze thickens | Low | Nostalgia; lanterns begin |
| Night (signature) | Moonlight, cool and soft, from high behind | Deep violet-blue sky, stars, low fog | On, strongest | Cozy warmth inside, mystery outside |

The game's existing rule stays: **bloom belongs to night and to magic. Daylight stays crisp.**

### 5.3 Scene lighting sheet

Every new scene gets a five-line sheet in its brief:
```
Mood:        (one or two words)
Light idea:  (the one image: "a shaft of sun across the river", "a lantern pool in fog")
Key:         (source, colour hex, direction)
Haze:        (colour hex, density: light / medium / heavy)
Practicals:  (what glows, which colour)
```

### 5.4 Rules

- **MUST**: one dominant light direction per scene. No flat, shadowless lighting.
- **MUST**: characters always have a rim or a value separation from the background.
- **SHOULD**: point lights in view stay at 8 or fewer (the current engine budget). More lanterns are faked with glow sprites and emissive maps.
- **SHOULD**: shadows from the key light only. Small props use baked or contact (blob) shadows.

---

## 6. Character style guide

### 6.1 Direction

**Stylized anime characters, painted.** Anime proportions and faces, with the soft painterly rendering of R1, not flat cel shading and not realistic skin. Aelarion in R1 is the model sheet for what "an Erandel character" looks like.

### 6.2 Proportions

> **Decided (D1): chibi proportions are retired.** All characters use the stylized anime proportions below, matching R1. The change reaches the game with the visual transformation; until then the current build keeps its chibi characters.

| Type | Height (heads) | Notes |
|---|---|---|
| Adult hero (player characters, most kinds) | 6.5 | Slightly enlarged head and eyes for readability on phone screens; long legs; slender hands |
| Tall kinds (elves, seraphs, centaurs' torso) | 7–7.5 | Aelarion in R1 is about 7.5 |
| Small folk (dwarves, gnomes, halflings, goblins) | 4–4.5 | Same face style and eye scale as heroes; wider hands, sturdier stance |
| Large kinds (minotaurs, golems, treants) | 6.5 proportions, scaled 1.3–1.8× | Never "monster" proportions; they are playable people |
| Children and spirits | 4–5 | |

Fixed across all kinds: eye shape family, iris highlight style, hair rendering (§6.4), hand construction (4 fingers + thumb), and the material treatment (§11.3).

### 6.3 Faces

- Large expressive eyes with a painted iris gradient and two highlights (one sharp, one soft).
- Small nose drawn as a light shape and shadow, not modelled detail.
- Supernatural kinds glow in the eyes in their element colour at about 60% (§4.3): vampires red, shades cyan, liches violet (existing game rules).
- Faces read at 1/12 screen height on a phone: expression must survive that size.

### 6.4 Hair and costume

- Hair is grouped into large painted clumps with a few loose strands (R1). No individual strand rendering.
- Hair and cloth carry wind secondary motion (§15).
- **Costume layers tell culture:** an under layer, an outer layer, and one signature piece (a mantle, a sash, a hood, an embroidered collar). R1's green mantle with gold-thread embroidery is the quality bar for trim detail.
- Robe colours follow the kind's home element at 40–60% desaturation (§4.3).

### 6.5 Every kind is a main character

Erandel's players choose their own kind (registry K0, CANON), and many of those kinds are creatures in other fantasy worlds: a player can be a vampire, a werewolf, a nymph, a golem or a lich as easily as a human, an elf, a dwarf or a gnome. So:

- **MUST**: all 36 kinds are built as hero-quality playable characters: the player-character budget (§16.2), the full Painted Character treatment (§11.3), the shared humanoid skeleton with extra bones where needed (§15.3), face and expression quality from §6.3, and costume layers from §6.4.
- **MUST**: a kind that looks like a creature (a werewolf, a golem, a treant, a lich, a merfolk) still reads as a *person* the player wants to be: expressive face or readable eyes, a heroic stance, clothing or ornament that shows culture. It is never designed like an enemy.
- **MUST**: the playable form of a kind and any enemy of a similar type are visibly different. Example: a werewolf player and a Frost Wolf (B11) never share a silhouette; a ghoul player and a Restless Ghoul (B15) differ in posture, clothing and eye colour. Enemies follow §7; playable kinds follow §6.
- **SHOULD**: each kind gets a male, a female and a neutral body option and at least three face and colour presets, so a player of any kind has a hero of their own.
- Creature-like kinds keep their kind features at full strength (tails, wings, fins, bark, stone, fangs), painted in the same character material as everyone else.

### 6.6 Kind silhouettes

Each of the 36 kinds is identified by **one or two silhouette features** visible at phone size, before colour. These features come from the game's existing kind designs. The kinds' names are in the registry (section 4); their legends, paths and traits stay PROVISIONAL.

| Group (registry) | Silhouette family | Examples |
|---|---|---|
| Sea | Flowing fins, tail or wet hair; shell and pearl ornament | Merfolk (CANON kind): tail and fin ears |
| Night | Long coats, collars, ears or hoods; glowing eyes | Vampires (CANON): high collar; Werewolves (CANON): wolf ears and tail |
| Nature | Leaf, horn, bark or petal shapes woven into the body | Nymphs (CANON): leaf and flower hair; Elves: long ears |
| Sky | Wings or feathered mantles; light, upward shapes | Harpies, Birdfolk, Sylphs, Tengu |
| Elemental | The element itself as part of the body | Salamanders: ember skin; Golems: stone plates; Frostkin: ice crests |
| Beastfolk | Animal ears, tails, horns or hooves | Kitsune: tails; Minotaurs: horns |
| Divine and cursed | Halos, horns, wings, crowns, cracked or glowing marks | Seraphs, Fallen, Demons, Tieflings, Liches |
| Small folk and humans | Size and tools; beards, hats, packs | Dwarves, Gnomes, Halflings, Goblins, Humans (CANON) |

**MUST**: two kinds in the same group differ in silhouette, not only in colour. A line-up of the group in black silhouette must be told apart.

### 6.7 Named characters

Only canon facts are fixed here. Anything else about a named character's look is a **provisional look** until Sola approves it.

| Character | Registry | Fixed look | Status |
|---|---|---|---|
| Aelarion Silverbough | C1, CANON | As R1: pale-gold long hair, pointed ears, green mantle with gold embroidery over pale robes, gnarled staff topped with a green-glowing crystal in a living-wood cage, green rune-circle magic | **Fixed by Sola's artwork** |
| Runekar | C9, CANON | A dwarf with a rune hammer (Sola's words). Current game: red beard | Beard colour is a provisional look |
| The mermaid queen | C3, CANON | A mermaid queen. Current game: teal hair, gold crown | Provisional look; her name "Maren" is PROVISIONAL (C4) |
| Elash, Caelithra | C5, C12, CANON names | No look defined | Needs a brief and Sola's approval |
| Ysolde, Kesh, Tovin, Hilde, Nyx, Brother Aldric | C2, C6–C8, C10, C11, PROVISIONAL | Current game looks | Provisional characters, provisional looks |

### 6.8 Equipment

- Weapons and staffs are 1.0–1.3× realistic size: bigger than life, smaller than anime extremes.
- Every magic focus (staff, wand, tome, instrument) has an emissive part in the user's element colour.
- Metal is painted, not mirror-like: worn brass, dark iron, pale silver, with hand-painted highlights.

---

## 7. Creature design guide

This guide covers **enemies and wildlife** only. Playable kinds, including creature-like ones such as vampires, werewolves, golems and liches, are characters and follow §6 (see §6.5). Creatures and their homes come from the registry (section 5, all PROVISIONAL). This guide sets how any creature looks; it adds no new species.

### 7.1 Principles

1. **Natural first, magical second.** Every creature is built on a believable animal or natural form (boar, wolf, moth, stag, crawler), then one element is added (§4.3). It should look like it could live in its region.
2. **Readable threat.** Size, silhouette and eye glow show danger level before the health bar does.
3. **Telegraphs are part of the design.** Every attack has a visible wind-up pose and a glow on the part that strikes (existing game rule: enemy wind-up telegraphs).
4. **Same painted materials as the world.** Fur is painted clumps, scales are painted plates, ghosts are painted translucency, never a different rendering style.

### 7.2 Size classes

| Class | Height vs hero | Examples (registry B-rows) | Budget (§16) |
|---|---|---|---|
| Swarm / small | 0.2–0.5× | Moon Moth Swarm, Will-o'-Wisp, Ember Wisp | Instanced, very low poly |
| Medium | 0.5–1.2× | Thornback Boar, Frost Wolf, Restless Ghoul | Standard creature |
| Large | 1.2–2.5× | Cave Golem, Lunar Stag, Ash Drake Whelp | Large creature |
| Boss | 2.5×+ | Rat King and any future boss | Boss budget, own brief |

### 7.3 Element treatment

| Element family | Visual treatment |
|---|---|
| Fire, Magma | Cracked dark skin over glowing seams; heat shimmer; ember particles |
| Water, Ice | Wet sheen or frosted edges; translucent fins or crystals; drifting droplets or snow |
| Earth | Stone plates, moss and roots growing on the body |
| Air, Lightning | Feathers, long flowing shapes; sparks along wing edges |
| Nature | Bark, thorns, leaves and flowers part of the body |
| Light, Moon | Pale, luminous edges; soft halo; silver or gold |
| Shadow, Death, Spirit | Partial translucency, smoke edges, hollow glowing eyes; never gore |

### 7.4 Corruption

When a creature or place is corrupted, the same design gains: desaturated colour, a shift toward Corruption `#c65f86` in the glow, cracked or withered edges, and slower, heavier motion. **No gore, no body horror.** Erandel's darkness is sad and eerie, not grotesque. The existing game tone holds: the Veilmoor is "quiet, not scary".

---

## 8. Architecture guide

### 8.1 Principles

- **History in the stone.** Buildings show their age: worn steps, moss in joints, roots through walls, repairs in newer material. This follows registry V1 (an ancient world built on forgotten civilizations, PROVISIONAL), so the look depends on that row.
- **Layered eras [visual direction].** Many places show two layers: older ruined foundations, and newer homes built on and among them. The *look* of the old layer (pale, monumental, rune-carved) is an art choice; who built it is an open lore question that this bible does not answer.
- **Region shape language.** Each region has a dominant roof form, window shape and material (§12).
- **Real proportions, stylized detail.** Doors, steps and rails fit the hero's scale. Ornament is painted or chunky-modelled, never fine greebles.
- **Lived in.** Lanterns, banners, plants, signs and worn paths show people use the space.

### 8.2 The R1 vocabulary (Erelian and any elven-style architecture)

From Sola's artwork: tall pale-stone spires with pointed caps, arched bridges between spires, wide stone stairs climbing through greenery, waterfalls falling from the structure, vines and trees growing on every level, hanging lanterns and long banners.

### 8.3 Build items

The 17 player build items (registry E3, PROVISIONAL) keep their gameplay roles. In the visual transformation, each is redrawn in the plot's style (wood, paper and stone, warm lanterns) with the same footprint, so saved plots keep working.

---

## 9. Forest and vegetation guide

### 9.1 What makes an Erandel forest

Following Sola's rule ("dense, ancient and magical") and R1:

1. **Depth in layers.** Every forest view has at least three layers: foreground (leaves and branches framing the edge of the screen, which dissolve near the camera), midground (the playable space), and background (silhouetted trunks and spires in haze).
2. **Hero trees.** Every forest area has at least one ancient tree much larger than the rest: a landmark the player navigates by.
3. **Undergrowth.** Ferns, roots, moss carpets, fallen trunks and flowers fill the floor. Bare ground under trees is not allowed in forest scenes.
4. **Light through the canopy.** God rays and dappled light patches on the ground.
5. **Drifting life.** Butterflies (white, as R1), motes, falling leaves or fireflies at night.

### 9.2 How trees are made

- Trunks: modelled with taper, root flare and some twist; painted bark texture with vertical strokes.
- Canopy: **clumped leaf cards with painted leaf-mass textures**, shaded as soft volumes (normals pointed outward from the clump centre), so the canopy reads as painted masses, not as individual leaves or as a solid ball.
- Colour: canopy darker and cooler at the core and bottom, lighter and warmer at the sunlit top edge (§4.1: Forest shadow → Moss mid → Sage light → Lichen).
- **MUST**: trees are instanced (§16), with 3 LOD steps and an impostor card at distance.

### 9.3 Vegetation families by region

Drawn from the current game's prop families (`design/art/art-bible.md` §6):

| Region | Vegetation |
|---|---|
| Thorngate | Oaks, thorn bushes, bamboo |
| Erelian | White-trunk trees, vines, ferns, flowering moss (R1) |
| Hrimwold | Snow pines, frosted shrubs |
| Cindral Wastes | Ash-dead trees, fire-tolerant succulents near vents [visual direction] |
| The Veilmoor | Dead trees, pale grass, mist moss |
| Caelithra's Moonwell | Pale-leafed trees, glowing flowers [visual direction] |
| Aethwyn Mere | Reeds, lily pads with pink lotus, water plants |
| Vetharn's Pass | Wind-bent pines, tough grass, alpine flowers [visual direction] |
| Runekar's Deep | Glow-moss and fungus in caves [visual direction] |
| Dawnspire | Kept gardens, pale flowering trees [visual direction] |

---

## 10. Terrain and landscape guide

### 10.1 Landscape shape

- Big readable landforms first: valleys, cliffs, plateaus and river cuts the player can see from a distance and climb (existing climbing: slopes steeper than about 46°).
- Cliffs are **stacked, fractured rock masses** with clear top planes that catch light, not noise displacement.
- Paths are worn into the ground: darker, smoother, edged by grass.

### 10.2 Painted terrain

The current game's painted, slope-aware ground stays and is upgraded:
- Ground blends grass, dirt, rock and region-specific layers by slope, height and painted masks.
- **Brush language** (world-wide): textures are painted with visible directional strokes; strokes follow the form (along a slope, around a rock).
- **MUST**: no visible tiling. Use at least two texture scales mixed, plus macro colour variation.
- Ground scatter (grass tufts, pebbles, flowers) is instanced and fades out with distance.

### 10.3 Skies

Painted sky gradients with stylized clouds (soft painted shapes with bright rims at dusk and dawn); stars and moon at night (existing game sky).

---

## 11. Water and material guide

### 11.1 The master material family

All world materials come from **one shader family** with a painted light ramp, so every asset is lit the same way:
- **Painted Lit** (world): albedo with painted shading, a soft ramp from light to shadow, coloured shadow tint, a subtle rim, optional painted normal for large forms only.
- **Painted Character** (characters and creatures): Painted Lit plus a skin and cloth ramp, stronger rim, eye and hair highlights.
- **Painted Foliage**: Painted Lit with alpha-tested cards, wrap lighting (light passes through leaves) and wind.
- **Water** and **Magic / Emissive** (§11.4, §13).

**MUST**: no asset ships with a default engine material (Standard, Lambert or Phong left at default settings).

### 11.2 Material rules (avoiding plastic)

| Material | Roughness | Specular look | Painting notes |
|---|---|---|---|
| Stone | 0.75–0.95 | None, except wet stone | Worn edges painted lighter; moss in crevices |
| Wood | 0.70–0.90 | None | Grain painted along the board; darker at joints |
| Cloth | 0.85–1.0 | None; soft sheen for silk | Fold shadows painted into albedo plus a light ramp |
| Skin | 0.60–0.75 | Soft, warm, broad | Warm blush at cheeks, ears and knuckles |
| Hair | 0.50–0.70 | One soft painted highlight band | Clumped |
| Metal (brass, iron, silver) | 0.35–0.60 | Painted highlights, tinted by the metal, never white | Wear on edges |
| Crystal, ice | 0.10–0.30 | Sharp, tinted | Inner glow or refraction faked with painted gradients |
| Water | see §11.4 | Reflections | |

**MUST**: specular is never pure white on non-metal surfaces. **MUST**: roughness below 0.55 only for water, ice, crystal, wet stone and metal.

### 11.3 Characters' material treatment

Every character uses Painted Character, so a dwarf and a seraph standing together read as one game: same ramp, same rim, same eye highlights. Kind features (scales, fur, bark, stone) are painted into the same material, not given a separate shader.

### 11.4 Water

| Water | Look |
|---|---|
| River (the Aethwyn) | Turquoise shallows (`#3fa7a0`) to deep shade (`#303f39`); painted flow streaks; white foam at rocks and falls; soft reflections |
| Mere and ponds | Calm, mirror-like at night (existing game: dark reflective water with lantern reflections); lily pads and lotus |
| Waterfalls | Painted streak texture scrolling; mist at the base; light catches the spray (R1) |
| Underwater (Mere court) | Blue-green fog, light shafts from above, drifting particles |

Water always shows depth: shallow edges are lighter and clearer, deep centres darker.

---

## 12. Region identity sheets

Each region keeps the same rendering rules and changes only what is in its row. Region names are canon or provisional exactly as in the registry; every "look" cell is **[visual direction]** unless it cites R1 or the current game.

| Region (registry) | Palette shift | Light and mood | Shape language | Materials | Signature motifs |
|---|---|---|---|---|---|
| **Thorngate** (L1, CANON name) | Warm green, torii red, lantern gold | Dusk and night lantern warmth; "a threshold" | Gateways, posts, wooden roofs, string lights | Dark wood, paper, stone lanterns | The gate itself; Aelarion's green magic at the gate (R1, C1) |
| **Erelian** (L3, CANON name) | R1 master palette: cool greens, pale stone, turquoise water | God rays through canopy; wonder, calm | Tall pale spires, arched bridges, stairs through green (R1) | Pale stone, living wood, gold-thread banners | White-trunk trees, white butterflies, waterfalls (R1) |
| **Aethwyn Mere** (L2, PROVISIONAL) | Turquoise to deep blue-green | Sun shafts into water by day; moon reflection at night | Sunken columns, shell curves | Wet stone, coral, pearl | The underwater court (C3 queen, CANON) |
| **Cindral Wastes** (L4, PROVISIONAL) | Ash grey, charcoal, ember orange `#ff9142` | Heat haze; red underglow from vents | Broken pillars, low forges | Ash stone, iron, glowing rock | Vents, embers in the air |
| **Vetharn's Pass** (L5, CANON name) | Cold blue-white, slate, alpine green | Wind, high clear light, storm clouds | Switchback paths, cairns, wind-cut peaks | Slate, snow, weathered wood | Where the Aethwyn begins (its course is PROVISIONAL, L0) |
| **Hrimwold** (L6, PROVISIONAL) | White, ice blue `#8fd4f0`, pale violet shadow | Low winter sun, long blue shadows | Domes, ice spikes | Snow, ice, fur, dark timber | Breath fog, snow drift |
| **Runekar's Deep** (L7, PROVISIONAL) | Warm stone brown `#b48d5c`, forge orange, crystal accents | No sun; forge and crystal light only | Carved halls, pillars, rune-lit doors | Carved stone, iron, glowing runes | Rune-lit stone; Runekar's hammer (C9, CANON) |
| **The Veilmoor** (L8, PROVISIONAL) | Death `#93a08b`, Spirit `#9fe0d0`, pale fog | Mist, blue-white wisps; quiet, not scary (current game) | Leaning stones, dead trees | Grey stone, pale grass, fog | Souls choosing rebirth or eternity (W2, CANON myth) |
| **Dawnspire** (L9, PROVISIONAL) | Light `#f3e7a9`, cream stone, gold | Dawn light, the first light of the day | Tall single tower, open courts | White stone, gold leaf | First light |
| **Caelithra's Moonwell** (L10, PROVISIONAL) | Moon `#c9cde3`, silver, night blue | Moonlit night; the pool holding the moon | Circles, a central pool | Silver stone, crystal | The moon in the water; Caelithra (C12, CANON name) |

---

## 13. Magic and VFX guide

### 13.1 The visual language of magic

From R1: **magic is drawn as glowing rune geometry.** A spell is a light source shaped by runes: circles, rings and glyph lines in the element's colour, with a near-white hot core and soft bloom.

Grammar every spell follows:
1. **Gather**: particles or light lines flow toward the hand or focus (the wind-up the opponent can read).
2. **Form**: a rune circle or glyph ring appears, in the element colour (§4.3), spinning slowly.
3. **Release**: the effect travels or bursts; the core is near-white, the edge is the element colour.
4. **Linger**: motes or embers drift and fade over 0.5–1.5 s.

The game's 8 forms (registry M4, PROVISIONAL) each get one shape: Bolt is a line, Wave a crescent sweep, Summon a ground circle, Ritual concentric rings, Ward a curved wall, Weave a spiral around the target, Shape a body glow, Enchant an edge glow on a weapon. The rune-circle grammar above applies to all of them.

### 13.2 Rules

- **MUST**: element colour by element; the rune style is shared by all magic. A fire spell and a moon spell are clearly the same magic system in two colours.
- **MUST**: gameplay-critical VFX (telegraphs, hit zones, healing) read at phone size and without colour (shape and motion also carry the meaning, for colour-blind players).
- **SHOULD**: effects are painted sprites and flipbooks with soft edges, not hard geometric particles.
- **SHOULD**: bloom on magic is strong at night and light by day; it never washes out the character casting it (existing game fix: bloom is kept from white-out up close).
- Corruption effects: the same grammar, desaturated, with the Corruption tint and cracked, broken rune lines.

### 13.3 Environmental VFX

Light shafts, drifting motes, butterflies, fireflies, falling leaves, snow, ash, waterfall mist and vent heat shimmer. Every region has 1–2 ambient effects from its §12 sheet.

---

## 14. UI style guide

The current UI language stays and is refined to match the painterly world.

### 14.1 Principles

- **Frame the world, don't cover it.** The HUD is quiet, translucent and small; the painted world is the hero.
- **Ink and gold.** Dark translucent panels (Night ink `#11131b` at 70–85% opacity), thin gold frames (`#d9aa52`), parchment text (`#ebe4d1`). These are existing game values.
- **Painted touches.** Panel corners, dividers and the dialog frame may carry fine gold filigree echoing R1's embroidery. Kept light, so it does not compete with the world.

### 14.2 Type

Existing fonts stay: **Grenze Gotisch** (titles, region banners, names), **Alegreya Sans** (body text, dialog), **IBM Plex Mono** (numbers, labels, stats).

### 14.3 Components

| Component | Style |
|---|---|
| Dialog box | Double gold frame, portrait on the left (painted bust in the character style, §6), ▸ choices (existing) |
| Region banner | Grenze Gotisch over a soft ink fade, region name plus its tagline (taglines are PROVISIONAL per the registry) |
| Bars | HP `#d4735f`, Focus/MP blue, Fate `#7fc3e4`, Corruption `#c65f86`; thin, rounded, with a soft inner glow |
| Skill buttons | Round, ink with gold rim; the element colour as an inner glow; cooldown as a clockwise ink sweep |
| Icons | Line icons, stroke 1.8, gold or parchment (existing) |
| Name plates | Small parchment text with an ink shadow; enemies in a warm red, allies in Fate blue |

### 14.4 Rules

- **MUST**: touch targets at least 44 × 44 px on phones; text at least 12 px.
- **MUST**: information is never carried by colour alone (shape, icon or text also).
- **SHOULD**: UI animates softly (150–250 ms ease-out), never bouncy.

---

## 15. Animation style guide

### 15.1 Principles

- **Anime timing:** clear key poses, fast transitions, short holds on the strongest pose. Attacks snap; idles breathe.
- **Weight by kind:** small folk are quick and bouncy; large kinds move slower with more follow-through; sky kinds float; sea kinds flow.
- **Secondary motion everywhere:** hair, mantles, tails, ears, wings and banners follow the body and the wind (R1's flowing mantle and hair).
- **The world moves:** leaves sway, water flows, lanterns flicker, butterflies drift. A still frame of Erandel should never look frozen.

### 15.2 Gameplay animation rules

| Action | Rule |
|---|---|
| Wind-up (telegraph) | Readable pose plus glow, 0.3–0.8 s depending on threat (existing game wind-ups) |
| Attack | Snap into the strike pose in 2–4 frames at 30 fps; hold 2–3 frames; recover |
| Dodge | Fast, low, with a short trail; the existing invulnerability window stays as tuned |
| Climb | Hands and feet placed on the rock; body close to the wall |
| Hit reaction | Short flinch and a flash in the attacker's element colour |
| Idle | Breathing plus a kind-specific gesture every 6–12 s |

**MUST**: gameplay timing (wind-ups, invulnerability, cooldowns) is set by the combat design (`design/gdd/action-combat.md`), not by animation. Animation fits the timing; it never changes it.

### 15.3 Technical

Skeletal animation in glTF; one shared humanoid skeleton for all humanoid kinds (with optional bones for tails, wings, ears, fins), so animations are shared and retargeted. Creatures have their own skeletons per body family.

---

## 16. Technical production rules

The visual transformation runs in a browser on phones. These budgets keep the look affordable. They follow the Phase 1 findings: a peak of 862 draw calls on desktop at night, and three.js being upgraded step by step to r186 (ADR-0002).

### 16.1 Formats

| Asset | Format |
|---|---|
| Models | glTF 2.0 binary (`.glb`), Y-up, 1 unit = 1 metre |
| Textures | Painted at 2× final size, delivered as KTX2 (Basis) for the game; PNG masters kept in the source folder |
| Animation | Inside the `.glb` |
| Concepts and references | PNG or JPG |

### 16.2 Budgets (approved as targets, D6; to be confirmed by the real-device test plan, `production/qa/mobile-perf-test-plan.md`)

| Asset type | Triangles (LOD0) | Textures | LODs |
|---|---|---|---|
| Player character (any of the 36 kinds) | 12k–18k; up to 22k for kinds with wings, tails or a large body | 1 × 1024² atlas (albedo plus mask) | 3 |
| NPC | 6k–10k | 1 × 512²–1024² | 3 |
| Creature, medium | 4k–8k | 1 × 512² | 3 |
| Creature, large or boss | 10k–25k | 1 × 1024²–2048² | 3–4 |
| Hero tree | 8k–15k | Shared foliage atlas | 4 plus impostor |
| Standard tree | 1.5k–4k | Shared foliage atlas | 3 plus impostor |
| Small prop | 100–1.5k | Shared region atlas | 2 |
| Building | 3k–12k | Shared region atlas plus trim sheet | 3 |
| Whole scene in view (phone) | 300k triangles, 250 draw calls, 8 point lights | | |

Rules:
- **MUST**: repeated objects (trees, rocks, grass, lanterns, fences) are instanced.
- **MUST**: materials are shared per region through atlases and trim sheets; a new material for one prop needs a reason.
- **MUST**: every asset fits its budget before review; a budget break needs a performance note and Sola's yes.
- The user's rule stays: **do not sacrifice visual quality simply to reduce draw calls.** When the budget and the look conflict, the conflict is written up with both options and Sola decides.

### 16.3 Naming conventions

Pattern: `<type>_<region>_<subject>[_<variant>][_<lod>].<ext>`, lower case, words joined by hyphens inside a part.

| Type prefix | Meaning | Example |
|---|---|---|
| `chr` | Character (kind or named) | `chr_all_elf-female_a.glb`, `chr_erelian_aelarion.glb` |
| `cre` | Creature | `cre_erelian_thornback-boar.glb` |
| `env` | Environment set piece | `env_erelian_spire-bridge_a.glb` |
| `prp` | Prop | `prp_thorngate_paper-lantern_lod1.glb` |
| `veg` | Vegetation | `veg_erelian_white-tree_hero.glb` |
| `ter` | Terrain texture layer | `ter_all_grass_albedo.ktx2` |
| `mat` | Shared material or atlas | `mat_erelian_atlas_albedo.ktx2` |
| `vfx` | Effect texture or flipbook | `vfx_all_rune-circle_fire.ktx2` |
| `ui` | Interface art | `ui_all_dialog-frame.png` |
| `ref` / `cpt` | Reference / concept image | `cpt_erelian_spire-bridge_v2.png` |

Region codes use the **registry names**, never the deprecated code ids (registry section 10): `thorngate`, `erelian`, `aethwyn-mere`, `cindral`, `vetharn`, `hrimwold`, `runekar-deep`, `veilmoor`, `dawnspire`, `moonwell`, and `all` for shared assets.

Texture suffixes: `_albedo`, `_mask` (R roughness, G ambient occlusion, B emissive, A alpha), `_normal`, `_emissive`. LOD suffixes: `_lod0` to `_lod3`, `_imp` for impostors.

### 16.4 Folders

```
assets/
├── source/            masters: .blend, painted PSD/PNG at 2×, concept files (not shipped)
│   └── <type>/<region>/
└── game/              what the game loads: .glb and .ktx2 only
    └── <type>/<region>/
design/art/
├── references/        reference board (§2.2)
└── briefs/            one brief per asset (§2.3)
production/qa/evidence/art/<asset-id>/   review screenshots (§2.3 step 5)
```

---

## 17. Quality standards and review rubric

### 17.1 The rubric

Every asset is scored 1–5 on each criterion, from in-engine screenshots (day and night, desktop and phone). **Pass: average 4.0 or higher, and no criterion below 3.**

| # | Criterion | 5 means | 1 means |
|---|---|---|---|
| 1 | **Silhouette and readability** | Reads instantly at phone size, in black silhouette | Unreadable or confused with something else |
| 2 | **Scale and proportion** | Matches §6.2 or real scale against the hero | Wrong scale, breaks the proportion sheet |
| 3 | **Painted material** | Brushwork visible, no plastic, follows §11.2 | Default material, plastic sheen, photo texture |
| 4 | **Palette fit** | Inside the master palette and the region shift | A colour from another game; saturation everywhere |
| 5 | **Lighting response** | Ramp, rim and shadow colour behave like the rest of the world | Lit differently from its surroundings |
| 6 | **Region identity** | Clearly belongs to its region (§12), clearly still Erandel | Could belong to any region, or to another game |
| 7 | **Ancient and alive** | Shows age, use and life (§1.3) | Brand-new, sterile, static |
| 8 | **Lore fidelity** | Names and looks match the registry; provisional looks labelled | Shows unapproved lore as fact |
| 9 | **Technical** | Within budget, named and foldered correctly, LODs work | Over budget, wrong format or name |

### 17.2 Hard gates (fail regardless of score)

- A default engine material, or a photo texture.
- A deprecated code id in a file name or visible text.
- A named character whose look contradicts Sola's canon artwork (R1 for Aelarion).
- A reproduced character, logo or design from another work.
- Gameplay timing changed by an animation.

### 17.3 The line-up test

Every new character or kind is screenshotted standing next to Aelarion and one existing character, in the same light. If it looks like it came from a different game, it fails criterion 5 or 6, whatever its other scores.

### 17.4 The region test

Every new region screenshot is placed side by side with an Erelian screenshot. They must look like two places in one world (§2.4).

---

## 18. Decisions (answered by Sola, 2026-11-05)

| # | Question | Sola's answer | Where applied |
|---|---|---|---|
| D1 | Retire chibi for stylized anime proportions? | **Yes** | §6.2 |
| D2 | Which references set the style? | **Aelarion (R1)** | §1.2 |
| D3 | R1's Erelian look as the house style for elven-style architecture? | **Yes** | §8.2, §12 |
| D4 | Runekar's red beard, the mermaid queen's teal hair and crown? | **Provisional.** Sola added: many creatures are main characters too (vampire, human, elf, gnome, dwarf, nymph) | §6.7 stays provisional; new §6.5 makes every kind a hero-quality main character |
| D5 | Use AI concept and image-to-3D tools, with the same review? | **Yes** | §2.3 |
| D6 | Phone budgets as targets until the real-device test? | **Yes** | §16.2 |

## Change log

| Date | Change |
|---|---|
| 2026-11-05 | Version 1.0 written for Phase 2. Palette sampled from R1. Built on the v0.3 art bible, the lore registry and the Phase 1 technical findings. No game code changed |
| 2026-11-05 | Version 1.1: Sola's answers D1–D6. Chibi retired; Aelarion is the style reference; new §6.5 "Every kind is a main character"; enemies vs playable kinds separated in §7; player budget covers all 36 kinds |
