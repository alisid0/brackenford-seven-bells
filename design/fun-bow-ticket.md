# Ticket for Gemini: the fun bow (bow and arrow, third version)

From Claude, on the developer's word (25 November), after trying the game:

> "the arrow is too big i would say our aim is not to mimic the archery games, it is to make it fun so smaller bow gives that hand freedom, based on that ask gemini to create the new mechanics and game engine"

So the goal changes. Version 2 (`bow2`, your `design/arrow-mechanics-v2.md`) made the bow more like a real one: real gravity, a full draw fitted to the arm, a long anchor at the cheek. The developer wants the opposite direction: **a small, light bow that leaves the hands free and makes shooting fun, not a simulation.** Keep what in version 2 serves fun (the jerk-free release, the haptics), and rethink the rest.

Branch `gemini/fun-bow` cut from `release-prep`. Write `design/fun-bow.md`. **Design only; no game code**: Claude builds it behind a new switch (`bow3` / `?bow3=1`) so it can be compared in the lab (`?lab=1`) with the other two.

## What exists today (from `src/game.js`)

| Thing | Today |
|---|---|
| Bow | About 1.2 m tip to tip (limbs reach 0.6 m above and below the grip), a longbow |
| Arrow | Shaft 0.62 m long, 9 mm thick, a 9 cm head, three fletchings |
| Draw (version 1) | Nothing at 12 cm from the bow hand, full at 52 cm |
| Draw (version 2) | Full at 44 to 68 cm, fitted to the player's eye height |
| Speed | 24 to 62 m/s (v1), 18 to 62 m/s on a curve (v2) |
| Gravity | 7 (v1), 9.81 with air (v2) |
| Targets | 10 to 34 m in Bell Watch; 10 to 45 m in the 17 release stages; up to 70 m in the extra stages |

## Rule on each, with numbers Claude can build without guessing

1. **Size.** The bow's height, the arrow's length and thickness, and how both sit in the hand. It must still read as a bow and arrow at a glance, and still be easy to see in a headset. Say what "smaller" is in metres.
2. **Draw.** How far the string hand travels from none to full. Short enough that the hands stay free and the arms never strain; long enough that drawing still feels like something. Whether draw length still depends on the player's size at all. Whether a short flick can shoot (a quick snap shot) as well as a full draw.
3. **Flight.** Speed, gravity and any air, chosen for fun: how much arc, how much the player must aim above a target at 10, 20, 30 and 45 m. If the arc should be flatter or the arrow faster than real, say so. Check that every release stage and Bell Watch still play (they were placed for version 1).
4. **Forgiveness.** Anything that makes hitting feel good without feeling automatic: a gentle magnetism near a target or shade, a larger hit area than the drawn one, or none. Numbers, and a limit so it never plays itself.
5. **Pace.** How fast a player can shoot again: any delay between arrows, whether the next arrow appears on the string by itself, rapid shots in Bell Watch.
6. **Feel.** What makes each shot satisfying: sound, haptics (your table can be reused or changed), the arrow's flight looks, the hit. Fun first.
7. **Hands.** With a small bow, does either hand get new freedom (for example, the bow hand free to point, or the draw usable at any angle, low or across the body)? Rule on what is allowed and what the controller buttons do; keep your settled map from section 8 of v2 unless you change it on purpose.
8. **The engine.** The core loop as a short set of rules Claude can build as one switch: what happens from taking the bow to the arrow landing, in order, with every number in one table.
9. **How to judge it in the lab.** What the developer should feel and what the read-out should show, compared with v1 and v2.

Limits: carefree (no harm to the player, no lost points); the world never moves under the player in a headset (25 November rule); buildable in a web page on a Quest. If two answers are both sound, give both and say which you would ship. Commit as `Gemini 4 Neon <gemini@noreply.invalid>` and push only `gemini/fun-bow`.
