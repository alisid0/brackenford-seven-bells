# Arrow mechanics, second version (`arrow-mechanics-v2`)

Spec for step 2 of `design/controls-and-arrows.md`, built behind a switch (suggested: `bow2` / `?bow2=1`, default off until the developer compares v1 and v2 in `?lab=1` on Quest). Every rule stays carefree: no player harm, no lost points, no forced release, unlimited arrows in Bell Watch and the lab, and straightforward to run in a Quest web page.

---

## 1. Draw length and the player's reach

**Rule (ship this — adaptive eye-height start + gentle 3-shot auto-learn, with Settings override):** Estimate the player's natural cheek-anchor reach on entry from their `local-floor` headset eye height (`0.345 × eyeY`), then quietly refine it from their first few honest draws so both a short child and a tall adult hit 100% power comfortably at their cheek without straining or losing Quest tracking behind the ear. Keep a 3-preset override (`Auto` / `Short 46 cm` / `Long 64 cm`) plus a `Reset draw` button in Settings.

**Alternative (also sound, simpler):** Fixed 3-preset setting (`Short 46 cm`, `Standard 56 cm`, `Long 64 cm`) plus a "Measure my draw" button in Settings. Good fallback, but requires a menu stop whenever a child and adult trade the headset — ship the automatic rule above so the first arrow already feels right.

| Parameter | Value | Reason |
|---|---|---|
| `restDraw` (0% draw) | `0.12 m` (`12 cm`) | Unchanged grip-to-nock brace distance. |
| Initial `fullDraw` (standing, `local-floor` `eyeY >= 1.15 m`) | `clamp(eyeY * 0.345, 0.44, 0.66)` | `1.30 m` child → `45 cm`; `1.62 m` adult → `56 cm`; `1.88 m` tall adult → `65 cm`. |
| Initial `fullDraw` (seated `eyeY < 1.15 m` or non-`local-floor`) | `0.52 m` (`52 cm`) | Safe middle starting point; auto-learn adjusts within 3 shots. |
| Hard clamp on `fullDraw` | `[0.42 m, 0.68 m]` | Keeps draw span in `[30 cm, 56 cm]`; avoids Quest camera occlusion behind the ear (`> 68 cm`). |
| Honest-draw qualifier for auto-learn | `hold >= 0.35 s` and `dist ∈ [0.36 m, 0.72 m]` | Ignores accidental clicks and deliberate quick soft lobs. |
| Upward adapt (player consistently pulls past `fullDraw`) | After 3 honest draws with `peakDist > fullDraw / 0.95`: blend `fullDraw` 35% per draw toward `0.95 × median(last 5 peakDist)` | Gives 5% headroom at the anchor so full draw hits reliably without slamming the headset. |
| Downward adapt (player plateaus below `fullDraw`) | After 3 consecutive honest draws with `peakDist ∈ [0.72, 0.92] × fullDraw`: blend `fullDraw` 35% per draw toward `0.98 × median(last 3 peakDist)` | Catches seated players or children whose height wasn't known at entry. |
| Normalized draw `d` | `clamp((dist - restDraw) / (fullDraw - restDraw), 0, 1)` | Single `0..1` value shared by speed, visuals, haptics, and lab readout. |
| Desktop & single-handed VR draw | Unchanged ease-out `0 → 1` over `0.85 s` | Keeps non-two-handed modes identical in rhythm. |

---

## 2. Speed from draw

**Rule:** Cancel without firing below `15%` draw so tiny grip adjustments never misfire; above `15%`, map draw to launch speed on a gentle `1.25` power curve from `18 m/s` to `62 m/s` with a `4%` full-draw plateau (`d >= 0.96` gives exact `62.0 m/s`) so micro-tremor at the cheek never changes arrow speed.

```js
// d in [0, 1] from section 1; returns 0 (cancel) when d < 0.15
const drawNorm = clamp(d / 0.96, 0, 1);
const speed    = d < 0.15 ? 0 : 18 + 44 * Math.pow(drawNorm, 1.25);
```

| Parameter / Draw `d` | Today (v1) | v2 | Reason |
|---|---|---|---|
| Minimum draw to loose | `10%` (`27.8 m/s`) | **`15%` (`22.3 m/s`)** | Prevents accidental misfires when adjusting fingers (`< 15%` quietly settles the string). |
| Speed formula | `24 + 38 * d` (linear) | `18 + 44 * clamp(d / 0.96, 0, 1)^1.25` | Rewards pulling cleanly to full anchor; makes half-draws noticeably softer. |
| `d = 25%` | `33.5 m/s` | `26.2 m/s` | Gentle close lob. |
| `d = 50%` | `43.0 m/s` | `37.5 m/s` | Clear step below full draw (`-5.5 m/s`). |
| `d = 75%` | `52.5 m/s` | `50.3 m/s` | Brisk snap-shot speed. |
| `d = 90%` | `58.2 m/s` | `58.6 m/s` | Smooth ramp into the anchor. |
| `d = 96%–100%` | `60.5–62.0 m/s` | **`62.0 m/s` (flat)** | Authentic 40–45 lb bow speed; `4%` anchor plateau eliminates ±1 cm hand-tremor speed jitter. |

---

## 3. Gravity and air

**Rule:** Use real Earth gravity (`9.81 m/s²`) and light quadratic air drag (`k = 0.0025 m⁻¹`, matching a real feathered target arrow) while keeping full-draw launch speed at `62 m/s` and crosswind push at `wind * 1.4 m/s²`. Use midpoint velocity for the position step (`p += (v0 + v1) * 0.5 * dt`) so 60 Hz desktop and 72/90 Hz Quest trajectories match to `< 1 mm`.

```js
// per frame in stepArrows(dt)
const speed = q.velocity.length();
q.velocity.addScaledVector(q.velocity, -0.0025 * speed * dt);  // quadratic air drag: a = -k * |v| * v
q.velocity.y -= 9.81 * dt;                                     // real gravity
// crosswind unchanged: push = range.wind * 1.4 * dt * (gale ? 0.5 : 1)
```

### Drop and flight at full draw (`62 m/s`): v2 vs today (v1)

Horizontal drop = vertical fall from a level (`0°`) launch; aim angle = upward launch angle to hit a target at the same height.

| Distance | Today drop (`g=7, k=0`) | **v2 drop (`g=9.81, k=0.0025`)** | Today aim angle | **v2 aim angle** | Today flight / arrival `v` | **v2 flight / arrival `v`** | v2 arc apex |
|---|---|---|---|---|---|---|---|
| **10 m** | `0.09 m` | **`0.13 m`** | `0.54°` | **`0.76°`** | `0.16 s` / `62.0 m/s` | **`0.16 s` / `60.4 m/s` (97%)** | `0.03 m` |
| **20 m** | `0.37 m` | **`0.53 m`** | `1.06°` | **`1.53°`** | `0.32 s` / `62.0 m/s` | **`0.33 s` / `59.0 m/s` (95%)** | `0.13 m` |
| **30 m** | `0.83 m` | **`1.22 m`** | `1.58°` | **`2.33°`** | `0.48 s` / `62.0 m/s` | **`0.50 s` / `57.5 m/s` (93%)** | `0.31 m` |
| **50 m** | `2.29 m` | **`3.49 m`** | `2.63°` | **`4.02°`** | `0.81 s` / `62.0 m/s` | **`0.86 s` / `54.7 m/s` (88%)** | `0.91 m` |
| **70 m** | `4.48 m` | **`7.08 m`** | `3.68°` | **`5.84°`** | `1.13 s` / `62.0 m/s` | **`1.24 s` / `52.1 m/s` (84%)** | `1.89 m` |

Why these numbers: at `10–20 m` (beginner stages and most Bell Watch hares) shots still feel crisp and direct (`+4–16 cm` extra drop). At `30 m` ("The drop" and the shade ram at `34 m`) the arc becomes genuinely readable (`1.22 m` drop, `2.33°` up). At `50–70 m` the arrow visibly slows (`84%` arrival speed) and lobs in a satisfying `1.89 m` arc instead of flying like a laser.

### Stages in `shared/game-data.json` to re-check under v2

| Stage (id, release?) | Target / wind | Impact under v2 | Re-check priority |
|---|---|---|---|
| **#20 Master of the line** (extra) | `70 m`, `wind [-3, 5]`, slide `±4 m` | Drop `4.48 → 7.08 m`; peak wind drift grows `7.2 → 8.2 m` (right at the `±8 m` lane edge). Check if gust should ease to `4`. | **High** |
| **#5 The long lane** (extra) & **#15 Long wind** (extra) | `60 m` (and `wind [5, 0]`) | Drop `3.3 → 5.1 m`; wind drift `3.3 → 3.7 m` (still inside lane, check horizon clearance and replay framing). | **Medium** |
| **#18 Storm lane** & **#19 Far slider** (extra) | `45 m wind [2, 7]` / `50 m` slider | Drop `2.29 → 3.49 m`; slider flight time `+0.05 s` (`0.81 → 0.86 s`). Verify 3-star feel. | **Medium** |
| **#4 Three ranges** (**release**) | `15 / 30 / 45 m` | Only release stage past `32 m`. Aim moves `2.4° → 3.6°`; steeper arc clears the `43 m` terrace step even more cleanly. Check replay camera framing. | **Low–Medium** |
| **#3 The drop**, **#7 Crosswind**, **#16 The gauntlet**, **#22 The warren** (**release**) | `30–32 m`, wind up to `-5` | Drop `0.83 → 1.22 m` (`+0.75°`); wind drift `+4 cm` (`0.83 → 0.87 m`). Actually improves `#3 The drop` (drop now clearly teaches elevation). | **Low (sanity check)** |
| **#26 On the post** (**release**) | `27 m`, height `3.5 m` | Slightly steeper upward aim; verify perched crow hitboxes feel generous. | **Low (sanity check)** |
| **Training yard lessons 2 & 5** (`d70`) + **automated tests** (`tests/ram.html`, `tests/pads.html`) | `70 m` drill / test auto-aim helpers | Test scripts compute analytic aim with hardcoded `s=62, g=7`; update test fire helpers when `bow2` is tested. | **Required for tests** |
| All `≤ 25 m` stages & **Bell Watch** | `10–34 m` | `+0.04–0.39 m` drop, `+0.01–0.02 s` flight time — no target relocation needed. | **None** |

---

## 4. Release (removing the trigger finger's jerk)

**Rule (ship this — analog early-latch + spike-gated lookback + peak power latch):** Record a `200 ms` ring buffer of `[t, dir, d]` every frame while drawing in VR. When the trigger begins opening or releases, reject the trigger-finger pluck (`> 45 °/s` sudden jump) while keeping smooth tracking of moving shades (`15–28 °/s` for hares/crows) lag-free.

**Alternative (also sound, simpler):** Fixed pre-release average over `[t_rel - 100 ms, t_rel - 50 ms]` plus peak `d` over the last `100 ms`. Very simple (~10 lines) and kills stationary trigger plucks cleanly, but adds `~1.3°` (`~45 cm` at `20 m`) lag when smoothly sweeping across a running hare or crossing crow. Ship the spike-gated rule below so moving shots stay crisp too.

| Mechanism | Exact rule & numbers | Reason |
|---|---|---|
| Aim ring buffer | Store `[elapsed, dir.clone(), d]` each VR frame while `charging && drawHand`; prune entries older than `0.22 s`. | Covers Quest 72–90 Hz and desktop/test 60 Hz (`12–20` samples). |
| Analog early-latch (real Touch controllers) | Track `gp.buttons[0].value`. Once `value >= 0.85` has been reached on this draw, if `value` falls below **`0.80`** while `selectend` has not yet fired, latch `earlyAt = elapsed` (if `value` rises back `>= 0.85`, clear `earlyAt`). Use `t_cut = earlyAt || elapsed` when `selectend` fires (capped at most `0.08 s` earlier than `selectend`). | Captures the aim as the index finger *begins* relaxing, `30–50 ms` before the trigger spring kicks the controller. Automatically skipped for binary buttons / hand tracking. |
| Spike-gated lookback (works on analog, binary, & hand tracking) | Scan buffer entries in `[t_cut - 0.120, t_cut]` backward from `t_cut`. Compute frame-to-frame angular speed `angDeg / dt`. If any step exceeds **`45 °/s`**, find the **earliest** spike timestamp `t_spike` inside that `120 ms` window and average all samples in `[t_spike - 0.045, t_spike)` (fallback: last sample before `t_spike`). | A `6 cm` trigger jerk in `1–5` frames (`tests/pads.html`) spikes at `120–370 °/s`, cleanly caught and rewound; smooth tracking of a `6.5 m/s` hare at `20 m` (`18 °/s`) or `10 m/s` crow (`28 °/s`) stays under `45 °/s` and suffers zero rewind lag. |
| Clean-release smoothing (no spike detected) | Average all buffer samples in `[t_cut - 0.045, t_cut]` (normalize sum of unit vectors). | Trims 1-frame controller jitter while keeping tracking lag `< 0.4°` (`< 14 cm` at `20 m`). |
| Power latch | Take `d_launch = max(d)` over `[t_cut - 0.100, t_cut]` (using the pre-spike window if rewound). | Prevents losing `3–5%` speed or breaking a sweet release when the string hand relaxes `1–2 cm` forward as the trigger opens. |
| Lab shake readout | Keep `labShake` measuring the **raw** hand movement (between raw release hand dir and `60–200 ms` prior), and add a second `err` / post-filter value in `lab.shot` (angle between launched `dir` and settled `120–200 ms` prior) so the lab proves the filter removed the jerk. | Preserves `tests/pads.html`'s `jerkShows` check while showing v2's actual improvement in the lab. |

---

## 5. Holding at full draw

**Rule (ship this — generous positive sweet-spot, zero punishment for holding):** Unify the sweet-spot ("Perfect release", `×1.25` score) to **`0.0–1.2 s`** after reaching full draw (`d >= 0.96`) on both VR and desktop. After `1.2 s` the bonus quietly closes, and after `2.0 s` the bowstring gives a faint atmospheric tension breath — **never** forcing release, never adding aim wobble, never cutting speed or points.

**Alternative (also sound):** Open the sweet-spot at `0.25–1.35 s` (requiring a `0.25 s` settle pause at anchor before the bonus turns on) to reward deliberate holds over instant snap shots. Rejected for shipping because Bell Watch's quick snap shots at full draw should feel rewarded, not punished for being fast.

| Phase at full draw (`d >= 0.96`) | Duration | Gameplay effect | Visual / audio / haptic cue |
|---|---|---|---|
| **Sweet-spot open** | `0.0–1.2 s` after `fullAt` | `perfect = true` (`×1.25` score, Dead-Eye ribbon progress, gold-cream flight trail) | Crisp double-hand anchor snap at `0.0 s`; subtle warm glint on arrow tip / desktop fill bar highlight. |
| **Sweet-spot closed** | `> 1.2 s` after `fullAt` | `perfect = false`; **100% full speed (`62 m/s`), zero aim sway, zero forced loose** | One soft low timber creak + faint bow-hand pulse (`0.14`, `20 ms`) at `1.2 s`. |
| **Held tension breath** | `> 2.0 s`, every `0.9 s` | **Pure atmosphere — zero effect on `aimVR()` or launch vector** | `±1.5 mm` visual string-mesh hum (`setString` only) + gentle bow-hand pulse (`0.08`, `18 ms`). Remove desktop `tired` bow-position tremor from aiming feel (keep strictly visual on string only). |
| **Re-arm threshold** | `d < 0.80` | Resets `fullAt = 0` | Player can cleanly let down and re-draw for a fresh sweet-spot; prevents micro-twitch re-arming at `95%`. |

---

## 6. The arrow's character in flight (looks only)

**Rule:** Keep physics and raycast hit detection untouched; make the arrow visually read as a live wooden shaft by sharpening the short post-loose fishtail ("archer's paradox"), locking orientation cleanly to the true curved velocity vector, tying ribbon trail length and tint to instantaneous speed and sweet-release, and scaling impact quiver to arrival speed.

| Visual layer | Formula / numbers (applied to `u.body` and `u.streak` only) | Why |
|---|---|---|
| **Path alignment (weathervaning)** | `q.o.quaternion.setFromUnitVectors(FWD, dir)` every frame | With `g = 9.81`, the arrow visibly pitches nose-down past the apex on `30–70 m` arcs. |
| **Archer's paradox wobble** | `ampYaw = (0.06 + 0.08 * power) * Math.exp(-7.5 * life)` (`8.0°` peak at full draw, `< 1°` by `0.28 s` / `~17 m`); `body.rotation.y = ampYaw * Math.sin(42 * life)`; `body.rotation.x = ampYaw * 0.35 * Math.cos(31 * life)` | Crisp, authentic wooden-shaft flex off the bowstring that settles completely before mid-flight; zero effect on `q.o.position` or raycast. |
| **Fletching spin** | `q.roll += dt * (10 + speed * 0.25)`; `body.rotation.z = q.roll` | Smooth helical shimmer on the 3 cream feathers that slows naturally as air drag slows the shaft. |
| **Speed-linked air ribbon (`streak`)** | Length `clamp((speed - 14) * 0.045, 0.15, 2.2) * Math.min(1, life / 0.06)` (`2.16 m` at `62 m/s`, `~1.7 m` at `70 m`, `0.5 m` at `25 m/s`); fades smoothly to `0` over `life ∈ [1.5, 2.0 s]`. | Visually shows air drag and draw power without HUD clutter. |
| **Sweet-release ribbon tint** | Standard: cream `#FFFAE8`, opacity `0.45`. Sweet release (`perfect`): warm gold-cream `#FFE9A8`, opacity `0.72` (and `1.25×` ribbon width). | Instant diegetic feedback that you hit the sweet-spot. |
| **Impact quiver** | On stick: `jolt = clamp(speed / 58, 0.25, 1.0)`; `body.rotation.x = jolt * 0.16 * Math.exp(-7 * t) * Math.sin(58 * t)` for `t < 0.9 s`. | Close `10 m` hits ring hard; far `70 m` lobs thump softly. |

---

## 7. Feel in the hands (Meta Quest haptics table)

All pulses use `h.source.gamepad.hapticActuators[0].pulse(strength, ms)`. Durations stay `>= 12 ms` so Quest 2/3 LRA motors fire crisply over WebXR; draw-notch pulses use a **`2%` hysteresis deadband** so resting on a notch boundary never chatters.

| Event | Trigger condition | Bow hand (strength, ms) | String hand (strength, ms) | Intended feel |
|---|---|---|---|---|
| **Take / pass bow** | Grip catches bow | `0.30`, `22 ms` | — | Solid wooden grip in palm. |
| **Nock / take string** | `startDraw` catches string | `0.10`, `14 ms` | `0.22`, `18 ms` | Clean tactile catch on the nock. |
| **Draw notches (string)** | Crossing `20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%` draw (`±2%` hysteresis) | — | `0.12 + 0.28 * d` (`0.18 → 0.37`), `14 ms` | Rising string tension under fingers. |
| **Draw limb creak (bow)** | Crossing `40%, 60%, 80%` draw (`±2%` hysteresis) | `0.08 + 0.14 * d` (`0.14 → 0.19`), `12 ms` | — | Subtle limb flex in the bow hand. |
| **Full draw anchor** | First crossing `d >= 0.96` (re-arms at `d < 0.80`) | `0.45`, `24 ms` | `0.78`, `28 ms` | Unmistakable "locked at anchor, sweet-spot open" snap. |
| **Sweet-spot closed** | `1.2 s` after `fullAt`, still holding | `0.14`, `20 ms` | — | Quiet notice the bonus window passed. |
| **Held tension breath** | Every `0.9 s` after `2.0 s` held at full draw | `0.08`, `18 ms` | — | Subtle live-bow tension, non-fatiguing. |
| **Cancel / let down** | Release with `d < 0.15` | — | `0.12`, `15 ms` | Soft string settle, no shot fired. |
| **Loose (normal)** | Arrow loosed (`perfect = false`) | `0.35 + 0.50 * power` (`0.43 → 0.85`), `75 ms` | `0.30 + 0.20 * power` (`0.33 → 0.50`), `32 ms` | Deep riser thump + crisp string slip. |
| **Loose (sweet release)** | Arrow loosed (`perfect = true`) | `0.92`, `85 ms` | `0.55`, `38 ms` | Noticeably crisper snap than a late loose. |
| **Hit (standard)** | Arrow strikes target ring, straw, or shade hare/crow | `0.28`, `26 ms` | — | Tactile confirmation timed to impact. |
| **Hit (bullseye / ram / bell)** | `100`-ring bullseye, shade ram banish, or bell ring | `0.55`, `45 ms` | `0.25`, `28 ms` | Celebratory two-hand resonant chime. |
| **Face button / UI press** | Any pad action or VR menu click | `0.25`, `20 ms` (pressing hand) | `0.25`, `20 ms` (pressing hand) | Uniform clean button click. |

*Single-handed VR draw note:* When `quickHand === bowHand`, take the `max` of bow-hand and string-hand pulses on that controller so pulses never stomp each other.

---

## 8. The control map's open questions

Jobs follow **bow hand** and **string hand** (never hardcoded left/right), so left-handed archers get the exact mirror. Menu and Meta buttons remain untouched (reserved by the headset).

### Rulings on the four open questions

| Open question | Ruling | Exact rule |
|---|---|---|
| **1. Accidental stage change on left stick** | **Remove stick stage-changing on the range.** | Disable bow-hand thumbstick axes completely while `range.on` (keep them for walking only when roaming outside the range). Stage choice moves to the VR menu (bow-hand upper) and the dedicated Next Stage button below. |
| **2. Doubled draw-mode control** | **One binding only: String-hand stick click (btn 3)** (plus Settings in the cloth menu). | Remove draw-mode toggle from string-hand upper face button (`B`/`Y`). Players switch two-handed ↔ single-handed rarely, so a deliberate stick click when `!charging` prevents accidental toggles and frees the prime upper face button. |
| **3. Control for "next stage"** | **String-hand upper face button (btn 5: `B` righty / `Y` lefty).** | On the results screen (`range.phase === 'results'`), if the next stage is unlocked (`rangeSigns.next.base.visible`), one press advances to `range.stage + 1` (same as shooting NEXT). During active play it does nothing (no accidental mid-stage skip). |
| **4. Recentring the view** | **Bow-hand stick click (btn 3) — hold `0.6 s`.** | Works anywhere in VR (range, lab, Bell Watch, or roaming). Holding `0.6 s` rotates `rig.rotation.y` so the player's current physical head yaw faces straight down the lane (`YARD.ux, YARD.uz`) and centres horizontal rig offset back on `(YARD.x, YARD.z)` with a `0.35`, `30 ms` buzz and `"View centred"`. Outside the range, a quick tap (`< 0.6 s`) still toggles run on/off. |

*Additional safety polish on Restart (`again`, string-hand lower btn 4):* One press restarts immediately on `results` or in `?lab=1`; during active Trials or Bell Watch play, require a **double-tap within `1.2 s`** (first tap says `"Press again to restart"`) so a stray thumb never wipes a 2-minute Bell Watch run.

### Settled role-based control map (for Step 3)

| Control | Bow hand (`L` righty / `R` lefty) | String hand (`R` righty / `L` lefty) |
|---|---|---|
| **Trigger (btn 0)** | Press VR menu button (or draw in 1-hand mode) | Take string, draw, loose (or press VR menu button) |
| **Grip (btn 1)** | Hold / pass bow; climb | Take / pass bow; climb |
| **Lower face (btn 4)** | `X` / `A` — Next special arrow (when `!charging`) | `A` / `X` — Restart stage (1 tap on results/lab; double-tap in `1.2 s` mid-run) |
| **Upper face (btn 5)** | `Y` / `B` — Open / close VR menu | `B` / `Y` — Next stage (on results when unlocked) |
| **Stick click (btn 3)** | **Hold `0.6 s`: Recentre view** (tap = run when roaming) | **Toggle 2-hand / 1-hand draw** (when `!charging`) |
| **Stick axes** | Walk when roaming (**off on range**) | 30° snap turn (when `!charging`) |

*Test note for Step 3:* `tests/pads.html` currently asserts `PAD_MAP.string = ['again', 'draw']`; update that assertion when binding the settled Step 3 map.

---

## 9. How to judge it in the lab (`?lab=1`)

In Step 4, the developer shoots **v1 (`?lab=1`)** and **v2 (`?lab=1&bow2=1`)** back-to-back in the headset on the 10, 20, and 30 m lab targets (`size = 1.2`, outer diameter `1.63 m`, bullseye radius `12 cm`). A good v2 implementation should hit every target band below:

| Lab readout / test | Today (v1) baseline | **v2 target (pass bar)** | What it proves |
|---|---|---|---|
| **Draw (`%` and `cm`)** | Fixed `52 cm = 100%` (too long for a child, too short for a tall adult) | Hits **`96–100%`** at the player's natural cheek anchor within 3 shots (any reach `42–68 cm`); `< 15%` cancels with **0 arrows loosed**. | Honest, comfortable full draw for every body size; zero misfires. |
| **Speed (`m/s`) at full draw** | `60–62 m/s` (sensitive to ±1 cm anchor drift) | 5 honest full draws read **`62.0 ± 0.0 m/s`**; deliberate `50%` draw reads **`36–39 m/s`**. | Rock-steady full-draw repeatability + meaningful soft-shot range. |
| **Up (`°`) to hit bullseye** | 10 m: `~0.5°`, 20 m: `~1.1°`, 30 m: `~1.6°` | 10 m: **`0.7–0.9°`**, 20 m: **`1.4–1.7°`**, 30 m: **`2.2–2.5°`**. | Direct at 10 m, readable arc by 20–30 m. |
| **Flight time (`s`)** | 10 m: `0.16`, 20 m: `0.32`, 30 m: `0.48` | 10 m: **`0.16`**, 20 m: **`0.33`**, 30 m: **`0.50`**. | Snappy enough for Bell Watch, with visible hang time and drag at range. |
| **Clean release shake (`°`)** | `< 0.8°` | Raw shake **`< 0.8°`**; filtered launch error **`< 0.4°`**. | Clean shots go dead where aimed. |
| **Deliberate trigger pluck test** (jerk hand `4–6 cm` sideways as trigger opens) | Raw shake `> 2.5°`, arrow flies `1.2–2.2 m` wide at 20 m (complete miss) | Raw shake still reports **`> 2.5°`**, **filtered launch error `< 0.6°`** (`< 21 cm` at 20 m — still hits the red rings!). | Trigger-finger jerk is genuinely removed from the shot. |
| **Moving-sweep sanity check** (smoothly pan from 10 m target to 30 m target and loose mid-pan) | Minimal lag | Launches within **`< 0.5°`** of aim at trigger open (`< 18 cm` at 20 m). | Release filter does not lag behind moving hares or crows. |
| **10-shot group at 20 m** (steady shooter in headset) | Occasional 40–80 cm trigger-pluck flyers | Median **`≤ 18 cm` off centre**, **`≥ 7 / 10` inside `25 cm`**, **0 sudden flyers** from trigger release. | Real accuracy gain felt immediately in the headset. |
| **Face buttons & recentre** | `A/B/X/Y` logged on board | Every face button logs its exact Quest label (`A`, `B`, `X`, `Y`); bow-hand stick hold (`0.6 s`) recentres straight down the grey lane; flicking bow stick sideways does **not** change stage. | Hardware button mapping confirmed and zero accidental mid-stage triggers. |

### 3-minute headset test script for Step 4
1. **Confirm hardware buttons (30 s):** In `?lab=1&bow2=1`, press `A`, `B`, `X`, `Y` once each and verify the lab board matches the physical letter on the controller; hold bow-hand stick click (`0.6 s`) while turned 45° sideways and verify the lane snaps cleanly back in front of you.
2. **Reach & speed check (45 s):** Shoot 5 relaxed draws to your natural cheek anchor at the 20 m target. Check that `Draw` settles at `96–100%` and `Speed` locks at `62.0 m/s`. Let go once at `< 15%` draw to confirm clean cancel.
3. **Pluck test (45 s):** Aim dead centre at 20 m and deliberately flick the string controller sideways as you let go of the trigger, first in `?lab=1` (v1), then in `?lab=1&bow2=1` (v2). Compare where the two arrows land.
4. **Arc & feel comparison (60 s):** Shoot 3 arrows each at 10 m, 20 m, and 30 m in v1 vs v2. Check whether the `g = 9.81` arc at 30 m feels more rewarding, whether the draw-notch and full-draw buzzes feel clean without chattering, and whether the sweet-release gold trail reads cleanly off the bow.
