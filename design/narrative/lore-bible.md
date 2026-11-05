# Erandel Lore Bible — Canon Register

---
**Owner**: Sola (creator) · **Updated**: 2026-11-05 · **Covers**: the game, novels and stories, YouTube, maps and encyclopedia
**Inputs**: Sola's stated canon; the shipped game v0.4.1 (`src/index.html`); *Master Lore Bible — Volume I* (received 2026-11-05, kept unedited in `sources/master-lore-bible-vol1-received-2026-11-05.md`)
---

**The review list of every classified item is `ERANDEL_LORE_REGISTRY.md` at the repository root.** This file holds the explanations: what each Volume I part proposes, and how it fits the existing world.

**Governing rules** (set by Sola, 2026-11-05):
- Development inventions never become official Erandel lore by accident. **Nothing PROVISIONAL becomes CANON without Sola's approval.**
- We expand the universe without silently rewriting its history (from *Volume I*).

Every entry carries exactly one of three categories:

| Category | Meaning | Who may assign it |
|---|---|---|
| **CANON** | Confirmed by Sola's original worldbuilding | Sola only |
| **PROVISIONAL** | A new development idea waiting for Sola's approval. This includes everything written while building the game and everything in *Volume I* | Anyone may propose; it stays here until Sola decides |
| **DEPRECATED** | Old prototype content that must not be treated as current lore | Sola, or anyone marking a superseded name, with a note pointing to what replaced it |

A PROVISIONAL entry may carry a note in brackets: *(in game)* means it shipped in v0.4.1, and *(Volume I)* means it comes from the Master Lore Bible. *(source not found)* means it is said to be earlier lore, but the original has not been recovered. Notes never change the category.

---

## 1. CANON

These facts outrank everything else in this file. Nothing PROVISIONAL may contradict them.

| Fact | Category |
|---|---|
| Erandel is Sola's original fantasy world. The spelling "Aerandel" has also been used | CANON |
| Souls arrive at the **Thorngate** and choose **rebirth or eternity** | CANON |
| **Aelarion Silverbough** is the gatekeeper of Erandel. His portrait art was supplied by Sola | CANON |
| **Caelithra**, **Runekar**, **Elash** are characters (with Aelarion they lead the children's book concept) | CANON (names only; roles not stated) |
| The **Aethwyn** river; **Erelian**; **Vetharn's Pass** | CANON |
| A dwarf with a rune hammer, an elf mage and a mermaid queen are Erandel characters (from the Dawnfolk mod idea) | CANON (that these three exist; their names are not confirmed) |
| Erandel spans a game (Three.js), novels and short stories, YouTube storytelling, character biographies, maps and an encyclopedia | CANON (scope, stated in Volume I) |

*Volume I* marks only two facts as established: that Erandel is Sola's world, and that the game uses Three.js. It was written without the canon above. It does not mention the Thorngate, Aelarion or any named place or person, so it adds to the canon and does not replace it.

## 2. PROVISIONAL (in game): what v0.4.1 already contains

Everything below shipped in the game without Sola's approval, so it is PROVISIONAL even though players can see it. Only the parts named in section 1 are CANON. Full lists are in the code and in `design/gdd/`.

| Content | Category | Where |
|---|---|---|
| 10 lands: Thorngate, Erelian, Vetharn's Pass, Aethwyn Mere, Caelithra's Moonwell, Runekar's Deep, The Veilmoor, Cindral Wastes, Hrimwold, Dawnspire | CANON: Thorngate, Erelian, Vetharn's Pass · PROVISIONAL: the other 7 | `REG`, `TAGLINE` |
| The Aethwyn runs from the snows of Vetharn's Pass through Erelian into the Mere | CANON: the river and both places · PROVISIONAL: its course and the Mere | `AEL_LORE` |
| The Veilmoor, south of the gate, where the souls who chose eternity wait | PROVISIONAL, built on the CANON myth | `AEL_LORE`, `TAGLINE` |
| Residents: Caelithra the moon oracle, Runekar the rune-smith, Elash the warden of the white boughs, Queen Maren the mermaid queen | CANON: the names Caelithra, Runekar, Elash · PROVISIONAL: every role and the name Maren | `NPCS` |
| Residents: Ysolde, Kesh, Tovin, Hilde, Nyx, Brother Aldric | PROVISIONAL | `NPCS` |
| 36 kinds in 8 groups, each with paths, a legend and a dark legend | PROVISIONAL | `RACES` |
| 13 elements, 8 magic sources, 8 spell forms, 18 fusions | PROVISIONAL | `ELEM`, `SRC`, `FORMS`, `FUSION` |
| 20 creatures, 2 per land | PROVISIONAL | `REG[*].beasts` |
| Fate and Corruption "are not rewards or punishments. They are the shape your deeds leave on the world" | PROVISIONAL | `AEL_LORE` |

## 3. PROVISIONAL (Volume I): Master Lore Bible proposals

Every part below is PROVISIONAL. Each is summarised exactly as proposed, followed by how it fits what already exists. The fit notes are observations, not decisions, and they are PROVISIONAL too.

### 3.1 Identity and pillars — PROVISIONAL

Erandel is an ancient world built on the remains of forgotten civilizations. Its peoples' understanding of their history is incomplete. The ruins are older than the oldest kings, and some creatures remember events no historian can explain. The central mystery is **what happened to the world before its recorded history began**.

Five pillars: **Ancient mystery** (the past is never entirely dead), **Consequence**, **Discovery** (exploration reveals stories, not only rewards), **Power** (magic always has limits and costs), and **Legacy**.

Narrative philosophy: there is no simple good and evil. A kingdom may hide a crime, a necromancer may protect the boundary, a god may have unacceptable reasons, and a monster may be the last witness.

*Fit:* this matches the game's Fate and Corruption line and its light and dark legends for every kind. The game's own pillars (in `game-concept.md`) are "You become what you do", "The world remembers", "Every body is different", "Cozy by lantern light" and "Plays on a phone". Both sets can stand together, because Volume I's pillars are about story and the game's are about play. "Cozy by lantern light" sits apart from Volume I's darker mystery tone, so Sola should decide the balance.

### 3.2 Cosmology — PROVISIONAL

Before the world was the **First Silence**, in which everything possible was undivided. Then came the **First Awakening**, and from it three primordial principles. These are forces, not gods:

| Principle | Governs |
|---|---|
| The Origin | Creation, existence, possibility |
| The Veil | Boundaries, memory, the passage between states |
| The End | Decay, transformation, conclusion. It is not evil: without endings nothing changes |

There are five realms, and reaching any of them needs rare conditions, ancient knowledge or great sacrifice: **the Living World**, **the Veiled Realm** (where memories and echoes persist), **the Astral Expanse**, **the Hollow** (forgotten things, lost identities, corrupted existence), and **the Primordial Deep**.

*Fit:*
- **The Veil** gives the CANON rebirth-or-eternity choice a cosmic place. The Thorngate could stand on the Veil, and Aelarion could be its keeper. This is not decided.
- **Name clash:** in the code the Veilmoor's internal id is `hollow`, and its tagline is "Where souls choose rebirth or eternity". Volume I's Hollow is a different idea (corrupted, forgotten things). Sola should choose whether the Veilmoor lies on the edge of the Veiled Realm, the Hollow, or neither.
- The game's Spirit, Moon and Death elements and the Veilmoor's souls fit the Veiled Realm. The Moonwell fits the Astral Expanse.

### 3.3 History — PROVISIONAL

Seven Ages:
1. **The Age Before Time.** The primordial forces appear and existence takes its first form.
2. **The Age of First Creation.** The world takes shape, the first beings appear, and magic's foundations are laid.
3. **The Age of Ancients.** The first civilizations rise, with knowledge, architecture, religion and magical practice.
4. **The Age of Ascendancy.** Great empires compete, and magical knowledge reaches its height.
5. **The Age of Sundering.** A catastrophe collapses civilizations and erases history.
6. **The Age of Reclamation.** New kingdoms rise from the ruins.
7. **The Age of the Present.** The world seems stable, but the past resurfaces.

The **Sundering** is the defining mystery, and its cause stays deliberately unresolved. Accounts disagree: a war for magical supremacy, gods who left, divine punishment, a damaged boundary between life and death (the necromantic view), or an attempt to keep something out (the ancient inscriptions). The player slowly learns that each account is a fragment of a larger truth.

*Fit:* the game has no history yet beyond Aelarion's seven lines, so nothing conflicts. Runekar's Deep ("halls of the rune-hammer"), Dawnspire ("keeper of the first light") and the Veilmoor could hold Sundering ruins. "An attempt to keep something out" sits well with a gate and its keeper. That last link is only an observation, not a proposal.

### 3.4 Geography — PROVISIONAL, working names only

Six regions for the first expansion: **the Northern Reaches** (frozen fortresses, buried temples, oral histories), **the Central Kingdoms** (monarchies, merchant cities, rival churches), **the Verdant Expanse** (an ancient forest with living ruins), **the Ashen Territories** (old wars, corruption, abandoned forts), **the Sunken Sands** (desert kingdoms, buried archives), and **the Shattered Isles** (a maritime culture, wrecks, the ocean). *Volume I* calls these working names, not canon.

*Fit:* the game's ten lands are smaller places that could sit inside these regions. One possible mapping, for Sola to accept or reject:

| Volume I region | Possible game lands inside it |
|---|---|
| Northern Reaches | Hrimwold, Vetharn's Pass |
| Central Kingdoms | Thorngate, Dawnspire, Caelithra's Moonwell |
| Verdant Expanse | Erelian |
| Ashen Territories | Cindral Wastes, Runekar's Deep |
| Sunken Sands | none yet |
| Shattered Isles | Aethwyn Mere |

The Veilmoor has no region. It may belong to a realm instead (see 3.2).

### 3.5 Peoples and power — PROVISIONAL

| People | Proposed |
|---|---|
| Humans | Many kingdoms, short lives, adaptable |
| Eldari | Ancient peoples bound to natural and spiritual forces |
| Dwarven Clans | Mountains, metalwork, underground architecture |
| Veyr | *New:* tied to the Veiled Realm |
| Drakari | *New:* descended from beings of primordial fire |
| Hollowborn | *New:* tied to corrupted or altered existence |

Rule: species, culture and political faction are separate. Not every Eldari belongs to one kingdom.

Power centres: royal dynasties, religious institutions, arcane orders, merchant alliances, and independent factions (adventurers, mercenaries, explorers, the underground). Each preserves a different version of the truth.

*Fit:*
- The species-versus-culture rule matches the game, where the 36 kinds are bodies, not nations.
- Humans and Dwarves already exist as kinds. "Eldari" could be the in-world name for Elves (and perhaps Nymphs and Fae), which is Sola's choice.
- The three new peoples have kin among the existing kinds: Veyr with Shades or Liches, Drakari with Salamanders, Djinn and the Ash Drake creatures, and Hollowborn with the dark legends. Adding them as kinds would be a design change with balance work.
- The game's guild jobs (knight, priest, merchant, spy and others) can belong to these power centres.

### 3.6 Magic — PROVISIONAL

Magic comes from the fundamental forces and is the ability to influence reality's structure. It is never free.

Six disciplines: **Arcana** (energy, matter, force), **Verdancy** (nature, growth), **Aether** (celestial energy, perception, consciousness), **Umbral** (shadow, concealment, perception), **Thanaturgy** (death, souls, the living and the dead), and **Chronomancy** (perceived time; at the highest level, limited time effects).

Five laws: **I Conservation** (no unlimited creation from nothing), **II Cost** (power needs a sacrifice, resource or consequence), **III Resistance** (reality resists), **IV Knowledge** (understanding limits safe use), **V Irreversibility** (some effects cannot be undone).

*Fit:*
- The laws match the game's sources well: Life Essence costs HP, Contract costs Corruption, Faith falls silent when Corruption exceeds Fate, and Nature is weaker in town.
- The six disciplines do not map one-to-one onto the game's 8 sources × 13 elements × 8 forms. Disciplines could become in-world schools or orders that teach certain sources and elements: Verdancy for the Nature Pact and Nature, Thanaturgy for Death and Spirit, Umbral for Shadow, Aether for Moon, Light and Spirit Bond, Arcana for Mana and Runes.
- **Chronomancy has no counterpart in the game.** Adding it would be new design.

### 3.7 Necromancy and the afterlife — PROVISIONAL (source not found)

*Volume I* says necromancer lore was discussed before, but that its original names and myths could not be recovered. This project has no record of it either. It stays PROVISIONAL *(source not found)* until Sola points to the original or approves the expansion as new canon.

The proposed expansion: death is a transition. The body returns to the world and the essence crosses the Veil, but some crossings are incomplete. Memories cling to places, spirits to objects, and souls to unfinished duties or broken rituals. Necromancy studies these. It has three forms: **Spirit Communion**, **Corporeal Binding**, and **Soul Manipulation** (the most dangerous). The forbidden question is "What happens when someone returns from death?" Some return whole, some incomplete, some are not who they claim, and some bring something back. Necromancers are not automatically villains. Societies variously execute them, employ them to investigate deaths, use them to speak with ancestors, or restrict them by religious law. The received text ends here, mid-sentence.

*Fit:* this is the closest fit in Volume I. The CANON Thorngate already sends souls to rebirth or eternity. The game has Nyx, "keeper of lingering souls", in the Veilmoor, plus Liches, Ghouls, Shades, the Death element, and grave offerings. Spirit Communion matches the game's existing "honour the dead" deed.

## 4. DEPRECATED

Prototype names that are still inside the code but are not lore. They must not appear in stories, scripts or new content. In the new code they are replaced by the current names (Phase 1, with a save migration).

| Deprecated | Replaced by | Where it survives |
|---|---|---|
| `bramble` | Elash | Resident id in `NPCS`, saves |
| `durgan` | Runekar | Resident id in `NPCS`, saves |
| `selune` | Caelithra | Resident id in `NPCS`, saves |
| `vael` | Thorngate | Land id in `REG`, saves |
| `greenmere` | Erelian | Land id |
| `coral` | Aethwyn Mere | Land id |
| `skyreach` | Vetharn's Pass | Land id |
| `stonedeep` | Runekar's Deep | Land id |
| `moonwell` | Caelithra's Moonwell | Land id |
| `frostfell`, `ember`, `sanctum` | Hrimwold, Cindral Wastes, Dawnspire | Land ids |
| `hollow` | The Veilmoor | Land id. Also clashes with *Volume I*'s realm of the Hollow (3.2) |

Sola decides any further DEPRECATED lore, such as story content from older prototypes. No narrative content has been deprecated yet.

## 5. Decisions for Sola

- [ ] Send the rest of Volume I (it stops in section 13) and any original necromancer lore.
- [ ] Approve, change or reject each Volume I part (3.1–3.7). Approved parts move to CANON; rejected ones are removed or marked DEPRECATED.
- [ ] Choose: does the Thorngate stand on the Veil, and is Aelarion its keeper?
- [ ] Resolve the Hollow clash: the Veilmoor (code id `hollow`) versus Volume I's realm of the Hollow.
- [ ] Accept or reject the land-to-region mapping in 3.4.
- [ ] Decide whether "Eldari" is the in-world name for Elves, and whether Veyr, Drakari and Hollowborn become playable kinds.
- [ ] Decide whether the six disciplines become in-world schools over the existing magic system.
- [ ] Confirm the roles of Caelithra, Runekar and Elash, and the mermaid queen's name.
- [ ] Choose the tone balance between the cozy lantern-lit play and Volume I's ancient-mystery darkness.
- [ ] Decide the spelling: Erandel or Aerandel.

## 6. Notes

- The images in Volume I are links to pictures from other websites (World Anvil, Deep Dream Generator, Fiverr, Wallpapers.com and others). They are kept as links in the source file for mood only. They are other people's work and must not be used as game or book art.
- Nothing in the game was changed for this update. When a decision above is made, the game change goes through the Phase 1 plan and the matching GDD.

## Change log

| Date | Change |
|---|---|
| 2026-11-05 | Register created. CANON listed; v0.4.1 game content and *Volume I* (Parts I–VI, received truncated) recorded as PROVISIONAL with fit notes; prototype ids recorded as DEPRECATED; decisions listed. Categories CANON / PROVISIONAL / DEPRECATED set by Sola |
