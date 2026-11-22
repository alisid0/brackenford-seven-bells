// Turns the shade ram to face straight down +z, as the game expects of a creature.
//   node tools/turn-ram.mjs
// Tripo modelled it from a three-quarter picture, so in assets/staging/shade-ram-rig.json its body lies at an angle
// across the file's axes. This reads where its four feet are, turns every corner of the mesh and every bone about
// the upright axis so the line from hind feet to forefeet runs along +z, and centres it between its feet.
// Writes assets/staging/shade-ram-rig-turned.json. Nothing else in the file changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const staging = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'staging');
const m = JSON.parse(readFileSync(join(staging, 'shade-ram-rig.json'), 'utf8'));
const head = n => m.bones.find(b => b.name === n).head;
const FEET = { hindLeft: '0_Left_Limb_3', hindRight: '0_Right_Limb_4', foreLeft: 'bone_30', foreRight: 'bone_26' };
const mid = (a, b) => a.map((v, k) => (v + b[k]) / 2);
const hind = mid(head(FEET.hindLeft), head(FEET.hindRight)), fore = mid(head(FEET.foreLeft), head(FEET.foreRight));
const fx = fore[0] - hind[0], fz = fore[2] - hind[2], L = Math.hypot(fx, fz), a = fz / L, b = -fx / L;   // cos and sin of the turn
const centre = mid(hind, fore), cx = centre[0] * a + centre[2] * b;
const turn = p => [p[0] * a + p[2] * b - cx, p[1], -p[0] * b + p[2] * a];
const pb = Buffer.from(m.p, 'base64'), P = new Int16Array(pb.buffer, pb.byteOffset, pb.length / 2), out = new Int16Array(P.length);
for (let i = 0; i < P.length; i += 3) { const q = turn([P[i], P[i + 1], P[i + 2]].map(v => v / m.unit)); for (let k = 0; k < 3; k++) out[i + k] = Math.round(q[k] * m.unit); }
m.p = Buffer.from(out.buffer).toString('base64');
for (const bone of m.bones) { bone.head = turn(bone.head).map(v => +v.toFixed(5)); bone.tail = turn(bone.tail).map(v => +v.toFixed(5)); }
writeFileSync(join(staging, 'shade-ram-rig-turned.json'), JSON.stringify(m));
console.log('turned by', (Math.atan2(b, a) * 180 / Math.PI).toFixed(1), 'degrees');
for (const bone of m.bones) console.log(' ', bone.name.padEnd(16), (bone.parent >= 0 ? m.bones[bone.parent].name : '-').padEnd(16), bone.head.map(v => v.toFixed(2).padStart(6)).join(' '));
