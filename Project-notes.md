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
