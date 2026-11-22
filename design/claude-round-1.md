# Design round 1: Claude's proposal

Written by Claude on 22 November 2026, before reading Gemini's proposal and after reading ChatGPT's. My view is the engineering one: what each idea costs to build, test and run on a Quest.

## Roles
- **Claude:** game code, tests, performance, the build, the repository and merges into `release-prep`. I check every claim from the other two against the files before acting on it.
- **ChatGPT:** art direction, concept pictures, and review of how things look, read and move. I agree it should write the first pass of a rule where the visual cue is the rule.
- **Gemini:** rule and consistency audits, test cases, and design drafts, on its own branches. It can run code where it works, so it can also own repeatable checks (seeded replays, document checks) as files I review.
- **Hand-off I support (ChatGPT's):** Gemini challenges a rule before I build it, then checks the build against the agreed cases.
- **The developer** decides, and is the only one who can say what a headset shows.

## Elemental arrows: what is cheap and what is not
Each arrow should reuse a system the game already has, so it adds a rule and not an engine.

| Arrow | Reuses | Rule I would build | Cost on a Quest |
|---|---|---|---|
| Frost | the timers that slide and pop targets | a hit holds that one target's timer for a fixed time; one freeze per target | none: a paused timer and one colour change |
| Fire | the grass clumps shades hide in | a hit on a clump clears it for the rest of the stage, so what hid there is in the open; scores nothing itself | none: the clump is switched off; no flame particles |
| Gale | the wind term on an arrow in flight | this arrow takes half the sideways wind; its score is capped | none |
| Heavy | arrow speed and drop | slower and drops more, but a hit counts double on a sitting target; no good on moving ones | none |

- **Charges, not unlocks:** a fixed number of special shots per run, spent on release, hit or miss. No shop, no progression: the release page says there is none.
- **Seeded play must stay seeded:** in Arcade a special arrow must draw no numbers from the shared random sequence, or two players on the same seed diverge.
- **One flag for the lot** (`arrows` in `src/config.json`), off in the release.
- **No effect that draws see-through layers over the target.** Flat colour changes and shape cues only; the frame-rate figure on Quest is still unmeasured.

## Arcade
1. Build Score Attack first: it has no arrow accounting, so it is the smaller job and the cleaner test of seeded targets.
2. Write the seeded replay check before the mode: same seed, same targets, same score, at 30, 72 and 120 frames a second.
3. The standing rule holds: no Arcade code until the first headset playtest of Trials is in.

## Mixed reality
The Window first, as ChatGPT says. Before anything else, one question a headset must answer: does the Quest Browser give this page a passthrough session at all, and at what frame rate with the range drawn inside the opening? Until that is seen, mixed reality is a plan and nothing more.

## Risks
- Fire as "clear the grass" may make hidden shades trivial; it may need to cost two charges.
- Heavy overlaps the planned Bodkin arrow; one of them should go.
- Every arrow adds cases to the hit and scoring tests. Four arrows is the most I would take on in one round.
