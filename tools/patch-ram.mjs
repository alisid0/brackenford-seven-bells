// Repairs the shade ram's left hind leg by mirroring the right hind leg (0_Right_Limb_1..4, hung from 0_Right_Limb_0)
// across x = 0 into HindL_1..4 and transferring weights cleanly so zero vertices stay on the broken 0_Left_Limb_0..3.
//   node tools/patch-ram.mjs
// Reads assets/staging/shade-ram-rig-turned.json and writes assets/staging/shade-ram-rig-turned-patched.json beside it.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const staging = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'staging');
const b64 = s => Buffer.from(s, 'base64');

const file = 'shade-ram-rig-turned.json';
const out = 'shade-ram-rig-turned-patched.json';
const m = JSON.parse(readFileSync(join(staging, file), 'utf8'));
const pb = b64(m.p), P = new Int16Array(pb.buffer, pb.byteOffset, pb.length / 2);
const si = Uint8Array.from(b64(m.si)), sw = Uint8Array.from(b64(m.sw));
const n = P.length / 3;
const pos = i => [P[i * 3] / m.unit, P[i * 3 + 1] / m.unit, P[i * 3 + 2] / m.unit];
const id = name => { const i = m.bones.findIndex(b => b.name === name); if (i < 0) throw new Error('no bone ' + name); return i; };
const flip = v => [-v[0], v[1], v[2]];

// Mirror 0_Right_Limb_1..4 -> HindL_1..4, hanging HindL_1 from 0_Right_Limb_0 (hips) just like 0_Right_Limb_1
const add = {
  '0_Right_Limb_1': 'HindL_1',
  '0_Right_Limb_2': 'HindL_2',
  '0_Right_Limb_3': 'HindL_3',
  '0_Right_Limb_4': 'HindL_4'
};
const oldLeft = new Set(['0_Left_Limb_0', '0_Left_Limb_1', '0_Left_Limb_2', '0_Left_Limb_3'].map(id));
const map = new Map();
for (const [src, name] of Object.entries(add)) {
  const s = m.bones[id(src)];
  map.set(id(src), m.bones.length);
  m.bones.push({ name, parent: -1, head: flip(s.head).map(v => +v.toFixed(5)), tail: flip(s.tail).map(v => +v.toFixed(5)) });
}
for (const src of Object.keys(add)) {
  const s = m.bones[id(src)], d = m.bones[map.get(id(src))];
  d.parent = map.has(s.parent) ? map.get(s.parent) : s.parent;
}

const rightSet = new Set(Object.keys(add).map(id));
// Candidate vertices on the right hind leg & pelvis seam (excludes any vertex referencing oldLeft)
const goodLeg = [], goodSeam = [];
for (let i = 0; i < n; i++) {
  const p = pos(i);
  let wR = 0, wOld = 0;
  for (let k = 0; k < 4; k++) {
    if (rightSet.has(si[i * 4 + k])) wR += sw[i * 4 + k];
    if (oldLeft.has(si[i * 4 + k])) wOld += sw[i * 4 + k];
  }
  if (wOld > 0) continue;
  if (wR > 0) goodLeg.push(i);
  if (p[0] <= 0.015 && p[2] <= -0.02 && p[1] <= 0.64) goodSeam.push(i);
}

// Re-weight every +x vertex that either belonged to oldLeft or sits within reach of the mirrored right hind leg
const reachSq = 0.08 * 0.08;
let changed = 0, residualOld = 0;
for (let i = 0; i < n; i++) {
  const p = pos(i);
  let hasOld = false;
  for (let k = 0; k < 4; k++) if (oldLeft.has(si[i * 4 + k]) && sw[i * 4 + k] > 0) hasOld = true;
  if (!hasOld && (p[0] <= 0.015 || p[2] > -0.04 || p[1] > 0.56)) continue;

  const q = flip(p);
  // Check distance to mirrored right-leg vertices first so torso/tail stays untouched unless near the leg
  if (!hasOld) {
    let nearLeg = false;
    for (const g of goodLeg) {
      const a = pos(g), d = (a[0] - q[0]) ** 2 + (a[1] - q[1]) ** 2 + (a[2] - q[2]) ** 2;
      if (d < reachSq) { nearLeg = true; break; }
    }
    if (!nearLeg) continue;
  }

  // Match against goodSeam (which includes the right leg + smooth pelvis blend) so upper-hip transitions stay seamless
  let best = -1, bd = 1e9;
  for (const g of goodSeam) {
    const a = pos(g), d = (a[0] - q[0]) ** 2 + (a[1] - q[1]) ** 2 + (a[2] - q[2]) ** 2;
    if (d < bd) { bd = d; best = g; }
  }
  if (best < 0) continue;
  for (let k = 0; k < 4; k++) {
    const b = si[best * 4 + k];
    si[i * 4 + k] = map.has(b) ? map.get(b) : b;
    sw[i * 4 + k] = sw[best * 4 + k];
  }
  changed++;
}

for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) if (oldLeft.has(si[i * 4 + k]) && sw[i * 4 + k] > 0) residualOld++;
if (residualOld > 0) throw new Error('Residual weights remain on 0_Left_Limb_0..3: ' + residualOld);

m.si = Buffer.from(si).toString('base64');
m.sw = Buffer.from(sw).toString('base64');
writeFileSync(join(staging, out), JSON.stringify(m));
console.log(out, '-', m.bones.length, 'bones,', changed, 'vertices re-weighted, 0 left on 0_Left_Limb_0..3');
for (const name of Object.values(add)) {
  const b = m.bones[id(name)];
  console.log(' ', b.name.padEnd(10), 'parent=' + m.bones[b.parent].name.padEnd(14), 'head=' + JSON.stringify(b.head));
}
