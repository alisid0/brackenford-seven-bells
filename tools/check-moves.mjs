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
process.exit(all ? 0 : 1);
