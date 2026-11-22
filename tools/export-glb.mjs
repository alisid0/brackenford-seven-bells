// Exports every PROPS.<name> builder in src/props.js to binary glTF 2.0 (.glb) files under assets/glb/,
// with plain PBR materials named after their palette colour (for remapping in Unity) and assets/glb/manifest.json.
// Zero external dependencies: loads the Three.js r184 bundle already embedded in Brackenford-Seven-Bells.html.
// Usage: node tools/export-glb.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outDir = join(root, 'assets', 'glb');
mkdirSync(outDir, { recursive: true });

// 1. Load embedded Three.js and src/props.js in a clean VM context
const html = readFileSync(join(root, 'Brackenford-Seven-Bells.html'), 'utf8');
const a = html.indexOf('<script>') + 8, b = html.indexOf('</script>', a);
if (a < 8 || b < 0) throw new Error('Embedded Three.js script block not found in Brackenford-Seven-Bells.html');
const threeSrc = html.slice(a, b);
const propsSrc = readFileSync(join(root, 'src', 'props.js'), 'utf8');

const ctx = {
 window: null, self: null, console, Math,
 Float32Array, Uint16Array, Uint32Array, Int16Array, Uint8Array, ArrayBuffer, DataView,
 Map, Set, Object, Array, Number, String, Boolean, Error, TypeError,
 performance: { now: () => 0 }
};
ctx.window = ctx; ctx.self = ctx;
vm.createContext(ctx);
vm.runInContext(threeSrc, ctx);
vm.runInContext(propsSrc, ctx);

const T = ctx.THREE, PROPS = ctx.PROPS;

// 2. Named palette lookup (hex -> palette name) so glTF/Unity materials carry readable palette names
const EXTRA_COLORS = {
 belfryTimber: '#825435', belfryTimberDark: '#6a4229',
 iron: '#3b3538', bronze: '#ae783e', gold: '#f0c75a',
 plum: '#4a2943', plumLight: '#6d3362', hem: '#ae493d', rope: '#c9a66b', emberEye: '#e02e32'
};
const COLOR_NAME = new Map();
for (const [k, hex] of Object.entries({ ...PROPS.PALETTE, ...EXTRA_COLORS })) {
 const norm = new T.Color(hex).getHexString();
 if (!COLOR_NAME.has(norm)) COLOR_NAME.set(norm, k);
}
const matNameFor = hex6 => {
 const h = hex6.toLowerCase();
 return COLOR_NAME.has(h) ? `${COLOR_NAME.get(h)}_${h}` : `color_${h}`;
};

// 3. Collect visible geometry from a Three.js hierarchy, preserving named articulated children (e.g. bell, flag)
function collectNode(rootObj, articulated) {
 rootObj.updateMatrixWorld(true);
 const invRoot = rootObj.matrixWorld.clone().invert();
 const nodes = [{ name: 'root', obj: rootObj, parent: -1, translation: [0, 0, 0], buckets: new Map() }];
 const nodeOf = new Map([[rootObj, 0]]);

 for (const [childName, childObj] of Object.entries(articulated)) {
  if (!childObj) continue;
  const rel = invRoot.clone().multiply(childObj.matrixWorld);
  const pos = new T.Vector3(); pos.setFromMatrixPosition(rel);
  const idx = nodes.length;
  nodes.push({ name: childName, obj: childObj, parent: 0, translation: [pos.x, pos.y, pos.z], buckets: new Map() });
  nodeOf.set(childObj, idx);
 }

 const ownerOf = obj => {
  let cur = obj;
  while (cur) { if (nodeOf.has(cur)) return nodeOf.get(cur); cur = cur.parent; }
  return 0;
 };

 const v0 = new T.Vector3(), v1 = new T.Vector3(), v2 = new T.Vector3();
 const e1 = new T.Vector3(), e2 = new T.Vector3(), fn = new T.Vector3();
 const tmpCol = new T.Color();

 function walk(obj) {
  if (!obj.visible) return;
  if (obj.isMesh && obj.geometry) {
   const ownerIdx = ownerOf(obj);
   const owner = nodes[ownerIdx];
   const relMat = owner.obj.matrixWorld.clone().invert().multiply(obj.matrixWorld);
   const flip = relMat.determinant() < 0;
   const geo = obj.geometry;
   const posAttr = geo.attributes.position;
   const colAttr = geo.attributes.color;
   const idxAttr = geo.index;
   const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
   const doubleSided = mat && mat.side === T.DoubleSide;
   const useVertCol = !!(mat && mat.vertexColors && colAttr);
   const triCount = idxAttr ? idxAttr.count / 3 : posAttr.count / 3;

   for (let t = 0; t < triCount; t++) {
    const i0 = idxAttr ? idxAttr.getX(t * 3) : t * 3;
    const i1 = idxAttr ? idxAttr.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = idxAttr ? idxAttr.getX(t * 3 + 2) : t * 3 + 2;
    v0.fromBufferAttribute(posAttr, i0).applyMatrix4(relMat);
    v1.fromBufferAttribute(posAttr, flip ? i2 : i1).applyMatrix4(relMat);
    v2.fromBufferAttribute(posAttr, flip ? i1 : i2).applyMatrix4(relMat);

    // Recompute exact outward flat normal per triangle (guards against negative-scale mirroring)
    e1.subVectors(v1, v0); e2.subVectors(v2, v0); fn.crossVectors(e1, e2);
    const len = fn.length();
    if (len < 1e-10) continue;
    fn.divideScalar(len);

    if (useVertCol) tmpCol.setRGB(colAttr.getX(i0), colAttr.getY(i0), colAttr.getZ(i0));
    else if (mat && mat.color) tmpCol.copy(mat.color);
    else tmpCol.setRGB(1, 1, 1);

    const hex6 = tmpCol.getHexString();
    const key = matNameFor(hex6);
    let bucket = owner.buckets.get(key);
    if (!bucket) {
     bucket = { name: key, rgb: [tmpCol.r, tmpCol.g, tmpCol.b], doubleSided: false, pos: [], norm: [] };
     owner.buckets.set(key, bucket);
    }
    if (doubleSided) bucket.doubleSided = true;
    bucket.pos.push(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
    bucket.norm.push(fn.x, fn.y, fn.z, fn.x, fn.y, fn.z, fn.x, fn.y, fn.z);
   }
  }
  for (const ch of obj.children) walk(ch);
 }
 walk(rootObj);
 return nodes;
}

// 4. Pure glTF 2.0 binary (.glb) serializer
function buildGlb(propId, collectedNodes) {
 const materials = [], matIndex = new Map();
 const bufferViews = [], accessors = [], meshes = [], gltfNodes = [];
 const chunks = [];
 let byteOffset = 0;

 const getMat = (name, rgb, doubleSided) => {
  if (matIndex.has(name)) {
   const idx = matIndex.get(name);
   if (doubleSided) materials[idx].doubleSided = true;
   return idx;
  }
  const idx = materials.length;
  const m = {
   name,
   pbrMetallicRoughness: {
    baseColorFactor: [+rgb[0].toFixed(6), +rgb[1].toFixed(6), +rgb[2].toFixed(6), 1],
    metallicFactor: 0,
    roughnessFactor: 0.95
   }
  };
  if (doubleSided) m.doubleSided = true;
  materials.push(m);
  matIndex.set(name, idx);
  return idx;
 };

 const appendFloat32 = (arr, target) => {
  const f32 = new Float32Array(arr);
  const buf = Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength);
  const bvIdx = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset, byteLength: buf.byteLength, target });
  chunks.push(buf);
  byteOffset += buf.byteLength;
  return bvIdx;
 };

 const childIndices = [];
 collectedNodes.forEach((n, idx) => {
  const primitives = [];
  for (const b of n.buckets.values()) {
   if (!b.pos.length) continue;
   const count = b.pos.length / 3;
   const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
   for (let i = 0; i < b.pos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
     const v = b.pos[i + k];
     if (v < min[k]) min[k] = v;
     if (v > max[k]) max[k] = v;
    }
   }
   const posBV = appendFloat32(b.pos, 34962);
   const posAcc = accessors.length;
   accessors.push({ bufferView: posBV, componentType: 5126, count, type: 'VEC3', min, max });

   const normBV = appendFloat32(b.norm, 34962);
   const normAcc = accessors.length;
   accessors.push({ bufferView: normBV, componentType: 5126, count, type: 'VEC3' });

   primitives.push({
    attributes: { POSITION: posAcc, NORMAL: normAcc },
    material: getMat(b.name, b.rgb, b.doubleSided),
    mode: 4
   });
  }

  const nodeObj = { name: idx === 0 ? propId : n.name };
  if (idx > 0) {
   if (n.translation.some(v => Math.abs(v) > 1e-6)) nodeObj.translation = n.translation.map(v => +v.toFixed(6));
   childIndices.push(idx);
  }
  if (primitives.length) {
   const mIdx = meshes.length;
   meshes.push({ name: nodeObj.name + '_mesh', primitives });
   nodeObj.mesh = mIdx;
  }
  gltfNodes.push(nodeObj);
 });
 if (childIndices.length) gltfNodes[0].children = childIndices;

 // Pad BIN chunk to 4-byte boundary
 const binPad = (4 - (byteOffset % 4)) % 4;
 if (binPad) { chunks.push(Buffer.alloc(binPad, 0)); byteOffset += binPad; }
 const binBuf = Buffer.concat(chunks, byteOffset);

 const gltf = {
  asset: { version: '2.0', generator: 'brackenford-export-glb' },
  scene: 0,
  scenes: [{ name: propId, nodes: [0] }],
  nodes: gltfNodes,
  meshes,
  materials,
  accessors,
  bufferViews,
  buffers: [{ byteLength: binBuf.byteLength }]
 };

 let jsonBuf = Buffer.from(JSON.stringify(gltf), 'utf8');
 const jsonPad = (4 - (jsonBuf.byteLength % 4)) % 4;
 if (jsonPad) jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);

 const totalLen = 12 + 8 + jsonBuf.byteLength + 8 + binBuf.byteLength;
 const header = Buffer.alloc(12);
 header.writeUInt32LE(0x46546C67, 0); // 'glTF'
 header.writeUInt32LE(2, 4);          // version 2
 header.writeUInt32LE(totalLen, 8);

 const jsonHead = Buffer.alloc(8);
 jsonHead.writeUInt32LE(jsonBuf.byteLength, 0);
 jsonHead.writeUInt32LE(0x4E4F534A, 4); // 'JSON'

 const binHead = Buffer.alloc(8);
 binHead.writeUInt32LE(binBuf.byteLength, 0);
 binHead.writeUInt32LE(0x004E4942, 4); // 'BIN\0'

 return { glb: Buffer.concat([header, jsonHead, jsonBuf, binHead, binBuf]), gltf };
}

// 5. Round-trip GLB binary parser & validator (reads raw bytes back from disk and compares against live Three.js prop)
function verifyGlb(filePath, expectedTris, expectedBox) {
 const raw = readFileSync(filePath);
 if (raw.byteLength < 20) throw new Error('GLB too short: ' + filePath);
 const magic = raw.readUInt32LE(0), ver = raw.readUInt32LE(4), total = raw.readUInt32LE(8);
 if (magic !== 0x46546C67 || ver !== 2 || total !== raw.byteLength) {
  throw new Error(`Invalid GLB header in ${filePath}: magic=${magic} ver=${ver} total=${total}/${raw.byteLength}`);
 }
 const jLen = raw.readUInt32LE(12), jType = raw.readUInt32LE(16);
 if (jType !== 0x4E4F534A) throw new Error('Missing JSON chunk in ' + filePath);
 const gltf = JSON.parse(raw.subarray(20, 20 + jLen).toString('utf8'));
 const binOff = 20 + jLen;
 const bLen = raw.readUInt32LE(binOff), bType = raw.readUInt32LE(binOff + 4);
 if (bType !== 0x004E4942) throw new Error('Missing BIN chunk in ' + filePath);
 const bin = raw.subarray(binOff + 8, binOff + 8 + bLen);
 if (gltf.asset?.version !== '2.0') throw new Error('Wrong glTF version');

 const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
 let parsedTris = 0, primCount = 0;

 function visitNode(idx, offset) {
  const nd = gltf.nodes[idx];
  const t = nd.translation || [0, 0, 0];
  const off = [offset[0] + t[0], offset[1] + t[1], offset[2] + t[2]];
  if (nd.mesh !== undefined) {
   const mesh = gltf.meshes[nd.mesh];
   for (const pr of mesh.primitives) {
    primCount++;
    const pAcc = gltf.accessors[pr.attributes.POSITION];
    const nAcc = gltf.accessors[pr.attributes.NORMAL];
    const pBV = gltf.bufferViews[pAcc.bufferView];
    const nBV = gltf.bufferViews[nAcc.bufferView];
    if (gltf.materials[pr.material] === undefined) throw new Error('Invalid material index');
    const pFloats = new Float32Array(bin.buffer, bin.byteOffset + pBV.byteOffset, pAcc.count * 3);
    const nFloats = new Float32Array(bin.buffer, bin.byteOffset + nBV.byteOffset, nAcc.count * 3);
    parsedTris += pAcc.count / 3;
    for (let i = 0; i < pFloats.length; i += 3) {
     for (let k = 0; k < 3; k++) {
      const v = pFloats[i + k];
      if (!Number.isFinite(v)) throw new Error('Non-finite POSITION in ' + filePath);
      if (v < pAcc.min[k] - 1e-5 || v > pAcc.max[k] + 1e-5) throw new Error('POSITION out of accessor bounds');
      const wv = v + off[k];
      if (wv < min[k]) min[k] = wv;
      if (wv > max[k]) max[k] = wv;
     }
     const nl = Math.hypot(nFloats[i], nFloats[i + 1], nFloats[i + 2]);
     if (!Number.isFinite(nl) || Math.abs(nl - 1) > 1e-3) throw new Error('Non-unit NORMAL in ' + filePath);
    }
   }
  }
  for (const c of nd.children || []) visitNode(c, off);
 }
 for (const rootNode of gltf.scenes[gltf.scene].nodes) visitNode(rootNode, [0, 0, 0]);

 if (Math.round(parsedTris) !== expectedTris) {
  throw new Error(`Triangle mismatch in ${filePath}: glb=${parsedTris} vs three=${expectedTris}`);
 }
 const expMin = [expectedBox.min.x, expectedBox.min.y, expectedBox.min.z];
 const expMax = [expectedBox.max.x, expectedBox.max.y, expectedBox.max.z];
 for (let k = 0; k < 3; k++) {
  if (Math.abs(min[k] - expMin[k]) > 0.002 || Math.abs(max[k] - expMax[k]) > 0.002) {
   throw new Error(`BBox mismatch in ${filePath} axis ${k}: glb=[${min[k]},${max[k]}] vs three=[${expMin[k]},${expMax[k]}]`);
  }
 }
 return {
  triangles: Math.round(parsedTris),
  meshes: gltf.meshes.length,
  primitives: primCount,
  materials: gltf.materials.map(m => m.name),
  nodes: gltf.nodes.map(n => n.translation ? { name: n.name, translation: n.translation } : { name: n.name }),
  boundingBox: {
   min: min.map(v => +v.toFixed(4)),
   max: max.map(v => +v.toFixed(4)),
   size: [0, 1, 2].map(k => +(max[k] - min[k]).toFixed(4))
  },
  bytes: raw.byteLength
 };
}

// Compute exact visible-only triangle count & Box3 on live Three.js prop (matching what is exported)
function measureVisible(rootObj) {
 rootObj.updateMatrixWorld(true);
 const box = new T.Box3();
 const v = new T.Vector3();
 let tris = 0;
 function walk(o) {
  if (!o.visible) return;
  if (o.isMesh && o.geometry) {
   const g = o.geometry, pos = g.attributes.position, idx = g.index;
   const tc = idx ? idx.count / 3 : pos.count / 3;
   for (let t = 0; t < tc; t++) {
    const a0 = idx ? idx.getX(t * 3) : t * 3;
    const a1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
    const a2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
    const p0 = new T.Vector3().fromBufferAttribute(pos, a0).applyMatrix4(o.matrixWorld);
    const p1 = new T.Vector3().fromBufferAttribute(pos, a1).applyMatrix4(o.matrixWorld);
    const p2 = new T.Vector3().fromBufferAttribute(pos, a2).applyMatrix4(o.matrixWorld);
    if (p1.clone().sub(p0).cross(p2.clone().sub(p0)).length() < 1e-10) continue;
    tris++;
    box.expandByPoint(p0); box.expandByPoint(p1); box.expandByPoint(p2);
   }
  }
  for (const c of o.children) walk(c);
 }
 walk(rootObj);
 return { tris, box };
}

// 6. Export catalogue: every PROPS builder, plus belfry states and hut variants
const EXPORTS = [
 { id: 'thornwood-bow', prop: 'thornwoodBow', opt: {}, build: () => PROPS.thornwoodBow(T) },
 { id: 'market-stall', prop: 'marketStall', opt: {}, build: () => PROPS.marketStall(T) },
 { id: 'belfry-silent', prop: 'belfry', opt: { state: 'silent' }, build: () => PROPS.belfry(T, { state: 'silent' }), art: o => ({ bell: o.userData.bell }) },
 { id: 'belfry-restored', prop: 'belfry', opt: { state: 'restored' }, build: () => PROPS.belfry(T, { state: 'restored' }), art: o => ({ bell: o.userData.bell }) },
 { id: 'hut-0', prop: 'hut', opt: { variant: 0 }, build: () => PROPS.hut(T, { variant: 0 }) },
 { id: 'hut-1', prop: 'hut', opt: { variant: 1 }, build: () => PROPS.hut(T, { variant: 1 }) },
 { id: 'hut-2', prop: 'hut', opt: { variant: 2 }, build: () => PROPS.hut(T, { variant: 2 }) },
 { id: 'watchtower', prop: 'watchtower', opt: {}, build: () => PROPS.watchtower(T) },
 { id: 'footbridge', prop: 'footbridge', opt: {}, build: () => PROPS.footbridge(T) },
 { id: 'jetty', prop: 'jetty', opt: {}, build: () => PROPS.jetty(T) },
 { id: 'wind-pennant', prop: 'windPennant', opt: {}, build: () => PROPS.windPennant(T), art: o => ({ flag: o.userData.flag }) },
 { id: 'blossom-tree', prop: 'blossomTree', opt: {}, build: () => PROPS.blossomTree(T) },
 { id: 'rail', prop: 'rail', opt: {}, build: () => PROPS.rail(T) },
 { id: 'deck', prop: 'deck', opt: {}, build: () => PROPS.deck(T) }
];

const manifest = {
 generator: 'tools/export-glb.mjs',
 threeRevision: Number(T.REVISION),
 units: 'metres',
 coordinateSystem: 'glTF 2.0 right-handed, y-up, forward +z, pivot at base (0,0,0)',
 count: EXPORTS.length,
 props: []
};

for (const item of EXPORTS) {
 const obj = item.build();
 const articulated = item.art ? item.art(obj) : {};
 const expected = measureVisible(obj);
 const collected = collectNode(obj, articulated);
 const { glb } = buildGlb(item.id, collected);
 const file = item.id + '.glb';
 const fullPath = join(outDir, file);
 writeFileSync(fullPath, glb);
 const verified = verifyGlb(fullPath, expected.tris, expected.box);

 const points = {};
 for (const [pk, pv] of Object.entries(obj.userData.points || {})) {
  points[pk] = [+pv.x.toFixed(4), +pv.y.toFixed(4), +pv.z.toFixed(4)];
 }
 manifest.props.push({
  file,
  name: obj.userData.name || item.id,
  prop: item.prop,
  options: item.opt,
  triangles: verified.triangles,
  meshes: verified.meshes,
  primitives: verified.primitives,
  materials: verified.materials,
  bytes: verified.bytes,
  boundingBox: verified.boundingBox,
  nodes: verified.nodes,
  points
 });
 console.log(
  `OK ${file.padEnd(20)} | ${String(verified.triangles).padStart(4)} tris | ${verified.meshes} mesh / ${String(verified.primitives).padStart(2)} mats | ` +
  `size=[${verified.boundingBox.size.map(v => v.toFixed(2)).join(', ')}] | ${(verified.bytes / 1024).toFixed(1)} KB`
 );
}

writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Exported and round-trip verified ${manifest.props.length} GLB files -> assets/glb/manifest.json`);
