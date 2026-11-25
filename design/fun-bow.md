# The fun bow (`bow3`): mechanics and core engine

Spec for `?bow3=1` (built behind its own switch so the developer can shoot **v1**, **v2**, and **bow3** side by side in `?lab=1` on Quest). Where `bow2` aimed for longbow realism, `bow3` aims for **pure fun, light speed, and hand freedom**: a compact scout bow and dart-sleek arrow that never block your view, never tire your arms, and turn Bell Watch into effortless flow.

Kept from `bow2` because it directly serves fun: the **jerk-free release filter** (analog early-latch + spike-gated lookback), **midpoint flight integration**, and the **settled role-based Quest control map** (including the 25 November rule that the world never moves or rotates under the player in VR).

---

## 1. Size (compact scout bow + sleek arrow)

Today's bow (`1.20 m` tall) and arrow (`0.62 m` long, `18 mm` shaft diameter from radius `0.009`, `6.0 cm × 8.8 cm` broadhead) sit like a medieval spear right in front of the headset. Shrinking the bow by 40% to a **`0.72 m` scout recurve** and slimming the arrow to a **`0.46 m` dart-sleek shaft** (`9 mm` diameter) keeps an unmistakable bow-and-arrow silhouette while giving both hands total freedom in seated or standing play.

*(Note: cylinder sizes in `src/game.js` take **radius**, not diameter; both are listed below so there is no ambiguity.)*

| Part | Today (`v1`/`v2`) | **`bow3` (fun bow)** | Reason |
|---|---|---|---|
| **Bow total height (tip to tip)** | `1.20 m` (`±0.60 m`) | **`0.72 m` (`±0.36 m`)** | Compact horse/scout bow; clears lap, chair, and peripheral view; whips smoothly between shades. |
| **Riser** | `0.42 m` (`±0.21 m`), `r = 0.024 m` | **`0.24 m` (`±0.12 m`), `r = 0.015 m`** (`3.0 cm` thick) | Natural hand grip (`leather wrap r = 0.019 m`, `palm swell r = 0.020 m`). |
| **Each limb (above/below riser)** | `0.39 m` (`0.21` + `0.18`), `r = 0.018 m`, brace `0.15 m` | **`0.24 m` (`0.13` + `0.11`), `r = 0.011 m`, brace `0.11 m`** | Slim, whippy limbs; string rests `10 cm` behind grip (`z = +0.10 m`). |
| **Arrow rest offset from grip** | `REST = 0.045 m`, `restX = ±0.035 m` | **`REST = 0.032 m`, `restX = ±0.024 m`** | Sits tight beside the index knuckle so aiming feels like pointing your hand. |
| **Arrow shaft** | `0.62 m` long, `r = 0.009 m` (`18 mm` Ø) | **`0.46 m` long, `r = 0.0045 m` (`9 mm` Ø)** | Half as thick as today; overhangs `10 cm` past the rest at full `36 cm` draw — never pokes awkwardly in VR. |
| **Arrowhead (`ConeGeometry`)** | `r = 0.030 m` (`6.0 cm` Ø) × `0.088 m` long | **`r = 0.013 m` (`2.6 cm` Ø) × `0.044 m` long** | Crisp steel dart tip; readable against targets without blocking sightlines. |
| **Fletchings (3 feathers)** | `0.050 × 0.009 × 0.100 m` at `z = 0.57 m` | **`0.028 × 0.004 × 0.062 m` at `z = 0.415 m` (`r_off = 0.012 m`)** | Clean, light feathers; flight readability at `30–70 m` is carried by the slim air ribbon (section 6). |
| **Bow plaque (headset HUD)** | `0.25 × 0.109 m` at `x = ±0.20 m` | **`0.20 × 0.088 m` at `x = ±0.14 m, y = -0.02 m, z = 0.09 m`** | Scales cleanly with the smaller riser without obstructing the lane. |

---

## 2. Draw (short, free, instant snap shots)

**Rule (ship this — fixed compact `36 cm` draw, no size calibration needed, front-loaded speed curve):** Start draw at `10 cm` (`restDraw`) and hit full power at **`36 cm` (`fullDraw`)** — just **`26 cm` of hand travel**. Because `36 cm` sits comfortably in front of the chest for both a short child and a tall adult, **no arm-length calibration is needed** and the string hand never enters Quest's behind-the-ear tracking blind spot. Pulling past `36 cm` stays smoothly clamped at `100%` (zero penalty for over-drawing).

**Snap shots & full draws:** Anything under **`8%` draw** (`< 2 cm` pull from rest) cancels quietly so grip adjustments never misfire. From `8%` upward, a front-loaded `0.72` speed curve lets a quick `10–13 cm` flick shoot fast and flat enough for close Bell Watch hares, while a **`10%` full-draw plateau (`d >= 0.90`, `≥ 33.4 cm`)** locks honest full draws at a rock-steady **`68.0 m/s`**.

**Alternative (also sound):** Fixed `42 cm` full draw (`32 cm` travel) with linear speed `26 → 68 m/s`. Slightly closer to a traditional shortbow, still fits every body size without calibration, but slower to snap-fire in Bell Watch. **Ship the `36 cm` draw and front-loaded curve** for maximum hand freedom and snappy cadence.

```js
// reach = distance from bow grip to smoothed string hand (metres)
const d = clamp((reach - 0.10) / (0.36 - 0.10), 0, 1);
const speed = d < 0.08 ? 0 : 28 + 40 * Math.pow(clamp(d / 0.90, 0, 1), 0.72);
```

| Draw `d` | Hand distance | Travel from rest | **`bow3` speed** | Drop at `20 m` / flight | Role |
|---|---|---|---|---|---|
| `< 8%` | `< 12 cm` | `< 2 cm` | **Cancel (no shot)** | — | Safe let-down / grip adjust. |
| `8%` | `12 cm` | `2 cm` | `35.0 m/s` | `0.96 m` / `0.58 s` | Shortest intentional flick. |
| `25%` | `17 cm` | `7 cm` | `43.9 m/s` | `0.61 m` / `0.46 s` | Quick close hare snap shot (`10–15 m`). |
| `50%` | `23 cm` | `13 cm` | **`54.2 m/s`** | `0.40 m` / `0.37 s` | Fast chest-level snap shot (`15–25 m`). |
| `75%` | `30 cm` | `20 cm` | **`63.1 m/s`** | `0.30 m` / `0.32 s` | Brisk mid-range shot. |
| `90%–100%` | `33–36 cm+` | `23–26 cm+` | **`68.0 m/s` (flat)** | `0.25 m` / `0.30 s` | Full power, `10%` anchor plateau, zero speed jitter. |

---

## 3. Flight (chosen for fun)

**Rule:** Launch faster (`68 m/s` full draw) with lighter, playful gravity (**`g = 5.8 m/s²`**) and whisper-light quadratic air drag (**`k = 0.0010 m⁻¹`**), integrated with the midpoint velocity step. Crosswind stays at `1.4 × wind m/s²`.

Why `v0 = 68, g = 5.8, k = 0.0010`:
- At **10–20 m**, you basically shoot where you look (`6 cm` and `25 cm` aim-above) — immediate joy on the first arrow.
- At **30–45 m**, there is still a clean, readable bow arc (`0.58 m` and `1.31 m` aim-above) so it unmistakably feels like a bow, never a hitscan laser.
- Faster arrival (`0.45 s` at `30 m`, `0.68 s` at `45 m`) makes leading running hares, crossing crows, and the charging ram feel crisp and heroic.

### Full-draw flight: `bow3` beside `v1` and `v2`

| Distance | Aim above target: `v1` | Aim above target: `v2` | **Aim above target: `bow3`** | **`bow3` angle** | **`bow3` flight / arrival `v`** |
|---|---|---|---|---|---|
| **10 m** | `0.09 m` (`0.52°`) | `0.13 m` (`0.74°`) | **`0.06 m`** | **`0.36°`** | **`0.15 s` / `67.3 m/s`** |
| **20 m** | `0.36 m` (`1.04°`) | `0.53 m` (`1.51°`) | **`0.25 m`** | **`0.73°`** | **`0.30 s` / `66.6 m/s`** |
| **30 m** | `0.82 m` (`1.57°`) | `1.21 m` (`2.31°`) | **`0.58 m`** | **`1.10°`** | **`0.45 s` / `66.0 m/s`** |
| **45 m** | `1.85 m` (`2.35°`) | `2.80 m` (`3.56°`) | **`1.31 m`** | **`1.67°`** | **`0.68 s` / `65.0 m/s`** |
| **70 m** *(extra)* | `4.48 m` (`3.66°`) | `7.13 m` (`5.81°`) | **`3.23 m`** | **`2.64°`** | **`1.07 s` / `63.4 m/s`** |

### Release stages & Bell Watch compatibility
- **All 17 release stages:** **All 17 play cleanly with zero target or wind changes.** `#3 The drop` (`30 m`, `0.58 m` drop) and `#4 Three ranges` (`15/30/45 m`, `0.14 / 0.58 / 1.31 m` drop) still clearly teach elevation; `#7 Crosswind` (`30 m`, wind `-5`) drifts `0.70 m` (vs `0.82 m` in v1) — still clearly requires aiming into the wind; all pop-up, sliding, and shade stages feel snappier.
- **Bell Watch (`11–34 m`):** Practice Bell (`22 m`) arrives in `0.33 s`; Shade Ram (`34 m`) arrives in `0.51 s` with `0.75 m` drop (`1.25°` up) — crisp and effortless.
- **Extra long stages (`#5`–`#20`, `40–70 m`):** All play cleanly as-is (no wind blow-off on `#20 Master of the line` either!).

---

## 4. Forgiveness (heroic hits, never plays itself)

**Rule (ship this — bounded one-shot launch grace on shades & bell, zero magnetism on ring targets & lab):** Never bend an arrow mid-flight and never pull ring-target shots into the bullseye. Instead:
1. **Ring targets (Trials & Lab):** **Zero aim magnetism.** Only add a tiny **`+4 cm` outer-rim graze** (`r_eff = r < 0.68 ? r : max(0, r - 0.04 / t.scale)`) so a hairline outer miss still counts as a `20`-ring hit without ever faking a `100` bullseye.
2. **Shades & Practice Bell (Bell Watch & Shade Trials, OFF in `?lab=1`):**
   - **Invisible hit margin:** Scale shade hit spheres by **`1.12×`** (`+12%`, about `+3–4 cm` around a hare).
   - **One-shot launch grace (computed once in `loose()`, zero mid-air homing):** Project the player's true ballistic trajectory (`t = d / v_horiz`, `y_pred = y0 + vy*t - 0.5*g*t²`). If it passes within **`0.40 m`** of a live shade's centre (or **`0.30 m`** of the bell) AND within **`1.4°`** of the launch vector, nudge the initial launch direction **`40%`** of the way toward the exact intercept (hard-capped at **`0.8°`** actual deflection!).
   - **Hard anti-auto-aim guarantee:** A shot `> 0.40 m` or `> 1.4°` off gets **0% assist** and misses cleanly. A shot `18 cm` off a bounding hare gets a subtle `7 cm` (`0.2°`) nudge onto the hare while flying a 100% straight, natural ballistic arc.

**Alternative (also sound, purist):** Zero launch nudge — only `1.18×` shade hit spheres and `+4 cm` target rim graze. Simpler (no intercept check in `loose()`), though slightly harsher on fast crossing crows. **Ship the bounded one-shot launch grace** (`40%` blend, `≤ 0.8°` max deflection, off on ring targets & lab) because it makes rapid Bell Watch shots feel heroic while keeping honest misses honest.

---

## 5. Pace (effortless rapid-fire rhythm)

| Parameter | Today (`v1`/`v2`) | **`bow3`** | Reason |
|---|---|---|---|
| **Auto-nock delay** | `0.30 s` invisible, rises until `0.55 s` | **`0.08 s` appear, ready at `0.18 s`** | Next arrow is already waiting on the string by the time your hand returns. |
| **Shot-to-shot cooldown** | None (gated only by hand travel) | **`0.18 s`** (`~5.5/s` ceiling) | Stops accidental trigger double-fires while allowing effortless `2–3` rapid snap shots/sec in Bell Watch. |
| **String catch radius** | `0.33 m` | **`0.35 m`** | Forgiving grab around the nock without needing to look at your hand. |
| **Buffered trigger catch** | Trigger pressed during reload is ignored | **Grace buffer `0.10 s`**: if trigger is pressed inside the last `100 ms` of cooldown near the string, catch immediately when ready | Eliminates frustrating "dead clicks" during rapid fire. |
| **Desktop & 1-hand VR auto-draw** | `0.85 s` ease-out | **`0.45 s` ease-out** (`1 - (1-u)²`) | Matches the nimble two-handed pace on desktop and single-handed VR. |

---

## 6. Feel (light, taut, snappy)

- **Keep from `bow2`:** Jerk-free release filter (`analog 0.80` early-latch + `45 °/s` spike-gated lookback + `100 ms` peak power latch); generous **`1.5 s` sweet-spot window** (`d >= 0.90`, re-arms at `d < 0.70`, zero aim penalty or forced release ever, `±1.5 mm` visual-only string hum after `2.0 s`).
- **Tuned sound (nimble scout bow, ~35% crisper pitch than v1's heavy longbow):**
  - **Draw catch:** short crisp wood/string tap (`note(320 → 440 Hz, 0.05 s, sine, 0.03)`).
  - **Loose:** taut whip-snap (`note(290 → 115 Hz, 0.08 s, triangle, 0.09)` + `note(135 → 95 Hz, 0.18 s, sawtooth, 0.025 * power)` + crisp fletching air-whip `thump(1400 Hz, 0.08 s, 0.11)`).
  - **Sweet release:** keeps the bright chime (`1320 → 1760 Hz`).
- **Tuned haptics (lighter & snappier for 100+ shots in Bell Watch; `bowBuzz` merges pulses in 1-hand mode):**
  - **Nock:** String `0.20 / 16 ms`, Bow `0.08 / 12 ms`.
  - **Draw notches (3 crisp notches on the short `26 cm` pull, `2%` downward hysteresis):** At `25%, 50%, 75%` → String `0.14, 0.22, 0.30` (`12 ms`); at `50%` → Bow `0.12` (`12 ms`).
  - **Full draw (`d >= 0.90`):** String `0.68 / 24 ms`, Bow `0.38 / 20 ms`.
  - **Sweet-spot closed (`1.5 s`):** Bow `0.12 / 18 ms`. **Tension breath (`> 2.0 s`, every `0.9 s`):** Bow `0.07 / 16 ms`.
  - **Cancel (`d < 0.08`):** String `0.10 / 12 ms`.
  - **Loose (normal):** Bow `0.28 + 0.45 * power` (`55 ms`), String `0.24 + 0.20 * power` (`26 ms`).
  - **Loose (sweet):** Bow `0.82 / 65 ms`, String `0.45 / 30 ms`.
  - **Hit (standard):** Bow `0.24 / 22 ms`. **Hit (bullseye / shade ram / bell):** Bow `0.50 / 40 ms` + off-hand `0.24 / 24 ms`.
- **Flight looks (looks only, zero physics effect):**
  - **Short-shaft paradox shimmer:** `ampYaw = (0.04 + 0.055 * power) * exp(-10 * life)` (`5.5°` peak, settles by `0.18 s`) at `52 rad/s`; pitch `0.3 × ampYaw` at `39 rad/s`; crisp spin `14 + speed * 0.3 rad/s`.
  - **Slim, readable air ribbon (`streak`):** `0.016 m` wide, length `clamp((speed - 18) * 0.036, 0.20, 1.8) * min(1, life / 0.04)`; cream `#FFFAE8` (`0.50` opacity) normal, warm gold `#FFE9A8` (`0.80` opacity, `1.3×` width) on sweet release; fades `1.2 → 1.7 s`.
  - **Impact quiver:** `jolt = clamp(speed / 62, 0.25, 1.0)`, `jolt * 0.13 * exp(-8 * t) * sin(64 * t)` for `0.7 s`.

---

## 7. Hands (true hand freedom + settled controls)

With a `0.72 m` bow and `26 cm` draw travel, **both hands are completely free of formal archery posture**:

| Freedom | Rule | Why |
|---|---|---|
| **Any bow cant (360° roll)** | `bow.quaternion` preserves exact bow-hand wrist roll (`lean`) while aligning the riser axis to `dir`. Vertical, `45°` canted, horizontal flat, or inverted all aim identically. | Natural wrist angle without fighting the player. |
| **Any draw height / across the body** | No cheek anchor required; hip shots, chest-level rapid fire, overhead shots, and cross-body swings all reach `100%` power at `36 cm` inside Quest's front camera cone. | Zero tracking occlusion; effortless seated or standing play. |
| **Free-pointing bow hand when idle** | When `!charging`, the light bow tracks `bowHand` 1:1 like a pointer (and aims 1-hand quick shots + VR menu rays). | Quick snap switching between targets and menu. |
| **Instant hand swap** | Grip on the free hand within `0.42 m` of the bow passes it immediately (`0.25 / 18 ms` buzz); all role-based buttons mirror on the same frame. | True ambidextrous freedom. |
| **World orientation lock (25 Nov rule)** | **Zero** camera/rig rotation, FOV zoom, or replay teleport in VR. Range entry aligns to real `headYaw()`. Snap-turn is off on the range. Only an explicit `0.6 s` bow-hand stick hold (`!charging`) calls `recentre()`. | Guaranteed comfort during fast hand movement. |

**Controller map:** Keep the exact settled role-based map from `design/arrow-mechanics-v2.md` section 8 (already passing `tests/pads.html`):
- **Bow hand:** Trigger = menu press (or 1-hand draw); Grip = take/pass bow; Lower (`X`/`A`) = next special arrow; Upper (`Y`/`B`) = VR menu; Stick hold `0.6 s` (`!charging`) = recentre; Stick axes = off on range (roam walk only).
- **String hand:** Trigger = take string, draw, loose (or menu press); Grip = take/pass bow; Lower (`A`/`X`) = restart (1 tap on results/lab, double-tap within `1.2 s` mid-run); Upper (`B`/`Y`) = next stage on results; Stick click (`!charging`) = toggle 2-hand / 1-hand draw; Stick axes = off on range (roam 30° snap-turn only).

---

## 8. The Core Engine (`BOW3` — one loop, one table)

### Execution loop (from taking the bow to landing)
1. **Pose (`vrPose`):** Place `bow` on `bowHand.hold`; zero writes to `rig` or `camera`. If `!charging`, point `preview` along bow forward; show `preview` once `elapsed - twang >= 0.08 s` (rise finishes at `0.18 s`).
2. **Catch (`startDraw`):** When string hand triggers within `0.35 m` of nock (and `elapsed - twang >= 0.18 s`, or buffered up to `0.10 s`), set `drawHand`, fire nock buzz, clear ring buffer `buf`.
3. **Draw (`vrPose` while `charging`):** Smooth `drawAt` (`exp(-dt * 28)`), compute `d = clamp((reach - 0.10) / 0.26, 0, 1)`, compute `dir = aimVR()`, align only `bow.quaternion` along `dir` keeping wrist `lean`, push `[elapsed, dir, d]` into `220 ms` `buf`, fire `bow3` notches (`25/50/75%`), `90%` full-draw snap, `1.5 s` sweet-spot close, `2.0 s` visual-only string hum (`±1.5 mm`). Poll analog trigger (`>= 0.85` armed → `< 0.80` sets `earlyAt`).
4. **Release (`endDraw` → `bowRelease` → `loose`):** Run spike-gated lookback (`> 45 °/s` over `120 ms` rewinds to `45 ms` pre-spike average; otherwise `45 ms` average) + `100 ms` peak `d` latch. If `d < 0.08`, cancel with `0.10 / 12 ms` buzz. Otherwise compute `speed = 28 + 40 * clamp(d / 0.90, 0, 1)^0.72` and `perfect = !!fullAt && d >= 0.90 && elapsed - fullAt <= 1.5`.
5. **Grace (`loose`, non-lab shades & bell only):** Check live shades (`1.12×` hit margin) and bell; if ballistic line passes within `0.40 m` (`0.30 m` bell) and `≤ 1.4°`, blend launch `dir` `40%` toward intercept, capped at `0.8°`. Spawn world-space arrow in `scene`; fire loose sound + dual-hand haptics; set `twang = elapsed`.
6. **Flight (`stepArrows`):** Each frame update `vel` with quadratic drag (`-0.0010 * |v| * v * dt`), gravity (`-5.8 * dt`), and crosswind (`1.4 * wind * dt`), advance position using midpoint velocity `(v0 + v1) * 0.5 * dt`, sweep raycast against targets/shades/ground, apply looks-only `5.5°` paradox shimmer + spin + speed-linked ribbon (`#FFE9A8` on `perfect`).
7. **Impact (`hit` / `rangeHit`):** Apply `+4 cm` outer-rim graze on ring targets; trigger target/shade reaction, rising streak chime, impact quiver, and dual-hand hit haptics (`off = hands.find(h => h !== bowHand && h.pose)`). Never move or rotate `rig` in VR.

### Master `BOW3` parameter table (zero guesswork)

| Key | Value | Unit | Notes |
|---|---|---|---|
| `bowHeight` | `0.72` | m | Riser `±0.12 m` (`r 0.015`), limbs `0.24 m` each (`r 0.011`), brace `0.11 m`. |
| `restY`, `restX` | `0.032`, `0.024` | m | Arrow rest offset from grip (`restX` signed by `-handSide`). |
| `shaftLen`, `shaftRad` | `0.46`, `0.0045` | m | `46 cm` long, `9 mm` diameter. |
| `tipRad`, `tipLen` | `0.013`, `0.044` | m | `2.6 cm` wide × `4.4 cm` long cone head. |
| `fletch` | `[0.028, 0.004, 0.062]` | m | 3 feathers at `z = 0.415 m`, radial offset `0.012 m`. |
| `restDraw`, `fullDraw` | `0.10`, `0.36` | m | Fixed `26 cm` pull travel; no eye-height calibration. |
| `minLoose` | `0.08` | `0..1` | Below `8%` (`< 2 cm` pull) cancels cleanly. |
| `fullAt`, `rearm` | `0.90`, `0.70` | `0..1` | `10%` full-power plateau (`≥ 33.4 cm`). |
| `vMin`, `vMax`, `curveExp` | `28`, `68`, `0.72` | m/s, — | `vMin + (vMax - vMin) * clamp(d / fullAt, 0, 1)^curveExp`. |
| `g`, `drag`, `windK` | `5.8`, `0.0010`, `1.4` | m/s², m⁻¹, m/s² | Midpoint integration; crosswind push unchanged. |
| `sweet`, `breathAfter`, `breathEvery` | `1.5`, `2.0`, `0.9` | s | Sweet-spot window; visual-only `±1.5 mm` string hum after `2.0 s`. |
| `nockShow`, `nockReady`, `cooldown`, `catchBuf` | `0.08`, `0.18`, `0.18`, `0.10` | s | Rapid auto-nock + buffered trigger catch. |
| `catchRad`, `oneHandSec` | `0.35`, `0.45` | m, s | Generous string grab; nimble 1-hand/desktop draw ramp. |
| `earlyArm`, `earlyCut`, `earlyCap` | `0.85`, `0.80`, `0.08` | `0..1`, s | Analog trigger early-latch (kept from v2). |
| `spikeDegS`, `spikeWin`, `smoothWin`, `powWin` | `45`, `0.12`, `0.045`, `0.10` | °/s, s | Spike-gated release filter (kept from v2). |
| `graceRad`, `graceBell`, `graceCone`, `graceBlend`, `graceCap` | `0.40`, `0.30`, `1.4`, `0.40`, `0.8` | m, m, °, —, ° | One-shot launch nudge on shades/bell only (**off on targets & lab**). |
| `shadePad`, `rimGraze` | `1.12`, `0.04` | ×, m | `+12%` shade hit sphere; `+4 cm` outer-rim target graze only. |
| `notches`, `notchHyst` | `[0.25, 0.50, 0.75]`, `0.02` | `0..1` | 3 clean draw ticks + `2%` downward hysteresis. |
| `paradoxAmp`, `paradoxDecay`, `paradoxFreq` | `[0.04, 0.055]`, `10`, `52` | rad, s⁻¹, rad/s | Looks-only short-shaft shimmer (`5.5°` peak at full draw). |
| `ribbonW`, `ribbonMax` | `0.016`, `1.8` | m | Slim trail; gold `#FFE9A8` (`0.80` opacity, `1.3×` wide) on sweet release. |

---

## 9. How to judge it in the lab (`?lab=1&bow3=1`)

Compare `?lab=1` (**v1**), `?lab=1&bow2=1` (**v2**), and `?lab=1&bow3=1` (**bow3**) back-to-back in the headset:

| Check / lab readout | `v1` (baseline) | `v2` (realistic) | **`bow3` pass bar (fun bow)** |
|---|---|---|---|
| **Visual size in hand** | Large `1.20 m` bow, bulky `6 cm` arrowhead | Same large bow/arrow | Compact `0.72 m` bow clears view; `46 cm` dart arrow feels crisp and light, never spear-like. |
| **Draw (`%` / `cm`)** | `52 cm` full | `44–68 cm` full (cheek anchor) | **`33–36 cm` reads `90–100%`** right in front of chest; works tilted `45°`, flat, or at the hip with zero headset bumps. |
| **Full-draw speed (`m/s`)** | `60–62` | `62.0 ± 0.0` | **`68.0 ± 0.0 m/s`** on 5 consecutive relaxed draws. |
| **Snap-shot speed (`~50%` / `23 cm`)** | `43 m/s` (`32 cm` pull) | `37.5 m/s` (`35 cm` pull) | **`52–56 m/s`** on a quick `13 cm` chest flick — hits the `20 m` target crisply. |
| **Up (`°`) & flight (`s`)** | 10 m `0.5° / 0.16 s`<br>20 m `1.1° / 0.32 s`<br>30 m `1.6° / 0.48 s` | 10 m `0.7° / 0.16 s`<br>20 m `1.5° / 0.33 s`<br>30 m `2.3° / 0.50 s` | 10 m **`0.3–0.5° / 0.15 s`**<br>20 m **`0.7–0.9° / 0.30 s`**<br>30 m **`1.0–1.3° / 0.45 s`** |
| **Pluck rejection (`Shake` / `sent`)** | `> 2.5°` / flies wide | Raw `> 2.5°` / `sent < 0.6°` | Raw **`> 2.5°`** / **`sent < 0.6°`** (keeps v2's clean release). |
| **Rapid-fire pace (10 s burst at 20 m)** | ~10–12 shots (feels slow to reload) | ~8–10 shots (long cheek pull) | **`18–25` controlled snap shots in 10 s** with **0 dead clicks** and **0 accidental `< 8%` misfires**. |
| **World stability** | — | Locked (25 Nov fix) | **Zero** FOV change, camera kick, or world rotation across rapid fire, canted holds, and hits. |

### Quick 2-minute headset verdict test
1. **Hand freedom (30 s):** Hold the `bow3` bow at `45°` cant and flat horizontal; shoot 3 arrows at `20 m` from chest height without raising your hand to your cheek. It should feel nimble, unobstructed, and completely natural.
2. **Rapid snap rhythm (30 s):** Fire 15 quick half-draw snap shots across `10 → 20 → 30 m` as fast as you comfortably can. Verify the arrow is always waiting on the string, never drops a click, and hits `20 m` without high lobbing.
3. **Full-draw & arc feel (30 s):** Shoot 3 full draws (`36 cm`) at `30 m`. Verify `Speed 68.0 m/s`, `Up ~1.1°`, clean crisp snap sound/haptics, and a visible graceful arc without feeling like a laser.
4. **Bell Watch feel (`?watch=1&bow3=1`, 30 s):** Play 30 seconds of Bell Watch — verify rapid-firing bounding hares, crossing crows, and the `34 m` ram feels noticeably more playful and less tiring than `v1` and `v2`.
