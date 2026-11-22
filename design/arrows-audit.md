# Special Arrows Audit (`075a027`)

## ACCEPTANCE CASES
1. **PASS** — `src/game.js` L885, L999–1000; `tests/arrows.html` L29–32 verify 2 shared charges, arrow decrement, and revert to Standard.
2. **PASS** — `src/game.js` L1000, L1023; `tests/arrows.html` L34–35 verify miss spends 1 charge, scores 0, and resets streak to 0.
3. **PASS** — `src/game.js` L985–988, L1168–1169; `tests/arrows.html` L37–41 verify 0 score, streak preserved, and 1.8 s slide hold.
4. **FAIL** — `src/game.js` L985 omits `t.up`, so hitting a folding pop-up (L1426 `rotation.x >= -0.6`) freezes it down; `tests/arrows.html` L52 allows `t.lag > 1.4` and never verifies total up-time.
5. **PASS** — `src/game.js` L985–988, L1000 block repeat/static/shade freezes; `tests/arrows.html` L43, L54–58 pass but omit mid-freeze repeat and charge checks on static/shade.
6. **PASS** — `src/game.js` L1423 applies `0.5×` wind; `tests/arrows.html` L60–64 verify ratio within 0.03 of 0.5.
7. **PASS** — `src/game.js` L1031–1033 cap ring at 60 with 2× streak and 1.25× perfect; `tests/arrows.html` L66–69 verify exact score.
8. **UNTESTED** — `src/game.js` L1031–1033 handle under-cap rings, but `tests/arrows.html` L70–71 only test the shade half; 40-ring hit from streak 0 is missing.
9. **PASS** — `src/game.js` L1027, L1031 score Gale without ending hold; `tests/arrows.html` L48 only asserts `<= cap`, not exact 60-cap score.
10. **FAIL** — `src/game.js` L1427 distance-orders grass vs shade (`k.distance<=contact.distance`) instead of grass-first; L993 + L852 leave paused creeping shades sunk after clump clear.
11. **PASS** — `src/game.js` L985–988, L1427 (`c.visible`) and `tests/arrows.html` L77–82 verify exposed shade untouched, 0 score, streak reset, and charge spent.

## DEVIATIONS
- **Streak unit:** `src/game.js` L1032–1033 tracks hit count (`0` = 1.0×, `5` = 1.4×) rather than multiplier; math matches spec.
- **Flag guard:** `src/game.js` L951 (`!!CONFIG.arrows || ...`) would enable special arrows in release if `config.json` set `arrows: true`; should also require `!RELEASE`.
- **Gale bullseye feedback:** Capping `ring` to 60 (`src/game.js` L1031) suppresses gold burst and bullseye replay (`L1036`, `L1040`). Acceptable, but undocumented.

## GAPS
- **Selection controls:** Spec omitted controls; keep `1–4` desktop (`L1562`), VR left-stick up/down (`L1705`), and `!charging` lock, and add nocked-arrow tip/fletching colour to `preview` (`L1335`) so VR players see selection without reading text.
- **Post-hit physics & replay:** Keep invalid Rime/Kiln tumbling past shades (`L1456`) and sticking in rings (`L1455`), and keep 0-point specials excluded from final-arrow replay (`L975`).
- **Rounding:** Keep `Math.round` on distance and points (`L1031`, `L1033`).

## VERDICT
Do not treat this build as passing until Case 10 (grass-first Kiln priority and paused-creeper exposure), Case 4 (`t.up` guard and strict 1.8 s test), and Case 8's missing under-cap ring test are fixed.
