# The Unity version

Started 22 November 2026 at the developer's word ("Start Unity now"), alongside the web game. Unity 6 (6000.6.7f1), the built-in render pipeline, no extra packages yet.

**What it is today:** the first milestone's first step. One range that builds itself in code, the bow on a flat screen (mouse), arrows that fly by the web game's own rule, ring targets placed from the shared stage numbers, scoring with streak and perfect release, the 17 release stages' ring targets, and the Practice Bell, which swings and rings when struck. Picture from the built program: `assets/renders/unity-first-range.png`.

**What it is not yet:** no headset. No shades, no Bell Watch, no menu, no saves, no real art (plain shapes in the palette), no sound but the bell.

## One set of numbers for both versions

The web game is where numbers are set. `node tools/export-data.mjs` writes `shared/game-data.json` from `src/game.js` and `src/config.json`: bow speed and gravity, ring scores, star thresholds, the 29 stages, the release order, ribbons, special arrows, Bell Watch. Copy that file to `unity/BowAndShadow/Assets/StreamingAssets/game-data.json`. Unity reads it in `GameData.cs` and sets nothing of its own.

Two things in that file are copied by hand in the tool rather than read from the code (the ring scores and the bow's speed formula); if those change in `src/game.js`, change the tool.

## Running it

- **In the editor:** open `unity/BowAndShadow` in Unity Hub, open `Assets/Scenes/Range.unity`, press Play. Hold the left mouse button to draw, let go to loose. N next stage, R again, B back.
- **From the command line**, with `U` standing for `C:\Users\<you>\Unity\Editors\6000.6.7f1\Editor\Unity.exe`:
  - check: `U -batchmode -nographics -projectPath unity/BowAndShadow -executeMethod BowAndShadow.Check.Run -logFile check.log` (look for the line starting `CHECK`)
  - set up the scene and material: `... -executeMethod BowAndShadow.Setup.Run`
  - Windows build: `... -executeMethod BowAndShadow.Setup.BuildWindows`, giving `Builds/Windows/BowAndShadow.exe`

## Before it can run on a Quest

1. **Android Build Support is not installed** in this Unity (only Windows and WebGL are). It is added from Unity Hub: Installs, the gear on 6000.6.7f1, Add modules, Android Build Support with its SDK, NDK and OpenJDK. This needs the developer; it is a download of several gigabytes.
2. The XR packages (OpenXR and a Quest feature set) and a headset rig with a two-handed bow. Not chosen yet; Gemini's `design/unity-plan.md` is to recommend them. Package versions must be the ones this Unity offers, not guessed.
3. A Quest in developer mode to put a build on.

Nothing here has run on a headset.

## What a real run taught, so far

The first Windows build drew nothing, the second drew everything magenta. A material made at run time from a shader found by name is not packed into a build. The fix is `Assets/Resources/Flat.mat`, a real material in the project. Compiling in the editor did not show either fault; running the build did.
