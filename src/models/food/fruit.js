/*
 * Fruit: lathe-bodied fruit with vertex-colour skins (blush, streaks, spots) and real
 * cut faces, plus swept bananas, packed grape clusters, berries and crowned pineapples.
 * Trims: ripeness, varieties and states (bitten, halved, sliced, wedges, pile, in a bowl…).
 */
import {
  THREE, PI, TAU, mesh, group, curveTube, roundedBox, lathe, sweep, scatter, leafGeo, ballGeo, seedGeo, cached,
  waxy, velvet, flesh, glaze, leafy, phys, plasticMat, woodMat, ceramic, bowl, board, plate, vcolor, fbm, toColor, make, vessel, fillGeo,
  rotateTrack, spinTrack, clip, extrudeOutline, fitUV, canvasTex,
} from './common.js';
import { produce, surfacePoints, cutTexture } from './cut.js';

const C = (h) => toColor(h);
const tmp = new THREE.Color();
/** Skin painter from [base, alt, amount] with blush toward the top (k>0) and optional spots. */
function skinPaint({ base, alt, amt = 0.5, top, topAmt = 0, bottom, spots, spotAmt = 0, streak = 0 }) {
  const b = C(base), a = C(alt ?? base), tp = top ? C(top) : null, bt = bottom ? C(bottom) : null, sp = spots ? C(spots) : null;
  return (c, x, y, z, t, n) => {
    c.copy(b);
    let k = (n - 0.35) * amt * 2;
    if (streak) k += Math.sin(Math.atan2(x, z) * 22 + n * 6) * streak;
    c.lerp(a, Math.min(1, Math.max(0, k)));
    if (tp) c.lerp(tp, Math.min(1, Math.max(0, (t - 0.55) * 2.2)) * topAmt);
    if (bt) c.lerp(bt, Math.min(1, Math.max(0, (0.3 - t) * 3)) * 0.8);
    if (sp) { const s = fbm(x * 260, y * 260, z * 260, 2); if (s > 1 - spotAmt) c.lerp(sp, Math.min(1, (s - (1 - spotAmt)) * 8)); }
    c.multiplyScalar(0.92 + n * 0.16);
  };
}

/* --------------------------------------------------------- specs */
const CUTS = {
  apple: { kind: 'apple', flesh: '#f6ecc8', flesh2: '#e8d9a0', seed: '#4a2a14', rind: '#f1e6bf', rindW: 0.02 },
  pear: { kind: 'pear', flesh: '#f4efd2', flesh2: '#e6dcae', seed: '#3d2412', rind: '#efe7c6', rindW: 0.02 },
  peach: { kind: 'stone', flesh: '#f7b552', flesh2: '#e0663a', seed: '#7a3b22', rind: '#f6a64c', rindW: 0.02 },
  plum: { kind: 'stone', flesh: '#e6c04a', flesh2: '#b8402e', seed: '#8a5a2c', rind: '#9a2c3a', rindW: 0.03 },
  apricot: { kind: 'stone', flesh: '#f6a83a', flesh2: '#e88a2a', seed: '#8a5a2c', rind: '#f6a03a', rindW: 0.02 },
  orange: { kind: 'citrus', flesh: '#f7931e', flesh2: '#ffc56b', seed: '#fff', rind: '#fbf0d8', rind2: '#f28a12', rindW: 0.06 },
  lemon: { kind: 'citrus', flesh: '#f6e25a', flesh2: '#fff6b0', seed: '#fff', rind: '#fdf8dc', rind2: '#f2d420', rindW: 0.06 },
  lime: { kind: 'citrus', flesh: '#a9cf4a', flesh2: '#dff0a0', seed: '#fff', rind: '#eef6d0', rind2: '#4c8e22', rindW: 0.05 },
  grapefruit: { kind: 'citrus', flesh: '#f2685a', flesh2: '#ffb3a0', seed: '#fff', rind: '#fcefd8', rind2: '#f0b84a', rindW: 0.07 },
  bloodorange: { kind: 'citrus', flesh: '#b8202a', flesh2: '#f06a3a', seed: '#fff', rind: '#fbe8d0', rind2: '#e0601a', rindW: 0.06 },
  kiwi: { kind: 'kiwi', flesh: '#79b83a', flesh2: '#f2f0c8', seed: '#1d140c', rind: '#9bc755', rindW: 0.02 },
  goldkiwi: { kind: 'kiwi', flesh: '#e9cf3a', flesh2: '#fbf3c0', seed: '#1d140c', rind: '#e6c840', rindW: 0.02 },
  mango: { kind: 'mango', flesh: '#ffae1a', flesh2: '#f7d887', seed: '#fff', rind: '#ffb43a', rindW: 0.02 },
  avocado: { kind: 'avocado', flesh: '#f0e68a', flesh2: '#b9d266', seed: '#6b4426', rind: '#6d9a34', rindW: 0.03 },
  melon: { kind: 'melon', flesh: '#f5a04a', flesh2: '#f9cf86', seed: '#f3e6b8', rind: '#cfe2a0', rind2: '#9aa86a', rindW: 0.06 },
  honeydew: { kind: 'melon', flesh: '#c8e39a', flesh2: '#eef6c8', seed: '#f3e6b8', rind: '#e6f0c0', rind2: '#cfdc96', rindW: 0.05 },
  watermelon: { kind: 'watermelon', flesh: '#ef3b4a', flesh2: '#ff7a80', seed: '#1a1410', rind: '#f2f5d8', rind2: '#9cc46a', rindW: 0.07 },
  yellowmelon: { kind: 'watermelon', flesh: '#ffd23a', flesh2: '#ffe680', seed: '#1a1410', rind: '#f2f5d8', rind2: '#9cc46a', rindW: 0.07 },
  pomegranate: { kind: 'pomegranate', flesh: '#c8102e', flesh2: '#f3dcc0', seed: '#e8344a', rind: '#f0d8b8', rind2: '#a3242a', rindW: 0.04 },
  pineapple: { kind: 'pineapple', flesh: '#ffd94a', flesh2: '#fff0a0', seed: '#fff', rind: '#ffe680', rind2: '#c88a2a', rindW: 0.05 },
  strawberry: { kind: 'strawberry', flesh: '#e83040', flesh2: '#ffd0d0', seed: '#fff', rind: '#e02a3a', rindW: 0.04 },
  coconut: { kind: 'none', flesh: '#fbfaf4', flesh2: '#fff', seed: '#fff', rind: '#fbfaf4', rindW: 0.02 },
};
const SPECS = {
  apple: { ctrl: [[0, 0.009], [0.012, 0.003], [0.028, 0.004], [0.038, 0.016], [0.041, 0.036], [0.038, 0.056], [0.028, 0.069], [0.012, 0.073], [0.003, 0.066], [0, 0.064]], mat: (o) => waxy('#fff', o), cut: CUTS.apple, stem: 'stem', leaf: true },
  pear: { ctrl: [[0, 0.006], [0.016, 0.001], [0.031, 0.01], [0.037, 0.028], [0.033, 0.05], [0.022, 0.068], [0.017, 0.085], [0.014, 0.098], [0.007, 0.105], [0, 0.104]], mat: (o) => waxy('#fff', { rough: 0.5, cc: 0.3, ...o }), cut: CUTS.pear, stem: 'stem' },
  orange: { ctrl: [[0, 0.002], [0.02, 0.004], [0.033, 0.014], [0.038, 0.036], [0.034, 0.057], [0.02, 0.068], [0.004, 0.071], [0, 0.07]], mat: (o) => waxy('#fff', { rough: 0.55, cc: 0.4, ...o }), cut: CUTS.orange, stem: 'nub', ns: 220 },
  lemon: { ctrl: [[0, 0], [0.004, 0.004], [0.013, 0.011], [0.026, 0.024], [0.03, 0.04], [0.026, 0.057], [0.013, 0.069], [0.004, 0.076], [0, 0.08]], mat: (o) => waxy('#fff', { rough: 0.5, cc: 0.4, ...o }), cut: CUTS.lemon, lie: true, ns: 220 },
  lime: { ctrl: [[0, 0], [0.006, 0.004], [0.02, 0.01], [0.027, 0.026], [0.026, 0.042], [0.018, 0.053], [0.005, 0.059], [0, 0.06]], mat: (o) => waxy('#fff', { rough: 0.45, cc: 0.5, ...o }), cut: CUTS.lime, lie: true, ns: 220 },
  grapefruit: { ctrl: [[0, 0.003], [0.03, 0.006], [0.05, 0.022], [0.056, 0.05], [0.05, 0.08], [0.03, 0.096], [0.005, 0.1], [0, 0.099]], mat: (o) => waxy('#fff', { rough: 0.55, cc: 0.35, ...o }), cut: CUTS.grapefruit, stem: 'nub', ns: 180 },
  peach: { ctrl: [[0, 0.004], [0.015, 0.002], [0.03, 0.01], [0.037, 0.03], [0.035, 0.052], [0.024, 0.066], [0.008, 0.072], [0.002, 0.07], [0, 0.068]], mat: (o) => velvet('#fff', o), cut: CUTS.peach, crease: true, stem: 'nub', leaf: true },
  plum: { ctrl: [[0, 0.003], [0.012, 0.002], [0.024, 0.01], [0.028, 0.028], [0.026, 0.045], [0.016, 0.056], [0.003, 0.059], [0, 0.058]], mat: (o) => velvet('#fff', { rough: 0.45, sheen: 0.8, sheenColor: '#c9b8e0', ...o }), cut: CUTS.plum, crease: true, stem: 'stem' },
  apricot: { ctrl: [[0, 0.003], [0.012, 0.002], [0.022, 0.009], [0.026, 0.024], [0.024, 0.039], [0.015, 0.048], [0.004, 0.051], [0, 0.05]], mat: (o) => velvet('#fff', o), cut: CUTS.apricot, crease: true, stem: 'nub' },
  mango: { ctrl: [[0, 0], [0.01, 0.004], [0.032, 0.022], [0.042, 0.055], [0.04, 0.09], [0.028, 0.115], [0.01, 0.127], [0, 0.128]], mat: (o) => waxy('#fff', { rough: 0.4, ...o }), cut: CUTS.mango, lie: true, flat: 0.78, bend: 0.012 },
  kiwi: { ctrl: [[0, 0], [0.01, 0.003], [0.022, 0.012], [0.026, 0.035], [0.024, 0.056], [0.013, 0.067], [0.004, 0.07], [0, 0.07]], mat: (o) => velvet('#fff', { rough: 0.95, ...o }), cut: CUTS.kiwi, lie: true, flat: 0.88, ns: 400 },
  avocado: { ctrl: [[0, 0.004], [0.018, 0.002], [0.034, 0.016], [0.037, 0.035], [0.03, 0.06], [0.021, 0.08], [0.013, 0.095], [0.004, 0.102], [0, 0.102]], mat: (o) => waxy('#fff', { rough: 0.7, cc: 0.15, ...o }), cut: CUTS.avocado, bumpy: 0.0012, stem: 'nub' },
  pomegranate: { ctrl: [[0, 0.003], [0.03, 0.006], [0.046, 0.026], [0.048, 0.05], [0.04, 0.074], [0.022, 0.086], [0.011, 0.09], [0, 0.09]], mat: (o) => waxy('#fff', { rough: 0.45, ...o }), cut: CUTS.pomegranate, crown: true },
  melon: { ctrl: [[0, 0.003], [0.05, 0.008], [0.08, 0.035], [0.088, 0.075], [0.08, 0.115], [0.05, 0.142], [0.006, 0.15], [0, 0.149]], mat: (o) => phys('#fff', { rough: 0.85, ...o, name: 'skin' }), cut: CUTS.melon, stem: 'nub', ns: 90 },
  watermelon: { ctrl: [[0, 0], [0.04, 0.01], [0.09, 0.05], [0.115, 0.12], [0.118, 0.17], [0.11, 0.24], [0.08, 0.29], [0.035, 0.318], [0, 0.32]], mat: (o) => waxy('#fff', { rough: 0.45, cc: 0.4, ...o }), cut: CUTS.watermelon, lie: true, seg: 56, ns: 14 },
  coconut: { ctrl: [[0, 0.004], [0.03, 0.006], [0.05, 0.03], [0.054, 0.058], [0.046, 0.088], [0.026, 0.108], [0.006, 0.114], [0, 0.113]], mat: (o) => velvet('#fff', { rough: 1, sheen: 0.6, ...o }), cut: CUTS.coconut, ns: 30 },
};

/* ripeness / variety colours: fruit → state → painter */
const COL = {
  apple: {
    ripe: { base: '#b8141c', alt: '#e9b23a', amt: 0.35, streak: 0.06, top: '#7a0d12', topAmt: 0.3 },
    green: { base: '#8fc23a', alt: '#d6dc6a', amt: 0.4, streak: 0.05 },
    golden: { base: '#e8c64a', alt: '#d77a2a', amt: 0.25, top: '#c9a632', topAmt: 0.3 },
    unripe: { base: '#9cc03c', alt: '#c8463a', amt: 0.3 },
  },
  pear: { ripe: { base: '#c9c43c', alt: '#a8752c', amt: 0.4, spots: '#7a5a2a', spotAmt: 0.12 }, red: { base: '#9a2a1e', alt: '#c87a2a', amt: 0.4 }, overripe: { base: '#c9a73c', alt: '#7a4a1e', amt: 0.6, spots: '#4a2e12', spotAmt: 0.25 }, unripe: { base: '#8cb43a', alt: '#a8c04a', amt: 0.3 } },
  orange: { ripe: { base: '#f28a12', alt: '#e8730a', amt: 0.4 }, unripe: { base: '#9ab43a', alt: '#e8a020', amt: 0.6 } },
  lemon: { ripe: { base: '#f5d728', alt: '#e8c418', amt: 0.3 }, unripe: { base: '#b6cf3a', alt: '#e6d42a', amt: 0.5 } },
  lime: { ripe: { base: '#4c9a24', alt: '#7ab83a', amt: 0.35 }, unripe: { base: '#2f7a1a', alt: '#4c9a24', amt: 0.3 } },
  grapefruit: { ripe: { base: '#f2be4a', alt: '#ef8a5a', amt: 0.45 }, pink: { base: '#f0a07a', alt: '#e06a5a', amt: 0.4 } },
  peach: { ripe: { base: '#f7b552', alt: '#d43a2a', amt: 0.7, top: '#c2282a', topAmt: 0.4 }, unripe: { base: '#d6cf6a', alt: '#e88a4a', amt: 0.3 } },
  plum: { ripe: { base: '#4a1a3a', alt: '#6a2a5a', amt: 0.4 }, yellow: { base: '#e8c83a', alt: '#d89a3a', amt: 0.4 } },
  apricot: { ripe: { base: '#f6a03a', alt: '#e0602a', amt: 0.4 } },
  mango: { ripe: { base: '#f6b62a', alt: '#d83a2a', amt: 0.4, top: '#5a9a2a', topAmt: 0.3 }, unripe: { base: '#4c9a2a', alt: '#8cb43a', amt: 0.3 } },
  kiwi: { ripe: { base: '#8a6a3c', alt: '#6a4e2a', amt: 0.4 }, golden: { base: '#a8823c', alt: '#8a6a2c', amt: 0.3 } },
  avocado: { ripe: { base: '#2a2a1a', alt: '#3a3a1e', amt: 0.4 }, unripe: { base: '#4c7a22', alt: '#6a9a2a', amt: 0.4 }, overripe: { base: '#1a1410', alt: '#2a1e14', amt: 0.4, spots: '#0a0806', spotAmt: 0.2 } },
  pomegranate: { ripe: { base: '#a3141e', alt: '#d8603a', amt: 0.35 } },
  melon: { ripe: { base: '#b8a35a', alt: '#e6dcb0', amt: 0.6 }, honeydew: { base: '#dfe6b0', alt: '#f0f2d0', amt: 0.3 } },
  watermelon: { ripe: { base: '#2f6a1e', alt: '#8cb84a', amt: 0.2 } },
  coconut: { ripe: { base: '#6a4428', alt: '#3a2414', amt: 0.6, streak: 0.25 }, young: { base: '#7ab83a', alt: '#a8c84a', amt: 0.3 } },
};
const cache = new Map();
function body(name, state = 'ripe') {
  const k = `${name}:${state}`;
  if (cache.has(k)) return cache.get(k);
  const s = SPECS[name];
  const colSet = COL[name][state] ?? COL[name].ripe;
  let skin = skinPaint(colSet);
  if (name === 'watermelon') {
    const d = C('#1f4a14'), l = C(state === 'mini' ? '#7aa84a' : '#8cbc4a');
    skin = (c, x, y, z, t, n) => { const a = Math.atan2(x, z); const st = Math.sin(a * 9 + n * 5 + Math.sin(t * 10) * 0.8); c.copy(st > -0.1 ? d : l).multiplyScalar(0.9 + n * 0.2); };
  }
  if (name === 'melon' && state === 'ripe') {
    const net = C('#e6dcb8'), base = C('#9a8a4a');
    skin = (c, x, y, z) => { const v = Math.abs(fbm(x * 90, y * 90, z * 90, 2) - 0.5); c.copy(base).lerp(net, v < 0.06 ? 1 : 0.15); };
  }
  let cut = s.cut;
  if (name === 'apple' && state === 'golden') cut = { ...cut, flesh: '#f8f0d0' };
  if (name === 'grapefruit' && state === 'pink') cut = CUTS.grapefruit;
  if (name === 'kiwi' && state === 'golden') cut = CUTS.goldkiwi;
  if (name === 'melon' && state === 'honeydew') cut = CUTS.honeydew;
  if (name === 'avocado' && state === 'unripe') cut = { ...cut, flesh: '#d8e48a', flesh2: '#a8c85a' };
  const flat = s.flat ?? 1, bend = s.bend ?? 0, bumpy = s.bumpy ?? 0, crease = s.crease;
  const displace = (flat !== 1 || bend || bumpy || crease || name === 'coconut') ? (v, t, a) => {
    v.z *= flat;
    if (bend) v.z += Math.sin(t * PI) * bend;
    if (bumpy) { const n = fbm(v.x * 300, v.y * 300, v.z * 300, 2) - 0.5; const r = Math.hypot(v.x, v.z) || 1; v.x += (v.x / r) * n * bumpy * 2; v.z += (v.z / r) * n * bumpy * 2; }
    if (crease) { const d = Math.abs(Math.atan2(Math.sin(a - PI / 2), Math.cos(a - PI / 2))); const k = Math.exp(-((d / 0.12) ** 2)) * 0.0025; const r = Math.hypot(v.x, v.z) || 1; v.x -= (v.x / r) * k; v.z -= (v.z / r) * k; }
    if (name === 'coconut') { const n = fbm(v.x * 160, v.y * 40, v.z * 160, 2) - 0.5; const r = Math.hypot(v.x, v.z) || 1; v.x += (v.x / r) * n * 0.003; v.z += (v.z / r) * n * 0.003; }
  } : null;
  const p = produce({ ...s, key: `${name}-${state}`, skin, cut, displace });
  p.spec = s;
  p.name = name;
  cache.set(k, p);
  return p;
}

/* --------------------------------------------------------- details */
const stemMat = () => phys('#5a3a1e', { rough: 0.8, name: 'stem' });
const leafMat = () => leafy('#4c8a2a');
function topDetails(parent, p, { leaf = p.spec.leaf } = {}) {
  const s = p.spec;
  const top = p.pts[p.pts.length - 1][1];
  // depth of the top dimple: find min y among last points
  const yTop = Math.min(...p.pts.slice(-4).map((q) => q[1]));
  if (s.stem === 'stem') {
    curveTube([[0, yTop - 0.004, 0], [0.001, top + 0.006, 0], [0.004, top + 0.016, 0.001]], 0.0018, stemMat(), { parent, segments: 8, radialSegments: 6, name: 'stem' });
    if (leaf) mesh(leafGeo(0.045, 0.02, { cup: 0.2, curl: 0.25 }), leafMat(), { parent, at: [0.002, top + 0.01, 0], rot: [0.2, 0.6, 0.35], name: 'leaf' });
  } else if (s.stem === 'nub') {
    mesh(new THREE.CylinderGeometry(0.0025, 0.003, 0.006, 8), stemMat(), { parent, at: [0, yTop + 0.002, 0], name: 'stem' });
    if (leaf) mesh(leafGeo(0.05, 0.022, { cup: 0.2, curl: 0.2 }), leafMat(), { parent, at: [0.002, yTop + 0.004, 0], rot: [0.1, 0.4, 0.25], name: 'leaf' });
  }
  if (s.crown) {
    const g = lathe([[0.006, 0], [0.011, 0], [0.012, 0.012], [0.016, 0.02], [0.012, 0.018], [0.009, 0.022], [0.007, 0.006], [0, 0.006]], 12);
    mesh(g, waxy('#8a1a1e', { rough: 0.6 }), { parent, at: [0, top - 0.004, 0], name: 'crown' });
  }
  if (p.name === 'coconut') {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; mesh(ballGeo(0.0045), phys('#24160c', { rough: 0.9 }), { parent, at: [Math.cos(a) * 0.009, top - 0.0015, Math.sin(a) * 0.009], scale: [1, 0.5, 1], name: 'eye' }); }
  }
}
/** Place a whole fruit (standing or lying) as a group at `at`. */
function wholeFruit(parent, p, { at = [0, 0, 0], rotY = 0, bites, name = 'fruit', tilt = 0, details = true } = {}) {
  const holder = group(name, { parent, at, rot: [0, rotY, 0] });
  const g = group(`${name}_body`, { parent: holder });
  p.whole(g, { bites, name: `${name}_skin` });
  if (details) topDetails(g, p);
  if (p.spec.lie) { g.rotation.z = PI / 2; g.position.set((p.H + p.Y0) / 2, p.R * (p.spec.flat ?? 1) > 0 ? p.R : p.R, 0); }
  else { g.position.y = -p.Y0; if (tilt) { g.rotation.x = tilt; g.position.y += Math.sin(Math.abs(tilt)) * p.R * 0.6; } }
  return holder;
}
function footprint(p) { return p.spec.lie ? [(p.H - p.Y0) / 2, p.R] : [p.R, p.R]; }

/* states shared by lathe fruit */
function buildLathe(ctx, name, state) {
  const { root, trim, rand } = ctx;
  const p = body(name, state);
  const R = p.R;
  const cross = ['orange', 'lemon', 'lime', 'grapefruit', 'kiwi', 'melon', 'watermelon', 'pomegranate'].includes(name);
  switch (trim) {
    case 'bitten': {
      const top = p.H;
      const bites = [];
      for (let i = 0; i < 6; i++) { const a = -0.5 + i * 0.2; bites.push({ at: [R * 1.05, top * (0.35 + a * 0.4), Math.sin(a) * R * 0.25], r: R * (0.42 + rand() * 0.06) }); }
      wholeFruit(root, p, { bites });
      break;
    }
    case 'core': {
      // eaten apple core: pinched waist
      const g = group('core', { parent: root });
      const geo = new THREE.LatheGeometry(p.pts.map(([r, y]) => { const t = (y - p.Y0) / (p.H - p.Y0); const w = 0.28 + 0.72 * Math.pow(Math.abs(t - 0.5) * 2, 3); return new THREE.Vector2(Math.max(1e-4, r * w), y); }), 32);
      vcolor(geo, (x, y, z, c) => { const t = (y - p.Y0) / (p.H - p.Y0); c.set(Math.abs(t - 0.5) > 0.36 ? '#a8141c' : '#efdcae').multiplyScalar(0.9 + fbm(x * 200, y * 200, z * 200) * 0.2); if (Math.abs(t - 0.5) < 0.36 && Math.abs(t - 0.5) > 0.3) c.set('#d8b070'); });
      mesh(geo, phys('#fff', { vc: true, rough: 0.5, cc: 0.3 }), { parent: g, name: 'core_body' });
      topDetails(g, p, { leaf: false });
      g.rotation.z = PI / 2; g.position.set((p.H + p.Y0) / 2, R * 0.95, 0);
      break;
    }
    case 'caramel': {
      const g = group('candy', { parent: root });
      const geo = new THREE.LatheGeometry(p.pts.map(([r, y]) => new THREE.Vector2(Math.max(1e-4, r + 0.0015), y)), 40);
      mesh(geo, glaze('#a8461a', { cc: 1, rough: 0.12 }), { parent: g, name: 'caramel' });
      mesh(lathe([[0, 0], [0.05, 0], [0.052, 0.004], [0.044, 0.006], [0, 0.006]], 40), glaze('#9a3e14'), { parent: g, at: [0, p.Y0 - 0.006, 0], name: 'pool' });
      const nuts = surfacePoints(p.pts, 70, rand, { tMin: 0.05, tMax: 0.45, lift: 0.0015 });
      scatter(g, cached('nut', () => new THREE.DodecahedronGeometry(0.0022, 0)), phys('#d8a868', { rough: 0.7 }), nuts.map((q) => ({ at: q.at, rot: [q.a, q.a * 2, 0] })), 'nuts');
      mesh(roundedBox(0.008, 0.11, 0.008, 0.003), woodMat('#e8d0a0'), { parent: g, at: [0, p.H + 0.04, 0], name: 'stick' });
      g.position.y = 0.006 - p.Y0;
      break;
    }
    case 'halved': case 'pink': case 'honeydew-halved': {
      if (cross) {
        const yc = (p.H + p.Y0) / 2;
        {
          p.halfCross(root, { yc, at: [-R * 1.08, 0, 0], name: 'halfA' });
          p.halfCross(root, { yc, at: [R * 1.08, 0, 0.01], name: 'halfB' });
        }
      } else {
        p.halfUp(root, { at: [0, 0, -R * 1.05], name: 'halfA' });
        p.halfUp(root, { at: [0, 0, R * 1.05], rotY: PI, name: 'halfB' });
        if (name === 'avocado') mesh(ballGeo(R * 0.47, 20, 14), phys('#7a4a2a', { rough: 0.4, cc: 0.4 }), { parent: root, at: [-(p.H + p.Y0) / 2 + p.coreY - p.Y0 + 0.012, R, -R * 1.05], scale: [1.05, 0.55, 1], name: 'pit' });
      }
      break;
    }
    case 'sliced': case 'wedges': case 'hedgehog': {
      const top = board(root, { w: 0.3, d: 0.2 });
      const sub = group('on_board', { parent: root, at: [0, top, 0] });
      if (trim === 'sliced' && cross && name !== 'melon' && name !== 'watermelon') {
        const n = 6;
        for (let i = 0; i < n; i++) {
          const y = p.Y0 + ((p.H - p.Y0) * (i + 1.5)) / (n + 2);
          p.round(sub, { y, th: Math.max(0.005, R * 0.15), at: [-0.1 + i * R * 1.15 * 0.6 + R, 0, (i % 2) * 0.03 - 0.015], name: `slice_${i}` });
        }
        const h = p.halfCross(sub, { yc: p.Y0 + (p.H - p.Y0) * 0.3, at: [0.09, 0, -0.05], name: 'end' });
        void h;
      } else if (trim === 'hedgehog') {
        const h = p.halfUp(sub, { at: [0, 0, 0], name: 'cheek' });
        const cubes = [];
        for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) { const x = i * 0.013, z = j * 0.013; const e = (x / (p.H * 0.48)) ** 2 + (z / (R * 0.82)) ** 2; if (e < 1) cubes.push({ at: [x, R + 0.006 + (1 - e) * 0.006, z], rot: [i * 0.08, 0, j * 0.1] }); }
        scatter(sub, cached('mcube', () => roundedBox(0.011, 0.012, 0.011, 0.002, 1)), flesh('#ffae1a'), cubes, 'cubes');
        void h;
      } else {
        const n = name === 'watermelon' || name === 'melon' ? 4 : 6;
        const ang = name === 'watermelon' ? PI / 6 : TAU / 8;
        for (let i = 0; i < n; i++) p.wedge(sub, { angle: ang, at: [-0.09 + (i % 3) * 0.08 * (R / 0.04 > 1.6 ? 1.2 : 1), 0, i < 3 ? -0.04 : 0.045], rotY: (i % 2 ? 0.3 : -0.3) + (i < 3 ? 0 : PI), name: `wedge_${i}` });
      }
      break;
    }
    case 'pile': {
      const [fx, fz] = footprint(p);
      const d = Math.max(fx, fz) * 2.02;
      const base = [[-d / 2, 0, -d * 0.29], [d / 2, 0, -d * 0.29], [0, 0, d * 0.58]];
      base.forEach((q, i) => wholeFruit(root, p, { at: q, rotY: i * 2.1 + 0.3, name: `fruit_${i}` }));
      const lift = p.spec.lie ? R * 1.55 : (p.H - p.Y0) * 0.68;
      wholeFruit(root, p, { at: [0, lift, 0], rotY: 1.2, name: 'fruit_top' });
      break;
    }
    case 'in-bowl': case 'bowl': {
      const [fx] = footprint(p);
      const br = Math.max(0.1, fx * 2.6);
      const b = bowl(root, { r: br, h: br * 0.5, mat: woodMat('#8a5a32'), wall: 0.008 });
      const cnt = 4;
      for (let i = 0; i < cnt; i++) {
        const a = (i / cnt) * TAU;
        const rr = br * 0.45;
        wholeFruit(root, p, { at: [Math.cos(a) * rr * 0.75, b.floor + 0.003 + (i % 2) * 0.006, Math.sin(a) * rr * 0.75], rotY: a, name: `fruit_${i}` });
      }
      wholeFruit(root, p, { at: [0, b.floor + (p.spec.lie ? R * 1.3 : (p.H - p.Y0) * 0.55), 0], rotY: 0.7, name: 'fruit_top' });
      break;
    }
    case 'peeled': {
      // segments ball + empty peel cup
      const g = group('peeled', { parent: root });
      const geo = new THREE.SphereGeometry(R * 0.9, 40, 24);
      const pp = geo.attributes.position, v = new THREE.Vector3();
      for (let i = 0; i < pp.count; i++) { v.fromBufferAttribute(pp, i); const a = Math.atan2(v.x, v.z); const k = 1 - 0.05 * Math.pow(Math.abs(Math.cos(a * 5)), 12); v.x *= k; v.z *= k; pp.setXYZ(i, v.x, v.y, v.z); }
      geo.computeVertexNormals();
      vcolor(geo, (x, y, z, c) => { c.set(CUTS.orange.flesh).lerp(C('#fff1d8'), fbm(x * 300, y * 80, z * 300) > 0.62 ? 0.7 : 0.15); });
      mesh(geo, flesh('#fff', { vc: true, rough: 0.55 }), { parent: g, at: [-R * 0.95, R * 0.9, 0], name: 'segments' });
      const v2 = vessel([[0, 0], [R * 0.6, 0.002], [R * 0.9, R * 0.25], [R, R * 0.7]], 0.003);
      const peel = vcolor(v2.geo, (x, y, z, c) => { const r = Math.hypot(x, z); c.set(r < R - 0.0025 && y > 0.003 ? '#fbf0d8' : '#f28a12'); });
      mesh(peel, phys('#fff', { vc: true, rough: 0.6, cc: 0.3 }), { parent: g, at: [R * 1.05, 0, 0], name: 'peel' });
      break;
    }
    default:
      wholeFruit(root, p);
  }
}

/* --------------------------------------------------------- non-lathe fruit */
const bananaCols = {
  ripe: ['#f4d23a', '#e8c020', '#6a8a2a'], unripe: ['#8cb83a', '#a8c84a', '#4a7a1a'], overripe: ['#d8a82a', '#b8862a', '#4a3a1a'], mini: ['#f2cf40', '#e2b828', '#6a8a2a'], red: ['#8a2a2a', '#a8463a', '#4a2a1a'],
};
function bananaGeo(len, rad, cols, spots) {
  const pts = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; const a = -0.9 + t * 1.8; pts.push([Math.sin(a) * len * 0.62, (1 - Math.cos(a)) * len * 0.26, 0]); }
  const geo = sweep(pts, { r: (t) => rad * (t < 0.12 ? 0.32 + (t / 0.12) * 0.6 : t > 0.93 ? 0.35 + ((1 - t) / 0.07) * 0.55 : 0.92 + Math.sin(t * PI) * 0.08), ring: (a) => 1 + 0.07 * Math.cos(a * 5), seg: 40, sides: 20 });
  const uv = geo.attributes.uv, b = C(cols[0]), a = C(cols[1]), tip = C(cols[2]), dark = C('#3a2a14');
  vcolor(geo, (x, y, z, c, i) => {
    const t = uv.getX(i);
    c.copy(b).lerp(a, fbm(x * 80, y * 80, z * 80));
    if (t < 0.1 || t > 0.97) c.lerp(t > 0.97 ? dark : tip, 0.8);
    if (spots && fbm(x * 400, y * 400, z * 400, 2) > 0.66) c.lerp(dark, 0.75);
  });
  return { geo, pts };
}
function banana(parent, { len = 0.19, rad = 0.0175, state = 'ripe', at = [0, 0, 0], rot = [0, 0, 0], name = 'banana', peel = 0 }) {
  const cols = bananaCols[state] ?? bananaCols.ripe;
  const g = group(name, { parent, at, rot });
  if (!peel) {
    const { geo } = bananaGeo(len, rad, cols, state === 'overripe');
    const m = mesh(geo, waxy('#fff', { vc: true, rough: 0.5, cc: 0.3 }), { parent: g, name: `${name}_peel` });
    m.position.y = rad * 0.9;
  } else {
    // peeled fruit + flopped peel strips
    const pts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; const a = -0.9 + t * 1.8; pts.push([Math.sin(a) * len * 0.62, (1 - Math.cos(a)) * len * 0.26 + rad * 0.9, 0]); }
    const fl = sweep(pts.slice(peel > 1 ? 0 : 3), { r: (t) => rad * 0.8 * (t > 0.9 ? 0.5 + (1 - t) * 5 : 1), seg: 30, sides: 14 });
    mesh(fl, flesh('#f6ecc0'), { parent: g, name: `${name}_fruit` });
    const { geo } = bananaGeo(len * 0.45, rad * 1.02, cols, false);
    const base = mesh(geo, waxy('#fff', { vc: true, rough: 0.5, cc: 0.3, side: THREE.DoubleSide }), { parent: g, at: [-len * 0.28, rad * 0.9 - 0.012, 0], rot: [0, 0, -0.25], name: `${name}_base` });
    void base;
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU;
      const sx = peel > 1 ? -len * 0.05 : len * 0.02;
      curveTube([[sx, rad * 0.9, Math.sin(a) * rad * 0.7], [sx + len * 0.06, rad * 0.5, Math.sin(a) * rad * 2], [sx + len * 0.14, 0.003, Math.sin(a) * rad * 3.2]], rad * 0.35, waxy(cols[0], { rough: 0.5 }), { parent: g, segments: 10, radialSegments: 6, name: `${name}_strip${k}` }).scale.set(1, 1, 1);
    }
  }
  return g;
}
function bananaBunch(root, state, n) {
  const crown = group('crown', { parent: root, at: [-0.11, 0.035, 0] });
  mesh(new THREE.CylinderGeometry(0.009, 0.014, 0.05, 10), phys(state === 'unripe' ? '#4a7a1a' : '#5a5a2a', { rough: 0.8 }), { parent: crown, rot: [0, 0, PI / 2 + 0.6], name: 'crown_stalk' });
  for (let i = 0; i < n; i++) {
    const f = (i - (n - 1) / 2) / Math.max(1, n - 1);
    banana(root, { state, at: [-0.002, i % 2 ? 0.004 : 0, f * 0.075], rot: [f * 0.25, -f * 0.35, 0], name: `banana_${i}` });
  }
}

/* --------------------------------------------------------- factory */
export const FRUIT_VARIANTS = {
  apple: {}, pear: {}, banana: {}, orange: {}, lemon: {}, lime: {}, grapefruit: {}, grapes: {}, strawberry: {}, cherry: {},
  watermelon: {}, 'watermelon-slice': {}, pineapple: {}, mango: {}, peach: {}, plum: {}, apricot: {}, kiwi: {}, coconut: {},
  avocado: {}, pomegranate: {}, melon: {}, berries: {},
};
const STATE_TRIMS = { green: 'green', golden: 'golden', red: 'red', unripe: 'unripe', overripe: 'overripe', pink: 'pink', yellow: 'yellow', honeydew: 'honeydew', young: 'young' };

function grapes(root, { color = 'green', small = false, onPlate = false, rand }) {
  const cols = { green: ['#b8d05a', '#9ec048'], red: ['#a8324a', '#7a1e3a'], black: ['#2e1a3a', '#4a2a5a'], cotton: ['#d6e08a', '#c4d26a'] }[color];
  let y0 = 0;
  if (onPlate) y0 = plate(root, { r: 0.13 }).top;
  const g = group('bunch', { parent: root, at: [0, y0, 0] });
  const L = small ? 0.09 : 0.17, R0 = small ? 0.03 : 0.05, rg = color === 'cotton' ? 0.011 : 0.0095;
  const items = [];
  for (let i = 0; i < (small ? 22 : 60); i++) {
    const t = Math.pow(rand(), 0.8);
    const rad = R0 * (1 - t * 0.8) * Math.sqrt(rand());
    const a = rand() * PI;
    const x = -L / 2 + t * L;
    const y = rg + Math.sin(a) * rad * 0.7;
    items.push({ at: [x, y, Math.cos(a) * rad], scale: [1, 1.12, 1], rot: [rand(), rand(), rand()], color: rand() > 0.5 ? cols[0] : cols[1] });
  }
  items.sort((a, b) => a.at[1] - b.at[1]);
  const m = phys('#ffffff', { rough: 0.35, cc: 0.6, ccr: 0.3, sheen: 0.6, sheenColor: '#e8e8f0', name: 'grape' });
  scatter(g, cached('grape' + rg, () => new THREE.SphereGeometry(rg, 14, 10)), m, items, 'grapes');
  curveTube([[-L / 2 - 0.035, rg * 2.2, 0], [-L / 2 - 0.01, rg * 2.4, 0.003], [-L / 2 + L * 0.3, rg * 1.6, 0], [L * 0.2, rg, 0]], 0.0018, phys('#6a5a2a', { rough: 0.8 }), { parent: g, segments: 16, radialSegments: 6, name: 'stalk' });
}

function strawberry(parent, { at = [0, 0, 0], rotY = 0, state = 'ripe', bitten = false, dipped = null, half = false, name = 'berry', s = 1 }) {
  const h = 0.042 * s, R = 0.017 * s;
  const ctrl = [[0, 0], [R * 0.25, h * 0.08], [R * 0.7, h * 0.35], [R, h * 0.72], [R * 0.85, h * 0.92], [R * 0.4, h], [0, h * 0.99]];
  const col = state === 'unripe' ? ['#e6e6a0', '#9cc04a'] : state === 'white' ? ['#f2eadc', '#f8d8d0'] : ['#d4182a', '#a80e1e'];
  const pp = produce({ ctrl, key: `straw-${state}-${s}`, mat: (o) => waxy('#fff', { cc: 0.9, rough: 0.25, ...o }), skin: (c, x, y, z, t, n) => { c.set(col[0]).lerp(C(col[1]), n * 0.6); if (state === 'unripe') c.lerp(C('#ffffff'), Math.max(0, t - 0.6)); if (dipped && t < 0.55) c.set(dipped).multiplyScalar(0.95 + n * 0.1); }, cut: CUTS.strawberry, ns: 120 });
  const holder = group(name, { parent, at, rot: [0, rotY, 0] });
  const g = group(`${name}_b`, { parent: holder });
  if (half) pp.halfUp(holder, { name: `${name}_half` });
  else {
    const bites = bitten ? [{ at: [0, h * 0.05, R * 0.4], r: R * 1.0 }] : undefined;
    const m = pp.whole(g, { bites, name: `${name}_skin` });
    void m;
    if (!dipped) {
      const seeds = surfacePoints(pp.pts, 70, rng2(name), { tMin: 0.1, tMax: 0.85, lift: 0.0003 });
      scatter(g, seedGeo(), phys(state === 'unripe' ? '#c8c86a' : '#f2d24a', { rough: 0.5 }), seeds.map((q) => ({ at: q.at, rot: [0, q.a, PI / 2], scale: s })), `${name}_seeds`);
    } else {
      mesh(new THREE.LatheGeometry(pp.pts.filter((q) => q[1] < h * 0.55).map(([r, y]) => new THREE.Vector2(r + 0.0012, y)), 32), glaze(dipped), { parent: g, name: `${name}_dip` });
    }
    // calyx
    for (let i = 0; i < 7; i++) mesh(leafGeo(0.016 * s, 0.006 * s, { cup: 0.1, curl: -0.4 }), leafy('#3f8a26'), { parent: g, at: [0, h * 0.98, 0], rot: [0, (i / 7) * TAU, 0.25], name: `${name}_sepal${i}` });
    curveTube([[0, h * 0.97, 0], [0.001, h + 0.008 * s, 0], [0.003, h + 0.014 * s, 0]], 0.0012 * s, leafy('#4c8a2a'), { parent: g, segments: 6, radialSegments: 5, name: `${name}_stem` });
    // lie on side
    g.rotation.z = PI / 2 - 0.25;
    g.position.set(h * 0.45, R * 0.95, 0);
  }
  return holder;
}
function rng2(seed) { let a = 0; for (const ch of seed) a = (a * 31 + ch.charCodeAt(0)) | 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function cherry(parent, { at = [0, 0, 0], color = 'red', name = 'cherry', stemTo }) {
  const g = group(name, { parent, at });
  const R = 0.012;
  const geo = new THREE.LatheGeometry(smoothPts2([[0, 0.002], [R * 0.7, 0.001], [R, R * 0.9], [R * 0.8, R * 1.75], [R * 0.25, R * 1.9], [0, R * 1.8]]).map(([r, y]) => new THREE.Vector2(Math.max(r, 1e-4), y)), 28);
  const col = color === 'yellow' ? ['#f2c84a', '#e2483a'] : color === 'black' ? ['#3a0a14', '#5a0a1e'] : ['#a80e1e', '#d8283a'];
  vcolor(geo, (x, y, z, c) => c.set(col[0]).lerp(C(col[1]), fbm(x * 90, y * 90, z * 90) * (color === 'yellow' ? 0.9 : 0.4)));
  mesh(geo, waxy('#fff', { vc: true, cc: 1, rough: 0.18 }), { parent: g, name: `${name}_skin` });
  const top = stemTo ?? [0.015, 0.06, 0];
  curveTube([[0, R * 1.8, 0], [top[0] * 0.3, R * 1.8 + 0.02, top[2] * 0.3], top], 0.0011, phys('#5a7a2a', { rough: 0.7 }), { parent: g, segments: 10, radialSegments: 5, name: `${name}_stem` });
  return g;
}
function smoothPts2(ctrl) { const c = new THREE.SplineCurve(ctrl.map(([r, y]) => new THREE.Vector2(r, y))); return c.getSpacedPoints(20).map((p) => [Math.max(0, p.x), p.y]); }

function pineapple(root, { state = 'ripe', trim, rand }) {
  const h = trim === 'mini' ? 0.13 : 0.2, R = trim === 'mini' ? 0.045 : 0.065;
  const ctrl = [[0, 0], [R * 0.7, 0.003], [R * 0.95, h * 0.2], [R, h * 0.5], [R * 0.9, h * 0.82], [R * 0.6, h * 0.98], [0, h]];
  const base = state === 'unripe' ? ['#4a7a2a', '#7a8a3a'] : ['#c88a2a', '#7a5a1e'];
  const pp = produce({
    ctrl, key: `pine-${state}-${h}`, seg: 48, n: 30,
    mat: (o) => phys('#fff', { rough: 0.7, cc: 0.2, ...o, name: 'skin' }),
    skin: (c, x, y, z, t) => { const a = Math.atan2(x, z); const u = a * 8 / PI + y * 120, v = a * 8 / PI - y * 120; const d = Math.abs(Math.sin(u * PI)) * Math.abs(Math.sin(v * PI)); c.set(base[0]).lerp(C(base[1]), 1 - d).lerp(C('#3a2a14'), d < 0.08 ? 0.6 : 0); },
    displace: (v, t, a) => { const u = a * 8 / PI + v.y * 120, w = a * 8 / PI - v.y * 120; const d = Math.abs(Math.sin(u * PI)) * Math.abs(Math.sin(w * PI)); const r = Math.hypot(v.x, v.z) || 1; const k = 1 + d * 0.035; v.x *= k; v.z *= k; void r; },
    cut: CUTS.pineapple,
  });
  const crownLeaves = (parent, y) => {
    const leaves = [];
    for (let i = 0; i < 28; i++) { const tilt = 0.15 + (i / 28) * 0.9; leaves.push({ at: [0, y, 0], rot: [0, i * 2.4, PI / 2 - tilt * 0.9], scale: [1 - i / 50, 1, 1] }); }
    scatter(parent, leafGeo(trim === 'mini' ? 0.08 : 0.13, 0.016, { cup: 0.4, curl: -0.15 }), leafy(state === 'unripe' ? '#3a7a2a' : '#4a7a3a', { rough: 0.55 }), leaves, 'crown');
  };
  if (trim === 'halved') {
    pp.halfUp(root, { at: [0, 0, -R * 1.05], name: 'halfA' });
    pp.halfUp(root, { at: [0, 0, R * 1.05], rotY: PI, name: 'halfB' });
    const c = group('crownA', { parent: root, at: [h / 2 - 0.004, R, -R * 1.05], rot: [0, 0, -PI / 2] }); crownLeaves(c, 0);
  } else if (trim === 'rings') {
    const top = plate(root, { r: 0.14 }).top;
    const ringGeo = new THREE.RingGeometry(0.012, R * 0.95, 40); ringGeo.rotateX(-PI / 2);
    for (let i = 0; i < 4; i++) {
      const g = group(`ring_${i}`, { parent: root, at: [(i - 1.5) * 0.035, top + 0.007 + i * 0.0002, (i % 2) * 0.01], rot: [0, 0, (i - 1.5) * 0.05] });
      mesh(new THREE.TorusGeometry((0.012 + R * 0.95) / 2, (R * 0.95 - 0.012) / 2, 8, 40).scale(1, 1, 0.25).rotateX(PI / 2), flesh('#ffd94a'), { parent: g, name: `ring${i}` });
    }
  } else if (trim === 'wedges') {
    const top = board(root, { w: 0.32, d: 0.22 });
    const sub = group('on_board', { parent: root, at: [0, top, 0] });
    for (let i = 0; i < 4; i++) pp.wedge(sub, { angle: PI / 3, at: [-0.06 + (i % 2) * 0.12, 0, i < 2 ? -0.05 : 0.05], rotY: i < 2 ? 0.15 : PI - 0.15, name: `wedge_${i}`, inner: 0.012 });
  } else {
    const g = group('pineapple', { parent: root });
    pp.whole(g, { name: 'body' });
    if (trim !== 'crownless') crownLeaves(g, h - 0.004);
    else mesh(new THREE.CylinderGeometry(R * 0.55, R * 0.6, 0.006, 24), flesh('#e8c84a'), { parent: g, at: [0, h - 0.002, 0], name: 'cut_top' });
  }
  void rand;
}

function berries(root, { kind, rand }) {
  // clear punnet with berries
  const W = 0.12, D = 0.1, Hh = 0.05;
  const punnetMat = plasticMat('#e8f4f0', { opacity: 0.4, transparent: true, depthWrite: false, rough: 0.1 });
  if (kind === 'bowl') {
    const b = bowl(root, { r: 0.075, h: 0.05, color: '#f2efe8' });
    fillBerries(root, b.floor, 0.06, 0.03, rand, 'mixed');
  } else {
    const shell = vessel([[0, 0], [W * 0.45, 0], [W * 0.5, 0.004], [W * 0.56, Hh]], 0.0015, { seg: 4 });
    const m = mesh(shell.geo, punnetMat, { parent: root, rot: [0, PI / 4, 0], scale: [1, 1, D / W], name: 'punnet' });
    void m;
    fillBerries(root, 0.0015, 0.05, Hh * 0.9, rand, kind);
  }
}
function fillBerries(root, y0, rad, depth, rand, kind) {
  const types = kind === 'mixed' ? ['blue', 'rasp', 'black'] : [kind === 'raspberries' ? 'rasp' : kind === 'blackberries' ? 'black' : 'blue'];
  const geoms = {
    blue: cached('bblue', () => new THREE.SphereGeometry(0.0065, 12, 8).scale(1, 0.85, 1)),
    rasp: cached('brasp', () => { const g = new THREE.IcosahedronGeometry(0.0095, 2); g.scale(1, 1.15, 1); return g; }),
    black: cached('bblack', () => { const g = new THREE.IcosahedronGeometry(0.0095, 2); g.scale(1, 1.2, 1); return g; }),
  };
  const mats = { blue: velvet('#2e3a6a', { sheen: 1, sheenColor: '#9aa8d0', rough: 0.6 }), rasp: velvet('#c8203a', { flat: true, rough: 0.5, sheen: 0.6 }), black: glaze('#1a0e1e', { flat: true }) };
  for (const ty of types) {
    const items = [];
    const n = kind === 'mixed' ? 14 : 34;
    for (let i = 0; i < n; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * rad; items.push({ at: [Math.cos(a) * d * 0.9, y0 + 0.006 + rand() * depth, Math.sin(a) * d * 0.8], rot: [rand() * 3, rand() * 3, 0] }); }
    // ensure contact column
    items.push({ at: [0, y0 + 0.006, 0] });
    for (let k = 1; k < 6; k++) items.push({ at: [0, y0 + 0.006 + k * depth / 5, 0] });
    scatter(root, geoms[ty], mats[ty], items, `berries_${ty}`);
  }
}

export const createFruit = make('fruit', FRUIT_VARIANTS, (ctx) => {
  const { variant, trim, root, rand } = ctx;
  const state = STATE_TRIMS[trim] ?? 'ripe';
  const lt = STATE_TRIMS[trim] ? null : trim;
  const latheCtx = { ...ctx, trim: lt };
  switch (variant) {
    case 'banana': {
      const st = trim === 'unripe' || trim === 'overripe' || trim === 'red' || trim === 'mini' ? trim : 'ripe';
      if (trim === 'single') banana(root, { state: 'ripe' });
      else if (trim === 'peeled') banana(root, { peel: 2 });
      else if (trim === 'half-peeled') banana(root, { peel: 1 });
      else if (trim === 'sliced') {
        const top = board(root, { w: 0.3, d: 0.2 });
        const g = group('slices', { parent: root, at: [0, top, 0] });
        const sp = produce({ ctrl: [[0, 0], [0.016, 0.002], [0.016, 0.1], [0, 0.102]], key: 'banslice', mat: (o) => flesh('#fff', o), skin: (c) => c.set('#f6ecc0'), cut: { kind: 'banana', flesh: '#f8eec6', flesh2: '#efe0a8', seed: '#8a6a3a', skin: '#f2e6b8', rind: '#f6ecc0', rindW: 0.01 } });
        for (let i = 0; i < 8; i++) sp.round(g, { y: 0.05, th: 0.008, at: [-0.1 + i * 0.026, 0, Math.sin(i) * 0.02], name: `slice_${i}` });
        banana(g, { peel: 1, at: [0.06, 0, -0.05], rot: [0, 0.4, 0], name: 'rest', len: 0.12 });
      } else if (trim === 'mini') bananaBunch(root, 'mini', 6);
      else bananaBunch(root, st, trim === 'overripe' ? 3 : 5);
      if (trim === 'mini') root.scale.setScalar(0.62);
      break;
    }
    case 'grapes': grapes(root, { color: trim === 'red' ? 'red' : trim === 'black' ? 'black' : trim === 'cotton-candy' ? 'cotton' : 'green', small: trim === 'small-cluster', onPlate: trim === 'on-plate', rand }); break;
    case 'strawberry': {
      const st = trim === 'unripe' ? 'unripe' : trim === 'white' ? 'white' : 'ripe';
      if (trim === 'pile' || trim === 'in-bowl') {
        let y0 = 0;
        if (trim === 'in-bowl') { const b = bowl(root, { r: 0.07, h: 0.045, color: '#f6f3ec' }); y0 = b.floor; }
        const pos = [[-0.02, 0, -0.015], [0.022, 0, -0.012], [0, 0, 0.022], [-0.024, 0, 0.026], [0.03, 0, 0.03], [0.002, 0.026, 0.004]];
        pos.forEach((q, i) => strawberry(root, { at: [q[0], y0 + q[1], q[2]], rotY: i * 1.9, name: `berry${i}` }));
      } else strawberry(root, { state: st, bitten: trim === 'bitten', half: trim === 'halved', dipped: trim === 'dipped' ? '#3a1e10' : trim === 'white-dipped' ? '#f6efe0' : null, s: 1.6 });
      break;
    }
    case 'cherry': {
      const color = trim === 'yellow' ? 'yellow' : trim === 'black' ? 'black' : 'red';
      if (trim === 'bowl') {
        const b = bowl(root, { r: 0.075, h: 0.045, color: '#2a4a8a' });
        for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; cherry(root, { at: [Math.cos(a) * 0.028 * (i % 2 ? 1 : 0.4), b.floor, Math.sin(a) * 0.028 * (i % 2 ? 1 : 0.4)], name: `cherry${i}`, stemTo: [Math.cos(a) * 0.02, 0.05, Math.sin(a) * 0.02] }); }
      } else if (trim === 'single') cherry(root, { color: 'red' });
      else if (trim === 'pile') { for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; cherry(root, { at: [Math.cos(a) * 0.022, 0, Math.sin(a) * 0.022], name: `cherry${i}`, stemTo: [Math.cos(a) * 0.04, 0.035, Math.sin(a) * 0.04] }); } }
      else {
        cherry(root, { color, at: [-0.013, 0, 0], name: 'cherryA', stemTo: [0.002, 0.065, 0] });
        cherry(root, { color, at: [0.013, 0, 0.003], name: 'cherryB', stemTo: [-0.024, 0.065, -0.003] });
        mesh(leafGeo(0.04, 0.016), leafy('#4c8a2a'), { parent: root, at: [-0.012, 0.064, 0], rot: [0.2, 0.4, 0.3], name: 'leaf' });
      }
      break;
    }
    case 'pineapple': pineapple(root, { state, trim: lt, rand }); break;
    case 'berries': berries(root, { kind: trim ?? 'blueberries', rand }); break;
    case 'watermelon-slice': {
      const yellow = trim === 'yellow';
      const cc = yellow ? CUTS.yellowmelon : CUTS.watermelon;
      const one = (parent, at, rotY, name, bitten) => {
        const R = 0.13, T = 0.026, ang = PI / 3.2;
        const s = new THREE.Shape(); s.moveTo(0, 0);
        const N = 24;
        for (let i = 0; i <= N; i++) { const a = PI / 2 - ang / 2 + (ang * i) / N; let r = R; if (bitten && Math.abs(i - N / 2) < 5) r = R - 0.012 * Math.cos(((i - N / 2) / 5) * PI / 2) - (i % 3) * 0.001; s.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        s.lineTo(0, 0);
        const outline = s.getPoints(); const o2 = outline.map((p) => [p.x, p.y]);
        const geo = fitUV(extrudeOutline(s, T, { bevel: 0.002, segments: 1 }));
        const tex = cutTexture('watermelon', { ...cc, skin: '#2f6a1e' }, [...o2.slice(1, N + 2), [0, 0]], N + 1, [0, 0], R, `wslice:${yellow}:${bitten}`);
        const fm = flesh(cc.flesh, { map: tex });
        const rind = waxy('#2f6a1e');
        const g = group(name, { parent, at, rot: [0, rotY, 0] });
        // lie flat: shape plane → XZ, thickness along Y
        mesh(geo, [fm, rind], { parent: g, at: [0, T / 2, R * 0.5], rot: [-PI / 2, 0, 0], name: `${name}_slab` });
        return g;
      };
      if (trim === 'pile') { one(root, [0, 0, 0], 0, 'sliceA'); one(root, [0.02, 0.026, 0.01], 0.4, 'sliceB'); one(root, [-0.02, 0.052, 0.0], -0.3, 'sliceC'); }
      else if (trim === 'on-plate') { const t = plate(root, { r: 0.15 }).top; const g = group('p', { parent: root, at: [0, t, 0] }); one(g, [-0.03, 0, -0.04], 0.5, 'sliceA'); one(g, [0.03, 0, -0.04], -0.5, 'sliceB'); }
      else if (trim === 'triangle') { one(root, [0, 0, 0], 0, 'slice'); }
      else if (trim === 'popsicle') { one(root, [0, 0, 0], 0, 'slice'); mesh(roundedBox(0.012, 0.004, 0.09, 0.0015), woodMat('#e8d0a0'), { parent: root, at: [0, 0.013, -0.06 + 0.04], name: 'stick' }); }
      else {
        // classic standing half-moon slice
        const R = 0.13, T = 0.028;
        const s = new THREE.Shape(); s.moveTo(-R, 0);
        for (let i = 0; i <= 32; i++) { const a = PI - (i / 32) * PI; let r = R; if (trim === 'bitten' && i > 12 && i < 20) r = R - 0.014 * Math.sin(((i - 12) / 8) * PI); s.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        s.lineTo(-R, 0);
        const o2 = s.getPoints().map((p) => [p.x, p.y]);
        const geo = fitUV(extrudeOutline(s, T, { bevel: 0.002, segments: 1 }));
        const tex = cutTexture('watermelon', { ...cc, skin: '#2f6a1e' }, o2, o2.length - 1, [0, 0], R, `whalf:${yellow}:${trim}`);
        const g = group('slice', { parent: root, rot: [PI, 0, 0], at: [0, R, 0] });
        mesh(geo, [flesh(cc.flesh, { map: tex }), waxy('#2f6a1e')], { parent: g, at: [0, R - R, 0], name: 'slab' });
        g.rotation.set(PI, 0, 0); g.position.y = R;
      }
      break;
    }
    case 'coconut': {
      const st = trim === 'young' || trim === 'drinking' ? 'young' : 'ripe';
      const p = body('coconut', st);
      if (trim === 'halved') {
        for (const s of [-1, 1]) {
          const R = p.R;
          const shell = vessel([[0, 0], [R * 0.5, 0.002], [R * 0.85, R * 0.35], [R, R * 0.85]], 0.004);
          const g = group(`half${s}`, { parent: root, at: [s * R * 1.08, 0, 0], rot: [0, 0, s * 0.12] });
          const geo = mottleShell(shell.geo, R);
          mesh(geo, velvet('#fff', { vc: true, rough: 1 }), { parent: g, name: `shell${s}` });
          const lin = vessel([[0, 0.004], [R * 0.48, 0.006], [R * 0.82, R * 0.36], [R * 0.95, R * 0.85]], 0.007, { lip: false });
          mesh(lin.geo, flesh('#fbfaf4', { rough: 0.6 }), { parent: g, at: [0, 0.0005, 0], name: `meat${s}` });
        }
      } else if (trim === 'drinking') {
        wholeFruit(root, p, { details: false });
        const top = p.H - p.Y0;
        mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.004, 24), flesh('#f6f4e8'), { parent: root, at: [0, top - 0.004, 0], name: 'cut' });
        curveTube([[0.004, top - 0.01, 0], [0.008, top + 0.08, 0], [0.012, top + 0.1, 0], [0.03, top + 0.11, 0]], 0.0035, plasticMat('#f25a8a'), { parent: root, segments: 16, radialSegments: 8, name: 'straw' });
        const um = group('umbrella', { parent: root, at: [-0.01, top - 0.008, 0], rot: [0, 0, 0.35] });
        tube([0, 0, 0], [0, 0.11, 0], 0.0012, woodMat('#e8d8b0'), { parent: um, name: 'umbrella_stick' });
        mesh(new THREE.ConeGeometry(0.045, 0.018, 8, 1, true), phys('#ffb42a', { rough: 0.8, side: THREE.DoubleSide }), { parent: um, at: [0, 0.108, 0], name: 'umbrella_top' });
      } else if (trim === 'pile') {
        wholeFruit(root, p, { at: [-0.05, 0, 0], name: 'a' }); wholeFruit(root, p, { at: [0.055, 0, 0.01], name: 'b', rotY: 1 }); wholeFruit(root, p, { at: [0, 0, 0.09], name: 'c', rotY: 2 });
      } else wholeFruit(root, p);
      break;
    }
    case 'pomegranate': {
      if (lt === 'arils') {
        const b = bowl(root, { r: 0.07, h: 0.045, color: '#f6f3ec' });
        const items = [];
        for (let i = 0; i < 160; i++) { const a = rand() * TAU, d = Math.sqrt(rand()); const y = b.floor + 0.004 + rand() * 0.03; const rr = Math.min(b.inner(y) - 0.004, 0.065) * d; items.push({ at: [Math.cos(a) * rr, y, Math.sin(a) * rr], rot: [rand() * 3, rand() * 3, 0] }); }
        items.push({ at: [0, b.floor + 0.004, 0] });
        scatter(root, cached('aril', () => new THREE.IcosahedronGeometry(0.0045, 1).scale(1, 1.25, 0.9)), phys('#c8102e', { rough: 0.1, cc: 1, opacity: 0.92, transparent: true }), items, 'arils');
        break;
      }
      buildLathe(latheCtx, 'pomegranate', state); break;
    }
    case 'watermelon': {
      if (trim === 'mini') { const p = body('watermelon', 'ripe'); const h = group('mini', { parent: root, scale: 1 }); wholeFruit(h, p); h.scale.setScalar(0.6); break; }
      if (trim === 'yellow') { const p0 = body('watermelon', 'ripe'); const p = produce({ ...SPECS.watermelon, key: 'wm-yellow', skin: (c, x, y, z, t, n) => { const a = Math.atan2(x, z); c.set(Math.sin(a * 9 + n * 5) > -0.1 ? '#1f4a14' : '#8cbc4a'); }, cut: CUTS.yellowmelon }); p.spec = p0.spec; p.name = 'watermelon'; p.halfCross(root, { yc: 0.16, name: 'half' }); break; }
      buildLathe(latheCtx, 'watermelon', 'ripe'); break;
    }
    default: buildLathe(latheCtx, variant, state === 'honeydew' ? 'honeydew' : state);
  }
});
function mottleShell(geo, R) { return vcolor(geo, (x, y, z, c) => { const r = Math.hypot(x, z); const inside = y > 0.004 && r < R * 0.85 * (y / (R * 0.85)) + 0.0001; c.set(inside ? '#f8f6ee' : '#6a4428').multiplyScalar(0.85 + fbm(x * 160, y * 40, z * 160) * 0.3); }); }
import { tube } from './common.js';

void rotateTrack; void spinTrack; void clip; void fillGeo; void ceramic; void canvasTex;
