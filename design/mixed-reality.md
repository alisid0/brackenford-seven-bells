# Mixed Reality Exploration: *The Silent Peal*

> **Status: Experimental design note only — not a release promise.** Per standing rules (`Arcade-plan.md`, `Asset-and-XR-list.md`), no Arcade or MR code is written before the first headset playtest of Trials is reviewed. MR sits behind its own switch after Trials and Arcade (Update 1). **Zero Quest Browser MR capabilities are assumed here**; every API below is listed strictly as a capability to verify in Quest Browser documentation and on real Quest hardware.

## 1. Four Mixed-Reality Concepts (Tied to *The Silent Peal*)

| Concept | Real Room Seen | What of Brackenford Enters | What You Shoot | Session | Why Better in MR Than VR |
|---|---|---|---|---|---|
| **A · The Belfry Window** *(wall portal)* | Whole room, floor, and furniture stay visible; player faces one wall. | A timber-framed forked-belfry window (`~3.0 × 2.4 m`) opens flush on the chosen wall onto any of the 6 valley places at full `10–70 m` depth. | Normal Trials stages, Daily Watch, or Score Attack through the wall opening, plus the ceremonial arrow to ring the place's distant bell. | `2–10 min` | Real floor and walls eliminate height/drop vertigo on Quarry/Stormcrest while turning a small room into an impossible deep valley view. |
| **B · Bell in the Room** *(room-scale watch)* | Whole room; player stands facing the longest clear wall (`≥ 2.5–3.5 m` away). | One silent, thorn-bound storm bell (`0.65 m` rim) hangs inside your room (`~2.6 m` ahead); dark-plum thorn cracks split the forward wall. | Shade crows bursting out of cracks in your real wall before they re-bind the bell; clearing a wave snaps the thorns so you shoot the hanging bell bronze/gold. | `60–90 s` per watch (`2–5 min`) | Physical thrill of shooting a full-size storm bell hanging in your own living room as crows break through *your* wall. |
| **C · The Valley Tabletop** *(living relief map)* | Whole room centered on a real dining/coffee table (or `1.2 × 0.8 m` clear floor patch). | The Overlook relief map manifests at `1:40` scale (`~1.2 × 0.8 m`) on your real table with all 6 miniature stations and tiny forked belfries. | From `1.5–2.0 m` back and slightly above (slower scaled mini-arrows `~12 m/s`), pluck circling mini shade crows and tap unlocked mini bells to play the C5–C6 valley peal. | `2–4 min` | Real furniture anchors diorama scale, invites leaning around the valley, and fits small rooms or seated play without a `3 m` wall lane. |
| **D · Bellwarden's Trophy Wall** *(our addition — home rack & warm-up)* | Whole room; one wall holds your quiet Brackenford corner. | Your earned keepsakes, embroidered bell-ribbons, miniature restored bells (`C5–C6`), and one hanging straw practice butt (`0.5 m`) mount on your wall. | Warm-up arrows at the wall target, free pentatonic chime-shots on your earned bells, or shoot a bell plaque to launch straight into that place's VR stage. | `1–3 min` | Turns *The Silent Peal* progression into a tangible trophy wall in your room and makes 90-second headset pickups effortless without booting a full world. |

## 2. Device & Browser Capabilities to VERIFY (Not Confirmed Facts)

Claude must verify every row below against **Quest Browser's own WebXR documentation** and **on physical Quest hardware** (`navigator.xr.isSessionSupported`, feature-request try/catch, and live session check).

| Capability to Verify | A · Window | B · Bell in Room | C · Tabletop | D · Trophy Wall | Fallback If Missing or Denied |
|---|---|---|---|---|---|
| **Passthrough session** (`immersive-ar` + alpha canvas + `local-floor` floor alignment, `M1/M2/M4`) | **Must-have** | **Must-have** | **Must-have** | **Must-have** | Hide MR option entirely (`M1`); fall back cleanly to standard VR (`M3`). |
| **Hit testing** (`hit-test` ray onto real wall/table/floor, `M6`) | Nice-to-have | Nice-to-have | **Must-have** *(or touch fallback)* | Nice-to-have | 1-tap manual placement: point gaze or touch controller to wall/tabletop and press trigger to lock plane/distance. |
| **Plane / mesh detection** (`plane-detection` / `mesh-detection` via Room Setup, `M5`) | Nice-to-have | Nice-to-have | Nice-to-have | Nice-to-have | Use a single user-placed flat virtual wall (`3.0 m` ahead) or manual tabletop rectangle; never require Room Setup scan to start. |
| **Anchors** (`anchors`, session-local & persistent, `M7`) | Nice-to-have | Nice-to-have | Nice-to-have | **Must-have** *(persistent)* | Session-only fallback: pin to `local-floor` origin + one-button Recenter (`D` degrades from persistent wall to 2-second placement on launch). |
| **Depth / occlusion** (`depth-sensing` so real furniture/people hide game objects, `M8`) | Nice-to-have | Nice-to-have | Nice-to-have | Nice-to-have | Keep `B/D` spawns in open air (`y ≥ 1.2 m`, forward cone only, never behind furniture); frame `A` flush on wall; warn player to clear tabletop in `C`. |
| **Hand tracking in AR** (`hand-tracking`, `V3`) | Nice-to-have | Nice-to-have | Nice-to-have | Nice-to-have | Standard Quest controllers (two-handed or single-handed draw, `V2`). |

*Design rule:* Requiring plane/mesh detection or depth-sensing as a hard must-have breaks on unscanned rooms and unverified browser APIs. Every concept except `D`'s cross-day persistence must remain playable on **bare `immersive-ar` + `local-floor` + 1-tap manual placement**.

## 3. Safety & Comfort in a Real Room

Arrows are virtual, but a two-handed draw sweeps **`~0.75 m` forward** and **`~0.45 m` back** (`~1.2 m` arm span plus torso twist) next to solid walls, TVs, lamps, and ceiling fans.

| Area | Rule |
|---|---|
| **Play-space minimum** | Stationary **`1.8 × 1.8 m` clear arm-swing zone** (`≥ 1.0 m` clear radius around body, `≥ 2.3 m` ceiling clearance) plus `≥ 2.0 m` open sightline to the chosen forward wall. Seated play allowed if arms clear desk and armrests. Zero stepping or chasing (`design/vr-stand-rules.md`, `M10`). |
| **Target bounds vs walls** | **Forward `±35°` arc only** (never behind or directly beside the archer — prevents rapid spins into furniture). Minimum distance **`≥ 2.0 m`** in `B/D` (`≥ 1.5 m` in `C`) so players never punch toward a real wall or screen. Keep room-scale targets **`y ≥ 1.2 m`** in `B/D` (no low floor lunges). |
| **People & pets walking through** | Without verified `depth-sensing`, virtual art draws *over* a person walking in front of the wall. Keep **`≥ 60%` of peripheral view raw passthrough** (never cover multiple walls); keep `B` spawns above `1.2 m` (above pet height); zero jump-scares rushing at the face; provide a **one-button Veil/Pause** (Menu/`B`) that hides all game meshes instantly. |
| **Lighting & legibility** | Require even indoor lighting (dim rooms add passthrough grain and tracking drift; bright uncovered windows or glossy TVs wash out targets). Add subtle contact shadows (`M9`) and thin dark-timber backing rims behind cream (`#f6e6bd`) banners/ribbons so UI stays readable against pale walls. |
| **Pre-start briefing** | Shown once per MR entry before the first arrow: *(1) Check 1 m around your arms and overhead — real walls and furniture are solid. (2) Stay in one spot; targets appear only ahead of you. (3) Watch for people and pets — virtual objects may draw over them. (4) Press Menu/B anytime to hide the game or return to VR.* |

## 4. Scoring & Fairness Across Different Rooms

Every real room has different wall distance (`2.2 m` vs `5.5 m`), clutter, and real-world interruptions (pets, family), which breaks two core rules from `Arcade-plan.md`: distance-weighted scoring (`+ distance in metres`) and zero-pause uninterrupted runs.

| Mode | Comparable / Seeded? | Scoring Rule |
|---|---|---|
| **B · Bell in Room / C · Tabletop / D · Trophy Wall** | **No** (room geometry & short-range flight vary) | **Kept strictly apart** in `mr:<concept>` local records. Use wave clears, accuracy %, and bell-ring medals instead of competitive distance points. If a seeded MR daily drill is ever added, clamp virtual spawn radius to a fixed distance (`2.5 m` for `B`, `1.6 m` for `C`) regardless of room depth. |
| **A · The Belfry Window** | **Mathematically comparable** (if stance is fixed `2.0 m` behind window and `10–70 m` targets are measured from `(0, 0)` stance) | **Still stored under a separate MR input tag** (`vr-two-hand-mr` / `vr-one-hand-mr`), never mixed with full-VR Arcade or Trials leaderboards, because peripheral passthrough, comfort, and the `3.0 × 2.4 m` aperture alter sightlines and real-room interruptions still apply. |

**Standing rule:** MR never unlocks or overwrites VR/desktop Trials stars, Arcade personal bests, or future global leaderboards.

## 5. First Prototype Recommendation & Hardware Gate

- **Prototype first: `B · Bell in the Room`** *(reversing `Asset-and-XR-list.md` L255's earlier "Window first" note, which predated `The Silent Peal`)*.
  - **Why `B` beats `A` as the first technical spike:** `A · The Belfry Window` requires a stereo depth/stencil portal-mask box so the `70 m` valley does not bleed across your real walls and floor. `B` requires **zero portal masking**: start an `immersive-ar` session with transparent clear-alpha, hide sky/terrain, and place objects directly in room space. It proves real-room spatial feel and *The Silent Peal*'s signature beat immediately with minimal code. *(If `B` passes hardware verification, `A · The Belfry Window` is the logical Step 2 to unlock full-distance stages.)*
- **Smallest slice ("one bell, one crow, one wall"):**
  - User faces a clear wall and presses trigger once to place a flat virtual wall mark at `3.0 m` ahead (uses `hit-test` if verified, otherwise fixed `3.0 m` on gaze) and hang **1 silent thorn-bound bell** at `2.6 m` ahead (`y = 2.0 m`).
  - **1 shade crow** glides out of a dark-plum wall crack across a `±1.2 m` arc (`y = 1.5–2.2 m`, `≥ 2.2 m` away). Shooting `3` crows snaps the bell's thorns and flips it bronze/gold; **1 arrow into the bell** swings it, unties its cream-red ribbon, emits flat cream-gold ripple chevrons, and rings `523 Hz (C5)`.
- **What it reuses:** Existing WebXR rig, two-handed/one-handed bow draw, arrow physics, shade crow mesh/banish burst, `src/game.js` bell swing + `bellSound()`, and `design/theme.md`'s silent→restored state flip. **Zero new Tripo assets.**
- **Estimated size:** **`S–M`** (~150–250 lines behind `mr` flag in `src/config.json`: `M1` capability check, transparent AR renderer toggle, 1-tap wall placement, short-range crow path, safety card, clean VR/flat exit).
- **Hardware Gate (must ALL be true on a real Quest before showing anyone):**
  1. `M1` check hides MR cleanly on unsupported browsers and enters passthrough cleanly when supported.
  2. Real room passthrough holds **≥ 72 fps** with transparent game background, correct stereo scale, and zero black-sky leak.
  3. Floor alignment (`local-floor`) matches the real floor within `±3 cm`, and the hanging bell does not noticeably drift over 5 minutes.
  4. Short-range (`2.2–3.0 m`) draw, arrow hit-detection (no fixed-step tunneling at `62 m/s`), crow banish, and bell ring work reliably both standing and seated.
  5. Safety card shows first; all spawns remain within `±35°`, `≥ 2.0 m`, `y ≥ 1.2 m`; one-button Veil/Exit returns cleanly to VR/menu with zero leaked WebXR state.
  6. Verified by the developer in two lighting setups (daylight room and evening lamp).

## 6. Plain Talk for the Developer: Cost & Risk

- **Browser WebXR MR is the highest-risk surface in the project:** Quest Browser's WebXR MR stack (`immersive-ar`, `hit-test`, `plane-detection`, `anchors`, `depth-sensing`) trails native Quest apps, changes across OS updates, and cannot be verified in automated desktop tests. Treat every API beyond basic passthrough as unreliable until proven on your own headset.
- **Real rooms multiply QA cost `3–5×`:** One clean demo in your living room is cheap (`S–M`); supporting dim bedrooms, bright windows, small desks, unscanned rooms, and pets walking through is slow, manual headset QA that competes directly with polishing the 6 VR places and Arcade.
- **Short-range archery changes core feel:** Our `62 m/s` bow was tuned for `10–70 m` arcs (`0.16–1.1 s` flight). Across `2.5 m` in a room, an arrow arrives in `~0.04 s` (almost instant laser-tag), so room-scale MR needs separate velocity/feel tuning (`B/C`) or stays a novelty unless paired with `A`'s full-distance window.
- **Safety optics:** Bow drawing is a wide, forceful indoor gesture; one mis-placed side target can send a player's controller into a TV or lamp.
- **Recommended guardrail:** Keep MR strictly **after Trials launch and Arcade (Update 1)** behind its own switch. Time-box the `Bell in the Room` spike to **1–2 days on Quest hardware**. If Quest Browser lacks stable `immersive-ar` + `local-floor`, drops under `72 fps`, or feels gimmicky in your real room, **park MR immediately** and put that effort into the six VR places and Arcade.
