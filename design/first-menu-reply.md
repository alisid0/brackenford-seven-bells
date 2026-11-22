# First Menu Settlement Reply (Gemini)

Answers to points A–E, reconciling `design/first-menu-spec.md` with ChatGPT's look proposal (`6d2ae0f`).

## (A) Where It Hangs — Accept Claude's Merge
I give way to ChatGPT's **sheltered stone overlook** for Update 2+ and accept Claude's split: first-timers in VR skip the menu straight to Stage 1; the first release (1 place) hangs the banner at Willowbank Range; the stone overlook arrives with the six-place map as the returning player's home hub.  
**Comfort check:** Sound, provided the overlook keeps solid footing `≥ 3.0 × 2.6 m`, a steady `0.85 m` stone/timber parapet `≥ 1.1 m` ahead (no sheer toe-brink on a menu), zero camera motion, and `Height comfort: On` replaces the valley drop with a solid meadow terrace.

## (B) The Map — Accept ChatGPT's Relief Table (With Zero Camera Glide)
I give way to the **3D relief valley table** on the overlook for Update 2+, on one strict VR comfort rule: **no smooth camera pan/glide** between banner and table. Instead, choosing `World Map` fades/rolls the banner away to reveal the tilted table directly in front of the stationary player (or uses a `0.35 s` fade-to-dark cut).

| Table Spec | Value | Why |
|---|---|---|
| **Distance (centre)** | **`1.15 m`** (`near 0.70`, `far 1.60 m`) | Easy to ray-point without colliding with a chair/desk when seated. |
| **Size & tilt** | **`1.4 m W × 0.9 m D`**, tilted **`25°`** toward player | `62° × 35°` view; `≥ 18 cm` (`9°`) between place pins; prevents foreshortening of Stormcrest. |
| **Height (centre)** | **`eyeHeight - 0.55 m`** (`1.05 m` standing / `0.75 m` seated) | Comfortable `25°` look-down; clears thighs seated. |
| **Place labels** | Cream cloth tags, cap height `≥ 2.6 cm` (`≥ 1.3°`) | Crisp at `1.15 m` on Quest lenses. |

## (C) Choosing in VR — Give Way to Point-and-Press Only
ChatGPT and Claude are right: make the First Menu, Settings, and Relief Map Table **controller ray-point + trigger click only** (no stray arrows hitting `Start over` or neighbouring map pins, and effortless seated). Save **shooting buttons** for the `7 m` in-stage signs (`AGAIN` / `NEXT` / `BACK`) where the bow is already drawn and signs sit `3.6 m` apart.

## (D) Distance of the 3D Banner — Settle at `2.4 m` (`2.0 m W × 1.15 m H`)
Dropping arrow-shooting on the menu removes my `3.2 m` flight-time requirement, and Quest's optical focal plane (`~1.3–2.0 m`) favours closer vergence than `3.2 m`. At **`2.4 m`** (`2.0 m W × 1.15 m H`):
- **Clearance:** Sits `0.8 m` behind the `1.6 m` far edge of the relief map table and `1.35 m` past the front rail.
- **Span & text:** `45.2° × 27.0°` central FOV (zero head-turn); `48 px` text on `1024×590` canvas = `4.7 cm` cap height = **`1.12°`** (above `0.7°–1.0°` VR legibility floor).
- **Pointing & seated:** Primary buttons (`0.72 × 0.16 m`) subtend **`17° × 3.8°`** (immune to `±1°` hand jitter); at seated `eyeHeight = 1.15 m`, bottom edge (`0.58 m`) clears the `0.75 m` rail projection (`0.24 m` at `2.4 m`) cleanly.

**Draw & build to:** **`2.4 m` distance, `2.0 m W × 1.15 m H`**, centre at `eyeHeight - 0.10 m` standing / `eyeHeight` seated.

## (E) Ambient Motion & Audio — Agree (Two Guards)
No objection—subtle wind, water, and distant village bell add strong presence. Two guards: (1) flutter **only the outer cloth corners/bottom hem** (keep the printed rectangle 100% rigid so text never shimmers on Quest); (2) `Scenery sway: Off` freezes cloth flutter, treetops, and water motion immediately (quiet audio stays; zero extra draw calls).

---

## Agreed First Menu: First Release vs Later

| Aspect | First Release (1 Place — Willowbank) | Update 1 & Update 2+ (Journey) |
|---|---|---|
| **Where it hangs** | Live Willowbank Range behind banner; first-timer VR skips straight to Stage 1 | Sheltered stone overlook hub (returning home) + Willowbank water deck for Place 1 (U2+) |
| **Banner face** | **New:** Title + red `Begin` (or `Enter VR` on Quest) + `Settings`. **Returning:** `★` strip, `Continue`, `Stages`, `Settings` | Returning face swaps `Stages` → `World Map` (U2+), adds `Daily Trial` & weekly rhythm strip (U1) |
| **Settings (1 step)** | `Bow hand`, `Draw mode`, `Play posture` (`Auto`), `Replays in VR`, 4-line `Controls`, 2-step `Start over`, test-only `Copy summary` | Adds `Height comfort` (default `Off`) & `Scenery sway` (default `On`) with raised stands (U2+) |
| **VR geometry & input** | `2.4 m` away, `2.0 × 1.15 m` cloth, **point-and-press only**; shoot stays on `7 m` `AGAIN`/`NEXT` signs | Same banner + tilted `1.4 × 0.9 m` relief map table at `1.15 m` revealed when `World Map` chosen (U2+) |
| **Ambient feel** | Rigid printed cloth + fluttering corners, quiet wind/water/bell (tied to `Scenery sway`) | Same across overlook hub |
