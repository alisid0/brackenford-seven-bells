# VR Controls and Bow-Angle Simulation

Simulation run via `tests/angles.html` against the built `Brackenford-Seven-Bells.html` (commit `8281127`, no game code modified) in `?lab=1` across all three bows:

- **`v1`** (`?lab=1&bow2=0&bow3=0`): full draw `52.0 cm` (rest `12.0 cm`), `vMax = 62 m/s`, `g = 7`, `drag = 0`, `catch = 33 cm`.
- **`bow2`** (`?lab=1&bow2=1&bow3=0`): standing eye height `1.65 m` → auto full draw `56.9 cm` (rest `12.0 cm`), `vMax = 62 m/s`, `g = 9.81`, `drag = 0.0025`, `catch = 33 cm`.
- **`bow3`** (`?lab=1&bow3=1`, fun bow): fixed full draw `36.0 cm` (rest `10.0 cm`), `vMax = 68 m/s`, `g = 5.8`, `drag = 0.001`, `catch = 35 cm`.

All checks pass with zero runtime errors (`ranAllThree`, `baselinesHit`, `leftHandWorks`, `catchMatchesRadius`, `noErrors`).

## Simulation setup and sign conventions

- Simulated controllers (`v.fake.on = true`, `v.hands[i].source`, `grip.position`, `grip.quaternion`) drive real `selectstart` / `selectend` draws, `v.tick(1/60)` physics, and arrow flights.
- `v.rig.rotation.y` is set to `v.look.yaw` (matching `initXR` in `src/game.js:2555`) so the rig faces straight down the range lane.
- Bow hand sits at `(-0.15, 1.45, -0.55)` m for a right-handed archer (`(+0.15, 1.45, -0.55)` m left-handed), `19.45 m` from the `20 m` target (which the lab rounds to `Hit at 19 m`).
- Baseline (`0°` cant) draws straight back along the ballistic sightline from the upright arrow rest to the `20 m` bullseye, hitting `0–1 cm off centre` (`Side = 0.00°`) on all three bows.
- **Signs:** `+roll` tilts the top limb left (`-X`); `-roll` tilts the top limb right (`+X`, natural horse-bow flat hold for a right-hander). `+pitch` points the bow nose up; `+yaw` turns the bow nose left. `Up (°)` and `Side (°)` are launch angles relative to the straight line from arrow launch origin to the `20 m` target centre (`+Side` = right, `-Side` = left). `vs Rest (°)` is launch direction minus the geometric line from string hand through the live arrow rest.

---

## Executive findings (in plain words)

### 1. Does cant aim identically as `design/fun-bow.md` §7 requires? **No — canting breaks aim on all three bows.**

`design/fun-bow.md` §7 states that holding the bow upright, canted `30–45°`, or flat (`90°`) should aim identically. **In the current code, it does not.**

- Even a mild **`±15°` cant** shifts aim by **`1.4°–1.7°`** (`52–58 cm` off centre at `19 m`).
- At **`±30°` cant**, every bow **misses the `20 m` target completely** (`1.04–1.15 m` wide).
- At **`+90°` (flat, top limb left)**, the arrow plunges **`-6.9°` to `-8.5°` into the ground at `10–12 m`** (`3.04–3.11 m` short of the target).
- At **`-90°` (flat, top limb right)**, the arrow sails **`+8.3°` to `+9.2°` wide right** (missing by `1.61–1.93 m`, landing `39–43 m` downrange).
- **`bow3` is slightly worse in degrees than `v1`/`bow2`** (`-8.45°` / `+9.15°` vs `-6.86°` / `+8.33°` on `bow2`): although `bow3`'s rest offset is smaller (`(-2.4, +3.2) cm` vs `(-3.5, +4.5) cm`), its shorter draw (`36 cm` vs `56.9 cm`) gives a larger angular lever (`atan(restOffset / draw)`).

**Root cause (`src/game.js:2441`):**
`aimVR()` computes `bow.localToWorld(V(restX(), REST, 0)).sub(drawAt).normalize()`. Because `(restX(), REST, 0)` is an off-axis point fixed in the **bow's local frame** (`5.7 cm` from the grip axis on `v1`/`bow2`, `4.0 cm` on `bow3`), rolling the bow `±90°` swings the rest along a circular arc up to **`8.1 cm`** (`v1`/`bow2`) or **`5.7 cm`** (`bow3`) away from its upright position:

- At `+90°` (right-handed), local `-x` (`-3.5 cm`) rotates to `-y` (down) while local `+y` (`+4.5 cm`) rotates to `-x` (left) → rest drops `8.0 cm` (`5.6 cm` on `bow3`) and shifts left → arrow dives into the turf.
- At `-90°` (right-handed), local `+y` rotates to `+x` (right) and local `-x` rotates to `+y` (up) → rest swings `8.0 cm` right (`5.6 cm` on `bow3`) → arrow flies `8–9°` right.

### 2. Which angles and hand positions feel natural and work today

- **Upright (`0°` cant) with pure bow-hand yaw (`±20°`, `±45°`):** **100% invariant (`0.00°` shift, `0–1 cm` bullseye)** on all three bows. `steady.lookAt` aligns the bow along the arrow without introducing roll, so turning your bow wrist sideways does not pull the shot.
- **Upright (`0°` cant) with pure bow-hand pitch (`±20°`, `±45°`):** **Nearly invariant (`±0.05°`, `1–3 cm` off centre)** up to `~±71°`.
- **String-hand draw positions (Case 3 — straight, hip, above eye, across body, bow-hand side):** All three bows reach `100%` draw cleanly and loose strictly along the string-hand-to-rest line (`vs Rest = 0.00°` in every position). Pulling from the hip launches a `41–42°` high arc (`232–450 m`); pulling above the eye drives into the turf `3 m` ahead (`-26°`); pulling across the body or from the bow-hand side steers the arrow cleanly left (`-37°`) or right (`+29°`).
- **Near-full and over-draw (Case 4 — `90, 100, 110, 130%`):** Clean clamp at `100%` draw above full reach with no aim shift or speed overshoot. On `bow3`, the `90%` plateau already hits full `68 m/s` and dead-centre `0 cm` at all four distances (`90%–130%`). On `v1` (`58.2 m/s` at `90%`) and `bow2` (`58.6 m/s` at `90%`), `90%` drops only `5–6 cm` low at `19 m`.
- **Release jerks and 1-frame `10 cm` tracking jumps (Cases 5 & 8) on `bow2` and `bow3`:**
  - `v1` fails completely: a `+6 cm` string jerk pulls `-5.65°` (`1.90 m` miss), a `+6 cm` bow jerk pulls `+6.79°` (hits the `29 m` lane target instead!), and a 1-frame `10 cm` bow jump on release throws the shot `+11.19°` (`2.80 m` miss).
  - **`bow2` and `bow3` cancel 100% of angular shake (`Sent err = 0.00°`)** for both `3 cm` and `6 cm` jerks and 1-frame `10 cm` tracking jumps on **both** the string hand and the bow hand — even on `bow3`'s short `36 cm` draw where a `10 cm` bow jump produces a `15.42°` raw spike!
- **Left-handed archer (Case 6):** Mirrors right-handed behaviour identically to the hundredth of a degree with flipped horizontal signs (`LH 0°` = `0–1 cm` bullseye; `LH +45°/-45°/+90°/-90°` mirror `RH -45°/+45°/-90°/+90°` exactly; `LH hip` and `LH across body` mirror `RH` cleanly).
- **String catch at every cant (Case 7):** Around the rotated nock itself, the catch sphere is exact at every cant (`33.0 cm` on `v1`/`bow2`, `35.0 cm` on `bow3`). Relative to upright (`0°`) nock muscle memory, canting `±90°` shifts the nock by `8.1 cm` (`v1`/`bow2`) or `5.7 cm` (`bow3`), leaving at least `25.0 cm` (`v1`/`bow2`) and `29.3 cm` (`bow3`) of catch reach even on the worst far side (`-90°` left). No cant fails to catch the string.

### 3. Surprising failures and subtle edge cases uncovered

1. **Bow-hand pitch collapse past `~72°` (Case 2, `+75°` and `+85°`):**
   - In `src/game.js:2518`, `vrPose()` guards `steady.lookAt(ZERO, dir, lean)` with `if (Math.abs(lean.dot(dir)) < 0.95)`.
   - Once pitch exceeds `acos(0.95) ≈ 71.8°`, alignment turns off abruptly: the bow stays tilted up `75–85°`, swinging `(restX(), REST, 0)` down and back, dropping the arrow **`-3.6°` to `-5.1°` into the turf** (`1.22–1.98 m` miss at `19 m`).
2. **Compound bow-hand pitch + yaw induces unwanted cant (Case 2, `+30° / ±30°`):**
   - Pure pitch (`+45°`) and pure yaw (`±45°`) both hit `0–3 cm` off centre, yet combining `pitch +30°` with `yaw ±30°` pulls the shot **`1.2°–1.7°` off line (`56–66 cm` off centre)**!
   - Why: pitching and yawing together tilts the bow's local `+Y` (`lean`) sideways relative to `dir`. When `steady.lookAt` uses `lean` as the up-vector, it rolls the bow `~16°`, which rotates the off-axis rest and triggers the same cant bug.
3. **Bow-hand jerk/jump spawn-origin shift on `bow2` and `bow3` (Cases 5 & 8):**
   - `bowRelease()` preserves `dir` perfectly (`Sent err = 0.00°`), **but `endDraw()` (`src/game.js:2400`) still passes live `preview.position` as the arrow's launch origin**.
   - A `6 cm` bow-hand jerk shifts the arrow's launch position `6 cm` right (`6–7 cm` off centre at `19 m`); a `10 cm` 1-frame bow jump shifts it `10 cm` right (`11–12 cm` off centre). Small compared with `v1`'s `2.80 m` miss, and trivial to fix by buffering `origin` alongside `dir`.
4. **Accidental shot on fast cancel in `bow2` and `bow3` (discovered while building Case 7):**
   - If a player decides to abort a drawn shot by moving their string hand quickly back to the bow grip and releasing within `~0.12–0.18 s`, the fast return exceeds `bowRelease()`'s `45°/s` spike threshold (`src/game.js:2047`).
   - `bowRelease()` rolls `end` back to before the return and grabs the peak `power` from `[spike - 0.10, spike]`, **loosing a full-power arrow even though live `charge` is `0%` (`< BOW.minLoose`)**.

---

## What cannot be simulated with fake controllers

Fake controllers set exact world-space poses and digital trigger events each frame; they **cannot** test:

- **Physical trigger feel and analog ramp timing:** how a real finger eases off a Meta Quest Touch Plus trigger spring, how often the `0.85 → 0.80` early-latch (`bow2.earlyAt`) fires early vs late, and whether trigger stiffness induces involuntary wrist roll.
- **Quest inside-out optical tracking occlusion:** string-hand tracking loss or drift when anchored tight to the cheek/jaw, pulled behind the ear, drawn from the hip below camera FOV, or when the bow controller occludes the string controller.
- **Wrist ergonomics and physical collisions:** how comfortable a `45°` or `90°` cant feels in a real wrist, whether the controller rings bump the headset during a cheek anchor, and whether `bow3`'s `36 cm` short draw encourages natural shooting posture.
- **Stereo depth perception and visual sighting:** how natural the visual offset between the canted arrow rest and the true flight ray looks to two eyes in a headset.

---

## Concrete fixes (rules and numbers for Claude)

### Fix 1 — Cant-invariant aim pivot (`aimVR`, `src/game.js:2441`)

Decouple the physics aim line from the bow's roll/pitch by aiming through a **non-rotating point** above the bow grip instead of the bow-local rotated rest:

- **Rule:** Replace `bow.localToWorld(V(restX(), REST, 0))` in `aimVR()` with a world-up offset from the grip centre:
  ```js
  function aimVR(){
   return bow.position.clone().add(V(0, REST, 0)).sub(drawAt).normalize();
  }
  ```
- **Why `(0, REST, 0)` (world-up) instead of `(0, 0, 0)`:** Keeps upright (`0°` cant) vertical elevation identical to today (`+3.2 cm` on `bow3`, `+4.5 cm` on `v1`/`bow2`), removes the horizontal `restX()` lateral offset from the aim calculation (`0.00°` shift on right-hand vs left-hand), and makes **every cant from `0°` to `±90°` (flat) and every bow-hand pitch/yaw produce `0.00°` aim error**.
- **Visual arrow alignment:** Keep the nocked `preview` arrow visually seated on the bow's physical rest in `poseArrow()` (`nockNow` at `drawAt`, shaft aligned to `dir`), or point the visual shaft from `drawAt` through `aimPivot` (at `0°` cant the visual rest offset is only `2.4–3.5 cm`, and on release the arrow flies along `dir` from `aimPivot + (KIT.shaft - reach) * dir` so the player sees zero jump at release).

### Fix 2 — Singularity-free bow alignment (`vrPose`, `src/game.js:2518`)

Replace `steady.lookAt(ZERO, dir, lean)` (which has a hard cutoff at `|lean.dot(dir)| >= 0.95`, i.e. `71.8°` pitch, and injects unintended roll on compound pitch + yaw) with a minimal-rotation swing onto `dir`:

- **Rule:** Rotate the bow's current world quaternion by the shortest-arc quaternion that carries the bow's forward vector `-Z` onto `dir`:
  ```js
  const bowFwd = V(0, 0, -1).applyQuaternion(bow.quaternion);
  if (bowFwd.dot(dir) > -0.999) {
   bow.quaternion.premultiply(new T.Quaternion().setFromUnitVectors(bowFwd, dir));
  } else {
   bow.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI));
  }
  bow.updateMatrixWorld();
  ```
- **Numbers / behaviour:**
  - Pure cant (`0°..±90°`): `bowFwd === dir`, swing is identity, wrist cant is preserved 1:1.
  - Pure pitch (up to `±170°`) and pure yaw (up to `±170°`): zero `71.8°` collapse, zero snapping.
  - Combined with Fix 1, even extreme compound pitch + yaw produces `0.00°` aim shift.

### Fix 3 — Buffer launch origin with aim direction (`vrPose` / `bowRelease` / `endDraw`)

Eliminate the residual `3–12 cm` launch-origin shift when the **bow hand** jerks or has a 1-frame `10 cm` tracking jump on the release frame (`bow2` and `bow3`):

- **Rule:**
  1. In `vrPose()` (`src/game.js:2522`), compute the arrow origin (`const orig = hp.clone().addScaledVector(dir, KIT.shaft)`) and store `[elapsed, dir.clone(), charge, orig]` in `bow2.buf`.
  2. In `bowRelease()` (`src/game.js:2048–2053`), average `s[3]` (`orig`) over the exact same `[end - 0.045, end]` window used for `dir` (falling back to `preview.position`) and return `{dir, power, origin, spike}`.
  3. In `endDraw()` (`src/game.js:2400`), pass `r.origin` instead of live `preview.position` into `loose(r.origin, r.dir, r.power, ...)`.
- **Expected result:** `bow jump 10 cm (release on next frame)` drops from `11–12 cm` off centre to `0–1 cm` off centre on both `bow2` and `bow3`.

### Fix 4 — Guard cancel before `bowRelease()` spike rollback (`endDraw`, `src/game.js:2399–2400`)

Prevent an aborted draw from accidentally firing if the player returns their string hand quickly to the bow:

- **Rule:** In `endDraw()`, right after `vrPose()` and **before** calling `bowRelease()`:
  ```js
  if (charge < BOW.minLoose) {
   if (BOW2) buzz(h, ...HAP.cancel);
   cancel(); drawHand = null; return;
  }
  ```
- **Numbers:** Uses the existing per-bow `BOW.minLoose` (`0.10` v1, `0.15` bow2, `0.08` bow3). Does not affect real releases (where the hand is at drawn reach and only jerks sideways/slightly forward by a few cm, never dropping to `< 8–15%` draw).

### Verification targets once fixed

Re-running `tests/angles.html` after Fixes 1–4 should show:

- **Case 1 (Cant `0°..±90°`):** `sideDeg = 0.00°`, `upDeg` constant within `±0.05°`, `Hit at 19 m · 0–2 cm off centre` at every cant including `±90°` flat on all three bows.
- **Case 2 (Pitch/Yaw including `+75°`, `+85°`, `+30°/±30°`):** `Hit at 19 m · 0–2 cm off centre` on every row.
- **Cases 5 & 8 (`bow2`/`bow3` bow jerk & 1-frame `10 cm` bow jump):** `Hit at 19 m · 0–2 cm off centre` (`Sent err = 0.00°`, `sideDeg = 0.00°`).
- **Fast cancel:** Returning string hand to bow grip in `2–3` frames and releasing always cancels (`shots` unchanged).

---

## Full simulation tables (by bow)

### v1 (full 52 cm, rest 12 cm, vMax 62 m/s, g 7, drag 0, catch 33 cm)

#### Case 1 — Cant (bow-hand roll)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 0° | 100% | 62 | 1.02° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| 15° | 100% | 62 | -0.19° | -1.19° | 0° | Hit at 19 m · 58 cm off centre · flight 0.32 s |
| -15° | 100% | 62 | 1.88° | 1.47° | 0° | Hit at 19 m · 57 cm off centre · flight 0.32 s |
| 30° | 100% | 62 | -1.67° | -2.04° | 0° | Miss · landed 30 m out · passed 1.15 m from a target · flight 0.48 s |
| -30° | 100% | 62 | 2.33° | 3.1° | 0° | Miss · landed 53 m out · passed 1.13 m from a target · flight 0.85 s |
| 45° | 100% | 62 | -3.32° | -2.47° | 0° | Miss · landed 21 m out · passed 1.69 m from a target · flight 0.35 s |
| -45° | 100% | 62 | 2.34° | 4.8° | 0° | Hit at 29 m · 64 cm off centre · flight 0.48 s |
| 60° | 100% | 62 | -5.02° | -2.46° | 0° | Miss · landed 16 m out · passed 2.68 m from a target · flight 0.25 s |
| -60° | 100% | 62 | 1.91° | 6.44° | 0° | Hit at 29 m · 43 cm off centre · flight 0.48 s |
| 90° | 100% | 62 | -8.11° | -1.15° | 0° | Miss · landed 10 m out · passed 3.11 m from a target · flight 0.17 s |
| -90° | 100% | 62 | -0.13° | 9.13° | 0° | Miss · landed 42 m out · passed 1.92 m from a target · flight 0.68 s |

#### Case 2 — Bow-hand pitch and yaw (string hand straight back)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| level 0/0 | 100% | 62 | 1.02° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| pitch +20° (up) | 100% | 62 | 1.04° | 0.02° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| pitch -20° (down) | 100% | 62 | 1.01° | -0.02° | 0° | Hit at 19 m · 2 cm off centre · flight 0.32 s |
| pitch +45° | 100% | 62 | 1.06° | 0.05° | 0° | Hit at 19 m · 2 cm off centre · flight 0.32 s |
| pitch -45° | 100% | 62 | 0.98° | -0.05° | 0° | Hit at 19 m · 3 cm off centre · flight 0.32 s |
| pitch +75° (near align limit) | 100% | 62 | -3.01° | 0.05° | 0° | Miss · landed 22 m out · passed 1.37 m from a target · flight 0.37 s |
| pitch +85° (past align limit) | 100% | 62 | -3.98° | 0.05° | 0° | Miss · landed 18 m out · passed 1.86 m from a target · flight 0.30 s |
| yaw +20° (left) | 100% | 62 | 1.02° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| yaw -20° (right) | 100% | 62 | 1.02° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| yaw +45° | 100% | 62 | 1.02° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| yaw -45° | 100% | 62 | 1.02° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| pitch +30° / yaw +30° | 100% | 62 | 1.97° | 1.69° | 0° | Hit at 19 m · 65 cm off centre · flight 0.32 s |
| pitch +30° / yaw -30° | 100% | 62 | -0.29° | -1.27° | 0° | Hit at 19 m · 63 cm off centre · flight 0.32 s |

#### Case 3 — String-hand draw position

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| straight back | 100% | 62 | 1.02° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| low (hip, -30 cm y) | 100% | 62 | 41.76° | -5.38° | 0° | Miss · landed 450 m out · passed 6.65 m from a target · flight 9.63 s |
| high (above eye, +25 cm y) | 100% | 62 | -26.57° | -5.08° | 0° | Miss · landed 3 m out · passed 7.00 m from a target · flight 0.07 s |
| across body (+25 cm right) | 100% | 62 | 4.65° | -37.59° | 0° | Miss · landed 138 m out · passed 3.48 m from a target · flight 2.23 s |
| bow-hand side (-25 cm left) | 100% | 62 | 4.65° | 28.77° | 0° | Miss · landed 101 m out · passed 7.07 m from a target · flight 1.63 s |

#### Case 4 — Draw distance near and past full

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 90% | 90% | 58.2 | 1.02° | 0° | 0° | Hit at 19 m · 6 cm off centre · flight 0.33 s |
| 100% | 100% | 62 | 1.02° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| 110% | 100% | 62 | 1.02° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| 130% | 100% | 62 | 1.01° | 0° | 0° | Hit at 19 m · 2 cm off centre · flight 0.32 s |

#### Case 5 — Release jerks (last 3 frames before release)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Raw shake (°) | Sent err (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| clean | 100% | 62 | 1.02° | 0° | 0° | 0.01° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| string jerk +3 cm | 99.7% | 61.9 | 1.02° | -2.82° | 2.81° | 2.81° | 2.81° | Miss · landed 45 m out · passed 0.95 m from a target · flight 0.73 s |
| string jerk +6 cm | 99.6% | 61.9 | 1.02° | -5.65° | 5.62° | 5.62° | 5.62° | Miss · landed 45 m out · passed 1.90 m from a target · flight 0.73 s |
| bow jerk +3 cm | 100% | 62 | 1.01° | 3.41° | 3.31° | 3.31° | 3.31° | Miss · landed 45 m out · passed 1.15 m from a target · flight 0.73 s |
| bow jerk +6 cm | 100% | 62 | 1° | 6.79° | 6.57° | 6.58° | 6.57° | Hit at 29 m · 60 cm off centre · flight 0.48 s |

#### Case 6 — Left-handed archer (bow in right hand)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| LH cant 0° | 100% | 62 | 1.02° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |
| LH cant 45° | 100% | 62 | 2.34° | -4.8° | 0° | Miss · landed 53 m out · passed 1.68 m from a target · flight 0.85 s |
| LH cant -45° | 100% | 62 | -3.32° | 2.47° | 0° | Miss · landed 21 m out · passed 1.69 m from a target · flight 0.35 s |
| LH cant 90° | 100% | 62 | -0.13° | -9.13° | 0° | Miss · landed 42 m out · passed 1.53 m from a target · flight 0.68 s |
| LH cant -90° | 100% | 62 | -8.11° | 1.15° | 0° | Miss · landed 10 m out · passed 3.62 m from a target · flight 0.17 s |
| LH low (hip) | 100% | 62 | 41.76° | 5.38° | 0° | Miss · landed 452 m out · passed 7.20 m from a target · flight 9.68 s |
| LH across body (-right) | 100% | 62 | 4.65° | 37.59° | 0° | Miss · landed 100 m out · passed 8.23 m from a target · flight 1.63 s |

#### Case 7 — String catch distance by cant

| Cant | Nock shift vs 0° (cm) | Max catch from rotated nock (cm) | From 0° nock back (cm) | From 0° nock right (cm) | From 0° nock left (cm) |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0° | 0 | 33 | 33 | 33 | 33 |
| 15° | 1.5 | 33 | 33 | 31.9 | 34 |
| -15° | 1.5 | 33 | 33 | 34.2 | 31.7 |
| 30° | 3 | 33 | 32.9 | 31.1 | 34.7 |
| -30° | 3 | 33 | 32.9 | 35.7 | 30.2 |
| 45° | 4.4 | 33 | 32.7 | 30.6 | 34.9 |
| -45° | 4.4 | 33 | 32.7 | 37.2 | 28.8 |
| 60° | 5.7 | 33 | 32.5 | 30.4 | 34.7 |
| -60° | 5.7 | 33 | 32.5 | 38.6 | 27.3 |
| 90° | 8.1 | 33 | 32 | 31 | 33 |
| -90° | 8.1 | 33 | 32 | 41 | 25 |

#### Case 8 — Single-frame 10 cm tracking hiccups

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Raw shake (°) | Sent err (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| string jump 10 cm (release on next frame) | 99.7% | 61.9 | 1.02° | -6.75° | 6.72° | 6.72° | 6.72° | Miss · landed 45 m out · passed 1.78 m from a target · flight 0.73 s |
| string jump 10 cm (recover 5 frames) | 100% | 62 | 1.02° | -0.25° | 0.25° | 3.88° | 0.25° | Hit at 19 m · 9 cm off centre · flight 0.32 s |
| bow jump 10 cm (release on next frame) | 100% | 62 | 0.98° | 11.19° | 10.84° | 10.84° | 10.84° | Miss · landed 54 m out · passed 2.80 m from a target · flight 0.88 s |
| bow jump 10 cm (recover 5 frames) | 100% | 62 | 1.02° | 0° | 0° | 10.84° | 0° | Hit at 19 m · 1 cm off centre · flight 0.32 s |

### bow2 (full 56.9 cm, rest 12 cm, vMax 62 m/s, g 9.81, drag 0.0025, catch 33 cm)

#### Case 1 — Cant (bow-hand roll)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 0° | 100% | 62 | 1.48° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| 15° | 100% | 62 | 0.37° | -1.09° | 0° | Hit at 19 m · 52 cm off centre · flight 0.33 s |
| -15° | 100% | 62 | 2.26° | 1.34° | 0° | Hit at 19 m · 53 cm off centre · flight 0.33 s |
| 30° | 100% | 62 | -0.98° | -1.86° | 0° | Miss · landed 30 m out · passed 1.04 m from a target · flight 0.50 s |
| -30° | 100% | 62 | 2.67° | 2.83° | 0° | Miss · landed 49 m out · passed 1.04 m from a target · flight 0.85 s |
| 45° | 100% | 62 | -2.48° | -2.25° | 0° | Miss · landed 23 m out · passed 1.53 m from a target · flight 0.38 s |
| -45° | 100% | 62 | 2.68° | 4.38° | 0° | Hit at 30 m · 72 cm off centre · flight 0.50 s |
| 60° | 100% | 62 | -4.03° | -2.24° | 0° | Miss · landed 17 m out · passed 2.67 m from a target · flight 0.28 s |
| -60° | 100% | 62 | 2.28° | 5.88° | 0° | Hit at 29 m · 11 cm off centre · flight 0.50 s |
| 90° | 100% | 62 | -6.86° | -1.05° | 0° | Miss · landed 12 m out · passed 3.04 m from a target · flight 0.20 s |
| -90° | 100% | 62 | 0.42° | 8.33° | 0° | Miss · landed 39 m out · passed 1.61 m from a target · flight 0.67 s |

#### Case 2 — Bow-hand pitch and yaw (string hand straight back)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| level 0/0 | 100% | 62 | 1.48° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| pitch +20° (up) | 100% | 62 | 1.49° | 0.02° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| pitch -20° (down) | 100% | 62 | 1.46° | -0.02° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| pitch +45° | 100% | 62 | 1.51° | 0.05° | 0° | Hit at 19 m · 2 cm off centre · flight 0.33 s |
| pitch -45° | 100% | 62 | 1.44° | -0.04° | 0° | Hit at 19 m · 2 cm off centre · flight 0.33 s |
| pitch +75° (near align limit) | 100% | 62 | -2.13° | 0.05° | 0° | Miss · landed 24 m out · passed 1.22 m from a target · flight 0.40 s |
| pitch +85° (past align limit) | 100% | 62 | -3.01° | 0.05° | 0° | Miss · landed 20 m out · passed 1.51 m from a target · flight 0.35 s |
| yaw +20° (left) | 100% | 62 | 1.48° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| yaw -20° (right) | 100% | 62 | 1.48° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| yaw +45° | 100% | 62 | 1.47° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| yaw -45° | 100% | 62 | 1.47° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| pitch +30° / yaw +30° | 100% | 62 | 2.33° | 1.52° | 0° | Hit at 19 m · 59 cm off centre · flight 0.33 s |
| pitch +30° / yaw -30° | 100% | 62 | 0.29° | -1.15° | 0° | Hit at 19 m · 56 cm off centre · flight 0.33 s |

#### Case 3 — String-hand draw position

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| straight back | 100% | 62 | 1.48° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| low (hip, -30 cm y) | 100% | 62 | 41.21° | -4.96° | 0° | Miss · landed 232 m out · passed 6.59 m from a target · flight 7.10 s |
| high (above eye, +25 cm y) | 100% | 62 | -26.92° | -4.67° | 0° | Miss · landed 3 m out · passed 7.07 m from a target · flight 0.07 s |
| across body (+25 cm right) | 100% | 62 | 4.2° | -37.16° | 0° | Miss · landed 93 m out · passed 3.41 m from a target · flight 1.70 s |
| bow-hand side (-25 cm left) | 100% | 62 | 4.2° | 29.03° | 0° | Miss · landed 75 m out · passed 7.11 m from a target · flight 1.33 s |

#### Case 4 — Draw distance near and past full

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 90% | 90% | 58.6 | 1.48° | 0° | 0° | Hit at 19 m · 5 cm off centre · flight 0.35 s |
| 100% | 100% | 62 | 1.48° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| 110% | 100% | 62 | 1.47° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.33 s |
| 130% | 100% | 62 | 1.47° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.33 s |

#### Case 5 — Release jerks (last 3 frames before release)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Raw shake (°) | Sent err (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| clean | 100% | 62 | 1.48° | 0° | 0° | 0.01° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| string jerk +3 cm | 100% | 62 | 1.48° | -0.01° | 0° | 2.56° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| string jerk +6 cm | 100% | 62 | 1.48° | -0.01° | 0° | 5.12° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| bow jerk +3 cm | 100% | 62 | 1.48° | 0.1° | 0° | 3.02° | 0° | Hit at 19 m · 3 cm off centre · flight 0.33 s |
| bow jerk +6 cm | 100% | 62 | 1.48° | 0.19° | 0° | 6.01° | 0° | Hit at 19 m · 6 cm off centre · flight 0.33 s |

#### Case 6 — Left-handed archer (bow in right hand)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| LH cant 0° | 100% | 62 | 1.48° | 0° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| LH cant 45° | 100% | 62 | 2.68° | -4.38° | 0° | Miss · landed 49 m out · passed 1.54 m from a target · flight 0.85 s |
| LH cant -45° | 100% | 62 | -2.48° | 2.25° | 0° | Miss · landed 23 m out · passed 1.53 m from a target · flight 0.38 s |
| LH cant 90° | 100% | 62 | 0.42° | -8.33° | 0° | Miss · landed 39 m out · passed 1.66 m from a target · flight 0.67 s |
| LH cant -90° | 100% | 62 | -6.86° | 1.05° | 0° | Miss · landed 12 m out · passed 3.53 m from a target · flight 0.20 s |
| LH low (hip) | 100% | 62 | 41.21° | 4.96° | 0° | Miss · landed 232 m out · passed 7.12 m from a target · flight 7.08 s |
| LH across body (-right) | 100% | 62 | 4.2° | 37.16° | 0° | Miss · landed 80 m out · passed 8.20 m from a target · flight 1.43 s |

#### Case 7 — String catch distance by cant

| Cant | Nock shift vs 0° (cm) | Max catch from rotated nock (cm) | From 0° nock back (cm) | From 0° nock right (cm) | From 0° nock left (cm) |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0° | 0 | 33 | 33 | 33 | 33 |
| 15° | 1.5 | 33 | 33 | 31.9 | 34 |
| -15° | 1.5 | 33 | 33 | 34.2 | 31.7 |
| 30° | 3 | 33 | 32.9 | 31.1 | 34.7 |
| -30° | 3 | 33 | 32.9 | 35.7 | 30.2 |
| 45° | 4.4 | 33 | 32.7 | 30.6 | 34.9 |
| -45° | 4.4 | 33 | 32.7 | 37.2 | 28.8 |
| 60° | 5.7 | 33 | 32.5 | 30.4 | 34.7 |
| -60° | 5.7 | 33 | 32.5 | 38.6 | 27.3 |
| 90° | 8.1 | 33 | 32 | 31 | 33 |
| -90° | 8.1 | 33 | 32 | 41 | 25 |

#### Case 8 — Single-frame 10 cm tracking hiccups

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Raw shake (°) | Sent err (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| string jump 10 cm (release on next frame) | 100% | 62 | 1.48° | -0.02° | 0° | 6.13° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| string jump 10 cm (recover 5 frames) | 100% | 62 | 1.48° | 0° | 0° | 3.54° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |
| bow jump 10 cm (release on next frame) | 100% | 62 | 1.47° | 0.32° | 0° | 9.92° | 0° | Hit at 19 m · 11 cm off centre · flight 0.33 s |
| bow jump 10 cm (recover 5 frames) | 100% | 62 | 1.48° | 0° | 0° | 9.92° | 0° | Hit at 19 m · 1 cm off centre · flight 0.33 s |

### bow3 (full 36 cm, rest 10 cm, vMax 68 m/s, g 5.8, drag 0.001, catch 35 cm)

#### Case 1 — Cant (bow-hand roll)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 0° | 100% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| 15° | 100% | 68 | -0.48° | -1.22° | 0° | Hit at 19 m · 58 cm off centre · flight 0.30 s |
| -15° | 100% | 68 | 1.55° | 1.49° | 0° | Hit at 19 m · 58 cm off centre · flight 0.30 s |
| 30° | 100% | 68 | -1.96° | -2.1° | 0° | Miss · landed 32 m out · passed 1.14 m from a target · flight 0.48 s |
| -30° | 100% | 68 | 1.97° | 3.14° | 0° | Miss · landed 63 m out · passed 1.14 m from a target · flight 0.95 s |
| 45° | 100% | 68 | -3.61° | -2.56° | 0° | Miss · landed 22 m out · passed 1.69 m from a target · flight 0.33 s |
| -45° | 100% | 68 | 1.95° | 4.85° | 0° | Hit at 29 m · 67 cm off centre · flight 0.45 s |
| 60° | 100% | 68 | -5.31° | -2.58° | 0° | Miss · landed 16 m out · passed 2.68 m from a target · flight 0.23 s |
| -60° | 100% | 68 | 1.49° | 6.49° | 0° | Hit at 29 m · 49 cm off centre · flight 0.45 s |
| 90° | 100% | 68 | -8.45° | -1.32° | 0° | Miss · landed 10 m out · passed 3.10 m from a target · flight 0.15 s |
| -90° | 100% | 68 | -0.6° | 9.15° | 0° | Miss · landed 43 m out · passed 1.93 m from a target · flight 0.65 s |

#### Case 2 — Bow-hand pitch and yaw (string hand straight back)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| level 0/0 | 100% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| pitch +20° (up) | 100% | 68 | 0.73° | 0.02° | 0° | Hit at 19 m · 1 cm off centre · flight 0.30 s |
| pitch -20° (down) | 100% | 68 | 0.7° | -0.02° | 0° | Hit at 19 m · 1 cm off centre · flight 0.30 s |
| pitch +45° | 100% | 68 | 0.75° | 0.05° | 0° | Hit at 19 m · 2 cm off centre · flight 0.30 s |
| pitch -45° | 100% | 68 | 0.68° | -0.04° | 0° | Hit at 19 m · 2 cm off centre · flight 0.30 s |
| pitch +75° (near align limit) | 100% | 68 | -3.43° | 0.05° | 0° | Miss · landed 22 m out · passed 1.39 m from a target · flight 0.33 s |
| pitch +85° (past align limit) | 100% | 68 | -4.42° | 0.05° | 0° | Miss · landed 18 m out · passed 1.98 m from a target · flight 0.28 s |
| yaw +20° (left) | 100% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| yaw -20° (right) | 100% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| yaw +45° | 100% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| yaw -45° | 100% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| pitch +30° / yaw +30° | 100% | 68 | 1.64° | 1.72° | 0° | Hit at 19 m · 66 cm off centre · flight 0.30 s |
| pitch +30° / yaw -30° | 100% | 68 | -0.59° | -1.3° | 0° | Hit at 19 m · 62 cm off centre · flight 0.30 s |

#### Case 3 — String-hand draw position

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| straight back | 100% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| low (hip, -30 cm y) | 100% | 68 | 41.86° | -5.31° | 0° | Miss · landed 448 m out · passed 6.67 m from a target · flight 11.42 s |
| high (above eye, +25 cm y) | 100% | 68 | -26.46° | -5° | 0° | Miss · landed 3 m out · passed 7.01 m from a target · flight 0.05 s |
| across body (+25 cm right) | 100% | 68 | 4.74° | -37.53° | 0° | Miss · landed 171 m out · passed 3.47 m from a target · flight 2.77 s |
| bow-hand side (-25 cm left) | 100% | 68 | 4.74° | 28.83° | 0° | Miss · landed 111 m out · passed 7.09 m from a target · flight 1.73 s |

#### Case 4 — Draw distance near and past full

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 90% | 90% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| 100% | 100% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| 110% | 100% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| 130% | 100% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |

#### Case 5 — Release jerks (last 3 frames before release)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Raw shake (°) | Sent err (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| clean | 100% | 68 | 0.71° | 0° | 0° | 0.01° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| string jerk +3 cm | 100% | 68 | 0.71° | -0.02° | 0° | 4.06° | 0° | Hit at 19 m · 1 cm off centre · flight 0.30 s |
| string jerk +6 cm | 100% | 68 | 0.71° | -0.04° | 0° | 8.1° | 0° | Hit at 19 m · 2 cm off centre · flight 0.30 s |
| bow jerk +3 cm | 100% | 68 | 0.71° | 0.11° | 0° | 4.77° | 0° | Hit at 19 m · 4 cm off centre · flight 0.30 s |
| bow jerk +6 cm | 100% | 68 | 0.71° | 0.22° | 0° | 9.44° | 0° | Hit at 19 m · 7 cm off centre · flight 0.30 s |

#### Case 6 — Left-handed archer (bow in right hand)

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| LH cant 0° | 100% | 68 | 0.71° | 0° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| LH cant 45° | 100% | 68 | 1.95° | -4.85° | 0° | Miss · landed 63 m out · passed 1.69 m from a target · flight 0.97 s |
| LH cant -45° | 100% | 68 | -3.61° | 2.56° | 0° | Miss · landed 22 m out · passed 1.69 m from a target · flight 0.33 s |
| LH cant 90° | 100% | 68 | -0.6° | -9.15° | 0° | Miss · landed 43 m out · passed 1.54 m from a target · flight 0.65 s |
| LH cant -90° | 100% | 68 | -8.45° | 1.32° | 0° | Miss · landed 10 m out · passed 3.64 m from a target · flight 0.15 s |
| LH low (hip) | 100% | 68 | 41.86° | 5.31° | 0° | Miss · landed 450 m out · passed 7.20 m from a target · flight 11.48 s |
| LH across body (-right) | 100% | 68 | 4.74° | 37.53° | 0° | Miss · landed 110 m out · passed 8.22 m from a target · flight 1.73 s |

#### Case 7 — String catch distance by cant

| Cant | Nock shift vs 0° (cm) | Max catch from rotated nock (cm) | From 0° nock back (cm) | From 0° nock right (cm) | From 0° nock left (cm) |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0° | 0 | 35 | 35 | 35 | 35 |
| 15° | 1 | 35 | 35 | 34.2 | 35.7 |
| -15° | 1 | 35 | 35 | 35.9 | 34.1 |
| 30° | 2.1 | 35 | 34.9 | 33.6 | 36.2 |
| -30° | 2.1 | 35 | 34.9 | 36.9 | 33.1 |
| 45° | 3.1 | 35 | 34.9 | 33.3 | 36.4 |
| -45° | 3.1 | 35 | 34.9 | 37.9 | 32 |
| 60° | 4 | 35 | 34.8 | 33.2 | 36.4 |
| -60° | 4 | 35 | 34.8 | 39 | 31 |
| 90° | 5.7 | 35 | 34.5 | 33.7 | 35.3 |
| -90° | 5.7 | 35 | 34.5 | 40.6 | 29.3 |

#### Case 8 — Single-frame 10 cm tracking hiccups

| Input | Draw % | Speed (m/s) | Up (°) | Side (°) | vs Rest (°) | Raw shake (°) | Sent err (°) | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| string jump 10 cm (release on next frame) | 100% | 68 | 0.71° | -0.05° | 0° | 9.68° | 0° | Hit at 19 m · 2 cm off centre · flight 0.30 s |
| string jump 10 cm (recover 5 frames) | 100% | 68 | 0.71° | 0° | 0° | 5.6° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |
| bow jump 10 cm (release on next frame) | 100% | 68 | 0.71° | 0.36° | 0° | 15.42° | 0° | Hit at 19 m · 12 cm off centre · flight 0.30 s |
| bow jump 10 cm (recover 5 frames) | 100% | 68 | 0.71° | 0° | 0° | 15.42° | 0° | Hit at 19 m · 0 cm off centre · flight 0.30 s |

