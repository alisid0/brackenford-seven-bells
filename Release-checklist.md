# Bow & Shadow — release checklist

Known-good build: git tag `known-good-2026-11-21` (commit `a1e717d`), which is what the public URL serves.
Work happens on the `release-prep` branch and is shown on a Vercel preview address. The public URL changes only when every "must" below is ticked.

Test site for these checks: https://archery-range-test.vercel.app (the release build, not indexed by search engines). Add `?fps=1` for the frame counter and `?release=0` for all 29 stages.

## Must pass before publishing

### Fresh start
- [ ] Opens in a private window with no saved data, on Chrome, Edge and Firefox (Safari if a Mac is to hand)
- [ ] Title card shows the release name and nothing that promises unbuilt features
- [ ] A first-time player finishes stage 1 with no outside help

### Progress
- [ ] Stars, best scores and the unlocked stage survive a reload
- [x] Still plays, without saving, when the browser blocks storage (automated: tests/release.html)
- [ ] "Start over" clears progress

### Desktop
- [ ] Draw, loose and soft shots with the mouse; mouse wheel sets the draw
- [ ] Stage keys ([ and ], N, R, B) and Esc behave as described on the title card
- [ ] Every shipped stage reaches its results screen
- [ ] One star is achievable on a first try on each of the first eight stages

### Quest (real headset, Quest Browser)
- [ ] Enter VR starts an immersive session; bow is in hand
- [ ] Two-handed draw: free hand to string, trigger, pull, release
- [ ] Single-handed draw: hold any trigger
- [ ] Left-handed play: bow in the right hand
- [ ] Scoreboard and signs readable; BACK, AGAIN and NEXT signs work when shot
- [ ] Left-stick flick changes stage
- [ ] Replay plays, returns the player to the line, and can be skipped with a trigger
- [ ] Every shipped stage reaches its results screen
- [ ] Frame rate: no visible stutter on the busiest shipped stage; measured figure recorded
- [ ] No tester reports nausea

### Recovery
- [ ] Leaving VR and re-entering works
- [ ] Taking the headset off and putting it back on resumes play
- [ ] A lost controller mid-draw cancels the shot instead of firing

### Legal and assets
- [ ] Tripo plan terms allow commercial use of the hare model, and its page on Tripo is set as intended (public or private)
- [ ] OpenAI terms allow use of the concept image the hare was made from
- [ ] No third-party art, sound or code beyond three.js (MIT licence)
- [ ] No analytics, cookies or accounts added since the audit

### Release
- [ ] All scripted test pages in `tests/` pass on the release commit
- [ ] Release commit tagged; previous public build's tag noted for rollback
- [ ] Page title, description and share preview say what the game is

## Fallback (decided on Day 5)
Day 5 decides the desktop and Quest release only; Arcade is not part of it. Say nothing stronger about VR than what was tested on a real headset, and name on the release page only the headset models and input methods actually tested.

**VR may ship labelled "experimental, Quest Browser"** if the only failures are of this kind:
- hand tracking unreliable (then hand tracking is not mentioned, and controllers are named as the supported input);
- single-handed draw, left-handed play, or the stage stick faulty, with a working alternative;
- the replay uncomfortable (then replays are switched off in VR);
- signs or scoreboard hard to read but usable;
- occasional stutter that no tester found uncomfortable.

**The Enter VR button is withheld**, and the game ships as desktop only, if any of these is true:
- the VR session does not start, or the bow is not in hand;
- the two-handed controller draw does not work;
- a stage cannot be finished in VR;
- frame rate is low enough that a tester feels unwell, or any tester reports nausea in normal play;
- a lost controller fires an arrow, or the game cannot recover from the headset being taken off;
- any error banner appears in VR in normal play.

## Not in this release
Shop and upgrades, boss, enemies that attack, new creatures, mobile touch, leaderboards, music, the Unity project. All 29 stages stay in the code; stages left out of the release are hidden, not deleted.
