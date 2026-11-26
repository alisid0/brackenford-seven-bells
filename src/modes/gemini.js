// Lantern Cascade — carefree festival sky-gallery & chain-reaction arcade mode.
// Registers via arcadeMode('gemini', {...}). Zero per-frame mesh/vector allocations; <= 8 shootable slots at once.
(() => {
 const MAX_SLOTS = 8;
 const FLOW_TIERS = [[0, 1], [4, 1.25], [9, 1.5], [14, 1.75], [20, 2]];
 const PENTA = [293.66, 329.63, 392, 440, 493.88, 587.33, 659.25, 783.99, 880, 1174.66];
 const VOLLEY_NOTES = [587.33, 659.25, 783.99, 880, 987.77, 1174.66];
 const CROWN_AT = [22, 54, 88, 122, 150];
 const BELL_CHARGE_HITS = 6;
 const DISC_G = 2.75;

 // Shared scratch vectors (zero per-frame allocations)
 const tmpA = V(), tmpB = V(), tmpP = V();

 // Reusable scene pool (built once on first start)
 let built = false;
 let mats = null;
 const slots = [];
 const cords = [];
 const throwers = [];

 // Live run state
 const st = {
  on: false,
  flow: 0,
  flowHold: 0,
  flowDecay: 0,
  lastHitAt: -99,
  nextFill: 0,
  nextDisc: 14,
  nextTwin: 5,
  crownIdx: 0,
  finaleDone: false,
  volleyLeft: 0,
  volleyId: 0,
  volleyTotal: 0,
  volleyHits: 0,
  volleyCount: 0,
  bellCharge: 0,
  bellAnnounced: false,
  chains: 0,
  apexes: 0,
  chimes: 0,
  volleysCleared: 0,
  bestFlow: 0,
  lastMsg: false,
  noteIdx: 0
 };

 function flowMult(f) {
  let m = 1;
  for (let i = 0; i < FLOW_TIERS.length; i++) if (f >= FLOW_TIERS[i][0]) m = FLOW_TIERS[i][1];
  return m;
 }

 function flatMat(color, emissive, ei) {
  return new T.MeshStandardMaterial({
   color,
   emissive: emissive || '#000000',
   emissiveIntensity: ei || 0,
   flatShading: true,
   roughness: 0.82
  });
 }

 function makeLanternVis() {
  const g = new T.Group();
  const body = new T.Mesh(new T.CylinderGeometry(0.24, 0.20, 0.50, 8), mats.cream);
  const capT = new T.Mesh(new T.CylinderGeometry(0.16, 0.22, 0.07, 8), mats.timber);
  capT.position.y = 0.28;
  const capB = new T.Mesh(new T.CylinderGeometry(0.18, 0.13, 0.06, 8), mats.timber);
  capB.position.y = -0.27;
  const ring = new T.Mesh(new T.TorusGeometry(0.08, 0.018, 5, 8), mats.gold);
  ring.position.y = 0.36;
  const tassel = new T.Mesh(new T.ConeGeometry(0.05, 0.20, 5), mats.red);
  tassel.position.y = -0.40;
  tassel.rotation.x = Math.PI;
  g.add(body, capT, capB, ring, tassel);
  g.userData.body = body;
  g.userData.tassel = tassel;
  return g;
 }

 function makeTwinVis() {
  const g = new T.Group();
  const body = new T.Mesh(new T.OctahedronGeometry(0.30, 0), mats.jade);
  body.scale.set(0.95, 1.32, 0.95);
  const bandT = new T.Mesh(new T.TorusGeometry(0.22, 0.024, 5, 10), mats.gold);
  bandT.rotation.x = Math.PI / 2;
  bandT.position.y = 0.14;
  const bandB = new T.Mesh(new T.TorusGeometry(0.22, 0.024, 5, 10), mats.gold);
  bandB.rotation.x = Math.PI / 2;
  bandB.position.y = -0.14;
  g.add(body, bandT, bandB);
  g.userData.body = body;
  return g;
 }

 function makeDiscVis() {
  const g = new T.Group();
  const rim = new T.Mesh(new T.CylinderGeometry(0.37, 0.37, 0.065, 12), mats.red);
  rim.rotation.x = Math.PI / 2;
  const mid = new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.078, 12), mats.cream);
  mid.rotation.x = Math.PI / 2;
  const bull = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.09, 10), mats.gold);
  bull.rotation.x = Math.PI / 2;
  g.add(rim, mid, bull);
  return g;
 }

 function makeChimeVis() {
  const g = new T.Group();
  const bar = new T.Mesh(new T.BoxGeometry(0.76, 0.07, 0.07), mats.timber);
  bar.position.y = 0.42;
  const hood = new T.Mesh(new T.ConeGeometry(0.28, 0.16, 6), mats.bronze);
  hood.position.y = 0.54;
  g.add(bar, hood);
  const xs = [-0.24, 0, 0.24];
  const hs = [0.46, 0.58, 0.46];
  for (let i = 0; i < 3; i++) {
   const rod = new T.Mesh(new T.CylinderGeometry(0.038, 0.038, hs[i], 6), i === 1 ? mats.gold : mats.bronze);
   rod.position.set(xs[i], 0.40 - hs[i] * 0.5, 0);
   g.add(rod);
  }
  const card = new T.Mesh(new T.BoxGeometry(0.22, 0.34, 0.025), mats.red);
  card.position.y = -0.34;
  g.add(card);
  return g;
 }

 function makeCrownVis() {
  const g = new T.Group();
  const core = new T.Mesh(new T.OctahedronGeometry(0.36, 0), mats.goldBright);
  const cross = new T.Mesh(new T.OctahedronGeometry(0.36, 0), mats.redGlow);
  cross.rotation.set(Math.PI / 4, Math.PI / 4, 0);
  cross.scale.setScalar(0.88);
  const halo = new T.Mesh(new T.TorusGeometry(0.50, 0.036, 5, 14), mats.goldBright);
  halo.rotation.x = 0.4;
  g.add(core, cross, halo);
  g.userData.halo = halo;
  return g;
 }

 function makeThrower(side) {
  const g = new T.Group();
  const base = new T.Mesh(new T.BoxGeometry(0.55, 0.22, 0.70), mats.timber);
  base.position.y = 0.11;
  const post = new T.Mesh(new T.BoxGeometry(0.14, 0.55, 0.14), mats.timber);
  post.position.set(0, 0.42, 0);
  const arm = new T.Mesh(new T.BoxGeometry(0.09, 0.65, 0.12), mats.bronze);
  arm.position.set(0, 0.65, 0);
  g.add(base, post, arm);
  const [x, z] = yardAt(14.5, side * 8.4);
  g.position.set(x, groundAt(x, z), z);
  g.rotation.y = Math.atan2(YARD.x - x, YARD.z - z);
  g.visible = false;
  scene.add(g);
  return { group: g, arm, kick: 0, side };
 }

 function initPool() {
  if (built) return;
  built = true;
  mats = {
   cream: flatMat('#f6e6bd', '#e6a23c', 0.28),
   red: flatMat('#c5343a', '#a12a30', 0.22),
   redGlow: flatMat('#d93b3b', '#ff6a3c', 0.45),
   gold: flatMat('#F0C75A', '#e6a23c', 0.35),
   goldBright: flatMat('#ffd86b', '#ffaa22', 0.68),
   jade: flatMat('#5fa896', '#2e7a68', 0.32),
   bronze: flatMat('#AE783E', '#74431f', 0.15),
   timber: flatMat('#5a3921', '#000000', 0),
   hit: new T.MeshBasicMaterial({ visible: false }),
   cord: new T.LineBasicMaterial({ color: 0xffd86b, transparent: true, opacity: 0.92 })
  };

  const hitGeo = new T.SphereGeometry(1, 8, 6);
  const [ix, iz] = yardAt(18, 0);
  for (let i = 0; i < MAX_SLOTS; i++) {
   const group = new T.Group();
   group.position.set(ix, 2.5, iz);
   group.visible = false;
   const vis = {
    lantern: makeLanternVis(),
    twin: makeTwinVis(),
    disc: makeDiscVis(),
    chime: makeChimeVis(),
    crown: makeCrownVis()
   };
   for (const k in vis) { vis[k].visible = false; group.add(vis[k]); }
   const hitMesh = new T.Mesh(hitGeo, mats.hit);
   hitMesh.visible = false;
   group.add(hitMesh);
   scene.add(group);
   slots.push({
    idx: i, group, vis, hitMesh,
    active: false, kind: 'lantern', age: 0, life: 10,
    along: 18, right: 0, baseY: 2.2,
    vy: 0, vr: 0, va: 0,
    swayAmp: 0, swayFreq: 0, swayPhase: 0,
    partner: -1, chargedUntil: 0,
    volleyTag: 0, gilded: false, variant: 0, trailAt: 0
   });
  }

  for (let i = 0; i < 2; i++) {
   const geo = new T.BufferGeometry();
   const arr = new Float32Array(9 * 3);
   geo.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
   const line = new T.Line(geo, mats.cord);
   line.frustumCulled = false;
   line.visible = false;
   scene.add(line);
   cords.push({ line, geo, arr, a: -1, b: -1 });
  }

  throwers.push(makeThrower(-1), makeThrower(1));
 }

 function activeCount() {
  let n = 0;
  for (let i = 0; i < MAX_SLOTS; i++) if (slots[i].active) n++;
  return n;
 }

 function hasKind(kind) {
  for (let i = 0; i < MAX_SLOTS; i++) if (slots[i].active && slots[i].kind === kind) return true;
  return false;
 }

 function freeSlot() {
  for (let i = 0; i < MAX_SLOTS; i++) if (!slots[i].active) return slots[i];
  return null;
 }

 function placeSlot(s, along, right, y) {
  const al = Math.max(10.5, Math.min(34, along));
  const rt = Math.max(-8.2, Math.min(8.2, right));
  const [x, z] = yardAt(al, rt);
  const gy = groundAt(x, z);
  const yy = Math.max(gy + 1.15, y);
  s.along = al;
  s.right = rt;
  s.group.position.set(x, yy, z);
  s.group.rotation.set(0, Math.atan2(YARD.x - x, YARD.z - z), 0);
 }

 function showSlot(s, kind, radius) {
  for (const k in s.vis) s.vis[k].visible = (k === kind);
  s.kind = kind;
  s.active = true;
  s.age = 0;
  s.partner = -1;
  s.chargedUntil = 0;
  s.volleyTag = 0;
  s.gilded = false;
  s.trailAt = 0;
  s.hitMesh.scale.setScalar(radius);
  s.hitMesh.visible = true;
  s.group.scale.setScalar(0.01);
  s.group.visible = true;
  s.group.updateMatrixWorld(true);
 }

 function hideSlot(s, refreshTargets) {
  if (!s.active && !s.group.visible) return;
  s.active = false;
  s.group.visible = false;
  s.hitMesh.visible = false;
  s.partner = -1;
  s.chargedUntil = 0;
  s.volleyTag = 0;
  for (let i = 0; i < cords.length; i++) {
   if (cords[i].a === s.idx || cords[i].b === s.idx) {
    cords[i].a = -1; cords[i].b = -1; cords[i].line.visible = false;
   }
  }
  if (refreshTargets) rangeTargets();
 }

 function spawnLantern(gilded, alongOpt, rightOpt, yOpt, volleyTag) {
  const s = freeSlot();
  if (!s) return null;
  const al = alongOpt != null ? alongOpt : watchRand(12, 24.5);
  const rt = rightOpt != null ? rightOpt : watchRand(-6.0, 6.0);
  const [x, z] = yardAt(al, rt);
  const gy = groundAt(x, z);
  const y0 = yOpt != null ? yOpt : gy + watchRand(1.4, 2.5);
  showSlot(s, 'lantern', gilded ? 0.52 : 0.48);
  s.gilded = !!gilded;
  s.volleyTag = volleyTag || 0;
  s.variant = Math.random() < 0.5 ? 0 : 1;
  s.vis.lantern.userData.body.material = gilded ? mats.goldBright : (s.variant ? mats.red : mats.cream);
  s.vis.lantern.userData.tassel.material = gilded ? mats.gold : (s.variant ? mats.cream : mats.red);
  s.life = gilded ? 10.2 : watchRand(8.8, 11.8);
  s.baseY = y0;
  s.vy = gilded ? 0.28 : watchRand(0.28, 0.46);
  s.vr = 0;
  s.va = 0;
  s.swayAmp = gilded ? 0.35 : watchRand(0.45, 0.85);
  s.swayFreq = watchRand(1.1, 1.7);
  s.swayPhase = watchRand(0, 6.28);
  placeSlot(s, al, rt, y0);
  rangeTargets();
  return s;
 }

 function spawnTwins() {
  const free = [];
  for (let i = 0; i < MAX_SLOTS; i++) if (!slots[i].active) free.push(slots[i]);
  if (free.length < 2) return false;
  const cord = cords.find(c => c.a < 0);
  if (!cord) return false;
  const al = watchRand(13.5, 22.5);
  const centerR = watchRand(-2.8, 2.8);
  const spread = watchRand(1.7, 2.3);
  const [x, z] = yardAt(al, centerR);
  const baseY = groundAt(x, z) + watchRand(2.2, 3.3);
  const a = free[0], b = free[1];
  const pair = [[a, centerR - spread, 0], [b, centerR + spread, Math.PI]];
  for (let i = 0; i < 2; i++) {
   const [s, rt, ph] = pair[i];
   showSlot(s, 'twin', 0.47);
   s.vis.twin.userData.body.material = mats.jade;
   s.life = 11.5;
   s.baseY = baseY + (i ? 0.35 : -0.2);
   s.vy = 0.14;
   s.vr = 0;
   s.va = 0;
   s.swayAmp = 0.35;
   s.swayFreq = 1.4;
   s.swayPhase = ph;
   placeSlot(s, al + (i ? 0.4 : -0.4), rt, s.baseY);
  }
  a.partner = b.idx;
  b.partner = a.idx;
  cord.a = a.idx;
  cord.b = b.idx;
  cord.line.visible = true;
  updateCord(cord);
  rangeTargets();
  return true;
 }

 function spawnDisc() {
  const s = freeSlot();
  if (!s) return null;
  const side = Math.random() < 0.5 ? -1 : 1;
  const tr = throwers[side < 0 ? 0 : 1];
  tr.kick = 1;
  const al = watchRand(13.5, 22.5);
  const rt0 = side * 7.6;
  const [x, z] = yardAt(al, rt0);
  const gy = groundAt(x, z);
  const y0 = gy + 1.45;
  showSlot(s, 'disc', 0.50);
  s.life = 4.2;
  s.baseY = y0;
  s.vy = watchRand(4.6, 5.4);
  s.vr = -side * watchRand(3.6, 4.4);
  s.va = watchRand(-0.35, 0.35);
  s.swayAmp = 0;
  placeSlot(s, al, rt0, y0);
  note(165, 0.09, 'triangle', 0.08, 0, 290);
  note(420, 0.05, 'sine', 0.03, 0.02, 540);
  rangeTargets();
  return s;
 }

 function spawnChime() {
  if (hasKind('chime')) return null;
  const s = freeSlot();
  if (!s) return null;
  const al = watchRand(27.5, 32.5);
  const rt = watchRand(-4.5, 4.5);
  const [x, z] = yardAt(al, rt);
  const y0 = groundAt(x, z) + watchRand(3.1, 4.1);
  showSlot(s, 'chime', 0.58);
  s.life = 16.5;
  s.baseY = y0;
  s.vy = 0;
  s.vr = 0;
  s.va = 0;
  s.swayAmp = watchRand(0.95, 1.35);
  s.swayFreq = 1.55;
  s.swayPhase = watchRand(0, 6.28);
  placeSlot(s, al, rt, y0);
  rangeTargets();
  return s;
 }

 function spawnCrown() {
  if (hasKind('crown')) return null;
  const s = freeSlot();
  if (!s) return null;
  const side = Math.random() < 0.5 ? -1 : 1;
  const al = watchRand(16.5, 21.5);
  const rt0 = side * 6.8;
  const [x, z] = yardAt(al, rt0);
  const y0 = groundAt(x, z) + watchRand(3.2, 3.9);
  showSlot(s, 'crown', 0.60);
  s.life = 8.4;
  s.baseY = y0;
  s.vy = 0;
  s.vr = -side * 1.75;
  s.va = 0;
  s.swayAmp = 0.30;
  s.swayFreq = 2.0;
  s.swayPhase = 0;
  placeSlot(s, al, rt0, y0);
  note(587.33, 0.28, 'sine', 0.06, 0, 880);
  rangeTargets();
  return s;
 }

 function triggerVolley(label) {
  st.volleyId++;
  st.volleyLeft = 10.2;
  st.volleyHits = 0;
  st.volleyCount++;
  // Make room for up to 5 golden lanterns while staying strictly <= MAX_SLOTS (8)
  const want = 5;
  let need = want - (MAX_SLOTS - activeCount());
  if (need > 0) {
   for (let i = 0; i < MAX_SLOTS && need > 0; i++) {
    const s = slots[i];
    if (s.active && s.kind === 'lantern' && !s.gilded) { hideSlot(s, false); need--; }
   }
  }
  const fan = [
   [14.0, -5.2, 2.0],
   [16.2, -2.6, 2.5],
   [18.0,  0.0, 2.9],
   [16.2,  2.6, 2.5],
   [14.0,  5.2, 2.0]
  ];
  let made = 0;
  for (let i = 0; i < fan.length; i++) {
   const [al, rt, dy] = fan[i];
   const [x, z] = yardAt(al, rt);
   if (spawnLantern(true, al, rt, groundAt(x, z) + dy, st.volleyId)) made++;
  }
  st.volleyTotal = made;
  rangeTargets();
  if (peal && peal.root) pealRing(true);
  note(587.33, 0.35, 'sine', 0.08, 0);
  note(880, 0.40, 'sine', 0.07, 0.08);
  note(1174.66, 0.45, 'sine', 0.06, 0.16);
  say((label || 'Golden Volley!') + '  ·  ' + made + ' gilded lanterns', 2.8);
 }

 function updateCord(c) {
  if (c.a < 0 || c.b < 0) { c.line.visible = false; return; }
  const sa = slots[c.a], sb = slots[c.b];
  if (!sa.active || !sb.active) { c.a = -1; c.b = -1; c.line.visible = false; return; }
  tmpA.copy(sa.group.position);
  tmpB.copy(sb.group.position);
  const arr = c.arr;
  for (let i = 0; i < 9; i++) {
   const u = i / 8;
   const sag = 4 * u * (1 - u) * 0.42;
   arr[i * 3]     = tmpA.x + (tmpB.x - tmpA.x) * u;
   arr[i * 3 + 1] = tmpA.y + (tmpB.y - tmpA.y) * u - sag;
   arr[i * 3 + 2] = tmpA.z + (tmpB.z - tmpA.z) * u;
  }
  c.geo.attributes.position.needsUpdate = true;
  c.line.visible = true;
 }

 function hideAll() {
  for (let i = 0; i < MAX_SLOTS; i++) hideSlot(slots[i], false);
  for (let i = 0; i < cords.length; i++) { cords[i].a = -1; cords[i].b = -1; cords[i].line.visible = false; }
  for (let i = 0; i < throwers.length; i++) throwers[i].group.visible = false;
  rangeTargets();
 }

 arcadeMode('gemini', {
  name: 'Lantern Cascade',
  seconds: 180,
  marks: [],

  start() {
   initPool();
   hideAll();
   Object.assign(st, {
    on: true,
    flow: 0, flowHold: 0, flowDecay: 0, lastHitAt: -99,
    nextFill: 1.0, nextDisc: 14, nextTwin: 5,
    crownIdx: 0, finaleDone: false,
    volleyLeft: 0, volleyId: 0, volleyTotal: 0, volleyHits: 0, volleyCount: 0,
    bellCharge: 0, bellAnnounced: false,
    chains: 0, apexes: 0, chimes: 0, volleysCleared: 0, bestFlow: 0,
    lastMsg: false, noteIdx: 0
   });
   for (let i = 0; i < MAX_SLOTS; i++) arcadeTarget(slots[i].hitMesh, { slot: i });
   for (let i = 0; i < throwers.length; i++) { throwers[i].group.visible = true; throwers[i].kick = 0; }
   // Opening sky-gallery ready at t = 0 (zero idle gap)
   spawnLantern(false, 13.5, -3.2, null, 0);
   spawnLantern(false, 16.5,  3.4, null, 0);
   spawnLantern(false, 20.5, -0.5, null, 0);
   spawnChime();
   spawnTwins();
  },

  step(dt, left) {
   if (!st.on) return;
   const t = elapsed - range.t0;

   // Gentle carefree Flow decay only if player pauses > 5.2 s (misses never touch Flow)
   if (st.flow > 0) {
    if (st.flowHold > 0) { st.flowHold -= dt; st.flowDecay = 0; }
    else {
     st.flowDecay += dt;
     if (st.flowDecay >= 2.5) { st.flowDecay = 0; st.flow = Math.max(0, st.flow - 3); }
    }
   }

   if (st.volleyLeft > 0) st.volleyLeft = Math.max(0, st.volleyLeft - dt);

   // Animate thrower spring arms
   for (let i = 0; i < throwers.length; i++) {
    const tr = throwers[i];
    if (tr.kick > 0) tr.kick = Math.max(0, tr.kick - dt * 3.5);
    tr.arm.rotation.z = tr.side * (-0.55 + tr.kick * 1.15);
   }

   // Update active targets
   let dirty = false;
   for (let i = 0; i < MAX_SLOTS; i++) {
    const s = slots[i];
    if (!s.active) continue;
    s.age += dt;
    if (s.age >= s.life) { hideSlot(s, false); dirty = true; continue; }

    const fadeIn = Math.min(1, s.age / 0.30);
    const fadeOut = Math.min(1, (s.life - s.age) / 0.45);
    let sc = Math.min(fadeIn, fadeOut);

    if (s.kind === 'lantern') {
     const rt = s.right + Math.sin(s.age * s.swayFreq + s.swayPhase) * s.swayAmp * dt;
     const y = s.group.position.y + s.vy * dt;
     placeSlot(s, s.along, rt, y);
     s.vis.lantern.rotation.z = Math.sin(s.age * s.swayFreq + s.swayPhase) * 0.10;
     s.vis.lantern.rotation.y += dt * (s.gilded ? 1.4 : 0.55);
     if (s.gilded) sc *= 1.06 + Math.sin(elapsed * 8 + i) * 0.05;
    } else if (s.kind === 'twin') {
     const charged = s.chargedUntil > elapsed;
     if (!charged && s.chargedUntil > 0) {
      s.chargedUntil = 0;
      s.vis.twin.userData.body.material = mats.jade;
     }
     const y = s.baseY + s.age * s.vy + Math.sin(s.age * s.swayFreq + s.swayPhase) * 0.25;
     placeSlot(s, s.along, s.right, y);
     s.vis.twin.rotation.y += dt * (charged ? 3.2 : 1.0);
     if (charged) sc *= 1.16 + Math.sin(elapsed * 12) * 0.08;
    } else if (s.kind === 'disc') {
     s.vy -= DISC_G * dt;
     const al = s.along + s.va * dt;
     const rt = s.right + s.vr * dt;
     const y = s.group.position.y + s.vy * dt;
     const [gx, gz] = yardAt(al, rt);
     if (s.age > 0.35 && y <= groundAt(gx, gz) + 0.9) { hideSlot(s, false); dirty = true; continue; }
     placeSlot(s, al, rt, y);
     s.vis.disc.rotation.z += dt * 7.5;
     s.vis.disc.rotation.x = 0.25;
     if (s.age >= s.trailAt) { s.trailAt = s.age + 0.24; burst(s.group.position, '#f6e6bd', 1, 0.22, 0.25); }
    } else if (s.kind === 'chime') {
     const swing = Math.sin(s.age * s.swayFreq + s.swayPhase);
     const rt = s.right + swing * s.swayAmp * dt * 1.1;
     placeSlot(s, s.along, Math.max(-5.8, Math.min(5.8, rt)), s.baseY + Math.cos(s.age * s.swayFreq * 2) * 0.08);
     s.vis.chime.rotation.z = swing * 0.16;
    } else if (s.kind === 'crown') {
     const rt = s.right + s.vr * dt;
     if (Math.abs(rt) > 8.1 && s.age > 1.2) { hideSlot(s, false); dirty = true; continue; }
     const y = s.baseY + Math.sin(s.age * s.swayFreq) * s.swayAmp;
     placeSlot(s, s.along, rt, y);
     s.vis.crown.rotation.y += dt * 1.8;
     s.vis.crown.userData.halo.rotation.z += dt * 2.4;
     if (s.age >= s.trailAt) { s.trailAt = s.age + 0.22; burst(s.group.position, '#ffd86b', 1, 0.30, 0.30); }
     sc *= 1.05 + Math.sin(elapsed * 6) * 0.05;
    }
    s.group.scale.setScalar(Math.max(0.01, sc));
   }

   for (let i = 0; i < cords.length; i++) if (cords[i].a >= 0) updateCord(cords[i]);
   if (dirty) rangeTargets();

   // Final 10 s banner & last 5 s spawn quiet
   if (left <= 10 && !st.lastMsg) {
    st.lastMsg = true;
    say('Final lights!', 2.6);
    note(659.25, 0.25, 'sine', 0.06);
   }
   if (left <= 5) return;

   // Guaranteed Grand Finale Golden Volley at t = 158 s
   if (!st.finaleDone && t >= 158) {
    st.finaleDone = true;
    triggerVolley('Finale Volley!');
    return;
   }

   // Scheduled Gilded Crown Star crossings
   if (st.crownIdx < CROWN_AT.length && t >= CROWN_AT[st.crownIdx]) {
    st.crownIdx++;
    if (st.volleyLeft <= 0) spawnCrown();
   }

   // Keep gallery lively with zero empty gaps
   const cur = activeCount();
   const targetFloor = t < 15 ? 4 : 5;
   const targetCap = t < 15 ? 5 : 6;
   if (cur < targetFloor && t >= st.nextFill) {
    st.nextFill = t + 0.35;
    if (!hasKind('chime') && t > 6 && Math.random() < 0.32) spawnChime();
    else if (t >= st.nextTwin && MAX_SLOTS - cur >= 2 && Math.random() < 0.38) {
     if (spawnTwins()) st.nextTwin = t + watchRand(9.5, 13.5);
     else spawnLantern(false);
    } else spawnLantern(false);
   } else if (cur < targetCap && t >= st.nextFill) {
    st.nextFill = t + watchRand(1.4, 2.2);
    if (t >= st.nextDisc) {
     spawnDisc();
     st.nextDisc = t + watchRand(7.5, 11.0);
    } else if (t >= st.nextTwin && MAX_SLOTS - cur >= 2) {
     if (spawnTwins()) st.nextTwin = t + watchRand(10.5, 14.5);
     else spawnLantern(false);
    } else if (!hasKind('chime') && Math.random() < 0.35) {
     spawnChime();
    } else {
     spawnLantern(false);
    }
   } else if (t >= st.nextDisc && cur < MAX_SLOTS - 1 && st.volleyLeft <= 0) {
    spawnDisc();
    st.nextDisc = t + watchRand(8.5, 12.0);
   }
  },

  hit(target, q, info) {
   const s = slots[target.slot];
   if (!s || !s.active) return null;

   tmpP.copy(s.group.position);
   const dist = info.dist || Math.round(tmpP.distanceTo(q.origin));
   const kind = s.kind;
   const gilded = s.gilded;
   const volleyTag = s.volleyTag;
   const partnerIdx = s.partner;
   const wasCharged = s.chargedUntil > elapsed;
   const discVy = s.vy;
   const discY = tmpP.y;
   const [gx, gz] = yardAt(s.along, s.right);
   const discAbove = discY - groundAt(gx, gz);

   // Update carefree Flow momentum
   st.flow = Math.min(20, st.flow + 1);
   if (st.flow > st.bestFlow) st.bestFlow = st.flow;
   st.flowHold = 5.2;
   st.flowDecay = 0;
   const brisk = (elapsed - st.lastHitAt) <= 2.35;
   st.lastHitAt = elapsed;
   const mult = flowMult(st.flow);

   // Base scoring & special rules by target type
   let base = 110 + dist;
   let tag = '';
   let popCol = '#fff1c4';

   if (kind === 'lantern') {
    base = (gilded ? 200 : 110) + dist;
    if (gilded) {
     tag = (volleyTag && volleyTag === st.volleyId && st.volleyTotal > 0)
      ? (st.volleyHits + 1) + '/' + st.volleyTotal
      : 'Gold';
     popCol = '#ffd86b';
    }
    burst(tmpP, gilded ? '#ffd86b' : '#f6e6bd', gilded ? 16 : 11, 1.3, 1.2);
    burst(tmpP, gilded ? '#e6a23c' : '#c5343a', 8, 1.1, 1.0);
   } else if (kind === 'twin') {
    if (wasCharged) {
     base = 260 + dist;
     tag = 'CHAIN!';
     popCol = '#ffd86b';
     st.chains++;
     burst(tmpP, '#ffd86b', 20, 1.6, 1.4);
     burst(tmpP, '#5fa896', 10, 1.2, 1.1);
     note(587.33, 0.30, 'sine', 0.09, 0.04);
     note(880, 0.36, 'sine', 0.09, 0.11);
    } else {
     base = 130 + dist;
     popCol = '#9ee0cf';
     burst(tmpP, '#5fa896', 12, 1.2, 1.1);
     burst(tmpP, '#ffd86b', 8, 1.0, 1.0);
     // Charge surviving twin partner bright gold for 4.5 s
     if (partnerIdx >= 0 && slots[partnerIdx].active) {
      const p = slots[partnerIdx];
      p.partner = -1;
      p.chargedUntil = elapsed + 4.5;
      p.life = Math.max(p.life, p.age + 4.8);
      p.vis.twin.userData.body.material = mats.goldBright;
      tmpA.copy(tmpP).lerp(p.group.position, 0.5);
      burst(tmpA, '#ffd86b', 10, 0.9, 0.9);
      note(659.25, 0.18, 'triangle', 0.06, 0.03, 880);
     }
    }
   } else if (kind === 'disc') {
    const apex = Math.abs(discVy) <= 1.25 && discAbove >= 3.1;
    base = (apex ? 270 : 150) + dist;
    if (apex) {
     tag = 'APEX!';
     popCol = '#ffd86b';
     st.apexes++;
     burst(tmpP, '#ffd86b', 18, 1.5, 1.3);
     note(783.99, 0.28, 'sine', 0.09, 0.04, 1046.5);
    }
    burst(tmpP, '#c5343a', 12, 1.4, 1.0);
    burst(tmpP, '#f6e6bd', 8, 1.2, 1.1);
   } else if (kind === 'chime') {
    base = 240 + dist * 2;
    tag = 'CHIME ' + dist + ' m';
    popCol = '#F0C75A';
    st.chimes++;
    burst(tmpP, '#F0C75A', 18, 1.4, 1.3);
    note(528, 0.55, 'sine', 0.09, 0.02);
    note(792, 0.50, 'sine', 0.06, 0.07);
    note(1056, 0.45, 'sine', 0.05, 0.12);
   } else if (kind === 'crown') {
    base = 240 + dist;
    tag = 'VOLLEY!';
    popCol = '#ffd86b';
    burst(tmpP, '#ffd86b', 24, 1.7, 1.5);
    burst(tmpP, '#c5343a', 12, 1.3, 1.2);
   }

   if (brisk) base += 25;
   const pts = Math.round(base * mult * (info.perfect ? 1.25 : 1));

   // Musical pentatonic feedback
   if (gilded && volleyTag === st.volleyId) {
    const f = VOLLEY_NOTES[Math.min(st.volleyHits, VOLLEY_NOTES.length - 1)];
    note(f, 0.34, 'sine', 0.10, 0.02);
    note(f * 1.5, 0.25, 'triangle', 0.04, 0.05);
   } else {
    const f = PENTA[st.noteIdx++ % PENTA.length];
    note(f, 0.26, 'triangle', 0.06, 0.02);
   }

   // Hide struck target before spawning volley so slot is immediately freed
   hideSlot(s, true);

   // Check Volley clear celebration
   let extra = 0;
   if (volleyTag && volleyTag === st.volleyId) {
    st.volleyHits++;
    if (st.volleyTotal > 0 && st.volleyHits >= st.volleyTotal) {
     st.volleysCleared++;
     extra = Math.round(450 * mult);
     st.volleyTotal = 0;
     VOLLEY_NOTES.slice(0, 4).forEach((fn, idx) => note(fn, 0.35, 'sine', 0.07, 0.05 + idx * 0.07));
     popup('VOLLEY CLEAR +' + extra, tmpP.clone().add(V(0, 1.0, 0)), '#ffd86b', 1.7);
     say('Volley clear!  +' + extra, 2.2);
    }
   }

   // Crown star triggers a Golden Volley
   if (kind === 'crown') triggerVolley('Golden Volley!');

   // Charge Practice Bell every 6 hits (proactive optional Volley trigger in VR)
   if (kind !== 'crown' && st.volleyLeft <= 0) {
    st.bellCharge++;
    if (st.bellCharge >= BELL_CHARGE_HITS && !st.bellAnnounced) {
     st.bellAnnounced = true;
     note(523.25, 0.35, 'sine', 0.06, 0.10);
     say('Bell charged  ·  shoot the bell for Golden Volley', 2.4);
    }
   }

   const totalPts = pts + extra;
   popup('+' + pts + (tag ? '  ·  ' + tag : (brisk && mult >= 1.5 ? '  ·  ×' + mult : '')), tmpP.clone().add(V(0, 0.55, 0)), popCol);
   return totalPts;
  },

  bell(q) {
   if (!st.on || !peal || !peal.root) return false;
   if (st.bellCharge >= BELL_CHARGE_HITS && st.volleyLeft <= 0) {
    st.bellCharge = 0;
    st.bellAnnounced = false;
    pealRing(false);
    triggerVolley('Bell Volley!');
    return true;
   }
   pealRing(true);
   const need = Math.max(0, BELL_CHARGE_HITS - st.bellCharge);
   say(st.volleyLeft > 0 ? 'Golden Volley active!' : 'Bell rings  ·  ' + need + ' more hits to charge Volley', 1.8);
   return true;
  },

  info({ phase, left, clock, best }) {
   const m = flowMult(st.flow);
   if (phase === 'results') {
    const newB = range.newBest;
    const gainTxt = range.gain ? 'New best  +' + range.gain : 'New best';
    return {
     stitch: newB,
     text:
      'Score ' + range.score + '      ' + (newB ? gainTxt : 'Best ' + best) +
      '\nHits ' + range.hits + '  ·  Chains ' + st.chains + '  ·  Apex ' + st.apexes +
      '\nChimes ' + st.chimes + '  ·  Volleys ' + st.volleyCount + (st.volleysCleared ? ' (' + st.volleysCleared + ' clear)' : ''),
     mark: 'Shoot AGAIN for another run'
    };
   }
   const bellReady = st.bellCharge >= BELL_CHARGE_HITS && st.volleyLeft <= 0;
   const status = st.volleyLeft > 0
    ? 'GOLDEN VOLLEY  ' + Math.ceil(st.volleyLeft) + ' s'
    : bellReady
     ? 'Bell READY for Golden Volley'
     : left <= 10
      ? 'Final lights'
      : 'Best ' + best;
   return {
    text: 'Score ' + range.score + '      Hits ' + range.hits + '      Flow ×' + m.toFixed(2).replace(/\.00$/, ''),
    mark: status
   };
  },

  end() {
   st.on = false;
   hideAll();
  }
 });
})();
