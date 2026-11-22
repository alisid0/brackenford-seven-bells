# Shade ram numbers audit (`RAM_RULE`)

Audit of Claude's initial `RAM_RULE` guesses in `src/game.js` against `WATCH_RULE` (`seconds: 180`, `again: [1.2, 2.8]`), `WATCH_BELL` (`share: 0.65`, `reach: 1.3`, `scatter: 9`, `bonus: 100`, `quiet: 10`), `SPIRIT` scoring, and `design/bell-watch.md`.

**Changed in code now:** `stride` only (`1.5` → `1.35` m), because the ram's 2-bone leg geometry covers 1.35 m per trot cycle at zero shortfall and < 5 mm hoof slide. All other `RAM_RULE` values are left unchanged so `tests/ram.html` stays green and gameplay tuning can be playtested by a person before moving test bounds.

---

## Geometry and timing on today's range

- **Bell foot (`watchFoot()`):** `[21.6, ±11.2]` in lane metres.
- **Ram spawn (`from: [34, 3]`):** distance to the bell foot is `14.9–18.9 m` (`16.7 m` from centre); minus `reach: 1.6 m`, the walk is `13.3–17.3 m` (`15.1 m` mean).
- **Threat window (fade-in to strike):**
  - `0.8 s` fade-in (`live` already true) + `4.0 s` pawing (`stand`) + `~6.2 s` charge (`15.1 m / 2.6 m/s` plus `~0.4 s` ease-in) + `0.93 s` rear to impact = **`~11.9 s`** (`11.2–12.8 s`).
- **Player shot cadence:** full draw is `0.85 s`, arrow flight to `34 m` at `62 m/s` is `0.55 s`, re-aim `~0.5 s` → **`~1.9 s` per deliberate shot**.

---

## Parameter-by-parameter review

| Parameter | Current | Verdict | Reasoning |
|---|---|---|---|
| `stride` | **1.35 m** *(was 1.5)* | **Changed** | At `size: 1.77`, `1.5 m` (`0.847` model units) over-extends the forelegs by `~19 mm` at full reach. `1.35 m` (`0.763` model units) gives `0.0 mm` shortfall, `< 5 mm` hoof slide, and `1.93` cycles/s at `2.6 m/s` (a heavy, grounded trot). |
| `size` | `1.77` | **Keep** | Puts the shoulder at `~1.1 m` and horn tips at `~1.75 m` — reads unmistakably larger than the hares at `34 m` without dwarfing the belfry. |
| `from` | `[34, 3]` | **Keep** | Far enough beyond the normal `11–30 m` hare band to feel like a distinct long deliberate shot, yet still well short of the `38 m` creek so it never spawns in water. `±3 m` keeps it inside the lane where nothing obscures it. |
| `reach` | `1.6` | **Keep** | Slightly wider than `WATCH_BELL.reach` (`1.3 m`) to match the ram's larger body so its horns clear the belfry post cleanly when it rears. |
| `least` | `20` | **Keep** | With a `~12 s` full threat window and `WATCH_BELL.quiet: 10`, spawning no ram in the last `20 s` guarantees any ram that appears has time to charge and reach the bell before `0:00`, and respects the `2:50–3:00` release beat in `design/bell-watch.md`. |
| `first` | `[20, 30]` | **Keep (or tighten to `[22, 26]`)** | Fits `design/bell-watch.md`'s pacing cleanly: clears the calm `0:00–0:10` opening and lands early in the `0:10–1:00` build so the player meets the ram once they have found their rhythm. |
| `stand` | `4` | **Recommend `2.5–3.0`** | At `0.8 s` fade-in + `4.0 s` stand, the ram is completely stationary at `34 m` for `4.8 s` — enough for 2–3 full draws. Most attentive players will banish it before it ever takes a step, hiding the charge animation and urgency. Dropping `stand` to `2.5–3.0 s` gives time for one clean long shot while pawing, then forces a moving lead shot on the charge. |
| `speed` | `2.6` | **Keep (or `2.2` if `stand` drops)** | At `2.6 m/s`, the ram is cleanly slower than running hares (`6.5 m/s`) and faster than creepers (`0.95 m/s`), taking `~6.2 s` to cross to the bell. If `stand` is shortened to `2.8 s`, lowering `speed` to `2.2 m/s` keeps the total window near `~11.5 s` while shifting the drama into the heavy charge itself (and slows cadence to `1.63` cycles/s, feeling even heavier). |
| `again` | `[30, 45]` | **Recommend `[34, 40]` (or fixed count)** | In a `180 s` run with `least: 20` and `~5 s` alive time, `first [20, 30]` + `again [30, 45]` spawns anywhere from **3 to 5 rams** purely on RNG. Because Bell Watch does not reset streaks on misses, players sit at the `2×` streak cap after 10 hits; each ram is worth `668` pts (`835` perfect), so 3 vs 5 rams is a **`1,336–1,670` point RNG swing** on a high-score board. Tightening to `first: [22, 26]`, `again: [34, 38]` yields a reliable **4 rams per run** while still feeling unscripted. |
| `value` | `300` | **Keep (test `350` if needed)** | With distance bonus (`+34` at spawn), base score is `334` — just above a crossing crow (`300 + ~21 = 321`) and well above running hares (`240 + ~20 = 260`). At `2×` streak that is `668` (`835` perfect): rewarding enough to break off hares immediately without turning Bell Watch into "only the rams matter". If playtesters feel a crossing crow at `21 m` is nearly as lucrative for less spectacle, `350` (`768` at `2×`) is a safe gentle bump. |
| `3 bands at once` | `bind(3)` | **Keep** | High visual drama with zero violation of carefree rules: it costs no points, cannot end the run, and one arrow into the bell still clears all three bands and scatters nearby hares within `9 m`. It creates the exact "satisfying clear" loop described in `design/bell-watch.md`. |

---

## Summary of playtest-ready recommendation

When a person plays Bell Watch and `tests/ram.html` bounds can move with it, try:

```js
const RAM_RULE = {
  first: [22, 26],   // lands reliably in the 0:10-1:00 build
  again: [34, 38],   // reliable 4 rams per 180 s run (fair high-score chasing)
  from:  [34, 3],    // unchanged
  stand: 2.8,        // one deliberate shot while pawing, then the charge starts
  speed: 2.2,        // heavier, ~7.3 s charge (~11.8 s total threat window)
  reach: 1.6,        // unchanged
  value: 300,        // unchanged (350 optional after playtest)
  size:  1.77,       // unchanged
  stride: 1.35,      // already set in code for zero-slide IK
  least: 20          // unchanged
};
```

## Carefree / "Refused" check (`design/bell-watch.md`)

- No player harm, no bell health, no lost points, no camera shake, no attack scream, no approach from behind.
- Note: ringing the bell (`pealHit`) scatters nearby hares (`spirits`), not the ram — this is right, because the ram is meant to be banished directly by an arrow, while the bell remains the clean recovery if it binds.
