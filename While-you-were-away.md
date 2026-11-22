# While you were away

22 November 2026. You went out before testing and asked the three of us to keep working in a loop: the game end to end, engagement, mixed reality, and the art direction (ChatGPT draws several pictures, Gemini picks one and writes a theme, and we discuss how it lands in the levels). This page is what happened, and the short list of things only you can decide.

Nothing was put on the public site. The test site was not changed after you left; it still has the build with the cloth menu.

## Your decisions

**Answered on your return, 22 November 2026: "Yes I do approve of all these."** All six are settled as recommended: the theme is The Silent Peal; the first place is Willowbank Range; ribbons are switched on; coins are hidden everywhere; one place ships first; mixed reality waits for your headset test of Trials.

| # | Decision | What we recommend | Where to look |
|---|---|---|---|
| 1 | **The theme.** Gemini chose "The Silent Peal" from ChatGPT's four; ChatGPT agrees. Do you? | Yes. It scored 38 of 40 against 26, 26 and 22, and the game already has bells that ring | `design/theme-directions.md` (the four), `design/theme.md`, `design/theme-look.md` |
| 2 | **Name of the first place.** Willowbank Range, Meadowgate Range or Firstlight Range | Willowbank (ChatGPT's pick; the documents already use it) | `design/replay-plan.md` |
| 3 | **Ribbons on or off.** A second goal on every stage is built and tested but switched off | Turn on after you have tried it with `?ribbons=1` | `design/small-specs.md`, section 2 |
| 4 | **Coins.** The game still hands out coins that buy nothing | Remove them; keepsakes come from ringing each place's bell | `design/theme.md`, section 3 |
| 5 | **What ships first.** One place, or wait for more | One place first. Six places is the largest piece of work in the project | `design/end-to-end.md`, section 2 |
| 6 | **Mixed reality.** Whether to spend one or two days, after Trials and Arcade, on "a bell in your own room" | Only after your headset test of Trials, and park it at once if the headset's browser cannot do it | `design/mixed-reality.md`, `design/mixed-reality-look.md` |

## The theme: The Silent Peal

Six storm bells once carried a warning from the first range up to Stormcrest. Thorn-blight and shade crows have bound them silent. Each place has one bell on a forked timber frame, standing off to one side and never behind a target. Clear the place and its thorns break, the crow leaves, the iron bell turns bronze with a gold lip, and you loose one arrow to ring it. Each place then changes in a way you can see with the sound off: wildflowers at the first range, mist thinning on the lake, bright bands in the quarry wall, warm light through the trees, banners in the village, the storm parting at Stormcrest. At the end the six bells ring together.

Pictures: `assets/concepts/theme-a.jpg` to `theme-d.jpg` (the four directions), `theme-belfry-states.jpg` (the bell silent, restored and rung), `theme-six-places.jpg` (each place before and after).

The other three, for your comparison: A the valley's waterworks reopened gate by gate; C the old road restored by its waystones; D following the shades' spring migration with a field journal.

## The game end to end

Gemini walked the whole path from first opening the page to a player twenty sittings in (`design/end-to-end.md`). The main findings:

- **Built:** the menu, the first stage and its guide, the result with its "points to the next star" line, shades, special arrows (behind their switch).
- **Designed but not built:** everything after the first place: the map, the other five places, ribbons shown on a map, the daily trial, endless modes.
- **Nobody had specified:** a way to reopen the menu inside the headset; what happens when the first place is cleared; what happens after the very last stage; a one-line tip when you fail; a first-time prompt for shades and for special arrows. Gemini has since written exact specs for the last four (`design/small-specs.md`).
- **Where players are most likely to give up,** with the cheapest fix for each: the first minute in the headset; the first hard stage; the run of ring-only stages after the first hare; opening the game on day two; the moment after the last stage.

## Mixed reality

A design note only. No mixed-reality code exists, and nothing is assumed to work in the Quest's browser until checked on the headset. Four ideas, each tied to the theme: a window in your wall onto a valley place; a storm bell hanging in your own room with crows coming from marks on the wall; the valley as a model on your real table; a trophy wall of what you have earned. Both models would try the bell in the room first, as one bell, one crow, one wall. Gemini's plain warning: this is the riskiest surface in the project, every real room is different, and an arrow crosses a room almost instantly, so it needs its own tuning. Picture: `assets/concepts/mr-bell-in-the-room.jpg`.

## What was built

| Thing | State | Switch |
|---|---|---|
| Saves follow a stage by its name, so the stage order can change without stars landing on the wrong stage | Built, tested (`tests/saves.html`). Old saves still load | Always on; changes nothing you see |
| The belfry as a code-built prop, silent and restored, with a bell that swings | Built, rendered (`assets/renders/h8-belfry-*.jpg`). Not in the game yet | - |
| Ribbons: one second goal on each of the 29 stages (no misses, N perfect releases, all shades inside T seconds, or no special arrows) | Built, tested (`tests/ribbons.html`). Shown on the result and in the stage lists | `ribbons`, **off**. Try with `?ribbons=1` |

All earlier tests still pass. None of this has been played by a person.

## Not done

- The fail tip, the two first-time prompts, the "first place cleared" beat and the finale cloth: specified, not built.
- The belfry is not placed in the game and nothing rings yet.
- Nothing new has been seen in a headset: the headset menu, ribbons, the theme, mixed reality.
- Your half-hour test is still the thing everything else waits on.

## How the loop ran

Gemini wrote the walkthrough, the theme choice, the mixed-reality note and the small specs (pull requests 17 to 20). ChatGPT drew eight pictures and answered on look each time. Claude ran the exchange, checked claims against the code, built and tested, and wrote this page.
