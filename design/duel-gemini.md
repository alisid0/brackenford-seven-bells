# Lantern Cascade — Gemini's Arcade Mode (`src/modes/gemini.js`)

## Concept: why this is different from Bell Watch

Bell Watch is defensive urgency — dark plum shades advancing toward the belfry to bind it. **Lantern Cascade** is the opposite mood: a bright, musical **festival sky-gallery & chain-reaction arcade** where the range fills with rising silk lanterns, linked twin orbs, arcing timber skeet discs, swaying long-range wind chimes, and spinning Golden Volley stars. Nothing attacks; the thrill comes from flow, chain pops, apex catches, and sweeping musical Golden Volleys across the sky.

## Targets and mechanics (readable in 5 seconds, zero tutorial needed)

| Target | Silhouette & motion | Range | Base points | Special reward |
| --- | --- | --- | ---: | --- |
| **Festival Lantern** | Ribbed cream or crimson paper lantern drifting gently upward with breeze sway (`0.48 m` hit sphere) | `12–25 m` | `110 + dist` (`200 + dist` when gilded) | Pentatonic chime & warm spark burst. |
| **Linked Twin Pair** | Two jade-and-gold octahedral lanterns joined by a visible sagging golden silk cord | `13.5–22.5 m` | `130 + dist`; partner within `4.5 s`: **`260 + dist`** | Pop one → cord bursts in sparks and partner turns blazing gold (`1.16×` pulse). Pop partner → **`CHAIN!`** chord + double burst. |
| **Timber Skeet Disc** | Spinning terracotta-red & cream bullseye disc launched from left/right spring throwers (`thwock!` cue + sky spark trail) | `13.5–22.5 m` | `150 + dist`; near apex (`|vy| ≤ 1.25 m/s`, `y ≥ 3.1 m`): **`270 + dist`** | Graceful `g = 2.75 m/s²` arc hangs near the top for an **`APEX!`** shatter bonus. |
| **Far Wind-Chime** | Suspended bronze-and-gold triple-rod wind chime with red wind-catcher card swaying like a slow pendulum | `27.5–32.5 m` | **`240 + 2×dist`** (`~300` base) | Deep resonant temple-chime triad; rewards deliberate long-range aim. |
| **Gilded Crown Star** | Large spinning gold-and-crimson star with orbiting halo ring gliding across centre lane (`t = 22, 54, 88, 122, 150 s`) | `16.5–21.5 m` | `240 + dist` + **Golden Volley** | Launches a 10 s **Golden Volley**: a choreographed 5-lantern golden V-fan playing an ascending xylophone scale (`1/5` → `5/5`). Clearing all 5 pays **`+450 × Flow` VOLLEY CLEAR!** |

### Carefree Flow & Proactive Bell

- **Flow multiplier (`×1.00 → ×1.25 → ×1.50 → ×1.75 → ×2.00` at `0, 4, 9, 14, 20` hits):** Misses **never** drop Flow. Only pausing `> 5.2 s` without a hit eases Flow down gently (`-3` every `2.5 s`). Brisk consecutive hits (`≤ 2.35 s` apart) add `+25` rhythm bonus; perfect full-draw releases keep the `1.25×` bonus.
- **Proactive Practice Bell:** Unlike Bell Watch (defensive clearing), every `6` hits charges the Practice Bell (`Bell READY for Golden Volley`). Shooting the charged bell rings it and launches a **Golden Volley** on demand; ringing it early still chimes freely without counting as a miss.
- **Grand Finale:** At `t = 158 s` (`22 s` left), a guaranteed **Finale Volley** rings out so every run ends on a celebratory peak.

## Limits & Quest 72 fps engineering

- **Hard cap:** `MAX_SLOTS = 8` pooled targets (`≤ 9` limit guaranteed at every frame); every coordinate clamped to `along ∈ [10.5, 34.0] m` (`≥ 8 m`, nothing from behind).
- **Zero per-frame allocations:** All 8 target groups (with pre-built variant meshes), 2 catenary cord `THREE.Line` buffers, 2 thrower props, materials, and scratch `Vector3`s are built once in `initPool()`. `rangeTargets()` runs only on spawn/despawn.
- **Blind playtest safe:** Never puts `"Gemini"` in any title, scoreboard, popup, or voice line (`info()` preserves the slot's `Arcade A` / `Arcade B` header).

## Scorecard results (`tests/arcade.html?mode=gemini`)

| Metric | Idle bot | Fair bot (`2.8 s`, `70%`) | Good bot (`2.0 s`, `85%`) | Check |
| --- | ---: | ---: | ---: | --- |
| Score | `0` | `13,696` | `29,847` | `skillShows: true` (**`2.18×`** good/fair) |
| Hits / Shots | `0 / 0` | `43 / 64` | `77 / 90` | `ran: true`, `noErrors: true` |
| Peak shootable in view | `8` | `8` | `8` | `nineAtMost: true` (`≤ 9`) |
| Behind / `< 8 m` | `0 / 0` | `0 / 0` | `0 / 0` | `nothingBehind: true` |
| Idle secs / max gap | `0.0 / 0.0` | `0.0 / 0.0` | `0.0 / 0.0` | Zero empty gaps |
| `msPerTick` / `msMax` | `0.00 / 0.0` | `0.00 / 0.0` | `0.00 / 0.0` | Comfortably 72 fps Quest-safe |
| Score drops / rig moved | `0 / false` | `0 / false` | `0 / false` | `carefree: true`, **`allOk: true`** |

## Post-contest slot requests (for after judging, per brief rule 1)

1. Call `prevMode.end()` in `setStage()` when leaving an arcade stage mid-run (currently `end()` only runs in `rangeResults()`, so switching to a Trial stage mid-run leaves custom scene props visible until the next arcade end).
2. Let `graceAim()` (`bow3`) optionally consider `arcade.meshes` when an arcade mode opts in, so fun-bow forgiveness matches Bell Watch.
