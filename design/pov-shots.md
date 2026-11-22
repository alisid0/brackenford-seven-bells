# Player's-Eye (POV) Shot List (Step 2)

Built from `design/world-plan.md` (`8e7a34d`) and `Stages.md`. Coordinates are `(along, right, height)` in metres from shooting-line centre (`y = 0` on flat near lane). All seven views stand at **eye `(0, 0, 1.6 m)`** with **`90°` horizontal FOV** (`45.0° L` to `45.0° R`) so scale stays directly comparable across shots.

## 1. Stage Coverage (7 Views Covering All 29 Stages Exactly Once)

| View | Representative Stage | Release? | Stages Covered (Count) | Visual Archetype |
|---|---|---|---|---|
| **V1** | First marks (#1) | Rel #1 | 1, 2, 6, 17 (4) | Near calm static ring; baseline lane scale |
| **V2** | The gauntlet (#16) | Rel #15 | 3, 7, 8, 9, 10, 12, 13, 14, 16 (9) | Mid-lane static + slider + pop-up + wind |
| **V3** | Three ranges (#4) | Rel #8 | 4, 11, 18 (3) | Across-creek depth onto Terrace 1 (`45 m`) |
| **V4** | Master of the line (#20) | Held back | 5, 15, 19, 20 (4) | Creek-edge `35 m` pop-up + extreme `70 m` Terrace 3 slider |
| **V5** | The warren (#22) | Rel #7 | 21, 22, 25 (3) | Open-meadow ground shades (`12–30 m`, no cover) |
| **V6** | Creepers (#24) | Rel #14 | 23, 24 (2) | Two rows of tall grass cover clumps (`15, 23 m`; Kiln test) |
| **V7** | Blighted meadow (#29) | Rel #17 | 26, 27, 28, 29 (4) | Winged shades (perched + crossing) + mixed ground/cover shades |

*(Note: Stage 27 `Flush` swaps V7's grass clump for three `~0.8 m` concealment bushes at `13–24 m` in the same visual band.)*

## 2. Foreground Rail & Vertical Framing (Applies to V1–V7)

- **Rail geometry:** `(0.9, -3.0..+3.0, 0.85 m)` spans `±73.3°` horizontally (full frame width).
- **Standing-eye depression:** From `(0, 0, 1.6 m)`, the rail top sits at `atan((0.85 - 1.6) / 0.9) = -39.8°` below horizontal across the frame.
- **Where the rail top falls in frame:**
  - **VR / square eye crop (`90°` HFOV × `90°` VFOV, level `pitch 0°`):** bottom **8%** of the frame (`39.8°` of `45°` half-VFOV).
  - **16:9 widescreen (`90°` HFOV × `58.7°` VFOV, `±29.4°`):** at level `pitch 0°`, `-39.8°` falls **below the bottom edge**; showing the rail top in the bottom **5–9%** of a 16:9 frame requires pitching down `-12°` to `-15°` (or drawing the POVs at a taller VR aspect, e.g., `4:3` / `74°` VFOV with `-5°` pitch). **Do not raise the rail artificially to force it into a level 16:9 crop.**

## 3. Shared World-Plan Background Inside a Centred `90°` Frame (Left to Right)

Every centred view (`look-at right = 0`) shares the exact world-plan bearings below (`%H` = fraction of `58.7°` 16:9 VFOV; multiply by `0.65` for `90°` VR VFOV):

| World Element | Bearing (L/R) | Distance | Apparent Height | Notes |
|---|---|---|---|---|
| Skyline plum ridge | `45.0° L`–`45.0° R` | `~270 m` | `11.2°` (~19% H above horizon) | Full-width silhouette (`+45..+65 m` crest) |
| Left lake near shore | `45.0° L`–`13.0° L` | `21.2–66.7 m` | `0.5–2°` flat band | Enters left edge at `(15, -15)` |
| Lane left edge | `45.0° L`→`6.0° L` | `11.3–76.4 m` | ground plane | Straight light-green edge (`right = -8`) |
| Left blossom tree | `29.4° L` (`31.8°–26.9° L`) | `35.6 m` | `8.0°` (~14% H) | `(31, -17.5)`, `5.0 m` H, `#F299B5` |
| Creek across lane | `21.5° L`–`45.0° R` | `38.0 m` centre | `0.2°` (~0.3% H sliver) | Mouth `(38, -15)` to right woods `(38, +35)` (`42.6° R`) |
| Terraces 1–4 (`43–76 m`) | `10.5° L`–`10.5° R` (`±6.0°` far) | `43.0–76.0 m` | `3.0°` total (~5% H) | Risers `0.9°, 0.8°, 0.6°, 0.6°`; spans `-2.1°` to `+0.9°` |
| Lane right edge | `6.0° R`→`45.0° R` | `76.4–11.3 m` | ground plane | Straight light-green edge (`right = +8`) |
| Village (3 huts) | `12.4° R`–`17.7° R` | `93.4 m` centre | `3.1°` (~5% H) | Elevated `+5..+8 m` (`+2.7°` to `+5.8°` elev.) |
| Footbridge | `18.2° R` | `40.0 m` | `2.2°` (~4% H) | `(38, +12.5)`, `~1.5 m` H with rails |
| Right blossom tree | `20.3° R` (`18.3°–22.2° R`) | `49.0 m` | `5.8°` (~10% H) | `(46, +17.0)`, `5.0 m` H; top at `+4.0°` elev. |
| Watchtower | `20.7° R` | `96.2 m` | `5.9°` (~10% H) | `(90, +34)`, `10 m` H (`+3.2°..+9.1°`); rises cleanly over right blossom crown |

**Outside a centred `90°` (`±45°`) frame from `(0, 0)` (do not force into frame):** Market stall (`98.1° L`, behind), Scoreboard (`76.2° R`, `10.5 m`), Wind pennant (`50.8° L`, `12.7 m`; flag tip `45.7° L`), Wooden jetty (`49.7° L`, `21.6 m`; path tip barely grazes `44.4° L`).

## 4. Per-View Shot Specifications

All ring heights use `centre y = y_ground + 0.75 + 0.72 × size`, outer diameter `1.36 × size`.

| View & Stage | Look-At `(a, r, y)` & Pitch | Stage Targets / Shades `(a, r, y_centre, size)` → Bearing, Dist, App. H | Shot-Specific Exclusions |
|---|---|---|---|
| **V1: First marks** | `(10, 0, 1.6)` · `0.0°` | Ring: `(10, 0, 1.61 m)`, dia `1.63 m` (`size 1.2`) → `0.0°`, `10.0 m`, `9.3°` (~16% H). | No grass clumps, shades, wind flag bending, or extra targets. |
| **V2: The gauntlet** | `(24, 0, 1.6)` · `0.0°` | Static: `(15, -4.5, 1.54 m)`, dia `1.50 m` → `16.7° L`, `15.7 m`, `5.5°` (~9% H).<br>Slider: `(24, 0, 1.69 m)` (±3 m = `±7.1°`), dia `1.77 m` → `0.0°`, `24.0 m`, `4.2°` (~7% H).<br>Pop-up: `(32, +4.0, 1.83 m)`, dia `2.04 m` → `7.1° R`, `32.2 m`, `3.6°` (~6% H). | No blue creek water behind the `32 m` pop-up (keep green Terrace 1 behind its upper rim); no grass clumps. |
| **V3: Three ranges** | `(30, 0, 1.8)` · `+0.4°` | Near: `(15, -4.0, 1.54 m)`, dia `1.50 m` → `14.9° L`, `15.5 m`, `5.5°` (~9% H).<br>Mid: `(30, 0, 1.76 m)`, dia `1.90 m` → `0.0°`, `30.0 m`, `3.6°` (~6% H).<br>Far (Terrace 1, `+0.7`): `(45, +4.0, 2.75 m)`, dia `2.45 m` → `5.1° R`, `45.2 m`, `3.1°` (~5% H). | Far target must stand clearly on Terrace 1 (`+0.7 m`), not in the creek; no trees or huts behind `5.1° R`. |
| **V4: Master of the line** | `(70, 0, 4.7)` · `+2.5°` | Pop-up: `(35, -5.0, 1.69 m)`, dia `1.77 m` → `8.1° L`, `35.4 m`, `2.9°` (~5% H).<br>Far slider (Terrace 3, `+2.1`): `(70, 0, 4.72 m)` (±4 m = `±3.3°`), dia `3.54 m` → `0.0°`, `70.0 m`, `2.9°` (~5% H). | `35 m` pop-up sits dry `1.5 m` before creek; `70 m` target must have clean green Terrace 4/berm behind it, never sky or cream huts. |
| **V5: The warren** | `(18, 0, 0.5)` · `-3.5°` | 4 sitting dark-plum hares (`~0.8 m` H, ember eyes):<br>`(12, -3.0)` → `14.0° L`, `12.4 m`, `3.7°` (~6% H); `(18, +2.0)` → `6.3° R`, `18.1 m`, `2.5°` (~4% H);<br>`(24, -1.5)` → `3.6° L`, `24.0 m`, `1.9°` (~3% H); `(30, +4.0)` → `7.6° R`, `30.3 m`, `1.5°` (~2.6% H). | Zero grass clumps or tufts on the lane; no outlines or smoke around hares (silhouette + ember eyes only). |
| **V6: Creepers** | `(18, 0, 0.4)` · `-3.8°` | 6 tall grass clumps (`1.7 m` dia × `0.7 m` H):<br>Row 1 (`15 m`): `20.1° L` (`16.0 m`, `2.5°`), `0.0°` (`15.0 m`, `2.7°`), `20.1° R` (`16.0 m`, `2.5°`).<br>Row 2 (`23 m`): `11.1° L` (`23.4 m`, `1.7°`), `1.2° R` (`23.0 m`, `1.7°`), `12.3° R` (`23.5 m`, `1.7°`).<br>2 creeping hares: open at `(15, -2.5)` (`9.5° L`, `15.2 m`, `3.0°`); crouched at `(23, +0.5)` (`1.2° R`, `23.0 m`, `1.1°` ears/eyes). | Zero decorative grass tufts anywhere else in or beside the lane so Kiln targets stay unmistakable. |
| **V7: Blighted meadow** | `(20, 0, 2.2)` · `+1.7°` | Sit hare `(13, -4.0)` → `17.1° L`, `13.6 m`, `3.4°` (~6% H).<br>Hide hare + clump `(19, +4.0)` → `11.9° R`, `19.4 m`, `2.1°` (~3.5% H).<br>Run hare `(23, -3.5)` → `8.7° L`, `23.3 m`, `2.0°` (~3.4% H).<br>Perched crow `(16, +1.0, 2.7 m)` on `2.6 m` post → `3.6° R`, `16.0 m`, post `9.6°` (~16% H).<br>Crossing crow `(24, -4.0, 4.5 m)` (`0.9 m` span) → `9.5° L`, `+6.8°` elev., `24.3 m`, `2.1°` span. | Keep `±13 m` flank trees clear along `13–29 m` so crossing crow enters cleanly against sky/distant ridge; no extra clumps. |

**Global exclusions (all views):** No cast ground shadows; no roaming bell beams, floating lanterns, climbing wall/tower, or stray straw targets; no blossom tree or pale hut behind any target ray; no loose petals in the lane.

## 5. Open Questions for ChatGPT (Unsettled by the Aerial Plan)

1. **Sky, lighting, and time of day:** Exact sky gradient (clear midday blue vs warm late-afternoon gold), cloud style/density, and sun direction so flat-shaded facets read without cast shadows.
2. **Far backstop behind `76 m`:** Should the lane end in a low sloped grass berm, a timber backstop fence, or rolling meadow merging into the distant treeline before the plum mountains?
3. **Terrace riser treatment:** Pure darker flat-shaded grass faces, or subtle low timber/stone retaining lips to sharpen distance cues at `43–72 m`?
4. **Creek edge & water finish:** Opaque flat-blue surface with low sandy banks (`0.3 m`) or small spaced bank stones visible from eye height (`0.2°` sliver)?
5. **Target stands & shooting bow:** Single central post vs A-frame tripod on ring targets, and whether V1–V7 should include a minimal foreground bow/hand (with neutral grey arrowhead) or keep the frame clean.
6. **Plan note (for developer/team):** At `(8.0, -9.8)` (`50.8° L`) and `(2.5, +10.2)` (`76.2° R`), both the wind pennant and scoreboard sit outside a centred `90°` desktop frame (readable by glancing in VR). Should the pennant stay there for VR glance, or shift down-lane to `(12.0, -9.8)` (`39.2° L`) so desktop players see wind in frame?
