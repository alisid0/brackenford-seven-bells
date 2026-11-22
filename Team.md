# The team, and design round 1

Agreed on 22 November 2026 between Claude, ChatGPT and Gemini, at the developer's request. Each model wrote its own proposal first (`design/claude-round-1.md`, `design/chatgpt-round-1.md`, `design/gemini-round-1.md`), read the others', and answered a settlement proposal. All three accepted the roles below. Nothing here is built.

## Who owns what

| | Owns | Has the right to |
|---|---|---|
| **The developer** | Every decision. The only one who can say what a headset shows. | Overrule anything below. |
| **Gemini** (4 Neon, in the Antigravity app) | Systems design: each rule and its numbers (scoring, arrow economy, wave pacing), the VR and mixed-reality interaction specs, audits of documents and builds against the spec, and repeatable checks. | Challenge a rule before it is built, and fail a build that does not match its spec. |
| **ChatGPT** (in the browser pane) | Art direction, concept pictures, and the visual language of every mechanic: the cue a player reads. Reviews of how things look, read and move. | Send a rule back if its cue cannot be read at range. |
| **Claude** | Game code, tests, performance, the build, the repository and merges. Checks every claim from the other two against the files before acting. | Veto on cost and complexity. |

## Order of work for a feature
1. Gemini drafts the rule and its numbers.
2. ChatGPT designs the cue, and may send the rule back.
3. Claude costs it and builds it behind a flag.
4. Gemini audits the build against its spec.
5. The developer decides, and signs off on a headset.

Small tuning does not wait for all three: Claude may change a number and the others audit afterwards.

## How each contributes to the repository
- **Gemini** works on its own branches, named `gemini/<topic>`, and pushes only those. Claude opens the pull request, checks it and merges it into `release-prep`. Gemini does not push to `release-prep` or `main`, does not force-push, and does not deploy. Its first pull request, [alisid0/brackenford-seven-bells#1](https://github.com/alisid0/brackenford-seven-bells/pull/1), is merged.
- **ChatGPT** cannot write to the repository. Claude copies its text and pictures in, saying they are ChatGPT's.
- **Claude** commits to `release-prep`.
- The standing rules in `Project-notes.md` bind all three: Trials ships first; nothing new reaches `main` or the public site; every new feature sits behind a flag; no claim about VR or mixed reality that a headset has not confirmed; no Arcade code until the first headset playtest of Trials is in.

## Design round 1: what the three agreed

### Elemental arrows: three for a first prototype, after Trials ships
Each acts on one thing, reuses a system the game already has, and costs nothing extra to draw on a Quest. Zones (Gemini's first idea) were dropped by all three: a zone needs a ring on the ground and a distance test against every target each frame, and several targets slowing by different amounts is hard to read at range.

| Arrow | Rule | What the player gives up | Cue (ChatGPT) | Agreement |
|---|---|---|---|---|
| **Frost** ("Rime") | A hit holds one sliding or pop-up target's timer still. One freeze per target. | The freezing shot scores nothing; a charge is spent | A broad sky-blue bracket locks around the target; the stop itself is the cue | All three. **Length not settled:** ChatGPT 0.8 s, Gemini 1.8 s (a redraw is about 1.0 s and the arrow's flight about 0.4 s at 25 m). Start at 1.8 s and tune in play |
| **Wind** ("Gale") | This arrow takes half the sideways wind | Its ring value is capped at 60 | A short cream trail with three plum bands | All three. Gemini withdrew "ignores all wind and nudges crows" |
| **Fire** ("Kiln") | A hit on a grass clump clears it for the rest of the stage, so what hid there is in the open | Scores nothing itself; a charge is spent | Three broad cream chevrons rise and fade; no flame, no ember red, no gold | All three on the rule and cue |

- Special shots are **charges per run**, spent on release whether it hits or misses. No shop and no unlocks.
- Behind one flag, off in the release. In Arcade they must draw nothing from the shared random sequence.
- Set aside for now: Spark (Gemini), Stone (ChatGPT), Heavy (Claude).

### Arcade
- **Agreed:** build Score Attack before Endless. Show shots, misses and voids separately on the Endless results card.
- **Agreed in principle, numbers to come from a headset:** ending a run on a single 0.25 s gap between frames is too harsh for a Quest (Gemini). Measure real hitches first, then set the threshold (ChatGPT).
- **Deferred until play shows the problem:** Gemini's penalty for letting targets expire in Endless.

### Mixed reality
- **Agreed:** the plain Window first. One fixed opening onto the range, thick plum frame, opaque cream targets, the room visible around it.
- Gemini's "Breach Shade" (a shade rushing the sill every third slot) is kept as the second step, to be looked at only after the plain Window is proven.
- **Before anyone promises anything:** a passthrough session in the Quest Browser at 72 frames a second or better on the busiest slot, the opening drifting no more than 5 cm in three minutes, and a clean fall-back to VR (Gemini's gate).

## For the developer to decide
1. ~~The fire arrow's name~~ **Decided 22 November 2026: Kiln** (ChatGPT's name; Gemini had proposed Singe).
2. ~~Arrows in the air when Score Attack's 180 seconds run out~~ **Decided 22 November 2026: they count.** An arrow loosed before the 180 seconds are up scores if it hits, however late it lands; only a release after the time is up is blocked. (Gemini's rule; ChatGPT had proposed voiding them.)
3. ~~A Bonus Bell in Score Attack~~ **Decided 22 November 2026: add it.** Gemini's rule: when every target in a six-second slot is cleared with at least 1.5 seconds left, one Bonus Bell appears; a hit scores a flat 50 and a miss costs nothing. To answer ChatGPT's objection, the main targets keep their fixed schedule, and the bell must appear at a fixed place and draw nothing from the shared random sequence, so two players on the same seed still face the same run. Claude advised leaving it out until play showed dead time; the developer chose to include it.
4. **Whether to start any of this before the Trials playtest.** All three models say Trials ships first.

## Order of work for the world and the levels (set by the developer, 22 November 2026)
Claude built a range layout into the game straight from one picture. The developer stopped that: it is not how it is done. The order is:

1. **The aerial view**, made by all three: Gemini writes the plan in metres, ChatGPT draws it, Claude and Gemini check the drawing against the plan and the stage list.
2. **The player's-eye view for the stages**, drawn from that aerial view.
3. **Then the assets** those pictures call for, **and the levels built with the right assets in them**.

Each step goes to the developer before the next starts. The layout Claude built behind `?world=2` stays where it is as a rough block-out; it is not the result of this process and nothing more is added to it until step 3.
