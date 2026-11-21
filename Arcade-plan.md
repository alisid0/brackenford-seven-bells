# Arcade: agreed plan (no code written yet)

Status: approved for development behind a switch. **No Arcade code is to be written until the first headset playtest of Trials has been reviewed.** The global leaderboard is deferred until after release. Mixed reality is an experiment only.

Arcade is Update 1, after the Trials release. It is not part of the launch. (Revision 3, after ChatGPT's review of 21 November 2026.)

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
- **Arrow rule (agreed):** start with 10 arrows. A qualifying hit returns its arrow; a miss costs it. Every fifth hit in a row adds one, to a cap of 12. The run ends when no arrows are left and none can come back. Run length is set by accuracy. (The first proposal, "ten arrows plus one per five hits", ended every run after about twelve shots.)
- **Only a missed shot costs an arrow.** A target that leaves unhit costs nothing in the first playtest version. Charging for it could take two arrows for one target, and a target can leave while a good shot is already in the air.
- Waves add distance, movement, wind and shade behaviours up to fixed caps (largest distance, top speed, smallest size, strongest wind), reached at about wave 20.
- **Ending.** A hard limit of 15 minutes, stated in the rules; the score at that moment stands. There is no other forced ending yet. Run lengths are measured in playtesting first; if skilled players routinely reach the limit, a pressure rule (such as a penalty for targets that leave) is added then.
- The five-hit bonus, the 12-arrow cap and the 15-minute limit are starting values, to be tuned in playtesting.
- Shade movement inside Endless uses a seeded generator, so a wave can be reproduced in a test.

#### Arrow accounting

How the game behaves today (checked in the code): a hit is decided when the arrow arrives, not when it is loosed. A shade that hides or leaves stops being hittable at that instant. A pop-up stays hittable for about a twentieth of a second after its window closes, until it has folded down. So an arrow that was well aimed, but arrives after its target has gone, passes through and counts as a miss. A full-power shot takes about one second to reach 60 metres.

Rules for Endless:

| Event | Arrows | Score and streak |
|---|---|---|
| Arrow loosed | The arrow is **reserved**: taken from the count shown, not yet lost | — |
| Hits a live target, draw 60% or more | Returned | Scores; streak rises |
| Hits a live target, draw under 60% | Lost | No score; streak resets |
| Misses everything | Lost | Streak resets |
| Hits scenery | Lost, as a miss | Streak resets |
| Would have hit a target that another arrow cleared while this one was in flight | **Void:** returned | No score; streak unchanged |
| Arrives after its target left, having been loosed while the target was showing and passing within the target's size of where it was | **Void:** returned | No score; streak unchanged |
| Fifth hit in a row | One extra, up to the cap of 12 | — |

- A target can be scored once. Two arrows in the air at one target: the first to arrive scores, the second is void.
- A shot that would have missed anyway always costs its arrow. The void rule was confirmed by ChatGPT on 21 November 2026.
- At most three arrows in flight, so at most three are reserved.
- **End of run:** when the count is zero **and** no arrow is in flight. If the last arrow is in the air, the run waits for it; if it hits, it comes back and the run continues.
- **Display:** the count shows arrows in hand, with one small hollow marker for each arrow in flight. A marker fills and rejoins the count on a hit, and fades on a miss.

Score Attack has unlimited arrows, so none of this applies there; hits are decided on arrival, which is the same for every player.

 seeded generator, so a wave can be reproduced in a test.

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
5. Endless Survival with the arrow accounting and the time limit.
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
- Endless: a hit returns the arrow, a miss costs one, the bonus and its cap work.
- Endless: a target that leaves unhit costs nothing.
- Endless: an under-drawn hit costs an arrow and does not score.
- Endless: a well-aimed arrow that arrives after its target left, or after another arrow cleared it, is void: returned, no score, streak unchanged. The same arrow aimed wide still costs one.
- Endless: with the last arrow in flight the run does not end; it continues if that arrow hits and ends if it misses.
- Endless: the count shown plus the arrows in flight always equals the arrows owned.
- Endless: the 15-minute limit ends a run. A scripted archer at 50%, 70% and 90% accuracy records its run length, as tuning data.
- Bests are kept apart by mode, ruleset version and input type, and survive a reload.
- Statistics add up: shots, hits, accuracy, longest streak.
- With the Arcade switch off, nothing of Arcade is reachable and the ten existing suites pass unchanged.

By hand, on desktop and on a Quest:
- Each mode played three times start to finish without error.
- Frame rate at or above 72 in the busiest wave.
- The timer, wave and arrows are readable in VR without looking away from the targets.
- Taking the headset off ends the run cleanly.
- The player wants another go.

## Acceptance
Arcade is released as Update 1 when the Trials release is live and stable, every automated check above passes, both modes have been played at least three times each by the developer on desktop and on a Quest, and the developer approves. A mode that falls short stays switched off and follows later. Day 5 of release week is for the Trials desktop and Quest decision only.
