# Replayability & Retention Systems

Systems, rules, and numbers to make **Bow & Shadow** genuinely compelling to replay in short VR sittings—without manipulative timers, paywalls, or FOMO traps. Checked against `src/game.js` (`a27349a`), `Arcade-plan.md`, and `design/world-journey.md`.

## 1. The Four Loops

| Loop | Length | What Happens | Pull Into the Next Loop |
|---|---|---|---|
| **Shot** | ~10 s | Draw → haptic full-draw pulse → `0.45 s` perfect-release window → arc through wind → hit (`+pts`, rising pentatonic streak note, gold bullseye burst). | Rising streak multiplier (`1.0×`→`2.0×`) makes every next arrow worth more—don't break the chain. |
| **Stage** | 1–2 min | 5–10 arrows → 3 s best-shot/closest-miss replay → results board showing stars, **exact points/misses short of next star**, and instant `AGAIN` / `NEXT` signs (`< 1 s` restart). | Near-miss delta (`"38 pts to ★★★"`) triggers immediate `AGAIN`; clearing lights the next node on the map. |
| **Sitting** | 10–18 min | 6–12 stage attempts (clear 2–3 stages or 1 full Place, chase 1–2 `★★★`/ribbons) + one 2–3 min Daily Trial or Score Attack before arm/VR fatigue sets in. | Unlocking a new Place vista, 1 unfinished ribbon on a mastered Place, and tomorrow's seeded Daily Trial. |
| **Week** | 3–5 sittings | Short return sessions: fresh date-seeded Daily Trial, advancing across the 6 places + 12 held-back stages, chasing Place Crowns and per-place Arcade PBs. | Forgiving weekly rhythm (`≥3` days/week) + new deterministic Daily Trial—zero punishment for skipping a day. |

## 2. Candy Crush / Arcade Mechanisms Evaluated

| Mechanism | What It Is | Suits No-Shop VR Archery? | Verdict & Reason | Already in `src/game.js`? |
|---|---|---|---|---|
| **Short levels, one goal** | 45–90 s stages teaching one skill. | Yes—matches VR arm stamina. | **USE** — core of repeatable "one more go" flow. | Yes (29 stages, 5–10 arrows). |
| **Three-star grading** | `★` clear, `★★` skilled, `★★★` mastery. | Yes—clear skill ladder. | **ADAPT** — current `0.3/0.6/0.95` of un-streaked `ideal` (`L1111`) hands out `★★★` too easily on shades and non-bullseyes; retune per stage type. | Partial (`L963`, `L1111`). |
| **Near-miss results** | Exact gap to next star/PB. | Yes—honest skill feedback. | **USE** — strongest fair driver of immediate `AGAIN`; never fake distances. | Partial (`X.X m wide` replay; no star-gap text). |
| **Visible map progress** | 6-place map with stars & crowns. | Yes—spatial VR journey. | **USE** — turns stages into visible progression across 6 vistas. | Planned (`world-map-v1.jpg`). |
| **New mechanics paced** | Drop, wind, sliders, pop-ups, shades, places. | Yes—keeps sittings fresh. | **USE** — one new twist every 2–3 stages. | Yes (`Stages.md`, 3 arrows). |
| **Variable rewards** | Random loot/crit rolls. | No—RNG hurts archery skill. | **ADAPT** — reject random loot/crits; use *earned* surprise bonuses (Score Attack Bonus Bell, varied daily seeds). | Planned (Bonus Bell). |
| **Streaks** | In-run multiplier + daily login chain. | In-run yes; FOMO daily no. | **ADAPT** — **USE** in-run streak (`1.0–2.0×`); **soften** daily streak into a forgiving rolling weekly rhythm (hard streak resets are manipulative). | In-run yes (`L1096`); multi-day no. |
| **Daily goals / trial** | 1 fresh short challenge per day. | Yes—fits 10-min VR sittings. | **USE** — deterministic offline Daily Trial + 2 tiny pressure-free sitting goals. | No. |
| **Limited lives / timers** | Lockout after fails unless paying/waiting. | No—hostile to VR sittings. | **REJECT** — manipulative friction; punishes learning. | None. |
| **Boosters** | Consumable power-ups. | Paid/hoarded no; tactical yes. | **ADAPT** — reject hoarded boosters; use fixed per-stage special arrow charges (`2` Rime/Gale/Kiln) that refresh free every try. | Yes (`?arrows=1`). |
| **Friends' scores on map** | Social pins on map nodes. | Later—no server/accounts yet. | **ADAPT** — personal best pins + offline 6-char seed challenge codes now; social leaderboards only post-backend (`Project-notes.md` #6). | Local best per stage only. |
| **Time-limited events** | Expiring seasonal FOMO ladders. | No—creates stress & dead work. | **REJECT** — manipulative urgency; use permanent rotating/archived weekly seeds instead. | None. |
| **Collections** | Trophy wall, bows, crowns. | Yes—great physical VR presence. | **USE** — physical bow rack & 6 Place Crowns behind the stand earned strictly by skill. | Planned (`Asset-and-XR-list.md`). |

## 3. Exact Rules, Numbers, Saves & Size (Every `USE` / `ADAPT`)

| System | Exact Rule & First Numbers | Where in 6-Place Journey | Saved (`localStorage`) | Size |
|---|---|---|---|---|
| **Retuned 3★ grading** | **Rings:** `★ 0.35`, `★★ 0.70`, `★★★ 1.10 × ideal` (demands streak/bullseyes/perfects). **Shades:** `★ ≥50%` banished (min 1); `★★ 100%`; `★★★ 100%` with `≤1` miss & `≥1` perfect release (`First shade`: 1st-arrow perfect). | All 6 places (`rangeResults`) | `stars[stageId]` (keyed by stable ID, not list index) | **S** |
| **Near-miss & instant retry** | Results board shows exact gap (`"38 pts to ★★★"` or `"1 miss from ★★★"`), `"+65 new best"`, or closest miss (`"0.2 m wide"`). `AGAIN` sign stays dead-centre (`< 0.5 s` reload; trigger skips replay). | Every results board & VR bow plaque | Reads `best[stageId]` | **S** |
| **Stage Mastery Ribbon** | 1 optional bonus ribbon per stage (unlocked after `★`, never gates travel): **Clean Quiver** (0 misses) or **Dead-Eye** (`≥3` perfects) on rings; **Swift Banish** (`≤35 s`) or **Pure Bow** (0 special charges) on shades. | Map node tooltip & results board | `ribbons[stageId]` | **S** |
| **Map progress & Crowns** | Map displays per-place `★` & ribbon counts, unlocks held-back stages when release stages reach `≥1★`, awards a **Place Crown** at 100% `★★★` on release stages (cosmetic). | World Map board | Derived from `stars`/`ribbons` | **M** |
| **Daily Trial + 2 sitting goals** | Offline seed from UTC date (`YYYYMMDD`): 1 unlocked place, 5-slot (60–90 s) Score Attack remix, unlimited practice, first **3 scored tries** graded `Bronze/Silver/Gold`. Plus 2 light goals (`3 perfects`, `1 new star`, etc.). | Daily pin on Map + stand notice | `daily: {date, best, tries, goals}` | **M** |
| **Forgiving weekly rhythm** | Track days practised in rolling 7 days (`0..7`) + **Active Weeks** (`≥3` days/week). Missing 1–3 days never wipes progress; 1 automatic grace rest-week/month. `3` days/week adds a cosmetic quiver notch. | World Map corner badge | `practiceDates[]` (last 30 dates) | **S** |
| **Tactical special arrows** | `2` shared charges (`Rime`/`Gale`/`Kiln`), refreshed free every attempt (`design/arrows-spec.md`); optional **Pure Bow** ribbon rewards beating shades without them. | All 6 places (`?arrows=1`) | None new | **S** |
| **Trophy rack & seed codes** | Physical rack behind stand displays 6 Place Crowns + 3 star-milestone bows (`15★` Recurve, `30★` Longbow, `45★` Thornwood—no shop). 6-char offline seed code (`PIER-4F9A`) shares exact Daily/Arcade runs. | Behind stand + Arcade results | `unlocks[]` | **M** |
| **Per-place Arcade** | Score Attack (`180 s`, Bonus Bell `+50` on `≥1.5 s` clear, in-flight buzzer shots count) + Endless Survival per unlocked place, `Bronze/Silver/Gold` medals. | Map mode toggle per place | `arcadeBest[place][mode][input]` | **L** |

## 4. Turning 17 Release Stages Into Deep Repetitions

| Source | Distinct Chases |
|---|---|
| 17 Release stages (`1★` clear + `★★★` mastery + 1 Ribbon each) | **51** handcrafted goals |
| 12 Held-back stages (unlocked per place; clear + `★★★` + Ribbon) | **36** bonus stage goals |
| Per-place Arcade (6 places × 2 modes × 3 medal tiers + PB chase) | **36** Arcade medals + ∞ PBs |
| Meta collection (6 Place Crowns + 3 star-milestone bows) | **9** physical trophies |
| Offline date-seeded Daily Trial + 2 sitting goals | **365/yr** fresh 2-min remixes |

**Total:** **132 fixed goals + unlimited seeded Daily/Arcade loops**—easily **30–50+ short VR sittings** from 17 core stages.

## 5. Privacy-Safe Playtest Metrics (Zero Personal Data, Zero Network Calls)

Store anonymous local counters in `localStorage` with a one-click **`Copy Playtest Summary`** JSON button for volunteer testers:

| Metric | What It Measures | Healthy Target |
|---|---|---|
| `postClearRetries[stageId]` | Voluntary `AGAIN` shots *after* earning `★` | `≥ 1.5` avg on `< ★★★` runs |
| `nearMissRetryRate` | % of runs within `10%` of next star followed by `AGAIN` in `≤15 s` | `≥ 50%` |
| `medianSittingMin` & `attemptsPerSitting` | Quest session length & volume before fatigue | `10–18 min` · `6–12` attempts |
| `day2Return` & `daysInWeek1` | Local date buckets (`+1 d`, `7 d` count) reported after 1 week | `≥ 40%` Day-2 · `≥ 3` days/wk |
| `quitBeforeClearStage` | Stage where players abandon without `★` | `< 15%` on any single stage |
| `dailyTrialShare` | % of sittings that play the Daily Trial | `≥ 50%` after Day 1 |

## 6. Build Order

| Phase | Scope | Why | Size |
|---|---|---|---|
| **1. First release (Trials)** | Retuned `3★` thresholds (`0.35/0.70/1.10` rings; banish+accuracy shades), exact near-miss star-gap text on results board, stage-ID keyed saves, optional local playtest counter export. | Biggest replayability lift per line of code; zero new art and zero risk to the 17-stage launch. | **S** |
| **2. Update 1 (Arcade & Daily)** | Score Attack (with Bonus Bell) + Endless (`Arcade-plan.md`), 1 Mastery Ribbon per stage, offline date-seeded Daily Trial + 2 sitting goals, forgiving weekly rhythm badge, graduate 3 special arrows. | Builds the daily return loop immediately after Day 1 Quest playtest clears. | **M–L** |
| **3. Update 2+ (6-Place Journey)** | 6-place World Map with unlock tree & Place Crowns, per-place Arcade modes, 12 held-back stages unlocked per place, physical stand bow/trophy rack, offline 6-char seed codes (online leaderboards only later). | Full world journey and long-term collection once each place's plans and Quest-tested assets are ready. | **L** |
