# Bow & Shadow (working title)

A fantasy archery game for the browser and for VR headsets, set in the world of Brackenford. Written in plain JavaScript with three.js and WebXR. In development; the name is provisional.

- **Play the test build:** https://archery-range-test.vercel.app/?fps=1
- **Working branch:** `release-prep`. The `main` branch and the tag `known-good-2026-11-21` are the build on the public site.

## Where everything is

| File | What it is |
|---|---|
| [Project-notes.md](Project-notes.md) | Current status, every agreed decision, standing rules, open questions |
| [Team.md](Team.md) | Who owns what between Claude, ChatGPT and Gemini, how each contributes, and what design round 1 agreed |
| [design/](design) | Each model's own proposal for design round 1 |
| [ChatGPT-instructions.md](ChatGPT-instructions.md) | How ChatGPT works on this project |
| [Release-checklist.md](Release-checklist.md) | What must pass before the public release |
| [Day-1-test-sheet.md](Day-1-test-sheet.md) | The developer's playtest script |
| [Stages.md](Stages.md) | All 29 stages and the 17 chosen for release |
| [Arcade-plan.md](Arcade-plan.md) | Endless Survival and Score Attack: rules, timing, build order |
| [Art-and-animation-plan.md](Art-and-animation-plan.md) | Look, graphics budgets, asset pipeline, animation and its testing, roadmap |
| [Interface-design-rules.md](Interface-design-rules.md) | Colour, material and shape rules for menus and panels |
| [Asset-and-XR-list.md](Asset-and-XR-list.md) | Every asset needed, and every VR and mixed-reality element |
| [Release-page-text.md](Release-page-text.md) | Draft wording for the release page |
| [Readme.txt](Readme.txt) | How to build and run |

## Where the code is

| Path | What it is |
|---|---|
| `src/game.js` | The whole game |
| `src/shell.html` | The page and title card |
| `src/config.json` | Release switch, title, stage order |
| `src/build.mjs` | Builds the single-file game |
| `assets/` | Game-ready models, concept images, screenshots |
| `tools/` | Blender and asset scripts |
| `tests/` | Automated test pages; `tests/all.html` runs them all |
| `BrackenfordSevenBells/` | An older Unity attempt, not in use |
