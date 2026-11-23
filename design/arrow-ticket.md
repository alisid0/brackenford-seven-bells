# Ticket for Gemini: arrow mechanics, second version

From Claude, on the developer's word (23 November): mechanics before looks. Read `design/controls-and-arrows.md` first; it says what exists and what is weak. Branch `gemini/arrow-mechanics` cut from `release-prep`; commit as `Gemini 4 Neon <gemini@noreply.invalid>`; push only that branch.

**Write `design/arrow-mechanics-v2.md`. Do not change game code in this ticket**: Claude builds from your rules behind a switch, so the two versions can be shot side by side in the lab (`?lab=1`).

For each item give the rule in one or two sentences, the numbers, and the reason, in a table Claude can build from without guessing:

1. **Draw length and the player's reach.** Today full draw is a fixed 52 cm from bow hand to string hand. How should a short child and a tall adult both reach full draw honestly? (Measure once? Learn it from their first draws? A setting?) Give the exact rule and its limits.
2. **Speed from draw.** Today 24 to 62 m/s in a straight line. Keep, or a curve? What is the least draw that looses at all?
3. **Gravity and air.** Today gravity is 7 and there is no air. Give gravity, any loss of speed with distance, and the drop this produces at 10, 30, 50 and 70 m at full draw, beside today's. Every stage's targets were placed for today's flight (`shared/game-data.json`): say which stages would need re-checking.
4. **Release.** The trigger finger's jerk goes straight into the shot. Give the rule that removes it (for example: use the aim from N ms before the trigger opened, or an average over a window) and the number.
5. **Holding at full draw.** Today nothing happens however long it is held. Should anything? It must stay carefree: no punishment that feels like a tired arm tax.
6. **The arrow's character in flight.** What, if anything, should an arrow visibly do as it leaves and as it flies (a short wobble, turning to follow its path, a trail), with numbers. Looks only; it must not change where it lands.
7. **Feel in the hands.** A haptics table for the Quest controllers: what buzzes, how strong (0 to 1), how long (ms), on nock, through the draw, at full draw, on the loose, on a hit.
8. **The control map's open questions** at the end of "What every control does": stage change on the left stick, the doubled draw-mode control, a control for next stage, recentring. Rule on each. Jobs go by bow hand and string hand, not left and right. The menu and Meta buttons are not available to a web page.
9. **How to judge it in the lab.** The lab reads out draw, speed, angle, release shake, where it hit and flight time. Say what numbers a good version should show, so step 4 (the developer in the headset) has something to compare against.

Limits: nothing that harms the player or takes points; arrows never run out in Bell Watch; keep it buildable in a web page on a Quest. If two answers are both sound, give both and say which you would ship.
