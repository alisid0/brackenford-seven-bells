# Project notes

The single place for status, decisions and rules. Updated whenever something is decided. Last updated 21 November 2026.

## Who is involved
- **The developer**: owns the game, makes final decisions, playtests on the Quest, signs in to services.
- **Claude**: code, build, tests, pipeline scripts, animation, documents.
- **ChatGPT**: design review, concept images, style sheet.
- **Tripo**: turns concept images into 3D models and rigs.

## Status
- **Trials** (17 stages): built, on the test site, all ten automated test suites passing. **Not yet played by a person from start to finish, and not yet tried on a real headset.**
- **Arcade**: planned in `Arcade-plan.md`. No code written.
- **Art pass, new assets**: planned. Nothing made beyond the first shade hare.
- **Mixed reality, global leaderboard**: not started.
- **Public site**: still serves the known-good build of 21 November.

## The next step
The developer's Day 1 playtest on computer and Quest, using `Day-1-test-sheet.md`. Everything else waits on it.

## Decisions made

### Scope and order
1. Ship the existing three.js game as an early build within seven days. A restart in Unity was rejected.
2. The release is Trials: 17 of the 29 stages, in the order set in `src/config.json`. The order stays adjustable until playtesting confirms it.
3. After release: Update 1 Arcade; Update 2 visual polish; Update 3 bows, coins and upgrades; Update 4 shades that fight back; Update 5 first boss; later, mixed reality, global leaderboards and a wider world.
4. Arcade is the first gameplay update. Art work runs alongside only where it does not delay it.
5. Mixed reality is an experiment behind its own switch. It may come earlier if the prototype works on a real Quest.
6. A global leaderboard waits until scores can be validated and a service exists.

### Design
7. The core of the game is the bow: draw, aim, release, see the hit. Little walking.
8. Targets include shades: dark, thorned, corrupted woodland creatures with ember-red eyes. No real animals are harmed in the fiction. Shades never become goblins or human enemies.
9. A shade's glowing eyes are enough to mark it; no bubbles or outlines.
10. A replay plays for a bullseye or the last arrow of a stage; on long lanes, only the closest arrow, even a miss.
11. Two draw modes: two-handed and single-handed. Left- and right-handed bows with a different grip for each.
12. The bow is a straight bow with a normal mechanism.
13. Endless Survival arrow rule, confirmed by ChatGPT: start with 10; a qualifying hit returns its arrow, a miss costs it; every fifth hit in a row adds one, to a cap of 12; a 15-minute limit. Only a missed shot costs an arrow; a target that leaves unhit costs nothing until run lengths have been measured. The numbers are starting values. Full arrow accounting is in `Arcade-plan.md`.
14. Score Attack runs on a fixed timetable so every player meets the same targets at the same moments, at any frame rate.

### Art and assets
15. One style: flat-shaded low-poly, one colour per face, no textures, a locked palette. Warm colourful world, dark shades.
16. Creatures and complex props go through ChatGPT image, then Tripo, then Blender scripts. Simple or repeated props are made in code.
17. All creature animation is written in code. No recorded clips.
18. Cosmetic randomness is free; anything that affects aiming is seeded and independent of frame rate.
19. Graphics budgets are provisional until measured on the headset.
20. A style sheet is made with ChatGPT Images before the next Tripo creature. Its three example assets are the standing shade hare, the Thornwood bow and the market stall.
21. Shade family: hare, crow, fox (weaves), boar (side shots), stag (first to fight back), and the Hollow Stag boss, which must look distinct from the stag. The water shade is deferred.
22. Arrows: Standard, Bodkin, Swift, Bell and Tracer. Ember is deferred. Arcade uses one fixed bow and the standard arrow in its first ruleset.
23. Bows: recurve and longbow are built in code from the present bow; the Thornwood and Bellwarden's bows go through Tripo. All share the same grip, rest and string points.
24. Mixed reality starts with "the window": one stationary lane seen through a wall, after release.
25. Arcade is not part of the launch and has no Day 5 decision. Day 5 decides the desktop and Quest release only.
27. VR presence is a design pillar. After release, stages gain shooting positions that use height, depth and water: a tower top, a cliff ledge, a rope bridge, a creek crossing, a jetty and boat, a bell tower. These are places to shoot from, not long walks, and every one has a comfort option (height off, sway off, fade or walk). Listed in `Asset-and-XR-list.md`.
28. Concept images for the theme, title menu and interface kit are being made with ChatGPT now, one at a time, each approved by the developer. They are pictures only: no game change before release, and nothing goes to Tripo until ChatGPT has reviewed it.
26. Which Quest failures allow an "experimental" VR label, and which mean the Enter VR button is withheld, are defined in `Release-checklist.md`.

## Standing rules
- The public site is not changed, and nothing is merged to `main`, without the developer's explicit approval.
- New features stay on `release-prep`, behind switches, until accepted.
- No new gameplay features or 3D assets before the release.
- No Arcade code until the first headset playtest has been reviewed.
- Only real game screenshots in promotional material.
- The title is a setting in `src/config.json`, not final until an availability check and the developer's approval.
- No claim of mixed-reality support until it has been tested on Quest hardware.
- No claim that work is done unless it was done; say what was and was not tested.
- No secrets, keys or private files in the repository.
- This repository is public for now and will be made private before release.

## Open questions
- Is the name "Bow & Shadow" free to use?
- Is the first hare, generated before the Tripo subscription began, marked private and commercial in the Tripo account?
- Which Quest model and which input methods will the release page claim? Answer: only those tested in the Day 1 playtest, once it is done.
- Which Tripo rig preset suits a bird? To be tested on the crow.

## Answered
- Can an arrow score after its target's window closes? Checked in the code: a hit is decided when the arrow arrives. A shade stops being hittable the instant it hides or leaves; a pop-up stays hittable for about a twentieth of a second while it folds. So a well-aimed arrow that arrives late passes through and counts as a miss. Arcade treats that case as void (arrow returned, no score); see `Arcade-plan.md`.

## Known gaps
- No real frame-rate figure from a Quest.
- Replay comfort, the guide board, the stage stick and handedness are unverified in a headset.
- Tripo and ChatGPT must be signed in on the developer's home computer before any new asset can be made.

## Concept images (with ChatGPT)
For the interface, the developer has left the choices to Claude and ChatGPT, to be made on colour and design theory from the approved menu and style sheet, one small step at a time. For other proposals: 4 to 8 clearly different variants, labelled A, B, C and so on. The developer picks one or mixes parts of several, and ChatGPT then makes one combined final version. The palette from the style sheet is locked.

| Image | File in `assets/concepts/` | State |
|---|---|---|
| 1. Theme and style sheet | `style-sheet-v1.jpg` | Approved as the starting point; palette locked. The curved bow in it is illustrative only |
| 2. Title menu, variants A to D | `title-menu-a.jpg` to `title-menu-d.jpg` | The developer chose C: the cloth banner tied between two posts |
| 2. Title menu, final | `title-menu-final.jpg` | Approved by the developer |
| 3. Interface kit, variants A to D | `set-aside/interface-kit-a.jpg` to `-d.jpg` | Set aside: they looked alike and did not match the menu |
| 3. Interface, step by step | `kit-step1-controls.jpg` to `kit-step6-comfort.jpg` | All six sheets done; see `Interface-design-rules.md` |
| 4. View from the watchtower, variants A to D | `watchtower-a.jpg` to `watchtower-d.jpg` | Waiting for the developer. Only A reads as high up; B, C and D look like a ground-level porch |

## Asset concepts (for Tripo)
The developer set the watchtower view aside on 21 November 2026 and asked for asset concepts first; the game's visual design follows once a few assets exist. One asset at a time, one image each. Nothing has been sent to Tripo yet.

| Asset | File in `assets/concepts/` | Type | Tripo settings (from ChatGPT) | Must check |
|---|---|---|---|---|
| D1 Standing shade hare | `d1-shade-hare-standing.jpg` | Rigged quadruped, 0.45 m to the ear tips | Image to 3D; triangles 1,500 to 3,000; auto-rig "Other" | Forelegs have separate bones; ears, tail and thorns not fused |
| D2 Shade crow | `d2-shade-crow.jpg` | Rigged bird, 0.4 m long, 0.9 m wingspan | Image to 3D; triangles 1,500 to 3,000; rig preset unverified | Shoulder, elbow and wrist joint in each wing; one flap and one fold |
| A4 Thornwood bow | `a4-thornwood-bow.jpg` | Static, 1.5 m | Image to 3D; triangles 2,000 to 3,000 | Symmetry, straight centreline, tip notches. Claude's view: this shape is a thin straight stave, which Tripo handles poorly and code handles easily, so build it in code from this picture |
| H6 Market stall | `h6-market-stall.jpg` | Static, 3 m wide, 2.6 m tall | Image to 3D; triangles 1,200 to 1,500 | Counter opening clear, awning points intact, plank lines on the back wall |

The creatures came out a brighter purple than the dark plum of the style sheet. That is corrected by the palette snap in the Blender step, not by redrawing.

## Props built in code
Decided by the developer on 21 November 2026: static props are built in code; creatures go to Tripo. The code is `src/props.js`, which is not part of the game build. `tests/props.html` draws each prop and saves pictures to `assets/renders/`.

| Prop | Triangles | Size | Attachment points | State |
|---|---|---|---|---|
| A4 Thornwood bow | 344 | 1.5 m | grip, arrow rest, top nock, bottom nock | Reviewed twice by ChatGPT; approved for use after release. To check when fitted: the game's string sits in both notches |
| H6 Market stall | 605 | 3.3 m wide, 2.6 m tall, 2.1 m deep | counter, keeper's spot | Reviewed twice by ChatGPT; approved for use after release |

ChatGPT's first review asked for four changes, all made: the stall's upper brace now meets the rafter; the awning cloth hangs straight before its points; the bow's ember veins lie flush in the wood and taper at both ends; the thorns are broader and blunter, and the string notches are visible.

Not yet done: neither prop has been placed in the game or seen in a headset.

## Creatures made in Tripo (21 November 2026)
Both went through the full pipeline: ChatGPT concept, Tripo image-to-3D (55 credits), retopology to triangles (35), auto-rig "Other" (20), export, then `tools/export-rigged.py`. 220 credits used; 2,870 left. The converted files are in `assets/staging/`, which the game build does not read, so the release build is unchanged. `tests/creatures.html` draws each with its skeleton and saves pictures to `assets/renders/`.

| Creature | Triangles | Bones | What the rig has | What it lacks |
|---|---|---|---|---|
| D1 Standing shade hare | 2,648 | 23 | Spine (3), neck and head, both hind legs with 4 bones each, right foreleg with 3, **forelegs separate** (the old hare's were merged) | Left foreleg has 2 bones, so no separate lower joint; only one ear has its own bones; no tail bone |
| D2 Shade crow | 2,640 | 33 | Each wing: shoulder, elbow, wrist, and three feather fans; neck and head (3); tail (4); one leg with 4 bones and toes | The other leg has a single bone. The model faces sideways in the file and needs a quarter turn when placed |

Answer to the open question "which Tripo rig preset suits a bird": "Other" gave jointed wings on the first try.

Not yet done: neither creature is animated or in the game; the flap test ChatGPT asked for has not been run; neither has been seen in a headset or shown to ChatGPT. The colour snap used in the viewer comes out too pale and needs tuning against the style sheet.

### ChatGPT's review of the two Tripo models (21 November 2026)
Verdict: keep both meshes; neither needs regenerating. Work still to do, in its order:

1. **Hare rig:** add the missing lower joint to the left foreleg before animating creep or bound, so both front paws can plant and land. Give the second ear its own bone so both ears can prick. The tail can follow the pelvis. Sit and head turn can be tested with the rig as it is.
2. **Crow rig:** the wing chains are enough to test flap, fold, glide and bank now. Add a jointed chain to the single-bone leg before animating perch and take-off. The wing weights are unverified until the flap and fold test is run.
3. **Crow tail:** longer and more swept than the concept, its main difference in silhouette. Check that it clears the torso in the fold test before deciding whether to shorten it.
4. **Colours, both:** dark plum body `#4A2943`, lighter plum facets `#6D3362`, ember-red eyes only `#E02E32`, kept flat. These are sampled from the style sheet. The grey cast and orange eyes in the first pictures are the biggest mismatch.

None of this has been done yet.

### Rig patches, recolour and first pose test (21 November 2026)
Done after ChatGPT's review, without returning to Tripo:

- **Bones added** by `tools/patch-rig.mjs`, which mirrors the side Tripo did rig: the hare gains a paw joint on its second foreleg and three bones for its second ear (27 bones); the crow gains a jointed second leg with toes (38 bones). The patched files are `assets/staging/*-rig-patched.json`.
- **Recoloured** to ChatGPT's style-sheet values: plum `#4A2943`, lighter plum `#6D3362`, ember eyes `#E02E32`.
- **Pose test** in `tests/creatures.html`: each creature is skinned the way the game skins one and put into test poses. Pictures are in `assets/renders/`.

| Creature | Poses tried | Result |
|---|---|---|
| Hare | rest, head turn, ears prick, ears back, creep, bound | The body, legs and head bend without tearing. The two ears now move separately. The ear poses stretch a few small triangles at the ear roots a great deal (the test measured up to 20 times), which does not show at this size but needs a closer look |
| Crow | rest, wings raised, wings wrapped down, fold, glide, head turn | Wings raise cleanly at shoulder and elbow with the feather fans following. No tearing. The fold pose came out lopsided: one wing folds to the body, the other swings back, so the two wing chains do not share the same turning directions and each needs its own |

These are still test poses, not animation. Not yet done: working out each wing bone's true turning direction; real animation cycles; the automated checks in the art plan; anything in the game; any headset check.

## ChatGPT's review of the pose test (21 November 2026)
ChatGPT opened all twelve pictures in `assets/renders/` (commit `e58bf14`).

| Verdict | What it said |
|---|---|
| Approved | Keep both meshes; no reason to regenerate in Tripo. The colours match the style sheet. Both creatures stay recognisable in every pose. Hare rest, head turn and bound read well. Crow rest, head turn and wings-down read well. |
| Change, hare | Ears first: ears-back visibly pinches and twists at the roots; check ears-prick in the same area. Inspect the worst edges close up, adjust the skull-to-ear weights and check the mirrored bone axes. Creep reads as a reach: lower the chest and keep the planted paw flat. |
| Change, crow | Fold first: correct each wing chain's own turning axes so both wings fold to the flanks. In flap-up the near wing hides the beak and the bend looks pinched: check shoulder and wrist weights. Glide looks like standing with half-open wings: extend the wings, tuck the feet, pitch the body forward. |
| Missing | Short moving tests seen from the side and front: a hare ear sweep and creep/bound cycle, a crow flap-to-fold cycle. Look for tearing, paw contact, and wing clearance past body, tail and feet. Reconsider the mesh only if targeted fixes still leave visible tearing. |
| Question | Do the hare's 9.3 and 20.59 stretch peaks fall on the same small ear-root edges? A close-up of those edges at rest and in both poses would show whether the fix is local. Not yet answered. |

None of this work has started. It waits behind the Trials playtest.

## Creature fixes and moving tests (21 November 2026, commit `ac3ac2b`)
Done at the developer's instruction, outside the game build.

- **Hare ears.** The stretch was not at the ear roots. The two ears are not mirror images (the second leans further out and forward), so the mirrored bones sat outside it and only some of its corners followed. `tools/patch-rig.mjs` now lays that ear's bones along its own line and matches its corners to the first ear by position around the ear. Worst stretch in the ear poses fell from 20.59 to 2.48 (the ear Tripo rigged measures 1.24).
- **Crow fold.** The lopsided fold was the posing, not the rig. Bones in these files have no rest rotation, so every turn is about the creature's own axes and a mirrored pose is exact. Both wings now fold the same way.
- **Poses redone.** Hare creep with the chest lowered, forelegs folded and paws turned flat. Crow glide with wings opened level, body pitched forward and legs swung back.
- **Moving tests.** `tests/creatures.html` now draws each cycle as a sheet, a column per step and a row per camera, with the stretch printed on every step and a ground line. `tools/rig-lib.mjs` poses a creature from the command line to measure stretch. The single pose pictures were replaced by: `d1-hare-ears-closeup`, `d1-hare-cycle-ears`, `d1-hare-cycle-creep`, `d1-hare-cycle-bound`, `d2-crow-cycle-flap-fold`, `d2-crow-poses` (all in `assets/renders/`).
- Worst stretch per sheet: hare ears 2.48, creep 2.51, bound 2.48; crow flap and fold 3.38, poses 3.07.

### ChatGPT's review of the moving tests
| Verdict | What it said |
|---|---|
| Approved | Both rigs are ready for proper animation. Keep both meshes and rigs. Stop work on the hare's ears; there is a slight kink at the deepest ears-back pose, so use the step before it as the limit. The crow's fold is symmetric and the glide reads as flight. |
| Change | Fix the hare's ground contact first, starting with one timed bound: hind paws planted through the gather and push-off, forepaws given a clear landing before the hind legs gather. Use the same contact check for the tilted hind paws in the creep. |
| Missing | Timed clips reviewed at playback speed: sliding during the hare's stance, push-off and landing; the crow's clearance past body, tail and feet through flap-to-fold. A tighter fold and foot tuck can follow in that pass. |
| Questions | None before starting animation. |

Still true: the steps are straight blends between guessed key poses, not timed animation; nothing is in the game; nothing has been seen in a headset.

## Hare: first timed bound (21 November 2026, commit `fe1a03c`)
Outside the game build. `src/moves.js` gives the bound as a function of phase only, so it plays the same at any frame rate. The body follows a keyed path; each leg is solved as two bones so its paw stays on one fixed spot while down and swings to the next while up. Cycle 0.46 s, stride 0.9 m (about 2 m/s): hind paws down 0 to 0.30, flight, forepaws down 0.55 to 0.80, gather.

- **Measured** by `node tools/check-moves.mjs` on the skinned mesh, 200 samples: forepaws slide 0.0 mm while down, hind paws 1.0 and 0.7 mm; each paw's lowest point stays within 0.2 mm of rest; no planted leg falls short; the mesh dips 0.2 mm below ground at worst; worst stretch 2.86; all four paws off the ground 44% of the cycle.
- **Seen** as a sheet (`assets/renders/d1-hare-bound-timed.jpg`) and playing in `tests/creatures.html?only=hare&play=1` (`play=4` for quarter speed).

### ChatGPT's review
| Verdict | What it said |
|---|---|
| Approved | The contact reads as push-off, flight and landing. Keep the contact solver and the timing; the stride and period are believable as a stylised bound. Push-off still looks a little flat-footed. It could not confirm the exact timing for a hare from the rabbit studies it checked. |
| Change | Tuck the legs in the main flight first (phases 0.4 to 0.5): hind paws up under the pelvis, forelegs folded briefly, then reaching forward for contact. Keep planted spots and timing unchanged for that pass. |
| Missing | Full-speed judgement is the developer's: a fixed side camera at gameplay distance, to see whether the tuck reads and the loop carries forward. |

Not done: the flight tuck, heel lift at push-off, any offset between left and right legs. Nothing is in the game.

### Flight tuck (commit `c943070`)
A paw in the air is now drawn in under its own joint within the first fifth of its swing, held, then released over the last third to reach for the next spot. Planted spots and timing unchanged; the contact check passes with the same figures. Worst stretch rose from 2.86 to 3.71, at phases 0.1 to 0.3 where the forelegs are most folded.

ChatGPT's review: **approved; park this bound until it is seen in the game.** It reads as a bounding hare. No further change before integration. There is a slight crease where the folded forelegs meet the chest; if it flickers in motion, look at those skin weights first. Still missing: the loop watched at full speed from gameplay distance, from the side and from the player's view.

## The standing hare in the game, as a separate trial build (21 November 2026)
At the developer's instruction. The normal build, the test site and the public site do not carry it.

- **How it is kept apart.** `node src/build.mjs <three> --new-hare` writes a second file, `Brackenford-Seven-Bells-new-hare.html` (2,878,909 bytes, not committed), which adds the standing hare from `assets/staging` and `src/moves.js`. Without the switch the build has neither, and the new game code does nothing. In the trial build `?hare=old` goes back to the first hare.
- **What changed in `src/game.js`.** The standing hare is recoloured to the style sheet when it loads, stands in for the first hare on every hare shade, and has its own pose function: the bound from `src/moves.js` driven by distance travelled, with the head turn, eye flare, fear, hiding crouch, banish rear, breathing and ear twitch laid over it. The old hop is switched off for it because its leap is in its own pose.
- **Two gaits** (`MOVES.HARE`): a lope for creeping shades (the bound as drawn, 0.9 stride) and a run for bolting ones (stride 2.4, short contacts, 69% of the cycle in the air), both passing `tools/check-moves.mjs`.
- **Measured in the game** by `tests/newhare.html`, during steady travel: running, 126 paw contacts, typical drift 0 mm, worst 83 mm; creeping, 140 contacts, typical 0 mm, worst 2 mm. No page errors.
- **Normal build re-tested**: `tests/all.html` passes all ten pages (one chance-dependent check missed, as it sometimes does). The normal build grew from 2,705,658 to 2,710,568 bytes because the dormant code is in it.
- **Pictures** from the game: `assets/renders/newhare-*.jpg`.

Not done, and known: the hit area was not re-tuned for the taller hare; a creeping hare still sinks 0.3 m into tall grass as the first one did, which buries more of this one; the worst running drift (83 mm) was not traced; its sitting pose is simply standing; it has not been seen in a headset or by ChatGPT; frame rate with five skinned hares has not been measured on Quest.

### ChatGPT's review of the standing hare in the game (commit `2fbf29b`)
It opened the six game screenshots and the run-gait sheet (`assets/renders/d1-hare-run-timed.jpg`).

| Verdict | What it said |
|---|---|
| Approved | Keep the plum colour and the size for the next trial. The two nearer hares read as shade hares from the archer's place; the farthest is a purple mark whose ears and body are hard to make out. Check that sightline in motion on Quest before changing size or adding an outline. Keep the run gait: about 2 m per bound at 3.3 bounds a second fits 6.5 m/s, and 69% airborne is a fair starting point. Judge it at full speed before changing it. |
| Change, first | The hit area. Fit it to the visible hare in the poses it can be hit in, and check it at the archer's real distances: a clean shot into the torso must register, and an arrow through empty space beside it must miss. This is the first blocker to replacing the first hare. |
| Change, second | Replace the 0.3 m sink with a grounded crouch: lower chest and hips through the pose, keep the paws on the ground, and let the grass do the hiding. Standing idle can stay for this trial. |
| Missing | A full-speed review on Quest, checking finding and aiming at the near and far ends of 13 to 28 m, especially as a hare leaves cover; if the far hare gets lost, clear some grass from that sightline first. Trace the 83 mm running outlier (which paw, phase and game event) before retuning the gait. |
| Question | Is a hare meant to be hittable while fully hidden, or only once it emerges? The hit area and the visual cue should follow that rule. **For the developer to decide.** In the game today a hidden or sunk hare can be hit, through a hit area shrunk by a third. |

None of these changes has been started.

### Hit area and crouch for the standing hare (22 November 2026)
The developer's answer to ChatGPT's question: **a hidden hare stays hittable, as now.** Then the two changes ChatGPT put first, in the trial build only.

- **Hit area.** The standing hare no longer uses the first hare's sphere (0.45 m radius). It has an egg-shaped area fitted about its body and head, about 0.68 m long, 0.6 m tall and 0.34 m wide in the game, which follows the leap and the crouch and is a third smaller while the hare keeps low. The first hare's hit area is untouched.
- **Crouch instead of sinking.** A hiding hare now crouches where it stands, with its paws on their spots (`MOVES.hareCrouch`), and a hare creeping through tall grass carries its body low (`MOVES.HARE.lopeLow`). It is never pushed into the ground. The first hare still sinks 0.3 m as before.
- **Checks.** `node tools/check-moves.mjs` passes for every gait and the crouch (paws move 1.1 mm at worst as it crouches). `tests/newhare.html`, in the game at 13 to 14 m: arrows through the body, head and chest hit; arrows 0.4 m to either side and 0.4 m above the back miss; a hidden hare is hit through its body and missed 0.35 m to the side. Running: 120 contacts, typical drift 0 mm, worst 58 mm. Creeping: 118 contacts, typical 1 mm, worst 8 mm, lowest paw joint 16 mm above ground. No page errors.
- **Normal build** re-tested three times with `tests/all.html`: two runs clean; one run had `spirits creep.hitInOpen` false, which then passed in four further runs of that page, so it looks chance-dependent (a moving creeper) but is not proven so.

Not done: the 0.4 m and 0.35 m misses are single shots at one distance and one facing, not a sweep; the worst running drift is still untraced; nothing seen in a headset; ChatGPT has not seen these two changes.

### ChatGPT's review of the hit area and crouch (commit `dfbe22a`)
| Verdict | What it said |
|---|---|
| Approved | Keep the grounded crouch: both pictures read as above ground, and the grass breaks up the hiding hare's outline. Keep the 0.68 x 0.60 x 0.34 m hit area as a starting fit. Whether the hiding hare is too exposed has to be judged from the archer's place, not from the close side view. |
| Change | The one-third reduction is provisional: fit the crouched area to the lowered head and body, reducing height first and trimming length or width only where the pose really changes, and check that a shot through the visible head still counts while it hides. Before replacement, test the edges of the hit area from the shooting line with repeatable shots just inside and just outside the visible head and body, near and far, broadside and facing the archer, including the crouch and an airborne moment. The current misses are too far out to test the boundary. |
| Missing | A Quest playtest: can an archer find and hit a hiding hare, then follow it as it comes out? If cover needs tuning, move grass first. A repeatable baseline for the first hare: re-run the intermittent creep-hit check with a fixed seed or scripted path and shot; random pace is only a guess, and that result should be kept apart from the new hare's tests. The 58 mm running outlier: log paw, phase and movement state; it blocks replacement if it shows as a skid at gameplay distance. |
| Question | Does "one-third smaller" mean every axis at two-thirds, or only some? All three leaves about 30% of the volume. **Answer: every axis is at two-thirds today**, so the area shrinks more than the body does. |

None of this has been started.

### Follow-ups from ChatGPT's review, and a third reviewer (22 November 2026)
**1. The intermittent check on the first hare is chance, and is not from the new work.** `tests/creep-baseline.html` replays `creep.hitInOpen` with the game's random numbers replaced by a fixed sequence. Over 24 numbered runs the normal build hits 23 times and misses once (run 8: the hare slips into grass while the arrow is in the air and ends 0.6 m from the point aimed at). The known-good build of 21 November, pulled out of git, gives exactly the same 24 results. Each run comes out the same when repeated. The check is now listed as chance-dependent in `tests/all.html`.

**2. The hit area was measured, found too loose, and rebuilt.** Lines of sight from the archer's place through a grid of points 3 cm apart were tested against the visible hare and against the hit area, in eight set-ups (standing, crouched and leaping; broadside and head-on; 14 m and 28 m). The single egg shape counted a lot of empty space: 32 to 51% of it lay off the hare broadside, reaching up to 18 cm outside it. It is replaced by **two shapes fixed to bones**: one about the body (about 0.5 m long, 0.25 m deep, 0.2 m wide) on the hip bone and one about the head (about 0.19 m across) on the head bone. They follow the leap, the crouch and the head turn by themselves, so the separate one-third reduction for a hare keeping low is gone. Legs, ears and tail are not part of the hit area.

| Set-up | Hit area off the hare, before | after | Furthest outside the hare, before | after |
|---|---|---|---|---|
| Standing, broadside, 14 m | 48% | 15% | 18 cm | 6 cm |
| Standing, head-on, 14 m | 36% | 11% | 11 cm | 4 cm |
| Standing, broadside, 28 m | 51% | 13% | 18 cm | 6 cm |
| Crouched, broadside | 32% | 6% | 10 cm | 3 cm |
| Crouched, head-on | 13% | 6% | 6 cm | 3 cm |
| Leaping, broadside | 50% | 15% | 18 cm | 6 cm |

Real arrows 5 cm inside and 5 cm outside the edge (left, right and over the top) in four set-ups, 24 shots: every inside shot hits and every outside shot misses. Between a third and two-thirds of the visible hare counts as a hit, depending on the view; the rest is legs, ears and tail.

**3. The running paw slip is found and fixed.** Every slip was a forepaw. The head turn had been put partly on the bone below the head (`Head_0`), which also carries the forelegs, so a running hare glancing at the archer swung its planted forepaws sideways. The turn is now on the head bone alone. Running: 116 contacts, worst drift 1 mm, no slips over 2 cm. Creeping: 138 contacts, worst 7 mm.

**Checks after all three:** `tests/all.html` on the normal build passes; `tools/check-moves.mjs` passes all five; `tests/newhare.html` reports no errors.

**Gemini.** The developer opened Gemini 4 Neon (Google AI Studio) in the browser pane as a third reviewer for low-level tasks. It was given read access to the public repository through raw links (its "URL context" tool was switched on) and a first task: an independent reading of why `creep.hitInOpen` is intermittent. **It gave no answer**: after about 25 minutes of "thinking" AI Studio replied "Model isn't available right now. Please wait a minute and try again." Nothing from it is used here, and the task has not been re-sent. No account, key or write access was given to it.

### ChatGPT's review of the follow-ups (commit `666120a`)
**Approved, with no changes before the Quest playtest.** Keep the two bone-following hit shapes, and keep ears, legs and tail outside the hit area for the trial; watch in play for misses a player would reasonably expect to score, especially on the ears when they are the clearest thing above the grass. The earlier follow-ups are resolved for this trial. Keep the hit set-up fixed so the playtest can show whether it feels fair. On Quest, from the shooting line: can players find a hidden hare, land shots on the visible head or body, and follow a bolt; include a few high-arc shots at the far end.

### Gemini's first completed task: consistency check of the release documents (22 November 2026)
Run by the developer in the Antigravity app from a message Claude wrote. Gemini cloned the public repository read-only and changed nothing. Claude checked every finding against the files before acting.

| Gemini's finding | Checked | Action |
|---|---|---|
| `Release-checklist.md` line 1 still titled "Archer's Realm: The Range" | True, a left-over working title | Retitled "Bow & Shadow — release checklist" |
| `README.md` names the folder `BrackenfordSevenBells/` | True, and deliberate (a folder name) | None |
| `Release-page-text.md` states Quest VR, one-handed draw, left-handed play and VR controls flatly in five places, while no Quest check has been run | Partly true. The draft already said, further down, to call VR "supported" only if the Quest checks pass. But the sentences themselves could be copied out unqualified | Added a section at the top saying every VR sentence is unconfirmed, and gave each one two wordings: if the checks pass, and if VR ships as experimental |
| `Stages.md` line 32: "creeping hare between 15, 15, 15 m" | True. The table writer listed only each path point's distance and left out the sideways sweep | Fixed `tools/stage-table.mjs`; the row now reads "creeping hare at 15 m, from 5.5 m left to 5.5 m right" |
| Stage count and stage names and order (checks A and B) | Gemini found nothing wrong | None |
| Unsure: whether `assets/screens` exists; sub-steps 4a, 9a, 9b in the test sheet | `assets/screens` exists with five pictures; the sub-steps are deliberate | None |

No finding was wrong. One (the VR wording) overlooked a caveat already in the file, but the point behind it was fair.

## A team of three, and design round 1 (22 November 2026)
At the developer's request Gemini joined the creative work and the three models agreed roles. The agreement and the round's outcome are in `Team.md`; each model's own proposal is in `design/`.

- **How they talked.** Claude typed to Gemini directly in the Antigravity app (the developer granted control of that app) and to ChatGPT in the browser pane. Each wrote a proposal without seeing the others', then read them and answered one settlement proposal.
- **Gemini's contribution on GitHub.** It created the branch `gemini/design-round-1`, wrote and committed `design/gemini-round-1.md` and its reply under its own author name, and pushed only that branch. Claude checked the commits (two files added, nothing else changed), opened [alisid0/brackenford-seven-bells#1](https://github.com/alisid0/brackenford-seven-bells/pull/1) and merged it into `release-prep`.
- **Roles, accepted by all three.** Gemini: rules, numbers, interaction specs and audits. ChatGPT: art direction and the visual cue of every mechanic. Claude: code, tests, performance, repository and merges. The developer decides.
- **Agreed for a first prototype after Trials ships:** three single-target arrows (frost, wind, fire), as charges per run, behind one flag. Score Attack before Endless. The plain mixed-reality Window before anything more.
- **Left for the developer:** the fire arrow's name (Kiln or Singe); whether arrows in the air at Score Attack's buzzer count; whether Score Attack gets a Bonus Bell; and whether any of this starts before the Trials playtest.
- **Not done:** nothing in this round is built or tested. One thing to know about the screen: another window covered part of Gemini's reply in Antigravity, so Claude asked Gemini to save that reply as a file and read it from git.

**Decision, 22 November 2026:** the fire arrow is called **Kiln**. Still open: arrows in the air at Score Attack's buzzer, the Bonus Bell, and whether any of round 1 starts before the Trials playtest.

**Decision, 22 November 2026:** in Score Attack an arrow loosed before the 180 seconds are up **counts** if it hits, however late it lands; only a release after the time is up is blocked. This goes into `Arcade-plan.md` when Arcade work begins. Still open: the Bonus Bell, and whether any of round 1 starts before the Trials playtest.

**Decision, 22 November 2026:** Score Attack gets the **Bonus Bell**: when a slot's targets are all cleared with at least 1.5 seconds left, one bell appears, worth a flat 50, with no penalty for missing it. The main targets keep their fixed schedule and the bell uses a fixed place and none of the shared random numbers. This goes into `Arcade-plan.md` when Arcade work begins. Still open: whether any of round 1 starts before the Trials playtest.

## Special arrows built: Rime, Gale and Kiln (22 November 2026)
The developer decided to start design round 1 now. The three arrows went through the agreed order of work: Gemini's spec, Claude's build, ChatGPT's cue review, Gemini's audit. Arcade is untouched.

- **Where they are.** In the game code on `release-prep`, never on in release mode. Outside it, on when the page is opened with `?release=0&arrows=1` (or `src/config.json` sets `arrows`). Not deployed anywhere.
- **Spec (Gemini, `design/arrows-spec.md`, pull request 2):** two charges a stage shared by the three; a special shot spends a charge and a stage arrow, hit or miss. Rime holds one sliding or pop-up target for 1.8 s, once per target, and scores nothing. Gale takes half the sideways wind and the ring or shade value it scores is capped at 60. Kiln clears one clump of tall grass for the stage, scores nothing and never harms a shade. A Rime or Kiln that does its job leaves the streak alone; one that hits anything else breaks it.
- **Choosing an arrow (Claude's choice, the spec did not say):** keys 1 to 4 on desktop; the left stick pushed up or down in VR.
- **Cues (ChatGPT), after its review:** Rime is a sky-blue bracket about the target for the 1.8 s, with the word "Held" for the first 0.4 s only. Kiln is three wide cream chevrons with a plum edge that rise 0.6 m in 0.65 s; the word "Cleared" moved to the message line so it no longer covers them. Gale is a 1 m cream trail with three plum bands. The scoreboard and bow plaque show a mark, the arrow's name and two pips for the charges; the arrow on the string carries a coloured band.
- **Audit (Gemini, `design/arrows-audit.md`, pull request 3):** it failed two of its own cases and marked one untested, and it was right each time. All fixed:
  - a pop-up that had begun to fold could still be struck for a moment, and Rime then held it down. Rime now needs the pop-up to be up.
  - Kiln took whichever was nearer, the grass or the shade in it. Now grass comes first: a Kiln arrow that reaches a shade keeping low in an intact clump clears the clump.
  - a creeper resting in a cleared clump stayed sunk. It now comes up.
  - the flag could have been switched on in a release build through the config. It is now never on in release mode.
  - the test for a 40 ring was missing, and two tests were too loose. Added and tightened.
- **Tests.** `tests/arrows.html` runs the spec's cases with real arrows, 13 groups of checks, all passing; it also checks the arrows are absent on the release page and without the flag. `tests/all.html` on the normal build passes. `tests/newhare.html` still passes.
- **Known and not done:** a Gale bullseye does not get the gold burst or the best-shot replay, because its value is capped below 100 (Gemini noted it; left as is). Nothing has been seen in a headset: ChatGPT asks for all three cues to be checked at 15 m and 30 m on a Quest, and whether Gale's trail reads from behind the arrow. Gemini has not re-audited the fixes. The charge numbers are a first guess to be tuned in play.

## World concept pictures: background, layout and overall look (22 November 2026)
At the developer's request ChatGPT drew three pictures of the same place and Gemini commented on them. They are concepts: nothing in the game's world has changed.

| File in `assets/concepts/` | What it is | State |
|---|---|---|
| `world-1-background.jpg` | The view from the shooting line: meadow lane, lake and jetty, creek and footbridge, village and watchtower, plum hills | Drawn. It alone has pink blossom trees, which are not in the approved palette |
| `world-2-layout.jpg` | The range seen from above, first version | **Superseded.** Claude's brief was wrong: the lane was too short and narrow, and the creek sat at 35 m where two stages stand a target |
| `world-2-layout-v2.jpg` | The range seen from above, corrected | Drawn to Gemini's corrections. Not yet approved by the developer |
| `world-3-overall-look.jpg` | A moment of play: bow in hand, two targets, a shade in the grass, the cloth-banner scoreboard with three gold stars | Drawn |

- **Gemini's comments** (`design/world-comments.md`, pull request 4), checked by Claude against `Stages.md` and found right on the facts: stages put targets as far as 60 and 70 m and as far as 7 m either side; two stages stand a target at 35 m; the first layout's creek and lane did not allow for that. It also asked for terraces instead of cast shadows (shadows are off on a Quest), for the only tall grass in the lane to be the clumps shades hide in (so a Kiln arrow is not wasted on decoration), and for the pennant to stand clear of the scoreboard.
- **The corrected layout** has a lane 75 m by 16 m, the creek at about 38 m with a terrace behind it, terraces stepping up beyond, targets at about 10, 20, 30, 50 and 70 m, two rows of three grass clumps at about 15 and 23 m, the cream cloth scoreboard, and the pennant on the far side of the lane.
- **ChatGPT's replies to Gemini:** it agrees with the layout changes; it would not fix the rail at 0.85 m until seated draw clearance is checked on a Quest; and it reads the arrowhead in picture 3 as banner red rather than ember, though grey would be cleaner.
- **For the developer:** whether the pink blossom trees stay (Gemini: keep two or three in the middle distance, away from the line and from behind targets); whether the arrowhead in picture 3 goes grey; and whether `world-2-layout-v2.jpg` is the plan to build to. Rebuilding the game's world to it would be a large change and has not been started.
- **Not checked:** Gemini says pink blossom trees match the style sheet; Claude has not verified that.
- Also merged: Gemini's second audit of the arrows (pull request 5), which found one small fault, now fixed: a Kiln arrow striking a winged shade flying over a grass clump no longer clears the clump.

### Art direction for the world, decided by ChatGPT (22 November 2026)
The developer saw the three pictures, called it a good design, and left the open questions of look to ChatGPT. Its decisions, which now stand as the art direction:

| Question | Decision |
|---|---|
| Pink blossom trees | Keep **two**, one on each side in the middle distance, outside the 18 m tree-free strip and never behind a target. Blossom pink **`#F299B5`** joins the palette. No loose petals in the lane |
| The arrowhead | Neutral grey. Banner red stays on cloth; ember red stays for shades and danger |
| The shooting rail | 0.85 m as a starting height; settled only after a seated draw is tried on a Quest |
| Which picture rules when they disagree | `world-2-layout-v2.jpg` for placement and distances; `world-3-overall-look.jpg` for the look the player sees and what props are made of; `world-1-background.jpg` for the mood of the landscape |
| A rule for building | Flat ground colours and terrace faces show depth, not shadows. Tall grass in or beside the lane is only ever real cover for shades, so a player can tell what Kiln can clear |

**Standing preference from the developer:** on questions of how the game looks, ChatGPT decides.

Still not started: rebuilding the game's world to these pictures.

## The new range layout, built behind a switch (22 November 2026)
The developer said to build the world to the pictures now. A first version is in the game on `release-prep`, never on in release mode; outside it, `?release=0&world=2` turns it on. Not deployed. The game's ordinary world is unchanged with the switch off.

- **What is built** (from `assets/concepts/world-2-layout-v2.jpg`): the ground levelled under a lane 16 m wide and 76 m long, drawn as a lighter strip with a broken shoulder; a creek at 38 m as a flat band of water with uneven sandy banks and stones, and a timber footbridge beside the lane; four terraces of 0.7 m each from 43, 53, 63 and 72 m that carry the far targets (the game's "how high is the ground here" answers for them); a rail 0.85 m high and the code-built stall at the line; the scoreboard as a cream cloth banner with plum border and lettering; two blossom trees clear of the lane. No loose grass, trees or rocks grow in the lane, the creek or on the bridge.
- **Hidden while shooting on the new range:** the training yard's sliding-round beam and old line posts, the bells' tall beams, the lanterns and the roaming straw rounds.
- **ChatGPT's review of the first screenshots:** approved as a layout and "show this on Quest now"; closer to its layout picture than to its mood picture. It gave colours for the lane (`#99B44E`, shoulder `#8DA748`), the terrace faces (`#829B47`), the creek (`#5897BE`) and the banks (`#B8A275`), asked for a broken shoulder and uneven banks, wider terraces, and the tall beams hidden. All applied. Still asked for and not done: taper the terraces into the hills; carry the creek into the lake.
- **Gemini's audit** (`design/world-audit.md`, pull request 6), right on each point, all fixed: the scoreboard and the wind pennant stood inside the lane (moved out to 12 m right and 10.5 m left); a tree grew through the footbridge (the range's whole footprint is now kept clear); a target at 40 m was wedged between the creek's bank and the first terrace (the terraces now start at 43 m); the terraces ran past the end of the lane; an arrow landing in the creek kicked up dirt (it now splashes).
- **Tests.** `tests/world2.html`: the lane is level, the terraces are at their heights, an arrow strikes the 60 m target, every stage's targets stand in the lane and none on a terrace edge or in the creek, shades still creep on the ground, and the layout is absent without the switch and on the release page. All pass. `tests/all.html` on the normal build passes; `tests/arrows.html` passes.
- **Missing or different from the pictures:** no jetty, no path to it, and no village or watchtower at the far end (the game's own lake, hamlet and paths are where they were); the stall is on the right of the line because the training yard's climbing wall and tower stand on the left, and those two are still visible; the sky, fog and the colours of the land outside the lane are the game's old ones; the pennant is still the old orange, not red and cream; nothing checks that no grass grows in the lane other than by eye.
- **Not seen in a headset.** ChatGPT and Gemini both ask for the rail height, the far targets and the grass clumps to be judged on a Quest.

## Step 1 of the new order of work: the aerial view (22 November 2026)
The developer corrected the process (see "Order of work" in `Team.md`): pictures first, building last. Step 1 was done by all three.

| Who | What | Where |
|---|---|---|
| Gemini | The plan in metres: every item's position and size, rules for what may never block a target, and a check that all 29 stages fit | `design/world-plan.md` (pull request 7) |
| ChatGPT | The aerial view drawn from that plan | `assets/concepts/aerial-v1.jpg` |
| Gemini | A row-by-row check of the drawing against the plan: 12 of 16 items match, 4 are drawn loosely, none is wrong | `design/aerial-check.md` (pull request 8) |
| Claude | Read the drawing against the plan; agrees with Gemini's check | here |

- **Drawn loosely, so the plan's numbers govern:** the stall and the scoreboard touch the lane's edge in the picture (the plan puts them 10.5 m left and 10.2 m right, clear of it); the left blossom tree sits nearer 27 m than 31 m; the skyline is cropped a little high.
- **ChatGPT's one change to the plan:** blend the ends of the terraces into the meadow, keeping their heights, so the rise reads as land.
- **Verdicts:** no redraw needed; ready for step 2, the player's-eye views for the stages.
- **Waiting on the developer:** approval of the aerial view before step 2 starts, and which stages should get a player's-eye picture.

The layout Claude built into the game behind `?world=2` predates this plan and differs from it (stall on the right, no jetty, path or village). It is left as it is until step 3.

## 22 November 2026: step 2 pictures, then two changes of direction from the developer

- **Step 2, first pass.** Gemini wrote `design/pov-shots.md` (seven views covering all 29 stages; PR #9; stage positions checked against `src/game.js`). ChatGPT drew all seven (`assets/concepts/pov-v1` to `pov-v7`). By ChatGPT's own notes, scale is loose in most (near hares, clumps and the fixed target too big; the 70 m slider too small) and the creek line touches some target rims; the shot list's numbers govern. Gemini has not checked these seven, because the developer's next two messages changed what they are for.
- **Direction 1: a VR reason to be there.** The standing place must be something only a headset makes you feel: a great height, a drop at the toes, water under the feet. Gemini wrote comfort rules and look-down angles (`design/vr-stand-rules.md`, PR #10). ChatGPT drew `vr-stand-concepts-v1.jpg`, which the developer rejected: the same range three times.
- **Direction 2: many places, not one range.** The terraced range is only the introductory place; the player travels on across a map to places that differ in layout, foreground, background and mood. ChatGPT proposed six places and drew `world-map-v1.jpg`; written down in `design/world-journey.md`. Gemini checked it in `design/journey-check.md` (PR #11): every stage has a workable home, with three stages moved (Sliding mark to the Quarry, Three ranges to the Pier, The gauntlet to Stormcrest), layout conditions for each place, the unlock logic, and a recommendation to rename place 1 because "Brambleford" is too close to "Brackenford".
- **Not decided:** the map and place list; the name of place 1; Gemini's three moves; whether the first release ships with place 1 only or waits for more places. **Not done:** any plan in metres, aerial view or player's-eye picture for places 2 to 6; any code. None of the comfort numbers has been tried on a headset.
- Gemini can also build assets as code (shapes like the stall in `src/props.js`); the developer asked. That is step 3 work, after each place's pictures are approved.
- **Map approved; replay plan written.** The developer approved the world map and six places. Asked what the game needs to bring players back, the three models produced `design/replay-systems.md` (Gemini, PR #12) and `design/replay-plan.md` (combined, with ChatGPT's reward moments and Claude's check against the code). A plan only: nothing built, every number a first guess. ChatGPT proposes Willowbank Range as place 1's name; the developer has not chosen.
- **First-release replay pieces built** (commit `522e651`): a stage's result now says how many points short of the next star it was and by how much a best was beaten; a playtest tally is kept on the device with a Copy playtest summary button. One switch, `replay` in `src/config.json`. `tests/replay.html` passes; the full suite passes. Star thresholds unchanged. Not played by a person yet.
- **Aerial views of places 2 to 6.** Gemini's plans in metres: `design/place-plans.md` (PR #13). ChatGPT's drawings: `assets/concepts/aerial-2a` to `aerial-4`. Gemini's check (`design/place-aerial-check.md`, PR #14): Pier, Quarry v2, Alderwood and Stormcrest ready for player's-eye views; the Village's first drawing wrong (tower off the centre line, roof low over the rail). ChatGPT redrew it as `aerial-3b-bellward-village-v2.jpg`; Claude's reading is that the tower is now centred and the gallery open to the sky, with the thatch peaks still about as high as the deck (the plan's 3 m limit governs). Gemini has not rechecked v2. Gemini recommends building the Pier first after place 1.
- **Half-hour test** for the developer: `Half-hour-test.md`. With the developer's go-ahead ("Yes, test site") the build at `142f10d` was deployed to the test site, https://archery-range-test.vercel.app, with the new-hare build at `/new-hare.html`. Checked: both pages return the new build and load without errors. The public site was not touched.
- **Still not done from the replay plan's first-release list:** saves keyed by stage name (today a save is keyed by position in the release order, so changing the order would misplace stars), and the shot-feedback polish.
- **The first menu, agreed between the three models** (`design/first-menu.md`; Gemini's `first-menu-spec.md` and `first-menu-reply.md`, PRs #15 and #16; ChatGPT's pictures `first-menu-1-new-player.jpg`, `first-menu-2-returning-vr.jpg`, `first-menu-3-overlook-map.jpg`). The approved cloth banner stays; its face drops from eleven controls to one red button, one cream button and a Settings link; a returning player gets Continue; in the headset it is chosen by pointing, at 2.4 m; the map becomes a relief table at a valley overlook when the six places ship. Not approved by the developer yet; nothing built. The earlier "pictures only until after release" rule was the models' own caution and is no longer assumed.
- **Cloth menu built** after the developer's "Approve, build it". Flat page: on (`menu`). Headset banner with pointing: built but off (`vrmenu`) because it has only been run with a stand-in controller. `tests/menu.html` and the full suite pass. What was left out and why is at the end of `design/first-menu.md`. Deployed to the test site on the developer's word ("Put it up now"); both pages checked to serve the new build. The public site was not touched.

## 22 November 2026, later: the loop while the developer was out

The developer left before testing and asked the three models to keep working in a loop. Summary for them: `While-you-were-away.md`.

- **End to end:** `design/end-to-end.md` (Gemini, PR #17). **Theme:** ChatGPT's four directions (`design/theme-directions.md`, `theme-a` to `theme-d`); Gemini chose B, The Silent Peal (`design/theme.md`, PR #18); ChatGPT's look answers and two sheets (`design/theme-look.md`). Not yet seen by the developer. **Mixed reality:** `design/mixed-reality.md` (Gemini, PR #19) and `design/mixed-reality-look.md`; a design note only. **Small specs:** `design/small-specs.md` (Gemini, PR #20).
- **Built:** saves keyed by stage name with old saves still read (`tests/saves.html`); `PROPS.belfry` in `src/props.js` with renders, not in the game; ribbons behind the `ribbons` switch, off (`tests/ribbons.html`).
- **Not built from the small specs:** the miss tip, the two onboarding prompts, the place-1 bell beat, the finale cloth.
- Nothing deployed. The test site still carries the cloth-menu build from before the developer left.
- **The developer approved all six decisions** on return ("Yes I do approve of all these"): The Silent Peal; Willowbank Range; ribbons on; coins retired; one place first; mixed reality only after the headset test of Trials. Acted on: `ribbons` on, `coins` hidden everywhere (`"coins": false`; the counter still runs unseen so old saves load), and the theme's first piece built: **the Practice Bell** (`peal` switch, on; `tests/peal.html`). It stands 22 m out and 12.5 m to the LEFT on today's range, not the plan's right, because today's scoreboard blocks the plan's line of sight; it moves to the plan's place when the first place is rebuilt. Bound and dull until the first four release stages each hold a star, then unbound, rung by an arrow or by itself on going on, and remembered. Not built from spec 4A: wildflowers replacing thorns, the ribbon untying as a motion, the controller tap, the "next stage awaits" line. Not deployed.
- **Stage-by-stage working agreed** with the developer: 1 block-out, 2 art pass, 3 lighting and colour, 4 animation, 5 polish; one place at a time; each stage behind a switch with the developer's check between. **Stage 2 started on Willowbank Range** behind `?world=2` (now usable on the release's stages too): `design/willowbank-art-pass.md`. ChatGPT reviewed the renders; its three shape fixes are applied and its stage 3 values recorded, not applied. Gemini's audit is waiting on an approval prompt in Antigravity that Claude could not read and did not approve. `tests/world2.html` passes. Not deployed.
- **What kind of game: decided.** The developer chose the carefree wave-shooter as the main game ("Bell Watch"), with the 17 stages as training and challenges; not open world. This lifted the rule against Arcade code before the headset playtest. Record: `design/bell-watch.md`. **First playable built** (switch `watch`, on; `tests/watch.html`): a 180-second run, arrows that never run out, seven shades at a time replaced as they are banished, a best score kept apart from the stages. Shades do not yet come for the bell. The audit of the Willowbank art pass was dropped at the developer's word. Not deployed.
- **Bell Watch, second cut:** hares make for the bell and bind it (three bands at most); an arrow into the bell frees it and scatters them; misses are free; nothing new sets out in the last ten seconds; an unbound bell at the end gives +100. `PROPS.belfry` gained `bind(n)`. `tests/watch.html` covers it; all other tests pass. Pacing untuned; crows do not bind yet. Not deployed.
- **Gemini's audit of the Willowbank art pass** arrived after all (PR #21) and was acted on; see the table at the end of `design/willowbank-art-pass.md`. **Gemini now builds assets:** at the developer's request it sent a capability brief, and Claude gave it ticket 1 on branch `gemini/willowbank-props`: hut (three variants), watchtower, footbridge, jetty, striped wind pennant, blossom tree, rail and deck as `PROPS` builders, plus merging the belfry's 59 parts without changing its look or interface. Budget: 6 meshes and 700 triangles a prop (tower 1,000; belfry 8 meshes). It touches only `src/props.js` and `tests/props.html`; Claude swaps the rough shapes in `src/game.js` for its builders at merge. Answered for the developer, from what they have said so far: Three.js and WebXR only, no Unity port asked for, so no `.glb` export.
- **Unity too.** Asked whether the game is web only, the developer answered "I want Unity too". Claude's earlier answer to Gemini (web only) was wrong and has been corrected. Ticket 1 now also asks Gemini for `tools/export-glb.mjs` (every prop as a `.glb` in `assets/glb/` with a manifest) and `design/unity-plan.md` (its plan for a Unity version, a first milestone, and what it can do itself). No Unity project has been started; how far and how soon is the developer's decision once the plan is in.
- **Unity version started** at the developer's word ("Start Unity now"). `unity/BowAndShadow` (Unity 6000.6.7f1, built-in pipeline): a range built in code, the bow on a flat screen, arrow flight by the web game's rule, ring targets from the shared stage numbers, scoring, the Practice Bell. `tools/export-data.mjs` writes `shared/game-data.json`, the one set of numbers both versions read. Verified: it compiles, a command-line check passes, a Windows build runs and draws correctly (`assets/renders/unity-first-range.png`). **Not verified:** nobody has played it; no headset. **Blocked on the developer:** this Unity has no Android Build Support, which a Quest build needs. See `unity/README.md`.
- **Gemini's first assets merged** (PR #22): `PROPS.hut` (three variants), `watchtower`, `footbridge`, `jetty`, `windPennant`, `blossomTree`, `rail`, `deck`, and the belfry merged from 59 parts to 8 with its interface unchanged. Its counts were confirmed by `tests/props.html`; renders `assets/renders/w1-*.jpg`. One fault found on review and fixed: the merged geometry made its vertex arrays in the page's own realm, which the renderer refuses when three.js comes from a frame (the props page). In the game it worked. Claude's rough shapes on Willowbank are replaced by these builders (huts, tower, bridge, jetty, blossom trees, rail, deck); the wind pennant on the range is still the old one. `tests/world2.html`, `peal.html` and `watch.html` pass. Still to come from Gemini: the `.glb` exporter and `design/unity-plan.md`. The developer said they will install Android Build Support for Unity.
- **Improvement round on Gemini's props** at the developer's request: ChatGPT redrew the nine assets (`assets/concepts/w1-props-improved.jpg`) with concrete changes for each; Gemini has them as ticket 2 on `gemini/willowbank-props-2`. **Where Tripo fits** is answered in `design/willowbank-props-review.md`: code for static props, Tripo for creatures; ChatGPT's order is the shade ram first, a new crow only if the present one cannot fold, a great blossom tree only if it becomes a close-up landmark; bow and bell stay in code. No Tripo credits spent. **Gemini's exporter and Unity plan merged** (PR #23): `tools/export-glb.mjs` re-run by Claude, 14 files verified; `design/unity-plan.md`. **An older Unity project, `BrackenfordSevenBells/`, was already in the repo** with working headset packages; Claude had started `unity/BowAndShadow` without knowing. See `unity/README.md`.
- **D3 Shade ram made in Tripo** on the developer's word ("Yes, make the ram"). ChatGPT's concept: `assets/concepts/d3-shade-ram.jpg` (padded copy `d3-shade-ram-padded.jpg` was the one uploaded, so the horns were not cropped). Tripo: image to 3D 55 credits, retopology to triangles at 4,000 asked 35, auto-rig "Other" 20. **110 credits spent; 2,760 left.** Exported as GLB with skeleton and converted with `tools/export-rigged.py` (Blender 5.2) to `assets/staging/shade-ram-rig.json`: 3,312 triangles, 35 bones. Read from the bone positions: a spine and a neck-and-head chain; each horn has its own chain of four or five bones hanging off the head, so the horns follow the head; two ear bones; a two-bone tail; all four legs have their own chains of three or four bones (the hind legs are the ones named `0_Left_Limb` and `0_Right_Limb`, the forelegs `bone_23`-`26` and `Spine_1` with `bone_28`-`30`). The model faces the other way along x from what the script assumes, as the crow needed a turn. **Not done:** ChatGPT's three acceptance checks have not been run (horns open and attached only at the skull, each leg moved alone, the read at 30 m in game light); no colour snap to the palette; not turned or scaled to 1.1 m; not animated; not in the game; not shown to ChatGPT or Gemini. The raw download is still in the Downloads folder as a `.tmp` file, with the two older ones.
- **Gemini's second pass on the Willowbank props merged** (pull request 24, branch `gemini/willowbank-props-2`): ChatGPT's improvements from `design/willowbank-props-review.md` applied to the builders in `src/props.js` and the `.glb` files exported again. Read before merging: shape and colour changes only. Seen in fresh pictures: twelve-sided huts with a darker eave and a framed doorway, the watchtower with thicker legs and one X per face, the bell with a thicker gold lip and a ribbon in two bends. Game rebuilt; `tests/all.html`, `props.html`, `peal.html`, `watch.html` and `world2.html` pass; pictures in `assets/renders` taken again. **Not done:** ChatGPT has not looked at the result; the pennant on the range is still the old one; nothing here has been seen in a headset.
- **Shade ram finished and in Bell Watch** on the developer's word ("Yes, finish the ram"), behind a new switch `ram` (on in `src/config.json`; `?ram=0` turns it off). `tools/turn-ram.mjs` turns Tripo's model to face forward (it was modelled at an angle from the three-quarter picture) and writes `assets/staging/shade-ram-rig-turned.json`, which `src/build.mjs` now builds in as `shade-ram` (the game file grew by about 210 KB). In the game it is recoloured plum with ember eyes, drawn with its shoulder about 1.05 m up, and animated by hand in `ramPoseOf`: stand and paw, a heavy trot with the head down, and a rear. Tripo had the head turned to its left; the pose turns it straight. Behaviour and numbers are in `design/bell-watch.md`. ChatGPT's checks, as far as pictures can answer them: both horn curls are open and joined only at the skull, and each horn has its own bones under the head; all four legs move alone (`assets/renders/d3-ram-charge.jpg`), though the left hind leg only turns from the joint below the hip, as Tripo rigged it; seen from the archer's stand at 34 m it reads as a horned animal bigger than the hares (`d3-ram-game-stand-player.jpg`). `tests/ram.html` passes, as do `all`, `watch` (now run with the ram off so chance cannot disturb it), `peal`, `ribbons` and `world2`. **Not done:** nobody has played it or seen it in a headset; its numbers are first guesses not yet seen by Gemini; ChatGPT has not seen the result; the neck skin stretches where the head is turned straight (about twice its rest length at the worst edge, not noticeable in the pictures); its feet are not pinned, so they slide a little as it walks; it has no sound of its own beyond two low notes; it is not in the Unity project. The test site has none of this.
