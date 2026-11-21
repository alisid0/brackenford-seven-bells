// Adds the bones Tripo's auto-rig left out, by mirroring the side it did rig.
//   node tools/patch-rig.mjs
// Reads assets/staging/<name>-rig.json and writes <name>-rig-patched.json beside it.
// For each patch: the named bones on the good side are copied across the creature's middle as new bones, and every
// corner of the mesh on the bare side takes the weights of the nearest mirrored corner on the good side, with the
// bone numbers swapped to the new ones. Nothing else in the file changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const staging = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'staging');
const b64 = s => Buffer.from(s, 'base64');

function patch(file, out, jobs) {
  const m = JSON.parse(readFileSync(join(staging, file), 'utf8'));
  const pb = b64(m.p), P = new Int16Array(pb.buffer, pb.byteOffset, pb.length / 2), si = Uint8Array.from(b64(m.si)), sw = Uint8Array.from(b64(m.sw));
  const n = P.length / 3, pos = i => [P[i * 3] / m.unit, P[i * 3 + 1] / m.unit, P[i * 3 + 2] / m.unit];
  const id = name => { const i = m.bones.findIndex(b => b.name === name); if (i < 0) throw new Error(file + ': no bone ' + name); return i; };
  for (const job of jobs) {
    const ax = job.axis, flip = v => v.map((c, k) => k === ax ? -c : c);
    // new bones: mirror each source bone; its parent is the mirror partner of the source's parent, where one is given
    const map = new Map();                                                       // source bone index -> bone index on the bare side
    for (const [src, dst] of Object.entries(job.partners || {})) map.set(id(src), id(dst));
    for (const [src, name] of Object.entries(job.add)) { map.set(id(src), m.bones.length); m.bones.push({ name, parent: -1, head: flip(m.bones[id(src)].head), tail: flip(m.bones[id(src)].tail) }); }
    for (const src of Object.keys(job.add)) { const s = m.bones[id(src)], d = m.bones[map.get(id(src))]; d.parent = map.has(s.parent) ? map.get(s.parent) : s.parent; }
    const sources = new Set(Object.keys(job.add).map(id));
    // corners on the good side that the source bones move
    const good = []; for (let i = 0; i < n; i++) { let w = 0; for (let k = 0; k < 4; k++) if (sources.has(si[i * 4 + k])) w += sw[i * 4 + k]; if (w > 0) good.push(i); }
    let changed = 0, far = 0;
    for (let i = 0; i < n; i++) {
      const p = pos(i); if (p[ax] * job.bareSide <= job.margin) continue;        // only the bare side
      const q = flip(p); let best = -1, bd = job.reach * job.reach;
      for (const g of good) { const a = pos(g), d = (a[0] - q[0]) ** 2 + (a[1] - q[1]) ** 2 + (a[2] - q[2]) ** 2; if (d < bd) { bd = d; best = g; } }
      if (best < 0) { far++; continue; }
      for (let k = 0; k < 4; k++) { const b = si[best * 4 + k]; si[i * 4 + k] = map.has(b) ? map.get(b) : b; sw[i * 4 + k] = sw[best * 4 + k]; }
      changed++;
    }
    console.log(' ', job.what + ':', Object.values(job.add).length, 'bones added,', changed, 'corners re-weighted from', good.length, 'on the good side');
  }
  m.si = Buffer.from(si).toString('base64'); m.sw = Buffer.from(sw).toString('base64');
  writeFileSync(join(staging, out), JSON.stringify(m));
  console.log(out, '-', m.bones.length, 'bones');
}

console.log('hare');
patch('shade-hare-standing-rig.json', 'shade-hare-standing-rig-patched.json', [
  // x is the creature's left-right axis. Tripo gave the foreleg on the +x side a paw joint and the other none.
  { what: 'paw joint for the second foreleg', axis: 0, bareSide: -1, margin: .01, reach: .06,
    partners: { '0_Right_Limb_0': '0_Left_Limb_0', '0_Right_Limb_1': '0_Left_Limb_1' }, add: { '0_Right_Limb_2': '0_Left_Limb_2' } },
  // the ear chain Head_2..4 sits on the -x side; the +x ear has no bones of its own
  { what: 'bones for the second ear', axis: 0, bareSide: 1, margin: .005, reach: .07,
    add: { Head_2: 'Ear2_0', Head_3: 'Ear2_1', Head_4: 'Ear2_2' } },
]);
console.log('crow');
patch('shade-crow-rig.json', 'shade-crow-rig-patched.json', [
  // the crow lies sideways in its file, so its left-right axis is z. The leg on +z is jointed; the one on -z has one bone.
  { what: 'joints for the second leg', axis: 2, bareSide: -1, margin: .01, reach: .07,
    partners: { '0_Left_Limb_0': 'bone_32' },
    add: { '0_Left_Limb_1': 'Leg2_1', '0_Left_Limb_2': 'Leg2_2', '0_Left_Limb_3': 'Leg2_3', bone_30: 'Leg2_toe_a', bone_31: 'Leg2_toe_b' } },
]);
