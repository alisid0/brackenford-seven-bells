# Bell Watch — Rules and Numbers

Design specification for the main game (**Bell Watch**, `180 s` carefree wave-shooter), answering all nine points in `design/bell-watch-ticket.md`. Built to work identically across `v1`, `bow2`, and `bow3` (`design/fun-bow.md`), respecting every limit in `design/bell-watch.md` (carefree, no harm or lost points, nothing from behind, no flashes or camera shake, world never moves in a headset, **at most 7 shades in view at once**, pure JS / WebAudio on Quest).

---

## Why today's build floods the bell early

In `src/game.js` today, `4` hares spawn at `t = 0` with `WATCH_BELL.share = 0.65` (~2–3 bell-bound at once), can spawn on the bell side (`right = -6`, only `5.2 m` from `watchFoot`), and run at `6.5 m/s` (`spiritStep` line 1412, tuned for short Trials sprints). A bell-side runner arrives in `1.2 + 5.2 / 6.5 = 2.0 s`, putting all three thorn bands on the bell inside the first 10–15 seconds.

The rules below fix this with **four coupled levers**: phased shade caps, far-half bell-runner spawns, Bell Watch–specific approach speeds (`3.8 m/s` runner, `1.4 → 4.6 m/s` creeper), and a simultaneous bell-threat cap (`1` in Calm, `2` in Build/Crest) with a `2.5 s` breather after an overlap.

---

## 1. The curve of a run (`0–180 s`)

Build (`10–60 s`) is split into Early (`10–35 s`) and Late (`35–60 s`) so the player learns hares first, meets the first ram at `22–26 s`, and sees their first bell-bound crow around `35–45 s`.

| Phase | Time (s) | Max shades in view | Composition (Hares / Crows) | Refill delay (s) | Hare bell share | Crow bell share | Max bell-bound at once (excl. ram) | Speed scale | Notes |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| **Calm** | `0–10` | `3` | `2 H / 1 C` (perched) | `2.6–3.4` | `50%` *(1 scripted at `t = 2.5 s`)* | `0%` | `1` | `0.75×` | 1 obvious bell runner + 1 lane sitter + 1 perched crow at `[18, 3, 3]`. |
| **Build (early)** | `10–35` | `5` | `3 H / 2 C` | `2.0–2.8` | `45%` | `0%` | `2` | `0.85×` | Staggered starts (`≥ 1.2 s` apart). First ram arrives at `22–26 s`. |
| **Build (late)** | `35–60` | `6` | `4 H / 2 C` | `1.6–2.4` | `50%` | `20%` | `2` | `0.95×` | Crossing crows begin banking for the bell; creepers mix in. |
| **Crest** | `60–170` | `7` | `4 H / 3 C` | `1.2–2.0` | `55%` | `30%` | `2` | `1.00×` | Full roster. After 2 bell threats overlap within `3.0 s`, hold next bell spawn for `2.5 s` breather. |
| **Release** | `170–180` | *(no new)* | existing finish | `—` | `0%` | `0%` | `0` new | `1.00×` | Cream **"Last shots"** pennant on scoreboard at `t = 170 s`. No ram after `160 s` (`RAM_RULE.least = 20`). |

### Base speeds in Bell Watch (at `1.00×` Crest; `±10%` per-shade `pace`)

| Shade & role | Base speed (m/s) | Spawn zone `[along, right]` (m) | Threat window (spawn/bank → band) |
| --- | ---: | --- | ---: |
| Bell runner hare | `3.8` (`2.85` in Calm) | `along [14, 28]`, far side of bell (`right [-1, +6]` if bell left, `[-6, +1]` if bell right) | `7.0 s` mean (`5.5–8.5 s`; `~9.0 s` in Calm) |
| Bell creeper hare | `1.4` stalk → `4.6` final dash | `along [14, 26]`, `right [-4, +4]` | `9.3 s` mean (`7.5–11.0 s`) |
| Non-bell lane hare | `4.8` run / `1.1` creep / `0` sit | `along [11, 30]`, `right [-6, +6]` | `—` (scenic/score targets) |
| Crossing crow (lane) | `6.0–8.0` | `along [15, 27]`, `right ±12`, `y = ground + 3.2..6.2` | `—` |
| Bell-bound crow | `6.5` cross → `2.8` bank → `4.2` glide | Banks from crossing pass at `along [16, 26]` | `4.5 s` from bank (`~7.0 s` total visible) |
| Shade ram (`RAM_RULE`) | `2.2` (`stand 2.8 s`) | `along 34`, `right [-3, +3]` | `~11.8 s` (`4` rams per run: `first [22, 26]`, `again [34, 38]`) |

### Keeping the hard cap of 7 shades in view when the ram appears

Two sound ways to handle the ram alongside the 7 regular slots in Crest (`60–170 s`):

- **Option A (Ship this — pause 1 hare refill slot while the ram is active):** While `ram.state !== 'off'`, if a hare slot is `'off'`, hold its refill timer until the ram leaves (and if all 7 are already alive when the ram spawns, pause the first hare that is banished so count stays `≤ 7`). Strictly honours *"seven shades at most in view"* and gives the ram visual breathing room.
- **Option B (Dedicated 8th slot for the ram):** Current code (`7` regular + `1` ram = `8` briefly). Simpler, but breaks the 7-shade cap whenever the ram spawns on a full field.

**Ship Option A.**

### End-of-run (`t = 180 s`) finish rule

At `t = 180 s`, stop accepting new shots (`charging` cancels cleanly), let any ranged arrow already in flight finish (hard cap **`2.5 s`** grace), then resolve the bell (`+100` and bronze chime if `bound === 0`), scatter any remaining shades cleanly, and open the end cloth.

---

## 2. The tell before a hare sets out (readable at 25 m)

At `25 m`, `1°` of visual angle is `~0.44 m`, so every cue uses a `≥ 0.35 m` silhouette change, a clear posture/ear shift, and ember eye flare (`#E02E32`).

| Behaviour | Stage | Duration / trigger | Geometry & motion | Audio / flare |
| --- | --- | --- | --- | --- |
| **Sitter → Runner tell** | Rise & ears toward bell | **`1.4 s`** (`1.8 s` in Calm) | Rises from crouch onto haunches (`root.y +0.18 m`, `rear = 0.45`, spine pitch `-0.28 rad`, total height `0.65 m → 1.05 m`), turns body + head toward `watchFoot()`, sweeps **both ears forward toward the bell** (`ear.rotation.x = +0.55 rad`, spread `±0.10 rad` upright V). | Ember `flare.opacity = 0.85`, `scale = 2.1×`; soft double foot-thump (`95 Hz`, `0.04` gain) at `t = 0.2 s`. |
| **Runner broad curve** | Quadratic Bézier approach | From spawn `P0` to `watchFoot()` `P2` | Control point `P1` = midpoint of `P0→P2` offset **`+3.5 m` perpendicular on the downrange (`+along`) side** (clamped `P1.along ∈ [13, 30]`). Keeps the hare broadside to the archer for the first `60%` of the run; **straightens cleanly onto the direct line to `watchFoot()` within the last `5.5 m`** (smooth blend over `1.0 m`). Speed `3.8 m/s × phaseScale`, full `HARE_MOVES.run` stride. | Soft rhythmic grass-bound footfalls (`120 Hz` filtered noise, `0.025` gain, 2/s). |
| **Creeper tell & low stalk** | Crouch & low approach | **`1.2 s`** tell, then stalk until `4.5 m` from `watchFoot()` | Flattens low (`lowS = 0.90`, ears pinned back `-0.65 rad`), turns head toward bell, then stalks direct line at **`1.4 m/s × phaseScale`** (`HARE_MOVES.lopeLow`). | Steady dim ember glow (`opacity = 0.70`); faint grass rustle (`1800 Hz`, `0.012` gain). |
| **Creeper coil & final dash** | Pause then burst | At **`4.5 m`** from `watchFoot()`: **`0.45 s`** coil, then **`~0.98 s`** dash | Coils tight (`speed = 0`, `lowS = 1.0`, ears snap forward `+0.50 rad`, eyes flare `1.0`), then bolts straight to `watchFoot()` at **`4.6 m/s × phaseScale`** (`lowS = 0`, full `HARE_MOVES.run` gait). | Short dry scratch/hiss on dash start (`420 Hz → 260 Hz`, `0.04` gain). |
| **Rear at the belfry foot** | Bind wind-up | Trigger `dist < 1.3 m` (`WATCH_BELL.reach`); total **`1.0 s`** | Faces belfry post, rears upright (`rear: 0 → 1.0` in `0.35 s`, holds `0.50 s` at `~1.25 m` height, drops `0.15 s`). **`live = true` for the first `0.85 s`** so a clutch shot saves the bell. At `t = 1.0 s`: `+1` thorn band (max 3), `burst('#4A2943')`, hare vanishes. | `glow.emissiveIntensity +1.2`; iron clank (`147 Hz → 110 Hz`, `0.12` gain) at `t = 1.0 s`. |

- **Bell-bound runner mix:** Within bell-bound hares, **`60%` runners / `40%` creepers** (Calm's scripted opening hare is always a **runner** so the broad curve and tell read cleanly on run 1).

---

## 3. Crows at the bell

The belfry fork sits at `PEAL_AT = [22, ±12.5]` m with the fork opening from `y = 2.42 m` to `3.20 m` above the `2.30 m` crossbeam (`src/props.js`). The crow's fork landing point is `PEAL_AT` at **`y = ground + 2.80 m`** (clear of the hanging bell below, centred in the silhouette of the timber fork).

| Stage | Trigger / timing | Exact numbers | Readability at 25 m |
| --- | --- | --- | --- |
| **Share going for bell** | By phase (see §1) | `0%` (`0–35 s`), **`20%`** (`35–60 s`), **`30%`** (`60–170 s`); capped by global `maxBell = 2` (excl. ram). | Never stacks 3+ bell threats at once. |
| **Perched crow takeoff tell** | If perched crow is chosen for bell (or after `12–16 s` idle in Build/Crest) | **`1.0 s`** open-wing tell on the perch: wings spread wide (`wings.rotation.z = ±0.20 rad`, `rotation.y = 0`), torso leans forward `0.25 rad`, eyes flare `0.85`, then lifts into `4.2 m/s` glide to fork. | Wingspan opens from `~0.25 m` folded to **`1.24 m`** spread. |
| **Crossing crow bank** | Crossing pass at `y = ground + 4.2..5.8 m`, `6.5 m/s`, upon reaching `along ∈ [16, 26]` and within `6.0 m` laterally of the bell side | **`1.2 s` bank:** slows to **`2.8 m/s`**, turns `120°` toward `PEAL_AT`, rolls **`55°` (`0.96 rad`) belly/wings toward the archer**, wingbeat slows to **`6 rad/s`** glide-beat. Dry caw (`620 Hz → 440 Hz`, `0.05` gain). | Full `1.24 m` ragged crimson/plum wingspan tilts flat to the player's eye (`~2.8°` angular width at `25 m`). |
| **Descent to the fork** | Immediately after bank | Straight shallow glide to `[PEAL_AT[0], PEAL_AT[1], ground + 2.80]` at **`4.2 m/s × phaseScale`** (`8–11 m` = **`2.0–2.6 s`** glide; `live = true`). | Predictable steady lead line toward the belfry silhouette. |
| **Landing & binding** | Within `0.4 m` of fork perch | **`0.95 s` spread-wing landing:** perches in fork with wings held wide (`±0.25 rad`), head dipping toward bell (**`live = true` for first `0.80 s`**). At `t = 0.95 s`: **`+1` thorn band** (cap 3), plum burst, crow vanishes. | Distinct elevated silhouette on the fork; clear last-second rescue window. |

### Does a crow count the same as a hare?

| Property | Hare | Crow |
| --- | --- | --- |
| Thorn bands added on arrival | `+1` (max 3) | **`+1` (max 3)** — same weight at the bell |
| Scattered by ringing the bell | Within **`9.0 m`** of `watchFoot()` (`WATCH_BELL.scatter`) | Within **`11.0 m`** of belfry fork (`WATCH_BELL.scatterAir = 11`) |
| Base score (`SPIRIT`) | `sit 100`, `creep 200`, `run 240` | `perch 160`, **`cross / bell-descent 300`** (higher score for the harder aerial shot; a perched crow upgrades to `300` once airborne) |
| Streak tally | `+1` | `+1` |

---

## 4. The bell's rhythm

| Rule | Exact value | Reasoning |
| --- | --- | --- |
| **Target arrival rate (fair player)** | **`2.0–3.5` bands/min** (`6–10` bands across a `180 s` run) | Out of `~33` bell threats spawned in `180 s` (`~23` hares, `~6` crows, `4` rams), a fair player banishes `~70%`, letting `~7–10` bands land → **`3–5` clear rings per run**. |
| **Idle (no shooting) arrival rate** | `1` band in Calm (`0–10 s`); reaches `3` bands around `t = 22–28 s`; `6–8` bands/min in Crest | Fixes today's instant 3-band flood while making the bell visibly busy if ignored. |
| **How long a bound bell stays worth ringing** | **Indefinitely while `bound ≥ 1`** (no decay timer, no penalty) | Carefree rule: a player can finish a ram or a streak before ringing the bell without losing anything. |
| **Ringing cooldown** | **Chime:** `0.8 s` audio debounce; **Scatter pulse:** **`4.0 s`** cooldown when rung at `0` bands, **`0 s`** (instant) whenever `bound ≥ 1` | Prevents spamming the bell every second on an empty bell to farm scatters, while guaranteeing a bound bell **always** clears and scatters on the first hit. |
| **Ringing points** | **Option A (Ship): `0` points** (never a miss, never breaks streak; protects the `+100` clear-bell end bonus; clearing 3 bands plays a deeper resonant overtone + `24`-piece plum burst). **Option B:** `+25` per band cleared. | **Ship Option A.** Any per-band score rewards players for *letting* shades bind the bell to farm points; keeping score strictly on direct shade hits matches `design/bell-watch.md` (*"Ringing clears space; direct hits earn the score"*). |

---

## 5. Streak ribbons at 5, 10, and 20

In `src/game.js` today, misses leave `range.streak` untouched in Bell Watch, which means the Trials ramp (`1.0 → 2.0×` over 10 hits) puts every player at `2.0×` for the last two minutes. Replacing that ramp with **three ribbon tiers** makes every ribbon meaningful without punishing misses.

### What counts toward the tally

| Event | Tally change | Notes |
| --- | --- | --- |
| Hare banished (any type) | **`+1`** | Counts toward ribbons |
| Crow banished (perched, crossing, bell-bound) | **`+1`** | Counts toward ribbons |
| Shade ram banished | **`+1`** | Counts toward ribbons (still worth `300` base + distance) |
| Bell rung (bound or clear) | **`0`** (unchanged) | Neither a hit nor a miss (`tests/watch.html` stays green) |
| Missed arrow | **`0`** (unchanged) | Carefree rule: *"a miss leaves the tally alone"* |

### Ribbon tiers, cues, and score multiplier

| Tier | Tally reached | Multiplier | Visual cue on scoreboard / HUD | Audio cue |
| --- | ---: | ---: | --- | --- |
| Base | `0–4` | `1.00×` | Plain score | Normal hit chime |
| **Ribbon 1 (Cream)** | **`5`** | **`1.10×`** | Cream tally badge (`#F6E6BD`) beside score | 1 soft bell tap (`523 Hz`, `0.25 s`, `0.08` gain) |
| **Ribbon 2 (Red-trimmed)** | **`10`** | **`1.25×`** | Red-trimmed ribbon (`#ae493d` border) by score | 2 rising notes (`523 → 659 Hz`, `0.10 s` apart) |
| **Ribbon 3 (Gold-stitched)** | **`20`** | **`1.40×`** | Gold stitching (`#F0C75A`) added to ribbon | 3-note phrase (`523 → 659 → 784 Hz`, `0.09 s` apart) |

### Reset vs milestone tally (two sound options)

- **Option 1 (Ship this — Milestone tally, never resets in a run):** Every hit adds `+1`; nothing resets it. A new player reaches Ribbon 2 (`10`), a fair player reaches Ribbon 3 (`20`) around `1:20–1:35`, and a very good player reaches Ribbon 3 before `1:00` and rides `1.40×` through the Crest. 100% carefree (pausing to look around never punishes you) and literally matches ChatGPT's wording.
- **Option 2 (10-second quiet-gap cool-down, no miss penalty):** Same tiers and cues, and misses never reset it, but going `10.0 s` with neither a banish nor a bell ring gently fades the tally back to `0`. Adds light pacing urgency for score-chasers, at the cost of punishing a player who pauses.

**Ship Option 1.** (Keeping `range.streak` monotonic in Bell Watch also keeps `tests/watch.html`'s `missIsFree` test intact.)

---

## 6. Snap and long shots

Measure `drawTime = elapsed - drawStart` (seconds from string catch to loose; on desktop/single-hand draw, from trigger/mouse press to loose) and `dist = Math.round(origin.distanceTo(hitPos))` (metres). Categories are **mutually exclusive** (Snap checked first, then Long, then Standard):

| Shot style | Rule | Flat bonus (added before multipliers) | Feedback on hit |
| --- | --- | ---: | --- |
| **Quick snap shot** | `drawTime ≤ 0.65 s` **and** `dist ≥ 10 m` | **`+35`** | Dry crisp snap (`290 Hz` pop), short sideways plum burst (`14` chips, lateral spread), instant `+pts · Snap` popup. |
| **Careful long shot** | `drawTime ≥ 0.90 s` **and** `dist ≥ 24 m` | **`+55 + 4 × (dist − 24)`** *(e.g. `+55` at `24 m`, `+79` at `30 m`, `+95` at `34 m` ram)* | Clean longer chime (`+0.18 s` sustain + fifth overtone), warm gold tint popup `+pts · Long <dist> m`. |
| **Standard shot** | All other hits (`0.65 < drawTime < 0.90 s` or `drawTime ≥ 0.90 s` under `24 m`) | **`+0`** | Normal banish burst and chime. |

### Scoring formula in Bell Watch

```
pts = Math.round((SPIRIT[kind] + dist + styleBonus) * ribbonMult * (perfect ? 1.25 : 1.00))
```

### Style parity proof (fair player over a 180 s run, clear bell `+100`)

| Play style | Shots/min | Hits in 180 s | Style mix | Perfect rate | Mean base + dist | Expected score | Delta vs balanced |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| **Snap shooter** | `~25` | `46` | `80%` snap (`~18 m`) | `25%` | `215 + 18 = 233` | **`17,137`** | `+4.1%` |
| **Balanced** | `~20` | `40` | `35%` snap / `30%` long | `50%` | `230 + 19 = 249` | **`16,459`** | `0.0%` |
| **Careful long** | `~14` | `34` | `80%` long (`~28 m`) | `75%` | `245 + 28 = 273` | **`16,799`** | `+2.1%` |

Both styles land within **`±2.1%`** of a balanced run (`~16.5k–17.1k`): fast snap shooting and slow deliberate long shooting are equally competitive on the high-score board.

---

## 7. The end cloth

Shown as a stationary cloth panel in front of the player (same placement as the cloth menu; world never moves in VR) once the last in-flight arrow lands (or `2.5 s` after `0:00`, whichever comes first).

### Layout order (top to bottom)

1. **Title & Ribbon:** `Bell Watch` on the left; highest ribbon earned (`5` cream / `10` red / `20` gold) on the right (omitted if `< 5` hits).
2. **Score & Best:** Large primary **Score** number beside **Best** (`Best 18,450`, or **`New best  +1,240`** in gold `#F0C75A` when beating an existing record; `New best` on run 1).
3. **Run line 1:** `Shades banished <hits>  ·  Snaps <snaps>  ·  Long <longs>`
4. **Run line 2:** `Bell rung <rings>×  ·  Bell clear (+100)` *(or `Bell ended bound` — neutral phrasing, never red or punitive)*
5. **Buttons:** Red **`AGAIN`** button (primary, centred; shootable in VR via `rangeSigns.again` or clickable/B-press via `?pads=1`) + quiet secondary **`Menu`** button beside it.

### Timing and new-best celebration

| Parameter | Exact value |
| --- | --- |
| **Input guard before `AGAIN` activates** | **`0.8 s`** after the cloth opens (button is visible immediately at `60%` opacity and switches to `100%` active at `0.8 s` so a final shot or lingering button press never skips the result). |
| **New best visual** | One **gold stitched border (`#F0C75A`, `3 px` dashed stitch)** around the Score box + gold `New best (+N)` subtitle. Zero screen flashes, zero camera shake. |
| **New best audio** | End-of-run triad (`523, 659, 784 Hz` at `0, 0.13, 0.26 s`), followed at **`+0.42 s`** by one **bright bronze bell note** (`523 Hz` + `1047 Hz` harmonic shimmer, `0.9 s` decay). |

---

## 8. The score to chase

Expected `180 s` scores under the §1–§6 rules (using `SPIRIT` values, `RAM_RULE` = `4` rams/run, ribbon multipliers `1.00 / 1.10 / 1.25 / 1.40×`, snap/long bonuses, `1.25×` perfect release, and `+100` clear bell):

| Player tier | Shots / min | Accuracy | Hits in 180 s | Rams banished | Ribbon reached | Bell clear at 0:00? | Expected score range |
| --- | ---: | ---: | ---: | ---: | --- | --- | ---: |
| **New player** | `10–13` | `50–58%` | `16–22` | `1–2 / 4` | Ribbon 2 (`10`) | Often bound (`0`) | **`4,500 – 7,000`** |
| **Fair player** | `18–22` | `65–72%` | `36–44` | `3 / 4` | Ribbon 3 (`20`) ~`1:25` | Usually clear (`+100`) | **`14,000 – 18,500`** |
| **Very good player** | `25–30` | `78–85%` | `58–68` | `4 / 4` | Ribbon 3 (`20`) ~`0:55` | Clear (`+100`) | **`27,000 – 32,500`** |

*(Automated sanity target: a deterministic bot firing every `2.6 s` at `70%` hit rate ≈ `48` hits should land near **`19,000–22,000`**.)*

---

## 9. How to judge Bell Watch without a headset

Claude can verify the entire pacing and scoring design in headless automated runs (extending `tests/watch.html` or adding `tests/watch-rules.html`) using **four scripted bot profiles** over full `180 s` runs (`10,800` ticks at `1/60 s`):

1. **Idle bot** (`0` shots) — tests pure wave pacing, bell arrival rhythm, and absence of early floods.
2. **Fair bot** (fires every `3.0 s`, `70%` hit rate, prioritizes nearest bell-bound shade, rings bell whenever `bound >= 2`) — tests real gameplay rhythm and fair-player score band.
3. **Very good bot** (fires every `2.0 s`, `85%` hit rate, prioritizes rams and bell-bound shades, rings bell at `bound >= 1`) — tests crest headroom and upper score band.
4. **Style-parity pair** (Snap bot: `drawTime = 0.45 s`, shoots `< 22 m` every `2.4 s` at `65%` accuracy vs Long bot: `drawTime = 1.10 s`, shoots `≥ 24 m` every `3.6 s` at `82%` accuracy) — verifies neither style dominates.

### Automated acceptance ranges

| Metric | Idle bot (`0` shots) | Fair bot (`20` shots/min, `70%` hit) | Very good bot (`30` shots/min, `85%` hit) | Hard fail if outside |
| --- | ---: | ---: | ---: | --- |
| **Time to 1st thorn band (s)** | `8.5 – 12.0` | `15 – 45` *(or none)* | `≥ 30` *(or none)* | Idle `< 7.0 s` (means Calm runner too fast/close) |
| **Time to 3 thorn bands (s)** | `20 – 32` | `≥ 45` *(or never)* | Never reaches 3 | Idle `< 18 s` (early-flood bug still present) |
| **Bands landed / min (full run)** | `5.5 – 8.0` | **`2.0 – 3.5`** | **`0.0 – 1.2`** | Fair `< 1.0` (bell ignored) or `> 4.5` (relentless) |
| **Shots / min** | `0` | `18 – 22` | `26 – 32` | — |
| **Hits / min** | `0` | `12 – 15` | `20 – 24` | — |
| **Idle seconds with `0` shootable shades (`0–170 s`)** | `0.0` | **`≤ 3.0 s` total** (`max gap ≤ 1.5 s`) | **`≤ 6.0 s` total** (`max gap ≤ 2.0 s`) | Fair `> 5.0 s` or any gap `> 2.5 s` (empty field!) |
| **Peak shades simultaneously in view (incl. ram)** | `≤ 7` (`≤ 3` in Calm) | `≤ 7` | `≤ 7` | Any frame `> 7` |
| **Peak simultaneous bell-bound shades (excl. ram)** | `≤ 1` Calm, `≤ 2` rest | `≤ 1` Calm, `≤ 2` rest | `≤ 1` Calm, `≤ 2` rest | Any frame `> 2` (or `> 1` in Calm) |
| **Shortest bell-threat travel window** | Hare `≥ 5.0 s`, Crow bank→band `≥ 4.0 s`, Ram `≥ 10.5 s` | Same | Same | Any hare `< 4.5 s` or crow `< 3.5 s` |
| **Rams spawned per run** | `4` (`3–4`) | `4` | `4` | `< 3` or `> 5`, or any ram after `160 s` |
| **Final score** | `0` | **`14,000 – 18,500`** | **`26,000 – 33,000`** | Outside band by `> 20%` |
| **Style-parity ratio (`Snap / Long`)** | — | **`0.90 – 1.10`** (parity pair) | — | `< 0.85` or `> 1.15` |
| **Carefree & safety invariants** | `0` score drops, `0` spawns in `170–180 s`, `0` spawns at `along < 11 m`, `0` rig/camera moves, `0` JS errors | Same + `0` streak drops on miss + `AGAIN` locked for `0.8 s` | Same | Any single violation |

---

## Summary of constants for `src/game.js`

```js
const WATCH_PHASES = [
  // [untilSec, maxShades, maxHares, maxCrows, againMin, againMax, hareBellShare, crowBellShare, maxBell, speedScale]
  { until:  10, max: 3, hares: 2, crows: 1, again: [2.6, 3.4], hareBell: 0.50, crowBell: 0.00, maxBell: 1, speed: 0.75 },
  { until:  35, max: 5, hares: 3, crows: 2, again: [2.0, 2.8], hareBell: 0.45, crowBell: 0.00, maxBell: 2, speed: 0.85 },
  { until:  60, max: 6, hares: 4, crows: 2, again: [1.6, 2.4], hareBell: 0.50, crowBell: 0.20, maxBell: 2, speed: 0.95 },
  { until: 170, max: 7, hares: 4, crows: 3, again: [1.2, 2.0], hareBell: 0.55, crowBell: 0.30, maxBell: 2, speed: 1.00 },
  { until: 180, max: 0, hares: 0, crows: 0, again: [99,  99 ], hareBell: 0.00, crowBell: 0.00, maxBell: 0, speed: 1.00 }
];

const WATCH_HARE = {
  runSpeed: 3.8,       // bell-bound runner (1.00x Crest)
  laneRunSpeed: 4.8,   // non-bell runner
  creepSpeed: 1.4,     // bell-bound creeper stalk
  dashSpeed: 4.6,      // bell-bound creeper final dash
  dashAt: 4.5,         // metres from watchFoot() where coil + dash starts
  coilSec: 0.45,       // pause before final dash
  tellRun: 1.4,        // sitter rise + ears-to-bell tell (1.8 in Calm)
  tellCreep: 1.2,      // low crouch tell
  curveBow: 3.5,       // metres downrange Bézier control offset
  straightenAt: 5.5,   // metres from watchFoot() where curve straightens
  rearSec: 1.0,        // rear at belfry foot (live for first 0.85 s)
  rearLive: 0.85,
  runnerMix: 0.60      // 60% runners, 40% creepers among bell-bound hares
};

const WATCH_CROW = {
  crossSpeed: [6.0, 8.0],
  perchTell: 1.0,      // open-wing tell before takeoff
  bankSec: 1.2,        // full-wing bank duration
  bankSpeed: 2.8,      // speed during bank
  bankRoll: 0.96,      // 55 deg roll toward archer
  glideSpeed: 4.2,     // descent speed to fork
  forkY: 2.80,         // metres above ground at PEAL_AT
  landSec: 0.95,       // spread-wing settle on fork (live for first 0.80 s)
  landLive: 0.80,
  scatterAir: 11.0     // metres from fork scattered by bell ring
};

const WATCH_SCORE = {
  ribbons: [[5, 1.10], [10, 1.25], [20, 1.40]],
  snapMaxSec: 0.65, snapMinDist: 10, snapBonus: 35,
  longMinSec: 0.90, longMinDist: 24, longBase: 55, longPerM: 4,
  perfectMult: 1.25,
  bellBonus: 100,
  ringChimeCool: 0.8,
  ringScatterCool: 4.0,  // bypassed (0 s) whenever bound >= 1
  bellBreather: 2.5,     // pause after 2 bell threats overlap within 3.0 s
  endGrace: 2.5,         // max wait for arrows in flight at 0:00
  againGuard: 0.8        // seconds before AGAIN activates on end cloth
};
```
