// Shared by the rig tools: reads a staging creature file and poses it without three.js, so stretch can be measured
// from the command line. Bones have no rest rotation, so a bone's turn is about the creature's own x, y and z axes.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export const staging = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'staging');
const b64 = s => Buffer.from(s, 'base64');

export function load(file) {
  const m = JSON.parse(readFileSync(join(staging, file), 'utf8'));
  const pb = b64(m.p), P = new Int16Array(pb.buffer, pb.byteOffset, pb.length / 2);
  const n = P.length / 3, pos = new Float64Array(P.length);
  for (let i = 0; i < P.length; i++) pos[i] = P[i] / m.unit;
  return { m, n, pos, si: Uint8Array.from(b64(m.si)), sw: Uint8Array.from(b64(m.sw)) };
}
export function save(file, c) {
  c.m.si = Buffer.from(c.si).toString('base64'); c.m.sw = Buffer.from(c.sw).toString('base64');
  writeFileSync(join(staging, file), JSON.stringify(c.m));
}
// rotation matrix for a turn of x, then y, then z, the same order three.js uses (XYZ)
function euler([x = 0, y = 0, z = 0]) {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  return [c * e, -c * f, d, a * f + b * e * d, a * e - b * f * d, -b * c, b * f - a * e * d, b * e + a * f * d, a * c];
}
const mul = (A, B) => { const R = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return R; };
const app = (A, v) => [A[0] * v[0] + A[1] * v[1] + A[2] * v[2], A[3] * v[0] + A[4] * v[1] + A[5] * v[2], A[6] * v[0] + A[7] * v[1] + A[8] * v[2]];
// positions of every corner with the named bones turned (pose: {boneName:[x,y,z]})
export function posed(c, pose) {
  const B = c.m.bones, R = [], T = [];
  B.forEach((b, i) => {                                   // parents always come before children in these files
    const L = euler(pose[b.name] || []);
    if (b.parent < 0) { R[i] = L; T[i] = b.head.slice(); return; }
    const p = b.parent, h = B[p].head, o = app(R[p], [b.head[0] - h[0], b.head[1] - h[1], b.head[2] - h[2]]);
    R[i] = mul(R[p], L); T[i] = [T[p][0] + o[0], T[p][1] + o[1], T[p][2] + o[2]];
  });
  const out = new Float64Array(c.pos.length);
  for (let i = 0; i < c.n; i++) {
    let s = 0; for (let k = 0; k < 4; k++) s += c.sw[i * 4 + k];
    for (let k = 0; k < 4; k++) {
      const w = c.sw[i * 4 + k] / (s || 1); if (!w) continue;
      const b = c.si[i * 4 + k], h = B[b].head, v = app(R[b], [c.pos[i * 3] - h[0], c.pos[i * 3 + 1] - h[1], c.pos[i * 3 + 2] - h[2]]);
      for (let a = 0; a < 3; a++) out[i * 3 + a] += w * (v[a] + T[b][a]);
    }
  }
  return out;
}
// the edges that grow most between rest and a pose: [{ratio, a, b}] where a and b are corner numbers
export function stretch(c, now, top = 8, least = .004) {
  const len = (arr, i, j) => Math.hypot(arr[i * 3] - arr[j * 3], arr[i * 3 + 1] - arr[j * 3 + 1], arr[i * 3 + 2] - arr[j * 3 + 2]), all = [];
  for (let f = 0; f < c.m.faces; f++) for (let k = 0; k < 3; k++) {
    const a = f * 3 + k, b = f * 3 + (k + 1) % 3, r0 = len(c.pos, a, b); if (r0 > least) all.push({ ratio: len(now, a, b) / r0, a, b, rest: r0 });
  }
  return all.sort((x, y) => y.ratio - x.ratio).slice(0, top);
}
export const weights = (c, i) => [0, 1, 2, 3].filter(k => c.sw[i * 4 + k]).map(k => c.m.bones[c.si[i * 4 + k]].name + ':' + c.sw[i * 4 + k]).join(' ');
export const at = (c, i) => [0, 1, 2].map(a => c.pos[i * 3 + a].toFixed(3)).join(',');
