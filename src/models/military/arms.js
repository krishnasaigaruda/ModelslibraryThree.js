import * as THREE from 'three';
import { group, roundedBox, lathe, extrudeOutline, finalize, normalizeOptions, pickVariant, rng, jitter } from '../../core/utils.js';
import { clip, rotateTrack, wave } from '../../core/animation.js';
import { Merge, armsMats, restOnGround } from './kit.js';

/*
 * Historic / fantasy melee arms as display props (no firearms, nothing that shoots except
 * bows shown on stands). Each weapon is built along +X in the XY plane (blade flats face ±Z),
 * then laid on a wooden display stand whose cradles touch it exactly.
 */

const PI = Math.PI;

/* ------------------------------------------------------------------ */
/* Lofted blades / limbs                                                */
/* ------------------------------------------------------------------ */

const RINGS = {
  diamond: (a, b) => [[-a, 0], [-a * 0.5, b * 0.7], [0, b], [a * 0.5, b * 0.7], [a, 0], [a * 0.5, -b * 0.7], [0, -b], [-a * 0.5, -b * 0.7]],
  fuller: (a, b) => [[-a, 0], [-a * 0.45, b], [0, b * 0.55], [a * 0.45, b], [a, 0], [a * 0.45, -b], [0, -b * 0.55], [-a * 0.45, -b]],
  single: (a, b) => [[-a, 0], [-a * 0.5, b * 0.55], [a * 0.2, b * 0.95], [a, b * 0.8], [a, -b * 0.8], [a * 0.2, -b * 0.95], [-a * 0.5, -b * 0.55], [-a * 0.85, 0]].map((p, i) => (i === 7 ? [-a, -0.0001] : p)),
  ellipse: (a, b) => Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * PI * 2 + PI) * a, Math.sin((i / 8) * PI * 2 + PI) * b]),
  dshape: (a, b) => [[-a, 0], [-a * 0.7, b * 0.7], [0, b], [a * 0.7, b * 0.75], [a, b * 0.4], [a, -b * 0.4], [a * 0.7, -b * 0.75], [0, -b]].map(([y, z]) => [y, z]),
};

/** Loft rings along stations [{ x, y, a (half height in Y), b (half thickness in Z) }]. */
function loftGeo(stations, ring = 'diamond') {
  const R = RINGS[ring];
  const K = 8;
  const pos = [];
  for (const s of stations) for (const [dy, dz] of R(Math.max(s.a, 0.0004), Math.max(s.b, 0.0003))) pos.push(s.x, s.y + dy, dz);
  const idx = [];
  for (let i = 0; i < stations.length - 1; i++) for (let k = 0; k < K; k++) {
    const a = i * K + k;
    const b = i * K + ((k + 1) % K);
    const c = a + K;
    const d = b + K;
    idx.push(a, c, b, b, c, d);
  }
  // caps
  const n = stations.length;
  pos.push(stations[0].x, stations[0].y, 0, stations[n - 1].x, stations[n - 1].y, 0);
  const c0 = n * K;
  const c1 = c0 + 1;
  for (let k = 0; k < K; k++) {
    idx.push(c0, k, (k + 1) % K);
    idx.push(c1, (n - 1) * K + ((k + 1) % K), (n - 1) * K + k);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * Blade stations: len, w0 (half width at base), w1 (half width where the tip starts), tip (fraction),
 * curve (tip rise, m), t (half thickness), notches (rng|null), waves, round (rounded kissaki), clip.
 */
function bladeStations({ x0 = 0, len, w0, w1 = w0, tip = 0.85, curve = 0, t = 0.003, notch = null, waves = 0, round = false, clipTip = false, N = 36, single = false, cut = 1 }) {
  const st = [];
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * cut;
    let a = u < tip ? w0 + (w1 - w0) * (u / tip) : w1 * (round ? Math.sqrt(Math.max(0, 1 - ((u - tip) / (1 - tip)) ** 2)) : clipTip ? Math.max(0, 1 - ((u - tip) / (1 - tip)) ** 0.7) : 1 - (u - tip) / (1 - tip));
    if (u >= 0.999) a = 0.0004;
    if (notch && u > 0.08 && u < tip && notch() < 0.18) a *= 0.86;
    let y = curve * u * u;
    if (waves) y += Math.sin(u * waves * PI) * w0 * 0.55 * (1 - u);
    if (single && u > tip) y += (w1 - a) * (clipTip ? 0.2 : round ? 1 : 0.9); // tip rises to the spine line
    st.push({ x: x0 + u * len, y, a, b: Math.max(0.0004, t * (1 - u * 0.5) * (a / Math.max(w0, w1)) ** 0.25) });
  }
  return st;
}

/* ------------------------------------------------------------------ */
/* Display stand                                                        */
/* ------------------------------------------------------------------ */

/**
 * Wooden stand: plinth + posts topped with felt-lined cradles reaching exactly to the weapon.
 * supports: [{ x, y (bottom of the weapon at x, in weapon space) }]. Returns the lift applied.
 */
function displayStand(root, weapon, mats, supports, { minLift = 0.16, depth = 0.22, name = 'stand' } = {}) {
  weapon.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(weapon);
  const baseH = 0.04;
  const lift = Math.max(minLift, baseH + 0.04 - box.min.y);
  weapon.position.y += lift;
  const sm = new Merge();
  const x0 = box.min.x - 0.03;
  const x1 = box.max.x + 0.03;
  sm.add(roundedBox(x1 - x0, baseH, depth, 0.012, 2), mats.stand, { at: [(x0 + x1) / 2, baseH / 2, 0] });
  for (const s of supports) {
    const top = s.y + lift;
    const h = top - baseH;
    sm.add(roundedBox(0.04, h - 0.015, 0.05, 0.008, 2), mats.stand, { at: [s.x, baseH + (h - 0.015) / 2, 0] });
    // cradle: shallow U whose inner bottom meets the weapon
    sm.add(roundedBox(0.05, 0.016, 0.07, 0.006, 2), mats.felt, { at: [s.x, top - 0.008, 0] });
    for (const z of [-0.03, 0.03]) sm.add(roundedBox(0.05, 0.05, 0.012, 0.004, 2), mats.stand, { at: [s.x, top + 0.01, z + Math.sign(z) * (s.gap ?? 0.006)] });
  }
  sm.flush(root, name);
  return lift;
}

/* ------------------------------------------------------------------ */
/* Swords & daggers                                                     */
/* ------------------------------------------------------------------ */

const SWORDS = {
  longsword: { len: 0.92, w0: 0.026, w1: 0.016, ring: 'fuller', grip: 0.22, guard: 'cross', gw: 0.23, pommel: 'wheel' },
  'arming-sword': { len: 0.76, w0: 0.026, w1: 0.018, ring: 'fuller', grip: 0.11, guard: 'cross', gw: 0.19, pommel: 'nut' },
  claymore: { len: 1.07, w0: 0.028, w1: 0.017, ring: 'diamond', grip: 0.33, guard: 'claymore', gw: 0.44, pommel: 'ball' },
  katana: { len: 0.71, w0: 0.016, w1: 0.013, ring: 'single', single: true, curve: 0.022, round: true, tip: 0.93, grip: 0.27, guard: 'tsuba', gw: 0.04, pommel: 'kashira', wrap: 'ito' },
  sabre: { len: 0.82, w0: 0.017, w1: 0.013, ring: 'single', single: true, curve: 0.055, tip: 0.86, grip: 0.13, guard: 'knuckle', gw: 0.12, pommel: 'cap' },
  gladius: { len: 0.5, w0: 0.028, w1: 0.025, ring: 'diamond', tip: 0.8, grip: 0.09, guard: 'oval', gw: 0.09, pommel: 'bigball', wrap: 'ribbed' },
  rapier: { len: 1.0, w0: 0.013, w1: 0.007, ring: 'diamond', tip: 0.95, t: 0.004, grip: 0.12, guard: 'swept', gw: 0.26, pommel: 'pear' },
  scimitar: { len: 0.78, w0: 0.02, w1: 0.03, ring: 'single', single: true, curve: 0.11, tip: 0.82, clipTip: true, grip: 0.12, guard: 'balls', gw: 0.16, pommel: 'bird' },
  falchion: { len: 0.7, w0: 0.022, w1: 0.033, ring: 'single', single: true, curve: 0.025, tip: 0.84, clipTip: true, grip: 0.12, guard: 'cross', gw: 0.17, pommel: 'disc' },
};
const DAGGERS = {
  dirk: { len: 0.3, w0: 0.016, w1: 0.012, ring: 'diamond', grip: 0.11, guard: 'none', gw: 0.04, pommel: 'cap', wrap: 'ribbed' },
  stiletto: { len: 0.24, w0: 0.008, w1: 0.006, ring: 'diamond', t: 0.006, tip: 0.6, grip: 0.1, guard: 'cross', gw: 0.08, pommel: 'ball' },
  kris: { len: 0.33, w0: 0.019, w1: 0.012, ring: 'diamond', waves: 7, grip: 0.09, guard: 'ganja', gw: 0.07, pommel: 'bird' },
  seax: { len: 0.3, w0: 0.016, w1: 0.019, ring: 'single', single: true, tip: 0.72, clipTip: true, grip: 0.12, guard: 'none', gw: 0.04, pommel: 'cap' },
  tanto: { len: 0.25, w0: 0.013, w1: 0.011, ring: 'single', single: true, curve: 0.004, round: true, tip: 0.9, grip: 0.11, guard: 'tsuba', gw: 0.03, pommel: 'kashira', wrap: 'ito' },
  rondel: { len: 0.3, w0: 0.011, w1: 0.008, ring: 'diamond', t: 0.005, tip: 0.75, grip: 0.11, guard: 'rondel', gw: 0.035, pommel: 'rondel' },
};

function hiltMats(m, trim) {
  const H = {
    guard: m.steel, grip: m.leather, pommel: m.steel, wrapCord: m.cord, accent: m.steel,
  };
  if (trim === 'ornate') Object.assign(H, { guard: m.gold, pommel: m.gold, grip: m.leatherDark, wrapCord: m.gold, accent: m.gold });
  if (trim === 'ceremonial') Object.assign(H, { guard: m.gold, pommel: m.gold, grip: m.leatherRed, wrapCord: m.gold, accent: m.gold });
  if (trim === 'battle-worn') Object.assign(H, { grip: m.leatherDark, guard: m.steel, pommel: m.iron });
  if (trim === 'rusted') Object.assign(H, { guard: m.rust, pommel: m.rust, grip: m.woodDark, wrapCord: m.leatherDark });
  return H;
}

/** Hilt from x=0 backwards (blade along +X). Returns { mg pieces added, gripEnd, gripR }. */
function buildHilt(mg, P, H, m, trim, scale = 1) {
  const gr = (P.grip > 0.2 ? 0.016 : 0.014) * scale;
  const gl = P.grip;
  const sz = scale;
  // guard
  switch (P.guard) {
    case 'cross': {
      const w = P.gw;
      if (trim === 'ornate' || trim === 'ceremonial') {
        mg.pipe([[0, -w / 2 - 0.01, 0], [0.012, -w / 2 + 0.02, 0], [0, -0.02, 0], [0, 0.02, 0], [0.012, w / 2 - 0.02, 0], [0, w / 2 + 0.01, 0]], 0.008 * sz, H.guard, 24, 8);
        for (const s of [1, -1]) mg.add(new THREE.SphereGeometry(0.012 * sz, 12, 8), H.guard, { at: [0, s * (w / 2 + 0.012), 0] });
      } else mg.add(roundedBox(0.016 * sz, w, 0.018 * sz, 0.006, 2), H.guard);
      mg.add(roundedBox(0.03 * sz, 0.05 * sz, 0.024 * sz, 0.008, 2), H.guard);
      break;
    }
    case 'claymore': {
      const w = P.gw;
      for (const s of [1, -1]) {
        mg.pipe([[0, 0, 0], [0.03, s * w * 0.25, 0], [0.09, s * w * 0.5, 0]], 0.011, H.guard, 16, 8);
        for (let k = 0; k < 4; k++) mg.add(new THREE.TorusGeometry(0.014, 0.004, 6, 12), H.guard, { at: [0.09 + Math.cos((k / 4) * PI * 2) * 0.012, s * w * 0.5 + Math.sin((k / 4) * PI * 2) * 0.012, 0] });
      }
      mg.add(roundedBox(0.04, 0.06, 0.03, 0.01, 2), H.guard);
      mg.add(new THREE.TorusGeometry(0.03, 0.005, 6, 16, PI).rotateY(PI / 2), H.guard, { at: [0, 0, 0.015] });
      break;
    }
    case 'tsuba': {
      mg.add(new THREE.CylinderGeometry(P.gw * 2 * sz, P.gw * 2 * sz, 0.006, 32).rotateZ(PI / 2), H.guard, { at: [-0.003, 0, 0] });
      if (trim === 'ornate' || trim === 'ceremonial') for (let k = 0; k < 8; k++) mg.add(new THREE.SphereGeometry(0.004, 6, 4), m.gold, { at: [-0.0, Math.cos((k / 8) * PI * 2) * P.gw * 1.5, Math.sin((k / 8) * PI * 2) * P.gw * 1.5] });
      mg.add(roundedBox(0.03, 0.03, 0.012, 0.004, 2), m.brass, { at: [0.015, 0, 0] }); // habaki
      break;
    }
    case 'knuckle': {
      mg.add(roundedBox(0.012, 0.06, 0.02, 0.005, 2), H.guard);
      mg.pipe([[0, 0.03, 0], [-0.04, 0.06, 0], [-gl * 0.6, 0.065, 0], [-gl - 0.005, 0.03, 0]], 0.005, H.guard, 24, 6);
      if (trim === 'ornate' || trim === 'ceremonial') mg.add(new THREE.SphereGeometry(0.035, 16, 8, 0, PI * 2, 0, PI / 2).rotateZ(PI / 2).scale(0.5, 1, 1), H.guard, { at: [0.002, 0.005, 0] });
      break;
    }
    case 'oval':
      mg.add(new THREE.SphereGeometry(1, 20, 12).scale(0.016, 0.045, 0.032), H.guard);
      break;
    case 'swept': {
      const w = P.gw;
      mg.add(roundedBox(0.012, w, 0.012, 0.005, 2), H.guard);
      for (const s of [1, -1]) mg.add(new THREE.SphereGeometry(0.009, 10, 8), H.guard, { at: [0, s * (w / 2 + 0.007), 0] });
      mg.pipe([[0, -0.02, 0], [0.04, -0.045, 0.02], [0.06, 0, 0.03], [0.04, 0.045, 0.02], [0, 0.02, 0]], 0.004, H.guard, 24, 6);
      mg.pipe([[0, -0.02, 0], [0.04, -0.045, -0.02], [0.06, 0, -0.03], [0.04, 0.045, -0.02], [0, 0.02, 0]], 0.004, H.guard, 24, 6);
      mg.pipe([[0, 0.05, 0], [-0.04, 0.07, 0.01], [-gl * 0.6, 0.06, 0.01], [-gl - 0.005, 0.025, 0]], 0.004, H.guard, 24, 6);
      if (trim !== 'rusted') mg.add(new THREE.SphereGeometry(0.04, 16, 8, 0, PI * 2, 0, PI / 2).rotateZ(-PI / 2).scale(0.4, 1, 1), H.guard, { at: [0.005, 0, 0] });
      break;
    }
    case 'balls': {
      const w = P.gw;
      mg.pipe([[0.0, -w / 2, 0], [-0.01, -w / 4, 0], [0, 0, 0], [-0.01, w / 4, 0], [0, w / 2, 0]], 0.008, H.guard, 16, 8);
      for (const s of [1, -1]) mg.add(new THREE.SphereGeometry(0.014, 12, 8), H.guard, { at: [0, s * (w / 2 + 0.008), 0] });
      break;
    }
    case 'ganja':
      mg.add(extrudeOutline([[0.004, -0.03], [0.004, 0.045], [-0.008, 0.05], [-0.01, 0.0], [-0.008, -0.03]], 0.012, { bevel: 0.002 }), H.guard);
      break;
    case 'rondel':
      mg.add(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 24).rotateZ(PI / 2), H.guard);
      break;
    default:
      mg.add(new THREE.CylinderGeometry(gr * 1.4, gr * 1.2, 0.012, 16).rotateZ(PI / 2), H.guard, { at: [-0.002, 0, 0] });
  }
  // grip
  const gx = -0.004;
  const gripGeo = lathe([[gr * 0.9, 0], [gr, gl * 0.2], [gr * 1.06, gl * 0.5], [gr, gl * 0.8], [gr * 0.9, gl]], 16).rotateZ(PI / 2);
  mg.add(gripGeo, P.wrap === 'ito' ? m.paintWhite : H.grip, { at: [gx, 0, 0] });
  if (P.wrap === 'ito') {
    // diamond wrap: crossing cords over pale same-skin
    const n = Math.round(gl / 0.03);
    for (let i = 0; i < n; i++) for (const s of [1, -1]) mg.add(new THREE.TorusGeometry(gr * 1.04, 0.0035, 4, 14).rotateY(PI / 2).rotateZ(s * 0.5), trim === 'rusted' ? m.leatherDark : trim === 'ceremonial' ? m.silkBlue : m.lacquer, { at: [gx - 0.015 - i * 0.03, 0, 0] });
  } else if (P.wrap === 'ribbed') {
    for (let i = 1; i < 4; i++) mg.add(new THREE.TorusGeometry(gr * 1.05, 0.003, 4, 14).rotateY(PI / 2), H.accent, { at: [gx - i * (gl / 4), 0, 0] });
  } else if (trim !== 'rusted') {
    const n = Math.round(gl / 0.012);
    for (let i = 0; i < n; i++) mg.add(new THREE.TorusGeometry(gr * 1.03, 0.0022, 4, 12).rotateY(PI / 2).rotateZ(0.15), H.wrapCord, { at: [gx - 0.006 - i * 0.012, 0, 0] });
  }
  const pe = gx - gl;
  // pommel
  switch (P.pommel) {
    case 'wheel':
      mg.add(new THREE.CylinderGeometry(0.03, 0.03, 0.022, 24).rotateX(PI / 2), H.pommel, { at: [pe - 0.026, 0, 0] });
      mg.add(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 12).rotateX(PI / 2), trim === 'ornate' || trim === 'ceremonial' ? m.gem : H.pommel, { at: [pe - 0.026, 0, 0] });
      mg.add(new THREE.CylinderGeometry(0.006, gr, 0.01, 12).rotateZ(PI / 2), H.pommel, { at: [pe + 0.0, 0, 0] });
      break;
    case 'nut':
      mg.add(new THREE.SphereGeometry(1, 16, 10).scale(0.018, 0.026, 0.016), H.pommel, { at: [pe - 0.014, 0, 0] });
      break;
    case 'ball':
    case 'bigball':
      mg.add(new THREE.SphereGeometry(P.pommel === 'bigball' ? 0.03 : 0.024, 18, 12), H.pommel, { at: [pe - (P.pommel === 'bigball' ? 0.026 : 0.02), 0, 0] });
      break;
    case 'kashira':
      mg.add(lathe([[gr * 1.1, 0], [gr * 1.12, 0.012], [0.001, 0.016]], 16).rotateZ(PI / 2), H.pommel, { at: [pe + 0.002, 0, 0] });
      break;
    case 'pear':
      mg.add(lathe([[0.001, 0], [0.015, 0.008], [0.02, 0.025], [0.012, 0.045], [0.001, 0.05]], 16).rotateZ(PI / 2), H.pommel, { at: [pe + 0.002, 0, 0] });
      break;
    case 'bird':
      mg.add(roundedBox(0.045, 0.026, 0.022, 0.01, 2), H.pommel, { at: [pe - 0.015, 0.008, 0], rot: [0, 0, -0.5] });
      break;
    case 'disc':
      mg.add(new THREE.CylinderGeometry(0.024, 0.024, 0.014, 20).rotateX(PI / 2), H.pommel, { at: [pe - 0.02, 0, 0] });
      break;
    case 'rondel':
      mg.add(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 22).rotateZ(PI / 2), H.pommel, { at: [pe - 0.004, 0, 0] });
      break;
    default:
      mg.add(new THREE.SphereGeometry(gr * 1.25, 14, 10), H.pommel, { at: [pe - gr * 0.6, 0, 0] });
  }
  if (trim === 'ceremonial') {
    // silk tassel hanging from the pommel
    const tx = pe - 0.03;
    mg.pipe([[tx, 0, 0], [tx - 0.01, -0.04, 0.01], [tx - 0.005, -0.08, 0.0]], 0.003, m.silk, 12, 5);
    mg.add(lathe([[0.001, 0], [0.012, 0.005], [0.009, 0.05], [0.001, 0.055]], 10), m.silk, { at: [tx - 0.005, -0.135, 0] });
    mg.add(new THREE.SphereGeometry(0.009, 10, 8), m.gold, { at: [tx - 0.006, -0.08, 0] });
  }
  return { gripEnd: pe, gr };
}

function bladeWeapon(ctx, P, { dagger = false } = {}) {
  const { m, trim, weapon } = ctx;
  const notch = trim === 'battle-worn' || trim === 'rusted' ? rng(`${ctx.variant}-${trim}`) : null;
  const cut = trim === 'broken' ? 0.58 : 1;
  const st = bladeStations({ ...P, t: P.t ?? (dagger ? 0.0035 : 0.003), notch, cut, N: dagger ? 24 : 36 });
  const bladeMat = trim === 'rusted' ? m.rust : m.steel;
  const mg = new Merge();
  const blade = loftGeo(st, P.ring);
  if (trim === 'rusted') jitter(blade, rng('pit'), 0.004);
  mg.add(blade, bladeMat);
  if (trim === 'ornate' || trim === 'ceremonial') {
    // gilded etching along the first third of the blade
    const et = st.filter((s) => s.x < P.len * 0.3).map((s) => ({ ...s, a: s.a * 0.35, b: s.b * 1.06 }));
    mg.add(loftGeo(et, 'ellipse'), m.gold);
  }
  if (trim === 'battle-worn') {
    // scratches
    const r = rng('scr');
    for (let i = 0; i < 6; i++) mg.add(new THREE.BoxGeometry(0.06, 0.0012, 0.0006), m.dark, { at: [P.len * (0.15 + r() * 0.6), (r() - 0.5) * P.w0, st[0].b * 0.9 * (i % 2 ? 1 : -1)], rot: [0, 0, (r() - 0.5) * 0.6] });
  }
  const H = hiltMats(m, trim);
  const { gripEnd, gr } = buildHilt(mg, P, H, m, trim);
  const supports = [];
  if (trim === 'sheathed') {
    // scabbard: lofted shell over the blade, with locket, chape and belt fittings
    const sc = st.map((s) => ({ ...s, a: s.a * 1.2 + 0.006, b: s.b * 1.4 + 0.006, x: s.x }));
    sc[sc.length - 1].a = 0.006;
    const scMat = P.wrap === 'ito' ? m.lacquer : m.leather;
    mg.add(loftGeo(sc.slice(1), 'ellipse'), scMat);
    const xm = [0.005, P.len * 0.25, P.len * 0.94];
    for (const [i, x] of xm.entries()) {
      const s = sc[Math.min(sc.length - 1, Math.round((x / P.len) * (sc.length - 1)))];
      mg.add(new THREE.SphereGeometry(1, 14, 8).scale(i === 2 ? 0.04 : 0.025, s.a * 1.08 + 0.002, s.b * 1.15 + 0.002), i === 1 ? m.brass : H.accent === m.steel ? m.brass : H.accent, { at: [x, s.y, 0] });
    }
    supports.push({ x: P.len * 0.55, y: sc[Math.round(0.55 * (sc.length - 1))].y - sc[Math.round(0.55 * (sc.length - 1))].a * 1.0 });
  } else {
    const k = Math.round(0.4 * (st.length - 1));
    supports.push({ x: st[k].x, y: st[k].y - st[k].a });
  }
  supports.push({ x: gripEnd * 0.5, y: -gr });
  mg.flush(weapon, 'weapon');
  if (trim === 'broken') {
    // the snapped tip lies on the plinth in front
    const rest = bladeStations({ ...P, t: P.t ?? 0.003, N: 16 }).filter((s) => s.x >= P.len * 0.58);
    const piece = group('broken_tip', { parent: ctx.root });
    const pm = new Merge();
    const g = loftGeo(rest.map((s) => ({ ...s, x: s.x - P.len * 0.58, y: 0 })), P.ring);
    g.rotateX(PI / 2);
    pm.add(g, bladeMat);
    pm.flush(piece, 'tip_piece');
    ctx.loose = { node: piece, len: P.len * 0.42, h: rest[0].b };
  }
  return supports;
}

/* ------------------------------------------------------------------ */
/* Axes, maces, polearms                                                */
/* ------------------------------------------------------------------ */

function haft(mg, m, len, r, mat, { taper = 0.85, wrapAt = null, wrapMat } = {}) {
  const prof = [[r * taper, 0]];
  const n = Math.max(4, Math.ceil(len / 0.04));
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    prof.push([u < 0.1 ? r * (taper + (1 - taper) * (u / 0.1)) : u > 0.95 ? r * (1 - (u - 0.95)) : r, u * len]);
  }
  mg.add(lathe(prof, 14).rotateZ(-PI / 2), mat);
  if (wrapAt) {
    const [a, b] = wrapAt;
    mg.add(new THREE.CylinderGeometry(r * 1.08, r * 1.08, b - a, 14).rotateZ(PI / 2), wrapMat ?? m.leather, { at: [(a + b) / 2, 0, 0] });
    for (let x = a; x < b; x += 0.014) mg.add(new THREE.TorusGeometry(r * 1.1, 0.0025, 4, 12).rotateY(PI / 2).rotateZ(0.2), m.leatherDark, { at: [x, 0, 0] });
  }
}

function headMats(m, trim) {
  return {
    head: trim === 'rusted' ? m.rust : trim === 'bronze' ? m.bronze : trim === 'blackened' ? m.dark : m.steel,
    haft: trim === 'rusted' ? m.woodDark : trim === 'ceremonial' ? m.lacquerRed : trim === 'ornate' ? m.woodDark : trim === 'blackened' ? m.lacquer : m.ash,
    fit: trim === 'ornate' || trim === 'ceremonial' ? m.gold : trim === 'bronze' ? m.bronze : trim === 'rusted' ? m.rust : m.iron,
    wrap: trim === 'ceremonial' ? m.leatherRed : trim === 'blackened' ? m.leatherDark : m.leather,
  };
}

const AXES = {
  'battle-axe': { len: 0.85, r: 0.016, head: 'crescent', H: 0.26 },
  'viking-axe': { len: 0.8, r: 0.015, head: 'bearded', H: 0.2 },
  'dane-axe': { len: 1.45, r: 0.017, head: 'bearded', H: 0.28 },
  labrys: { len: 0.8, r: 0.017, head: 'double', H: 0.24 },
  tomahawk: { len: 0.48, r: 0.013, head: 'hawk', H: 0.15 },
  francisca: { len: 0.5, r: 0.014, head: 'francisca', H: 0.16 },
};
const MACES = {
  'flanged-mace': { len: 0.62, r: 0.014, head: 'flanged' },
  'morning-star': { len: 0.7, r: 0.018, head: 'spiked' },
  'war-hammer': { len: 0.75, r: 0.015, head: 'hammer' },
  maul: { len: 0.95, r: 0.02, head: 'maul' },
  'studded-club': { len: 0.7, r: 0.02, head: 'club' },
  flail: { len: 0.45, r: 0.016, head: 'flail' },
};
const POLEARMS = {
  spear: { len: 2.1, r: 0.016, head: 'leaf' },
  halberd: { len: 1.9, r: 0.018, head: 'halberd' },
  glaive: { len: 1.8, r: 0.018, head: 'glaive' },
  pike: { len: 3.2, r: 0.017, head: 'pike' },
  trident: { len: 1.8, r: 0.017, head: 'trident' },
  naginata: { len: 1.75, r: 0.017, head: 'naginata' },
  partisan: { len: 1.9, r: 0.018, head: 'partisan' },
  bardiche: { len: 1.6, r: 0.02, head: 'bardiche' },
};

function axeHead(mg, hm, kind, x, H, r, trim) {
  const t = 0.012;
  const plate = (pts, at = [x, 0, 0], tt = t) => mg.add(extrudeOutline(pts, tt, { bevel: 0.003, segments: 1 }), hm.head, { at });
  mg.add(roundedBox(0.06, r * 2 + 0.02, r * 2 + 0.012, 0.006, 2), hm.head, { at: [x, 0, 0] }); // eye
  if (kind === 'crescent' || kind === 'double') {
    const blade = (s) => { const p = [[-0.025, s * r], [0.025, s * r], [0.045, s * H * 0.45], [0.1, s * H * 0.82], [0.07, s * H * 0.94], [0.0, s * H], [-0.07, s * H * 0.94], [-0.1, s * H * 0.82], [-0.045, s * H * 0.45]]; return s > 0 ? p : p.reverse(); };
    plate(blade(1));
    if (kind === 'double') plate(blade(-1));
    else plate([[-0.02, -r], [0.02, -r], [0.008, -H * 0.4], [-0.008, -H * 0.4]]); // back spike
  } else if (kind === 'bearded') {
    plate([[-0.025, r], [0.025, r], [0.03, H * 0.35], [0.1, H * 0.98], [0.045, H * 0.96], [-0.01, H * 0.7], [-0.03, H * 0.35]]);
    plate([[-0.02, -r], [0.02, -r], [0.015, -0.03], [-0.015, -0.03]]);
  } else if (kind === 'hawk') {
    plate([[-0.015, r], [0.015, r], [0.02, H * 0.6], [0.04, H], [-0.035, H], [-0.02, H * 0.6]]);
    plate([[-0.012, -r], [0.012, -r], [0.006, -H * 0.5], [-0.006, -H * 0.5]]);
  } else if (kind === 'francisca') {
    plate([[-0.02, r], [0.02, r], [0.06, H * 0.6], [0.09, H], [0.03, H * 0.92], [-0.02, H * 0.5]], [x, 0, 0]);
  }
  if (trim === 'ornate' || trim === 'ceremonial') mg.add(extrudeOutline([[-0.012, r + 0.01], [0.012, r + 0.01], [0.02, H * 0.5], [-0.02, H * 0.5]], t + 0.002, { bevel: 0.001 }), hm.fit, { at: [x, 0, 0] });
  if (trim === 'blackened') for (const s of [1, -1]) mg.add(roundedBox(0.16, 0.012, 0.004, 0.0015, 1), hm.fit, { at: [x - 0.1, 0, s * (r + 0.002)] }); // langets
}

function maceHead(mg, hm, kind, x, r, trim, m) {
  if (kind === 'flanged') {
    mg.add(new THREE.CylinderGeometry(r * 1.3, r * 1.3, 0.12, 14).rotateZ(PI / 2), hm.head, { at: [x, 0, 0] });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * PI * 2;
      const g = extrudeOutline([[-0.06, 0], [0.06, 0], [0.04, 0.045], [-0.02, 0.05]], 0.006, { bevel: 0.002 });
      g.translate(0, r * 1.1, 0).rotateX(a);
      mg.add(g, hm.head, { at: [x, 0, 0] });
    }
    mg.add(new THREE.ConeGeometry(r * 1.2, 0.04, 12).rotateZ(-PI / 2), hm.head, { at: [x + 0.08, 0, 0] });
  } else if (kind === 'spiked') {
    const R = 0.055;
    mg.add(new THREE.SphereGeometry(R, 18, 12), hm.head, { at: [x + R * 0.7, 0, 0] });
    const ico = new THREE.IcosahedronGeometry(1, 1);
    const seen = new Set();
    const p = ico.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i).normalize();
      const k = v.toArray().map((q) => q.toFixed(2)).join();
      if (seen.has(k) || v.x < -0.6) continue;
      seen.add(k);
      const g = new THREE.ConeGeometry(0.008, 0.035, 6).translate(0, R + 0.012, 0);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v));
      mg.add(g, hm.fit === m.gold ? m.gold : hm.head, { at: [x + R * 0.7, 0, 0] });
    }
  } else if (kind === 'hammer' || kind === 'maul') {
    const big = kind === 'maul';
    mg.add(roundedBox(big ? 0.1 : 0.04, big ? 0.22 : 0.06, big ? 0.1 : 0.04, 0.01, 2), hm.head, { at: [x, big ? 0 : 0.03, 0] });
    if (!big) {
      mg.add(new THREE.CylinderGeometry(0.02, 0.022, 0.05, 4).rotateY(PI / 4), hm.head, { at: [x, 0.08, 0] });
      for (let i = -1; i <= 1; i += 2) for (let j = -1; j <= 1; j += 2) mg.add(new THREE.ConeGeometry(0.006, 0.012, 4), hm.head, { at: [x + i * 0.008, 0.11, j * 0.008] });
      mg.add(new THREE.ConeGeometry(0.014, 0.12, 4).rotateZ(PI).scale(1, 1, 0.6), hm.head, { at: [x, -0.06, 0], rot: [0, 0, 0.25] });
      mg.add(new THREE.ConeGeometry(0.01, 0.06, 4).rotateZ(-PI / 2), hm.head, { at: [x + 0.05, 0.03, 0] });
    }
  } else if (kind === 'club') {
    mg.add(lathe([[0.02, 0], [0.035, 0.08], [0.048, 0.18], [0.045, 0.22], [0.001, 0.24]], 16).rotateZ(-PI / 2), trim === 'rusted' ? m.woodDark : m.wood, { at: [x - 0.18, 0, 0] });
    for (let i = 0; i < 18; i++) {
      const a = i * 2.4;
      const u = 0.05 + (i % 6) * 0.025;
      mg.add(new THREE.SphereGeometry(0.007, 8, 6), hm.head, { at: [x - 0.18 + u + 0.04, Math.cos(a) * (0.032 + u * 0.08), Math.sin(a) * (0.032 + u * 0.08)] });
    }
  }
}

/** Haft weapons: shared assembly (axes / maces / polearms). */
function haftWeapon(ctx, P, family) {
  const { m, trim, weapon } = ctx;
  const hm = headMats(m, trim);
  const mg = new Merge();
  const L = P.len;
  const r = P.r;
  const long = family === 'polearm';
  haft(mg, m, L, r, hm.haft, { wrapAt: long ? [L * 0.45, L * 0.55] : [0.03, Math.min(0.2, L * 0.3)], wrapMat: hm.wrap });
  // butt cap / spike
  mg.add(new THREE.SphereGeometry(r * 1.15, 12, 8), hm.fit, { at: [0, 0, 0] });
  if (long) mg.add(new THREE.ConeGeometry(r * 0.9, 0.08, 10).rotateZ(PI / 2), hm.fit, { at: [-0.04, 0, 0] });
  let below = r;
  if (family === 'axe') axeHead(mg, hm, P.head, L - 0.06, P.H, r, trim);
  else if (family === 'mace' && P.head !== 'flail') {
    maceHead(mg, hm, P.head, L - 0.05, r, trim, m);
    if (P.head === 'hammer') below = 0.13;
    if (P.head === 'maul') below = 0.11;
  } else if (family === 'mace') {
    // flail: chain + spiked ball resting on the plinth (handled after stand)
    mg.add(new THREE.CylinderGeometry(r * 1.4, r * 1.4, 0.04, 12).rotateZ(PI / 2), hm.fit, { at: [L, 0, 0] });
    ctx.flail = true;
  } else {
    polearmHead(mg, hm, P.head, L, r, trim, m);
  }
  if (trim === 'blackened' && family !== 'polearm') for (let i = 0; i < 6; i++) mg.add(new THREE.SphereGeometry(0.005, 6, 4), m.iron, { at: [L * 0.35 + i * 0.05, 0, r * 0.95] });
  if (trim === 'ceremonial' && family === 'polearm') {
    // tasselled banner under the head
    const bx = L - 0.05;
    const flag = new THREE.PlaneGeometry(0.45, 0.32, 8, 1);
    const p = flag.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 9) * 0.015);
    flag.computeVertexNormals();
    mg.add(flag, new THREE.MeshStandardMaterial({ color: '#8a1c22', roughness: 0.85, side: THREE.DoubleSide, name: 'banner' }), { at: [bx - 0.23, -r - 0.16, 0] });
    mg.add(new THREE.BoxGeometry(0.45, 0.012, 0.012), m.gold, { at: [bx - 0.23, -r - 0.004, 0] });
    for (let i = 0; i < 6; i++) mg.add(new THREE.CylinderGeometry(0.004, 0.006, 0.05, 6), m.gold, { at: [bx - 0.44 + i * 0.085, -r - 0.345, 0] });
    below = r + 0.37;
  }
  mg.flush(weapon, 'weapon');
  const supports = [{ x: L * 0.22, y: -r }, { x: L * (long ? 0.72 : 0.62), y: -r }];
  return { supports, below };
}

function polearmHead(mg, hm, kind, L, r, trim, m) {
  const socket = (len) => mg.add(lathe([[r * 1.25, 0], [r * 1.1, len * 0.8], [r * 0.7, len]], 12).rotateZ(-PI / 2), hm.head, { at: [L - 0.04, 0, 0] });
  const bladeAt = (P, x0, ring = 'diamond') => mg.add(loftGeo(bladeStations({ ...P, x0 }), ring), hm.head);
  const plate = (pts, at, t = 0.01) => mg.add(extrudeOutline(pts, t, { bevel: 0.003, segments: 1 }), hm.head, { at });
  switch (kind) {
    case 'leaf':
    case 'pike':
      socket(0.12);
      bladeAt({ len: kind === 'pike' ? 0.16 : 0.3, w0: 0.012, w1: kind === 'pike' ? 0.014 : 0.03, tip: 0.55, t: 0.006, N: 20 }, L + 0.06);
      break;
    case 'halberd':
      socket(0.2);
      bladeAt({ len: 0.32, w0: 0.012, w1: 0.012, tip: 0.6, t: 0.006, N: 16 }, L + 0.14);
      plate([[-0.06, r], [0.08, r], [0.12, 0.2], [0.04, 0.22], [-0.04, 0.17], [-0.07, 0.08]], [L + 0.05, 0, 0]);
      plate([[-0.02, -r], [0.02, -r], [-0.03, -0.13], [-0.05, -0.12]], [L + 0.05, 0, 0]);
      for (const s of [1, -1]) mg.add(roundedBox(0.3, 0.012, 0.004, 0.0015, 1), hm.fit, { at: [L - 0.12, 0, s * (r + 0.002)] });
      break;
    case 'glaive':
    case 'naginata':
      socket(kind === 'naginata' ? 0.05 : 0.14);
      if (kind === 'naginata') {
        mg.add(new THREE.CylinderGeometry(0.045, 0.045, 0.008, 24).rotateZ(PI / 2), hm.fit, { at: [L - 0.06, 0, 0] });
        for (let i = 0; i < 8; i++) mg.add(new THREE.TorusGeometry(r * 1.05, 0.003, 4, 12).rotateY(PI / 2), m.gold, { at: [L - 0.1 - i * 0.012, 0, 0] });
      }
      mg.add(loftGeo(bladeStations({ len: kind === 'naginata' ? 0.55 : 0.5, w0: 0.02, w1: 0.03, tip: 0.8, curve: kind === 'naginata' ? 0.07 : 0.04, round: kind === 'naginata', t: 0.004, single: true, N: 24, x0: L + 0.05 }), 'single'), hm.head);
      break;
    case 'trident':
      socket(0.1);
      mg.add(roundedBox(0.03, 0.16, 0.02, 0.008, 2), hm.head, { at: [L + 0.08, 0, 0] });
      for (const y of [-0.07, 0, 0.07]) {
        mg.add(new THREE.CylinderGeometry(0.006, 0.007, y ? 0.22 : 0.27, 8).rotateZ(PI / 2), hm.head, { at: [L + 0.09 + (y ? 0.11 : 0.135), y, 0] });
        mg.add(extrudeOutline([[0, 0.006], [0.05, 0], [0, -0.006], [0.012, 0.016]].slice(0, 3), 0.008, { bevel: 0.002 }), hm.head, { at: [L + 0.09 + (y ? 0.22 : 0.27), y, 0] });
      }
      break;
    case 'partisan':
      socket(0.12);
      bladeAt({ len: 0.38, w0: 0.035, w1: 0.03, tip: 0.5, t: 0.005, N: 18 }, L + 0.06, 'fuller');
      for (const s of [1, -1]) plate([[0, s * 0.03], [0.04, s * 0.035], [-0.02, s * 0.11], [-0.03, s * 0.09]], [L + 0.08, 0, 0], 0.008);
      break;
    case 'bardiche':
      socket(0.05);
      plate([[-0.32, r], [-0.24, r], [-0.1, r + 0.035], [0.06, r + 0.08], [0.08, r + 0.12], [-0.05, r + 0.12], [-0.36, r + 0.045]], [L - 0.02, 0, 0], 0.01);
      for (const x of [-0.3, -0.12]) mg.add(new THREE.TorusGeometry(r * 1.3, 0.004, 4, 12).rotateY(PI / 2), hm.head, { at: [L + x, 0, 0] });
      break;
    default:
  }
  void trim;
}

/* ------------------------------------------------------------------ */
/* Bows + quiver                                                        */
/* ------------------------------------------------------------------ */

const BOWS = {
  longbow: { len: 1.85, brace: 0.17, w: 0.016, t: 0.014, recurve: 0, mat: 'yew' },
  recurve: { len: 1.5, brace: 0.2, w: 0.02, t: 0.01, recurve: 0.07, mat: 'laminate' },
  'horse-bow': { len: 1.22, brace: 0.17, w: 0.017, t: 0.011, recurve: 0.13, mat: 'horn', siyah: true },
  yumi: { len: 2.2, brace: 0.15, w: 0.014, t: 0.012, recurve: 0.04, mat: 'lacquer', asym: 0.36 },
  flatbow: { len: 1.6, brace: 0.16, w: 0.03, t: 0.009, recurve: 0, mat: 'elm' },
};

function bowWeapon(ctx, P) {
  const { m, trim, weapon } = ctx;
  const strung = trim !== 'unstrung';
  const L = P.len;
  const grip = P.asym ? L * (P.asym - 0.5) : 0; // yumi: grip below centre
  const mg = new Merge();
  const N = 40;
  const st = [];
  const flex = strung ? P.brace + 0.05 : 0.04;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = -L / 2 + u * L;
    const d = (x - grip) / (u < (grip + L / 2) / L ? grip + L / 2 : L / 2 - grip); // -1..1 from grip
    const ad = Math.abs(d);
    let y = -flex * ad * ad;
    if (P.recurve) y += P.recurve * Math.max(0, (ad - 0.78) / 0.22) ** 2 * (strung ? 1 : 1.4);
    if (P.siyah && ad > 0.8) y += 0.05 * ((ad - 0.8) / 0.2);
    const a = (ad < 0.12 ? P.t * 1.8 : P.t * (1 - ad * 0.45));
    const b = ad < 0.12 ? P.w * 0.75 : P.w * (1 - ad * 0.55);
    st.push({ x, y: y + flex, a, b });
  }
  const limb = { yew: m.woodLight, laminate: m.wood, horn: m.lacquerRed, lacquer: m.lacquer, elm: m.woodLight }[P.mat];
  const bowMat = trim === 'weathered' ? m.woodDark : trim === 'ceremonial' ? m.lacquerRed : limb;
  mg.add(loftGeo(st, 'dshape'), bowMat);
  // grip wrap
  const gy = st[Math.round(((grip + L / 2) / L) * N)].y;
  mg.add(new THREE.CylinderGeometry(P.t * 2.05, P.t * 2.05, 0.11, 12).rotateZ(PI / 2).scale(1, 1, P.w * 0.8 / (P.t * 2)), trim === 'ceremonial' ? m.silk : trim === 'ornate' ? m.leatherRed : m.leather, { at: [grip, gy, 0] });
  if (trim === 'ornate' || trim === 'ceremonial') for (const s of [-1, 1]) for (let k = 0; k < 3; k++) mg.add(new THREE.TorusGeometry(P.t * 1.4, 0.0018, 4, 12).rotateY(PI / 2), m.gold, { at: [grip + s * (0.12 + k * 0.18), st[Math.round(((grip + s * (0.12 + k * 0.18) + L / 2) / L) * N)].y, 0], scale: [1, 1, P.w / P.t] });
  // nocks + string
  const tipL = st[0];
  const tipR = st[N];
  for (const tp of [tipL, tipR]) mg.add(new THREE.SphereGeometry(P.t * 0.9, 10, 8), m.ray, { at: [tp.x, tp.y, 0] });
  if (strung) {
    const sl = Math.hypot(tipR.x - tipL.x, tipR.y - tipL.y);
    mg.add(new THREE.CylinderGeometry(0.0016, 0.0016, sl, 5).rotateZ(PI / 2), m.cord, { at: [(tipL.x + tipR.x) / 2, (tipL.y + tipR.y) / 2, 0], rot: [0, 0, Math.atan2(tipR.y - tipL.y, tipR.x - tipL.x)] });
  } else {
    // unstrung: the string hangs from one nock in a loose loop over the grip
    mg.pipe([[tipL.x, tipL.y, 0], [-L * 0.3, st[Math.round(N * 0.2)].y - 0.06, 0.012], [grip, gy - 0.05, 0.02], [grip + 0.04, gy + P.t * 2, 0.015]], 0.0016, m.cord, 30, 4);
  }
  mg.flush(weapon, 'weapon');
  // bow rests with its back (+y side lowest after flip) on two cradles
  weapon.rotation.x = PI; // string up, back down
  const k1 = Math.round(N * 0.3);
  const k2 = Math.round(N * 0.7);
  return [{ x: st[k1].x, y: -(st[k1].y + st[k1].a) }, { x: st[k2].x, y: -(st[k2].y + st[k2].a) }];
}

/** Quiver of arrows standing on the plinth, leaning against nothing (flat base). */
function quiver(parent, m, at, trim, name = 'quiver') {
  const g = group(name, { parent, at });
  const mg = new Merge();
  const H = 0.6;
  // hollow leather tube with stitched seam + base cap
  mg.add(lathe([[0.05, 0], [0.055, 0.02], [0.055, H], [0.05, H], [0.05, 0.02], [0.001, 0.02], [0.001, 0]], 20), trim === 'ceremonial' ? m.leatherRed : m.leather);
  mg.add(new THREE.TorusGeometry(0.056, 0.006, 6, 20).rotateX(PI / 2), trim === 'ornate' || trim === 'ceremonial' ? m.gold : m.leatherDark, { at: [0, H, 0] });
  mg.add(new THREE.TorusGeometry(0.056, 0.006, 6, 20).rotateX(PI / 2), m.leatherDark, { at: [0, 0.02, 0] });
  mg.add(roundedBox(0.012, H * 0.8, 0.03, 0.004, 1), m.leatherDark, { at: [0, H * 0.5, -0.058] });
  const r = rng(name);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * PI * 2;
    const rr = i ? 0.03 : 0;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    const len = 0.72 + r() * 0.02;
    mg.add(new THREE.CylinderGeometry(0.004, 0.004, len, 5), m.ash, { at: [x, 0.02 + len / 2, z] });
    const fy = 0.02 + len;
    for (let k = 0; k < 3; k++) {
      const f = extrudeOutline([[0, 0], [0, -0.1], [0.014, -0.085], [0.012, -0.01]], 0.001, { bevel: 0 });
      f.rotateY((k / 3) * PI * 2 + a);
      mg.add(f, k ? m.feather : trim === 'ceremonial' ? m.paintRed : m.featherDark, { at: [x, fy - 0.01, z] });
    }
    mg.add(new THREE.SphereGeometry(0.005, 6, 4), m.paintBlack, { at: [x, fy, z] });
  }
  mg.flush(g, `${name}_body`);
  return g;
}

/* ------------------------------------------------------------------ */
/* Factory                                                              */
/* ------------------------------------------------------------------ */

export const ARMS_TABLES = { sword: SWORDS, dagger: DAGGERS, axe: AXES, mace: MACES, polearm: POLEARMS, bow: BOWS };

function finishOnStand(type, variant, trim, o, build) {
  const finish = trim === 'battle-worn' ? 'battle-worn' : trim === 'ornate' ? 'ornate' : trim === 'ceremonial' ? 'ceremonial' : trim === 'rusted' ? 'rusted' : trim === 'bronze' ? 'bronze' : trim === 'blackened' ? 'blackened' : 'plain';
  const m = armsMats(finish);
  if (trim === 'ceremonial') m.steel = m.silver;
  const root = group(`${type}-${variant}${trim ? `-${trim}` : ''}`);
  const weapon = group('weapon_group', { parent: root });
  const ctx = { m, trim, variant, weapon, root, anims: [] };
  const res = build(ctx);
  const supports = res.supports ?? res;
  weapon.updateMatrixWorld(true);
  const stand = !!o.stand;
  const floor = stand ? 0.04 : 0; // top of the plinth, or the ground
  if (stand) displayStand(root, weapon, m, supports, { minLift: Math.max(0.14, (res.below ?? 0) + 0.06), depth: type === 'bow' ? 0.18 : 0.2 });
  else {
    // no stand: the weapon lies flat on the ground (blade flats / bow plane horizontal)
    const lay = group('lay', { parent: root });
    root.remove(weapon);
    lay.add(weapon);
    weapon.rotation.x = -PI / 2;
    restOnGround(root, lay, { axis: 'z', split: 'x', range: 0.4 });
  }
  weapon.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (ctx.loose) {
    // broken tip lies flat in front of the weapon
    ctx.loose.node.position.set(box.min.x + 0.06, floor + ctx.loose.h, stand ? 0.06 : box.max.z + 0.04);
  }
  if (ctx.flail) {
    // chain from the haft end down to a spiked ball resting on the plinth
    const P = MACES.flail;
    const end = weapon.localToWorld(new THREE.Vector3(P.len + 0.02, 0, 0));
    const fm = new Merge();
    const R = 0.045;
    const ball = new THREE.Vector3(end.x + 0.1, floor + R, end.z);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const p = end.clone().lerp(ball.clone().add(new THREE.Vector3(-R * 0.5, R * 0.8, 0)), (i + 0.5) / n);
      fm.add(new THREE.TorusGeometry(0.011, 0.0035, 6, 10), m.iron, { at: p.toArray(), rot: [i % 2 ? PI / 2 : 0, 0, Math.atan2(ball.y - end.y, ball.x - end.x) + PI / 2] });
    }
    fm.add(new THREE.SphereGeometry(R, 16, 10), trim === 'rusted' ? m.rust : m.steel, { at: ball.toArray() });
    for (let i = 0; i < 12; i++) {
      const v = new THREE.Vector3(Math.cos(i * 2.4) * Math.sin(1 + i * 0.7), Math.cos(1 + i * 0.7), Math.sin(i * 2.4) * Math.sin(1 + i * 0.7)).normalize();
      if (v.y < -0.4) continue;
      const g = new THREE.ConeGeometry(0.007, 0.03, 6).translate(0, R + 0.01, 0);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v));
      fm.add(g, trim === 'rusted' ? m.rust : m.steel, { at: ball.toArray() });
    }
    // plinth extension under the ball
    if (stand) fm.add(roundedBox(0.16, 0.04, 0.2, 0.012, 2), m.stand, { at: [ball.x, 0.02, 0] });
    fm.flush(root, 'flail_head');
    ctx.anims.push(clip('swing', 2, [rotateTrack(weapon, 'x', 2, (t) => wave(t) * 0.02)]));
  }
  if (res.quiver) quiver(root, m, [box.max.x + 0.08, 0, 0], trim);
  // gentle display turntable feel: slight tilt rock of the weapon on its cradles
  if (!ctx.anims.length) ctx.anims.push(clip('inspect', 4, [rotateTrack(weapon, 'x', 4, (t) => wave(t) * 0.015)]));
  return finalize(root, { type, variant, options: o, animations: ctx.anims });
}

function makeArms(type) {
  const table = ARMS_TABLES[type];
  return (options = {}) => {
    const o = normalizeOptions(options);
    const variant = pickVariant(table, o.variant, type);
    const trim = o.trim ?? null;
    const P = table[variant];
    return finishOnStand(type, variant, trim, o, (ctx) => {
      if (type === 'sword') return bladeWeapon(ctx, P);
      if (type === 'dagger') return bladeWeapon(ctx, P, { dagger: true });
      if (type === 'bow') {
        const s = bowWeapon(ctx, P);
        return { supports: s, quiver: trim === 'with-quiver' };
      }
      return haftWeapon(ctx, P, type === 'polearm' ? 'polearm' : type);
    });
  };
}

export const createSword = makeArms('sword');
export const createDagger = makeArms('dagger');
export const createAxe = makeArms('axe');
export const createMace = makeArms('mace');
export const createPolearm = makeArms('polearm');
export const createBow = makeArms('bow');

/** Build a bare weapon (no stand) into group `g`, along +X. Used by weapon racks. */
export function buildArmsInto(g, type, variant, trim = null) {
  const finish = trim === 'battle-worn' ? 'battle-worn' : trim === 'ornate' ? 'ornate' : 'plain';
  const m = armsMats(finish);
  const P = ARMS_TABLES[type][variant];
  const ctx = { m, trim, variant, weapon: g, root: g, anims: [] };
  if (type === 'sword' || type === 'dagger') bladeWeapon(ctx, P, { dagger: type === 'dagger' });
  else if (type === 'bow') bowWeapon(ctx, P);
  else haftWeapon(ctx, P, type === 'polearm' ? 'polearm' : type);
  return g;
}
