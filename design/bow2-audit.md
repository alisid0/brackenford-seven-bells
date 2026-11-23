# Audit of `?bow2=1` & `?pads=1` + 29-stage re-check

Audit of Claude's implementation on `release-prep` (`5fce6b8`) against `design/arrow-mechanics-v2.md`, plus a full physics check of all 29 stages in `shared/game-data.json` under `g = 9.81 m/s²`, quadratic drag `k = 0.0025 m⁻¹`, and `v0 = 62 m/s`.

---

## Live test results (`Brackenford-Seven-Bells.html`, headless Edge WebGL)

All three test pages ran cleanly and passed with zero errors:

| Test | Result | Key measured readings |
|---|---|---|
| `tests/bow2.html` | **`allOk: true`**, `0` errors | `s10=0`, `s15=22.3`, `s50=37.5`, `s96=62`, `drop30=1.277 m` (`57.6 m/s`), `first=0.569 m` → `learned=0.598 m`, `Shake 4.1° (sent 0.0°) v2`, `bow2=0` unchanged (`drop30=0.856 m`, `jerkSentOff=4.104°`). |
| `tests/pads.html` | **`allOk: true`**, `0` errors | `A` double-press mid-run (`warned+restarted`), `B` advances on results only, `stickDraw` toggles draw, bow stick sideways ignored on range, bow stick `0.6 s` hold recentres (`yawOff=0`, `fromLine=0`), `X/Y` mapped by bow hand. |
| `tests/skeleton.html` | **`allOk: true`**, `0` errors | Full end-to-end `?grey=1` flow (menu → stage 1 → stage 2 → far 45 m grey terraces → Bell Watch with ram → results → again → lab) passes with `0` trees and `grade=false`. |

*(Note: `tests/bow2.html` measures `drop30 = 1.277 m` at `1/90 s` Euler stepping vs `1.22 m` continuous because of first-order Euler + the `along >= 30` overshoot — adding the midpoint velocity step drops that to `1.22 m` and eliminates 60 vs 72/90 Hz drift.)*

---

## Part 1: Code audit against `design/arrow-mechanics-v2.md`

### A. New discrepancies and bugs found in `src/game.js`

| # | Where (`src/game.js`) | What differs from the spec | Exact fix |
|---|---|---|---|
| **1** | `hit()` L2046 & `rangeHit()` L1590–1600 | **Two haptic bugs on impact:** (a) `buzz(drawHand, .25, 28)` on `big` hits is a silent no-op because `endDraw()` already cleared `drawHand = null` at L2315 when the arrow left! (b) A `100`-ring **bullseye** never triggers the `big` (`0.55 / 45 ms` + `0.25 / 28 ms`) haptic because `hit()` runs *before* `rangeHit()` computes `ring`. | Resolve off-hand via `const off = hands.find(h => h !== bowHand && h.pose)`. Move target/shade hit haptics into `rangeHit()` (where `big = (ring === 100 && !spirit) || !!t.ram`), keeping `peal` (`big = true`) and roaming `bell/straw/drill/lantern` in `hit()`. |
| **2** | `tick()` L2575 | **Desktop sweet-spot HUD bar cuts off early under `?bow2=1`:** `mouseup` (L2211) awards `perfect` up to `0.85 + 1.2 = 2.05 s`, but L2575 still hardcodes `elapsed - startTime <= 1.3`, so the white sweet-spot bar goes dark `0.75 s` before the window closes. | Change `<= 1.3` to `<= .85 + (BOW2 ? BOW.sweet : .45)`. |
| **3** | `desktopPose()` L2190–2193 | **Desktop `tired` tremor still moves `bow.position` under `?bow2=1`:** Since `aimDesktop()` (L2198) subtracts `bow.position`, holding at full draw on desktop still adds slight aim wobble instead of staying zero-penalty. | When `BOW2`, set `tired = 0` on `bow.position` (or apply the `±1.5 mm` tension breath strictly to `setString(...)` in both desktop and VR). |
| **4** | `vrPose()` L2449–2454 & `startDraw()` L2304 | **Single-handed VR draw (`quickHand`) still uses v1 haptics:** Uses `Math.floor(charge * 8)`, `0.15 + 0.3 * charge`, `0.9 / 30 ms` full-draw buzz, and skips the nock buzz, `1.2 s` creak, and `2.0 s` tension breath. | Mirror the `BOW2` notch/anchor/creak/breath block into `quickHand` (merging pulses with `Math.max` when `quickHand === bowHand`, and firing the `0.22 / 18 ms` nock pulse in `startDraw` for `quickHand`). |
| **5** | `vrPose()` L2434–2443 | **Missing visual string-mesh tension hum after `2.0 s` at full draw:** The `0.08 / 18 ms` haptic breath is built, but `nock` has no `±1.5 mm` visual string vibration (section 5). | When `BOW2 && fullAt && elapsed - fullAt > 2`, add `nock.x += Math.sin(elapsed * 47) * .0015` right before `setString(nock, flex)` (never touching `drawAt` or `aimVR()`). |
| **6** | `bowLearn()` L1981–1986 & `initXR()` L2463 | **Two auto-learn edge cases:** (a) `L.push(peak)` runs for every `peak >= 0.36 m`, so deliberate soft shots (`38–42 cm` on a tall player) pollute `bow2.learned` and bias `med(L)` low. (b) If a player fires once on desktop before clicking Enter VR, `bow2.full` locks to desktop's `camera.position.y = 1.65 m` (`0.569 m`) instead of the VR wearer's real `eyeY`. (c) `bow2.full` is not yet persisted in `state` (covered by your Settings work tonight). | (a) Only push into `L` when `peak >= .72 * bow2.full`. (b) Clear `bow2.full = 0` on VR session start (`initXR`) unless the user explicitly saved/locked a draw setting. |
| **7** | `endDraw()` L2313–2314 & `bowRelease()` L1990–1991 | **Two minor release-edge details:** (a) `endDraw()` calls `vrPose()` at the same `elapsed` timestamp as the last `tick()`, appending a duplicate-timestamp sample (`dt = 0`) to `bow2.buf`; if a 1-frame jerk happened right on `selectend`, `if (dt > 0)` skips comparing it. (b) L2314 checks `r.power >= .95` instead of `r.power >= BOW.fullAt` (`0.96`). | (a) In `vrPose()`, if `bow2.buf.length && bow2.buf[bow2.buf.length - 1][0] === elapsed`, update that last entry in-place instead of pushing a `dt = 0` duplicate (same for `lab.aims`). (b) Use `BOW.fullAt` at L2314 and on the bow plaque (`vrStatus()` L2273). |
| **8** | `vrPose()` L2438 & `padSticks()` L569, L578 | **Three small polish mismatches:** (a) Draw notches fire upward at `(notch+1)/10 + 0.02` (`22%, 32% ... 92%`), putting the 9th notch (`92%`) only `4%` below the `96%` anchor snap; firing upward at `(notch+1)/10` (`20%..90%`) and only stepping down at `notch/10 - 0.02` keeps exact 10% notches with full 2% anti-chatter hysteresis. (b) String-hand stick click (L578, draw mode toggle) omits `buzz(h, .25, 20)`. (c) Bow-hand stick hold `recentre()` (L569) can fire while `charging`. | (a) Trigger upward at `(bow2.notch + 1) / 10`, downward at `bow2.notch / 10 - .02`. (b) Add `buzz(h, .25, 20)` on L578. (c) Gate `recentre` hold on `!charging`. |

### B. Known gaps Claude already listed (confirmed present)

1. **Settings draw-length override (`Auto / Short 46 cm / Long 64 cm / Reset` + persistence in `state`)** — in progress tonight.
2. **Midpoint velocity position step in `stepArrows()` (L2080–2082)** — currently Euler; switching to midpoint `(v0 + v1) * 0.5 * dt` aligns 60 Hz desktop and 72/90 Hz Quest trajectories to `< 1 mm` and brings `drop30` from `1.277 m` to exact `1.22 m`.
3. **Arrow flight visual character (section 6)** — L2096–2097 still uses v1 fishtail (`0.08`, `exp(-4.5*life)`, `36 rad/s`), fixed cream ribbon (`streakMat`), and v1 impact quiver (`55 / 0.15 / 52`).
4. **Gold sweet-release ribbon tint (`#FFE9A8`, opacity `0.72`, `1.25×` width)** — not yet wired on `q.perfect`.

### C. What matches the spec cleanly

- `BOW` constants (`rest 0.12`, `fullMin 0.42`, `fullMax 0.68`, `eyeK 0.345`, `seated 0.52`, `minLoose 0.15`, `g 9.81`, `drag 0.0025`, `sweet 1.2`, `fullAt 0.96`, `rearm 0.80`) match 100%.
- `arrowSpeed()` formula, `< 15%` cancel + `0.12 / 15 ms` string-settle buzz, and `4%` full-draw plateau match 100%.
- Analog trigger early-latch (`tv >= 0.85` armed → `< 0.80` latches, capped `0.08 s`) and spike-gated `45 °/s` lookback + `100 ms` peak-power latch work cleanly (`tests/bow2.html` proves `4.1°` raw pluck → `0.0°` sent error!).
- Settled `?pads=1` role-based control map (`A` double-press mid-run, `B` next on results, string stick click draw toggle, bow stick off on range, bow stick `0.6 s` hold recentre, `X` arrow, `Y` menu) matches section 8 cleanly.

---

## Part 2: 29-stage re-check under `bow2` (`g = 9.81`, `k = 0.0025`)

Simulated every target and shade in `shared/game-data.json` from archer eye height `1.50 m` with real lane terraces (`[[43, 0.7], [53, 1.4], [63, 2.1], [72, 2.8]]`), target centre height `0.75 + 0.72 × size`, and lane half-width `±8.0 m`.

**Headline:**
- **All 17 release stages:** **KEEP UNCHANGED.** Every target clears all terrace steps by `≥ 1.24 m`, stays well inside the `±8 m` lane, and plays as intended (`#3 The drop` and `#4 Three ranges` actually feel better).
- **12 non-release stages:** **9 KEEP UNCHANGED**, **3 long-range windy stages (`#15`, `#18`, `#20`)** need small wind tweaks so peak wind drift matches v1's sightline budget instead of blowing off the lane.

### Full 29-stage table

| # | Release? | Stage | Furthest target / shade & wind | v1 → v2 aim angle | v1 → v2 flight time | v1 → v2 peak wind drift | Verdict | Exact change (if any) |
|---|---|---|---|---|---|---|---|---|
| 1 | Yes | First marks | `10 m`, still | `1.2° → 1.4°` | `0.16 → 0.16 s` | `0.0 m` | **Keep** | — |
| 2 | Yes | Stepping back | `15, 20 m`, still | `1.4° → 1.9°` | `0.32 → 0.33 s` | `0.0 m` | **Keep** | — |
| 3 | Yes | The drop | `30 m`, still | `2.1° → 2.8°` | `0.48 → 0.50 s` | `0.0 m` | **Keep** | Better under v2 (actually teaches drop). |
| 4 | Yes | Three ranges | `15, 30, 45 m`, still | `4.0° → 5.2°` | `0.73 → 0.77 s` | `0.0 m` | **Keep** | Clears `43 m` terrace by `1.68 m` (up from `1.64 m`). |
| 5 | No | The long lane | `60 m` (`size 2.4`), still | `5.4° → 7.2°` | `0.97 → 1.05 s` | `0.0 m` | **Keep** | `3.26 m` diameter target, `1.75 m` terrace clearance. |
| 6 | Yes | A breeze | `20 m`, `wind [3, 0]` | `1.4° → 1.9°` | `0.32 → 0.33 s` | `0.22 → 0.23 m` | **Keep** | — |
| 7 | Yes | Crosswind | `30 m`, `wind [-5, 0]` | `2.2° → 3.0°` | `0.48 → 0.50 s` | `-0.83 → -0.87 m` | **Keep** | Only `+4 cm` drift change. |
| 8 | Yes | Sliding mark | `15 m` (`±3 m @ 0.9`), still | `1.2° → 1.6°` | `0.24 → 0.25 s` | `0.0 m` | **Keep** | Lead `0.65 → 0.67 m` (`+2 cm`). |
| 9 | No | Slide and breeze | `25 m` (`±3.5 m @ 0.8`), `[3, 0]` | `1.9° → 2.5°` | `0.40 → 0.42 s` | `0.35 → 0.36 m` | **Keep** | Lead `1.13 → 1.17 m` (`+4 cm`). |
| 10 | Yes | Pop-ups | `14, 18, 22 m` (`up 3.0 s`), still | `1.7° → 2.2°` | `0.35 → 0.37 s` | `0.0 m` | **Keep** | Plenty of margin inside `3.0 s` up window. |
| 11 | No | Far and small | `40 m` (`size 1.1`), still | `2.2° → 3.2°` | `0.65 → 0.68 s` | `0.0 m` | **Keep** | Clean `1.50 m` target, `+1.0°` elevation. |
| 12 | No | Gusts | `35 m`, `wind [0, 6]` | `2.5° → 3.4°` | `0.57 → 0.59 s` | `1.35 → 1.44 m` | **Keep** | Only `+9 cm` peak gust drift on `2.18 m` target. |
| 13 | No | Quick marks | `12, 16, 20 m` (`up 1.8 s`), still | `1.4° → 1.9°` | `0.32 → 0.33 s` | `0.0 m` | **Keep** | `+0.01 s` inside `1.8 s` up window. |
| 14 | Yes | Crossing pair | `18, 26 m` sliders, still | `1.9° → 2.6°` | `0.42 → 0.43 s` | `0.0 m` | **Keep** | Lead `1.34 → 1.39 m` (`+5 cm`). |
| 15 | No | **Long wind** | `60 m`, `wind [5, 0]` | `5.4° → 7.2°` | `0.97 → 1.05 s` | `3.32 → 3.71 m` | **Adjust** | **`wind: [4.5, 0]`** → restores `3.34 m` steady drift (matches v1 `3.32 m`). |
| 16 | Yes | The gauntlet | `15, 24, 32 m`, `wind [2, 0]` | `2.3° → 3.1°` | `0.52 → 0.54 s` | `0.38 → 0.40 m` | **Keep** | `32 m` pop-up (`up 2.5 s`) & slider (`+3 cm` lead) unaffected. |
| 17 | No | Small bull | `20 m` (`size 0.65`), still | `0.3° → 0.7°` | `0.32 → 0.33 s` | `0.0 m` | **Keep** | — |
| 18 | No | **Storm lane** | `45 m`, `wind [2, 7]` | `4.0° → 5.3°` | `0.73 → 0.77 s` | `3.35 → 3.64 m` | **Adjust** | **`wind: [2, 6]`** → restores `3.23 m` peak drift (matches v1 `3.35 m`). |
| 19 | No | Far slider | `50 m` (`±4 m @ 0.6`, `size 2.1`) | `4.3° → 5.7°` | `0.81 → 0.86 s` | `0.0 m` | **Keep** | Lead `1.94 → 2.07 m` (`+13 cm` on `2.86 m` target; optional `rate: 0.56` if tight in playtest). |
| 20 | No | **Master of the line** | `70 m` (`±4 m @ 0.5`, `size 2.6`) + `35 m` pop-up, `wind [-3, 5]` | `6.3° → 8.5°` | `1.14 → 1.25 s` | `-7.25 → -8.27 m` *(aim hits `12.3 m` off centre!)* | **Adjust** | **`wind: [-3, 4]`** and **`slide: [4, 0.45]`** → restores `-7.24 m` peak drift (matches v1 `-7.25 m`) and `2.25 m` slider lead (matches v1 `2.27 m`). |
| 21 | Yes | First shade | `14–17 m` sit, still | `-2.9° → -2.6°` | `0.23 → 0.23 s` | `0.0 m` | **Keep** | — |
| 22 | Yes | The warren | `12–30 m` sit (`swift 22 s`) | `-0.1° → +0.6°` | `0.48 → 0.50 s` | `0.0 m` | **Keep** | `< 0.1 s` total flight diff across stage. |
| 23 | Yes | Horns in the grass | `13–25 m` hide, still | `-0.7° → -0.1°` | `0.40 → 0.42 s` | `0.0 m` | **Keep** | — |
| 24 | Yes | Creepers | `15–23 m` creep, still | `-1.0° → -0.5°` | `0.37 → 0.38 s` | `0.0 m` | **Keep** | — |
| 25 | No | Bolt | `12–28 m` run (`swift 25 s`) | `-0.4° → +0.3°` | `0.45 → 0.47 s` | `0.0 m` | **Keep** | `+0.02 s` flight = `+13 cm` lead on `6.5 m/s` hare. |
| 26 | Yes | On the post | `14–27 m` perch (`h 2.2–3.5 m`) | `6.4° → 7.1°` | `0.44 → 0.45 s` | `0.0 m` | **Keep** | Only `+0.7°` steeper on highest post. |
| 27 | Yes | Flush | `13–24 m` flush (`swift 24 s`) | `-0.9° → -0.3°` | `0.39 → 0.40 s` | `0.0 m` | **Keep** | — |
| 28 | No | Flight line | `15–27 m` cross, `wind [3, 0]` | `5.7° → 6.3°` | `0.44 → 0.45 s` | `0.41 → 0.43 m` | **Keep** | `+2 cm` drift change. |
| 29 | Yes | Blighted meadow | `13–27 m` mixed (`swift 32 s`) | `6.0° → 6.6°` | `0.44 → 0.45 s` | `0.0 m` | **Keep** | — |

### Summary of exact stage edits (when `bow2` becomes default)

Only three extra stages in `ALL_STAGES` (`src/game.js` L657, L660, L662 → re-exported to `shared/game-data.json`) need edits:

```js
{ name: 'Long wind',          arrows: 6, wind: [4.5, 0], marks: [[60, 0, 2.4]] },
{ name: 'Storm lane',         arrows: 7, wind: [2, 6],   marks: [[45, 0, 1.9]] },
{ name: 'Master of the line', arrows: 8, wind: [-3, 4],  marks: [[70, 0, 2.6, [4, .45]], [35, -5, 1.3, 0, [2.5, 2, 0]]] },
```

**Bell Watch & Practice Bell:** All hares (`11–30 m`), the Practice Bell (`22 m`), and the Shade Ram (`34 m`) stay within `0.16–0.57 s` flight time (`+0.02 s` max at `34 m`) and need zero changes.
