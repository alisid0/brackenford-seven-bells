# What makes players come back: the combined plan

The developer asked (22 November 2026) the three models to lay out what the game needs so that it has "an addictive Candy Crush like addiction with respect to repetitions and levels". This is the combined answer. Gemini wrote the systems and numbers (`design/replay-systems.md`); ChatGPT gave the feel and cues (recorded below, since it cannot write to the repository); Claude checked both against `src/game.js` and wrote this page.

**Status: a plan. Nothing here is built unless the "have today" column says so. Every number is a first guess, untested.**

## The idea in one paragraph

Candy Crush holds people with a handful of things: levels a minute or two long with one clear goal, a three-star grade, a result that shows how close you came, a map you can see yourself crossing, a new twist every few levels, and a reason to look in again tomorrow. It also uses things built to trap people: lives that run out, timers, paying to continue, streaks that punish a missed day. All three of us agree: take the first list, refuse the second. ChatGPT's line for it: the strongest reason for one more go is "I know what I'd do differently."

## The four loops

| Loop | Length | What pulls you into the next |
|---|---|---|
| One shot | about 10 seconds | The streak: each hit in a row is worth more, so the next arrow matters |
| One stage | 1 to 2 minutes | The result shows exactly how far you were from the next star, and AGAIN is right there |
| One sitting | 10 to 18 minutes (a headset and a bow arm tire) | A new place opening on the map; one unfinished goal; tomorrow's daily trial |
| One week | 3 to 5 sittings | A fresh daily trial each day; crossing the six places; nothing lost for skipping a day |

## What the game needs, and what it has today

| # | Thing | What it is | Have today | Verdict | Size |
|---|---|---|---|---|---|
| 1 | Short stages, one goal each | 5 to 10 arrows, one skill | Yes: 29 stages | Keep | - |
| 2 | Three-star grade | 1 star clears, 3 is mastery | Yes, but 3 stars at 95% of a score that ignores the streak bonus | Retune (see caution) | Small |
| 3 | "How close" on the result | "38 points to the next star", "+24 new best" | Part: new best and closest-miss replay exist; no star gap | Add | Small |
| 4 | Instant retry | AGAIN live at once, same stance | Yes: AGAIN and NEXT signs | Keep; make sure nothing delays it | - |
| 5 | Shot feedback that teaches | Distinct release, hit, bullseye and near-miss sight, sound and controller tap | Part: hit sounds, a rising streak note, a full-draw pulse | Polish to ChatGPT's table | Small to medium |
| 6 | A map you cross | Six places, stars and pennants shown on each | No: one place, a stage list | Build with the journey | Large |
| 7 | New twist every few stages | Drop, wind, sliders, pop-ups, shades, special arrows, new places | Yes in the stage order; arrows behind a switch | Keep | - |
| 8 | A second goal per stage | One ribbon each: no misses, three perfect releases, under 35 s, or no special arrows | No | Add | Small |
| 9 | Daily trial | One short seeded challenge a day, same for everyone, three scored tries, bronze to gold | No | Add | Medium |
| 10 | Weekly rhythm, not a streak | Counts days played this week; three is a good week; a missed day costs nothing | No | Add | Small |
| 11 | Things to collect, no shop | One keepsake per place for mastering it, shown in the world; three bows at star milestones | Part: coins exist and buy nothing | Add | Medium |
| 12 | Endless modes per place | Score Attack with the Bonus Bell, and a survival mode | Planned (`Arcade-plan.md`); not built | Add after the headset test | Large |
| 13 | Scores to beat | Own best on each stage now; share codes; friends' scores only when there is a server | Own best only | Later | - |

**Refused by all three:** lives and wait timers, paying to continue, random loot, events that expire, streaks that reset when a day is missed, reminders built on losing progress. Also (ChatGPT): confetti that hides the lane, repeated buzzing, forced head turns, long reveals that cannot be skipped.

## The reward moments (ChatGPT)

Timings are starting points for headset testing. One short controller tap per event at most.

| Moment | See | Hear | Feel | Lasts |
|---|---|---|---|---|
| Loose | String snaps forward | Dry string snap, close | Light tap, release hand | 70 ms |
| Hit | Target kicks; score beside the face | Straw or wood knock from where it hit | Short tap, bow hand | score 0.5 s |
| Bullseye | Inner ring brightens cream | A clear bell note over the knock | One firmer tap | 0.3 s |
| Streak builds | Plum chevrons fill on the score cloth | Short rising interval | none extra | 0.3 s |
| Near miss | Arrow stays where it went wide; dust tick | Impact from that direction | none | 0.25 s |
| Last arrow | Bow plaque reads "Last arrow" | One soft wood click | none | until loosed |
| Result | Cream cloth: score, next goal, Retry and Continue | Brief resolving chord | none | controls live at once |
| Stars land | Each stamps into its slot | One light note each | optional tap on the last | 0.4 s in all |
| New best | "New best · +24" beside the score | One higher note in the chord | none | 0.5 s |
| Place cleared | Its banner fills in on the map | One bell tone | one soft tap | 0.45 s |
| New place opens | The route draws out; its miniature comes into colour | Quiet chime from that direction | none | 0.6 s |

**The map:** a cleared place stays in full colour with an embroidered pennant and its star count on the nameplate; a locked place shows one landmark in muted colour and, when looked at, says what opens it; the current place has a plum ring.

**Keepsakes, one per place:** a stall trophy (place 1), lake-blue fletching (Pier), a carved bow finish (Quarry), a plum-and-cream arrow trail (Alderwood), a bell (Village), an embroidered banner (Stormcrest).

**A failed stage:** one line on what was close, one cue the player can act on where the game has the evidence ("three shots landed short"), Retry nearest and ready, same stance and setup.

## How 17 stages become enough to chase (Gemini's count)

| Source | Goals |
|---|---|
| 17 release stages × (clear, three stars, ribbon) | 51 |
| 12 held-back stages × the same | 36 |
| Six places × two endless modes × three medals | 36 |
| Six place keepsakes and three bows | 9 |
| Daily trial | a new one every day |

132 fixed goals plus the daily trial. Gemini's estimate of 30 to 50 sittings from that is a guess, not a measurement.

## Build order

| When | What | Why |
|---|---|---|
| **First release** | The star-gap line on the result (3); saves keyed by stage name rather than position; local playtest counters with a "copy summary" button; shot-feedback polish (5) | Small, no new art, no risk to the 17 stages, and the biggest pull per line of code |
| **Update 1** | Ribbons (8), daily trial (9), weekly rhythm (10), Score Attack and survival (12), special arrows out from behind their switch | The come-back-tomorrow loop |
| **Update 2 onward** | The six-place map (6), keepsakes and bows (11), endless modes per place, share codes | Needs each place's plans, pictures and assets first |

## What to measure (kept on the player's own device; no personal data, nothing sent)

Replays of a stage after it is cleared (target 1.5 or more when short of three stars); how often a near miss is followed by AGAIN within 15 seconds (half or more); length of a sitting (10 to 18 minutes) and attempts in it (6 to 12); whether a tester plays again the next day; the stage where people give up (no stage above 15%).

## Claude's cautions

1. **Star retune.** Gemini proposes three stars at 110% of the plain score on ring stages, which needs streaks and bullseyes. Checked in code: a hit scores up to 2× on a streak and 1.25× on a perfect release (`src/game.js` line 1097), so it is reachable in principle. Whether it is reachable by a real player on every stage is unknown. It should be tried with the seeded replay test and a person before it replaces the current 30 / 60 / 95%.
2. **"Addictive".** The measure of success here is that people choose to come back, shown by the counters above. If a number can only be moved by one of the refused tricks, the number is the wrong target.
3. **Order against standing rules.** Arcade code is not to be touched until the first headset playtest; the first-release items above do not touch it. Changing how saves are keyed must carry over existing saves.
4. **Nothing on this page has been felt in a headset.** Haptic timings, sitting length and comfort are all untested.
5. **Coins.** The game already awards coins that buy nothing. They either become the path to keepsakes or are removed; undecided.

## Also settled or proposed in this round

- ChatGPT's names for place 1, replacing "Brambleford": **Willowbank Range** (its pick), Meadowgate Range, Firstlight Range. The developer chooses.
- ChatGPT accepts Gemini's three stage moves, pale grass on Stormcrest's saddle, and no trunks inside Alderwood's shooting area.
