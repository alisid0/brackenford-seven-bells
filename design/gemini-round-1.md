# Bow & Shadow — Design Round 1 (Gemini)

All proposals stay behind feature flags after Trials ships, never touch `main`, and stay unpromised until Quest-tested.

## ROLES

I disagree with two parts of the current split: Claude both writes and self-specs rules, while ChatGPT stretches from art direction into gameplay math (Endless arrow rules).

- **Gemini (Systems Design & Spec QA):** Own rulesets, numeric balance (scoring, arrow economy, wave pacing, trade-offs), VR/MR interaction specs, and pre-merge doc consistency checks; retune from playtest data.
- **Claude (Engineering & Performance Veto):** Own code, animation, tests, repo hygiene, and Quest profiling—with veto power if a design threatens 72 fps or simplicity.
- **ChatGPT (Art Direction & Visual QA):** Focus strictly on style sheet, palette, concepts, and silhouette/readability reviews.
- **Developer:** Final calls and Quest testing.

## ELEMENTAL ARROWS

Behind `?elements=1` (post-launch; Arcade v1 stays Standard-only). Flat-shaded meshes, pooled opaque shards, zero dynamic lights.

| Arrow | Does | Exact rule | Trade-off | VR feel | Quest cost / risk |
|---|---|---|---|---|---|
| **Ember** | Flushes cover | 2.0 m ember ring for 3.5 s; shades inside exit cover and pay +25% if hit before leaving. | -15% speed, 1.25× wind, no 1.25× perfect release; hold full draw ≥0.9 s to light. | Crackle + low haptic hum; ember burst. | 1 flat ring + ≤12 tris; cap 2 rings. |
| **Frost** | Slows zone | 3.0 m rime bloom for 3.5 s; targets inside move at 50% speed, pop-ups hold +2.0 s. | Shatters past 35 m; direct hits pay 0.75×, no perfect release. | Glass chime + crisp draw tick; brittle snap. | Shared ice material + ≤10 tris; never clone skinned materials. |
| **Gale** | Cuts wind | Ignores 100% wind; passing ≤1.0 m from a crow/pop-up nudges it 0.8 m inward, delaying flee 1.5 s. | Pays 0.85× base; <80% draw tumbles and misses. | Rising draw whistle; sharp release pop. | Zero wind math + 24-tri ribbon; run proximity on 1/90 s step. |
| **Spark** | Chains hit | Hit at ≥85% draw arcs to nearest live target ≤4.0 m for 60% base points (no extra streak). | Costs 2 arrows in Endless (1.5 s cooldown in Score Attack); no arc <85% or on scenery. | High buzz ≥85% draw; double-snap haptic. | One 6-segment polyline for 0.15 s; guard Endless arrow-return. |

## ARCADE

Two flaws and one improvement in `Arcade-plan.md`:

1. **Wrong — 0.25 s frame-gap abort:** Quest Browser GC pauses or OS toasts exceed 250 ms; killing a 12-minute Endless run on one hitch is unfair. **Fix:** Abort at **≥1.0 s** (or two >0.5 s gaps in 10 s); log >0.25 s stalls for future leaderboards.
2. **Wrong — Endless passivity exploit:** Expired targets cost neither arrows nor streak, letting players skip hard waves until 15 minutes. **Fix:** Keep expired targets arrow-free, but **unhit visible targets reset streak to 1.0×** (voids exempt) and **20 s without a hit after wave 3 costs 1 arrow**.
3. **Improve — Score Attack dead air:** Early slot clears force idle waiting. **Fix:** Keep the 6 s clock, but spawn a fixed **Bonus Bell** (+50 flat, miss-safe) whenever primary targets clear with ≥1.5 s left.

## MIXED REALITY

**Build first: "Breach at the Window" (`?mr=1`).** Place one 2.5 m × 2.0 m thorn-framed portal on a front wall (2.5 m away, floor-aligned via M4) opening onto the 10–45 m Score Attack lane. Every third slot (18 s), a **Breach Shade** rushes toward the sill (stopping 1.5 m inside the frame, obeying M10): banishing it pays 2×; hitting the sill cracks the frame and resets streak.

**Why first:** Uses only M1–M4 and M9–M10—skipping fragile room meshes/occlusion (M5–M8)—while preserving real archery distances and real-wall comfort.

**Quest gate before any claim:** `immersive-ar` (`alpha: true`) at **≥72 fps** on busiest slot; **≤5 cm** portal drift over 3 minutes; clean stereo stencil clipping; reliable AR-to-VR fallback (M3) and shade contrast beside bright rooms.

## RISKS

- **Spec lag:** Three-way review can stall tweaks; let Claude ship minor tuning directly and audit asynchronously.
- **VR switching load:** Four arrows risk menu friction or Gale trivialising wind; test 2–3 behind `?elements=1` with one-handed-safe switching.
- **Harsh streak resets:** Apply Endless expiry resets to ring/visible targets first until Quest sightlines are verified.
- **Passthrough cost:** Stencil plus passthrough may drop below 72 fps; if hardware tests fail, MR stays unannounced.
