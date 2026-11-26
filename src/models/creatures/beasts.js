// Mammal-like fantasy beasts: unicorn (horse kit) and griffin (eagle front, lion back).
import { THREE, M, group, mesh, loft, taper, leg, featherWing, skinMat, skinColor, hornMat, glowMat, crystalMat, plainMat, darkMat, keys, setup, done, animKit, swing, breathe, rock, rockMat, hoard, merge, orient, eyes, plateRow, ribs, crystalCluster, spikeRow, noise3, sstep, TAU, lampTracks, rotateTrack, blob, zigzag } from './common.js';

const P = (o, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(o.matrix);

/** Bundle of tapered hair strands (mane, tail, beard) merged into one mesh. paths: [[x,y,z],...][] */
export function hair(parent, paths, r0, r1, mat, { name = 'hair', color } = {}) {
  const geos = paths.map((pts) => loft(pts, (t) => r1 + (r0 - r1) * (1 - t) ** 1.2, mat, { seg: 10, rad: 7, color, capStart: 0.4, capEnd: 0.6 }).geometry);
  return mesh(merge(geos), mat, { parent, name });
}

/** Mane / tail material for a trim (fire = flame strands, ice = frosted, crystal = shards...). */
export function hairMat(T, base) {
  if (T.trim === 'fire') return glowMat('#ff7a1a', 1.5, 0.95);
  if (T.trim === 'storm') return glowMat('#8fe6ff', 0.9, 0.9);
  if (T.trim === 'ice') return crystalMat('#d8f4ff', 0.15);
  if (T.trim === 'crystal') return crystalMat(T.glow, 0.5);
  if (T.trim === 'gold') return M.metal('#f0cf6a', 0.25);
  if (T.trim === 'shadow') return new THREE.MeshPhysicalMaterial({ name: 'smoke', color: '#2a1f3c', roughness: 0.9, emissive: '#3a0a6a', emissiveIntensity: 0.3, transparent: true, opacity: 0.9 });
  if (T.trim === 'forest') return M.foliage('#4f7a2a');
  if (T.trim === 'poison') return glowMat('#8fe030', 0.5);
  if (T.trim === 'undead') return plainMat('#9a9a8a', 0.95);
  if (T.trim === 'stone') return plainMat('#7a756a', 0.95);
  return new THREE.MeshPhysicalMaterial({ name: 'hair', color: base ?? T.mane ?? T.b, roughness: 0.55, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color('#ffffff') });
}

/* ---------------------------------- unicorn ---------------------------------- */

const UNI_TRIMS = {
  rainbow: { p: '#fbf7f2', b: '#ffffff', h: '#ffd86a', w: '#ffffff', eye: '#7ad0ff', glow: '#ff9ad8', rough: 0.5, pattern: 'plain', rainbow: true },
  celestial: { p: '#1c2350', b: '#2c3670', h: '#e8ecff', w: '#c8d0ff', eye: '#bfe0ff', glow: '#bfe0ff', rough: 0.4, pattern: 'spots', spot: '#e8ecff', stars: true },
};
export const UNICORN_VARIANTS = {
  standing: { p: '#f4f1ec', b: '#ffffff', h: '#e9d38a', mane: '#e8e4f4', eye: '#6ab8ff', pattern: 'plain', pose: 'stand' },
  rearing: { p: '#cfd2d8', b: '#eef0f3', h: '#f2f4f8', mane: '#ffffff', eye: '#9ad8ff', pattern: 'spots', spot: '#a9adb6', pose: 'rear' },
  grazing: { p: '#e8d2a0', b: '#f6ead0', h: '#e0b84a', mane: '#fbf3dc', eye: '#ffcf6a', pattern: 'plain', pose: 'graze' },
  winged: { p: '#f2ecf8', b: '#ffffff', h: '#d8c0f0', mane: '#c8a8f0', eye: '#d0a0ff', pattern: 'plain', pose: 'stand', wings: true },
  prancing: { p: '#1c1a1e', b: '#2a282e', h: '#d0d4dc', mane: '#c8ccd4', eye: '#80d0ff', pattern: 'plain', pose: 'prance' },
};

export function createUnicorn(options = {}) {
  const { o, variant, T, r } = setup(options, UNICORN_VARIANTS, 'unicorn', UNI_TRIMS);
  if (T.trim && !T.mane) T.mane = T.b;
  if (T.pattern === 'scales') T.pattern = 'plain';
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const skin = skinMat(T, { clear: 0.15 });
  const baseCol = skinColor(T, { freq: 2 });
  const col = T.rainbow ? (() => { const c = new THREE.Color(); return (u, a, p) => c.setHSL(((p.x + 1.5) * 0.25) % 1, 0.35, 0.86); })() : baseCol;
  const pose = T.pose;
  const rear = pose === 'rear';
  const H = 1.32;
  const body = group('body', { parent: rig, at: [rear ? -0.55 : 0, H, 0], rot: [0, 0, rear ? 0.72 : 0] });
  const ox = rear ? 0.55 : 0;
  body.updateMatrix();
  const torso = loft([[-0.85 + ox, 0, 0], [-0.3 + ox, -0.03, 0], [0.35 + ox, -0.01, 0], [0.82 + ox, 0.1, 0]], (t) => [keys(t, [[0, 0.24], [0.18, 0.33], [0.55, 0.31], [0.85, 0.29], [1, 0.2]]), keys(t, [[0, 0.28], [0.2, 0.37], [0.6, 0.4], [0.9, 0.37], [1, 0.26]])], skin, { seg: 36, rad: 20, color: col, bump: T.trim === 'stone' ? 0.08 : 0.01, parent: body, name: 'chest', capStart: 0.7, capEnd: 0.5 });
  // neck + head
  const graze = pose === 'graze';
  const neck = group('neck', { parent: body, at: [0.66 + ox, 0.15, 0], rot: [0, 0, graze ? -1.75 : pose === 'prance' ? 0.15 : 0] });
  const nl = loft([[-0.18, -0.1, 0], [0.18, 0.35, 0], [0.38, 0.72, 0]], (t) => [keys(t, [[0, 0.2], [1, 0.1]]), keys(t, [[0, 0.32], [0.6, 0.2], [1, 0.14]])], skin, { seg: 18, rad: 16, color: col, parent: neck, name: 'neck_loft' });
  const head = group('head', { parent: neck, at: [0.4, 0.74, 0], rot: [0, 0, graze ? 0.25 : -1.05] });
  const hl = loft([[-0.08, 0, 0], [0.25, -0.02, 0], [0.56, -0.07, 0]], (t) => [keys(t, [[0, 0.1], [0.3, 0.11], [0.7, 0.08], [1, 0.075]]), keys(t, [[0, 0.13], [0.3, 0.15], [0.75, 0.11], [1, 0.09]])], skin, { seg: 18, rad: 16, color: col, parent: head, name: 'head_loft', capEnd: 0.8 });
  const lamps = eyes(hl, T, { t: 0.24, a: 1.15, r: 0.03, parent: head, slit: false });
  void lamps;
  for (const sg of [1, -1]) {
    const s = hl.userData.surf(0.95, sg * 0.8);
    mesh(new THREE.SphereGeometry(0.018, 8, 6), darkMat(), { parent: head, at: s.p.toArray(), name: 'nostril' });
    const e = hl.userData.surf(0.06, sg * 0.55);
    taper([e.p.clone().addScaledVector(e.n, -0.02).toArray(), e.p.clone().add(new THREE.Vector3(-0.04, 0.09, sg * 0.03)).toArray(), e.p.clone().add(new THREE.Vector3(-0.05, 0.16, sg * 0.04)).toArray()], 0.035, 0.006, skin, { parent: head, name: 'ear', color: col });
  }
  // horn
  const hs = hl.userData.surf(0.22, 0);
  const hornLen = T.baby ? 0.12 : 0.48;
  let hornM = T.trim === 'fire' || T.trim === 'storm' ? glowMat(T.glow, 1.2) : T.trim === 'crystal' || T.trim === 'ice' || T.rainbow ? crystalMat(T.trim ? T.glow : '#ffd0f0', 0.4) : hornMat(T);
  if (T.trim === 'gold' || (!T.trim && T.h === '#e0b84a')) hornM = M.metal('#e8c050', 0.2);
  {
    const g = new THREE.CylinderGeometry(0.004, 0.035, hornLen, 12, 24);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) + hornLen / 2;
      const a = Math.atan2(pos.getZ(i), pos.getX(i));
      const k = 1 + 0.18 * Math.sin(a * 2 + (y / hornLen) * 26);
      pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k);
    }
    g.computeVertexNormals();
    g.translate(0, hornLen / 2, 0);
    mesh(orient(g, hs.p.clone().addScaledVector(hs.n, -0.02), [0.75, 1, 0]), hornM, { parent: head, name: 'horn' });
  }
  // mane
  const hm = hairMat(T);
  const manePaths = [];
  for (let i = 0; i < 14; i++) {
    const t = 0.05 + (i / 13) * 0.9;
    const s = nl.userData.surf(t, 0);
    const sg = i % 2 ? 1 : -1;
    const len = 0.22 + 0.12 * Math.sin(i);
    manePaths.push([s.p.clone().addScaledVector(s.n, -0.03).toArray(), s.p.clone().add(new THREE.Vector3(-0.05, 0.04, sg * 0.08)).toArray(), s.p.clone().add(new THREE.Vector3(-0.12, -len * 0.6, sg * 0.16)).toArray(), s.p.clone().add(new THREE.Vector3(-0.1, -len, sg * 0.13)).toArray()]);
  }
  const fs = hl.userData.surf(0.1, 0.2);
  manePaths.push([fs.p.clone().addScaledVector(fs.n, -0.02).toArray(), fs.p.clone().add(new THREE.Vector3(0.08, 0.04, 0.03)).toArray(), fs.p.clone().add(new THREE.Vector3(0.16, -0.04, 0.06)).toArray()]);
  hair(neck, manePaths, T.trim === 'fire' ? 0.06 : 0.045, 0.01, hm, { name: 'mane', color: T.rainbow ? col : undefined });
  // tail
  const tail = group('tail', { parent: body, at: [-0.8 + ox, 0.12, 0] });
  const tailPaths = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    const dz = Math.sin(a) * 0.05, dy = Math.cos(a) * 0.04;
    tailPaths.push([[0.08, dy, dz], [-0.18, 0.02 + dy, dz * 1.5], [-0.35, -0.35 + dy, dz * 3], [-0.38, -0.8 - Math.abs(dz) * 2, dz * 4]]);
  }
  hair(tail, tailPaths, 0.05, 0.012, hm, { name: 'tail_hair', color: T.rainbow ? col : undefined });
  // legs
  rig.updateMatrixWorld(true);
  const hoofM = T.trim === 'gold' ? M.metal('#e8c050', 0.25) : T.trim === 'fire' ? glowMat('#ff6a1a', 1.2) : plainMat(T.trim === 'baby' ? '#e8c8a0' : '#2a2420', 0.4);
  const legs = [];
  for (const [n, hx, fx, front] of [['leg_BL', -0.55, -0.62, false], ['leg_FL', 0.55, 0.58, true]]) for (const sg of [1, -1]) {
    const name = n.replace('L', sg > 0 ? 'L' : 'R');
    const hip = P(body, hx + ox, -0.08, 0.19 * sg);
    let foot = new THREE.Vector3(rear && front ? hip.x + 0.28 : rear ? -0.75 : fx, 0, 0.2 * sg);
    if (rear && front) foot.y = hip.y - 0.55;
    const raise = (pose === 'prance' && front && sg > 0);
    if (raise) foot = new THREE.Vector3(hip.x + 0.3, 0.55, 0.2 * sg);
    const bend = front ? (rear || raise ? [1, 0, 0] : [0.3, 0, 0]) : [1, 0, 0];
    legs.push(leg(rig, name, { hip, foot, hock: front ? (rear || raise ? null : [0, 0.32, 0]) : [-0.12, 0.48, 0], len: rear && front ? 0.9 : undefined, bend, r: front ? [0.15, 0.075, 0.045] : [0.19, 0.085, 0.045], mat: skin, color: col, footType: 'hoof', clawMat: hoofM, footMat: T.trim === 'forest' || T.trim === 'stone' ? hairMat(T) : null }));
  }
  // wings
  const wings = [];
  if (T.wings) for (const sg of [1, -1]) {
    const s = torso.userData.surf(0.75, sg * 0.45);
    wings.push(featherWing(body, sg > 0 ? 'wing_L' : 'wing_R', T, { root: s.p.toArray(), side: sg, span: 1.7, chord: 0.62, raise: 0.85, sweep: -0.35, primary: plainMat(T.mane ?? T.w, 0.7), secondary: plainMat(T.b, 0.7), rand: r }));
  }
  // trim extras
  if (T.plates) {
    plateRow(torso, { from: 0.25, to: 0.85, n: 4, w: 0.42, l: 0.32, th: 0.04, side: 0.9, mat: M.metal('#9aa0a8', 0.3), name: 'barding' });
    const s = hl.userData.surf(0.45, 0);
    mesh(orient(new THREE.CylinderGeometry(0.09, 0.11, 0.42, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), s.c, [0, 1, 0]), M.metal('#9aa0a8', 0.3), { parent: head, name: 'chanfron' });
    mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 20).rotateY(Math.PI / 2), M.metal('#7a5a2a', 0.5), { parent: neck, at: [0.02, 0.1, 0], rot: [0, 0, -0.6], name: 'collar' });
  }
  if (T.ribs) ribs(torso, { from: 0.4, to: 0.75, n: 5, a0: 0.5, a1: 2.0, r: 0.018, mat: hornMat(T, '#e3d8bb') });
  if (T.crystals) for (const t of [0.3, 0.65]) { const s = torso.userData.surf(t, 0.3); crystalCluster(s.p, s.n, 0.2, crystalMat(T.glow, 0.4), r, { parent: body, count: 4 }); }
  if (T.leaves) spikeRow(torso, { from: 0.15, to: 0.85, n: 7, h: 0.12, T, style: 'leaf', lean: 0.3, name: 'leaves' });
  if (T.stars) {
    const g = [];
    for (let i = 0; i < 18; i++) { const s = torso.userData.surf(r(), (r() - 0.5) * 4); g.push(new THREE.OctahedronGeometry(0.018, 0).translate(...s.p.addScaledVector(s.n, 0.005).toArray())); }
    mesh(merge(g), glowMat('#ffffff', 1.5), { parent: body, name: 'stars' });
  }
  if (T.lightning) for (const sg of [1, -1]) { const a = torso.userData.surf(0.85, sg * 1.2).p, b = torso.userData.surf(0.3, sg * 1.5).p; zigzag(a, b, 0.012, glowMat('#8fe6ff', 1.6), r, { parent: body, name: 'bolt' }); }
  if (T.hoard) hoard(rig, 1.4, r);
  if (T.scale !== 1) rig.scale.setScalar(T.trim === 'baby' ? 0.55 : T.scale);
  // animations
  A.add('idle', 4, breathe(torso, 4, 0.02), swing(head, 'z', 4, 0.06), swing(tail, 'y', 4, 0.15), swing(neck, 'z', 4, 0.03));
  if (!rear) legs.forEach((lg, i) => A.add('walk', 1.1, swing(lg, 'z', 1.1, 0.3, (i % 2) * 0.5 + (i >= 2 ? 0.25 : 0))));
  A.add('walk', 1.1, swing(neck, 'z', 1.1, 0.05, 0, 2), swing(tail, 'z', 1.1, 0.08, 0, 2));
  wings.forEach((w, i) => A.add('flap', 1.1, swing(w, 'x', 1.1, 0.5 * (i ? 1 : -1))));
  A.add('glow', 1, lampTracks('eyes', 3));
  void blob; void spikeRow; void noise3; void sstep; void rock; void rockMat; void rotateTrack;
  return done(root, 'unicorn', variant, o, T, A.list());
}

/* ---------------------------------- griffin ---------------------------------- */

export const GRIFFIN_VARIANTS = {
  classic: { p: '#b8874a', b: '#f2ece0', head: '#f6f2ea', h: '#e8b830', w: '#6a4a2a', eye: '#ffb020', pattern: 'fur', pose: 'stand' },
  perched: { p: '#9a6a3a', b: '#4a3422', head: '#5a4030', h: '#d8a830', w: '#3a2a1c', eye: '#ffcc33', pattern: 'fur', pose: 'perch' },
  rearing: { p: '#c89a5a', b: '#e8dcc8', head: '#f2ead8', h: '#f0c040', w: '#8a6a4a', eye: '#ff9a20', pattern: 'fur', pose: 'rear' },
  hippogriff: { p: '#7a6a5a', b: '#d8d0c4', head: '#e8e2d8', h: '#d8b040', w: '#5a4a3a', eye: '#ffb020', pattern: 'spots', spot: '#5a4a3a', pose: 'stand', hooves: true },
  resting: { p: '#a87c48', b: '#c8a070', head: '#e8dcc0', h: '#e0b030', w: '#7a5434', eye: '#ffb020', pattern: 'fur', pose: 'rest' },
};

export function createGriffin(options = {}) {
  const { o, variant, T, r } = setup(options, GRIFFIN_VARIANTS, 'griffin');
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  if (T.trim) T.head = T.b;
  if (T.trim === 'fire' || T.trim === 'shadow' || T.trim === 'undead') T.pattern = T.trim === 'fire' ? 'fur' : T.pattern;
  const skin = skinMat(T, { clear: 0.1 });
  const lion = new THREE.Color(T.p), feath = new THREE.Color(T.head ?? T.b);
  const c = new THREE.Color();
  const col = (u, a, p) => { c.copy(lion).lerp(feath, sstep(0.55, 0.75, u)); c.multiplyScalar(0.88 + 0.24 * noise3(p.x * 9, p.y * 9, p.z * 9)); return c; };
  const pose = T.pose;
  const rear = pose === 'rear', rest = pose === 'rest', perch = pose === 'perch';
  let base = 0;
  if (perch) base = rock(rig, 1.9, 0.75, 1.3, rockMat(), { at: [0, 0, 0], seed: 11 }).userData.top - 0.04;
  const H = rest ? 0.42 : 1.0;
  const body = group('body', { parent: rig, at: [rear ? -0.5 : 0, H + base, 0], rot: [0, 0, rear ? 0.8 : rest ? 0.12 : 0.05] });
  const ox = rear ? 0.5 : 0;
  body.updateMatrix();
  const torso = loft([[-0.8 + ox, 0, 0], [-0.2 + ox, 0, 0], [0.45 + ox, 0.05, 0], [0.85 + ox, 0.2, 0]], (t) => [keys(t, [[0, 0.24], [0.3, 0.28], [0.7, 0.33], [1, 0.26]]), keys(t, [[0, 0.27], [0.3, 0.3], [0.75, 0.38], [1, 0.3]])], skin, { seg: 32, rad: 20, color: col, bump: 0.03, parent: body, name: 'chest', capStart: 0.7, capEnd: 0.5 });
  const neck = group('neck', { parent: body, at: [0.72 + ox, 0.2, 0] });
  const nl = loft([[-0.12, -0.05, 0], [0.12, 0.25, 0], [0.18, 0.5, 0]], (t) => keys(t, [[0, 0.24], [1, 0.14]]), skin, { seg: 16, rad: 16, color: () => feath, parent: neck, name: 'neck_loft' });
  void nl;
  const head = group('head', { parent: neck, at: [0.18, 0.52, 0], rot: [0, 0, rear ? -0.6 : -0.15] });
  const hl = loft([[-0.12, 0, 0], [0.06, 0.03, 0], [0.22, 0.0, 0]], (t) => [keys(t, [[0, 0.12], [0.4, 0.15], [1, 0.08]]), keys(t, [[0, 0.13], [0.4, 0.16], [1, 0.09]])], skin, { seg: 16, rad: 16, color: () => feath, parent: head, name: 'head_loft' });
  eyes(hl, T, { t: 0.55, a: 1.05, r: 0.026, parent: head, slit: false });
  const beakM = T.trim === 'gold' ? M.metal('#f0d070', 0.2) : hornMat(T, T.trim ? T.h : '#e8b830');
  taper([[0.12, 0.06, 0], [0.27, 0.05, 0], [0.36, -0.02, 0], [0.35, -0.11, 0]], 0.075, 0.006, beakM, { parent: head, name: 'beak', pow: 0.7, seg: 16 });
  taper([[0.12, -0.04, 0], [0.24, -0.06, 0], [0.29, -0.08, 0]], 0.05, 0.01, beakM, { parent: head, name: 'beak_lower' });
  // ear tufts / crest
  const tuftM = plainMat(T.trim ? T.p : T.w, 0.8);
  for (const sg of [1, -1]) taper([[-0.04, 0.12, sg * 0.06], [-0.16, 0.2, sg * 0.09], [-0.25, 0.26, sg * 0.1]], 0.04, 0.005, tuftM, { parent: head, name: 'ear_tuft' });
  if (T.trim === 'fire') spikeRow(hl, { from: 0.0, to: 0.5, n: 4, h: 0.16, T, style: 'flame', lean: 1.0, name: 'flame_crest' });
  if (T.horns > 2 || T.ram) for (const sg of [1, -1]) taper([[-0.02, 0.1, sg * 0.08], [-0.15, 0.18, sg * 0.16], [-0.3, 0.12, sg * 0.18]], 0.03, 0.004, hornMat(T), { parent: head, name: 'horn' });
  // legs: front = talons (eagle), back = paws (lion) or hooves (hippogriff)
  rig.updateMatrixWorld(true);
  const scaleM = plainMat(T.trim ? T.h : '#d8a830', 0.55);
  const legs = [];
  for (const [n, hx, front] of [['leg_BL', -0.52, false], ['leg_FL', 0.6, true]]) for (const sg of [1, -1]) {
    const name = n.replace('L', sg > 0 ? 'L' : 'R');
    const hip = P(body, hx + ox, -0.08, 0.2 * sg);
    let foot = new THREE.Vector3(front ? hip.x + 0.1 : hip.x - 0.1, base, 0.24 * sg);
    let hock = front ? null : [-0.12, 0.3, 0];
    let bend = front ? [-1, 0, 0] : [1, 0, 0];
    if (rest) { foot = front ? new THREE.Vector3(hip.x + 0.55, 0, 0.22 * sg) : new THREE.Vector3(hip.x + 0.35, 0, 0.32 * sg); hock = null; bend = front ? [0, 1, 0] : [1, 0.5, sg * 0.5]; }
    if (rear && front) { foot = new THREE.Vector3(hip.x + 0.35, hip.y - 0.2 + (sg > 0 ? 0.15 : 0), 0.28 * sg); bend = [-1, -0.2, 0]; }
    if (rear && !front) foot = new THREE.Vector3(-0.7, 0, 0.26 * sg);
    const hoof = T.hooves && !front;
    legs.push(leg(rig, name, { hip, foot, hock, bend, r: front ? [0.13, 0.07, 0.05] : [0.2, 0.1, 0.06], mat: front ? scaleM : skin, color: front ? undefined : col, footType: front ? 'talon' : hoof ? 'hoof' : 'paw', clawMat: hornMat(T, '#2a2420'), footMat: front ? scaleM : undefined, toes: front ? 3 : 4, len: rest ? hip.distanceTo(foot) * 1.25 : undefined }));
  }
  // wings
  const wings = [];
  const pm = T.trim === 'fire' ? glowMat('#ff8a20', 0.6) : T.trim === 'ice' || T.trim === 'crystal' ? crystalMat(T.glow, 0.2) : T.trim === 'gold' ? M.metal('#d8a838', 0.3) : plainMat(T.w, 0.8);
  for (const sg of [1, -1]) {
    const s = torso.userData.surf(0.78, sg * 0.5);
    wings.push(featherWing(body, sg > 0 ? 'wing_L' : 'wing_R', T, { root: s.p.toArray(), side: sg, span: T.baby ? 1.3 : 2.1, chord: T.baby ? 0.55 : 0.8, raise: rear ? 0.3 : perch ? 0.6 : rest ? 1.2 : 0.95, sweep: rear ? 0.1 : -0.3, primary: pm, secondary: plainMat(new THREE.Color(T.w).lerp(feath, 0.3), 0.8), covert: plainMat(T.head ?? T.b, 0.8), rand: r, glowTips: T.trim === 'fire' ? glowMat('#ffd040', 1.6) : null }));
  }
  // tail: lion tail + tuft (or horse tail)
  const tail = group('tail', { parent: body, at: [-0.78 + ox, 0.08, 0] });
  const tl = loft([[0.05, 0, 0], [-0.35, -0.2, 0.05], [-0.65, -0.55, 0.2], [-0.95, -0.55, 0.4]], 0.045, skin, { seg: 20, rad: 10, color: col, parent: tail, name: 'tail_loft' });
  const te = tl.userData.surf(1, 0);
  if (T.trim === 'fire') mesh(new THREE.SphereGeometry(0.09, 10, 8).scale(1.6, 1, 1), glowMat(T.glow, 1.6), { parent: tail, at: te.c.toArray(), name: 'tail_tuft' });
  else blob(0.12, 0.08, 0.08, plainMat(T.trim ? T.w : '#5a3a20', 0.9), { parent: tail, at: te.c.clone().addScaledVector(te.t, 0.04).toArray(), name: 'tail_tuft', jitter: 0.2 });
  // trim extras
  if (T.plates) plateRow(torso, { from: 0.2, to: 0.7, n: 4, w: 0.38, l: 0.3, th: 0.04, side: 0.9, mat: M.metal('#9aa0a8', 0.3), name: 'barding' });
  if (T.ribs) ribs(torso, { from: 0.3, to: 0.6, n: 5, a0: 0.5, a1: 2.0, r: 0.016, mat: hornMat(T, '#e3d8bb') });
  if (T.crystals) for (const t of [0.25, 0.55]) { const s = torso.userData.surf(t, 0.2); crystalCluster(s.p, s.n, 0.18, crystalMat(T.glow, 0.4), r, { parent: body, count: 4 }); }
  if (T.leaves) spikeRow(torso, { from: 0.1, to: 0.6, n: 6, h: 0.1, T, style: 'leaf', lean: 0.4, name: 'leaves' });
  if (T.spikes === 'blade' || T.spikes === 'bone' || T.spikes === 'thorn') spikeRow(torso, { from: 0.1, to: 0.55, n: 5, h: 0.12, T, lean: 0.6, name: 'spines' });
  if (T.lightning) for (const sg of [1, -1]) zigzag(torso.userData.surf(0.7, sg * 1.2).p, torso.userData.surf(0.2, sg * 1.4).p, 0.01, glowMat('#8fe6ff', 1.6), r, { parent: body, name: 'bolt' });
  if (T.hoard) hoard(rig, 1.5, r);
  if (T.scale !== 1) rig.scale.setScalar(T.trim === 'baby' ? 0.5 : T.scale);
  A.add('idle', 3.5, breathe(torso, 3.5, 0.025), rotateTrack(head, 'y', 3.5, (t) => 0.3 * Math.sin(TAU * t) * Math.abs(Math.sin(TAU * t))), swing(tail, 'y', 3.5, 0.2));
  if (!rest && !rear) legs.forEach((lg, i) => A.add('walk', 1, swing(lg, 'z', 1, 0.3, (i % 2) * 0.5 + (i >= 2 ? 0.25 : 0))));
  A.add('walk', 1, swing(tail, 'y', 1, 0.2));
  wings.forEach((w, i) => A.add('flap', 0.9, swing(w, 'x', 0.9, 0.6 * (i ? 1 : -1))));
  A.add('glow', 1, lampTracks('eyes', 3));
  return done(root, 'griffin', variant, o, T, A.list());
}
