# Willowbank props: ChatGPT's improvement round, and where Tripo fits

22 November 2026. The developer liked Gemini's first assets and asked for two things: ChatGPT to draw what could be improved in them, with the improvements passed back to Gemini; and an answer to where Tripo comes in, since detailed assets from Tripo are wanted too. ChatGPT's words are written down here by Claude.

- Gemini's assets as built: `assets/renders/w1-props-sheet.jpg`
- ChatGPT's redraw, same nine in the same order: `assets/concepts/w1-props-improved.jpg`

**Status: ChatGPT's notes are with Gemini as ticket 2. Nothing in this page is built yet.**

## The improvements (ticket 2 for Gemini)

ChatGPT would do the watchtower, huts and blossom tree first: "those are the silhouettes players see from the shooting line. The bridge and jetty are already close." Each prop stays within about twice its present triangle count.

| Asset | Weakest point now | Changes |
|---|---|---|
| Hut | The roof reads as a smooth ochre hat; the doorway sits flat on the wall | Round wall of 10 to 12 sides. Eave overhang 0.30 to 0.40 m. Two broad thatch bands, the lower one darker. Dark timber doorway recessed 0.12 m into the cream `#F6E6BD` wall |
| Hut with chimney | The tiny cap is the only real difference from the first | Wall 10% squatter. Chimney a third of the roof's radius off centre: a squat 0.35 m square stone stack with a simple cap. A 0.12 m deep timber lintel over the door |
| Watchtower | The red roof reads; the bracing collapses into a busy lattice | Main posts 20% thicker. One clear X per visible face, the other diagonals removed. A 0.18 m fascia round the gallery so the deck reads as its own level. Roof banner red `#AE493D`, frame timber `#825435` |
| Footbridge | Upright stone ends and angular rails feel more rigid than the shallow arch | Same span; deck crown of 0.18 to 0.22 m in five straight segments. Two continuous timber stringers under the boards. 0.12 m posts; handrails following the same shallow curve. Abutments lowered and bevelled into the banks |
| Jetty | The planks read, but they look perched on thin pins | Piles 0.18 to 0.22 m thick, in pairs. Two lengthwise beams of 0.14 by 0.20 m under the deck. The outer pair of piles standing 0.25 m above the planks to mark the end |
| Blossom tree | The upright crown reads as a stack of similar shapes | Five broad canopy lobes spread to about 1.4 times the present width, flattened, one side offset. Trunk bent slightly, with one gap showing the fork. `#F299B5` on top, a muted rose underneath |
| Wind pennant | A straight triangle gives no sense of cloth | Same pole; a 1.4 m taper with a 0.50 m hoist. Two broad bends in the cloth. Wide stripes in `#AE493D` and `#F6E6BD`. Two cream rope ties at the pole |
| Bell, silent | The two wraps nearly merge into the iron at shooting distance | Bell 0.75 m in `#3B3538`. The two diagonal `#4A2943` wraps set further apart, `#6D3362` on their lit faces. Half the iron left showing; a few broad thorn tips. Ribbon lashed flat to the post |
| Bell, restored | The gold lip is thin; the ribbon's tight zigzags look stiff | The silent bell's exact profile in bronze `#AE783E`. A continuous 0.08 m gold `#F0C75A` band at the lip. Two broad bends in the cream ribbon, the red hem carried across them. Fork and ground clear of crow and thorns |

## Where Tripo comes in

**The rule so far** (the developer's, 21 November): static props are built in code; creatures go ChatGPT concept, then Tripo for the 3D model and rig, then Blender scripts. The standing shade hare and the shade crow were made that way, at about 110 credits each; 2,870 credits were left afterwards. The hare is in the game (new-hare build); the crow is not animated or in the game yet.

**Why not Tripo for everything:** a Tripo model is a sculpted shape of a few thousand triangles with baked detail. That is right for a living thing with a silhouette that must hold from every angle. For a hut or a bridge it is heavier than the headset needs, harder to keep on the palette, and cannot be changed by editing a number. Code-built props also export to Unity cleanly.

**ChatGPT's list for Tripo, in order:**

1. **Shade ram: first.** "The curled horns, heavy shoulders and squat body need a coherent silhouette from several angles." Tripo for the base mesh, then Blender for horn clean-up, rigging and a charge test. This is the new shade ChatGPT proposed for Bell Watch.
2. **Crow, only if the present one cannot fold cleanly.** Test the existing rig in a perch and a take-off first. A second pose alone belongs in Blender, not Tripo.
3. **A great blossom tree, if it becomes a close-up landmark.** Interlocking trunk, exposed roots, a recognisable branching canopy. Willowbank's two range trees stay in code.

**Kept in code, on ChatGPT's advice:** the Thornwood bow (it needs exact grip and nock points) and the bell (it needs a clean rim, a predictable swing pivot and matching silent and restored shapes).

**Claude's additions:** each Tripo creature also needs animating by hand in code afterwards (the hare took a rig patch and a timed bound). A creature costs about 110 credits and those are the developer's; none are spent without their word. Gemini has no Blender, so the Blender steps stay with Claude.
