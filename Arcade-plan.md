# Arcade: agreed plan (no code written yet)

Status: approved for development behind a switch. **No Arcade code is to be written until the first headset playtest of Trials has been reviewed.** The global leaderboard is deferred until after release. Mixed reality is an experiment only.

Release order of preference: Trials alone is a successful release; Trials plus one tested Arcade mode is better; plus both is ideal; mixed reality is a bonus; global leaderboards follow later.

## Ruleset version 1

Scoring is the Trials formula, unchanged: (ring value 20–100, or a shade's value, plus distance in metres) × streak multiplier (1.0, rising 0.1 a hit, to 2.0) × 1.25 for a perfect release. A miss resets the streak.

Common to both modes:
- A shot under 60% draw does not score.
- A target scores once, then it is gone.
- At most three arrows in flight.
- One bow, fixed.
- Bests are stored per mode, ruleset version and input type (desktop, VR two-handed, VR one-handed).
- No replay and no guide during a run.

### 3-Minute Score Attack
- 180 seconds on the run clock. Unlimited arrows.
- **The challenge is a timetable, not a queue.** The run is cut into fixed slots (for example 6 seconds). Each slot has a set of targets, their positions, movement and the wind, all fixed by the ruleset. A slot begins and ends by the clock whatever the player does: clearing it early earns nothing extra and does not bring the next slot forward. Every player therefore meets exactly the same targets at exactly the same moments.
- Version 1 uses ring targets, sliders and pop-ups, whose movement is a pure function of the run clock. Randomly moving shades are left out until their movement is seeded.

### Endless Survival
- **Arrow rule changed from the proposal.** "Ten arrows, plus one per five hits" ends every run after about twelve shots, however well it is played: each five hits spend five arrows to earn one. That is neither endless nor a survival game.
- Proposed instead: **a hit returns its arrow; a miss costs it.** Start with 10. Every fifth hit in a row adds one, to a cap of 12. A target that leaves unhit also costs an arrow. The run ends at zero. Run length is then set by accuracy.
- Waves add distance, movement, wind and shade behaviours up to fixed caps (largest distance, top speed, smallest size, strongest wind), reached at about wave 20.
- **A guaranteed ending.** Beyond wave 20 the time a target stays shrinks a little each wave, so even a perfect archer eventually loses arrows to targets that leave. On top of that, a hard limit of 15 minutes, stated in the rules; the score at that moment stands. The pressure ending is the one players should meet; the time limit is a safety net for comfort and for testing.
- Shade movement inside Endless uses a seeded generator, so a wave can be reproduced in a test.

## Timing and interruptions

- **Run clock:** real elapsed time, taken from the browser's clock each frame, not the game's capped frame step. Target timetables and movement read this clock. (Today the game caps a frame at 0.05 s, so a slow device would otherwise get the run in slow motion.)
- **No pausing a run.** These end the run at once, marked "interrupted, not recorded", with an offer to start again:
  - the tab or window being hidden;
  - on desktop, pressing Esc or losing mouse capture;
  - in VR, the headset being taken off or sleeping, the system menu covering the game, or the VR session ending;
  - any gap between frames longer than 0.25 s.
- Re-entering VR or returning to the tab never resumes a run.
- Each recorded best also stores the average and lowest frame rate of the run. Nothing is rejected on that locally; a future leaderboard can use it.
- Trials keeps its present, forgiving behaviour. These rules apply to Arcade only.

## Implementation sequence

Each step is one commit on `release-prep`, with every existing test suite passing before the next begins. The Arcade switch in `src/config.json` stays off until accepted.

0. Headset playtest of Trials reviewed; Trials blockers fixed. (Gate: nothing below starts before this.)
1. Split target and shade placement out of stage setup so a stage and an Arcade slot share it. No change in behaviour.
2. Run clock, interruption rules, and a seeded generator for Arcade.
3. Arcade engine: rules object (arrow supply, time limit, timetable or wave source, end condition), run state, statistics.
4. Score Attack on the timetable.
5. Endless Survival with the arrow rule and the two endings.
6. Results screen, statistics, local personal bests, mode choice on the title card and by signs in VR.
7. Tests (below).
8. Playtest and tuning.
9. Mixed reality proof of concept behind its own switch.

## Test criteria

Automated:
- The same ruleset gives the same Score Attack timetable on every run, to the frame.
- Clearing a slot early does not change when the next begins.
- A shot under 60% draw does not score; a target cannot score twice; a fourth arrow cannot be in flight.
- Each interruption ends the run unrecorded.
- A long frame gap ends the run.
- Endless: a hit returns the arrow, a miss costs one, the bonus and its cap work, the run ends at zero.
- Endless: a scripted perfect archer still loses within the time limit, and the 15-minute limit ends a run.
- Bests are kept apart by mode, ruleset version and input type, and survive a reload.
- Statistics add up: shots, hits, accuracy, longest streak.
- With the Arcade switch off, nothing of Arcade is reachable and the ten existing suites pass unchanged.

By hand, on desktop and on a Quest:
- Each mode played three times start to finish without error.
- Frame rate at or above 72 in the busiest wave.
- The timer, wave and arrows are readable in VR without looking away from the targets.
- Taking the headset off ends the run cleanly.
- The player wants another go.

## Go or no-go on Day 5
Arcade is included only if the Trials checklist has already passed, all of the above hold for the mode in question, and the developer has played it at least three times. A mode that misses stays switched off and follows as an update.
