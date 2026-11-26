# Claude vs Gemini: a second arcade mode

The developer's word (26 November): "Let's do a Claude vs Gemini." The contest: **a second arcade mode**, beside Bell Watch.

Claude and Gemini each design **and build** one mode from the same brief, the same starting commit and the same rules. The developer judges blind in a headset: the start cloth shows **Arcade A** and **Arcade B**, and nobody tells them which is whose. Until there is a headset, both are run through the same bot scorecard (`tests/arcade.html`), written before either mode existed.

## What to make

A carefree three-minute arcade mode for the range in a Quest headset that is **not Bell Watch with a new coat**. It needs its own goal and its own reason to keep shooting. You may reuse anything in the game: the hares, crows and ram (`spirits`, `ram`), the standard targets, the bell, sounds, bursts and popups. You may also build your own targets from plain shapes. Grey, unrendered shapes are expected: mechanics first, art later.

Score it so a better archer clearly scores more, and a new player still has fun.

## The rules of the contest

1. **One file each.** Claude writes only `src/modes/claude.js` and Gemini writes only `src/modes/gemini.js`. Each may add a design note, `design/duel-claude.md` or `design/duel-gemini.md`, and nothing else. No changes to `src/game.js`, the build, the config or the tests. If the slot lacks something, write the request in your design note and work around it. Claude merges slot changes for both after the contest, never during it.
2. **Same start.** Both start from the `release-prep` commit that carries this brief. Claude wrote the slot and the scorecard; that is said openly here, and both are fixed now.
3. **No peeking.** Neither reads the other's mode file or note until both are submitted.
4. **Limits (the game's own):** carefree, with no harm to the player and no lost points; nothing from behind (every target ahead of the line, at least 8 m out); no flashes and no camera shake; the world never moves under the player; at most 9 shootable things in view at once; holds 72 fps on a Quest (keep per-frame work small, and build meshes once, not every frame); 180 s or shorter; your file under 40 KB.
5. **Submit.** Claude commits its file to `release-prep`. Gemini pushes only `gemini/duel`, as `Gemini 4 Neon <gemini@noreply.invalid>`.

## The slot (in `src/game.js`, search "The arcade slot")

Your file runs after `src/game.js` in the same script, so the game's names are in scope. Register once:

```js
arcadeMode('claude', {            // or 'gemini'
  name: 'My mode',
  seconds: 180,
  marks: [],                      // optional standard targets, as a stage's marks
  start(){},                      // the run begins: range.t0 = elapsed, range.endAt set
  step(dt, left){},               // every frame while range.phase === 'play'; left = seconds to go
  hit(target, q, info){ return 120; },   // an arrow struck one of YOUR targets; return points or null
  score(target, q, info){ return null; },// an arrow struck a shade or a standard target; return points to replace the game's, or null
  miss(q){ return null; },        // return 'reset' to end the streak; the default keeps it (carefree)
  bell(q){ return false; },       // return true if you handled an arrow in the bell
  info({phase, left, clock, best}){ return {title:'', text:'', mark:''}; },  // the scoreboard; phase 'play', 'closing' or 'results'
  end(){},                        // the run is over: tidy up
});
```

- `arcadeTarget(mesh, data)` makes a mesh shootable. `data` lands on `mesh.userData.target`, which is the `target` your `hit` receives. `arcadeDrop(mesh)` undoes it. Hide your own meshes in `end()`.
- `info` gives `dist` (m), `at` (where it struck), `perfect`, and `drawSec` (draw time). The slot adds the points, the streak, hits and the playlog.
- Useful names: `T` (three.js), `scene`, `V(x,y,z)`, `yardAt(along,right)` → `[x,z]`, `groundAt(x,z)`, `YARD`, `elapsed`, `range`, `spirits` with `sp.set(sp,cfg)` (see `w2Spawn` for how a shade is put out), `ram`/`ramSet()`, `peal`, `burst(pos,color,n)`, `popup(text,pos,color)`, `note(freq,len,type,vol,delay,slideTo)`, `say(text,secs)`, `watchRand(a,b)`, `rangeTargets()`.
- Try it: build, then open `Brackenford-Seven-Bells.html?arcade=claude` (or `gemini`) and press the **Arcade** button on the start cloth. `tests/arcade.html?mode=gemini` runs the scorecard.

## How it is judged

**Bot scorecard (`tests/arcade.html`, the same for both):**
- runs with no errors;
- carefree: the score never drops and the world never moves;
- nothing behind the line or nearer than 8 m;
- at most 9 shootable things in view;
- seconds with nothing to shoot (fewer is better);
- skill shows: a good bot beats a fair bot, which beats an idle one;
- time per frame (lower is better).

**Then the developer, blind, in a headset:** fun, comfort and whether they want another run, rated on the results page. That decides it.
