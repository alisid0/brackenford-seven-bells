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
