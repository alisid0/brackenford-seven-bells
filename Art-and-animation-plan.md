# Bow & Shadow: look, assets, animation and gameplay plan

For review by the developer and ChatGPT. Nothing here changes the seven-day release: that ships with the art it has. This plan starts the day after.

## 1. Ground rules
- **The headset sets the limits.** Everything must hold 72 frames a second on a standalone Quest.
- **One pipeline, proven once already:** ChatGPT image, Tripo model, Tripo retopology and rig, Blender scripts, game.
- **One style.** Flat-shaded low-poly, one flat colour per face, no textures.
- **Nothing is "done" until it has been seen in a headset.**
- **Each asset passes a gate before the next step costs anything.**

## 2. How the game should look

Target: the approved ChatGPT concept (warm light, a green vale, pink blossom, red and cream banners, a striped stall, dark thorn shades with ember eyes), drawn in the game's flat low-poly style. The concept is a painting; the game will match its colours, shapes and layout, not its soft lighting or fine detail.

| Element | Now | Target |
|---|---|---|
| Palette | Greens, browns, a few accents | A locked palette of about 24 colours taken from the concept; every asset snapped to it |
| Light | One sun, one sky light, fog | The same, warmer; a late-afternoon setting for the range |
| The range | Posts, a board, bare ground | Fence, banners, target stands, a backstop, blossom trees framing the lane |
| Shades | Dark purple, ember eyes | Unchanged; they are the visual signature |
| Far background | Hills and fog | A waterfall cliff and a ruin as landmarks |
| Feedback effects | Chips, streak, pop-up numbers | The same, recoloured to the palette |

Rules that keep it consistent:
- Shades are the only dark, saturated things in the scene, so they always read against the meadow.
- Nothing but a shade's eyes and the hit effects glows.
- Silhouette first: every creature must be recognisable as a black shape at 20 metres.

## 3. Graphics limits (per frame, on Quest)

| Budget | Limit |
|---|---|
| Triangles on screen | about 200,000 |
| Draw calls | about 120 |
| Animated creatures at once | 6 |
| Bones per creature | 30 (boss 60) |
| Transparent surfaces | water, hit effects, eye glow only |
| Textures | none on models; canvas text for boards and signs |
| Shadows | none real-time |

Triangle budgets per asset: small creature 1,500–3,000; standard creature 3,000–5,000; boss 10,000–15,000; bow 2,000–3,000; props 300–1,500.

These are starting figures. The first headset frame-rate reading replaces them with measured ones.

## 4. Asset creation

### The pipeline, with its gates

| Step | Who | Output | Gate before moving on |
|---|---|---|---|
| 1. Brief | Claude | One line: what it is, size, budget, poses needed | Developer agrees it is needed |
| 2. Concept | ChatGPT | One object, neutral standing pose, three-quarter view, white background, in the style sheet's look | Developer approves it beside the other approved concepts |
| 3. Model | Tripo, image-to-3D | Raw model (about 55 credits) | Looks like the concept from all sides |
| 4. Retopology | Tripo | Model at its triangle budget (about 35 credits) | Silhouette intact |
| 5. Rig | Tripo, creatures only | Skeleton (about 20 credits) | Skeleton inspected: spine, head and limbs sensible |
| 6. Conversion | Claude, Blender scripts | Flat-coloured game file, colours snapped to the palette | Pose sheet looks right |
| 7. In game | Claude | Asset placed, animated, tested | Automated animation checks pass |
| 8. Headset | Developer | Seen at 5, 15 and 30 metres | Readable, no stutter |

Lessons already learned and built into this:
- Raw Tripo models have about two million triangles; always retopologise.
- Draw creatures standing neutrally. The hare was drawn sitting and so runs sitting.
- Tripo's four-legged rigs can be wrong (it merged the hare's forelegs); inspect before building on one.
- Tripo gives no animation clips.
- Export needs the paid plan, and the browser sessions for ChatGPT and Tripo must be signed in on the home computer.

### Style control
- **One style sheet** made first by ChatGPT: palette swatches, three example assets, the lighting. Every later request refers to it, in one conversation.
- **One fixed ending on every prompt:** style, view, background, no shadow, no text.
- **Palette snapping in Blender,** by script, so drift in generated colours is corrected automatically.
- **A contact sheet of all approved assets,** regenerated whenever one is added, to catch anything that does not belong.

### What to make, in order

| Priority | Asset | Rigged | Why |
|---|---|---|---|
| 1 | Shade hare, redrawn standing | Yes | Fixes the running pose; the main creature |
| 2 | Winged shade | Yes | Replaces the code-made stand-in |
| 3 | Range dressing: banner, fence, target stand, blossom tree | No | The largest change in first impression |
| 4 | Market stall | No | Needed for the shop |
| 5 | Three bows | No | Needed for upgrades |
| 6 | Boss shade | Yes | End of the chapter |
| 7 | First enemy that fights back | Yes | Opens the adventure |

Grass, bushes, posts, logs, terrain, sky, water, targets and signs stay code-made.

Estimated Tripo cost: about 110 credits per creature, 90 per prop; roughly 1,000 credits for this whole list, of about 3,000 available.

## 5. Animation

### Approach
All creature movement is written in code and drives the skeleton directly. No recorded clips. This is already working for the hare. It costs nothing per animation, varies endlessly, and never repeats exactly. Recorded clips (Mixamo) become an option only when two-legged enemies arrive.

### Structure for every creature
- **States:** appear, idle, alert (looking at the archer), move, flee, struck, banished.
- **Layers, added together:** body movement (gait), head and eyes (looking), secondary motion (ears, tail, wings), reactions (flinch, rear up).
- **Blending:** every change of state eases over a fraction of a second; nothing snaps.
- **One description per creature** listing its bones by role (spine, head, ears, legs, wings, tail), so the same animation code serves any creature with those parts.

### Animation set

| Creature | Movement | Signature |
|---|---|---|
| Shade hare | Sit, creep, bound | Turns its head to you, eyes flare, ears prick |
| Winged shade | Perch, take off, flap, glide, bank | Head tracks you from the post; wings fold |
| Boss shade | Loom, stride, rear, roar | Weak points that open and close |
| Enemy archer (later) | Aim, loose, duck | A visible tell before it shoots |

## 6. Randomising animation

The aim is that no two creatures move alike and no creature repeats itself, without ever making a shot unfair.

| What varies | How |
|---|---|
| Timing | Each creature starts its cycles at its own point |
| Pace | Speed varies by up to a fifth, per creature and per journey |
| Size of movement | Bound height, ear sway, wing depth each vary a little |
| Idle behaviour | Chosen from a weighted list (ear twitch, head scan, sniff, scratch, settle), each with a rest period so it does not repeat at once |
| Looking | When it looks, how long, and how far it turns |
| Routes | Where it goes next, how long it pauses, whether it feints |
| Character | A few fixed traits per creature (bold or shy, restless or still) that tilt all of the above |

Two kinds of randomness, kept apart:
- **Cosmetic** (twitches, sway, timing of idles): free to vary in every mode.
- **Movement that affects aiming** (routes, speed, when it moves): drawn from a seeded generator, so a stage or an Arcade run can be reproduced exactly. In Score Attack, every player gets the same movement.

## 7. Testing animation

### Automated, on every build
- **Sanity:** no bone ever holds an invalid number; no joint turns past its stated limit.
- **Skin:** in every state, no vertex strays further from the skeleton than its limit (catches tearing and "exploding" meshes).
- **Feet:** distance covered matches the gait, within a tolerance (catches sliding).
- **Blending:** no joint jumps more than a set angle in one frame when the state changes.
- **Reproducibility:** the same seed gives the same movement.
- **Soak:** each creature run for the equivalent of ten minutes at varied frame rates, with random state changes, with none of the above failing.
- **Cost:** six creatures animating together stay inside the frame budget on desktop, as an early warning.

### Visual, generated for review
- **Pose sheet:** every state of every creature in one picture (this exists for the hare).
- **Strip:** eight frames across one cycle of each movement, to judge the motion without a headset.
- **Turntable:** the creature from eight sides, to catch faults invisible from the front.
These are made by the test tooling and sent to the developer and ChatGPT with each new creature.

### In the headset, by the developer
- Readable at 5, 15 and 30 metres?
- Does the movement tell you what it will do next?
- Can you tell two creatures apart by how they move?
- Anything that looks broken, floaty or stiff?
- Frame rate with the busiest stage.

## 8. Gameplay

| Stage | Content | Depends on |
|---|---|---|
| Release | Trials: 17 stages, stars, guided start | Headset playtest |
| Update 1 | Arcade: Score Attack and Endless, local bests | Trials stable |
| Update 2 | Art pass: standing hare, winged shade, dressed range | Sign-in for ChatGPT and Tripo |
| Update 3 | Coins that matter: stall, three bows, upgrades | Bows and stall modelled |
| Update 4 | Shades that fight back, with slow, dodgeable shots; a health rule | Enemy modelled; comfort tested |
| Update 5 | Boss | Boss modelled |
| Later | The adventure: hub, missions, further regions; global scores | All of the above |

How creatures shape play:
- Each creature poses one aiming problem (small, hidden, fast, airborne, armoured).
- Its animation announces its behaviour: a head turn before it moves, a crouch before it bolts, a wing lift before it flies.
- Difficulty is tuned from playtest records per stage (finished, stars, too easy or too hard), not from opinion.

## 9. Who does what

| Person | Responsibility |
|---|---|
| Developer | Approves concepts and names; signs in to ChatGPT and Tripo on the home computer; tests in the headset; makes final calls |
| ChatGPT | Style sheet and concept images; reviews plans and results |
| Claude | Code, pipeline scripts, animation, tests, builds; reports plainly what was and was not checked |

## 10. Order of work after release
1. Style sheet and locked palette.
2. Animation test tooling (so every later creature is checked the same way).
3. Standing hare through the full pipeline, replacing the sitting one.
4. Winged shade.
5. Range dressing.
6. Arcade, if not already shipped.
7. Stall and bows, then the shop.

## 11. Open decisions
- Final name, after an availability check.
- Licence terms for AI-made assets: confirm for Tripo and OpenAI before anything is sold.
- Whether the home computer's browser stays signed in to ChatGPT and Tripo, or the Claude extension is connected to Chrome, so asset work is not blocked by the developer being away.
- Whether shades should stay hare-shaped once enemies that fight back arrive.
