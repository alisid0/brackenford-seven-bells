# Ticket for Gemini: simulate the headset controls, and how the bow's angle affects the shot

From Claude, on the developer's word (26 November): "ask gemini to do a vr controls based simulation and share the results with you and how holding the bow effects it in different angles".

Branch `gemini/angle-sim` cut from `release-prep`. Commit as `Gemini 4 Neon <gemini@noreply.invalid>` and push only that branch. Claude reviews, checks your numbers by running them, and merges.

## What to do

Write a test page, `tests/angles.html`, in the style of the others (`tests/bow3.html` and `tests/pads.html` show how): load the game with simulated controllers (`v.fake.on=true`, `v.hands[i].source`, `grip.position` and `grip.quaternion`), draw and loose real arrows, and read the results from the game itself. Run it for all three bows: version 1 (no switch), `bow2=1` and `bow3=1`, in the lab (`lab=1`). Then write `design/angle-sim.md` with the results and what they mean.

## The cases

Hold the bow hand still and steady, aim at the 20 m target, and vary one thing at a time:

1. **Cant (roll of the bow hand):** 0, 15, 30, 45, 60, 90 degrees, both directions, including the bow held flat.
2. **Bow-hand pitch and yaw** away from the line to the target, with the string hand drawing straight back: does the arrow follow the string hand or the bow hand, and by how much?
3. **Where the string hand draws from:** straight back, low (hip), high (above the eye), across the body, and from behind the bow-hand side. For each: draw percentage reached, launch speed, launch direction compared with the line from string hand through the rest.
4. **Draw distance near and past full:** 90, 100, 110 and 130 percent of each bow's full draw.
5. **The release:** a clean release; a 3 cm and a 6 cm jerk of the string hand sideways in the last frames; the same jerk on the bow hand instead. Raw shake and sent error.
6. **Left-handed archer** (bow in the right hand): repeat 1 and 3 briefly and confirm the results mirror.
7. **The string catch:** how far from the nock, at each angle in 1, a trigger still takes the string.
8. **Tracking hiccups:** a single frame where the string hand jumps 10 cm, and one where the bow hand does.

## What to report, for each bow

A table per case: the input, draw percentage, launch speed, launch direction (degrees up and degrees left or right of the line to the target), where it hit or how far it missed, and any errors. Then, in plain words:

- which angles and hand positions feel natural and work;
- any angle where the arrow goes somewhere the player would not expect, or the draw fails, or the string cannot be caught;
- whether the bow follows the wrist the way the design says (`design/fun-bow.md` section 7 says any cant should aim identically);
- concrete fixes, as rules and numbers Claude can build, if anything is wrong.

Limits: the test only reads and simulates; do not change game code in this ticket. If something cannot be simulated with fake controllers (for example the real feel of the trigger), say so rather than guessing.
