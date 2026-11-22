# Willowbank Range — Stage 2 Art Pass Audit

Audited against `design/world-plan.md`, `design/willowbank-art-pass.md`, `design/theme.md`, `src/game.js` (`WORLD2` / `PEAL`, `c0cb17e`), and all six renders (`assets/renders/world2-player-near.jpg`, `-player-far.jpg`, `-above.jpg`, `-side.jpg`, `-line.jpg`, `-player-grass.jpg`).

---

## 1. Plan vs Built & Renders

| Item | Verdict | Findings & Required Change |
|---|---|---|
| **Lane (`16 m` wide, level to `43 m`)** | **MATCH** | Levelled strip & broken edge shoulders read cleanly in all renders. Stage 3 will tune palette. |
| **Creek (`38 m`)** | **WRONG** | `3.0 m` wide (`36.5–39.5 m`, crowding `40 m` stands) and ends as a **floating hard-edged blue rectangle** short of the lake on the left and abruptly in open meadow on the right (`world2-above.jpg`, `world2-side.jpg`). **Fix:** narrow to `2.4 m`, extend left end into lake water (`right -34`, or carve lake cove east to `-16`), and tuck right end past `+35 m` into bank/trees. |
| **Terraces (`43, 53, 63, 72..76 m`)** | **CLOSE** | `16 m` lane width, `+0.7 m` steps, and sloped grass side banks match plan + ChatGPT's aerial note. **Fix:** add a gentle sloped back-berm (`76..81 m`) so Terrace 4 does not shear off above the lake (`world2-above.jpg`). |
| **Footbridge (`38, +13.5`)** | **CLOSE** | `1 m` right of plan (`+12.5`), good block-out arch; from POV (`19.6° R`) it currently stacks vertically under the right blossom and watchtower. Acceptable once right blossom & tower separate. |
| **Blossom trees (`31, -17.5` & `46, +17.0`)** | **CLOSE** | Left tree (`29.4° L`) is clean. Right tree (`20.3° R`) sits **directly in front of the watchtower (`20.7° R`)** (`world2-player-near.jpg`). **Fix:** move right blossom to `(46, +21.5)` (`25.0° R`). |
| **Rail (`0.9, -3..+3, 0.85 H`)** | **CLOSE** | Matches `world-plan.md`; keep `0.85 m` for now and lower to `0.75 m` at `1.05 m` (`design/vr-stand-rules.md`) if Quest seated test clips near targets. |
| **Archer's stand (flush `3.2 × 2.6 m` deck)** | **CLOSE** | Footprint exceeds `vr-stand-rules.md` (`≥ 2.4 × 2.2 m`) nicely. Keeping it flush (`H = 0`) with no channel until after the first Quest playtest is the right call. |
| **Market stall (`-1.5, -10.5`)** | **WRONG** | Code position is right, **but the old `7 m` climbing tower at `(-33, -14)` stands `1.6 m` away and physically swallows the stall** (`world2-above.jpg` bottom-left). **Fix:** hide climbing tower/wall when `WORLD2 && range.on`. |
| **Scoreboard (`12.5, +9.8`)** | **WRONG** | Cloth scaled `0.75` (`3.6 m`), **but posts stayed unscaled at `±2.35 m` (`src/game.js` L472)**, putting a floating detached left post at `29.7° R` straight through the Practice Bell (`29.6° R`, `world2-player-near.jpg`), while cloth edge (`31.6° R`) clips bell horn (`32.0° R`). **Fix:** set `WORLD2` posts to `±1.85 m` (top `g + 3.85`) and shift board to **`(12.5, +11.2)`** (`41.9° R`). |
| **Wind pennant (`11, -9.8`)** | **CLOSE** | `41.7° L` position reads well mid-draw, but flag is still plain orange `#e8743b` instead of red-and-cream stripes (`world-plan.md`). **Fix:** add red-cream striped flag geometry/canvas. |
| **Lake, jetty (`14, -16.5`) & path** | **WRONG** | **Jetty sits completely on dry dirt `~12–15 m` inland of the lake** (`world2-above.jpg`, `world2-side.jpg`)! **Fix:** carve a shallow lake cove east to `right = -16` along `along = 5..42` so both the jetty and the `38 m` creek meet real water (or move jetty out to actual shoreline `right ≈ -28`). |
| **Village & watchtower (`84..95, +20..+34`)** | **WRONG** | Huts 1 & 3 (`10.4°–15.8° R`) sit directly behind right-side ring targets (violating cream-hut rule), watchtower (`20.7° R`) stacks behind right blossom (`20.3° R`), and two random green trees block the huts. **Fix:** shift huts to `(84, +25)`, `(90, +31)`, `(95, +26)` and tower to `(88, +29)` (`15.5°–20.5° R`, clear of `14.3° R` rings and left of repositioned `25.0° R` blossom) and clear foreground trees. |
| **Practice Bell (`22, +12.5`)** | **CLOSE** | Plan coords match `design/theme.md`, but currently bisected by scoreboard's unscaled left post and backed by a random green blob tree (`world2-side.jpg`). **Code bug (`src/game.js` L1244–1246):** `showResults()` immediately overwrites `pealUnbind()`'s `say(...)` notice two lines later — guard L1246 so the unbind prompt survives. |
| **Skyline ridge** | **STAGE 3** | Currently old world's washed-out `EDGE = 372` grey rim dotted with floating tree/rock specks; replace in Stage 3. |

---

## 2. Sightline Audit (All 29 Stages from Eye `(0, 0, 1.6 m)`)

- **21 of 29 stages are completely clear** of every new prop (including all centre-lane, deep-terrace, `First marks`, `Stepping back`, `The drop`, `Three ranges`, `The long lane`, `A breeze`, `Crosswind`, `The gauntlet`, `Small bull`, `Storm lane`, `Far slider`, `Master of the line`, `First shade`, `The warren`, `Horns in the grass`, `Creepers`, `On the post` [3.5 m perch clears Hut 3 by `+0.8°`], `Flush`).
- **8 stages have a background overlap or obstruction** (`Sliding mark`, `Slide and breeze`, `Pop-ups`, `Quick marks`, `Crossing pair`, `Bolt`, `Flight line`, `Blighted meadow`). None has a prop *between* archer and target except **`Flight line` (#28)** vs the scoreboard & pennant!

### Worst Three Cases

| Rank | Stage(s) & Target | Prop & Exact Bearings | Problem & Fix |
|---|---|---|---|
| **1** | **`Flight line` (#28, held back)** — `cross` at `lane 15` (`along 13.5..16.5`, `right +9..+12`, `y 3.2..4.2 m`) | **Scoreboard `(12.5, +9.8)`** (`31.6°–44.6° R`, top `el +7.6°`, post `+9.1°`) & **Pennant `(11, -9.8)`** (`41.7° L`, `+6.6°`) | **Between archer and target:** scoreboard physically hides low right-side flyer entry/exit (`34°–39° R`, `el +4.8°..+7.6°`), and pennant pole crosses left entry (`41.7° L`). *(Moves to Bellward Village in 6-place journey; shifting board to `(12.5, +11.2)` with `±1.85 m` posts reduces right occlusion.)* |
| **2** | **`Pop-ups` (#10, `22,+4`)**, **`Quick marks` (#13, `16,+3`)**, **`Crossing pair` (#14, `18,+3.5`)**, **`Sliding mark` (#8, `15,+3`)** | **Village Huts 1 & 3** at `(84, +20)` & `(95, +21)` (`10.4°–15.8° R`, `el 0°..+3.2°`) | **Cream huts behind cream rings:** target right rims span `10.3°–14.3° R` (`el -2.4°..+3.2°`), directly over `#f1e2bd` hut walls. **Fix:** shift huts right to `right = +25..+31` (`≥ 15.5° R`), giving clean clearance past `14.3° R`. |
| **3** | **`Bolt` (#25, `[13..19, ±7]`)** & **`Blighted meadow` (#29, `cross lane 24`, `±12 m`, `y 3.2..6.8 m`)** | **Practice Bell `(22, +12.5)`** (`27.1°–32.0° R`) & **Blossom trees** (`25.5°–33.1° L`, `16.8°–23.6° R`) | In `Bolt`, hares at `(13, +7)` (`28.3° R`) run in front of the dark-iron bell base and at `(13, -7)` (`28.3° L`) in front of the left blossom trunk. In `Blighted meadow` (Release Stage 17), the `lane 24` flyer (`±26.6°`, `el +3.5°..+6.0°`) crosses the right blossom crown and enters behind the bell's left edge. **Fix:** moving right blossom to `(46, +21.5)` (`25.0° R`) opens the middle right sky (`17°–22° R`) for `Blighted meadow`. |

---

## 3. Ruling on Your Two Changes

1. **Scoreboard moved from `(2.5, +10.2)` (`76° R`) to `(12.5, +9.8)` (`38.1° R`):** **ACCEPT the `≤ 42°` move, ADJUST coordinates & posts.** You were right — `76°` is unreadable without turning away from the lane. Fix `src/game.js` L472 posts from `±2.35` to **`±1.85`** (top `g + 3.85`) and nudge the board to **`(12.5, +11.2)`** (`41.9° R` centre, left post `35.6° R`) so it stays inside `42°` and opens a crisp **`3.6°` sky gap** past the Practice Bell's right horn (`32.0° R`).
2. **Practice Bell on the OLD range (`WORLD2` off) moved to `(22, -12.5)` (left side):** **ACCEPT.** Putting it on the right on the old range hides it behind the `(11, +6.5)` green board; `(22, -12.5)` (`29.6° L`) clears the old pennant (`42.6° L`) cleanly. **One fix needed:** `src/game.js` L1291 currently sets `yardBits.visible = !(WORLD2 && range.on)`, leaving the old `Sliding round` timber gantry (`(16, -11.5..-2.5)`, `8.9°–35.7° L`) standing directly in front of the left-side bell when `WORLD2` is off — hide `yardBits` whenever **`range.on`** regardless of `WORLD2`.

---

## 4. Old-World Leftovers Visible in Renders (Actionable Hide List for `WORLD2 && range.on`)

| # | Leftover Visible In | Where in `src/game.js` | Action |
|---|---|---|---|
| 1 | **Climbing tower (`7 m` + gold mast)** swallowing Market Stall (`world2-above.jpg`) | L412–421 (`tx=-33, tz=-14`) | Group climbing wall + tower + mast into `yardBits` (or `oldWorld`) and hide when `WORLD2 && range.on`. |
| 2 | **Low grey climbing wall with yellow pegs** beside shooting line (`world2-line.jpg`, `world2-above.jpg`) | L407–410 (`-27, -17`) | Same group; hide when `WORLD2 && range.on`. |
| 3 | **Old `SITES` bell shrines, poles, pennants & stone towers** — `Lake isle bell` on island (`world2-player-near/above/side.jpg`) & `Old keep` tower (`world2-side.jpg`) | L325–344 (only `t.beacon` is hidden at L1291) | Hide each `SITES` root group when `WORLD2 && range.on` (not just its beacon). |
| 4 | **Old Hamlet huts & `"Seven bells sleep in the vale"` sign** (hut roof visible behind stand in `world2-above.jpg`) | L309–319 | Put in `oldWorld` group; hide when `WORLD2 && range.on`. |
| 5 | **Foreground/flank random trees** — tall dark pine & orange tree behind scoreboard (`world2-player-near/line.jpg`), green tree `2 m` behind Practice Bell (`world2-side.jpg`), green tree left of Terrace 1 (`world2-player-near.jpg`), two green trees blocking the village huts (`world2-above.jpg`) | L80 / L219 (`inRange2` only clears `|right| < 13`) | Widen `inRange2` tree/rock clear mask to include `(8..32, +10..+20)` (board + bell), `(35..55, -16..-8)` (left flank), and `(65..102, +14..+38)` (village sightline). |
| 6 | **Instanced old grass tufts** sticking up beside scoreboard/bell/stall (`world2-player-near/side.jpg`) | L257 (`updateGrass` uses `inRange2`) | Automatically cleaned by widening `inRange2` above. |
| 7 | **Old roaming dirt paths & stray right puddle** (`world2-above.jpg`, `world2-line.jpg` behind stand) | L128 (`pathDist` terrain colour) | Skip `pathDist` dirt painting inside `inRange2` when `WORLD2` is on; fill the tiny right puddle (`world2-above.jpg` far right) or ignore if outside POV. |
| 8 | **Distant rocks/trees speckling the upper grey rim** (`world2-player-near.jpg`, `world2-above.jpg`) | L212, L242 (`EDGE` slope `> 220 m`) | Skip spawning trees/rocks where `groundAt > 35 m` or hide beyond `200 m` when `WORLD2` is on (replaced by Stage 3 plum ridge). |

---

## 5. Stage 2 Exit Checklist (Before Handing Off to Stage 3)

1. Hide all 8 old-world leftovers above when `WORLD2 && range.on` (and hide `yardBits` whenever `range.on` so the old-range left bell is unobstructed).
2. Fix scoreboard posts (`±1.85 m`, top `g + 3.85`) and shift scoreboard to `(12.5, +11.2)`.
3. Carve shallow lake cove east to `right = -16` (`along 5..42`) so **jetty `(14, -16.5)` stands in water** and **narrowed `2.4 m` creek flows cleanly into the lake** (tuck creek's right end past `+35 m`).
4. Reposition Village Huts to `(84,+25)`, `(90,+31)`, `(95,+26)`, Watchtower to `(88,+29)`, and Right Blossom to `(46,+21.5)` — eliminates cream-hut target overlap and the `20° R` landmark stack.
5. Add red-and-cream stripes to wind pennant (`sock`) and a gentle back-berm behind Terrace 4 (`76..81 m`).
6. Fix `showResults()` L1246 overwriting `pealUnbind()`'s `say(...)` notice.
7. Re-render `world2-player-near`, `-player-far`, `-above`, `-line` to confirm clean sightlines and zero leftovers, then advance to Stage 3. *(Raising stand to `H = 2.0–2.5 m` over a feeder channel and `0.75 m` rail stay parked until after the first Quest playtest; merging `PROPS.belfry`'s 59 parts can happen before multi-place use.)*

---

## 6. Stage 3 Fixed Lighting & Fog Numbers (Before ChatGPT Sets Colours)

Lane vector `YARD = (-0.5, -0.866)` points **NNW (`330°` compass)**. Lock Willowbank's sun instead of cycling `DAY_SECONDS = 840`:

| Parameter | Fixed Value | Why |
|---|---|---|
| **Sun bearing (lane-relative)** | **`120°` left of lane** (over archer's back-left shoulder, `210°` compass SSW) | Keeps `sunDisc` completely outside the `±90°` forward aiming/glancing hemisphere (zero glare) while raking warm three-quarter key light across front target faces, terrace risers, Practice Bell, scoreboard, and huts. |
| **Sun elevation** | **`28°` (`0.49 rad`)** above horizon *(acceptable band `25°–32°`)* | Strong late-afternoon facet separation on flat-shaded low-poly shapes without flattening tops (`> 45°`) or darkening target faces (`< 18°`). |
| **Exact `sunDir` vector (`src/game.js`)** | **`V(-0.441, 0.469, 0.765)`** | Unit vector matching `120°` left of `(-0.5, -0.866)` at `28°` elevation. |
| **Light ratio (`sun : hemi`)** | **`2.0 : 1.1`** | Preserves crisp flat-shaded facet contrast without dark shadowed fronts. |
| **Fog type & range** | **Linear `THREE.Fog(color, 95, 360)`** *(replaces `FogExp2(0.0031)` on Willowbank)* | **0% haze** across the entire `0–76 m` lane, `70 m` target, and `84–95 m` village; pushes the `220–320 m` plum skyline ridge cleanly into `55%–85%` atmospheric depth without washing out mid-ground targets. |
