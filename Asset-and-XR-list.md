# Bow & Shadow: asset list and VR / mixed-reality element list

For review by ChatGPT. This is a planning list only. Nothing here is made before the Trials release is stable, and nothing is generated in Tripo until the style sheet exists. It replaces the older `assets/Asset-list.txt`, which described gentle spirits.

Tripo credits available: about 3,090. Cost used below: about 110 per rigged creature, 90 per static prop (model plus retopology).

**Route** says how each asset is made:
- **Tripo**: ChatGPT concept image, then Tripo, then Blender scripts.
- **Code**: built from shapes in the game's code or by Blender script. Free, exactly on palette, and best for anything thin, repeated or simple.
- **Have**: already in the game.

The developer has asked for Tripo to be used as widely as is useful. Where this list still says Code, the reason is given. ChatGPT is asked to challenge any of those choices.

**When** uses the agreed roadmap: U2 visual polish, U3 bows and shop, U4 shades that fight back, U5 boss, Later.

---

## Part 1. Assets

### A. Bows

| # | Asset | Route | When | Notes |
|---|---|---|---|---|
| A1 | Training bow | Have | Launch | Straight wooden bow, handed grip |
| A2 | Hunter's recurve | Tripo | U3 | Faster draw, lighter arrow drop |
| A3 | Vale longbow | Tripo | U3 | Longest range, slow draw |
| A4 | Thornwood bow | Tripo | U3 | Grown from shade-thorn; dark wood, ember veins |
| A5 | Bellwarden's bow | Tripo | U5 | Ornate reward for the boss; brass and blossom |
| A6 | Bow string, grip wrap, arrow rest | Code | U3 | Must move with the draw and mirror for left-handed players, so they stay in code and attach to every bow |

Each Tripo bow is the wooden body only, drawn unstrung-looking, side view, perfectly straight and symmetrical so it can be mirrored. Tripo: 4 bows, about 360 credits.

### B. Arrows and archery gear

| # | Asset | Route | When | Notes |
|---|---|---|---|---|
| B1 | Standard arrow | Have | Launch | |
| B2 | Bodkin arrow | Code | U3 | Heavy; less affected by wind |
| B3 | Swift arrow | Code | U3 | Light; flatter flight |
| B4 | Ember arrow | Code | U3 | Glowing head; bonus against shades |
| B5 | Bell arrow | Code | U4 | Rings on landing; startles or lures shades |
| B6 | Tracer arrow | Code | U3 | Leaves a visible trail; a practice aid |
| B7 | Quiver | Tripo | U3 | Worn at the hip or shoulder; where the hand takes an arrow |
| B8 | Arm guard and glove | Tripo | Later | Seen on the player's hands in VR |

Arrows stay in code because an arrow is a thin shaft seen from 20 metres or flying past: Tripo adds triangles and nothing visible. Types are told apart by head shape, fletching colour and trail. Tripo: 2 items, about 180 credits.

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
| D2 | Winged shade (crow or owl) | Tripo, rigged | U2 | Airborne; perches and flushes |
| D3 | Shade fox | Tripo, rigged | U4 | Fast and low; weaves through cover |
| D4 | Shade boar | Tripo, rigged | U4 | Armoured front; must be hit from the side |
| D5 | Shade stag | Tripo, rigged | U4 | The first that fights back: hurls thorns from its antlers |
| D6 | Shade heron or toad | Tripo, rigged | Later | Lives on the water; surfaces briefly |
| D7 | Boss: the Hollow Stag | Tripo, rigged | U5 | Large; weak points that open and close |

Tripo: 7 creatures, about 770 credits, with the boss likely to need a second attempt.

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
| H7 | Bow and arrow rack | Tripo | U3 | Where bows are chosen by hand in VR |
| H8 | Great bell and frame | Tripo | U5 | The Seven Bells of the world's name |
| H9 | Ruined arch | Tripo | U2 | Far landmark |
| H10 | Watchtower, walls | Have | Launch | Hidden in the release; used by the adventure |

Tripo: 4 items, about 360 credits.

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
| Bows | 4 | 360 |
| Gear | 2 | 180 |
| Creatures | 7 | 770 |
| Ground, trees, water | 4 | 360 |
| Range and buildings | 4 | 360 |
| **Total** | **21** | **2,030** |

That leaves about 1,000 credits for retries, which experience says will be needed.

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

Recommended order: the window first, since it reuses every existing stage and keeps real archery distances.

---

## Questions for ChatGPT

1. Are any assets missing, or any here not worth making?
2. Do you agree with which assets go through Tripo and which stay in code? The developer prefers Tripo where it helps.
3. Is the shade family right (hare, winged, fox, boar, stag, water creature, Hollow Stag boss)?
4. Which five arrow types are worth keeping? Fewer may be better.
5. Which mixed-reality idea should the prototype try first?
6. For the style sheet: which three assets should define the look? Suggested: the standing hare, the Thornwood bow and the market stall.
