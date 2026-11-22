# Builder Specs: Miss Tips, Mastery Ribbons, Onboarding & Release Beats

Four self-contained specs built against `src/game.js`, `Stages.md`, `design/theme.md`, and `design/theme-look.md` (`0ef5ede`). Every item can be built and automated-tested on desktop without a headset or Arcade code.

---

## 1. Miss Tip on a Failed or Weak Stage

- **When it shows:** On **`0★` (failed)** whenever minimum evidence is met; on **`1★` (weak clear)** only when `totalMisses >= 2` and evidence is met. **Never** on `2★` or `3★`. Shown as one line on the results board/HUD (`rangeInfo().text`) and `say()`, beneath the star-gap line.
- **Per-miss recording (in `rangeNear` / `rangeEnded`):** For each missed ranged arrow `q` (excluding intentional `Rime`/`Kiln` utility hits), record nearest target `t` (extending `rangeNear` on misses to also check folded pop-ups `!r.up` and recently startled/fled/hidden shades). Project closest path point `P` (and landing point `P_end`) into lane coordinates `(along, right, y)` via `laneAt()` relative to target centre `C`, with target radius `R = 0.68 * t.scale` (rings), `0.45 m` (hare), or `0.42 m` (winged shade):
  - `dAlong = P_end.along - C.along`, `dRight = P.right - C.right`, `dY = P.y - C.y`, `w = range.wind` at loose.
- **Minimum evidence (no lecture for one stray arrow):** A cause qualifies only if **`count >= 2` AND `count * 2 >= totalMisses`** (at least 2 missed arrows and ≥ 50% of all misses on that attempt). If no cause qualifies, show **no tip**.
- **Special-arrow suggestion rule:** Use the **With `ARROWS` on** wording **only** when `ARROWS === true` AND `specialUsed === 0` (player kept charges unused on a stage where `Rime`/`Gale`/`Kiln` directly fixes the miss). When `ARROWS === false` (release mode), never mention special arrows.

### Priority, Classification Thresholds & Exact Wording (All `< 60` Chars)

Evaluate top-to-bottom; pick the first qualifying cause:

| Pri | Cause | Per-Miss Classification Rule (Metres / State) | Plain Wording (`< 60` chars) | With `ARROWS` On & `specialUsed === 0` (`< 60` chars) |
|---|---|---|---|---|
| 1 | `underDraw` | Loosed at `charge < 0.70` | `Draw fuller before loosing — short draws drop fast.` | *(same)* |
| 2 | `popDown` | `!!t.pop`, `t.up === false` at crossing, `hypot(dRight,dY) <= R + 0.80` | `Shot arrived after drop — draw as the board rises.` | `Boards dropped in time — freeze one with a Rime arrow.` |
| 3 | `shadeBush` | `t.mode === 'flush'`, `t.state === 'lurk'`, landing `>= 3.5 m` from bush | `Land an arrow by the shaking bush to flush the flyer.` | *(same)* |
| 4 | `shadeGrass` | `t.mode === 'hide'` (or `creep` with `sunk === 1`), `!t.exposed`, `off <= 0.85` | `Watch for rustling grass and aim at the ember eyes.` | `Hidden in tall grass — clear the clump with a Kiln arrow.` |
| 5 | `windPush` | `|w| >= 2 m/s`, `sign(dRight) === sign(w)`, `|dRight| >= R + 0.20` | `Wind pushed shots right — aim left of the centre.` *(or left/right)* | `Strong wind pushed shots wide — aim upwind or use Gale.` *(`|w| >= 3`)* |
| 6 | `overComp` | `|w| >= 2 m/s`, `sign(dRight) === -sign(w)`, `|dRight| >= R + 0.35` | `Aimed too far into the wind — ease back to centre.` | *(same)* |
| 7 | `slideLag` | `!!t.slide`, `|dRight| >= R + 0.15`, `sign(dRight) === -sign(v_slide)` | `Shots trailed the slider — lead ahead of its motion.` | `Shots trailed the slider — lead ahead or use Rime.` |
| 8 | `slideLead` | `!!t.slide`, `|dRight| >= R + 0.15`, `sign(dRight) === sign(v_slide)` | `Shots passed ahead of the slider — lead a touch less.` | *(same)* |
| 9 | `shadeMoved` | `t.mode` in `creep/run/cross/flush`, moved `>= 0.60 m` during flight, trailed motion | `Shades moved mid-flight — lead ahead or wait for a pause.` | *(same)* |
| 10 | `shadeStartled` | `t.mode` in `sit/hide/perch`, startled on this/prior shot (`off < 3.0 m`, perch `2.2 m`) | `Near misses spook sitting shades — steady your first shot.` | *(same)* |
| 11 | `short` | `dAlong <= -1.0 m` (hit ground ahead) OR `dY <= -(R + 0.25 m)` | Rings: `Shots dropped short — aim higher above the centre.` / Shades: `Shots dropped short — lift your aim for the distance.` | *(same)* |
| 12 | `high` | `dY >= R + 0.25 m` | Rings: `Shots flew high — lower your aim toward the centre.` / Shades: `Shots passed over the shade — aim lower at its body.` | *(same)* |
| 13 | `sideBias` | `|w| < 2 m/s`, `|dRight| >= R + 0.25 m`, `|dRight| > |dY|` | `Shots pulled left — hold steadier right of centre.` *(or right/left)* | *(same)* |

---

## 2. 29-Stage Mastery Ribbon Table

- **Code fields used** (all evaluated in `rangeResults()`):
  - `stars` (`range.stars >= 1` required on **every** ribbon — a failed `0★` run never earns a ribbon)
  - `fired` (`range.fired`), `hits` (`range.hits`), `perfectHits` (incremented in `rangeHit` when `q.perfect === true`), `sec` (`elapsed - range.t0`), `specialUsed` (incremented in `rangeLoosed` when `q.kind !== 'std'`).
- **Four ribbon pass formulas:**
  - **Clean Quiver:** `stars >= 1 && fired > 0 && hits === fired` *(zero misses; on shade stages also `hits === st.spirits.length`)*
  - **Dead-Eye (`N`):** `stars >= 1 && perfectHits >= N`
  - **Swift Banish (`T` s):** `stars >= 1 && hits === st.spirits.length && sec <= T`
  - **Pure Bow:** `ARROWS && stars >= 1 && specialUsed === 0` *(inactive and hidden while `ARROWS === false` so it is never awarded for free)*
- **Save key:** Store `r: 1` inside `state.range.named[st.name]` (`{s, b, r}`).

| # | Stage Name | Rel | Arrows / Goal | Ribbon | Exact Pass Condition |
|---|---|---|---|---|---|
| 1 | First marks | 1 | 5 arr · 10 m | **Clean Quiver** | `stars>=1 && hits===fired` |
| 2 | Stepping back | 2 | 6 arr · 15/20 m | **Dead-Eye (3)** | `stars>=1 && perfectHits>=3` |
| 3 | The drop | 3 | 6 arr · 30 m | **Clean Quiver** | `stars>=1 && hits===fired` |
| 4 | Three ranges | 8 | 6 arr · 15/30/45 m | **Dead-Eye (3)** | `stars>=1 && perfectHits>=3` |
| 5 | The long lane | — | 6 arr · 60 m | **Clean Quiver** | `stars>=1 && hits===fired` |
| 6 | A breeze | 5 | 6 arr · 3 R | **Clean Quiver** | `stars>=1 && hits===fired` |
| 7 | Crosswind | 11 | 6 arr · 5 L | **Pure Bow** | `ARROWS && stars>=1 && specialUsed===0` |
| 8 | Sliding mark | 6 | 6 arr · slider | **Dead-Eye (3)** | `stars>=1 && perfectHits>=3` |
| 9 | Slide and breeze | — | 6 arr · 3 R + slider | **Pure Bow** | `ARROWS && stars>=1 && specialUsed===0` |
| 10 | Pop-ups | 9 | 8 arr · 3 pop-ups | **Pure Bow** | `ARROWS && stars>=1 && specialUsed===0` |
| 11 | Far and small | — | 6 arr · 40 m (1.1) | **Dead-Eye (3)** | `stars>=1 && perfectHits>=3` |
| 12 | Gusts | — | 6 arr · gusts 6 | **Dead-Eye (3)** | `stars>=1 && perfectHits>=3` |
| 13 | Quick marks | — | 8 arr · 1.8 s pops | **Pure Bow** | `ARROWS && stars>=1 && specialUsed===0` |
| 14 | Crossing pair | 13 | 8 arr · 2 sliders | **Clean Quiver** | `stars>=1 && hits===fired` |
| 15 | Long wind | — | 6 arr · 60 m, 5 R | **Pure Bow** | `ARROWS && stars>=1 && specialUsed===0` |
| 16 | The gauntlet | 15 | 9 arr · mixed + 2 R | **Dead-Eye (4)** | `stars>=1 && perfectHits>=4` |
| 17 | Small bull | — | 6 arr · 20 m (0.65) | **Clean Quiver** | `stars>=1 && hits===fired` |
| 18 | Storm lane | — | 7 arr · 45 m + gusts 7 | **Pure Bow** | `ARROWS && stars>=1 && specialUsed===0` |
| 19 | Far slider | — | 7 arr · 50 m slider | **Dead-Eye (3)** | `stars>=1 && perfectHits>=3` |
| 20 | Master of the line | — | 8 arr · 70 m + 35 m | **Pure Bow** | `ARROWS && stars>=1 && specialUsed===0` |
| 21 | First shade | 4 | 5 arr · 1 sit hare | **Clean Quiver** | `stars>=1 && hits===fired && hits===1` |
| 22 | The warren | 7 | 7 arr · 4 sit hares | **Swift Banish (22 s)** | `stars>=1 && hits===4 && sec<=22` |
| 23 | Horns in the grass | 10 | 7 arr · 3 hide hares | **Pure Bow** | `ARROWS && stars>=1 && specialUsed===0` |
| 24 | Creepers | 14 | 8 arr · 2 creepers | **Clean Quiver** | `stars>=1 && hits===fired && hits===2` |
| 25 | Bolt | — | 9 arr · 3 runners | **Swift Banish (25 s)** | `stars>=1 && hits===3 && sec<=25` |
| 26 | On the post | 12 | 7 arr · 3 perched | **Clean Quiver** | `stars>=1 && hits===fired && hits===3` |
| 27 | Flush | 16 | 8 arr · 3 bush flyers | **Swift Banish (24 s)** | `stars>=1 && hits===3 && sec<=24` |
| 28 | Flight line | — | 10 arr · 3 cross + 3 R | **Pure Bow** | `ARROWS && stars>=1 && specialUsed===0` |
| 29 | Blighted meadow | 17 | 10 arr · 5 mixed | **Swift Banish (32 s)** | `stars>=1 && hits===5 && sec<=32` |

### Display Rules (Results Line & Stages List)

| Where | Earned | Unearned |
|---|---|---|
| **Results line** (`rangeInfo().text` & `say()`) | Newly earned: **`◆ Ribbon earned: <Name>`** (gold `#f0c75a`). Already owned: **`◆ <Name>`**. | Shown on `≥1★` clears only (omitted on `0★` so miss tip owns the line): **`◇ Ribbon: <Name> (<short goal>)`** — e.g. `Clean Quiver (no misses)`, `Dead-Eye (3 perfect)`, `Swift Banish (≤ 22 s)`, `Pure Bow (no special)`. |
| **Stages list** (`stageList()` & VR menu `stages`) | Append **`   ◆`** after stars/best (e.g. `1. First marks   ★★★   best 640   ◆`). | On cleared stages (`stars > 0`, active ribbon): append **`   ◇`**. Untouched, locked, or inactive `Pure Bow` (`!ARROWS`): show neither. |

---

## 3. Two One-Line Onboarding Prompts (Under 70 Chars)

Both render through the existing `guide.set(...)` (`#guide` on desktop, `3.4 m` `guide.panel` in VR) and persist flags in `state.seen = {shadeTip, arrowTip}`.

| Trigger | Exact Prompt (`< 70` chars) | Appears When | Never Appears Again When |
|---|---|---|---|
| **First shade stage** | `Shades bolt if you miss close — aim for the body and ember eyes.` *(64 chars)* | Entering any stage with `st.spirits?.length > 0` while `!state.seen.shadeTip` (and save has `0★` on all shade stages). Clears on first hit or `8 s` after first arrow loosed. | Player banishes **`≥ 1` shade** (`state.seen.shadeTip = 1`, `save()`) or already holds `≥ 1★` on any shade stage. |
| **First special arrows** | **Desktop:** `Press 2–4 for Rime, Gale or Kiln — 2 special arrows a stage.` *(60 chars)* <br> **VR:** `Tilt left stick up/down for Rime, Gale or Kiln — 2 a stage.` *(59 chars)* | Entering the first non-guided stage (`!guiding()`) with `ARROWS === true`, `quiver.charges > 0`, and `!state.seen.arrowTip`. Clears on picking any special arrow or `8 s` after first arrow loosed. | Player selects **any special arrow** (`quiverPick` with `kind !== 'std'`) **or finishes that stage** (`state.seen.arrowTip = 1`, `save()`). Never shows when `ARROWS === false`. |

---

## 4. Two Missing Beats (Today's One-Place Release)

### Beat A — Clearing Place 1's Final Stage (`First shade`, Release Slot 4)

Applies when `PROPS.belfry` (`Practice Bell`, `523 Hz / C5`) stands at `(22, +12.5, 0)` (`design/theme.md`), silent during stages 1–4. Triggers on the **first** `≥ 1★` clear of `First shade` when all 4 Place 1 stages have `≥ 1★` and `!state.range.bell1`. On later replays, `Practice Bell` stays permanently restored and shootable anytime, with normal results.

| Time | What Happens |
|---|---|
| `0.0 s` | Best-shot replay finishes (`showResults()`). `AGAIN`, `NEXT`, and `BACK` signs appear at `7 m` and are live immediately (never blocked). |
| `0.0–0.45 s` | **Unbind on `PROPS.belfry`:** two `#4A2943` thorn bands snap into `14` chips, perched crow lifts and fades (`0.6 s`), bell switches `set('restored')` (bronze `#AE783E` + `8 cm` `#F0C75A` gold lip), flank thorns swap for pale wildflower dots (`theme-look.md`). Soft cue `392 → 523 Hz` (`0.25 s`). |
| `0.3 s` | Board title reads **`Willowbank cleared  ·  ★★★`** *(earned stars)*. Notice line reads **`Practice Bell unbound — shoot the bell to ring it, or shoot NEXT.`** *(no map promised)*. |
| **On bell hit** *(optional ceremonial shot)* | Arrow bounces off bell (`0.0 s`): bell swings `±25°` (`3.0 s` damped), ribbon unties & streams, **3 opaque angular chevrons** (`#F6E6BD` + `#F0C75A` mid-stroke) expand over **`0.6 s`**, `bellSound(523)` rings (`2.2 s`), one soft bow-hand tap (`40 ms`). At `+0.5 s`: notice reads **`Practice Bell restored  ·  5. A breeze awaits`**; save `state.range.bell1 = 1`. |
| **If player shoots `NEXT` / `AGAIN` directly** | Save `state.range.bell1 = 1`, auto-ring softly (`bellSound(523, 0, 0.6)` + ribbon untie + `0.6 s` chevron pulse) as Stage 5 (`A breeze`) loads — zero players ever blocked. |

### Beat B — Clearing the Final Release Stage (`Blighted meadow`, Release Slot 17)

Triggers on `≥ 1★` on `Blighted meadow` (`i === STAGES.length - 1` in release mode). Offers **only** actions that exist in today's 17-stage release (never Held-Back stages, World Map, or Score Attack).

| Time | What Happens |
|---|---|
| `0.0 s` | Best-shot replay ends (`endReplay()`). |
| `0.0–0.4 s` | Star stamps land (`0.4 s` total); Practice Bell at `(22, +12.5, 0)` pulses its `0.6 s` cream-gold chevrons. |
| `0.4–2.4 s` | **First clear (`!state.range.finished`):** rolling **six-note valley peal** (`bellSound` at `523, 587, 659, 784, 880, 1047 Hz`, spaced `0.32 s`, gain `0.65 → 1.0`), then save `state.range.finished = 1`. **Repeat clears:** single `523 + 1047 Hz` octave chime (`0.6 s`). |
| `0.6 s` | **Finale Cloth** opens (cream banner overlay on desktop; `2.0 × 1.15 m` cloth at `2.4 m` when `vrmenu` is on; when `vrmenu` is off, scoreboard shows the heading + totals and `7 m` signs show `BACK`, `AGAIN`, and `CHASE ★` in the `NEXT` slot if `stars < 51`). |

- **Finale Cloth exact wording (`X = total release stars`, `N = 51 - X`):**
  - Heading: **`The Peal Is Whole`**
  - Tally line: **`17 of 17 Trials cleared  ·  ★ X / 51`** *(append `  ·  ◆ Y / 17` only if `ribbons` switch is on)*
  - Chase line: if `X < 51` → **`N stars left to master every Trial`**; if `X === 51` → **`Every Trial mastered  ·  three stars on all 17`**
- **Finale Cloth exact buttons (all live in today's release):**
  1. **Primary red pennant:** **`Chase ★★★`** *(when `X < 51` — jumps straight to the lowest-index release stage with `< 3★`)* / **`Play Again`** *(when `X === 51` — restarts Stage 17)*.
  2. **Cream pennant 1:** **`Stages`** *(opens the 17-stage list, all unlocked)*.
  3. **Cream pennant 2:** **`Again`** *(when `X < 51` — restarts `Blighted meadow`)* / **`Home`** *(when `X === 51` — returns to the title cloth)*.
