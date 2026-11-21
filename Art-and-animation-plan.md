# Bow & Shadow: look, assets, animation and gameplay plan

Status: approved by the developer and ChatGPT with four refinements, all incorporated below (revision 2). Nothing here changes the seven-day release: that ships with the art it has. No gameplay or asset work from this plan starts until the release is stable.

## 1. Ground rules
- **The headset sets the limits.** Everything must hold 72 frames a second on a standalone Quest.
- **One pipeline for creatures and complex props, proven once already:** ChatGPT image, Tripo model, Tripo retopology and rig, Blender scripts, game. Simple props are made in code or by Blender script instead.
- **Shades are corrupted woodland creatures,** mysterious and thorned, never ordinary goblins. Every future enemy and boss follows from that.
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

## 3. Graphics budgets (provisional; per frame, on Quest)

These are working guesses, not limits. Measured frame time on the real headset decides the final figures.

| Budget | Provisional figure |
|---|---|
| Triangles on screen | about 200,000 |
| Draw calls | about 120 |
| Animated creatures at once | 6 |
| Bones per creature | 30 (boss 60) |
| Transparent surfaces | water, hit effects, eye glow only |
| Textures | none on models; canvas text for boards and signs |
| Shadows | none real-time |

Triangle budgets per asset: small creature 1,500–3,000; standard creature 3,000–5,000; boss 10,000–15,000; bow 2,000–3,000; props 300–1,500.

What gets measured on the headset, and replaces the table above:
- Frame time on the busiest stage (target: under 13.9 ms, which is 72 frames a second), average and worst.
- Cost of procedural animation: frame time with 0, 3 and 6 creatures animating.
- Cost of transparency: frame time with and without water, eye glow and hit effects in view.
- Browser overhead: the same scene with nothing moving, as the floor the Quest Browser itself sets.

The first source is the Day 1 playtest (`?fps=1`). A finer profiling page, switching each of these on and off, is built after release if the playtest figures are not enough.

## 4. Asset creation

### Which route an asset takes
- **Tripo route:** distinctive creatures and complex props whose shape is hard to describe in code (shades, boss, possibly the stall).
- **Code or Blender-script route:** simple low-poly props (banners, fences, target stands, trees, posts). Faster, free, and exactly on palette. A prop moves to the Tripo route only if the scripted version does not look good enough in the headset.

### The Tripo pipeline, with its gates

| Step | Who | Output | Gate before moving on |
|---|---|---|---|
| 1. Brief | Claude | What it is, triangle budget, poses needed, scale, pivot, forward axis, attachment points | Developer agrees it is needed |
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
- Four-legged creatures and birds need different poses and rigs. Quadrupeds: all four legs apart and visible. Birds: both legs visible, wings half open and clear of the body. Which Tripo rig preset suits a bird is not yet known and is tested on the crow.
- Tripo's four-legged rigs can be wrong (it merged the hare's forelegs); inspect before building on one.
- Tripo gives no animation clips.
- Export needs the paid plan, and the browser sessions for ChatGPT and Tripo must be signed in on the home computer.

### Style control
- **One style sheet** made first by ChatGPT: palette swatches, three example assets, the lighting. Every later request refers to it, in one conversation.
- **One fixed ending on every prompt:** style, view, background, no shadow, no text.
- **Palette snapping in Blender,** by script, so drift in generated colours is corrected automatically.
- **A contact sheet of all approved assets,** regenerated whenever one is added, to catch anything that does not belong.

### What to make, in order

| Priority | Asset | Route | Rigged | Why |
|---|---|---|---|---|
| 1 | Shade hare, redrawn standing | Tripo | Yes | Fixes the running pose; the main creature |
| 2 | Shade crow | Tripo | Yes | Replaces the code-made stand-in. Wing joints and a simple flap test are approved before the rig is built on |
| 3 | Range dressing: banner, fence, target stand, blossom tree | Code or Blender script | No | The largest change in first impression |
| 4 | Market stall | Script first; Tripo if it falls short | No | Needed for the shop |
| 5 | Bows | Recurve and longbow in code from the present bow; Thornwood and Bellwarden's through Tripo | No | All fitted to the same grip, rest and string points |
| 6 | Boss shade | Tripo | Yes | End of the chapter |
| 7 | First shade that fights back | Tripo | Yes | Opens the adventure |

Grass, bushes, posts, logs, terrain, sky, water, targets and signs stay code-made.

The full list, with every route and the credit estimate (about 1,560 of about 3,090), is in `Asset-and-XR-list.md`, which is the authority where the two documents differ.

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
| Shade that fights back (later) | Bristle, rear, hurl a thorn, shrink away | A visible tell before it attacks |

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

A seed alone is not enough; the movement must also be the same at any frame rate. Rules for competitive modes:
- Gameplay movement is advanced in fixed steps (for example 1/90 of a second) driven by the run clock, or is a pure function of the run clock. It never depends on how long a frame took.
- Random numbers for gameplay are drawn per event (a new route, a pause, a feint), never per frame, and from a generator that cosmetic animation cannot touch.
- What is drawn on screen is smoothed between steps, so it looks fluid at any frame rate without changing where the target truly is.
- Cosmetic variation uses its own separate generator and may differ on every device.

This matches the run clock already specified in `Arcade-plan.md`.

## 7. Testing animation

### Automated, on every build
- **Sanity:** no bone ever holds an invalid number; no joint turns past its stated limit.
- **Skin:** in every state, no vertex strays further from the skeleton than its limit (catches tearing and "exploding" meshes).
- **Feet:** distance covered matches the gait, within a tolerance (catches sliding).
- **Blending:** no joint jumps more than a set angle in one frame when the state changes.
- **Reproducibility:** the same seed gives the same movement, and gives it at 30, 72 and 120 frames a second and with uneven frames: every target is in the same place at the same run-clock time.
- **Isolation:** changing the cosmetic seed never changes gameplay movement.
- **Soak:** each creature run for the equivalent of ten minutes at varied frame rates, with random state changes, with none of the above failing.
- **Hit area:** in every pose, the scoring shape stays within a set distance of the visible body.
- **Cost:** six creatures animating together stay inside the frame budget on desktop, as an early warning.

### Visual, generated for review
- **Pose sheet:** every state of every creature in one picture (this exists for the hare).
- **Strip:** eight frames across one cycle of each movement, to judge the motion without a headset.
- **Turntable:** the creature from eight sides, to catch faults invisible from the front.
These are made by the test tooling and sent to the developer and ChatGPT with each new creature.

### In the headset, by the developer
- Readable at 5, 15 and 30 metres, including in tall grass and against shaded scenery, by eyes and silhouette alone?
- Does the movement tell you what it will do next?
- Can you tell two creatures apart by how they move?
- Anything that looks broken, floaty or stiff?
- Frame rate with the busiest stage.

## 8. Gameplay

| Update | Content | Purpose | Depends on |
|---|---|---|---|
| Launch | Trials: 17 stages, stars, guided start | Publish the existing game | Headset playtest |
| Update 1 | Arcade: Endless and Score Attack, local records | Replayability | Trials stable |
| Update 2 | Improved hare, winged shade, range dressing | Visual polish | Style sheet; sign-in for ChatGPT and Tripo |
| Update 3 | Three bows, coins, equipment upgrades | Progression | Bows and stall made |
| Update 4 | Shades that shoot back, slow and dodgeable; a health rule | Combat depth | Enemy modelled; comfort tested |
| Update 5 | First boss | Adventure foundation | Boss modelled |
| Later | Mixed reality, global leaderboards, expanded world | Growth | See below |

Arcade is the first gameplay update. Art work may run alongside it only where it does not delay it. Mixed reality can come earlier if its prototype works on Quest hardware. Global leaderboards follow once score validation and the online service are ready.

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
Before any of this: finish the Trials playtest, collect Quest performance figures and gameplay feedback, fix blockers, release.

Main line (nothing below may delay the step above it):
1. Arcade (Update 1), following `Arcade-plan.md`.
2. Standing hare through the full pipeline, replacing the sitting one.
3. Winged shade.
4. Range dressing, in code or Blender script.
5. Bows and stall, then the shop.

Alongside, only when it costs the main line nothing:
- Style sheet and locked palette, made with ChatGPT Images. This needs the developer and ChatGPT, not coding time, so it can be done while Arcade is being built. It must exist before the next Tripo creature is generated.
- Animation test tooling, which shares its seeded, fixed-step movement with Arcade and so is partly built by step 1 anyway.

## 11. Open decisions
- Final name, after an availability check.
- Licence terms for AI-made assets: confirm for Tripo and OpenAI before anything is sold.
- Whether the home computer's browser stays signed in to ChatGPT and Tripo, or the Claude extension is connected to Chrome, so asset work is not blocked by the developer being away.

Decided: shades remain mysterious corrupted woodland creatures (hare, winged, and later forms such as stag, boar or owl), not goblins or human enemies. Which woodland creature the first shade that fights back is based on is still to be chosen.
