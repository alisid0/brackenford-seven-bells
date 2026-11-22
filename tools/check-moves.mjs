// Measures a timed move on the real skinned mesh, without a browser:  node tools/check-moves.mjs
// For the hare's bound it follows the corners of each paw through one cycle and reports, while a paw is down, how far
// it slides along the ground and how far it sits above or below it; and over the whole cycle, how far the mesh dips
// below the ground, how far short any planted leg falls of its spot, and the worst stretch of the skin.
import { load, posed, stretch } from './rig-lib.mjs';
await import('../src/moves.js');
const c = load('shade-hare-standing-rig-patched.json'), N = 200;
const mm = v => (v * 1000).toFixed(1) + ' mm';
let all = true;
for (const [title, opt] of [['as first drawn', {}], ...Object.entries(globalThis.MOVES.HARE)]) {
if (title === 'crouch') continue;
const move = globalThis.MOVES.hareBound(c.m.bones, opt);
// a paw's corners: those its bone moves almost alone
const paws = move.paws.map(name => { const b = c.m.bones.findIndex(x => x.name === name), list = []; for (let i = 0; i < c.n; i++) for (let k = 0; k < 4; k++) if (c.si[i * 4 + k] === b && c.sw[i * 4 + k] >= 200) list.push(i); return { name, list, f: [], y: [], lowRest: Math.min(...list.map(i => c.pos[i * 3 + 1])) }; });
let dip = 0, short = 0, worst = 1, air = 0;
for (let s = 0; s < N; s++) {
  const t = s / N, p = move.pose(t), now = posed(c, p);
  for (let i = 0; i < c.n; i++) dip = Math.min(dip, now[i * 3 + 1]);
  short = Math.max(short, p._short); worst = Math.max(worst, stretch(c, now, 1)[0].ratio); if (!p._down.some(Boolean)) air++;
  paws.forEach((paw, k) => { if (!p._down[k]) return; let f = 0, y = 9; for (const i of paw.list) { f += -now[i * 3 + 2]; y = Math.min(y, now[i * 3 + 1]); } paw.f.push(f / paw.list.length + p._travel); paw.y.push(y); });
}
console.log('hare bound, ' + title + ': stride', move.stride, 'm, period', move.period, 's, speed', (move.stride / move.period).toFixed(2), 'm/s;', N, 'samples');
let ok = true;
for (const paw of paws) {
  const slide = Math.max(...paw.f) - Math.min(...paw.f), hi = Math.max(...paw.y), lo = Math.min(...paw.y);
  console.log(' ', paw.name.padEnd(16), paw.list.length, 'corners; while down: slides', mm(slide), ' lowest point between', mm(lo), 'and', mm(hi), '(rest', mm(paw.lowRest) + ')');
  if (slide > .005 || Math.abs(lo - paw.lowRest) > .005 || Math.abs(hi - paw.lowRest) > .005) ok = false;
}
console.log('  whole mesh dips', mm(-dip), 'below the ground at worst; planted legs fall short by', mm(short), 'at worst');
console.log('  worst stretch', worst.toFixed(2), '; all four paws off the ground for', (air / N * 100).toFixed(0) + '% of the cycle');
if (dip < -.01 || short > .002) ok = false;
console.log(ok ? 'PASS' : 'FAIL'); if (!ok) all = false;
}
// the crouch: paws must stay where they stand as the body comes down
{
  const cr = globalThis.MOVES.hareCrouch(c.m.bones, globalThis.MOVES.HARE.crouch), rest = posed(c, {}); let move = 0, short = 0, dip = 0, worst = 1;
  for (let k = 0; k <= 1.0001; k += .1) {
    const p = cr.pose(k), now = posed(c, p); short = Math.max(short, p._short); worst = Math.max(worst, stretch(c, now, 1)[0].ratio);
    for (let i = 0; i < c.n; i++) dip = Math.min(dip, now[i * 3 + 1]);
    for (const name of cr.paws) { const b = c.m.bones.findIndex(x => x.name === name), d = [0, 0, 0]; let n = 0; for (let i = 0; i < c.n; i++) for (let q = 0; q < 4; q++) if (c.si[i * 4 + q] === b && c.sw[i * 4 + q] >= 200) { n++; for (let a = 0; a < 3; a++) d[a] += now[i * 3 + a] - rest[i * 3 + a]; } move = Math.max(move, Math.hypot(...d) / n); }   // how far the middle of each paw has moved
  }
  const ok = move < .005 && short < .002 && dip > -.01;
  console.log('hare crouch: paws move', mm(move), 'at worst; legs fall short by', mm(short), '; mesh dips', mm(-dip), '; worst stretch', worst.toFixed(2));
  console.log(ok ? 'PASS' : 'FAIL'); if (!ok) all = false;
}
process.exit(all ? 0 : 1);
