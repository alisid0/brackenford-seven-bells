# Willowbank Range: the art pass (stage 2)

The developer asked for the work to go "step by step, like proper game development" and said to start. The stages agreed: 1 block-out (plays right), 2 art pass (assets to the approved plan), 3 lighting and colour, 4 animation, 5 polish; one place at a time, each stage behind a switch, the developer checking between stages.

This page tracks stage 2 for the first place. **Switch:** `?world=2` (or `"world": 2` in `src/config.json`). Off by default; with it off the range is exactly as before. It now works on the release's 17 stages as well as on all 29.

Renders: `assets/renders/world2-player-near.jpg`, `-player-far.jpg`, `-above.jpg`, `-side.jpg`, `-line.jpg`, `-player-grass.jpg`.

## Against the plan (`design/world-plan.md`)

| Item | Plan | Built | State |
|---|---|---|---|
| Lane | 16 m wide, level to 43 m | Same; ground levelled under it | Done |
| Creek at 38 m | 2.4 m of water, sandy banks | 3 m band, broken sand patches, stones | Done (a little wide) |
| Terraces | 43, 53, 63, 72 m; 16 m wide; +0.7 m each | Same, exactly lane width; each end now falls to the meadow as a grass bank (ChatGPT's note on the aerial view) | Done |
| Footbridge | 38 m out, 12.5 m right | 13.5 m right | Done (1 m off) |
| Blossom trees | (31, 17.5 left) and (46, 17 right) | Same | Done |
| Rail | 6 m wide, 0.9 m ahead, 0.85 m high | Same | Done; height untested on a headset |
| Archer's stand | 1.5 m square; later designs: a deck over a channel, 2 m up | A timber deck flush with the ground | **Partly.** Raising it changes every aim angle, so it waits for the playtest |
| Stall | 1.5 m behind the line, 10.5 m left | Same | Done |
| Scoreboard | (2.5, 10.2 right), 3.6 m wide cloth | Cloth, 3.6 m wide, at (12.5, 9.8 right) | **Moved on purpose:** at the plan's place it is 76 degrees round to the side. Gemini's later rule for the other places keeps boards inside 42 degrees; this follows that |
| Wind pennant | (8, 9.8 left), red and cream stripes | At (11, 9.8 left), still the old plain orange | **Partly** |
| Lake, jetty, path | Jetty at (14, 16.5 left), path from the stall | Jetty and a stepped path; the lake is the old world's lake, which happens to lie on that side | Done, roughly |
| Village and watchtower | 82 to 98 m out, 18 to 38 m right, on a rise | Three round thatched huts and a tower with a red roof, standing on the old world's ground there | Done as simple shapes |
| Practice Bell | (22, 12.5 right) | Same (on the old range it stands to the left; here the board no longer blocks it) | Done |
| Skyline | Plum ridge | The old world's pale hills | **Stage 3** |

## Not in this stage, or not yet

- **Sky, light, haze and palette** (stage 3). The grass, trees and sky outside the lane are still the old world's.
- **The old world's own furniture** near the range (a tall dark pine by the scoreboard, the climbing wall and tower, the old bells' poles) is still standing.
- **Assets are simple code-built shapes.** Huts, tower, jetty and bridge are first versions for ChatGPT to judge, not finished models.
- **The stand is not raised** and there is no channel under it.
- Nothing here has been seen in a headset or played by a person.

## ChatGPT's review of the first renders (22 November 2026)

It opened all six renders. Written down by Claude.

**Stage 2, shapes to fix first (all three now done; renders `world2-village.jpg`, `world2-bridge.jpg`):**

| Asset | Its note | What was changed |
|---|---|---|
| Watchtower | The red cap reads but the legs are too slender to give the skyline character | Thick posts, X-braces front and back, a gallery deck wider than the legs with a low rail under the roof |
| Huts | Should read as buildings from the line | A low roof with a deep overhang in two bands of thatch; a recessed timber doorway with a frame |
| Footbridge | From the side it looked like a flat plank with wire rails | A crowned deck, thick posts with one solid handrail a side, stone abutments at both ends |

**Stage 3, its starting values (not applied; stage 3 has not started):**

| Element | Setting |
|---|---|
| Sky | Zenith `#7798BD`, horizon `#E4B7AA` |
| Clouds | Faces cream `#F6E6BD`, undersides `#D8BAC2` |
| Sun | Warm peach `#FFD1A0`, strength 1.25, 22 degrees up, 45 degrees to the left of the shooting direction |
| Fill | Cool `#BCC8E0`, strength 0.65, so shaded timber and plum shapes stay readable |
| Haze | Dusty mauve `#BBAAB9`; begins at 110 m, complete at 650 m, replacing the grey-green band |
| Meadow outside the lane | Base `#91A454`, lit `#A5B662`, shaded `#788D48`. The scattered dark spikes become sparse short grass close to the ground colour; tall shapes are kept for cover that matters to play |
| Hills | Three layers: near `#788950`, middle `#89748F`, far plum ridge `#A28AA5`, the farthest the lightest |
| Water | Lake `#527F9A`, creek `#648FA7`, sun-facing edge `#9ABBC4` as a few broken opaque shapes |

**Where the glow goes:** locked gold `#F0C75A` on the restored bell's lip and the small centre of the bullseye; a few short cool highlights on the water's sun-facing edge. All flat and opaque. **Kept matte on purpose:** the silent bell, thorns, the targets' outer rings, banner trim, blossoms, broad water. Saturated ember `#E02E32` stays with the shades' eyes so they remain the strongest warm points.

## Gemini's audit: arrived, and acted on

After the developer said to skip it, the audit came through anyway (the developer answered the prompt in Antigravity): `design/willowbank-art-audit.md`, PR #21. What was done with it:

| Finding | Action |
|---|---|
| Scoreboard's posts stayed at the old width when the cloth was made smaller, so a post stood in front of the bell | Posts now follow the cloth; board moved to (12.5, 11.2 right), as Gemini ruled. On a desktop screen its right edge runs off the frame; in a headset it is a glance to the right |
| Jetty on dry land; creek ending in grass at both ends | A cove of the lake carved in on the left from 2 to 45 m; jetty moved to (14, 19.5 left); creek narrowed to 2.4 m, running from the cove to rocks past 36 m on the right |
| Old climbing tower beside the stall; old hamlet, bell shrines, straw rounds | Everything the old world adds to the scene is hidden while shooting on Willowbank |
| Cream huts behind right-hand targets; tower hidden behind the blossom tree | Huts to (84, 25), (90, 31), (95, 26); tower to (88, 29); right blossom tree to (46, 21.5): Gemini's numbers |
| Old trees and tufts by the board, bell, left flank and village | Cleared in those areas |
| The bell's "unbound" line was overwritten by the result's line | Fixed: it is now said last |
| Old sliding-round frame in front of the bell on the old range | Hidden while shooting whenever the bell is on |
| A bank behind the last terrace | Added |

**Not done from the audit:** red-and-cream stripes on the wind pennant; the old world's dirt paths and a stray puddle; rocks and trees on the far rim. The left blossom tree was moved to (31, 13.5 left) to keep it out of the new cove, which the audit did not ask for.

**Stage 3 numbers settled** (22 November): Gemini's sun direction, 120 degrees left of the shooting direction, so the target faces are lit and the sun is out of the aiming view; 25 degrees up; ChatGPT's colours throughout; linear haze from 110 m to 480 m. ChatGPT agreed in one message. Its order of fixes: the grey-green horizon band, then the neutral noon light, then the flat yellow-green ground.

## Stage 3, first pass (built, switch `grade`, off by default)

`?grade=1` or `"grade": true` in `src/config.json`. All values are in `LOOK` in `src/game.js`. On: the day stops turning and a fixed late-afternoon sun stands behind the archer's left shoulder; peach key `#FFD1A0`, cool fill `#BCC8E0`; sky `#7798BD` over `#E4B7AA`; cream clouds with dusty undersides; mauve haze `#BBAAB9` from 110 to 480 m; the meadow in `#91A454`, `#A5B662` and `#788D48`; the lake `#527F9A`; grass tufts shorter and close to the ground's colour; the valley's rim coloured in three bands by height (`#788950`, `#89748F`, `#A28AA5`) in place of grey rock and snow. Strengths were raised from ChatGPT's figures (key 3.4, fill 1.7 in this engine's units) because a sun 25 degrees up lights flat ground less than half as much as the old high sun did. Pictures: `assets/renders/grade-world2-*.jpg` beside the ungraded `world2-*.jpg`.

**Not done:** no cast shadows; the lane's own lawn colour, the props, trees and water edge are not regraded; no gold accents on the bell lip or bullseye; the rim reads as one plum wall with soft bands, not three separate ridges; ChatGPT has not judged it; not seen in a headset.
