// Humanoid fantasy folk: golem (rock-chunk giant), yeti (shaggy snow ape), goblin statue (small grotesque on a plinth).
import { THREE, M, group, mesh, loft, taper, leg, skinMat, skinColor, hornMat, glowMat, crystalMat, plainMat, darkMat, keys, setup, done, animKit, swing, breathe, merge, orient, eyes, crystalCluster, spikeRow, noise3, TAU, lampTracks, rotateTrack, blob, zigzag, plinth, roundedBox, lathe, cushion, rock, rockMat } from './common.js';
import { lampGroup } from '../../core/lamps.js';

const V = (a) => new THREE.Vector3(...a);

/** Rough boulder chunk spanning a→b with radius r (jittered icosahedron). */
function chunk(a, b, r, mat, { seed = 1, jit = 0.22, detail = 1, flat = false, name } = {}) {
  const A = V(a), B = V(b);
  const len = A.distanceTo(B);
  const g = new THREE.IcosahedronGeometry(1, detail);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = 1 + (noise3(v.x * 1.7 + seed * 3.1, v.y * 1.7, v.z * 1.7) - 0.5) * 2 * jit;
    v.multiplyScalar(k);
    pos.setXYZ(i, v.x * r, v.y * (len / 2 + r * 0.6), v.z * r * (flat ? 0.8 : 1));
  }
  g.computeVertexNormals();
  orient(g, A.clone().lerp(B, 0.5), B.clone().sub(A));
  return mesh(g, mat, { name });
}

/* ----------------------------------- golem ----------------------------------- */

const GOLEM_MATS = {
  base: (T) => new THREE.MeshStandardMaterial({ name: 'golem_stone', color: T.p, roughness: 0.95, flatShading: true }),
  fire: () => new THREE.MeshStandardMaterial({ name: 'basalt', color: '#2a2220', roughness: 0.9, flatShading: true, emissive: '#ff3a00', emissiveIntensity: 0.03 }),
  ice: () => crystalMat('#bfe8f8', 0.12),
  poison: () => new THREE.MeshPhysicalMaterial({ name: 'sludge', color: '#4a6a20', roughness: 0.3, clearcoat: 1, flatShading: true }),
  shadow: () => new THREE.MeshPhysicalMaterial({ name: 'obsidian', color: '#141218', roughness: 0.15, clearcoat: 1, flatShading: true }),
  stone: () => new THREE.MeshStandardMaterial({ name: 'ancient', color: '#8a8578', roughness: 1, flatShading: true }),
  gold: () => Object.assign(M.metal('#d6a43a', 0.25), { flatShading: true }),
  undead: () => new THREE.MeshStandardMaterial({ name: 'bone', color: '#e3d8bb', roughness: 0.8, flatShading: true }),
  crystal: () => crystalMat('#8a5ad8', 0.35),
  baby: () => new THREE.MeshStandardMaterial({ name: 'pebble', color: '#b0a898', roughness: 0.9, flatShading: true }),
  armoured: () => Object.assign(M.metal('#6a6e74', 0.45), { flatShading: true }),
  storm: () => new THREE.MeshStandardMaterial({ name: 'slate', color: '#3a4656', roughness: 0.7, flatShading: true }),
  forest: () => new THREE.MeshStandardMaterial({ name: 'mossrock', color: '#5a6a3a', roughness: 1, flatShading: true }),
};
export const GOLEM_VARIANTS = {
  'stone-giant': { p: '#8a857c', eye: '#5ad8ff', glow: '#5ad8ff', pose: 'stand' },
  brute: { p: '#7a6a58', eye: '#ffb030', glow: '#ff9a20', pose: 'brute' },
  sentinel: { p: '#9a968c', eye: '#9cff6a', glow: '#9cff6a', pose: 'sentinel' },
  'rune-pillar': { p: '#6a6a70', eye: '#c08cff', glow: '#c08cff', pose: 'pillar' },
  clay: { p: '#b87a50', eye: '#ffe080', glow: '#ffd060', pose: 'clay' },
};

export function createGolem(options = {}) {
  const { o, variant, T, r } = setup(options, GOLEM_VARIANTS, 'golem');
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const pose = T.pose;
  const mat = (T.trim ? GOLEM_MATS[T.trim] : null)?.(T) ?? (pose === 'clay' ? new THREE.MeshStandardMaterial({ name: 'clay', color: T.p, roughness: 0.85 }) : GOLEM_MATS.base(T));
  const glowC = T.trim ? T.glow : T.glow;
  const rune = glowMat(T.trim === 'fire' ? '#ff6a10' : glowC, 1.5);
  const clay = pose === 'clay' && !T.trim;
  const jit = clay ? 0.06 : T.trim === 'ice' || T.trim === 'crystal' ? 0.1 : 0.22;
  const det = clay ? 3 : 2;
  const brute = pose === 'brute', sent = pose === 'sentinel', pillar = pose === 'pillar';
  const s = sent ? 1.1 : 1;
  const hipY = (brute ? 0.85 : sent ? 1.2 : 1.0);
  const body = group('body', { parent: rig, at: [0, hipY, 0], rot: [0, 0, brute ? -0.45 : 0] });
  const chest = group('chest', { parent: body });
  // torso
  if (pillar) {
    const g = roundedBox(0.75, 1.5, 0.6, 0.08);
    mesh(g, mat, { parent: chest, at: [0, 0.65, 0], name: 'torso' });
  } else {
    const t1 = chunk([0, -0.05, 0], [brute ? 0.05 : 0, 0.75 * s, 0], (brute ? 0.62 : sent ? 0.4 : 0.55), mat, { seed: 2, jit, detail: det, name: 'torso' });
    chest.add(t1);
    const t2 = chunk([0, 0.55 * s, -0.0], [0, 0.95 * s, 0], (brute ? 0.75 : sent ? 0.48 : 0.62), mat, { seed: 5, jit, detail: det, name: 'shoulders' });
    t2.scale.set(1, 0.7, 1.25);
    chest.add(t2);
  }
  const topY = pillar ? 1.42 : sent ? 1.12 : 1.1;
  // head
  const head = group('head', { parent: chest, at: [brute ? 0.25 : 0.06, topY, 0] });
  const hm = chunk([0, -0.05, 0], [0, 0.22, 0], 0.2, mat, { seed: 7, jit, detail: det, name: 'head_block' });
  head.add(hm);
  // glowing eyes (embedded slits)
  const lg = lampGroup('eyes', 'white', { lens: new THREE.MeshPhysicalMaterial({ name: 'eye_lens', color: T.eye, emissive: T.eye, emissiveIntensity: 0.6, roughness: 0.1, toneMapped: false }) });
  lg.glow.color.set(T.eye);
  for (const sg of [1, -1]) lg.add(head, { geometry: new THREE.SphereGeometry(0.04, 10, 8).scale(1, 0.55, 1.3).translate(0.18, 0.1, sg * 0.08), normal: [1, 0, 0], depth: 0.02, glowSize: 0.3 });
  // chest rune
  const rg = [];
  const rp = [[0, 0], [0.1, 0.12], [0, 0.24], [-0.1, 0.12], [0, 0]];
  for (let i = 0; i < 4; i++) { const a = V([0, rp[i][1], rp[i][0]]), b = V([0, rp[i + 1][1], rp[i + 1][0]]); rg.push(orient(new THREE.CylinderGeometry(0.018, 0.018, a.distanceTo(b) + 0.03, 6).translate(0, a.distanceTo(b) / 2, 0), a, b.clone().sub(a))); }
  rg.push(new THREE.SphereGeometry(0.04, 8, 6).translate(0, 0.12, 0));
  const front = pillar ? 0.3 : brute ? 0.6 : sent ? 0.42 : 0.55;
  mesh(merge(rg), rune, { parent: chest, at: [front - 0.02, 0.45 * s, 0], name: 'rune' });
  if (T.trim === 'fire' || T.trim === 'storm' || T.trim === 'crystal') {
    for (const sg of [1, -1]) zigzag([front * 0.7, 0.9 * s, sg * 0.3], [front * 0.75, 0.1, sg * 0.25], 0.02, rune, r, { parent: chest, name: 'cracks', amp: 0.06 });
  }
  // arms
  const arms = [];
  for (const sg of [1, -1]) {
    const sh = V([0, topY - 0.25, sg * (brute ? 0.75 : sent ? 0.5 : 0.65)]);
    const arm = group(sg > 0 ? 'arm_L' : 'arm_R', { parent: chest, at: sh.toArray() });
    const el = brute ? V([0.35, -0.75, sg * 0.25]) : V([0.08, -0.65 * s, sg * 0.12]);
    let hand = brute ? V([0.75, -1.5, sg * 0.15]) : V([0.25, -1.25 * s, sg * 0.1]);
    if (sent && sg < 0) hand = V([0.45, -0.65, 0.05 * sg]);
    const ar = brute ? 0.3 : sent ? 0.17 : 0.24;
    arm.add(chunk([0, 0.1, 0], el.toArray(), ar, mat, { seed: 11 + sg, jit, detail: det, name: 'upperarm' }));
    arm.add(chunk(el.toArray(), hand.toArray(), ar * 0.95, mat, { seed: 13 + sg, jit, detail: det, name: 'forearm' }));
    arm.add(chunk(hand.toArray(), hand.clone().add(V([0.05, -0.2, 0])).toArray(), ar * 1.25, mat, { seed: 17 + sg, jit, detail: det, name: 'fist' }));
    arms.push(arm);
    if (sent && sg < 0) {
      // greatsword of stone held upright
      const hw = hand.clone().add(sh);
      const sw = group('sword', { parent: chest, at: [hw.x + 0.15, hw.y - 0.1, hw.z] });
      const blade = new THREE.MeshStandardMaterial({ name: 'blade', color: T.trim === 'gold' ? '#e8c050' : '#9aa0a6', roughness: 0.4, metalness: 0.6 });
      mesh(extrudeBlade(), blade, { parent: sw, at: [0, -0.15, 0], name: 'sword_blade' });
      mesh(roundedBox(0.08, 0.06, 0.5, 0.02), blade, { parent: sw, at: [0, 0.1, 0], name: 'sword_guard' });
      mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.35, 10), plainMat('#3a2a1a', 0.8), { parent: sw, at: [0, 0.3, 0], name: 'sword_grip' });
    }
  }
  // legs
  const legs = [];
  for (const sg of [1, -1]) {
    const hp = V([0, 0, sg * (brute ? 0.35 : 0.3)]);
    const lgp = group(sg > 0 ? 'leg_L' : 'leg_R', { parent: rig, at: [0, hipY, hp.z] });
    const kn = V([0.06, -hipY * 0.5, sg * 0.03]);
    const ft = V([0.02, -hipY + 0.12, sg * 0.06]);
    const lr = brute ? 0.3 : sent ? 0.2 : 0.27;
    lgp.add(chunk([0, 0.1, 0], kn.toArray(), lr, mat, { seed: 21 + sg, jit, detail: det, name: 'thigh' }));
    lgp.add(chunk(kn.toArray(), ft.toArray(), lr * 0.92, mat, { seed: 23 + sg, jit, detail: det, name: 'shin' }));
    const foot = chunk([ft.x - 0.12, -hipY + 0.11, ft.z], [ft.x + 0.32, -hipY + 0.11, ft.z], lr * 0.6, mat, { seed: 27 + sg, jit: jit * 0.5, detail: det, name: 'foot' });
    foot.scale.set(1, 1, 1);
    lgp.add(foot);
    // flatten foot bottom to ground
    const fp = foot.geometry.attributes.position;
    for (let i = 0; i < fp.count; i++) if (fp.getY(i) < -hipY + 0.04) fp.setY(i, -hipY + 0.0);
    foot.geometry.computeVertexNormals();
    legs.push(lgp);
  }
  // trim extras
  if (T.trim === 'forest' || T.trim === 'stone' || (!T.trim && pose === 'stand')) {
    const mg = [];
    for (let i = 0; i < 9; i++) { const a = r() * Math.PI - Math.PI / 2; mg.push(new THREE.SphereGeometry(0.1 + r() * 0.08, 7, 5).scale(1, 0.45, 1).translate(Math.cos(a) * 0.35, topY - 0.05 + r() * 0.1, Math.sin(a) * 0.55)); }
    mesh(merge(mg), M.foliage('#4f6a2a'), { parent: chest, name: 'moss' });
  }
  if (T.trim === 'forest') spikeRow(loft([[0, topY - 0.1, -0.5], [0, topY + 0.05, 0], [0, topY - 0.1, 0.5]], 0.05, mat, { parent: chest, name: 'vine' }), { n: 6, h: 0.18, T, style: 'leaf', name: 'leaves' });
  if (T.crystals || T.trim === 'crystal') for (const sg of [1, -1]) crystalCluster(V([-0.1, topY - 0.05, sg * 0.45]), [-0.2, 1, sg * 0.3], 0.4, crystalMat(T.glow, 0.5), r, { parent: chest, count: 5 });
  if (T.trim === 'armoured') {
    mesh(cushion(0.6, 0.12, 1.1, { radius: 0.05, bulge: 0.5 }), M.metal('#8d939a', 0.35), { parent: chest, at: [0, topY - 0.08, 0], name: 'pauldrons' });
    mesh(roundedBox(0.12, 0.6, 0.8, 0.04), M.metal('#8d939a', 0.35), { parent: chest, at: [front - 0.06, 0.5 * s, 0], name: 'breastplate' });
  }
  if (T.trim === 'undead') {
    const sk = group('skulls', { parent: chest });
    for (let i = 0; i < 3; i++) blob(0.09, 0.1, 0.08, plainMat('#efe6cc', 0.7), { parent: sk, at: [front - 0.04, 0.2 + i * 0.25, (i - 1) * 0.2], name: 'skull' });
  }
  if (T.trim === 'poison') {
    const dg = [];
    for (let i = 0; i < 8; i++) { const x = front * 0.8, y = 0.1 + r() * 0.8, z = (r() - 0.5) * 0.8; dg.push(new THREE.SphereGeometry(0.05, 8, 6).scale(1, 2.2, 1).translate(x, y, z)); }
    mesh(merge(dg), glowMat('#9cff2e', 0.8), { parent: chest, name: 'ooze' });
  }
  if (T.trim === 'gold') { const g = []; for (let i = 0; i < 5; i++) g.push(new THREE.OctahedronGeometry(0.06, 0).translate(front - 0.03, 0.2 + i * 0.13, (i % 2 ? 1 : -1) * 0.15)); mesh(merge(g), crystalMat('#e0203a', 0.4), { parent: chest, name: 'gems' }); }
  if (clay) {
    // inscribed tablet on the forehead
    mesh(roundedBox(0.03, 0.08, 0.16, 0.01), rune, { parent: head, at: [0.19, 0.2, 0], name: 'tablet' });
  }
  if (T.scale !== 1) rig.scale.setScalar(T.trim === 'baby' ? 0.4 : T.scale);
  A.add('idle', 4, breathe(chest, 4, 0.015), swing(head, 'y', 4, 0.15));
  legs.forEach((l, i) => A.add('walk', 1.8, swing(l, 'z', 1.8, 0.25, i * 0.5)));
  arms.forEach((a, i) => A.add('walk', 1.8, swing(a, 'z', 1.8, 0.2, i * 0.5 + 0.5)));
  A.add('smash', 2, ...arms.map((a) => rotateTrack(a, 'z', 2, (t) => 1.6 * Math.sin(Math.PI * Math.min(1, t * 1.4)) ** 2)));
  A.add('glow', 1, lampTracks('eyes', 3));
  void cushion;
  return done(root, 'golem', variant, o, T, A.list());
}

function extrudeBlade() {
  const sh = new THREE.Shape();
  sh.moveTo(-0.07, 0); sh.lineTo(0.07, 0); sh.lineTo(0.06, -0.9); sh.lineTo(0, -1.05); sh.lineTo(-0.06, -0.9); sh.lineTo(-0.07, 0);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
  g.translate(0, 0, -0.01);
  return g.rotateY(Math.PI / 2);
}

/* ------------------------------------ yeti ------------------------------------ */

export const YETI_VARIANTS = {
  standing: { p: '#eef0f2', b: '#d8dde2', face: '#5a7a9a', h: '#c8c0a8', eye: '#7ad8ff', pattern: 'fur', pose: 'stand' },
  crouching: { p: '#e2e4e0', b: '#c8ccc8', face: '#4a5a6a', h: '#b8b0a0', eye: '#9ae0ff', pattern: 'fur', pose: 'crouch' },
  roaring: { p: '#f4f4f0', b: '#dcdcd8', face: '#6a5a7a', h: '#d0c8b0', eye: '#ff6a40', pattern: 'fur', pose: 'roar' },
  elder: { p: '#c8c8c4', b: '#b0b0aa', face: '#5a5a5a', h: '#a8a090', eye: '#ffd060', pattern: 'fur', pose: 'elder', horns: 2 },
  hunter: { p: '#b8a88e', b: '#a89878', face: '#4a3a30', h: '#e0d8c0', eye: '#ffb030', pattern: 'fur', pose: 'hunter' },
};

export function createYeti(options = {}) {
  const { o, variant, T, r } = setup(options, YETI_VARIANTS, 'yeti');
  T.pattern = 'fur';
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const fur = skinMat(T, { clear: 0, rough: Math.max(0.85, T.rough) });
  const col = skinColor(T, { freq: 5 });
  const faceM = new THREE.MeshPhysicalMaterial({ name: 'face', color: T.trim ? new THREE.Color(T.p).multiplyScalar(0.45) : T.face, roughness: 0.6, clearcoat: 0.3 });
  const pose = T.pose;
  const crouch = pose === 'crouch';
  const hipY = crouch ? 0.7 : 1.05;
  const shag = 0.14;
  const body = group('body', { parent: rig, at: [0, hipY, 0], rot: [0, 0, crouch ? -0.6 : pose === 'elder' ? -0.3 : -0.12] });
  const torso = loft([[0, -0.15, 0], [0.02, 0.35, 0], [0.04, 0.8, 0], [0.02, 1.05, 0]], (t) => [keys(t, [[0, 0.38], [0.35, 0.42], [0.75, 0.5], [1, 0.3]]), keys(t, [[0, 0.32], [0.5, 0.34], [0.8, 0.36], [1, 0.25]])], fur, { seg: 26, rad: 22, color: col, bump: shag, bumpFreq: 14, up: [1, 0, 0], parent: body, name: 'chest', capStart: 0.6 });
  // belly / chest face-skin patch? (yetis: bare chest on elder) -> skip
  const head = group('head', { parent: body, at: [0.08, 1.12, 0], rot: [0, 0, pose === 'roar' ? 0.35 : crouch ? 0.5 : 0.1] });
  const hm = loft([[-0.05, -0.12, 0], [0, 0.08, 0], [-0.02, 0.28, 0]], (t) => keys(t, [[0, 0.2], [0.5, 0.24], [1, 0.12]]), fur, { seg: 14, rad: 18, color: col, bump: shag * 0.8, bumpFreq: 14, up: [1, 0, 0], parent: head, name: 'head_fur' });
  // face: smooth dark mask with brow, muzzle and mouth
  const face = mesh(new THREE.SphereGeometry(1, 18, 14).scale(0.12, 0.16, 0.16), faceM, { parent: head, at: [0.13, 0.05, 0], name: 'face' });
  void face;
  mesh(new THREE.SphereGeometry(1, 14, 10).scale(0.08, 0.06, 0.1), faceM, { parent: head, at: [0.22, -0.02, 0], name: 'muzzle' });
  const jaw = group('head_jaw', { parent: head, at: [0.18, -0.06, 0], rot: [0, 0, pose === 'roar' ? -0.45 : 0] });
  mesh(new THREE.SphereGeometry(1, 12, 8).scale(0.08, 0.04, 0.09), faceM, { parent: jaw, at: [0.02, -0.03, 0], name: 'jawbone' });
  if (pose === 'roar') { mesh(new THREE.SphereGeometry(1, 10, 8).scale(0.05, 0.04, 0.07), plainMat('#5a1a1c'), { parent: head, at: [0.22, -0.07, 0], name: 'mouth' }); for (const sg of [1, -1]) mesh(new THREE.ConeGeometry(0.012, 0.05, 6).rotateX(Math.PI), plainMat('#f2ead6', 0.4), { parent: head, at: [0.25, -0.05, sg * 0.045], name: 'fang' }); }
  const el = loft([[0.08, 0.1, 0], [0.16, 0.1, 0], [0.22, 0.09, 0]], 0.1, faceM, { parent: head, name: 'eyezone' });
  eyes(el, T, { t: 0.7, a: 1.0, r: 0.022, parent: head, slit: false });
  if (T.horns > 2 || pose === 'elder' || T.ram) for (const sg of [1, -1]) taper([[0.0, 0.2, sg * 0.15], [-0.05, 0.3, sg * 0.28], [0.05, 0.38, sg * 0.36], [0.12, 0.32, sg * 0.36]], 0.05, 0.01, hornMat(T), { parent: head, name: 'horn' });
  // shaggy tufts on shoulders/forearms/back
  const tuftM = fur;
  const tufts = [];
  for (let i = 0; i < 14; i++) {
    const s = torso.userData.surf(0.45 + r() * 0.5, (r() - 0.5) * 2 * Math.PI);
    tufts.push(orient(new THREE.ConeGeometry(0.06, 0.2, 6).translate(0, 0.08, 0), s.p.clone().addScaledVector(s.n, -0.03), s.n.clone().add(V([0, -1.2, 0])).normalize()));
  }
  mesh(merge(tufts), tuftM, { parent: body, name: 'tufts' });
  // limbs: arms long (knuckles near ground when crouching), legs short and thick
  rig.updateMatrixWorld(true);
  body.updateMatrix();
  const arms = [];
  const pw = (x, y, z) => V([x, y, z]).applyMatrix4(body.matrix);
  for (const sg of [1, -1]) {
    const sh = pw(0.03, 0.88, 0.46 * sg);
    let hand;
    if (pose === 'roar') hand = sh.clone().add(V([0.25, 0.75, sg * 0.35]));
    else if (crouch) hand = V([0.85, 0, 0.55 * sg]);
    else if (pose === 'elder' && sg < 0) hand = sh.clone().add(V([0.45, -0.6, sg * 0.05]));
    else if (pose === 'hunter' && sg > 0) hand = sh.clone().add(V([0.35, -0.55, sg * 0.05]));
    else hand = V([0.25, 0.25, 0.62 * sg]);
    const arm = leg(rig, sg > 0 ? 'arm_L' : 'arm_R', { hip: sh, foot: hand, bend: pose === 'roar' ? [-1, 0, sg * 0.5] : [-1, 0, sg * 0.3], len: sh.distanceTo(hand) * 1.1, r: [0.17, 0.14, 0.1], mat: fur, color: col, bump: shag, footType: 'paw', footMat: faceM, clawMat: hornMat(T, '#2a2420'), toes: 4, spread: 0.3 });
    arms.push(arm);
  }
  // staff (elder) or ice spear (hunter)
  if (pose === 'elder' || pose === 'hunter') {
    const sg = pose === 'elder' ? -1 : 1;
    const sh = pw(0.03, 0.88, 0.46 * sg);
    const hand = sh.clone().add(pose === 'elder' ? V([0.45, -0.6, sg * 0.05]) : V([0.35, -0.55, sg * 0.05]));
    const pole = pose === 'elder' ? M.wood('walnut') : plainMat('#5a4a3a', 0.8);
    const top = hand.clone().add(V([0.05, pose === 'elder' ? 0.9 : 1.1, 0]));
    const bottom = V([hand.x + 0.02, 0, hand.z]);
    taper([bottom.toArray(), hand.toArray(), top.toArray()], 0.035, 0.03, pole, { parent: rig, name: 'staff', seg: 8 });
    if (pose === 'elder') crystalCluster(top, [0, 1, 0], 0.18, crystalMat(T.eye, 0.6), r, { parent: rig, count: 4, name: 'staff_crystal' });
    else mesh(new THREE.ConeGeometry(0.05, 0.3, 6).translate(top.x, top.y + 0.13, top.z), crystalMat('#cfefff', 0.2), { parent: rig, name: 'spear_tip' });
  }
  const legs = [];
  for (const sg of [1, -1]) {
    const hip = V([0, hipY, 0.24 * sg]);
    const foot = V([crouch ? 0.15 : 0.08, 0, 0.3 * sg]);
    legs.push(leg(rig, sg > 0 ? 'leg_L' : 'leg_R', { hip, foot, bend: [1, 0, 0], len: hip.distanceTo(foot) * (crouch ? 1.35 : 1.06), r: [0.22, 0.17, 0.12], mat: fur, color: col, bump: shag, footType: 'stump', footMat: faceM, footLen: 0.42 }));
  }
  if (T.trim === 'fire') spikeRow(torso, { from: 0.4, to: 0.95, n: 6, h: 0.22, T, style: 'flame', a: Math.PI, lean: 0.2, name: 'flame_mane' });
  else if (T.crystals) for (const sg of [1, -1]) { const s = torso.userData.surf(0.85, Math.PI + sg * 0.6); crystalCluster(s.p, s.n, 0.3, crystalMat(T.glow, T.crystals === 'ice' ? 0.15 : 0.5), r, { parent: body, count: 5 }); }
  else if (T.spikes && T.trim && !['nub', 'metal', 'fin', 'leaf', 'cone'].includes(T.spikes)) spikeRow(torso, { from: 0.4, to: 0.95, n: 5, h: 0.18, T, a: Math.PI, lean: 0.2, name: 'spines' });
  if (T.trim === 'armoured') { mesh(cushion(0.5, 0.1, 1.0, { radius: 0.04, bulge: 0.5 }), M.metal('#8d939a', 0.35), { parent: body, at: [0.02, 1.0, 0], name: 'pauldrons' }); mesh(new THREE.TorusGeometry(0.42, 0.04, 6, 24).rotateX(Math.PI / 2), plainMat('#5a3a20', 0.7), { parent: body, at: [0.02, 0.3, 0], name: 'belt' }); }
  if (T.leaves) spikeRow(torso, { from: 0.5, to: 0.95, n: 7, h: 0.14, T, style: 'leaf', a: Math.PI, lean: 0.1, name: 'leaves' });
  if (T.ribs) { mesh(new THREE.SphereGeometry(1, 12, 10).scale(0.06, 0.14, 0.32), plainMat('#e3d8bb', 0.8), { parent: body, at: [0.36, 0.55, 0], name: 'bone_chest' }); }
  if (T.hoard) { const g = []; for (let i = 0; i < 6; i++) g.push(new THREE.TorusGeometry(0.035, 0.008, 5, 12).translate(0.4, 0.8 - i * 0.04, (i - 2.5) * 0.08)); mesh(merge(g), M.metal('#d8a838', 0.25), { parent: body, name: 'gold_chain' }); }
  if (T.lightning) for (const sg of [1, -1]) zigzag(torso.userData.surf(0.9, sg * 1.2).p, torso.userData.surf(0.2, sg * 1.5).p, 0.015, glowMat('#8fe6ff', 1.6), r, { parent: body, name: 'bolt' });
  if (T.scale !== 1) rig.scale.setScalar(T.trim === 'baby' ? 0.5 : T.scale);
  A.add('idle', 3.5, breathe(torso, 3.5, 0.03), swing(head, 'y', 3.5, 0.2));
  legs.forEach((l, i) => A.add('walk', 1.4, swing(l, 'z', 1.4, 0.3, i * 0.5)));
  arms.forEach((a, i) => A.add('walk', 1.4, swing(a, 'z', 1.4, 0.25, i * 0.5 + 0.5)));
  A.add('roar', 2, rotateTrack(jaw, 'z', 2, (t) => -0.5 * Math.sin(Math.PI * t) ** 2), rotateTrack(head, 'z', 2, (t) => 0.25 * Math.sin(Math.PI * t)));
  A.add('glow', 1, lampTracks('eyes', 3));
  void hm; void darkMat; void plinth; void lathe; void rock; void rockMat; void TAU;
  return done(root, 'yeti', variant, o, T, A.list());
}

/* -------------------------------- goblin statue -------------------------------- */

const STATUE_TRIMS = {
  bronze: { mat: () => M.metal('#9a6a3a', 0.35), base: '#5a5048' },
  'verdigris': { mat: () => new THREE.MeshStandardMaterial({ name: 'verdigris', color: '#5aa08a', roughness: 0.6, metalness: 0.4 }), base: '#6a665e' },
  gold: { mat: () => M.metal('#d6a43a', 0.22), base: '#2a2420' },
  jade: { mat: () => new THREE.MeshPhysicalMaterial({ name: 'jade', color: '#3a9a6a', roughness: 0.2, clearcoat: 1, transmission: 0, sheen: 0.4 }), base: '#e8e0d0' },
  obsidian: { mat: () => new THREE.MeshPhysicalMaterial({ name: 'obsidian', color: '#141218', roughness: 0.12, clearcoat: 1 }), base: '#3a3438' },
  marble: { mat: () => new THREE.MeshPhysicalMaterial({ name: 'marble', color: '#f2efe8', roughness: 0.25, clearcoat: 0.6 }), base: '#7a7470' },
  terracotta: { mat: () => new THREE.MeshStandardMaterial({ name: 'terracotta', color: '#b8643a', roughness: 0.9 }), base: '#8a7a6a' },
  mossy: { mat: () => new THREE.MeshStandardMaterial({ name: 'mossy', color: '#7a786a', roughness: 1 }), base: '#6a685a', moss: true },
  painted: { mat: () => new THREE.MeshStandardMaterial({ name: 'painted', color: '#6aa040', roughness: 0.55 }), base: '#c8b8a0', painted: true },
  crystal: { mat: () => crystalMat('#8a5ad8', 0.35), base: '#2a2440' },
  iron: { mat: () => M.metal('#4a4c50', 0.55), base: '#3a3a3a' },
  wood: { mat: () => M.wood('oak'), base: '#5a4030' },
};
export const GOBLIN_VARIANTS = {
  'spear-guard': { pose: 'spear', stone: '#8a867c' },
  'lantern-bearer': { pose: 'lantern', stone: '#9a9284' },
  thief: { pose: 'thief', stone: '#7a766c' },
  shaman: { pose: 'shaman', stone: '#8c8476' },
  drummer: { pose: 'drum', stone: '#94907f' },
};

export function createGoblinStatue(options = {}) {
  const { o, variant, T, r } = setup(options, GOBLIN_VARIANTS, 'goblin-statue', STATUE_TRIMS);
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const sm = T.mat ? T.mat() : new THREE.MeshStandardMaterial({ name: 'stone', color: o.color && !T.trim ? o.color : T.stone, roughness: 0.92 });
  const paint = T.painted;
  const skinM = sm;
  const clothM = paint ? new THREE.MeshStandardMaterial({ name: 'cloth', color: '#8a4a2a', roughness: 0.8 }) : sm;
  const metalM = paint ? M.metal('#9aa0a6', 0.4) : sm;
  const baseM = new THREE.MeshStandardMaterial({ name: 'plinth', color: T.base ?? '#77736b', roughness: 0.9 });
  const ph = 0.22;
  plinth(rig, 0.55, ph, baseM, { round: true });
  const pose = T.pose;
  const thief = pose === 'thief';
  const hipY = ph + (thief ? 0.28 : 0.42);
  const body = group('body', { parent: rig, at: [0, hipY, 0], rot: [0, 0, thief ? -0.5 : -0.2] });
  const torso = loft([[0, -0.06, 0], [0.02, 0.15, 0], [0.03, 0.32, 0]], (t) => [keys(t, [[0, 0.13], [0.5, 0.15], [1, 0.12]]), keys(t, [[0, 0.11], [0.5, 0.13], [1, 0.1]])], clothM, { seg: 16, rad: 16, up: [1, 0, 0], parent: body, name: 'chest' });
  // loincloth / tunic skirt
  mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.16, 16, 1, true).translate(0, -0.05, 0), clothM, { parent: body, name: 'tunic' });
  mesh(new THREE.TorusGeometry(0.145, 0.018, 6, 20).rotateX(Math.PI / 2).translate(0, 0.02, 0), paint ? plainMat('#4a3020', 0.8) : sm, { parent: body, name: 'belt' });
  // head: big, with long nose, pointed ears, grin
  const head = group('head', { parent: body, at: [0.05, 0.42, 0], rot: [0, 0, thief ? 0.4 : 0.1] });
  const hm = blob(0.13, 0.12, 0.12, skinM, { parent: head, name: 'head_skull', ws: 20, hs: 14 });
  void hm;
  taper([[0.08, 0.0, 0], [0.17, -0.02, 0], [0.24, -0.06, 0]], 0.035, 0.012, skinM, { parent: head, name: 'nose' });
  for (const sg of [1, -1]) {
    taper([[0, 0.03, sg * 0.1], [-0.05, 0.08, sg * 0.2], [-0.1, 0.12, sg * 0.3]], 0.045, 0.006, skinM, { parent: head, name: 'ear' });
    mesh(new THREE.SphereGeometry(0.02, 10, 8), paint ? plainMat('#f0e060', 0.3) : skinM, { parent: head, at: [0.105, 0.04, sg * 0.045], name: 'eyeball' });
    mesh(new THREE.SphereGeometry(1, 8, 6).scale(0.03, 0.012, 0.03), skinM, { parent: head, at: [0.1, 0.07, sg * 0.05], name: 'brow' });
  }
  const mouth = new THREE.TorusGeometry(0.05, 0.008, 6, 14, Math.PI).rotateZ(Math.PI).rotateY(Math.PI / 2);
  mesh(mouth, paint ? plainMat('#3a1a14') : sm, { parent: head, at: [0.115, -0.04, 0], name: 'grin' });
  // hat / hood per pose
  if (pose === 'shaman') {
    for (const sg of [1, -1]) taper([[0, 0.08, sg * 0.06], [-0.02, 0.17, sg * 0.12], [0.03, 0.25, sg * 0.14]], 0.02, 0.004, paint ? plainMat('#e8dcc0', 0.6) : sm, { parent: head, name: 'horn' });
  } else if (pose === 'spear') {
    mesh(new THREE.SphereGeometry(0.135, 16, 10, 0, TAU, 0, Math.PI / 2), metalM, { parent: head, at: [0, 0.02, 0], name: 'helmet' });
  } else if (pose === 'thief') {
    mesh(new THREE.ConeGeometry(0.14, 0.22, 16).translate(-0.02, 0.12, 0).rotateZ(0.5), clothM, { parent: head, at: [0, 0.03, 0], name: 'hood' });
  }
  // arms & legs (two-bone)
  rig.updateMatrixWorld(true);
  body.updateMatrix();
  const pw = (x, y, z) => V([x, y, z]).applyMatrix4(body.matrix);
  const hands = {
    spear: [V([0.18, hipY + 0.12, 0.2]), V([0.12, hipY + 0.06, -0.2])],
    lantern: [V([0.3, hipY + 0.3, 0.12]), V([0.08, hipY - 0.02, -0.2])],
    thief: [V([0.22, ph + 0.04, 0.16]), V([-0.1, hipY + 0.08, -0.24])],
    shaman: [V([0.22, hipY + 0.2, 0.2]), V([0.25, hipY + 0.1, -0.15])],
    drum: [V([0.24, hipY + 0.06, 0.12]), V([0.24, hipY + 0.06, -0.12])],
  }[pose];
  const arms = [];
  [1, -1].forEach((sg, i) => {
    const sh = pw(0.03, 0.3, 0.15 * sg);
    const hand = hands[i];
    arms.push(leg(rig, sg > 0 ? 'arm_L' : 'arm_R', { hip: sh, foot: hand, bend: [-1, -0.3, sg * 0.5], len: Math.max(0.3, sh.distanceTo(hand) * 1.1), r: [0.04, 0.032, 0.025], mat: skinM, footType: 'paw', clawMat: skinM, toes: 3, spread: 0.4 }));
  });
  const legs = [];
  for (const sg of [1, -1]) {
    const hip = V([0, hipY - 0.04, 0.08 * sg]);
    const foot = V([thief ? 0.12 : 0.04, ph, 0.12 * sg]);
    legs.push(leg(rig, sg > 0 ? 'leg_L' : 'leg_R', { hip, foot, bend: [1, 0, sg * 0.2], len: hip.distanceTo(foot) * (thief ? 1.4 : 1.1), r: [0.055, 0.04, 0.03], mat: skinM, footType: 'claw', clawMat: skinM, toes: 3, footLen: 0.1 }));
  }
  // props
  let lamp = null;
  if (pose === 'spear') {
    const h = hands[0];
    taper([[h.x, ph, h.z], h.toArray(), [h.x + 0.02, h.y + 0.55, h.z]], 0.015, 0.013, paint ? M.wood('oak') : sm, { parent: rig, name: 'spear_shaft', seg: 6 });
    mesh(new THREE.ConeGeometry(0.03, 0.12, 4).translate(h.x + 0.02, h.y + 0.6, h.z), metalM, { parent: rig, name: 'spear_tip' });
    // round shield on the other arm
    const s2 = hands[1];
    mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.025, 20).rotateX(Math.PI / 2), metalM, { parent: rig, at: [s2.x + 0.03, s2.y, s2.z - 0.04], name: 'shield' });
  } else if (pose === 'lantern') {
    const h = hands[0];
    const lan = group('lantern', { parent: rig, at: [h.x, h.y - 0.02, h.z] });
    mesh(new THREE.TorusGeometry(0.025, 0.005, 5, 12), metalM, { parent: lan, at: [0, 0.0, 0], name: 'lantern_ring' });
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6), metalM, { parent: lan, at: [0, -0.04, 0], name: 'lantern_hook' });
    mesh(lathe([[0, 0], [0.05, 0], [0.05, 0.01], [0.012, 0.012]], 8).translate(0, -0.075, 0).rotateX(Math.PI), metalM, { parent: lan, at: [0, -0.15, 0], name: 'lantern_cap' });
    lamp = lampGroup('lantern_light', 'amber');
    lamp.add(lan, { geometry: new THREE.CylinderGeometry(0.038, 0.042, 0.1, 8).translate(0, -0.12, 0), normal: [1, 0, 0], depth: 0.04, glowSize: 0.35 });
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 8), metalM, { parent: lan, at: [0, -0.175, 0], name: 'lantern_base' });
  } else if (pose === 'thief') {
    blob(0.13, 0.12, 0.11, clothM, { parent: rig, at: [-0.12, hipY + 0.12, -0.28], name: 'sack', jitter: 0.08 });
    for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.006, 12), paint ? M.metal('#d8a838', 0.3) : sm, { parent: rig, at: [0.15 + i * 0.03, ph + 0.003, 0.05 - i * 0.02], name: 'coin' });
  } else if (pose === 'shaman') {
    const h = hands[0];
    taper([[h.x, ph, h.z], h.toArray(), [h.x, h.y + 0.35, h.z]], 0.014, 0.012, paint ? M.wood('walnut') : sm, { parent: rig, name: 'staff', seg: 6 });
    mesh(new THREE.SphereGeometry(0.045, 14, 10), paint ? glowMat('#9cff6a', 1.2) : sm, { parent: rig, at: [h.x, h.y + 0.39, h.z], name: 'orb' });
    for (let i = 0; i < 3; i++) taper([[h.x, h.y + 0.33, h.z], [h.x + Math.cos(i * 2.1) * 0.05, h.y + 0.4, h.z + Math.sin(i * 2.1) * 0.05], [h.x + Math.cos(i * 2.1) * 0.04, h.y + 0.45, h.z + Math.sin(i * 2.1) * 0.04]], 0.008, 0.002, paint ? M.wood('walnut') : sm, { parent: rig, name: 'claw' });
    // potion pouch
    mesh(new THREE.SphereGeometry(0.04, 10, 8), clothM, { parent: body, at: [0.08, -0.02, 0.14], name: 'pouch' });
  } else if (pose === 'drum') {
    const dm = paint ? M.wood('walnut') : sm;
    const drum = group('drum', { parent: rig, at: [0.35, ph, 0] });
    mesh(lathe([[0, 0], [0.11, 0], [0.12, 0.08], [0.12, 0.2], [0.11, 0.24], [0, 0.24]], 20), dm, { parent: drum, name: 'drum_body' });
    mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.006, 20), paint ? plainMat('#e8d8b8', 0.7) : sm, { parent: drum, at: [0, 0.243, 0], name: 'drum_skin' });
    for (const h of hands) taper([h.toArray(), [h.x + 0.1, h.y + 0.04, h.z * 0.6], [h.x + 0.12 + 0.0, 0.47, h.z * 0.5]], 0.008, 0.006, dm, { parent: rig, name: 'drumstick' });
  }
  if (T.moss) { const g = []; for (let i = 0; i < 7; i++) g.push(new THREE.SphereGeometry(0.04 + r() * 0.03, 6, 5).scale(1, 0.4, 1).translate((r() - 0.5) * 0.4, ph + 0.005, (r() - 0.5) * 0.4)); g.push(new THREE.SphereGeometry(0.07, 6, 5).scale(1, 0.4, 1).translate(0, 0.12, 0).translate(0.05, hipY + 0.42 - 0.12 + 0.1, 0)); mesh(merge(g), M.foliage('#4f6a2a'), { parent: rig, name: 'moss' }); }
  if (T.scale !== 1) rig.scale.setScalar(T.scale);
  A.add('idle', 4, breathe(torso, 4, 0.02), swing(head, 'y', 4, 0.12));
  if (pose === 'drum') arms.forEach((a, i) => A.add('play', 0.6, swing(a, 'z', 0.6, 0.25, i * 0.5)));
  else arms.forEach((a, i) => A.add('wave', 1.2, swing(a, 'x', 1.2, 0.2, i * 0.5)));
  if (lamp) A.add('on', 1, lampTracks('lantern_light', 2.6));
  void legs; void eyes; void darkMat; void cushion; void spikeRow; void skinColor; void skinMat; void zigzag; void rock; void rockMat;
  return done(root, 'goblin-statue', variant, o, T, A.list());
}
