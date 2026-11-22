# Bell Watch: the main game

## The decision (22 November 2026)

The developer settled what kind of game this is. In their words: an "archery version of a shooting game that feels good", "like a zombie attack", "just for fun ... they can carelessly keep shooting arrows", "doesn't have to be a pressurized game", "high score stuff". Asked whether to make the carefree wave-shooter the main game and start building it, they said yes.

- **Main game: Bell Watch.** Stand still; shades keep coming for the bell; shoot as freely as you like; beat your score.
- **The 17 stages (Trials)** stay as the training and challenge side.
- **Not** an open world: walking in VR makes many people ill, and the content cost is years.
- This lifted the earlier rule against touching Arcade code before the first headset playtest.
- It is the project's own game in a well-known genre; it copies no particular existing game.

## What "carefree" means in rules

Arrows never run out. No dying and no game-over screen. A run is about three minutes. One number to chase. Different ways to shoot: quick snap shots, careful long ones, and the three special arrows.

## Built: the first playable

Switch `watch` in `src/config.json` (on), or `?watch=1` / `?watch=0`. On the menu as **Bell Watch**. Test: `tests/watch.html`.

| Thing | State |
|---|---|
| A 180-second run on the range, with a clock on the board | Built |
| Arrows never run out | Built |
| Seven shades at a time: four hares (sitting, running, creeping) and three winged (one perched, two crossing) | Built |
| A banished shade is replaced 1.2 to 2.8 seconds later, somewhere else | Built |
| Score with the usual streak and perfect-release bonuses | Built (the stages' own scoring) |
| A best score, kept apart from the stages' stars and saves | Built |
| AGAIN at the end; no stars, no "points to", no failing | Built |

## Not built yet

- **Shades that come for the bell.** Today they appear and behave as they do in the stages; none makes for the bell, and the bell is never bound. This is the heart of the idea and the next thing to build.
- **Waves that grow**, and new kinds of shade arriving as a run goes on.
- **The bell going quiet** when shades reach it, and ringing it to recover.
- **An endless variant**, and a run per place once the other places exist.
- **Hares hidden in grass and crows flushed from bushes** are left out of the run for now.
- Feel: per-hit feedback, the end-of-run moment, music.
- Nothing has been played by a person or seen in a headset. The three-minute length and the seven-at-a-time count are first guesses.

## Open for the other two models

Gemini: the wave rules and numbers (how shades approach, how fast, how the count grows, what binding the bell costs, scoring). ChatGPT: how it should feel. Gemini's app is stopped at an approval prompt Claude could not read; it has not been asked yet.
