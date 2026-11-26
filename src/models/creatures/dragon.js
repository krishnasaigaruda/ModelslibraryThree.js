// Dragons and wyverns: lofted scaly bodies, two-bone legs, membrane wings, elemental trims.
import { THREE, M, group, mesh, loft, taper, leg, batWing, skinMat, skinColor, hornMat, membraneMat, glowMat, keys, setup, done, animKit, swing, breathe, rock, rockMat, hoard, spikeRow, TAU, lampTracks, rotateTrack, blob } from './common.js';
import { reptileHead, decorate } from './parts.js';

const P = (o, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(o.matrix);

export const DRAGON_VARIANTS = {
  western: { p: '#8b2a1a', b: '#d9a066', h: '#2a201a', w: '#9c3a22', pose: 'stand', wings: 0.55 },
  spread: { p: '#1f5a3a', b: '#c8c27a', h: '#e8dcc0', w: '#2f7a4a', pose: 'stand', wings: 0.15, roar: true, horns: 3 },
  perched: { p: '#6e4a24', b: '#d6b27a', h: '#1e1814', w: '#8a5a2a', pose: 'perch', wings: 1.15 },
  drake: { p: '#3d4436', b: '#a49a72', h: '#cfc4a4', w: '#3d4436', pose: 'stand', wings: 0, heavy: true, horns: 4 },
  serpentine: { p: '#2a5d8f', b: '#e8c45a', h: '#e6d8b0', w: '#2a5d8f', pose: 'serpent', wings: 0, antler: true },
  sleeping: { p: '#3a2a4e', b: '#a28ab8', h: '#d8cfe0', w: '#4a3866', pose: 'sleep', wings: -0.35 },
};

/** Shared quadruped-reptile builder (dragon). */
export function createDragon(options = {}) {
  const { o, variant, T, r } = setup(options, DRAGON_VARIANTS, 'dragon');
  const root = new THREE.Group();
  const rig = new THREE.Group();
  rig.name = 'rig';
  root.add(rig);
  const A = animKit();
  const skin = skinMat(T);
  const col = skinColor(T);
  const pose = T.pose;
  const heavy = T.heavy ? 1.18 : 1;
  const ch = T.chunky;
  if (pose === 'serpent') return serpentDragon(root, rig, T, o, variant, A, skin, col);

  const sleep = pose === 'sleep';
  const perch = pose === 'perch';
  const hipY = sleep ? 0.62 : T.heavy ? 1.05 : 1.25;
  // body group pitched for perch
  const body = group('body', { parent: rig, at: [sleep ? 0 : -0.9, hipY, 0], rot: [0, 0, perch ? 0.42 : 0] });
  body.updateMatrix();
  const L = 2.4;
  const rw = (t) => keys(t, [[0, 0.38], [0.35, 0.55], [0.7, 0.52], [1, 0.36]]) * heavy;
  const rh = (t) => keys(t, [[0, 0.42], [0.45, 0.58], [0.75, 0.52], [1, 0.38]]) * heavy;
  const chest = loft([[0.9 - L / 2 - 0.9, 0, 0], [0.4 - 0.9, 0.05, 0], [1.3 - 0.9, 0.1, 0], [L - 0.2 - 0.9 + 0.2, 0.25, 0]].map(([x, y, z]) => [x + 0.9, y, z]), (t) => [rw(t), rh(t)], skin, { seg: 44, rad: 22, color: col, bump: T.bump, parent: body, name: 'chest', capStart: 0.9, capEnd: 0.6 });
  // chest local: x 0.6..2.6 roughly → tail at x≈0.3, neck at x≈2.3
  // neck
  const neckBase = [2.1, 0.25, 0];
  const neckLen = (T.baby ? 0.6 : 1) * (T.heavy ? 0.7 : 1);
  const neckTop = sleep ? [3.1, -0.25, 0.5] : T.roar ? [2.75, 1.45 * neckLen, 0] : [2.95, 1.15 * neckLen, 0];
  const neck = group('neck', { parent: body, at: neckBase });
  const nt = new THREE.Vector3(...neckTop).sub(new THREE.Vector3(...neckBase));
  const nmid = sleep ? [0.7, -0.3, 0.1] : [nt.x * 0.25, nt.y * 0.62, 0];
  const neckL = loft([[-0.25, -0.05, 0], nmid, nt.toArray()], (t) => keys(t, [[0, 0.36], [0.5, 0.24], [1, 0.2]]) * heavy * (T.baby ? 1.1 : 1), skin, { seg: 24, rad: 18, color: col, bump: T.bump, parent: neck, name: 'neck_loft', capStart: 0.5, capEnd: 0.4 });
  decorate(neckL, T, { from: 0.1, to: 0.9, n: 6, h: 0.16, crystals: false, rib: false, name: 'neck' });
  // head
  const headPitch = sleep ? -0.15 : perch ? -0.55 : T.roar ? 0.2 : -0.35;
  const hd = reptileHead(neck, T, { at: nt.clone().add(new THREE.Vector3(-0.06, 0, 0)).toArray(), rot: [0, sleep ? 0.5 : 0, headPitch], len: 0.95, w: 0.5, h: 0.42, mat: skin, color: col, jawOpen: T.roar ? 0.5 : 0, closed: sleep });
  // tail
  const tail = group('tail', { parent: body, at: [0.0, 0.05, 0] });
  const tailPts = sleep
    ? [[0.1, 0, 0], [-0.8, -0.2, -0.3], [-1.3, -0.45, -1.2], [-0.6, -0.52, -2.0], [0.8, -0.55, -2.1], [1.9, -0.56, -1.6]]
    : perch
      ? [[0.1, 0, 0], [-0.8, -0.35, 0], [-1.4, -0.95, 0.2], [-2.2, -1.12, 0.7], [-2.9, -1.1, 1.3]]
      : [[0.1, 0, 0], [-0.9, -0.2, 0], [-1.9, -0.75, 0.25], [-2.8, -1.08, 0.7], [-3.5, -1.15 * hipY / 1.25 + 0.06, 1.3]];
  if (T.baby) tailPts.forEach((p, i) => { if (i > 1) { p[0] *= 0.8; p[2] *= 0.8; } });
  const tailL = loft(tailPts, (t) => keys(t, [[0, 0.36], [0.3, 0.24], [0.7, 0.11], [1, 0.035]]) * heavy, skin, { seg: 40, rad: 14, color: col, bump: T.bump, parent: tail, name: 'tail_loft', capStart: 0.5, capEnd: 1 });
  decorate(tailL, T, { from: 0.05, to: 0.85, n: 9, h: (t) => 0.2 * (1 - t * 0.7), crystals: false, rib: false, plates: T.plates, name: 'tail' });
  // tail tip ornament
  const tip = tailL.userData.surf(1, 0);
  if (T.spikes === 'flame') mesh(new THREE.SphereGeometry(0.1, 10, 8).scale(1, 1.8, 1), glowMat(T.glow, 1.8, 0.9), { parent: tail, at: tip.c.toArray(), name: 'tail_flame' });
  else if (!T.baby) {
    const sp = tailL.userData.surf(0.97, 0);
    const d = sp.t.clone();
    const g = new THREE.ConeGeometry(0.16, 0.42, 4).rotateY(Math.PI / 4);
    g.scale(1, 1, 0.25);
    g.translate(0, 0.16, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    g.applyQuaternion(q);
    mesh(g, hornMat(T), { parent: tail, at: sp.c.toArray(), name: 'tail_spade' });
  }
  // back decoration
  decorate(chest, T, { from: 0.08, to: 0.92, n: 8, h: 0.24, name: 'back' });
  if (T.hoard) hoard(rig, 2.4, r);
  // legs (rig space)
  rig.updateMatrixWorld(true);
  const chk = T.baby ? 1.25 : 1;
  const legR = (s) => [0.26 * s * heavy * chk, 0.15 * s * heavy * chk, 0.085 * s * heavy * chk];
  const legs = [];
  const sx = sleep ? 0 : -0.9;
  const legDefs = [
    { n: 'leg_BL', hip: [0.35, -0.08, 0.38], foot: sleep ? [-0.05 + sx, 0, 0.9] : perch ? [-0.75, 0, 0.6] : [-0.85, 0, 0.55], hock: sleep ? null : [-0.28, 0.42, 0], bend: [1, 0, sleep ? 0.6 : 0.1], r: legR(1) },
    { n: 'leg_FL', hip: [1.95, 0.0, 0.36], foot: sleep ? [2.3 + 0.3 + sx, 0, 0.75] : perch ? null : [1.2, 0, 0.52], bend: sleep ? [0, 0, 1] : [-1, 0, 0.1], r: legR(0.8) },
  ];
  let rockTop = 0;
  if (perch) {
    const rk = rock(rig, 1.5, 1.05, 1.6, rockMat(T.moss ? '#6f6c5c' : '#77736b'), { at: [1.2, 0, 0], seed: 4 });
    rockTop = rk.userData.top;
  }
  for (const d of legDefs) for (const sg of [1, -1]) {
    const hip = P(body, d.hip[0], d.hip[1], d.hip[2] * sg);
    let foot;
    if (d.foot) foot = new THREE.Vector3(d.foot[0], d.foot[1], d.foot[2] * sg);
    else foot = new THREE.Vector3(hip.x + 0.18, rockTop - 0.06, d.hip[2] * sg * 1.25);
    const name = d.n.replace('L', sg > 0 ? 'L' : 'R');
    legs.push(leg(rig, name, { hip, foot, hock: d.hock, bend: d.bend.map((v, i) => (i === 2 ? v * sg : v)), r: d.r, mat: skin, color: col, footType: 'claw', clawMat: hornMat(T), toes: 3, bump: T.bump * 0.5 }));
  }
  // wings
  const wings = [];
  if (T.wings) {
    for (const sg of [1, -1]) {
      const s = chest.userData.surf(0.72, sg * 0.55);
      const veins = T.lightning || T.spikes === 'flame' ? glowMat(T.glow, 1.4) : null;
      const w = batWing(body, sg > 0 ? 'wing_L' : 'wing_R', T, { root: s.p.toArray(), side: sg, span: (T.baby ? 2.2 : 3.2) * heavy * (sleep ? 0.55 : 1), chord: (T.baby ? 1.2 : 1.7) * (sleep ? 0.75 : 1), raise: T.wings, sweep: sleep || perch ? -0.55 : -0.1, boneR: 0.05, rand: r, veins });
      wings.push(w);
    }
  }
  if (T.scale !== 1) rig.scale.setScalar(T.scale);
  // animations
  const pr = 2.4;
  A.add('idle', 4, breathe(chest, 4, 0.025), swing(neck, 'z', 4, 0.04), swing(hd.head, 'y', 4, 0.12, 0.25), swing(tail, 'y', 4, 0.08));
  if (!sleep) {
    legs.forEach((lg, i) => A.add('walk', pr / 2, swing(lg, 'z', pr / 2, 0.28, (i % 2) * 0.5 + (i >= 2 ? 0.25 : 0))));
    A.add('walk', pr / 2, swing(tail, 'y', pr / 2, 0.12), swing(neck, 'y', pr / 2, 0.05, 0.25));
  }
  wings.forEach((w, i) => A.add('flap', 1.2, swing(w, 'x', 1.2, 0.45 * (i ? 1 : -1))));
  A.add('roar', 2, rotateTrack(hd.jaw, 'z', 2, (t) => -0.55 * Math.sin(Math.PI * Math.min(1, t * 1.6)) ** 2), rotateTrack(neck, 'z', 2, (t) => 0.12 * Math.sin(Math.PI * Math.min(1, t * 1.6))));
  A.add('glow', 1, lampTracks('eyes', 3));
  return done(root, 'dragon', variant, o, T, A.list());
}

/** Eastern-style long dragon: one sinuous loft, four short legs, whiskers, mane, antlers. */
function serpentDragon(root, rig, T, o, variant, A, skin, col) {
  const r = T.r;
  const body = group('body', { parent: rig });
  const pts = [];
  const N = 14;
  const len = T.baby ? 5 : 8;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = len * 0.5 - t * len;
    const y = 0.32 + Math.max(0, Math.sin(t * Math.PI * 2.2 + 0.4)) * (1 - t) * 0.9 + (t < 0.1 ? (0.1 - t) * 6 : 0);
    const z = Math.sin(t * Math.PI * 3) * 0.9 * (0.4 + t);
    pts.push([x, y, z]);
  }
  pts[0][1] = 1.35; pts[1][1] = 1.05;
  const bodyL = loft(pts, (t) => keys(t, [[0, 0.24], [0.08, 0.3], [0.3, 0.34], [0.7, 0.24], [1, 0.03]]), skin, { seg: 110, rad: 16, color: col, bump: T.bump, parent: body, name: 'chest', capStart: 0.5, capEnd: 1 });
  // mane: fin row along the top
  spikeRow(bodyL, { from: 0.06, to: 0.95, n: 30, h: (t) => 0.22 * (1 - t * 0.6), T, style: T.spikes === 'cone' ? 'fin' : T.spikes, lean: 0.8, name: 'mane' });
  decorate(bodyL, T, { from: 0.1, to: 0.6, n: 0, h: 0.18, crystalT: [0.25, 0.55], name: 'body' });
  const s0 = bodyL.userData.surf(0, 0);
  const hd = reptileHead(body, T, { at: s0.c.clone().add(new THREE.Vector3(-0.1, 0.05, 0)).toArray(), rot: [0, 0, -0.1], len: 0.75, w: 0.42, h: 0.34, mat: skin, color: col, whiskers: true, horns: 2, jawOpen: 0.25 });
  // tail tuft
  const tp = bodyL.userData.surf(1, 0);
  const tm = hornMat(T, T.b);
  taper([tp.c.clone().addScaledVector(tp.t, -0.2).toArray(), tp.c.clone().addScaledVector(tp.t, 0.25).add(new THREE.Vector3(0, 0.15, 0)).toArray(), tp.c.clone().addScaledVector(tp.t, 0.5).add(new THREE.Vector3(0, 0.05, 0)).toArray()], 0.12, 0.02, tm, { parent: body, name: 'tail_tuft' });
  // pearl in a front claw? → 4 short legs touching ground
  const legs = [];
  const at = [0.16, 0.24, 0.52, 0.6];
  at.forEach((t, i) => {
    const s = bodyL.userData.surf(t, (i % 2 ? -1 : 1) * 1.7);
    const sg = i % 2 ? -1 : 1;
    const foot = s.p.clone().add(new THREE.Vector3(0.1, 0, sg * 0.25));
    foot.y = 0;
    legs.push(leg(rig, `leg_${i}`, { hip: s.c.clone().addScaledVector(s.n, 0.1), foot, bend: [-1, 0, sg * 0.4], r: [0.11, 0.075, 0.055], mat: skin, color: col, footType: 'claw', clawMat: hornMat(T), toes: 4, spread: 0.6 }));
  });
  // ground contacts are the belly sags (y≈0.32-r) and the feet
  if (T.hoard) hoard(rig, 2.8, r);
  if (T.scale !== 1) rig.scale.setScalar(T.scale);
  A.add('idle', 4, breathe(bodyL, 4, 0.02), swing(hd.head, 'y', 4, 0.15), swing(hd.jaw, 'z', 4, 0.06, 0, 1, -0.06));
  legs.forEach((lg, i) => A.add('walk', 1.2, swing(lg, 'z', 1.2, 0.35, i * 0.25)));
  A.add('walk', 1.2, swing(hd.head, 'y', 1.2, 0.2));
  A.add('glow', 1, lampTracks('eyes', 3));
  return done(root, 'dragon', variant, o, T, A.list());
}

/* ----------------------------------- wyvern ----------------------------------- */

export const WYVERN_VARIANTS = {
  standing: { p: '#5a6a3a', b: '#c9c08a', h: '#2a2620', w: '#6f7d48', pose: 'stand' },
  swooping: { p: '#7a3328', b: '#e0b07a', h: '#1c1612', w: '#a04a34', pose: 'swoop' },
  crested: { p: '#2d4a6a', b: '#b8c8d8', h: '#e0d4b0', w: '#3d6a9a', pose: 'stand', crest: 0.5 },
  'sea-wyvern': { p: '#1f6a6a', b: '#a8e0d0', h: '#e8f0e8', w: '#2a8a8a', pose: 'stand', finned: true },
  barbed: { p: '#4a3a2a', b: '#b89a72', h: '#d8c8a0', w: '#5a4632', pose: 'stand', barb: true },
};

export function createWyvern(options = {}) {
  const { o, variant, T, r } = setup(options, WYVERN_VARIANTS, 'wyvern');
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const skin = skinMat(T);
  const col = skinColor(T);
  const swoop = T.pose === 'swoop';
  let base = 0;
  if (swoop) base = rock(rig, 1.4, 0.9, 1.2, rockMat(), { at: [-0.1, 0, 0], seed: 9 }).userData.top - 0.05;
  const hipY = 1.15 + base;
  const body = group('body', { parent: rig, at: [-0.2, hipY, 0], rot: [0, 0, swoop ? 0.15 : 0.32] });
  body.updateMatrix();
  const chest = loft([[-0.35, 0, 0], [0.3, 0.08, 0], [0.95, 0.2, 0], [1.3, 0.35, 0]], (t) => [keys(t, [[0, 0.3], [0.4, 0.4], [1, 0.26]]), keys(t, [[0, 0.32], [0.45, 0.44], [1, 0.3]])], skin, { seg: 34, rad: 20, color: col, bump: T.bump, parent: body, name: 'chest', capStart: 0.8, capEnd: 0.6 });
  decorate(chest, T, { from: 0.1, to: 0.9, n: 6, h: 0.18, name: 'back' });
  const neck = group('neck', { parent: body, at: [1.15, 0.3, 0] });
  const nl = loft([[-0.2, -0.05, 0], [0.25, 0.45, 0], [0.55, 0.85, 0]], (t) => keys(t, [[0, 0.26], [1, 0.14]]), skin, { seg: 20, rad: 16, color: col, parent: neck, name: 'neck_loft' });
  decorate(nl, T, { from: 0.1, to: 0.9, n: 5, h: 0.12, crystals: false, rib: false, plates: false, name: 'neck' });
  const hd = reptileHead(neck, T, { at: [0.5, 0.85, 0], rot: [0, 0, swoop ? 0.1 : -0.55], len: 0.75, w: 0.36, h: 0.3, mat: skin, color: col, beak: !T.finned, crest: T.crest ?? (T.finned ? 0.4 : 0), jawOpen: swoop ? 0.45 : 0, horns: T.finned ? 0 : T.horns });
  if (T.finned) for (const sg of [1, -1]) { const s = hd.skull.userData.surf(0.15, sg * 1.4); spikeRow(hd.skull, { from: 0.05, to: 0.25, n: 3, h: 0.18, T, style: 'fin', a: sg * 1.4, lean: 1.2, name: 'head_fin' }); void s; }
  const tail = group('tail', { parent: body, at: [-0.2, 0, 0] });
  const tl = loft([[0.1, 0, 0], [-0.7, -0.25, 0], [-1.5, -0.75, 0.2], [-2.2, -hipY / Math.cos(0.32) * 0.8 + 0.1, 0.6], [-2.8, -hipY * 0.9 + 0.12, 1.0]], (t) => keys(t, [[0, 0.28], [0.4, 0.15], [1, 0.03]]), skin, { seg: 34, rad: 12, color: col, parent: tail, name: 'tail_loft', capEnd: 1 });
  decorate(tl, T, { from: 0.05, to: 0.8, n: 8, h: (t) => 0.15 * (1 - t * 0.6), crystals: false, rib: false, plates: false, name: 'tail' });
  const ts = tl.userData.surf(0.96, 0);
  if (T.barb || T.finned) {
    const g = T.finned ? new THREE.ConeGeometry(0.28, 0.5, 3).scale(1, 1, 0.12) : new THREE.ConeGeometry(0.06, 0.4, 8);
    g.translate(0, 0.16, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), ts.t));
    mesh(g, T.finned ? membraneMat(T) : hornMat(T), { parent: tail, at: ts.c.toArray(), name: 'tail_barb' });
  }
  rig.updateMatrixWorld(true);
  const legs = [];
  for (const sg of [1, -1]) {
    const hip = P(body, 0.05, -0.05, 0.3 * sg);
    legs.push(leg(rig, sg > 0 ? 'leg_L' : 'leg_R', { hip, foot: [hip.x + 0.25, base, 0.42 * sg], hock: [-0.25, 0.4, 0], bend: [1, 0, 0.1 * sg], r: [0.24, 0.13, 0.075].map((v) => v * (T.baby ? 1.3 : 1)), mat: skin, color: col, footType: 'talon', clawMat: hornMat(T), toes: 3 }));
  }
  // wings = arms: the wing wrist bends down to touch the ground (knuckle-walk) unless swooping
  const wings = [];
  for (const sg of [1, -1]) {
    const s = chest.userData.surf(0.78, sg * 0.6);
    const veins = T.lightning || T.spikes === 'flame' ? glowMat(T.glow, 1.4) : null;
    wings.push(batWing(body, sg > 0 ? 'wing_L' : 'wing_R', T, { root: s.p.toArray(), side: sg, span: T.baby ? 2.0 : 3.0, chord: T.baby ? 1.1 : 1.5, raise: swoop ? 0.05 : 0.9, sweep: swoop ? 0.1 : -0.35, boneR: 0.05, rand: r, veins, fingers: 4 }));
  }
  if (T.hoard) hoard(rig, 2, r);
  if (T.scale !== 1) rig.scale.setScalar(T.scale);
  A.add('idle', 3.5, breathe(chest, 3.5, 0.03), swing(hd.head, 'y', 3.5, 0.15), swing(tail, 'y', 3.5, 0.1));
  wings.forEach((w, i) => A.add('flap', 1, swing(w, 'x', 1, 0.55 * (i ? 1 : -1))));
  legs.forEach((lg, i) => A.add('walk', 1, swing(lg, 'z', 1, 0.3, i * 0.5)));
  A.add('walk', 1, swing(tail, 'y', 1, 0.15));
  A.add('roar', 2, rotateTrack(hd.jaw, 'z', 2, (t) => -0.5 * Math.sin(Math.PI * Math.min(1, t * 1.6)) ** 2));
  A.add('glow', 1, lampTracks('eyes', 3));
  void blob; void M; void TAU;
  return done(root, 'wyvern', variant, o, T, A.list());
}
