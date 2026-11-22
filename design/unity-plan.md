# Unity Quest Plan: *Bow & Shadow* (*Bell Watch* + Trials)

> **Status: Plan only — no Unity project work started yet.** Written so the developer can decide when and how far to take a native Unity Quest build alongside the Three.js / WebXR game.

---

## 1. Unity Version, Render Pipeline & Quest XR Packages

An early Unity project shell already exists at `BrackenfordSevenBells/` (`ProjectVersion.txt` = `6000.6.7f1`, containing `inputsystem`, `xr.management`, `xr.openxr`, and `xr.hands`).

| Layer | Recommendation | Notes |
|---|---|---|
| **Unity Editor** | **Unity 6 (`6000.x` LTS / `>= 6000.1`)** | Matches existing `BrackenfordSevenBells/` shell and required by `create-xr`, OpenXR Quest optimizations, and URP Render Graph. |
| **Render Pipeline** | **URP (`com.unity.render-pipelines.universal`)** | Single-Pass Instanced stereo, Vulkan, Fixed Foveated Rendering, MSAA `4×`, flat-shaded unlit/lit-simple materials (zero real-time shadows), optional light bloom on ember eyes / bell gold only if `≥ 72 fps` holds. |
| **XR Core** | `com.unity.xr.management`, `com.unity.xr.openxr`, `com.unity.inputsystem` | Android build profile with Meta Quest Support feature group; let Package Manager resolve compatible versions (never hard-pin versions). |
| **Quest Native & MR** | `com.unity.xr.meta-openxr` | Native Meta Quest features, haptics, and — when ready — native Passthrough, Scene/Room Mesh, and Spatial Anchors. |
| **XR Rig & Hands** | `com.unity.xr.interaction.toolkit`, `com.unity.xr.hands` | Stationary `XR Origin` (`Floor` tracking origin), near/far/UI ray interaction for the 2.4 m cloth menu, plus optional bare-hand draw parity. |
| **GLB Import** | `com.unity.cloud.gltfast` | Imports `assets/glb/*.glb` directly with metre scale, `y`-up pivots, `bell`/`flag` child nodes, and palette-named PBR materials ready to remap. |

---

## 2. Carries Over Unchanged vs Must Be Rewritten in C#

| Carries Over Unchanged (From This Repo) | Must Be Rewritten in C# (Unity Native) |
|---|---|
| All design specs (`design/bell-watch.md`, `theme.md`, `theme-look.md`, `world-plan.md`, `place-plans.md`, `vr-stand-rules.md`, `small-specs.md`, `mixed-reality.md`). | **Bow & arrow ballistics:** two-handed/one-handed/hand draw, string flex, `v0 = 62 m/s`, `g = 7 m/s²`, wind drift, `0.85–1.3 s` perfect-release pulse, and Quest controller haptics. |
| **All code-built 3D props** exported via `node tools/export-glb.mjs` into `assets/glb/*.glb` + `manifest.json` (plain palette-named materials, exact metres, articulated `bell` & `flag` children). | **Shades & procedural animation:** hare lope/bound/crouch + ears-toward-bell tell, crow perch/flush/cross, `Bell Watch` bell-approach & band-binding, banish bursts. |
| **Reduced rigged creature meshes** from Tripo→Blender (`shade-hare-standing`, future crow/ram) once exported as `.glb`/`.fbx`. | **Modes & rules:** `Bell Watch` (180 s carefree wave loop, infinite arrows, bell clear + `+100` bonus, streaks 5/10/20) and 17/29 Trials stages, ribbons, special arrows (`Rime`/`Gale`/`Kiln`). |
| **All numeric data:** locked palette hexes, 29 stage definitions, `STAR_AT`, ribbon rules, `Bell Watch` wave/scoring constants, Willowbank lighting (`120° L, 28°`) & linear fog (`95–360 m`). | **Menus, saves & audio:** 2.4 m world-space cloth banner (XR UI ray), scoreboard cloth, shootable signs, `VR Comfort` toggles, local JSON save (`persistentDataPath`), and spatialized `AudioSource` / bell `C5–C6` peal. |

---

## 3. Keeping Web (Three.js) and Unity From Drifting

1. **One shared data folder (`data/`):** Pull shared constants out of `src/game.js` into plain JSON files (`palette.json`, `stages.json`, `watch.json`, `tuning.json`, `willowbank.json`) read by **both** `src/build.mjs` (inlined into the HTML build) and Unity (`StreamingAssets` / `TextAsset` C# deserializers). Zero hand-copied numbers.
2. **One prop source (`src/props.js` → `tools/export-glb.mjs`):** Code props are authored once in `src/props.js` and exported to `assets/glb/*.glb` + `manifest.json`. A tiny Unity `AssetPostprocessor` automatically maps every `<paletteName>_<hex>` material to a shared flat-shaded URP material library on import.
3. **Milestone sync, not daily parity:** Keep the **browser build (`release-prep`) as the fast daily design & automated-test lab**. Port to Unity only at completed stage gates (`Block-out → Art → Lighting → Animation → Polish`) after the developer signs off on Willowbank, so we never debug unstable mechanics twice.

---

## 4. What Unity Makes Easier vs What It Costs

| Easier in Unity (Than Browser WebXR) | What Unity Costs |
|---|---|
| **Real Mixed Reality on Quest:** First-class Meta OpenXR Passthrough, Scene/Room Mesh, Spatial Anchors, and Depth Occlusion — none of Quest Browser's WebXR API gaps. | **Two codebases:** Every gameplay script, shade AI, and UI flow must be built and maintained in C# as well as JS. |
| **Performance & Visual Headroom:** Native Vulkan + Single-Pass Instanced + Foveated Rendering holds `72–90 fps` easily, with room for crisp URP lighting, subtle glow on ember eyes/gold pulses, richer haptics, and true spatial audio. | **Slower build & test loop:** Editor imports, C# recompiles, and Android APK builds + USB sideloads take minutes vs a 2-second browser reload; automated Playwright tests do not run on APKs (Unity needs Editor PlayMode tests). |
| **Store Distribution & Native Polish:** Direct Meta Horizon Store APK release, offline launch, native Guardian/Recenter/sleep handling. | **Toolchain & Store Overhead:** Requires Unity 6 + Android SDK/NDK/OpenJDK (`~15–20 GB`) locally, plus Meta Horizon Store VRC compliance (entitlement, 72 fps profiling, store art). |

---

## 5. First Unity Milestone (Small Enough to Judge)

**Goal:** One playable **Willowbank *Bell Watch* Vertical Slice** APK on Quest — no menus, no 17 stages, no ribbons, no special arrows, no other places, no MR yet.

1. **Scene:** Willowbank Range assembled from `assets/glb/*.glb` (`deck`, `rail`, `belfry-restored` + 3 toggleable thorn bands + swinging `bell`, `hut-0..2`, `watchtower`, `footbridge`, `jetty`, `wind-pennant`, `blossom-tree`, `market-stall`), simple terraced ground/creek, fixed Stage 3 sun (`120° L, 28°`) and linear fog (`95–360 m`).
2. **Bow & Rig:** Stationary Quest `XR Origin` (`Floor`), straight bow + arrow flight (`62 m/s`, `g = 7 m/s²`), controller draw-tension & release haptics.
3. **Core Loop:** One rigged shade hare (`shade-hare-standing`) spawning and making for the Practice Bell; arriving snaps a thorn band (`0..3`); shooting a hare banishes it for points; shooting the bell rings `523 Hz`, swings `bell`, drops all bands, and flashes the 3 chevrons. Infinite arrows, 180 s clock, world-space score cloth + shootable `AGAIN`.

**Decision gate (developer on Quest):** Does the native APK hold `≥ 72 fps` and feel materially better in draw, haptics, and visuals than Quest Browser? If **yes**, expand to full *Bell Watch*, Trials, and native MR; if **no**, keep shipping the web version alone.

---

## 6. What I (Gemini) Can and Cannot Do on My Machine

| Can Do Right Now | Cannot Do Today (Honest Limits) |
|---|---|
| Author Three.js props in `src/props.js` and export round-trip verified `.glb` + `manifest.json` (`tools/export-glb.mjs`, Node `v22.17.0`). | **No Unity Editor or `unity` CLI is installed locally yet** (`C:\Program Files\Unity\Hub\Editor` is currently empty; `unity` CLI not on PATH) — cannot open the Editor, import `.glb`s, compile C#, or build an Android `.apk` until Unity Hub + Unity 6 + Android Build Support (SDK/NDK/OpenJDK) + `unity` CLI are installed. |
| Author shared `data/*.json` schemas, Unity C# gameplay/XR scripts, URP shaders, and `AssetPostprocessor` material-remap scripts using the installed Unity plugin skills (`using-unity`, `create-xr`, `craft-game-floors`, `urp-postprocessing`). | **No Blender or Python locally** — Tripo-to-Blender model reduction and rigging (`shade-hare-standing`, crow, ram) remain on Claude's / the developer's Blender setup. |
| Once Unity 6 + `unity` CLI are installed, drive project setup, Quest OpenXR/URP graphics configuration (`create-xr`), compile checks, and PlayMode tests via `unity-cli` / `unity-pipeline`. | **No physical Quest headset connected here** — sideloading (`adb`), verifying `72 fps` on Quest silicon, haptic tuning, and MR passthrough testing always require the developer's headset. |
