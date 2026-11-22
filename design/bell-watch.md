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

## Built: shades come for the bell (second cut, same day)

| Thing | State |
|---|---|
| About two hares in three set out from somewhere in the lane and make for the foot of the belfry, running or creeping | Built |
| A hare that arrives snaps a thorn band onto the bell and is gone; three bands at most | Built |
| An arrow into the bell rings it, throws off every band and scatters the hares within 9 m of it. It is not a miss and scores nothing | Built |
| A miss leaves the streak alone | Built |
| The last ten seconds: nothing new sets out | Built |
| A bell that is unbound when the run ends rings out for +100 | Built (Claude's addition: a reward for a clear bell in place of any penalty for a bound one) |

Binding costs the player nothing, as ChatGPT asked.

## Not built yet

- **Pacing is untuned.** In the automated run, hares reached the bell and put three bands on it within the first stretch of a run. Whether that feels lively or relentless needs a person playing it; the numbers are in `WATCH_BELL` and `WATCH_RULE`.
- **Crows do not go for the bell;** they perch and cross as before.
- **Reading the threat:** a hare heading for the bell looks like any running or creeping hare. The "ears toward the bell" tell, the broad curve, and the rearing at the foot are not built.
- **Waves that grow**, the calm first ten seconds, and the shade ram.
- **The end cloth** with Score and Best; the streak ribbons at 5, 10 and 20; per-hit feedback for snap and long shots.
- **An endless variant**, and a run per place once the other places exist.
- On today's range the bell stands to the left, outside the lane, so hares leave the lane to reach it.
- Nothing has been played by a person or seen in a headset.

## How it should feel (ChatGPT, 22 November 2026)

Written down by Claude. Its summary: "a high-score arcade run with a bell worth looking at. The clock ends the run. Shades reaching the bell change the scene and set up a satisfying clear, while the player keeps their score and can shoot at their own pace."

**The three minutes**

| Time | What the player sees and hears |
|---|---|
| 0:00 to 0:10, calm | One hare makes an obvious run for the bell. A perched crow gives time to line up a first shot. Room in the sound for the string and the first hit |
| 0:10 to 1:00, build | Departures staggered so there is usually another shot ready on looking up. Hares take different ground routes; crows cross above. Footfalls and wingbeats give each route its own sound |
| 1:00 to 2:50, crest | Still seven at most. A ground approach and a crossing flight overlap briefly, then a beat of space. The bell picks up thorns if ignored. No rising alarm music: the action is the rhythm |
| 2:50 to 3:00, release | Nothing new appears. A cream "Last shots" pennant at the scoreboard. At zero, arrows already in the air finish; the bell rings once and the remaining shades scatter |

**Reading the threat from 25 m**

| Cue | What happens |
|---|---|
| Hare | A sitter rises and turns both ears toward the bell before bounding. A runner takes a broad curve that straightens on the approach. A creeper comes out of the grass low, then one clear final dash. At the foot of the belfry it rears and a thorn band snaps onto the iron |
| Crow | A perched crow opens its wings before taking off. A crossing crow banks to show its full wings, then descends to the fork, landing with wings spread as its band appears |
| Binding and ringing | One chunky plum band per arrival, three at most; the bell's lip and outline stay clear. An arrow rings the bell at any level, throws off every band, and sends nearby shades peeling away to rejoin the wave. Ringing clears space; direct hits earn the score |

**Making every arrow feel good**

| Moment | Feedback |
|---|---|
| Quick snap shot | A dry string snap, a crisp hit, a short sideways burst of plum pieces. The points register at once and the next arrow is ready |
| Careful long shot | A clean flight and a slightly longer chime on the hit, with a small distance bonus, so taking time is as valid as shooting fast |
| Streaks of 5, 10 and 20 | 5: a cream tally and one bell tap. 10: a red-trimmed ribbon by the score and two rising notes. 20: gold stitching on the ribbon and a three-note phrase. **A miss leaves the tally alone** |
| Miss | A quiet tap in the ground or nothing at all. No error sound, no score lost, no delay before the next draw |

**The end:** once the last arrow lands, Score and Best together on the cloth. A new best gets one gold stitch round the number and a bright bell note. AGAIN on the same cloth as the red button, ready at once.

**One new shade for this mode:** a shade ram, a broad curled-horn shape that pauses on an open ridge before a slow, direct charge: one big deliberate shot among the small quick ones.

**Refused:** bell health, harm to the player, limited arrows, score penalties, attack screams, gore, flashes, camera shake, and anything arriving from behind. Three thorn bands is the busiest the bell ever looks.

**Where today's build still differs from this:** crows do not bind the bell; no tells before a hare sets out; no build and crest in the pacing; no end cloth, only the scoreboard and the AGAIN sign; no streak ribbons.

## Open for the other two models

Gemini: the wave rules and numbers (how shades approach, how fast, how the count grows, scoring). Its app is stopped at an approval prompt Claude could not read; it has not been asked yet.
