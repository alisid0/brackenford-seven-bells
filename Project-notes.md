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
13. Endless Survival arrow rule: a hit returns its arrow, a miss costs it. (The first proposal, ten arrows plus one per five hits, ended every run after about twelve shots.) **ChatGPT has not yet confirmed this change.**
14. Score Attack runs on a fixed timetable so every player meets the same targets at the same moments, at any frame rate.

### Art and assets
15. One style: flat-shaded low-poly, one colour per face, no textures, a locked palette. Warm colourful world, dark shades.
16. Creatures and complex props go through ChatGPT image, then Tripo, then Blender scripts. Simple or repeated props are made in code.
17. All creature animation is written in code. No recorded clips.
18. Cosmetic randomness is free; anything that affects aiming is seeded and independent of frame rate.
19. Graphics budgets are provisional until measured on the headset.
20. A style sheet is made with ChatGPT Images before the next Tripo creature.

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
- Which woodland creature is the first shade that fights back? (Proposed: a stag that hurls thorns.)
- Which mixed-reality idea is prototyped first? (Proposed: a wall that opens onto the range.)
- ChatGPT's answers to the six questions at the end of `Asset-and-XR-list.md`.

## Known gaps
- No real frame-rate figure from a Quest.
- Replay comfort, the guide board, the stage stick and handedness are unverified in a headset.
- Tripo and ChatGPT must be signed in on the developer's home computer before any new asset can be made.
