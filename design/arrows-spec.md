# Special Arrows Spec (v1)

Flagged trial ruleset (`arrows` in `src/config.json`, off in release). Special arrows draw no seeded RNG numbers.

## CHARGES
- **2** shared charges per stage (Frost, Gale, Kiln); Standard uses stage arrows (5–10) freely.
- Firing any special spends **1 charge and 1 stage arrow** on release (hit or miss); at `0` charges, selection reverts to Standard.

## FROST (Rime)
- **Rule:** Any ring hit (20–100) on an unfrozen slider or pop-up pauses its slide/fold timer **1.8 s**, resuming from the held phase. Max **1 freeze per target**; target stays hittable.
- **Targets:** Sliding/pop-up rings (while up). Cannot affect static rings, shades, grass, scenery, or frosted targets.
- **Invalid hit:** No effect, score **0**, streak resets to **1.0**.
- **Score / streak / perfect release:** Score **0**; valid freeze keeps streak unchanged; perfect release has no effect.
- **Combos:** Second Frost on a frosted target fails as invalid. Gale or Standard hits frozen targets normally without ending the 1.8 s hold.

## GALE
- **Rule:** **0.5×** lateral wind acceleration (normal gravity/speed); caps base value (ring 20–100 or shade value) at **60** before adding distance.
- **Targets:** All rings and shades (sitting, hidden, creeping, running). Cannot affect grass alone or scenery.
- **Invalid hit:** Misses: score **0**, streak resets to **1.0**.
- **Score / streak / perfect release:** `(min(base, 60) + distance) × streak × (1.25 if perfect)`. Valid hit raises streak **+0.1** (cap **2.0**).
- **Combos:** Works normally on Frost-held targets and Kiln-exposed shades; multiple Gales apply `0.5×` wind and the `60` cap independently.

## KILN
- **Rule:** Hitting an intact concealment grass clump removes that clump for the stage, exposing any shade inside or creeping through it. Grass collision resolves **before** hidden-shade collision; Kiln stops on the clump and never harms shades.
- **Targets:** Intact concealment grass clumps (1 per shot). Cannot affect rings, shades, cleared spots, or scenery.
- **Invalid hit:** No effect, score **0**, streak resets to **1.0**.
- **Score / streak / perfect release:** Score **0**; valid clear keeps streak unchanged; perfect release has no effect.
- **Combos:** Second Kiln at a cleared spot fails as invalid; follow-up Gale or Standard hits exposed shades normally.

## ACCEPTANCE CASES
1. Given 6 arrows and 2 charges, when firing 1 Frost and 1 Kiln, then 4 arrows and 0 charges remain and selection reverts to Standard.
2. Given 2 charges and streak 1.3, when Gale misses, then 1 charge remains, score is 0, and streak resets to 1.0.
3. Given a slider and streak 1.4, when a perfect-release Frost hits at 2.0 s, then score is 0, streak stays 1.4, and position holds until 3.8 s.
4. Given a pop-up with 0.5 s left up, when Frost hits at 1.0 s, then it stays hittable until 3.3 s.
5. Given a frosted slider (or static ring/shade) and streak 1.3, when Frost hits it, then no freeze applies, score is 0, streak resets to 1.0, and 1 charge is spent.
6. Given 4.0 m/s right wind, when Gale and Standard fire identically at 20 m, then Gale uses 2.0 m/s lateral wind.
7. Given a 20 m ring at max streak 2.0, when a perfect-release Gale hits 100, then score is 200 (`(60 + 20) × 2.0 × 1.25`).
8. Given a 20 m ring at streak 1.0, when Gale hits 40 (no perfect release), then score is 60 and streak rises +0.1; on a 20 m value-100 shade at streak 2.0, score is 160.
9. Given a 20 m slider frozen at 2.0 s and max streak 2.0, when Gale hits 100 at 2.8 s (no perfect release), then score is 160 and freeze still ends at 3.8 s.
10. Given an intact clump hiding a shade and streak 1.4, when a perfect-release Kiln hits it, then the clump clears for the stage, the shade stays unharmed and exposed, score is 0, and streak stays 1.4.
11. Given an exposed shade or cleared clump spot and streak 1.4, when Kiln hits it, then the shade stays unharmed, score is 0, streak resets to 1.0, and 1 charge is spent.
