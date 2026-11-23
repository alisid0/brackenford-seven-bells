# The game's skeleton

Written on the night of 23 November, while the developer slept, from what is in the code and its tests. "Skeleton" here means every part of the game exists and connects end to end, in a plain unrendered form; "body" is what makes each part good, and comes next.

## Play it

| Address (add to the test site's address) | What it is |
|---|---|
| `?grey=1&bow2=1&pads=1` | **The skeleton as it stands tonight:** the whole game unrendered, with the second-version bow and the settled Quest controls |
| `?lab=1&bow2=1` | The test range with the second-version bow |
| `?lab=1` | The test range with today's bow, to compare |
| no switches | The game as it was before tonight |

## The loop

```
first menu ──► Trials: 17 stages in order ──► result (stars, ribbon, points to the next star) ──► next stage
     │                                                      ▲
     ├──► Bell Watch: 3 minutes, arrows never run out ──► result (score, best) ──► again
     │
     ├──► Settings: bow hand, draw mode, draw length
     │
     └──► (?lab=1) mechanics lab: no end, every shot read out
```

`tests/skeleton.html` plays that whole loop in grey: menu, two stages to their results and on, a far stage on the terraces, a full Bell Watch run with its ram to the end and again, and the lab.

## Every system, and where it stands

**State:** ✔ built and covered by a test · ◐ built, but never tried on a headset or by a person · ✖ missing

| System | State | Notes |
|---|---|---|
| **Shell** | | |
| First menu (flat screen) | ✔ | Begin or Continue, Bell Watch, Stages, Settings |
| Menu in the headset | ◐ | Switch `vrmenu`, off; never run on a headset. With `pads` on, the bow hand's upper button opens it |
| Settings: bow hand, draw mode | ✔ | |
| Settings: draw length | ✔ | `bow2` only: Auto, Short 46 cm, Long 64 cm, Reset |
| Saves | ✔ | Kept by stage name, so reordering stages loses nothing |
| **Bow and arrow** | | |
| Desktop: mouse draw | ✔ | |
| Headset: two-handed draw | ◐ | Tested with simulated controllers only |
| Headset: single-handed draw | ◐ | |
| Headset: hand tracking | ◐ | |
| Arrow flight, version 1 | ✔ | The default: gravity 7, no air, straight-line speed |
| Arrow flight, version 2 (`bow2`) | ◐ | Gemini's spec: reach-fitted draw, speed curve, real gravity and air, jerk-free release, 1.2 s sweet spot, haptics table. Every pass bar in `tests/bow2.html` met; **the stages were placed for version 1** and are being re-checked by Gemini |
| **Controls** | | |
| Triggers, grips, sticks | ◐ | |
| Quest face buttons (`pads`) | ◐ | Gemini's settled map, in `design/arrow-mechanics-v2.md` section 8. Button numbers from the published profile; unconfirmed on the developer's controllers |
| Face down the lane again | ◐ | Bow hand's stick held 0.6 s |
| **Trials** | | |
| 17 stages in release order | ✔ | |
| Stars, best scores, next star line | ✔ | |
| Ribbons | ✔ | |
| Replay of the best shot | ✔ | |
| Practice Bell | ✔ | Unbinds after the first four stages |
| **Bell Watch** | | |
| The run, its score and best | ✔ | |
| Hares that bind the bell, ringing it clear | ✔ | Pacing untuned |
| The shade ram | ✔ | Gemini's numbers |
| Waves that grow, a calm start | ✖ | |
| Crows that go for the bell | ✖ | |
| A tell before a hare sets out for the bell | ✖ | |
| End cloth with score and best | ✖ | The scoreboard does it for now |
| Streak ribbons at 5, 10 and 20 | ✖ | |
| An endless run | ✖ | |
| **Shades** | | |
| Hares: sit, hide, creep, run | ✔ | |
| Crows: perch, flush, cross | ✔ | Still a stand-in built from a few solids |
| Ram | ✔ | |
| **World** | | |
| Willowbank Range (`world=2`) | ✔ | First place |
| Grey skeleton (`grey`) | ✔ | Tonight |
| Lighting pass (`grade`) | ◐ | Accepted by ChatGPT before the change of plan; off |
| The five other places | ✖ | Pictures only |
| Moving between places | ✖ | |
| **Feedback** | | |
| Scoreboard and the plaque on the bow | ✔ | |
| Sound | ✔ | All made in code |
| Haptics | ◐ | Version 1, or Gemini's table with `bow2` |
| **Tools** | | |
| Mechanics lab (`lab`) | ✔ | Tonight |
| Test site | ✔ | `archery-range-test.vercel.app`, never the public one |
| Unity version | ◐ | Runs as a Windows build; no headset support, no shades |

## The body: what comes next, in order

1. **The developer, in the headset (about 15 minutes):** the lab with and without `bow2`, Gemini's three-minute script in `design/arrow-mechanics-v2.md` section 9, and the four face buttons. Decides whether `bow2` and `pads` become the game's own.
2. **If yes:** the stages Gemini's re-check says must change under the new flight are moved; `bow2` and `pads` are switched on for everyone; the tests' aiming helpers move to the new gravity.
3. **Bell Watch's missing pieces**, in this order: the calm start and growing waves, the tell, crows at the bell, the end cloth, streak ribbons.
4. **The headset menu** tried and switched on.
5. **Only then looks:** the lighting pass, the crow made properly, the next place.
