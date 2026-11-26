# Ticket for Gemini: review Claude's build of your Bell Watch rules

From Claude, on the developer's word (26 November): "Have Gemini review it and then put it" on the Quest test link.

Branch `gemini/bell-watch-review` cut from `release-prep` (commit 2017d1b or later). Write `design/bell-watch-review.md`. **Review only; no game code.** Claude makes the changes.

## What to read

- Your rules: `design/bell-watch-rules.md`.
- The build: `src/game.js` from line 808 (`const WATCH2=`) to the end of `w2CrowStep`, plus the hooks listed in `Project-notes.md` under "Bell Watch, second cut".
- The bot test: `tests/watch2.html` (bots idle, fair, good, snap, long; 22 detail checks).
- The switch: `"watch2": false` in `src/config.json`, or `?watch2=1`.

## The bot results against your section 9

| Measure | Result | Your range |
|---|---|---|
| Idle: first band | 10.6 s | |
| Idle: three bands | 37.6 s | 20 to 32 s |
| Idle: bands a minute | 6.67 | 5.5 to 8 |
| Fair: bands a minute | 2.0 | 2 to 3.5 |
| Fair: score | 11.3k to 17.1k across runs | 14k to 18.5k |
| Good: bands a minute | 0 | 0 to 1.2 |
| Good: score | 25.5k to 31.5k | 27k to 32.5k |
| Snap against long | 14,746 against 15,587 | within 10% |
| Most shades in view | 7 (3 in the calm) | 7 |
| Most going for the bell | 2 (1 in the calm) | 2 |
| Shortest hare window | 5.3 s | |
| Shortest crow window | 4.4 s | |
| Rams a run | 3 to 4 | 4 |

## Rule on each

1. **Turnover (Claude's addition).** A shade not after the bell drifts off after 12 to 18 s (`WATCH_STAY`) and is replaced. Without it an idle field filled with sitters and the bell starved. Keep, change the numbers, or replace with something else?
2. **Crow bank distance (Claude's change).** Your bank and glide reached the bell in under 3.5 s. A crossing crow now banks 11 to 16 m from the fork (`WATCH_CROW.bankFrom`). Keep or change?
3. **Ram reservation (Claude's addition).** A due ram waits for a free place on a full field, so 3 rams a run is common instead of 4. Acceptable, or should the ram be allowed to be the eighth shade for its few seconds?
4. **Idle three bands at 37.6 s**, later than your 20 to 32 s. Change a number, or widen the range?
5. **Fair score spread** (11.3k low end). Is the variance acceptable, or which number tightens it?
6. **Anything built differently from your rules.** Read the code against your tables and list every mismatch you find, with the line and the number it should be.
7. **Before the headset.** Is this ready to go on the Quest test link as a separate launcher entry? Anything that would make it unpleasant at 72 fps on a Quest, or break the carefree limits?

For each point: the decision and exact numbers Claude can build without guessing. If two answers are sound, give both and say which you would ship. Commit as `Gemini 4 Neon <gemini@noreply.invalid>` and push only `gemini/bell-watch-review`.
