# Interface design rules

Agreed between Claude and ChatGPT on 21 November 2026, at the developer's request to settle the interface on colour theory and design theory. Everything follows from two approved pictures: `assets/concepts/style-sheet-v1.jpg` (the palette) and `assets/concepts/title-menu-final.jpg` (the cloth-banner menu).

## The rules

| Rule | What it means | Why |
|---|---|---|
| **Material** | Cloth is for anything you read or press. Timber is only structure (poles, posts) and objects standing in the world (signposts). | One meaning per material, so a player learns at a glance what is interface and what is scenery. It is also what the approved menu already does. |
| **Colour, about 60 / 30 / 10** | Cream cloth is the surface (60). Plum carries all text and thin outlines (30). Red is the accent (10): the banner trim, the one main action, and the selected side of a toggle. | A dominant, a secondary and an accent colour keep a screen calm and make the accent mean something. |
| **Reserved colours** | Gold is only for rewards (stars, coins) and the perfect-release zone. Ember red-orange belongs to shades and danger, never to ordinary controls. | A colour that always means the same thing can be read without words. |
| **One main action** | At most one red button on a screen. Panels with nothing to press have none. | The eye should find the next step at once. |
| **Shape** | One button shape, the chamfered pennant from the menu, with the same corner angle on every control. A heavier bevel on the main button; lighter outlines on toggles and dropdowns. | Repetition makes the parts read as one family; weight shows importance. |
| **Contrast** | Plum on cream for all small text. Cream on red only for large labels and the selected toggle, checked at final size. | Dark on light is the most readable pairing, which matters most at VR distance. |

## How the interface is being drawn
One small sheet at a time, one image each, no variants, each checked against the menu before the next is asked for. (A first attempt at a whole kit in four variants was set aside: the variants looked alike and none matched the menu. Those four are kept in `assets/concepts/set-aside/` for reference.)

| Step | Sheet | File | State |
|---|---|---|---|
| 1 | Controls: Begin, Enter VR, a toggle in both positions, the stage dropdown | `kit-step1-controls.jpg` | Done; matches the menu |
| 2 | Panels: score panel and results panel | `kit-step2-panels.jpg` | Done; matches the menu |
| 3 | Icons: full and empty star, coin, arrow, shade, wind, timer, streak | `kit-step3-icons.jpg` | Done. Ember appears only in the shade's eye; the streak is plum chevrons, not a flame |
| 4 | Draw-power bar: empty, half, full, with the gold perfect-release band | `kit-step4-drawbar.jpg` | Done |
| 5 | VR pieces: BACK, AGAIN and NEXT signposts; the bow tag | `kit-step5-vr.jpg` | Done. NEXT alone is red. The lettering came out in a plain sans-serif; in the game it uses the same serif as the menu |
| 6 | The VR Comfort group: four toggles | `kit-step6-comfort.jpg` | Done |

These are concept pictures. The interface in the game is unchanged; rebuilding it to match is a game change that waits until after the release unless the developer says otherwise.
