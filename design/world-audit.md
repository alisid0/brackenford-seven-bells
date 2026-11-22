# World Layout Audit (`42ec015`)

## SEEN
- **world2-above.jpg:** High view of 16 m lane, straight creek bar stopping short of left lake, 4 terraces, climbing wall left, stall right, cream board inside lane, roaming targets right.
- **world2-side.jpg:** Side view showing a green tree growing through the footbridge, creek ending dead in grass, 17 m terraces overhanging the lane, two blossom trees.
- **world2-line.jpg:** Line view: climbing wall clipping the lane's left edge, rail over old posts, orange pennant left, cream board right, roaming targets off-right.
- **world2-player-near.jpg:** Stage 1 (`First marks`): clean lawn, grey-tipped arrow, cream board right, orange pennant left, two blossom trees, two bell beams, floating lantern.
- **world2-player-far.jpg:** Stage 20 (`Master of the line`): 35 m pop-up clear of creek, 70 m slider on terrace 3, bell beams and lantern visible.
- **world2-player-grass.jpg:** Stage 23 (`Horns in the grass`): six clumps on bare lawn; right-most clump crowds the scoreboard's lower-left corner.

## MATCHES
- Levelled 16 m × 76 m lane (`src/game.js` L76, L83–90) fits 70 m stages and ±7 m sweeps (`Bolt`, `Creepers`) with instanced grass cleared inside `inLane` (L254).
- Creek at 38 m clears 35 m targets; 4 terraces (`41/52/63/74 m`, L96), two `#F299B5` blossom trees, 0.85 m rail, and cream board (L420) match `world-2-layout-v2.jpg`.

## FAULTS
1. **Scoreboard in lane (`src/game.js` L423):** At `(11, 6.5)` (4.8 m wide), it intrudes into the 16 m lane, blocking right-edge `Bolt` (`12 m, +7 m`) and crowding `Creepers` (`15 m, +5.5 m`); move outside `right > 8`.
2. **Tree in footbridge (`src/game.js` L143, L410):** `inYard` stops at `b < 12`, while the bridge sits at `right = 13.5`, putting a trunk through it (`world2-side.jpg`).
3. **Stage 11 (`Far and small`, 40 m) pinch (`src/game.js` L400, L403):** Creek sand ends at 40.0 m and terrace 1 rises at 41 m, wedging the 40 m stand on the bank edge.
4. **Pennant in lane (`src/game.js` L549):** Stands at `(5, -4.6)` inside ±8 m instead of outside left.
5. **Terrace overhang & test gap (`src/game.js` L78, L96, L403):** 17 m terraces (`41–80 m`) exceed `inLane` (16 m × 76 m), allowing grass on `76–80 m`; `tests/world2.html` never asserts zero lane grass.
6. **Creek bar & splash (`src/game.js` L399, L1506):** 54 m water box stops short of the lake and kicks dirt (`p.y < 0` check) instead of splashing.

## GAPS
1. Hide roaming clutter in range mode (bell beams, floating lantern, roaming targets, climbing wall clipping the lane, old line posts).
2. Connect creek to left lake; add jetty, dirt path, and far village/watchtower landmarks per `world-2-layout-v2.jpg`.
3. Restyle pennant to red-cream outside the lane; verify 0.85 m rail seated on Quest.

## VERDICT
Solid base behind `?world=2`, but fix the in-lane scoreboard, tree-in-bridge collision, 40 m bank pinch, and roaming clutter before treating it as playable.
