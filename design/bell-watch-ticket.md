# Ticket for Gemini: Bell Watch, the body of the main game

From Claude, on the developer's word (26 November). The headset playtest of the fun bow has to wait (no headset for a while), so we move on to the main game. Bell Watch does not depend on which bow wins.

Branch `gemini/bell-watch` cut from `release-prep`. Write `design/bell-watch-rules.md`. **Design only; no game code.** Claude builds it behind switches and tests it. Read `design/bell-watch.md` first: what is built, the feel ChatGPT wrote on 22 November, and what is refused.

## What exists today (from `src/game.js`)

| Thing | Today |
|---|---|
| Run | 180 s (`WATCH_RULE.seconds`), unlimited arrows, no game-over |
| Shades on the field | Always 7: 4 hares, 3 crows (1 perched at the start, 2 crossing at lane 15 to 27 m) |
| Refill | A banished shade is replaced 1.2 to 2.8 s later (`WATCH_RULE.again`) |
| Bell runners | 65% of new hares set out from lane 11 to 30 m, up to 6 m to either side, running (55%) or creeping, for the foot of the belfry (`WATCH_BELL.share`) |
| Arrival | Within 1.3 m: one thorn band on the bell, three at most; the hare is gone |
| Ringing | An arrow in the bell throws off every band, scatters hares within 9 m; not a miss, no points |
| End | No new shades in the last 10 s; an unbound bell at the end gives +100 |
| Ram | `RAM_RULE`, your numbers: first at 22 to 26 s, then 34 to 38 s after the last, none in the last 20 s |
| Scoring | The stages' own: points by distance, streak and perfect-release bonuses; a miss leaves the streak alone |
| End screen | The scoreboard and an AGAIN sign only |

Known problem: in the automated run, hares put three bands on the bell within the first stretch of a run. The pacing has never been tuned.

## Rule on each, with numbers Claude can build without guessing

1. **The curve of a run.** Calm (0 to 10 s), build (10 to 60 s), crest (60 to 170 s), release (last 10 s). For each: how many shades at most, the refill delay, the share that go for the bell, and how fast they move. One table by time.
2. **The tell before a hare sets out.** How long a sitter rises and turns its ears to the bell before it bounds; the broad curve of a runner (how wide, where it straightens); the creeper's low approach and final dash (when, how fast). The rear at the foot of the belfry (how long). Each must be readable at 25 m.
3. **Crows at the bell.** Share of crows that go for it, the bank (how long the full wings show), the descent to the fork, landing and the band. Whether a crow and a hare count the same.
4. **The bell's rhythm.** How often a band should land in a run a fair player plays, and how long a bound bell should stay worth ringing. Whether ringing has a cool-down.
5. **Streak ribbons at 5, 10 and 20.** What counts toward a streak in this mode (do bell rings, rams, crows all count?), and any score multiplier, or none.
6. **Snap and long shots.** How a shot is judged quick or careful (time from draw to release, distance), and the bonus for each, so both styles score about the same over a run.
7. **The end cloth.** The order of what is shown (score, best, a line or two of the run's numbers), how long before AGAIN works, and what a new best gets.
8. **The score to chase.** The expected score for a new player, a fair one and a very good one, so Claude can check the numbers in an automated run.
9. **How to judge it without a headset.** The developer has no headset for now: what Claude's automated runs should measure (bands per minute, shots per minute, idle seconds with nothing to shoot) and what range each should fall in.

Limits: carefree (no harm to the player, no lost points); nothing from behind; no flashes or camera shake; the world never moves under the player in a headset; seven shades at most in view; buildable in a web page on a Quest. If two answers are both sound, give both and say which you would ship. Commit as `Gemini 4 Neon <gemini@noreply.invalid>` and push only `gemini/bell-watch`.
