# Special Arrows Re-Audit (`9c58806` / `d3808cd`)

## TARGETED CHECKS
- **`specialHit` (`src/game.js` L988–995) — PASS:** L991 adds `(!t.pop||t.up)`, blocking freezes on folding pop-ups. `tests/arrows.html` L52 now asserts `t.lag` in `(1.75, 1.85)` and L55–57 test a folding pop-up directly.
- **`kilnClear` (`src/game.js` L997–1005) — PASS:** L1000–1002 expose both hiding (`sp.clump===c`) and nearby non-bird shades (`!sp.bird&&hyp(...)<.85`), clearing `sp.sunk` and restoring `hitMesh`. `tests/arrows.html` L85–88 verify a paused creeper rises immediately.
- **Kiln in `stepArrows` (`src/game.js` L1438–1443) — MINOR FAULT:** L1440–1442 fix Case 10 (`tests/arrows.html` L83–84 pass), but L1442 omits `&& !sp.bird` (present at L1000). On a mixed stage such as `Blighted meadow`, striking an airborne winged shade passing within 0.85 m horizontally of a grass clump redirects the hit to clear the clump below instead of failing as an invalid hit.

## OTHER PRIOR ITEMS — PASS
- Case 8 under-cap 40-ring hit and streak increment added (`tests/arrows.html` L75–76, L111).
- Case 9 verifies exact capped score (`tests/arrows.html` L47–48).
- Release flag guard fixed (`src/game.js` L951 `!RELEASE&&(...)`).
- Nocked-arrow colour band added (`src/game.js` L959–963, L1176).

## VERDICT
All 11 acceptance cases pass; add `!sp.bird` at `src/game.js` L1442 and the v1 special-arrows trial build is ready for headset testing.
