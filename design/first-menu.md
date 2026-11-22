# The first menu: what the three models agreed

The developer asked (22 November 2026) why the menu designed earlier was never built, and then said: "discuss with the other agents how the first menu of the game is supposed to look". This page is the outcome. Gemini's side is in `design/first-menu-spec.md` and `design/first-menu-reply.md`; ChatGPT's is recorded here, since it cannot write to the repository; Claude ran the exchange and checked it against the game.

**Status: approved by the developer on 22 November 2026 ("Approve, build it"). The first-release version is built on `release-prep`; see "What is built" at the end. On the test site since 22 November 2026; not on the public site.**

Pictures: `assets/concepts/first-menu-1-new-player.jpg`, `first-menu-2-returning-vr.jpg`, `first-menu-3-overlook-map.jpg`. The earlier approved picture is `title-menu-final.jpg`.

## What stays from the approved picture

The identity: a cream cloth banner tied with rope between two timber posts, red trim, plum serif lettering, and one strong red button. Nothing about that changes.

## What changes, and why

| Change | Why |
|---|---|
| The cloth carries three things, not eleven controls | A first screen that asks eleven questions delays the first arrow. Both models said so independently |
| Stage, draw mode, bow hand and the comfort switches move one step away, into Settings | None is needed before the first shot; the grip and stick already change hand and draw mode in the headset |
| "Move between spots" is removed | The player never walks in this game |
| The backdrop is the live first place, not a posed meadow | The banner should hang in a place the player is about to use |
| A returning player gets a different face | They want to carry on, not start |
| No loose petals; targets in cream, red and gold | The picture's blue rings and ground petals are not in the game |

## The faces

**New player, on a computer.** Title, "Early build", one line saying what the game is. A red **Begin**. A cream **Enter VR** under it. A quiet **Settings** link in the corner. One press of Begin puts them on the first stage.

**New player, on a Quest.** The same cloth on the flat page, but the red button is **Enter VR**, with a cream **Play on screen** under it. One press lands them in the headset on the first stage with the bow in hand and the guide board ahead. A first-timer meets no menu inside VR.

**Returning player.** Title, then stars earned out of the total. A red **Continue** with its destination written under it ("Willowbank · The drop"). Cream **Stages** (becomes **World Map** when there are six places) and **Daily Trial** (when it exists). **Settings** in the corner. Ribbons and days played live deeper, not here.

**Settings.** A second cloth that replaces the face, with **Back** in a fixed place. Play: bow hand, draw mode. Comfort: posture (auto, standing, seated), replays in VR, and later height comfort and scenery sway. A four-line controls card. **Start over**, which asks twice. On test builds, Copy playtest summary.

One red button on any face, never two.

## In the headset

| Thing | Agreed | How it was settled |
|---|---|---|
| Distance and size of the cloth | 2.4 m away, 2.0 m wide, 1.15 m high, centred just below eye height, lower when seated | ChatGPT said about 2 m, Gemini 3.2 m. Gemini moved once shooting at the menu was dropped; lettering works out a little over one degree tall |
| How you choose | Point and press the trigger. No shooting at the menu | Gemini wanted both; ChatGPT pointing only. Gemini gave way: a stray arrow could hit Start over, and pointing is easier seated. Shooting stays for the AGAIN, NEXT and BACK signs |
| What moves | Only the cloth's corners and lower hem; the printed part is rigid. Slow water, treetops | So lettering never shimmers. All of it stops when scenery sway is off |
| What you hear | Quiet wind, distant water, now and then a village bell | ChatGPT's; no objection |

## Where it hangs

**First release, one place.** At Willowbank Range (the first place; name still the developer's to confirm), just off the shooting line, with the rail and channel in front and the range open above and beside the cloth.

**When the six places ship.** A new, calm place: a sheltered stone terrace overlooking the whole valley, with a steady parapet and no drop at the toes. It is the home a returning player comes back to. ChatGPT proposed it; Gemini accepted it on condition that it obeys the comfort rules. It is a seventh environment to make, which is why it waits.

## The map

A relief model of the valley on a timber table at the overlook: 1.4 m wide, 0.9 m deep, tilted 25 degrees toward the player, its centre about 1.15 m away and below eye height, each place with a cloth name tag. Choosing World Map brings it into view with a short fade; the player's view is never slid or panned. ChatGPT's idea; Gemini's numbers and the no-glide rule.

Until then, with one place, **Stages** opens a plain list of the stages that are open.

## What can be built now, and what waits

| First release | Later |
|---|---|
| The cloth banner in place of today's title card; Begin or Enter VR; Continue and Stages for a returning player | Daily Trial button and the days-played line (first update) |
| The Settings cloth: bow hand, draw mode, posture, replays in VR, controls card, two-step Start over | World Map in place of Stages; the overlook; the relief table; height comfort and scenery sway (six-place update) |
| In the headset: straight to stage 1 for a new player; the banner at 2.4 m for a returning one, chosen by pointing | |

## Claude's notes

- **Not tested.** No distance, size or lettering figure here has been tried in a headset. ChatGPT asked specifically that the lowest row of buttons be checked against the rail from a seated eye.
- **Two settings do not exist yet.** "Posture" and "Replays in VR" are not in the game today; putting them on the Settings cloth means building them.
- **Pointing is new.** The game has no controller pointer today; everything in VR is chosen by shooting or by the sticks. A pointer has to be built for this menu.
- **The star total.** "14 of 51" in the pictures counts three stars on each of the 17 release stages.
- The old rule "pictures only until after release" was the two models' caution, not the developer's instruction. Building this needs only the developer's word.

## What is built (22 November 2026)

| Piece | State | Switch |
|---|---|---|
| The cloth banner on the flat page: new-player face, returning face, Stages list, Settings cloth | Built; `tests/menu.html` passes; looked at on a desktop-size and a phone-size screen | `menu` in `src/config.json`, on. `?menu=0` brings the old card back |
| A new player entering VR lands on stage 1 with no menu | Already how the game behaved; unchanged | - |
| The banner inside the headset at 2.4 m, chosen by pointing and pressing a trigger: Continue, Stages, Settings (bow hand, draw mode) | Built and passing its test with a stand-in controller. **Never run on a headset** | `vrmenu`, **off**. `?vrmenu=1` turns it on for a returning player |

Not built, and why:

- **Posture and Replays in VR** on the Settings cloth: neither setting exists in the game yet, so they are left off rather than shown doing nothing.
- **Daily Trial** button: the daily trial does not exist yet.
- **A way to open the menu again from inside VR** (a pause or wrist control). Today the headset banner appears once, on entering VR.
- **Moving cloth corners and the menu's own sounds.**
- **"Willowbank"** under Continue: the place's name is not confirmed, so the line reads "Stage 4 · First shade".
- The live range behind the cloth is today's range, not the redesigned first place with its deck and channel.
