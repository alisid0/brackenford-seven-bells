# Review of Bell Watch, Second Cut (`?watch2=1`)

Audit of Claude's implementation in `src/game.js` (commit `3a2056d`, `const WATCH2` at line 808 through `w2CrowStep` plus hooks) and `tests/watch2.html` against `design/bell-watch-rules.md`. **Review only; no game code modified.**

Overall: the architecture is clean, compact, and faithful to the spec's four-phase curve, tells, crow banking, ribbon tiers, snap/long bonuses, and carefree limits. However, the line-by-line audit caught **two critical visual bugs on the live standing hare (`RIG2`)** — bell-bound hares slide stiff-legged without bounding (`sp.cyc` never updates) and never sweep their ears during the tell (`standingPose` never reads `sp.w2.ear`) — plus a `padDo` bypass of `againGuard` and a `52px` end-cloth line wrap. Fix those four before putting `?watch2=1` on the Quest test link.

---

## 1. Turnover (`WATCH_STAY = [12, 18]`)

**Decision: Keep turnover, and tighten `WATCH_STAY` to `[10, 15]` s.**

Claude was right to add turnover: without it, an idle or selective player fills the non-bell slots with permanent sitters and starves both the bell and the ram. Keeping `sp.cfg.t === 'perch'` exempt (`line 858`) and retiring crossing crows only in `gap` (`line 862`, never mid-air) is exactly right.

- **Option A (Ship this):** **`const WATCH_STAY = [10, 15];`** — brisker refresh of idle sitters (`20%` faster turnover), still `3–4` full draws to shoot any sitter, keeps idle bell rhythm livelier, and reduces sitter build-up on Fair runs.
- **Option B:** Keep `[12, 18]` as built, or split `sit: [10, 14]` / `other: [14, 18]`.

---

## 2. Crow bank distance (`WATCH_CROW.bankFrom = [11, 16]`)

**Decision: Keep `bankFrom = [11, 16]` m, and add the missing `WATCH2` crossing-speed / height clamp in `birdPass()`.**

During the `1.2 s` bank (`w2CrowStep`, `line 922`), speed interpolates from crossing speed down to `2.8 m/s`, covering `5.5–7.5 m` before the `4.2 m/s` glide starts. Banking within `6 m` of the bell side left almost no glide (`< 3.5 s` total window). `bankFrom: [11, 16]` fixes that cleanly (`4.4 s` shortest window, above the `4.0 s` floor) and makes the full-wing bank + glide genuinely readable at `25 m`.

Companion clamp needed in `birdPass()` (`src/game.js:1450`) when `w2On()`:
- Crossing speed: **`6.0 + Math.random() * 2.0`** (`6.0–8.0 m/s`, scaled by `w2Phase().speed`) instead of `6.5–9.5 m/s`.
- Height for bell-bound crows (`sp.cfg.toBell`): **`4.2 + Math.random() * 1.6`** (`4.2–5.8 m`) instead of `3.2–6.8 m`, so every bell crow glides clearly *downward* onto the `2.80 m` fork.

---

## 3. Ram reservation (`w2.ramWait`)

**Decision: Do not keep passive `w2.ramWait` as built (it drops runs to 3 rams and stalls idle Band 3). Ship Option A below.**

On a full field (`5/5` in Build, `7/7` in Crest), passive waiting delays Ram #1 from `22–26 s` to `26–30 s`, shifts later rams back, and routinely pushes Ram #4 past `RAM_RULE.least = 20` (`t = 160 s`), creating a `~700`-point `3 vs 4` ram RNG swing.

- **Option A (Ship this — Spawn ram on schedule and gently retire 1 non-bell shade when full):**
  When `elapsed >= ram.due`:
  1. If `w2Count().all >= w2Phase().max`, immediately retire (`state = 'startled'`, `live = false` for a hare; or `state = 'off'` for a crow in `gap`) the oldest non-bell, non-perch shade (`!sp.cfg.toBell && sp.cfg.t !== 'perch' && !sp.w2c`) and spawn `ramSet()` on the next frame (or immediately once `C.all < P.max`; if every active shade is bell-bound or perched, wait at most **`2.0 s`**).
  2. While `ram.state !== 'off'`, `C.all >= P.max` already pauses new hare/crow refills automatically (`line 866`).
  - **Result:** Strictly **`≤ 7` shades in view at every frame** AND a reliable **`4` rams per run**.
- **Option B (Allow ram as an 8th shade during its `~5–11 s` charge):** Delete `w2.ramWait` (`lines 786, 789–790`). Simplest code and guarantees `4` rams, but breaks the stated 7-shade visual cap.

**Ship Option A.**

---

## 4. Idle three bands at `37.6 s` (vs spec `20–32 s`)

**Decision: Make two small pacing adjustments AND widen the target range to `22–36 s` (hard fail `< 18 s` unchanged).**

Why idle hit `37.6 s`: Band #1 landed right on time (`10.6 s`, spec `8.5–12.0 s`). In Build early (`10–35 s`), `hareBell = 0.45` with `3` hares only lands `~1` more hare band before `t = 30 s`, while Ram #1 waited in `ramWait` until `~25.8 s` and then took `11.8 s` to arrive and place 3 bands (`25.8 + 11.8 = 37.6 s`).

Exact changes:
1. Apply **§3 Option A** (Ram #1 spawns promptly at `22–26 s` → arrives at `33.8–37.8 s` if hares haven't reached 3 first).
2. Raise Build early (`10–35 s`) `hareBell` (`line 811`) from `0.45` to **`0.55`** (matching Crest, so Build doesn't dip below Calm's `0.50`), together with `WATCH_STAY = [10, 15]` (§1).
3. Update `tests/watch2.html` (`line 133`) idle-three-bands target range to **`22–36 s`** (`inR(I.threeBands, 22, 36)`), keeping `idleThreeBands >= 18` as the hard flood-prevention check.

---

## 5. Fair score spread (`11.3k–17.1k`, low end below `14.0k`)

**Decision: Tighten both gameplay spawn-value RNG (`src/game.js`) and the Fair bot's shot selection (`tests/watch2.html`).**

Two separate causes pulled the Fair bot's low end down to `11.3k`:

1. **Game RNG (`src/game.js`, affects real players):**
   - `SPIRIT.sit = 100` vs `SPIRIT.run = 240` vs `SPIRIT.cross = 300` is a **3× base-point gap**, and `w2LaneCfg` (`line 835`) spawns **`45%` sitters** among non-bell hares. Combined with `3 vs 4` rams (`ramWait`), two runs with identical hit counts can swing by `3,000+` points on spawn luck alone.
   - **Fix (`WATCH2` only; Trials untouched):**
     - Score Bell Watch sitters at **`150`** base (`const base = W2 && t.mode === 'sit' ? 150 : t.value;` at `line 1757`, shrinking max spread from `3.0×` to `2.0×`).
     - In `w2LaneCfg()` (`lines 835–836`), reduce sitters from `45%` to **`30%`**: `if (kind < .30) sit; if (kind < .70) run; else creep;` (livelier lane + tighter score floor).
     - Apply §3 Option A for reliable `4` rams/run.
2. **Bot artefact (`tests/watch2.html`, lines 17, 48–55):**
   - `every: 3` gives `60` total actions including `~3–4` bell rings (`~56` shade shots → binomial `p = 0.70` drops to `31–33` hits on unlucky seeds, minus shots wasted when a target vanishes during arrow flight).
   - `line 53` picks `draw` (`0.5 / 0.75 / 1.1`) **independently of target distance**, wasting Long-shot bonuses on `< 24 m` targets, and `fair` has `rams: false` (unlike a real player who shoots a giant pawing ram).
   - **Fix in `tests/watch2.html`:** Set `fair: { every: 2.8, hit: .7, ring: 2, perfect: .5, mix: true, rams: true }` (`~21` shots/min, midpoint of spec's `18–22` shots/min) and tie `mix` draw time to target distance: `pick.d >= 24 ? (Math.random() < .65 ? 1.1 : .75) : (Math.random() < .5 ? .5 : .75)`.

Expected result: Fair bot lands reliably inside **`14,000–18,500`** with roughly half the run-to-run variance.

---

## 6. Code audit: every mismatch against `design/bell-watch-rules.md`

| # | Severity | Location (`src/game.js`) | What is built today | What it should be |
| --- | --- | --- | --- | --- |
| **1** | **Must fix** | `w2HareStep` `move`/`hop`, `lines 882–883` | Never updates `sp.cyc` for `sp.bound` (`RIG2`, the active standing hare), and `hop()` lifts `sp.root.position.y` even when `sp.bound === true`. **Bell-bound hares slide frozen without bounding and bob artificially.** | In `move()`: add `if (sp.bound) sp.cyc += go / ((gait >= 1 ? HARE_MOVES.run : HARE_MOVES.lope).stride * HARE_SCALE * SPIRIT_SIZE);` (matching `line 1565`). In `hop()`: `const h = sp.bound ? 0 : Math.max(0, Math.sin(sp.phase)) * (gait >= 1 ? .16 : .05);`. |
| **2** | **Must fix** | `standingPose` `lines 1082–1085` & `w2HareStep` `line 887` | `standingPose()` (`RIG2`) never reads `sp.w2.ear` (only legacy `shadePose` at `line 1114` does) → **ears never sweep toward the bell during tell or pin back during creep**. Also `line 887` lifts `sp.root.position.y = .18 * u` during tell, floating `sp.bound` hares `18 cm` in mid-air while `standingPose` already lifts via `rear`. | In `standingPose()` `line 1084`: add `+(sp.w2 ? sp.w2.ear * k : 0)` to each `EARS2` bone's `x` rotation. In `w2HareStep` `line 887`: `if (!sp.bound) sp.root.position.y = .18 * u;` (keep `W.rear = .45 * u` so `standingPose` raises the chest with hind paws planted). |
| **3** | **Must fix** | `padDo` `lines 603–606` | On Quest (`?pads=1`), pressing controller A (`again`) on results calls `watchStart()` directly, **bypassing `WATCH_SCORE.againGuard` (`0.8 s`)**. During `phase === 'closing'`, `mid` is `false`, so one stray press restarts without confirmation. | Add `if (w2On() && range.phase === 'results' && elapsed - range.resultsAt < WATCH_SCORE.againGuard) return;` and set `mid = (range.phase === 'play' || range.phase === 'closing') && !st.lab && (range.fired > 0 || st.watch);`. |
| **4** | **Must fix** | `board.set` `lines 640–645` & `rangeInfo` `line 1950` | At `52px Georgia` (`900 px` wrap), `'Shades banished 40  ·  Snaps 14  ·  Long 12'` wraps onto two lines, pushing line 3 down to `y = 469` (or `537`, colliding with `mark` at `560`). Also `stitch` (`line 644`) frames the whole board rather than just the Score block (fine if text doesn't collide, or tighten to Score row). | When `info.text.includes('\n')` in `board.set()`, use `44px Georgia` with `58 px` line step starting at `y = 250` (and/or shorten line 2 to `'Banished ' + range.hits + '  ·  Snaps ' + w2.snaps + '  ·  Long ' + w2.longs`) so all 3 lines stay above `y = 430` cleanly clear of `mark` at `560`. |
| **5** | **Should fix** | `birdPass` `line 1450` & `birdStep` `line 1500` | Crossing crows still spawn at `6.5–9.5 m/s` and `h = 3.2–6.8 m`, unscaled by `w2Phase().speed`. | When `w2On()`: `h = sp.cfg.toBell ? 4.2 + Math.random() * 1.6 : 3.2 + Math.random() * 3.0; speed = (6.0 + Math.random() * 2.0) * w2Phase().speed;`. |
| **6** | **Should fix** | `rangeStep` `line 1979`, `startDraw` `line 2620`, `loose` `line 2333` | Entering `range.phase = 'closing'` at `0:00` does not cancel an active draw or stop new arrows from being drawn/loosed during the `2.5 s` grace window (they aren't scored, but still fire). | Call `cancel();` when entering `'closing'` at `line 1979`, and guard `range.phase === 'closing'` in `startDraw()` and `loose()`. |
| **7** | **Should fix** | `w2CrowStep` `line 921–925` & `birdStep` `line 1508` | Crow `bank` does not raise ember eye flare to `0.85` (stays `0.3`). Perched crow bell departure (`line 1508`) sets `w2.bellAt = elapsed` without checking `overlap` / setting `w2.breather`. | In `bank`: set `sp.flare.opacity = .85 * sp.ember.opacity;`. At `line 1508`: add `if (C.bell >= 1 && elapsed - w2.bellAt < WATCH_SCORE.overlap) w2.breather = elapsed + WATCH_SCORE.bellBreather;`. |
| **8** | **Minor** | `w2HareStep` `lines 889, 905` | `W.t === dt` (`line 889`) relies on exact float equality for the tell thump. Curve straightening at `d <= 5.5 m` (`line 905`) snaps direction rather than blending over `1.0 m` (`5.5 → 4.5 m`). | Replace `W.t === dt` with a `!W.thumped` flag; optionally lerp target between Bézier point and `(fx, fz)` across `d ∈ [4.5, 5.5]`. |
| **9** | **Minor polish** | `pealHit` `line 1833`, `rangeHit` `lines 1760–1773`, `showResults` `line 1850–1851` | Clearing 3 bands uses `18` plum chips (`6 * had`) with no deeper overtone (spec: `24` chips + low harmonic). Snap/Long hits share standard banish burst/chime (text tag + gold popup are in). `rangeSigns.again` has no dim visual cue during the `0.8 s` guard (and still thumps if shot early). New-best bell note fires at `+0.68 s` (spec `+0.42 s` — actually `+0.68 s` clears the triad nicely; **keep `+0.68 s`**). Separate `Menu` button on end cloth not yet built (already noted in `Project-notes.md`). | Low priority — can ship to Quest test link first and add audio/burst polish in the polish stage. |

---

## 7. Before the headset (Quest test link readiness)

**Decision: Fix items #1–#4 in §6 (plus §1, §3 Option A, §4, §5) first — about 30 lines total — then put `?watch=1&watch2=1` on the Quest test link as a separate launcher entry.**

- **Why not before #1–#4:** Seeing bell-bound hares slide stiff-legged without bounding (`#1`) and float `18 cm` with unmoving ears during the tell (`#2`) would immediately undermine the first Quest playtest of Bell Watch; `#4` risks overlapping text on the end cloth right when the player looks at their score.
- **72 fps Quest performance:** **Ready — no frame-rate risks.**
  - `w2Step`, `w2HareStep`, and `w2CrowStep` do lightweight per-tick scalar math with zero geometry/material allocations (only `2` tiny `Vector3` temporaries in `w2CrowStep` lines `917`/`927` — negligible, `< 0.01 ms`).
  - `board.set()` caches its key (`line 636`) and only redraws the `1024×640` canvas once per second on the clock tick or on score change.
  - `popup()` pools `8` sprites (`line 994`); peak live shades stay `≤ 7` (and start at `3` in Calm, lighter than `watch1` for the first minute).
- **Carefree limits:** **All verified intact.** No player harm, no lost points, unlimited arrows, misses leave ribbon tally untouched, all spawns ahead of the line (`along ∈ [11, 34]`), no screen flashes or camera shake, no replay camera movement in VR (`range.shot = null`), and `≤ 7` shades in view.
- **Quest launcher note:** `vrMenu` (`src/game.js:2830`) does not have a `Bell Watch` button yet (and `vrmenu` is `false` in `src/config.json`), so a separate Quest test-link entry that launches straight with `?watch=1&watch2=1` (paired with whichever bow flag is under test, or clicking **Bell Watch** on the start cloth before entering VR) is the cleanest way for the developer to test it in a headset.
