# Ticket for Gemini: the shade ram

From Claude, on the developer's word. Branch: `gemini/ram-pass` cut from `release-prep`. Commit as `Gemini 4 Neon <gemini@noreply.invalid>` and push only that branch; Claude reviews, tests and merges.

## What exists

- The model: `assets/staging/shade-ram-rig-turned.json` (Tripo, 3,312 triangles, 35 bones, turned to face +z by `tools/turn-ram.mjs`; +x is its left; one unit tall with its horns). Concept: `assets/concepts/d3-shade-ram.jpg`.
- In `src/game.js`: `RAM_RULE` (numbers), `RAM_RIG` (recolouring), `RAM_LEGS` and `ramPoseOf` (the whole animation, one pose from `cyc`, `go`, `paw`, `rear`, `t`), `ramSet`, `ramStep` (behaviour). Rules in words: `design/bell-watch.md`, "The shade ram".
- Checks: `tests/ram.html` (behaviour; must still pass) and `tests/creatures.html?only=ram` (draws the three moves; `?poses=` tries loose poses). Pictures of today's result: `assets/renders/d3-ram-*.jpg`.
- Bones, as read from their positions: `0_Right_Limb_0` hips, `Spine_0` chest, `Head_0` neck, `Head_1` head; horns `Head_2`-`Head_6` (its right) and `bone_16`-`bone_20` (its left); tail `bone_1`, `bone_2`; forelegs `Spine_1`, `bone_28`-`bone_30` (left) and `bone_23`-`bone_26` (right); hind legs `0_Right_Limb_1`-`_4` (right, from the hip) and `0_Left_Limb_0`-`_3` (left, hung from `Root` and starting below the hip).

## The four jobs

1. **Colour.** Today every face is plum `#4A2943` to `#6D3362` by how light Tripo's face was, with ember eyes `#E02E32`. Give it parts: horns a step lighter and ridged in tone along their length, hooves near-black, a darker muzzle and belly, the back spikes picked out. Stay inside the locked palette in `design/theme-look.md`; it must still read as a shade (plum body, ember eyes) beside the hares. Faces can be told apart by which bones they are tied to.
2. **Left hind leg.** Tripo gave it no hip: it only turns from the joint below. Repair it so it swings from the hip like the right one, either with `tools/patch-rig.mjs` (mirror the right leg's bones and weights) or another way you can show works. Write the repaired file beside the original, not over it.
3. **Feet that do not slide.** The trot in `ramPoseOf` is a plain swing. Make the planted feet stay put as it walks at `RAM_RULE.speed`, as `src/moves.js` does for the hare (`stride` is the metres covered by one cycle). Keep the three moves: stand and paw, slow heavy charge with the head down, rear at the bell.
4. **Numbers.** `RAM_RULE` is Claude's guess: first ram 20-30 s in, then every 30-45 s, none in the last 20 s, 4 s of pawing, 2.6 m/s, 300 points, three bands at once. Say what you would change and why, against the rest of Bell Watch (`WATCH_RULE`, `WATCH_BELL`). Put the reasoning in `design/ram-numbers.md`; change the numbers themselves only if you are sure.

## Limits

- Do not change the ram's rules in `design/bell-watch.md`'s "Refused" list: no harm to the player, no lost points.
- Do not touch anything outside the ram's code, its files and its tests.
- Keep the `ram` switch working: with `?ram=0` nothing of it exists.
- If you cannot look at pictures, say so in your commit message; ChatGPT and Claude will judge the look.
- Rebuild with `node src/build.mjs ../Brackenford-Bell-Trial/Brackenford-Archery.html` only if that folder exists on your side; otherwise leave the built file alone and Claude rebuilds.
