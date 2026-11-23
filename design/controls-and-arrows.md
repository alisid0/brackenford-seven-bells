# Controls and arrows: mechanics first

On 23 November the developer asked for proper staged development: get the bow, the arrow and the Meta Quest controls right in a plain, unrendered scene before spending more on looks. Claude and Gemini carry this; ChatGPT only makes pictures from here.

## The steps

| Step | What | State |
|---|---|---|
| 1 | A plain grey test range that reads out every shot, and the Quest face buttons read by name | **Built** (this page) |
| 2 | Arrow flight and release, second version: Gemini sets the rules and numbers, Claude builds them behind a switch, both compared in the lab | Gemini's ticket is out |
| 3 | The control map settled and bound for real, including a way back to the menu from inside the headset | After step 2 |
| 4 | The developer plays the lab in the headset and says which arrow feel and which controls stay | Needs the developer |
| 5 | The chosen mechanics become the game's; only then more art | After step 4 |

## Step 1: the mechanics lab

Open the game with `?lab=1`. Nothing else changes for anyone who does not.

- A flat grey lane with no scenery: no trees, grass, props, bell, sky colour or moving sun.
- A dark line every 5 m, heavier every 10 m. Pairs of posts at 10, 20, 30 and 40 m stand 1, 2, 3 and 4 m tall, so distance reads at a glance.
- Three targets, at 10, 20 and 30 m. Arrows never run out and the lab never ends.
- It is not one of the stages: like Bell Watch it lives outside the list, and nothing about it is saved.

**The read-out** is on the scoreboard and, in the headset, on the plaque on the bow:

| Reading | Meaning |
|---|---|
| Draw | How much of a full draw, and in the headset how many centimetres the string hand was from the bow hand |
| Speed | How fast the arrow left, in metres a second |
| Up | How many degrees above level it was loosed |
| Shake | Headset only: the most the aim moved in the fifth of a second before the arrow left. A clean release is well under one degree |
| Hit / Miss | Distance, how many centimetres off centre (or how far it passed from a target), and how long it flew |

`tests/pads.html` checks all of it, including that a hand jerked 6 cm sideways before letting go shows as more than two degrees of shake.

## The Meta Quest controllers, as a web page sees them

| On the controller | What the browser reports |
|---|---|
| Trigger (index finger) | button 0 |
| Grip (middle finger) | button 1 |
| Thumbstick, pressed in | button 3 |
| Lower face button: **A** on the right, **X** on the left | button 4 |
| Upper face button: **B** on the right, **Y** on the left | button 5 |
| Thumbstick, pushed | two axes |
| Menu button (left) and Meta button (right) | **Not available**: the headset keeps them |

This table is from memory of the published controller profile and has not been confirmed on the developer's headset. The lab shows the name of each face button as it is pressed, so it can be confirmed in one minute.

## What every control does

Jobs go by what the hand is doing, not by left or right, so a left-handed archer gets the same layout mirrored.

| Control | Hand | Today | With the `pads` switch on |
|---|---|---|---|
| Trigger | String hand, at the string | Take the string; pull back; let go to loose | The same |
| Trigger | Either, in single-handed draw | Hold to draw by itself, let go to loose | The same |
| Trigger | Either, with the menu up | Press the button pointed at | The same |
| Grip | Either, near the bow | Take the bow, or pass it to the other hand | The same |
| Grip | Either, at a climbing wall | Hold on and climb | The same |
| Left thumbstick | Left | Walk (outside the range); on the range: left and right change stage, up and down pick a special arrow | The same, for now |
| Left thumbstick, pressed | Left | Run on or off | The same |
| Right thumbstick | Right | Turn in steps of 30 degrees | The same |
| Right thumbstick, pressed | Right | Switch two-handed and single-handed draw | The same |
| **Lower face button** (A or X) | **String hand** | Nothing | Start this stage again |
| **Upper face button** (B or Y) | **String hand** | Nothing | Switch two-handed and single-handed draw |
| **Lower face button** (X or A) | **Bow hand** | Nothing | Next special arrow |
| **Upper face button** (Y or B) | **Bow hand** | Nothing | Open or close the menu |

Each press does its job once, however long it is held, says what it did, and gives a short buzz. The menu button answers "The headset menu is switched off" until the headset menu (`vrmenu`) is turned on; that menu has never been run on a headset.

**Open, for Gemini and then the developer:** changing stage by flicking the left stick sideways is easy to do by accident mid-stage; the draw-mode switch now has two controls; there is no control for "next stage" other than shooting the sign; nothing recentres the view.

## Arrow flight today

| Thing | Today |
|---|---|
| Draw | Power is the distance from bow hand to string hand: nothing at 12 cm, full at 52 cm, the same for every player whatever their arm length |
| Speed | 24 m/s at no draw to 62 m/s at full draw, in a straight line with draw |
| Gravity | 7 m/s² (the real figure is 9.8), so arrows fly flatter than real ones |
| Air | None: an arrow keeps all its speed |
| Wind | A steady sideways push, 1.4 m/s² for each point of wind |
| Aim | The line from the string hand through the arrow rest; the string hand is smoothed a little; the bow turns to lie along the arrow, so twisting the bow wrist does not turn the shot |
| Release | The aim at the instant the trigger opens; a "perfect release" is letting go within 0.9 s of reaching full draw |
| Hits | The arrow's path is swept each frame, so it cannot pass through a target between frames |
| Feel | Buzzes step up through the draw, a strong one at full draw, a thump on the loose |

**What is known to be weak:** short and tall players get different power from the same honest draw; the trigger finger's jerk as it opens goes straight into the shot; there is no reason to hold at full draw and no cost to holding for ever; the flat gravity makes far targets easy to reach with little arc; the arrow's flight has no character (no drop-off, no wobble as it leaves).

## Step 2: what Gemini is asked for

In `design/arrow-mechanics-v2.md` on branch `gemini/arrow-mechanics`: a rule and a number for each weak point above, the control map's open questions answered, and nothing that makes the game less carefree. Claude builds it behind a switch so both versions can be shot side by side in the lab.
