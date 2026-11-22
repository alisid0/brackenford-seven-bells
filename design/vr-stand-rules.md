# VR Standing-Place Rules & Geometry

Rules and numbers for raised/overlook archer stand concepts, built on `design/world-plan.md` (`bb58a11`). Coordinates use `(along, right)` in metres from `(0, 0)`.

## 1. VR Comfort Rules (Stationary Standing & Seated Quest)

- **Zero stand motion:** The deck, rail, and viewpoint never sway, bob, or move. Only distant scenery (pennant, water ripples, clouds) moves, with scenery sway toggleable off.
- **Solid footing vs Guardian:** Stationary Quest play space is `1.5 × 1.5 m` (~`2.0 m` Guardian circle). Visual solid footing must be **at least `2.4 m` wide × `2.2 m` deep** (`right -1.2..+1.2`, `along -1.2..+1.0`) so feet never appear suspended over air when leaning or turning.
- **Visible drop distance:** Never place a sheer drop directly under the player's heels. Keep the **front brink `0.9–1.2 m` ahead** of `(0, 0)` and **side drops ≥ `1.2 m` away**—close enough to feel by leaning forward without triggering panic at rest.
- **Rail:** Keep a sturdy low front rail by default (visual horizon anchor + Guardian cue). Lower the starting height from `0.85 m` to **`0.75 m` at `1.05 m` ahead**: for a seated eye (`1.15 m`), the rail top sits at `-20.9°`, keeping near targets clear (an `0.85 m` rail at `0.9 m` sits at `-18.4°` and clips `10 m` targets if `H ≥ 3.8 m`).
- **Avoid nausea/vertigo triggers:** No transparent/glass floors; no unsupported thin slabs (always show heavy timber beams or stone masonry beneath); if water passes under planks, keep flow **slow (`≤ 0.35 m/s`) and sideways (cross-flow, never toward/away from the archer)** through **narrow `≤ 4 cm` gaps between `22–25 cm` solid planks** to prevent vection.
- **Comfort toggle (`Height comfort: On / Off`):** `On` closes plank gaps and replaces the drop with solid ground (or lowers the stand to `H = 0`), keeping target distances fair (scored separately if ranked).

## 2. Height Geometry & Ballistics

Standing eye `y = H + 1.6 m`. Look-down angle `θ = atan((H + 1.6 - y_target) / d)` (`+` = looking down, `-` = up), using `src/game.js` target centres (`10/15 m: 1.61 m`; `30 m: 1.76 m`; `45 m` Terrace 1 `+0.7`: `2.75 m`; `70 m` Terrace 3 `+2.1`: `4.72 m`):

| Stand Height `H` | `10 m` | `15 m` | `30 m` | `45 m` (T1) | `70 m` (T3) | `12 m` Shade (`y=0.35`) |
|---|---|---|---|---|---|---|
| **`2 m`** | `11.3°` | `7.6°` | `3.5°` | `1.1°` | `-0.9°` | `15.2°` |
| **`2.5 m` (rec.)** | `14.0°` | `9.4°` | `4.5°` | `1.7°` | `-0.5°` | `17.4°` |
| **`4 m`** | `21.8°` | `14.9°` | `7.3°` | `3.6°` | `0.7°` | `23.6°` |
| **`6 m`** | `30.9°` | `21.8°` | `11.0°` | `6.2°` | `2.4°` | `31.1°` |
| **`10 m`** | `45.0°` | `33.7°` | `18.2°` | `11.1°` | `5.6°` | `43.2°` |

- **Sweet spot:** **`H = 2.0–2.5 m`** keeps both `10 m` (`11.3°–14.0°`) and `15 m` (`7.6°–9.4°`) within `≤ 15°` look-down, avoids seated rail clipping, and places the `70 m` Terrace 3 target right on eye level (`-0.9°` to `-0.5°`). At `H = 4 m`, `10 m` exceeds `15°` (`21.8°`); at `H ≥ 6 m`, `10–15 m` cause neck strain and foreshorten vertical ring faces (`cos 31° = 0.86`; at `H = 10 m`, `45°` hides `10 m` behind a standing rail). Reserve `H = 6–10 m` for post-release `P1/P2` stages with nearest targets `≥ 25 m`.
- **Terraces still needed?** **Yes at `H = 2–4 m`**: flat `45–70 m` ground still compresses near the horizon and overlaps the `38 m` creek sliver, so keeping the four `+0.7 m` terraces preserves depth and green backdrops. At `H ≥ 6 m`, player height opens the ground plane enough that terraces are optional.
- **Arrow drop & code retuning (`v₀ = 62 m/s`, `g = 7 m/s²`):**
  - Gravity drop relative to line-of-sight (`≈ 0.052°/m × 1/cos²θ`) changes by `< 3%` for `H ≤ 2.5 m` (`< 8%` at `H = 4 m`), but total aim pitch shifts down by `θ` (at `H = 4 m`, `70 m` aim drops from `+6.2°` to `+2.9°`; at `H = 10 m`, `-1.9°` below horizon).
  - **Must update in `src/game.js`:** (a) raise `rig.position.y` to `LANE.base + H`; (b) raise `guide.panel` (`3.4 m`) and post-stage `rangeSigns` (`7 m`) to `y = H + 1.3 m` so players do not shoot into a pit; (c) update `range.ideal` if `H ≥ 4 m` (slant distance `√(d²+H²)` adds `+4 m` to `10 m` scores at `H = 10 m`); (d) check replay camera ground clamp (`R.cam.y`) on steeper downhill misses.

## 3. Three Standing-Place Options

| Option | Rec. `H` | Footprint `(W × D)` | Brink & Rail | Required Changes to `design/world-plan.md` |
|---|---|---|---|---|
| **A: Hilltop / cliff ledge** | **`2.5 m`** above lane | `4.0 × 3.0 m` (`r ±2.0`, `a -1.8..+1.2`) | Slope starts `a +1.2 m` (reaches lane `y=0` by `a +6 m`); rail `0.75 m` at `a +1.1 m` | Raise shooting terrace, stall `(-1.5, -10.5)`, and scoreboard `(2.5, +10.2)` to `+2.5 m`; slope jetty path gently down left bank to lake; tall pole for pennant (`5.5 m`); elevate `7 m` signs. Lane `10–76 m`, creek (`38 m`), terraces unchanged. |
| **B: Sheer brink** | **`2.5 m`** above lane, **`5.5 m`** drop into chasm | `2.6 × 2.4 m` (`r ±1.3`, `a -1.5..+0.9`) | Sheer edge at `a +0.9 m`; `0.15 m` toe-curb + open-slat `0.75 m` rail at `a +0.95 m` | Carve a rocky `3.0 m`-deep gorge at `a +0.9..+7.0 m` directly ahead of the ledge (decouples a scary `5.5 m` visual drop from the comfortable `2.5 m` target angles!); raise stall/scoreboard/signs to `+2.5 m`; stone stairs down left to jetty. |
| **C: Timber deck over water** | **`2.0 m`** above lane (`2.6 m` over water) | `3.2 × 2.6 m` (`r ±1.6`, `a -1.5..+1.1`) | Front edge `a +1.1 m`, rail `0.75 m` at `a +1.05 m`; `22 cm` planks, `3.5 cm` gaps | Add a gentle (`≤ 0.35 m/s`) shallow lake-inlet / brook (`a -2..+5 m`, water `y = -0.6 m`) flowing sideways under pilings into the left lake at `(0, -15)`; keep `38 m` creek as upper brook; link stall to jetty via left timber boardwalk. |

## 4. Trials Default Recommendation & Stationary VR Ideas

- **Recommended Trials default — Combined B + C ("The Mill-Gorge Overlook"):** Build the **`3.2 × 2.6 m` timber-and-stone overlook deck at `H = 2.5 m` above the lane**, perched on a **`4.5–5.0 m` sheer rocky drop** where a slow, clear lake-inlet (`y = -2.0 m`, `≤ 0.3 m/s` sideways flow) runs beneath the pilings and front edge (`a +1.0..+6.5 m`) into the left lake.
  - **Why:** Delivers all three developer desires at once—high hillside vantage, brink tension at your toes, and water passing beneath the boards—while holding `10–15 m` inside `14°`, keeping all 29 stages and `38 m` creek intact, and letting `Height comfort: On` close the deck cleanly.
- **Stationary VR-only details (cheap, flat-shaded):**
  - **Look down:** Hip-side wooden arrow bucket/quiver (`(0.2, ±0.65, 0.7 m)`) and a subtle lean-over payoff (leaning `25 cm` past the rail reveals a sunken mossy bell stone in the inlet below + rising breeze audio).
  - **Look up:** Open timber lookout archway/beam overhead (`y = 3.2 m`, clear forward sky) with a hanging pennant cord or blossom bough for instant stereo scale.
  - **Look behind / sideways:** Physical head-turn reveals the striped market stall and descending jetty stairs on the left, the cloth scoreboard on the right, and a timber bow rack behind you (`(-1.4, +0.9)`).

## 5. Quest Hardware Test Gate (Before Calling Done)

1. **Seated & standing sightlines (`1.15 m` / `1.6 m`):** `10 m` ring, `12 m` ground shade, `70 m` Terrace 3 slider, and `7 m` result signs all clear the `0.75 m` rail cleanly with `≤ 15°` neck tilt on `10–15 m`.
2. **Draw clearance:** Full two-handed and one-handed draws (left and right handed, seated and standing) never collide visually with rail or posts.
3. **Comfort & vection (3+ sessions):** Zero dizziness or balance sway looking down over the brink or through plank gaps at `≤ 0.35 m/s` water; `Height comfort: On` visibly removes the drop/water trigger.
4. **Guardian fit:** Deck visually exceeds the stationary Guardian boundary (`≥ 2.4 × 2.2 m`) so feet never hang in air at the edge.
5. **Frame rate:** Holds **≥ 72 fps** on `Blighted meadow` and `The warren` with deck, pilings, inlet water, and terraces in view.
