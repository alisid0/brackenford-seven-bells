# Theme Selection & Builder Spec: The Silent Peal

Evaluated ChatGPT's four directions (`design/theme-directions.md`, `assets/concepts/theme-a.jpg`–`theme-d.jpg`, `6addbb9`) against `src/game.js`, `design/world-plan.md`, `design/place-plans.md`, and `design/replay-plan.md`.

## 1. Choice & Scored Comparison

**Chosen theme: `B · The Silent Peal`** (adopting minimal dark-plum thorn-blight clusters around silent bells from `Asset-and-XR-list.md` `E7` so restoration reads clearly even with sound off).

| Criterion (1–5) | A · Sluicekeepers | **B · Silent Peal** | C · Lost Road | D · Shadow Migration |
|---|---|---|---|---|
| One story across all 6 places | 4 | **5** | 4 | 4 |
| Gives every stage (rings & shades) a reason | 3 | **4** | 3 | 2 |
| Visible restoration from stationary stance | 4 | **5** | 3 | 2 |
| VR-only moment in every place | 3 | **5** | 2 | 3 |
| Low asset & code cost (Quest `72 fps`) | 2 *(water sim)* | **5** *(1 belfry + bell)* | 4 | 2 *(shadows + journal)* |
| Works cleanly with sound OFF | 5 | **4** *(with thorn/ribbon flip)* | 5 | 4 |
| Fits existing code & names | 2 | **5** *(bells, Bellward, Bonus Bell)* | 2 *(implies walking)* | 2 *(only 2 shade species)* |
| Survives 30+ sittings of repetition | 3 | **5** *(shooting a bell stays fun)* | 3 | 3 |
| **Total (max 40)** | **26** | **38** | **26** | **22** |

## 2. Theme Rules for Builders

- **One-sentence premise:** Six valley storm bells once carried warning notes from Willowbank to Stormcrest; thorn-blight and shade crows bound them silent, and the archer clears each station and rings its bell with an arrow to restore the valley's peal.
- **Recurring motif — The Forked Belfry:**
  - **Frame:** Outward-splaying `Y`-fork timber posts (`#825435`), `1.4 m` base width, `2.2 m` horn span, **`3.2 m` tall**, crossbeam at `2.3 m` with dark iron straps (`#3b3538`).
  - **Bell:** `0.75 m` tall × `0.65 m` rim diameter, hung at `y_base + 2.1 m` (reuses `src/game.js` bell swing physics & `bellSound(tone)`).
  - **Signal ribbon:** Cream cloth (`#f6e6bd`) with banner-red hem (`#ae493d`), `0.22 W × 1.1 L m`, tied to the right post.
  - **Pentatonic valley scale:** Willowbank `523 Hz (C5)` · Pier `587 Hz (D5)` · Quarry `659 Hz (E5)` · Alderwood `784 Hz (G5)` · Bellward `880 Hz (A5)` · Stormcrest `1047 Hz (C6)`—any subset harmonises.

### Exact Placement Across All 6 Places (Never Inside Shooting Area or Behind a Target)
| Place | Bell Name & Note | Position `(along, right, y)` | Bearing & Dist | Clear Of |
|---|---|---|---|---|
| **1. Willowbank** | Practice Bell (`C5`) | `(22, +12.5, 0)` | `29.6° R · 25.3 m` | `±9 m` strip & `(15,+5.5)` (`20.1° R`) |
| **2A. Reedwater Pier** | Fog Bell (`D5`) | `(19, -11.5, +0.3)` *(own piling)* | `31.2° L · 22.2 m` | `(15,-4)` (`14.9° L`) & pennant (`37.7° L`) |
| **2B. Flint Quarry** | Shift Bell (`E5`) | `(18, -11.0, -2.0)` *(left shelf)* | `31.4° L · 21.1 m` | `±7 m` benches & pennant (`40.4° L`) |
| **3A. Alderwood** | Trail Bell (`G5`) | `(18, +11.5, 0)` *(right nook)* | `32.6° R · 21.4 m` | `±8 m` glade & board (`41.3° R`) |
| **3B. Bellward Village** | Watchtower Bell (`A5`) | `(31, -9.5, +2.8)` *(far-left wall)* | `17.0° L · 32.4 m` | Past `27 m` crow lane & `(24,-1)` (`2.4° L`) |
| **4. Stormcrest** | Storm Bell (`C6`) | `(30, -11.5, +1.5)` *(left crag)* | `21.0° L · 32.1 m` | Past `24 m` crow lane & `(35,-5)` (`8.1° L`) |

- **Two States & Moment of Clearing (Works Muted):**
  - **Silent (before place cleared):** Matte dark-iron bell (`#3b3538`) bound in dark-plum thorn vines (`#4A2943`) with a small perched shade-crow silhouette on the horn; cream ribbon lashed flat & limp; coiled rope at base. Shooting it before clear yields a dull muffled thud (`110 Hz`).
  - **Clearing beat (VR signature moment):** Earning `≥1★` on the place's final release stage snaps the thorn vines into dark chips, sends the perched crow off, and turns the bell gleaming **bronze (`#ae783e`) with gold rim (`#f0c75a`)**. The player looses **one ceremonial arrow into the unlocked bell** (or auto-rings on `NEXT`): the bell swings `±25°`, its cream-red ribbon unties to stream in the wind, three brief flat cream-gold ripple chevrons expand off the rim (readable muted!), `bellSound(tone)` rings out, and any previously restored valley bells flash on the horizon.
  - **Restored (permanent):** Gleaming bronze/gold bell, thorns gone, ribbon flying free; shootable anytime between stages for a chime.
- **Blight & Recession per Place (Cheap Flat-Shaded Geometry):** Dark-plum thorn clusters (`#4A2943`) sit only around the silent belfry and 2–3 flank props (never on targets): clearing Willowbank swaps flank thorns for wildflower dots; Pier thins morning lake mist; Quarry clears wall thorns and brightens sand strata; Alderwood opens warmer dusk light through the 3 far tree gaps; Bellward drops shadow crows off cottage eaves and raises red-cream arch banners; Stormcrest parts blue-hour storm mist into clear dawn light.
- **Stormcrest Finale:** Ringing the Storm Bell (`1047 Hz`) triggers a rolling 2.5-second **six-note valley peal (`C5→C6`)** with visible golden shimmer pulses answering from all five distant stations below, parting the storm clouds and raising the **Finale Cloth Banner** (`"The Peal Is Whole · ★ X/51"`) with direct buttons to **Held-Back Master Stages** and **Score Attack**.

## 3. How the Theme Touches Existing Systems

| System | Integration |
|---|---|
| **Stars** | `≥1★` on all release stages in a place unbinds its bell; 100% `★★★` gilds its belfry crest & earns the Place Crown. |
| **Mastery Ribbons** | Styled as embroidered cloth **bell-ribbons** (`Clean Quiver`, `Dead-Eye`, `Swift Banish`, `Pure Bow`) hung on the stage card. |
| **Keepsakes** | Awarded when each bell is rung and displayed on the Overlook rack; retires unused `coins`. |
| **Relief Map Table** | Each place shows a miniature forked belfry pin (thorned/locked → matte iron/open → gleaming bronze+ribbon/restored); pointing at a restored place softly chimes its note. |
| **Daily Trial** | Framed as **"Today's Watch"**—a seeded 90 s drill keeping an unlocked bell station clear. |
| **Special Arrows & Arcade** | `Rime`/`Gale`/`Kiln` are the Bellwarden's weather/blight arrows; Score Attack's `+50` **Bonus Bell** directly echoes the core motif. |
| **First Menu & Overlook** | Occasional distant valley bell audio (`first-menu.md`) comes directly from restored bells; Overlook banner posts echo the forked joinery subtly. |

## 4. Asset Additions & Contradictions

| Addition | Route | Size | Notes |
|---|---|---|---|
| Forked belfry frame (`H8b`) + 6 map micro-pins | Code | **S** | ~180 tris, shared across all 6 places |
| Signal bell (`H8a` silent/restored mats) | Code first | **S** | Reuses `src/game.js` bell geometry & swing physics |
| Cloth pull-ribbon (tied / streaming) | Code | **S** | ~16 tris; respects `Scenery sway` |
| Thorn-wrap cluster (`E7`) + flat ring-pulse cue | Code | **S** | ~80 tris; opaque flat chevrons (no alpha spheres) |
| Ceremonial ring beat + valley echo chord | Code | **M** | Reuses `bellSound()`; triggers on place clear & finale |

- **Replaces / resolves:** Replaces roaming `"Seven bells sleep in the vale"` (`src/game.js` L264) with 6 place bells (leaving room for a 7th Great Bell at Update 5's boss); retires unused `coins` (`replay-plan.md` L94); brings `H8a/H8b` forward from Update 5 into Update 2 as cheap code props first.

## 5. Questions for ChatGPT & Critiques of `theme-a`–`theme-d`

- **Critiques of the four pictures:** (1) All four draw a curved recurve bow instead of the agreed straight launch bow (`Project-notes.md` #12); (2) `theme-a.jpg` draws an ordinary brown hare instead of dark plum `#4A2943`; (3) `theme-b.jpg`'s silent bell cue (perched crow + coiled rope) is too subtle at `25 m` muted without thorn-wraps and a clear dark-iron→bronze/gold flip; (4) `theme-d.jpg`'s detached shadows read as extra hittable targets; (5) `theme-c.jpg`'s paved valley road implies free walking.
- **Questions for ChatGPT (look ownership):**
  1. Exact muted-iron vs restored-bronze/gold hexes so silent→restored reads clearly at `25–32 m` on Quest (confirming gold rim is valid as a place-clear reward).
  2. Thorn-wrap density around silent bells so it reads as "bound" at `25 m` without turning into a dark blob in dusk Alderwood.
  3. Exact look of the muted-play flat cream-gold ripple cue around a rung bell (keeping zero transparent spheres).
  4. Whether the Overlook hub holds a quiet 7th "Home Bell" beside the banner (echoing "Seven Bells") or keeps strictly six.
