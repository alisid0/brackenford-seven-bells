# Bow & Shadow: asset list and VR / mixed-reality element list

Revision 2, incorporating ChatGPT's review of 21 November 2026. This is a planning list only. Nothing here is made before the Trials release is stable, and nothing is generated in Tripo until the style sheet exists. It replaces the older `assets/Asset-list.txt`, which described gentle spirits.

Tripo credits available: about 3,090. Cost used below: about 110 per rigged creature, 90 per static prop (model plus retopology).

**Route** says how each asset is made:
- **Tripo**: ChatGPT concept image, then Tripo, then Blender scripts.
- **Code**: built from shapes in the game's code or by Blender script. Free, exactly on palette, and best for anything thin, repeated or simple.
- **Have**: already in the game.

The routes below are agreed with ChatGPT: Tripo for distinctive creatures and forms, code for anything thin, repeated, simple, or that the hand must hold or pivot precisely.

Every brief for an asset states its **scale** (real size in metres), **pivot** (the point it stands on or is held by), **forward axis**, and any **attachment points** (where a string, grip, hand or perch meets it).

**When** uses the agreed roadmap: U2 visual polish, U3 bows and shop, U4 shades that fight back, U5 boss, Later.

---

## Part 1. Assets

### A. Bows

| # | Asset | Route | When | Notes |
|---|---|---|---|---|
| A1 | Training bow | Have | Launch | Straight wooden bow, handed grip |
| A2 | Hunter's recurve | Code | U3 | Built from the present bow's geometry. Faster draw, lighter arrow drop |
| A3 | Vale longbow | Code | U3 | Built from the present bow's geometry. Longest range, slow draw |
| A4 | Thornwood bow | Tripo | U3 | Grown from shade-thorn; dark wood, flat ember-coloured veins (coloured, not glowing) |
| A5 | Bellwarden's bow | Tripo | U5 | Ornate reward for the boss; brass and blossom |
| A6 | Bow string, grip wrap, arrow rest | Code | U3 | Must move with the draw and mirror for left-handed players, so they stay in code and attach to every bow |

Every bow shares the same attachment points: grip centre, arrow rest, and the two string nocks. Each Tripo bow is the wooden body only, drawn in side view, straight and symmetrical so it can be mirrored, then fitted to those points. Tripo: 2 bows, about 180 credits.

### B. Arrows and archery gear

| # | Asset | Route | When | Notes |
|---|---|---|---|---|
| B1 | Standard arrow | Have | Launch | |
| B2 | Bodkin arrow | Code | U3 | Heavy; less affected by wind |
| B3 | Swift arrow | Code | U3 | Light; flatter flight |
| B4 | Ember arrow | Code | Deferred | Bonus against shades; waits until there is a clear need |
| B5 | Bell arrow | Code | U4 | Rings on landing; startles or lures shades |
| B6 | Tracer arrow | Code | U3 | Leaves a visible trail; a practice aid |
| B7 | Quiver | Tripo | U3 | Worn at the hip or shoulder; where the hand takes an arrow |
| B8 | Arm guard and glove | — | Deferred | Only if headset testing shows they help |

Arrows stay in code because an arrow is a thin shaft seen from 20 metres or flying past: Tripo adds triangles and nothing visible. Types are told apart by head shape, fletching colour and trail. The five kept are Standard, Bodkin, Swift, Bell and Tracer. Arcade uses the standard arrow and one fixed bow in its first ruleset. Tripo: 1 item (the quiver), about 90 credits.

### C. Arrows landing: one behaviour per surface

Not models, but each needs an effect and a sound.

| Surface | What the arrow does | Effect |
|---|---|---|
| Target | Sticks, quivers | Chips, score pop-up (have) |
| Ground and grass | Sticks at an angle | Puff of dust, grass flick |
| Tree and wood | Sticks, quivers | Bark chips, knock sound |
| Stone | Glances off and drops | Spark, clatter |
| Water | Vanishes | Splash ring, plop |
| Shade | Passes into it | Burst of ember and smoke (have, to be refined) |
| Bell | Bounces | Ring, shimmer |

### D. Creatures (all shades are corrupted woodland creatures)

| # | Asset | Route | When | The aiming problem it poses |
|---|---|---|---|---|
| D1 | Shade hare, standing | Tripo, rigged | U2 | Small; sits, creeps, bolts |
| D2 | Shade crow | Tripo, rigged | U2 | Airborne; perches, takes off, glides |
| D3 | Shade fox | Tripo, rigged | U4 | Fast and low; weaves through cover |
| D4 | Shade boar | Tripo, rigged | U4 | Armoured front; must be hit from the side |
| D5 | Shade stag | Tripo, rigged | U4 | The first that fights back: hurls thorns from its antlers |
| D6 | Water shade | Tripo, rigged | Deferred | Waits until a stage needs its brief surfacing window |
| D7 | Boss: the Hollow Stag | Tripo, rigged | U5 | Large. Must not read as a bigger D5: a different silhouette (hollow ribcage, broken crown of antlers) and weak points that visibly open and close |
| D8 | Shade perch (post, branch) | Have, to restyle | U2 | Where the crow sits; one reusable piece |
| D9 | Concealment bush and tall grass | Have, to restyle | U2 | Where shades hide |

Tripo: 6 creatures, about 660 credits, with the boss likely to need a second attempt.

Two checks apply to every moving creature:
- **Hit area:** the invisible shape that scores a hit must agree with the visible body in every pose, at normal shooting distances.
- **Visibility:** the ember eyes remain the only marker. Eyes and silhouette are tested in tall grass and against shaded scenery at the intended distances. If a shade disappears, lighting, placement or eye contrast is tuned first; outlines stay ruled out.

### E. Ground and grass

| # | Asset | Route | When | Notes |
|---|---|---|---|---|
| E1 | Terrain, paths | Have | Launch | |
| E2 | Grass clumps, tall grass | Have | Launch | Many copies; must stay very cheap |
| E3 | Wildflowers, three colours | Code | U2 | Scattered in hundreds |
| E4 | Mushroom ring | Code | U2 | |
| E5 | Rocks and boulders, three shapes | Code | U2 | Low-poly rocks are quick and consistent in code |
| E6 | Fallen log, tree stump | Have / Code | U2 | |
| E7 | Thorn bramble (shade corruption) | Tripo | U2 | The mark of the shades; reused wherever they appear |
| E8 | Blighted ground patch | Code | U4 | Dark soil and dead grass around corruption |

Tripo: 1 item, about 90 credits.

### F. Trees

| # | Asset | Route | When | Notes |
|---|---|---|---|---|
| F1 | Blossom tree, standard | Code | U2 | Dozens are needed; scripted trees stay cheap and matching |
| F2 | Oak, pine, sapling | Code | U2 | |
| F3 | The great blossom tree | Tripo | U2 | One landmark tree beside the range |
| F4 | Corrupted tree | Tripo | U4 | Twisted, thorned, ember hollows |
| F5 | Falling petals | Code | U2 | A light effect, limited in number |

Tripo: 2 items, about 180 credits. Tripo handles trunks well and foliage badly, so both are drawn with chunky, solid leaf masses.

### G. Water

| # | Asset | Route | When | Notes |
|---|---|---|---|---|
| G1 | Lake surface | Have | Launch | |
| G2 | Reeds, lily pads | Code | U2 | |
| G3 | Stepping stones | Code | U2 | |
| G4 | Wooden jetty | Code | U2 | Planks and posts |
| G5 | Small rowing boat | Tripo | Later | A drifting platform for targets |
| G6 | Floating target buoy | Code | Later | Bobs with the water |
| G7 | Waterfall and cliff | Code | U2 | Far landmark |

Tripo: 1 item, about 90 credits.

### H. The range and buildings

| # | Asset | Route | When | Notes |
|---|---|---|---|---|
| H1 | Ring targets, sliders, pop-ups | Have | Launch | |
| H2 | Scoreboard, signs, guide board | Have | Launch | |
| H3 | Fence, banners, target stands, backstop | Code | U2 | Simple and repeated |
| H4 | Straw target butt | Code | U2 | |
| H5 | Lanterns, barrels, crates | Code | U2 | |
| H6 | Market stall | Tripo | U3 | The shop |
| H7 | Bow and arrow rack | Code | U3 | Where bows are chosen by hand in VR; scripted so hand positions are exact |
| H8a | Great bell | Tripo | U5 | The Seven Bells of the world's name |
| H8b | Bell frame | Code | U5 | Scripted so the bell's pivot is exact |
| H9 | Ruined arch | Tripo | U2 | Far landmark |
| H10 | Watchtower, walls | Have | Launch | Hidden in the release; used by the adventure |

Tripo: 3 items, about 270 credits. The stall and the arch go through Tripo only if their silhouettes survive retopology; otherwise they are scripted.

### I. Effects and interface

| # | Asset | Route | When |
|---|---|---|---|
| I1 | Hit chips, streak, pop-up numbers | Have | Launch |
| I2 | Shade banish burst, ember eyes | Have | Launch |
| I3 | Surface effects from part C | Code | U2 |
| I4 | Arrow trails per arrow type | Code | U3 |
| I5 | Coin, star, medal icons | Code | U3 |
| I6 | Thorn projectile and its warning glow | Code | U4 |
| I7 | Boss weak-point glow | Code | U5 |

### J. Sound

Not made in Tripo, but needed: bow creak and release for each bow, arrow flight, one landing sound per surface in part C, a call and an alert sound per shade, the bells, wind, water, birdsong, a short results fanfare, and music for the title and the boss. The present sounds are made in code. Recorded or generated sound needs its own licence check.

### Tripo total

| Group | Items | Credits (about) |
|---|---|---|
| Bows | 2 | 180 |
| Gear | 1 | 90 |
| Creatures | 6 | 660 |
| Ground, trees, water | 4 | 360 |
| Range and buildings | 3 | 270 |
| **Total** | **16** | **1,560** |

That leaves about 1,500 credits for retries, which experience says will be needed. Deferred and not counted: the water shade (110) and the glove and arm guard (90).

---

## Part 2. VR elements

| # | Element | State | Notes |
|---|---|---|---|
| V1 | Immersive VR session in Quest Browser | Built, untested on hardware | |
| V2 | Controller play: two-handed and single-handed draw | Built, untested on hardware | |
| V3 | Hand tracking: draw with pinch or fist | Built, untested on hardware | |
| V4 | Left- and right-handed bow and grip | Built, untested on hardware | |
| V5 | Scoreboard, signs and first-stage guide in the world | Built, untested on hardware | |
| V6 | Replay with fade and return to the line | Built, untested on hardware | Comfort to be confirmed |
| V7 | Frame counter | Built | |
| V8 | Vibration: string tension, release, hit | To check | Tension that rises with the draw is the strongest single improvement to feel |
| V9 | Height and seated play | Needed | Recentre and adjust so the range suits any height, sitting or standing |
| V10 | Pause and menu inside VR | Needed | A wrist or bow-mounted menu; no pause during Arcade runs |
| V11 | Taking an arrow from the quiver | Needed, U3 | A reach to hip or shoulder; optional, since instant arrows are less tiring |
| V12 | Choosing bows and arrows by hand | Needed, U3 | Lift a bow from the rack |
| V13 | Sound placed in space | Needed | Hear where a shade is before seeing it |
| V14 | Arcade display | Needed, U1 | Timer, wave and arrows readable without looking away |
| V15 | Dodging and a hit warning | Needed, U4 | Lean or step aside; a clear warning and no sudden flashes |
| V16 | Comfort settings | Needed | Fade strength, replay off, text size, dominant hand, seated mode |
| V17 | Performance controls | Needed | Target 72 frames a second; lower resolution automatically if frames drop |
| V18 | Recovery | Built in part | Headset off and on, lost controller, leaving and re-entering VR |
| V19 | Guardian and space | Needed | Play is stationary; nothing may ask the player to step far or turn fast |

### VR presence: places that only feel right in a headset

The developer's direction: the game should use what VR is uniquely good at, the feeling of really being somewhere. Height, depth and water do this best. The core stays the bow, with little walking, so these are **shooting positions**, reached by a fade or a few steps, not long journeys. All of it is after release.

| # | Place | The feeling | How it plays | Needs |
|---|---|---|---|---|
| P1 | Watchtower top | Standing high, looking down on the range | **Prototype first.** Two or three targets below, from a fixed railed deck. Owns the steep downward shots | Tower exists (hidden in release); a railing |
| P2 | Cliff ledge above the vale | A wide view with a real drop at your feet | Long shots across the valley. Targets and wind cues must read clearly before wind or distance is raised | Cliff, ledge, low wall |
| P3 | Rope bridge over a gorge | Height on both sides | A fixed shooting deck; the ropes, banners and water move, the floor does not. Targets within a comfortable forward arc | Bridge (code), gorge |
| P4 | Creek crossing | Running water close by | **Second to build; the first water place.** Two fixed shooting spots with a fade between them; the plank bridge may be walked where the room allows. Stepping stones are scenery | Creek, stones, plank bridge (code) |
| P5 | Jetty on the lake | Water all around | Shoot from the jetty; distant boats and floating targets bob. Shooting from a boat waits until a moored version has been tested on Quest | Jetty (G4), boat (G5) |
| P6 | Under the great blossom tree | Looking up through branches, petals falling | The low-height showcase. Perched targets above and ahead, never a long steep upward aim | Great tree (F3) |
| P7 | Bell tower | The highest point | Chapter finale: the bell framed across a gap with the valley beyond | Bell (H8) |

Comfort rules for all of these (reviewed by ChatGPT; still proposals until tested on a Quest):
- **Height comfort is a real low route.** Switched on, the stage uses a lower platform, or a solid floor that hides the drop. Target order and difficulty stay about the same. If a ranked mode ever uses these stages, the two versions are scored separately.
- **The shooting surface and the viewpoint never move.** Sway and bob apply to scenery only, and can be switched off. A steady railing and horizon give the eyes a reference.
- **Moving between spots is a fade by default.** "Short walk" means real steps within the player's own space. There is no stick-driven walking in these stages.
- **A railing at every drop.**
- **Seated play is checked from seated eye height:** the nearest target visible over the rail, room to draw without reaching through it, the same targets and scoring.

Four settings, grouped as **VR Comfort** on the title menu:

| Setting | Options |
|---|---|
| Play posture | Standing / Seated |
| Height comfort | On / Off |
| Scenery sway | On / Off |
| Move between spots | Fade / Short walk |

New code-made pieces these need: railing, rope bridge, plank bridge, stepping stones, gorge and cliff terrain, creek water. None needs Tripo.

## Part 3. Mixed-reality elements

Mixed reality is an experiment behind its own switch. Nothing is promised until it has run on a real Quest. Every item marked "to confirm" depends on what the Quest Browser allows.

| # | Element | State | Notes |
|---|---|---|---|
| M1 | Capability check | Needed first | Ask the browser whether a passthrough session is offered; show the option only if it is |
| M2 | Passthrough session | To confirm | The real room shown behind the game |
| M3 | Switch between VR and mixed reality | Needed | From the title card; falls back to VR if refused |
| M4 | Floor alignment | To confirm | Game floor matched to the real floor |
| M5 | Finding walls, floor and tables | To confirm | Needs the room set-up done on the headset |
| M6 | Placing things on real surfaces | To confirm | Point at a wall or table to place a target |
| M7 | Things staying where they were put | To confirm | So targets do not drift during or between sessions |
| M8 | Real objects hiding game objects | To confirm | A shade passing behind your sofa; costly, and optional |
| M9 | Lighting and contact shadows | Needed | Soft blob shadows so objects sit in the room |
| M10 | Safety | Needed | Stationary play, nothing behind the player, the room always visible |

Three ways to play in a room, to be chosen after the prototype:

| Idea | What the player sees | Difficulty to build |
|---|---|---|
| **The window** | A wall of the room opens onto the Brackenford range at full distance | Lowest; the existing stages work unchanged |
| **Targets in the room** | Rings and small shades float and perch around the real room | Medium; needs short-range stage design |
| **Shades in your home** | Shades creep out from behind real furniture | Highest; needs room understanding and occlusion |

**Agreed: the window first, after release.** The prototype is one stationary lane at the usual shooting distance. Before anything more is built it must show, on a real Quest: passthrough working, the floor aligned, comfortable aiming, and a clean return to VR. What the Quest Browser allows, and whether placed things stay put, are still unverified.

---

## Answered in review
ChatGPT's answers to the six questions are folded in above: routes agreed with changes to bows, rack and bell; the shade family kept with a crow and the water shade deferred; five arrows kept and Ember deferred; the window as the first mixed-reality prototype; and the standing hare, Thornwood bow and market stall as the three style-sheet assets.
