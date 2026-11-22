# Bow & Shadow: End-to-End Player Journey Audit

Full player path from first page load to Sitting 20, audited against `release-prep` (`932ab8c`), `Stages.md`, `design/world-journey.md`, `design/replay-plan.md`, `design/first-menu.md`, and `design/place-plans.md`.

## End-to-End Path

| # | Beat | Player Does | Sees & Hears | Asked of Them | Given | Time | Spec File | State |
|---|---|---|---|---|---|---|---|---|
| 1 | **First open & menu** | Opens URL; clicks `Begin` (desktop) or `Enter VR` (Quest) | Cream cloth banner over live range; quiet wind | 1 click (zero settings questions) | Instant entry onto Stage 1 (no VR menu) | 5 s | `first-menu.md` | **BUILT** (`menu` on; `vrmenu` off, untested on Quest) |
| 2 | **First arrow & guide** | Draws bow & looses 5 arrows at `10 m` (`First marks`) | Guided text/low VR board, full-draw pulse, hit knock, rising streak notes | Follow 1-line prompts; earn `≥1★` | Safe 3-arrow refill if 0 hits; clear `★` unlock | 60 s | `Stages.md` | **BUILT** (guide board unverified on Quest) |
| 3 | **First result & retry pull** | Watches 3 s best-shot replay; shoots `AGAIN` or `NEXT` | Slow-mo arrow, star stamps, **star-gap line** (`"38 pts to ★★★"`), new best | Choose retry for `★★★` or advance | Instant `<1 s` turnaround; saved best & stars | 15 s | `replay-plan.md` | **BUILT** (star-gap live; `3★` retune & haptics **DESIGNED**) |
| 4 | **Failed stage (0★)** | Misses clear threshold; shoots `AGAIN` | Closest-miss replay (`X.X m wide`), `"Not enough"`, coaching cue (`"3 shots short"`) | Adjust aim & retry immediately | Same stance/setup; actionable fix cue | 10 s | `replay-plan.md` | **MISSING** (replay built; coaching-cue algorithm unspecified) |
| 5 | **First shade (`First shade`)** | Aims at dark-plum hare (`14 m`) with ember eyes | Head turn, eye flare, ember banish burst + chime | Read live creature vs static ring | First Chapter-2 thrill & clear shade contrast | 45 s | `Stages.md` | **BUILT** (**MISSING:** 1-line intro distinguishing shades from rings) |
| 6 | **Clearing Place 1** | Clears all 4 Willowbank release stages (`≥1★` each) | Banner fills in, bell tone, keepsake stall trophy, `"Pier & Quarry Open"` | Open Map to choose next place | Place 1 keepsake + Tier 2 unlocked | 6–8 m | `world-journey.md`, `replay-plan.md` | **DESIGNED** (**MISSING:** exact transition screen into Map) |
| 7 | **First sight of Map & Tier-2 choice** | Points at `World Map`; compares Pier vs Quarry on relief table | `1.4×0.9 m` tilted valley table; Willowbank lit, Pier & Quarry routes draw in colour | Pick water/wind (Pier) or bowl/benches (Quarry) | Agency over route; visible 6-place horizon | 20 s | `world-journey.md`, `first-menu.md` | **DESIGNED** (**MISSING:** in-VR button to reopen Menu/Map mid-play) |
| 8 | **Arriving somewhere new** | `0.5 s` VR fade lands on Reedwater Pier (or Places 2B–4) | Water on 3 sides, cool morning sky, piling targets, cloth board & pennant `<42°` | Adapt to new height/drop & wind | Fresh VR presence & distinct lighting/layout | 10 s | `place-plans.md`, `vr-stand-rules.md` | **DESIGNED** (aerials done; **MISSING:** per-place ambient sound spec) |
| 9 | **First special arrow** | Picks `Rime`, `Gale`, or `Kiln` (`1–4` / left stick) | Band on nocked arrow, pip counter (`●●`), bracket / banded trail / cream chevrons | Spend 2 shared charges wisely | Tactical tool with zero paywall | 60 s | `arrows-spec.md` | **BUILT** (`?arrows=1` off; **MISSING:** in-game onboarding prompt) |
| 10 | **First Mastery Ribbon** | Replays a cleared stage for bonus goal (`Clean Quiver`, `Pure Bow`, etc.) | Ribbon stamp on results cloth & map node | Hit secondary skill goal without gating travel | Extra depth per stage | 90 s | `replay-systems.md` | **DESIGNED** (**MISSING:** 29-stage ribbon assignment table) |
| 11 | **Returning Day 2** | Opens URL / enters VR on overlook hub | 3D banner at `2.4 m` (point+click): `★ X/51`, red `Continue`, `World Map`, `Daily Trial` | Pick 1-click resume or Daily Trial | Zero lost progress; forgiving weekly rhythm | 10 s | `first-menu.md`, `replay-plan.md` | **DESIGNED** (2D face built; VR banner behind `vrmenu` off) |
| 12 | **Daily Trial** | Plays UTC-seeded 60–90 s remix (3 scored tries + 2 sitting goals) | Fresh target/wind pack on an unlocked place; `Bronze/Silver/Gold` card | Beat today's target score | Daily come-back hook with zero FOMO penalty | 3 m | `replay-plan.md` | **DESIGNED** (**MISSING:** deterministic generator & goal pool spec) |
| 13 | **Finishing Stormcrest** | Clears `The gauntlet` + `Blighted meadow` across the `12.5 m` gorge | Stormcrest banner keepsake + valley finale celebration | Celebrate & see what opened next | Unlocks final held-back stages & full Arcade | 4 m | `world-journey.md` | **MISSING** (no end-of-journey banner, chord, or post-clear signpost) |
| 14 | **Held-back stages & Arcade** | Plays 12 master stages (`60–70 m`), Score Attack (`+50` Bonus Bell), Endless | Seeded 180 s timetables / 10-arrow survival; Bronze–Gold medals per place | Master long wind, speed, accuracy | 36 held-back goals + 36 Arcade medals + PBs | 10–15 m | `Arcade-plan.md`, `journey-check.md` | **DESIGNED** (gated on Quest test; **MISSING:** per-place timetables) |
| 15 | **Sitting 20** | Daily Trial, remaining `★★★`/ribbons, 6 keepsakes, 3 star bows, Arcade PBs | Physical bow rack & keepsakes behind stance; 6-char share codes | Self-directed mastery & friend seed swaps | 132 fixed goals + daily/endless tail | 10–18 m | `replay-plan.md` | **MISSING** (coins vs star-unlock conflict & share-code spec) |

---

## 1. Ranked `MISSING` List (By Harm to the Player Path)

1. **In-VR menu/map opener (`CRITICAL`):** Once inside VR (`first-menu.md` L85), there is no pause/wrist control to open Settings or World Map mid-session; players are stuck until leaving VR.
2. **Place-1 clear handoff & Stormcrest finale beat (`HIGH`):** No spec defines the moment Place 1 introduces the World Map or the end-of-journey celebration/signpost after `Blighted meadow`.
3. **First-shade & special-arrow onboarding (`HIGH`):** Stage 1 has a guide board, but neither `First shade` nor `Rime`/`Gale`/`Kiln` controls/rules have an in-game prompt.
4. **Actionable fail-screen coaching rule (`MEDIUM`):** Need exact miss-classification logic (short vs high vs wind-pushed) from `q.path` to drive the 1-line tip on 0-star runs.
5. **Coins vs star/keepsake unlock rule (`MEDIUM`):** `src/game.js` still earns unused `coins`, conflicting with star-milestone bows and place-clear keepsakes—remove coins or tie them cleanly to keepsakes.
6. **29-stage Mastery Ribbon assignment table (`MEDIUM`):** Which of the 4 ribbons fits each stage (e.g., 1-hare `First shade` cannot require 3 perfects).
7. **Daily Trial generator & sitting-goal pool (`MEDIUM`):** Exact deterministic slot/wind/medal rules from `YYYYMMDD` seed.
8. **Per-place Score Attack 30-slot timetables & Endless wave curves (`LOW–MEDIUM`):** Engine is specified in `Arcade-plan.md`, per-place data is not.
9. **Per-place ambient audio spec (`LOW`):** Procedural wind/water/bird/bell mix per place so each stance sounds distinct in VR.
10. **Offline 6-char seed challenge code format (`LOW`):** Bit layout and decode flow for Update 2+.

---

## 2. Next 10 Things to Build (In Order, Within Standing Rules)

| # | Build Item | Size | Depends On | Flag / Gate |
|---|---|---|---|---|
| 1 | **Developer Day 1 Quest + Desktop Playtest (`Day-1-test-sheet.md`)** | **S** | Current test build | Mandatory gate for Arcade & VR claims |
| 2 | **Day 1 Blocker Fixes + In-VR Menu Opener + `Posture` / `Replays in VR` Settings** | **S** | #1 | `vrmenu` switch; verifies `2.4 m` banner on Quest |
| 3 | **Stable Stage-ID Save Migration + Star-Threshold Tuning Check** | **S** | #1 (playtest scores) | Preserves existing saves before any reorder |
| 4 | **Actionable 0★ Miss Tip + Shot-Feedback Polish (ChatGPT Haptic/Audio Table)** | **S** | #1, Missing #4 spec | `replay` switch |
| 5 | **Special-Arrow 1-Line Onboarding + Graduate `arrows` Switch** | **S** | #1 (Quest cue check), Missing #3 | `arrows` switch |
| 6 | **Stage Mastery Ribbons (29-Stage Table + Results & Stage-List Stamps)** | **S** | #3, Missing #6 spec | `ribbons` switch |
| 7 | **Arcade Core: Score Attack (`+50` Bonus Bell, Buzzer Rule) + Endless (`Arcade-plan.md`)** | **L** | #1 (standing rule!), #3 | `arcade` switch; seeded 30/72/120 fps tests first |
| 8 | **Offline Daily Trial + 2 Sitting Goals + Forgiving Weekly Rhythm** | **M** | #7, Missing #7 spec | `daily` switch; zero PII/server |
| 9 | **Willowbank Range Final Build (Deck Over Channel + Approved Standing Hare/Crow)** | **M** | #1 + Step 2/3 asset sign-off | `world` switch; `≥72 fps` Quest check |
| 10 | **Stone Overlook Hub + Relief Map Table + Reedwater Pier (Place 2A) + Travel Fade** | **L** | #3, #9, Pier POVs/assets | `journey` switch; proves 2-place travel before Places 2B–4 |

---

## 3. Weakest Engagement Moments (Quit Risks) & Cheapest Fix

| Dropout Moment | Why Players Put the Headset Down | Cheapest Fix (`S`) |
|---|---|---|
| **1. First 60 s in VR (clumsy draw / short arrows)** | Missing 3 shots in a row on `First marks` feels broken, not challenging. | Keep Stage 1's 3-arrow refill and add a reactive `"Aim a touch higher"` line after 2 consecutive short misses. |
| **2. First wall (`Crosswind` `-5 m/s` or `Crossing pair`)** | Failing 3 times without knowing whether wind, drop, or timing caused it creates helplessness. | Show the 1-line evidence tip on 0★ results (`"Wind pushed 4 shots left — try Gale or aim right"`) and suggest `Rime`/`Gale` after 2 fails. |
| **3. Ring-only stretch after `First shade` (Pier + Quarry)** | Six straight ring stages before Alderwood's shades can feel repetitive for players hooked by `First shade`. | Celebrate Place 1 clear with a bell chord + immediate Pier/Quarry choice on the map, and surface each stage's `Clean Quiver` ribbon right away. |
| **4. Opening on Day 2 (blank habit)** | Returning to a static stage list with a hard stage blocking progress invites closing the browser. | Put 1-click red `Continue` and a fresh 90-second `Daily Trial` side-by-side on the returning banner so every Day-2 login has an easy, novel win. |
| **5. Right after clearing Stormcrest (`Blighted meadow`)** | Ending on ordinary `AGAIN / BACK` signs kills closure and hides post-game replay modes. | Show one celebratory Finale Cloth (`"Brackenford Cleared · ★ X/51"`), ring a 7-note bell chord, and place direct buttons to **Held-Back Master Stages** and **Score Attack**. |
