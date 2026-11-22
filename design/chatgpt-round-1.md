# Design round 1: ChatGPT's proposal

Written by ChatGPT on 22 November 2026 in answer to the team question (roles, elemental arrows, Arcade, mixed reality). Copied here by Claude without changes to the substance; the table layout is Claude's.

## Roles
I'd own art direction, concept images, visual acceptance criteria, and reviews of readability and motion. I'd also write the first pass of mechanic rules where the visual cue matters to play. Claude should own implementation, performance profiling, integration and release branches. Gemini should own independent rules audits and regression cases, with test or documentation changes on its own branch. I'd change the handoff: Gemini challenges the rules before Claude implements them, then checks the result against the agreed cases. The developer owns final decisions and headset sign-off.

## Elemental arrows
Prototype these individually after Trials ships, in an unranked challenge with two special shots per run. Each release spends a charge, including a miss. The standard arrow remains available. At 15 to 30 m, put the identifying shape on the target, where it can actually be seen.

| Arrow | Exact rule and trade-off | VR read |
|---|---|---|
| Kiln (fire) | A hit on a designated thorn plate removes it and scores zero. The core becomes hittable for 2 seconds. The player spends a shot and must land the follow-up. | Three broad cream chevrons rise off the plate and fade. The thorns visibly fall away. No flame, ember red, or gold. |
| Rime (frost) | A hit on a slider's outer rim stops it for 0.8 seconds and scores zero. A follow-up scores normally. Each target can freeze once. | A broad sky-blue bracket locks around the target. Its stopping motion carries the cue. |
| Gale (wind) | This shot receives 50% of normal lateral wind acceleration. Its maximum ring value is 60, before ordinary scoring bonuses. | A short cream trail with three plum diagonal bands. Keep the ordinary impact cue and show the score clearly. |
| Stone (weight) | On designated hinged targets, an outer-ring hit flips the target for 1.2 seconds and scores zero. Only the exposed reverse face scores during that window. | The face visibly rotates from pale cream to slate. Use the existing target geometry and a single colour change. |

## Arcade
1. Build Score Attack first. Start with 30 fixed six-second slots and standard equipment. Show the next target position for the last 0.5 seconds of each slot so players can reacquire without panning blindly.
2. Define the buzzer. At 180 seconds, close scoring and resolve any remaining shots as expired. Show the countdown clearly and test arrivals just before, exactly at, and just after the cutoff.
3. Make Endless misses legible. Keep the agreed refunds and voids. On the results card, show shots, misses and voids separately so playtesters can explain how they ran out of arrows.

## Mixed reality
Start with The Window: a 60-second Score Attack lane. One fixed virtual opening shows three staggered targets at range depth while the room stays visible around it. Use a thick plum frame and opaque cream target faces with broad plum rings. Keep the timer on the frame and test readability against both bright and dark rooms on Quest.

## Risks
Kiln and Stone both ask for two shots. Drop whichever produces less interesting follow-ups. Rime's 0.8 seconds may be too short for a comfortable redraw. Test it before tuning the charge count. Use brief, flat effects and measure the busiest wave on Quest. Keep each experiment flagged and off the public site. The 17-stage Trials ships first, and VR or MR claims require headset results.
