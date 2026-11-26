// Phoenix (fire bird on a perch / nest) and gargoyle (winged grotesque crouching on a plinth).
import { THREE, M, group, mesh, loft, taper, leg, featherWing, batWing, skinMat, skinColor, hornMat, glowMat, crystalMat, plainMat, darkMat, keys, setup, done, animKit, swing, breathe, rock, rockMat, hoard, merge, orient, eyes, plateRow, ribs, crystalCluster, spikeRow, noise3, sstep, TAU, lampTracks, rotateTrack, blob, zigzag, plinth, roundedBox, lathe } from './common.js';
import { reptileHead, decorate } from './parts.js';

const P = (o, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(o.matrix);

/* ---------------------------------- phoenix ---------------------------------- */

export const PHOENIX_VARIANTS = {
  perched: { p: '#d8341a', b: '#ffb030', w: '#e85a14', h: '#f2c040', crestC: '#ffd23a', tailC: '#ff7a1a', eye: '#fff07a', glow: '#ffb020', perch: 'rock' },
  rising: { p: '#e8461a', b: '#ffd04a', w: '#ff7a1a', h: '#f8d060', crestC: '#fff07a', tailC: '#ffb030', eye: '#ffffa0', glow: '#ffd040', perch: 'nest', spread: true },
  nesting: { p: '#b82a1a', b: '#f09a30', w: '#c8401a', h: '#e8b040', crestC: '#ffc040', tailC: '#e86a1a', eye: '#ffe07a', glow: '#ff9a20', perch: 'nest', sit: true },
  'long-tail': { p: '#c41e3a', b: '#ffa040', w: '#e04a2a', h: '#f2c040', crestC: '#ffe060', tailC: '#8a2ad0', eye: '#fff07a', glow: '#ff6ad0', perch: 'stand', longTail: true },
  roosting: { p: '#e0601a', b: '#ffd060', w: '#f08a2a', h: '#f8d870', crestC: '#ff4a1a', tailC: '#ff3a1a', eye: '#ffffa0', glow: '#ff8a20', perch: 'branch' },
};

export function createPhoenix(options = {}) {
  const { o, variant, T, r } = setup(options, PHOENIX_VARIANTS, 'phoenix');
  if (T.trim) { T.crestC = T.glow; T.tailC = T.w; }
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const hot = !T.trim || T.trim === 'fire' || T.trim === 'gold';
  const skin = skinMat({ ...T, smoulder: hot ? '#ff3000' : T.smoulder }, { clear: 0.2 });
  const cB = new THREE.Color(T.b), cP = new THREE.Color(T.p), cc = new THREE.Color();
  const col = (u, a, p) => { cc.copy(cB).lerp(cP, sstep(-0.6, 0.3, Math.cos(a))); cc.multiplyScalar(0.9 + 0.2 * noise3(p.x * 14, p.y * 14, p.z * 14)); return cc; };
  // perch → top height and grip x
  let top = 0;
  const perchM = T.trim === 'stone' || T.trim === 'undead' ? rockMat('#5a5650') : rockMat('#4a3a34');
  // pure model: the bird stands on the ground (no rock / stand / branch under it); only the ember nest stays,
  // as it's part of the phoenix itself
  if (T.perch !== 'nest') T.perch = 'ground';
  if (T.perch === 'rock') top = rock(rig, 1.1, 0.75, 0.9, perchM, { seed: 5 }).userData.top - 0.04;
  else if (T.perch === 'nest') {
    // ember nest: woven twig torus on a low rock
    const rk = rock(rig, 1.2, 0.35, 1.2, perchM, { seed: 2 });
    const twig = plainMat('#4a2e1a', 0.95);
    const geos = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU, rr = 0.36 + 0.06 * Math.sin(i * 3);
      const g = new THREE.CylinderGeometry(0.018, 0.018, 0.5, 5).rotateZ(Math.PI / 2).rotateY(a + 1.2);
      g.translate(Math.cos(a) * rr, rk.userData.top + 0.05 + 0.04 * (i % 3), Math.sin(a) * rr);
      geos.push(g);
    }
    geos.push(new THREE.TorusGeometry(0.36, 0.09, 8, 24).rotateX(Math.PI / 2).translate(0, rk.userData.top + 0.05, 0));
    mesh(merge(geos), twig, { parent: rig, name: 'nest' });
    const emb = glowMat(T.trim === 'ice' ? '#9fe8ff' : T.trim === 'poison' ? '#9cff2e' : T.trim === 'shadow' ? '#8a2cff' : '#ff6a10', 1.6);
    const eg = [];
    for (let i = 0; i < 14; i++) { const a = r() * TAU, d = r() * 0.28; eg.push(new THREE.DodecahedronGeometry(0.035 + r() * 0.03, 0).translate(Math.cos(a) * d, rk.userData.top + 0.02, Math.sin(a) * d)); }
    mesh(merge(eg), emb, { parent: rig, name: 'embers' });
    top = rk.userData.top + 0.04;
  } else if (T.perch === 'stand' || T.perch === 'branch') {
    const wm = T.perch === 'stand' ? M.metal('#3a3430', 0.4) : M.wood('walnut');
    mesh(lathe([[0, 0], [0.32, 0], [0.32, 0.03], [0.1, 0.07], [0.04, 0.1], [0, 0.1]], 28), wm, { parent: rig, name: 'stand_base' });
    const ph = 1.0;
    mesh(new THREE.CylinderGeometry(0.03, 0.04, ph, 12), wm, { parent: rig, at: [0, ph / 2 + 0.05, 0], name: 'stand_post' });
    if (T.perch === 'branch') taper([[-0.55, ph + 0.02, 0], [-0.1, ph + 0.06, 0], [0.3, ph + 0.04, 0.05], [0.6, ph + 0.12, 0.08]], 0.05, 0.02, wm, { parent: rig, name: 'branch' });
    else mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 12).rotateZ(Math.PI / 2), wm, { parent: rig, at: [0, ph + 0.04, 0], name: 'stand_bar' });
    top = ph + 0.09;
  }
  // body
  const sit = T.sit;
  const lift = sit ? 0.12 : 0.32;
  const body = group('body', { parent: rig, at: [0, top + lift, 0], rot: [0, 0, sit ? 0.15 : T.spread ? 0.75 : 0.55] });
  body.updateMatrix();
  const torso = loft([[-0.32, 0, 0], [-0.05, 0.02, 0], [0.22, 0.04, 0], [0.38, 0.08, 0]], (t) => [keys(t, [[0, 0.07], [0.35, 0.17], [0.7, 0.17], [1, 0.1]]), keys(t, [[0, 0.07], [0.4, 0.19], [0.75, 0.18], [1, 0.11]])], skin, { seg: 24, rad: 18, color: col, parent: body, name: 'chest', capStart: 0.6 });
  const neck = group('neck', { parent: body, at: [0.32, 0.08, 0], rot: [0, 0, sit ? 0.2 : -0.3] });
  loft([[-0.08, -0.02, 0], [0.06, 0.12, 0], [0.1, 0.24, 0]], (t) => keys(t, [[0, 0.11], [1, 0.07]]), skin, { seg: 12, rad: 14, color: col, parent: neck, name: 'neck_loft' });
  const head = group('head', { parent: neck, at: [0.1, 0.27, 0], rot: [0, 0, sit ? -0.5 : -0.35] });
  const hl = loft([[-0.07, 0, 0], [0.03, 0.01, 0], [0.11, 0, 0]], (t) => keys(t, [[0, 0.07], [0.4, 0.08], [1, 0.05]]), skin, { seg: 12, rad: 14, color: () => cB, parent: head, name: 'head_loft' });
  eyes(hl, T, { t: 0.55, a: 1.1, r: 0.016, parent: head, slit: false });
  const beakM = T.trim === 'gold' ? M.metal('#f0d070', 0.2) : hornMat(T, T.h);
  taper([[0.07, 0.025, 0], [0.16, 0.02, 0], [0.21, -0.02, 0], [0.2, -0.06, 0]], 0.04, 0.004, beakM, { parent: head, name: 'beak', pow: 0.7 });
  // crest plumes
  const crestM = hot || T.trim === 'storm' ? glowMat(T.crestC, 1.3) : T.trim === 'ice' || T.trim === 'crystal' ? crystalMat(T.glow, 0.4) : plainMat(T.crestC, 0.6);
  const cp = [];
  for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.18; cp.push([[-0.02, 0.05, a * 0.1], [-0.1, 0.16 + i * 0.01, a * 0.4], [-0.2, 0.22 - Math.abs(a) * 0.2, a * 0.6]]); }
  const cGeos = cp.map((pts) => taper(pts, 0.016, 0.004, crestM, { seg: 8, rad: 6 }).geometry);
  mesh(merge(cGeos), crestM, { parent: head, name: 'crest' });
  // tail plumes with eye tips
  const tail = group('tail', { parent: body, at: [-0.28, 0, 0] });
  const tailM = hot || T.trim === 'storm' || T.trim === 'poison' ? glowMat(T.tailC, 0.9) : T.trim === 'ice' || T.trim === 'crystal' ? crystalMat(T.glow, 0.3) : plainMat(T.tailC, 0.6);
  const n = T.longTail ? 7 : 5;
  const tl = T.longTail ? 1.7 : 0.95;
  const tGeos = [], tips = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1) - 0.5;
    const droop = sit ? 0.1 : 0.55;
    const pts = [[0.05, 0, f * 0.05], [-tl * 0.35, -tl * 0.15 * droop, f * 0.3], [-tl * 0.7, -tl * 0.45 * droop, f * 0.55], [-tl, -tl * 0.65 * droop - Math.abs(f) * 0.1, f * 0.75]];
    tGeos.push(taper(pts, 0.035, 0.012, tailM, { seg: 14, rad: 6 }).geometry);
    const e = new THREE.Vector3(...pts[3]);
    tips.push(new THREE.SphereGeometry(1, 10, 6).scale(0.09, 0.012, 0.05).translate(e.x - 0.03, e.y, e.z));
  }
  mesh(merge(tGeos), tailM, { parent: tail, name: 'tail_plumes' });
  mesh(merge(tips), T.trim === 'shadow' ? glowMat('#8a2cff', 1.2) : glowMat(T.longTail ? '#30d0ff' : T.glow, 1.2), { parent: tail, name: 'tail_eyes' });
  // wings
  const wings = [];
  const wm = hot ? glowMat(T.w, 0.45) : T.trim === 'ice' || T.trim === 'crystal' ? crystalMat(T.glow, 0.2) : T.trim === 'gold' ? M.metal('#d8a838', 0.3) : T.trim === 'stone' ? plainMat('#8a857a', 0.95) : plainMat(T.w, 0.7);
  for (const sg of [1, -1]) {
    const s = torso.userData.surf(0.7, sg * 0.6);
    wings.push(featherWing(body, sg > 0 ? 'wing_L' : 'wing_R', T, { root: s.p.toArray(), side: sg, span: T.spread ? 1.3 : 1.0, chord: 0.45, raise: T.spread ? 0.4 : 1.15, sweep: T.spread ? 0.35 : -0.5, primary: wm, secondary: plainMat(T.p, 0.6), covert: plainMat(T.b, 0.6), rand: r, glowTips: hot ? glowMat('#ffe060', 1.8) : T.trim === 'storm' ? glowMat('#8fe6ff', 1.6) : null }));
  }
  // legs gripping the perch
  rig.updateMatrixWorld(true);
  const legs = [];
  const legM = plainMat(T.trim ? T.h : '#5a3a20', 0.6);
  for (const sg of [1, -1]) {
    const hip = P(body, 0.02, -0.12, 0.07 * sg);
    const foot = new THREE.Vector3(hip.x + 0.04, top - 0.03, 0.09 * sg);
    legs.push(leg(rig, sg > 0 ? 'leg_L' : 'leg_R', { hip, foot, bend: [1, 0, 0], r: [0.05, 0.025, 0.02], mat: legM, footType: 'talon', clawMat: hornMat(T, '#1a1410'), footMat: legM, toes: 3 }));
  }
  // trim extras
  if (T.ribs) ribs(torso, { from: 0.3, to: 0.7, n: 4, a0: 0.6, a1: 2.2, r: 0.008, mat: hornMat(T, '#e3d8bb') });
  if (T.plates) plateRow(torso, { from: 0.35, to: 0.8, n: 3, w: 0.2, l: 0.12, th: 0.02, side: 0, mat: M.metal('#9aa0a8', 0.3), name: 'breastplate' });
  if (T.crystals) { const s = torso.userData.surf(0.5, 0); crystalCluster(s.p, s.n, 0.12, crystalMat(T.glow, 0.4), r, { parent: body, count: 4 }); }
  if (T.leaves) spikeRow(torso, { from: 0.2, to: 0.8, n: 5, h: 0.06, T, style: 'leaf', lean: 0.4, name: 'leaves' });
  if (T.hoard) hoard(rig, 0.9, r);
  if (T.scale !== 1) rig.scale.setScalar(T.trim === 'baby' ? 0.6 : T.scale);
  A.add('idle', 3, breathe(torso, 3, 0.03), swing(head, 'y', 3, 0.25), swing(tail, 'y', 3, 0.06));
  wings.forEach((w, i) => A.add('flap', 0.8, swing(w, 'x', 0.8, 0.6 * (i ? 1 : -1), 0, 1, (i ? 1 : -1) * -0.2)));
  A.add('flap', 0.8, swing(tail, 'z', 0.8, 0.08));
  A.add('glow', 1, lampTracks('eyes', 3));
  return done(root, 'phoenix', variant, o, T, A.list());
}

/* --------------------------------- gargoyle --------------------------------- */

const STONE_TRIMS = {
  // gargoyles are stone by default; the element trims bring them "alive"
};
export const GARGOYLE_VARIANTS = {
  crouching: { p: '#7d7a73', b: '#8d8a82', h: '#6a675f', w: '#75726a', eye: '#ffb84a', pattern: 'cracks', rough: 0.95, pose: 'crouch', wings: 1.2, horns: 2, base: '#8a8780' },
  grinning: { p: '#a8957a', b: '#b8a68a', h: '#8a7a62', w: '#9c8a70', eye: '#ffcf6a', pattern: 'cracks', rough: 0.95, pose: 'sit', wings: 1.35, horns: 2, ram: true, base: '#b0a088' },
  'wings-spread': { p: '#4a4a4c', b: '#5a5a5c', h: '#3a3a3c', w: '#505052', eye: '#ff5a3a', pattern: 'cracks', rough: 0.9, pose: 'crouch', wings: 0.3, horns: 4, base: '#5a5a5a' },
  'horned-beast': { p: '#6f6a5c', b: '#7f7a6a', h: '#5a554a', w: '#6a6558', eye: '#9cff6a', pattern: 'cracks', rough: 0.95, pose: 'beast', wings: 1.0, horns: 4, moss: true, base: '#77736a' },
  waterspout: { p: '#8f8c84', b: '#9d9a92', h: '#78756d', w: '#87847c', eye: '#7ad8ff', pattern: 'cracks', rough: 0.95, pose: 'spout', wings: 1.3, horns: 2, base: '#94918a' },
};

export function createGargoyle(options = {}) {
  const { o, variant, T, r } = setup(options, GARGOYLE_VARIANTS, 'gargoyle', STONE_TRIMS);
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const skin = skinMat(T);
  const col = skinColor(T, { freq: 4 });
  const pose = T.pose;
  // plinth / cornice block
  const baseM = new THREE.MeshStandardMaterial({ name: 'plinth', color: T.trim ? '#77736b' : T.base, roughness: 0.95 });
  const ph = pose === 'spout' ? 0.55 : 0.5;
  plinth(rig, 0.95, ph, baseM, {});
  const top = ph;
  // torso (hunched, upright-ish)
  const sitting = pose === 'sit';
  const beast = pose === 'beast';
  const body = group('body', { parent: rig, at: [beast ? -0.15 : -0.08, top + (beast ? 0.36 : 0.3), 0], rot: [0, 0, beast ? 0.15 : sitting ? 1.15 : pose === 'spout' ? 0.5 : 0.85] });
  body.updateMatrix();
  const torso = loft([[-0.2, 0, 0], [0.05, 0.02, 0], [0.3, 0.05, 0], [0.45, 0.1, 0]], (t) => [keys(t, [[0, 0.15], [0.4, 0.17], [0.8, 0.2], [1, 0.14]]), keys(t, [[0, 0.14], [0.5, 0.17], [0.85, 0.18], [1, 0.13]])], skin, { seg: 24, rad: 18, color: col, bump: T.bump, parent: body, name: 'chest', capStart: 0.7 });
  decorate(torso, T, { from: 0.1, to: 0.9, n: 5, h: 0.08, name: 'back', crystalT: [0.6] });
  const neck = group('neck', { parent: body, at: [0.42, 0.1, 0], rot: [0, 0, beast ? 0.2 : sitting ? -1.0 : pose === 'spout' ? -0.45 : -0.75] });
  const hd = reptileHead(neck, T, { at: [0.08, 0.02, 0], len: 0.3, w: 0.26, h: 0.24, mat: skin, color: col, snout: 0.85, jawOpen: pose === 'spout' ? 0.55 : sitting ? 0.15 : 0.3, horns: T.horns, crest: beast ? 0.3 : 0 });
  if (pose === 'spout') {
    // drain pipe through the mouth
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 14, 1, true).rotateZ(Math.PI / 2), M.metal('#5a6a5a', 0.6), { parent: hd.head, at: [0.3, -0.06, 0], name: 'spout' });
  }
  // ears: pointed bat ears
  for (const sg of [1, -1]) {
    const s = hd.skull.userData.surf(0.15, sg * 1.25);
    taper([s.p.clone().addScaledVector(s.n, -0.01).toArray(), s.p.clone().add(new THREE.Vector3(-0.04, 0.05, sg * 0.06)).toArray(), s.p.clone().add(new THREE.Vector3(-0.08, 0.1, sg * 0.1)).toArray()], 0.03, 0.004, skin, { parent: hd.head, name: 'ear', color: col });
  }
  rig.updateMatrixWorld(true);
  // legs (folded) + arms down to the cornice
  const legs = [];
  for (const sg of [1, -1]) {
    const hip = P(body, -0.1, -0.05, 0.12 * sg);
    const foot = new THREE.Vector3(beast ? -0.25 : 0.12, top, 0.2 * sg);
    legs.push(leg(rig, sg > 0 ? 'leg_L' : 'leg_R', { hip, foot, hock: [-0.1, 0.16, 0], bend: [1, 0.6, sg * 0.5], len: hip.distanceTo(foot) * 1.45, r: [0.1, 0.07, 0.04], mat: skin, color: col, footType: 'claw', clawMat: hornMat(T), toes: 3 }));
    const sh = P(body, 0.36, 0.0, 0.15 * sg);
    const hand = sitting ? new THREE.Vector3(0.2, top + 0.22, 0.17 * sg) : new THREE.Vector3(0.38, top, 0.2 * sg);
    const arm = leg(rig, sg > 0 ? 'arm_L' : 'arm_R', { hip: sh, foot: hand, bend: [-1, 0, sg * 0.6], len: sh.distanceTo(hand) * 1.15, r: [0.07, 0.05, 0.035], mat: skin, color: col, footType: 'claw', clawMat: hornMat(T), toes: 4, spread: 0.4 });
    legs.push(arm);
  }
  // wings (folded high or spread)
  const wings = [];
  for (const sg of [1, -1]) {
    const s = torso.userData.surf(0.72, sg * 0.45);
    wings.push(batWing(body, sg > 0 ? 'wing_L' : 'wing_R', T, { root: s.p.toArray(), side: sg, span: 1.05, chord: 0.62, raise: T.wings, sweep: -0.25, boneR: 0.022, rand: r, veins: T.lightning || T.spikes === 'flame' ? glowMat(T.glow, 1.4) : null, mat: T.trim && T.trim !== 'stone' ? undefined : new THREE.MeshStandardMaterial({ name: 'stonewing', color: T.w, roughness: 0.95, side: THREE.DoubleSide }) }));
  }
  // tail curling over the plinth edge
  const tail = group('tail', { parent: body, at: [-0.15, 0, 0] });
  const tp = [[0.05, 0, 0], [-0.2, -0.12, 0.05], [-0.35, -0.3, 0.2], [-0.4, -0.5, 0.35]];
  const tl = loft(tp, (t) => keys(t, [[0, 0.07], [1, 0.02]]), skin, { seg: 18, rad: 10, color: col, parent: tail, name: 'tail_loft', capEnd: 1 });
  const te = tl.userData.surf(1, 0);
  const g = new THREE.ConeGeometry(0.06, 0.14, 4).scale(1, 1, 0.3).translate(0, 0.05, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), te.t));
  mesh(g, hornMat(T), { parent: tail, at: te.c.toArray(), name: 'tail_spade' });
  if (T.hoard) hoard(rig, 0.8, r);
  if (T.scale !== 1) rig.scale.setScalar(T.trim === 'baby' ? 0.6 : T.scale);
  A.add('idle', 4, breathe(torso, 4, 0.02), swing(hd.head, 'y', 4, 0.2), swing(tail, 'y', 4, 0.1));
  wings.forEach((w, i) => A.add('flap', 1.2, swing(w, 'x', 1.2, 0.35 * (i ? 1 : -1))));
  A.add('roar', 2, rotateTrack(hd.jaw, 'z', 2, (t) => -0.4 * Math.sin(Math.PI * t) ** 2));
  A.add('glow', 1, lampTracks('eyes', 3));
  void legs; void spikeRow; void roundedBox; void blob; void zigzag; void darkMat; void skinColor;
  return done(root, 'gargoyle', variant, o, T, A.list());
}
