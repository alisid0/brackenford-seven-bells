# World Concept Comments (`ce8dd14`)

## SEEN
- **world-1-background.jpg:** Low view of an empty meadow framed by foreground pink blossom trees and petals; left lake and jetty (no path), right arched bridge over a creek that vanishes mid-lane, far-right huts/watchtower, purple mountains, no rail/targets/board.
- **world-2-layout.jpg:** High overview without pink trees; narrow pale-green lane runs from a rail across a blue creek (3 near targets, 4 staggered clumps; 1 far target), striped stall and jetty path bottom-left, solid plum board and striped pennant bottom-right.
- **world-3-overall-look.jpg:** First-person view behind the rail with gloved hand, bow, and red-tipped arrow; 2 targets, 1 centre clump with plum ember-eyed hare, cream 3-star banner overlapping the pennant pole on the right, no pink trees, no stall.

## AGREEMENT
- **Between pictures:** Pink trees/petals appear only in 1; stall and jetty path only in 2; scoreboard is solid plum in 2, cream banner over the pennant in 3, absent in 1; creek vanishes mid-lane in 1.
- **Against brief:** Picture 2's lane looks ~8–10 m wide (not 16 m), lacks lane terracing, and stops near 50 m.

## PLAY
- **Bounds (`Stages.md`):** Stages reach 60–70 m (`Long wind`, `Master of the line`) and ±5.5–7 m (`Creepers`, `Bolt`); picture 2's lane is too short and narrow.
- **Creek at 35 m:** Collides with 35 m targets (`Gusts`, `Master of the line`) and puts blue water behind 30–35 m targets, hiding Rime's sky-blue bracket.
- **Grass & Kiln:** Staggered clumps do not match `Creepers` (3 horizontal clumps at 15 m and 23 m); decorative side tufts (picture 3) invite wasted Kiln charges.
- **Wind:** Picture 3 hides the pennant pole behind the scoreboard, hurting Gale wind-reads.

## VR AND QUEST
- **Costly / uncomfortable:** Cast ground shadows across all three (disabled on Quest—use vertex-tinted facets); close foreground trees in 1 risk VR clipping; keep water opaque single-mesh to avoid overdraw; keep rail low (~0.85 m) and forward for seated draw.
- **Cheap depth:** Lane terraces, left lake, right bridge, watchtower rise, and purple mountain layers give strong stereo parallax cheaply.

## PALETTE
- Picture 3's **red arrowhead** breaks the reserved red/ember danger rule (use neutral grey). Picture 2's solid plum board breaks the cream-cloth UI rule.
- **Pink blossom trees:** Keep 2–3 in mid-ground flanks (matching the style sheet), clear of the line and target backdrops; drop loose ground petals.

## CHANGES
1. Widen and extend picture 2's clear lane to **75 m × 16 m** (18 m tree-free) for all `Stages.md` distances and sweeps.
2. Shift the creek to **37–39 m** with a raised green terrace behind it so 30–35 m targets stay dry and off blue water.
3. Show lane grass clumps as stage-spawned only and remove look-alike side tufts so Kiln targets stay clear.
4. Add 3–4 visible lane terraces so distance reads without cast shadows.
5. Separate the wind pennant from the cream-cloth scoreboard and keep the rail low/forward for seated VR.
6. Align views and palette: mid-ground pink blossom trees, stall/jetty path, grey arrowhead.

## VERDICT
Do not build from `world-2-layout.jpg` until the lane reaches 75 m × 16 m, the creek moves off 35 m, and misleading grass tufts and shadows are removed.
