// Everyday items, outdoor group (garden): hand tools, hoses, watering cans, wheelbarrows,
// flower pots and bird feeders.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, tube, cushion, extrudeOutline, setup, done, fin, tm, hw, TRIMS, clip, spinTrack, rotateTrack, pingPong, vessel } from './common.js';
import { merge, rodGeo, torusGeo, boxVessel, boxSolid, wheel, foliage } from './outdoor-util.js';

/* ================================ GARDEN TOOLS ================================ */

export const GARDENING_VARIANTS = {
  shovel: {}, spade: {}, rake: {}, 'leaf-rake': {}, hoe: {}, trowel: {}, 'garden-fork': {}, 'pruning-shears': {}, 'gardening-gloves': {},
};

function handleMat(T) {
  if (T.trim === 'plastic' || T.trim === 'kids') return fin(T, T.p, 'plastic');
  if (T.trim === 'rugged') return fin(T, '#e8c21a', 'gloss');
  if (T.trim === 'steel') return fin(T, '#c9ced4', 'metal');
  if (T.trim === 'black') return fin(T, '#1a1b1e', 'plastic');
  return fin(T, T.worn ? '#9a7a52' : '#c9a06a', 'wood');
}
function headMat(T) {
  if (T.trim === 'kids') return fin(T, T.s, 'plastic');
  if (T.trim === 'plastic') return fin(T, T.p, 'plastic');
  if (T.worn) return M.metal('#7a5034', 0.75);
  if (T.trim === 'black') return M.metal('#2a2b2e', 0.35);
  if (T.trim === 'rugged') return M.metal('#3a3d42', 0.4);
  return M.metal('#b9bec6', 0.3);
}

/** Thin bent sheet blade (shovel/spade/hoe) from an outline in XY, curved about Y. */
function blade(outline, t, curve) {
  const g = extrudeOutline(outline, t, { bevel: Math.min(0.002, t * 0.4), segments: 1 });
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + curve * p.getX(i) ** 2);
  g.computeVertexNormals();
  return g;
}

export function createGardening(options = {}) {
  const { o, variant, T } = setup(options, GARDENING_VARIANTS, 'gardening', { p: '#2f7a4a', s: '#f2a516', a: '#1d1d1d', mat: 'wood' });
  const root = group(`gardening-${variant}`);
  const k = T.k;
  const H = handleMat(T), B = headMat(T);
  const grip = fin(T, T.trim === 'kids' ? T.a : T.rugged ? '#1d1d1d' : T.p, 'rubber');
  const tool = group('tool', { parent: root });
  const shaftR = (T.chunky || T.rugged ? 0.019 : T.slim ? 0.013 : 0.016) * Math.max(0.8, k);
  const long = (L, dGrip = false) => {
    // shaft along +Y from y=0 (head end) to L, with grip/end
    mesh(new THREE.CylinderGeometry(shaftR, shaftR * 1.05, L, 16), H, { parent: tool, at: [0, L / 2, 0], name: 'shaft' });
    if (dGrip) {
      curveTube([[-0.012, L - 0.01, 0], [-0.06, L + 0.06, 0], [0, L + 0.13, 0], [0.06, L + 0.06, 0], [0.012, L - 0.01, 0]], shaftR * 0.7, H, { parent: tool, segments: 24 });
      mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.11, 12).rotateZ(Math.PI / 2), grip, { parent: tool, at: [0, L + 0.115, 0] });
    } else {
      mesh(new THREE.CylinderGeometry(shaftR * 1.25, shaftR * 1.2, 0.13, 16), grip, { parent: tool, at: [0, L - 0.065, 0] });
      mesh(new THREE.SphereGeometry(shaftR * 1.25, 12, 8), grip, { parent: tool, at: [0, L, 0], scale: [1, 0.5, 1] });
    }
  };
  const collar = (len) => mesh(new THREE.CylinderGeometry(shaftR * 1.2, shaftR * 1.5, len, 16), B, { parent: tool, at: [0, -len / 2 + 0.02, 0] });
  let lying = true;
  if (variant === 'shovel' || variant === 'spade') {
    const L = (variant === 'spade' ? 0.72 : 1.05) * k;
    long(L, variant === 'spade' || T.rugged);
    collar(0.16);
    const W = (variant === 'spade' ? 0.19 : 0.23) * (T.chunky ? 1.1 : 1);
    const BL = (variant === 'spade' ? 0.28 : 0.3) * Math.max(0.85, k);
    const out = variant === 'spade'
      ? [[-W / 2, 0], [W / 2, 0], [W / 2, -BL * 0.92], [W * 0.46, -BL], [-W * 0.46, -BL], [-W / 2, -BL * 0.92]]
      : [[-W / 2, 0], [-W * 0.08, 0.02], [W * 0.08, 0.02], [W / 2, 0], [W * 0.48, -BL * 0.6], [W * 0.25, -BL * 0.92], [0, -BL], [-W * 0.25, -BL * 0.92], [-W * 0.48, -BL * 0.6]];
    mesh(blade(out, 0.004, variant === 'spade' ? 0.6 : 1.6), B, { parent: tool, at: [0, -0.1, 0], name: 'blade' });
    if (T.detail) for (const s of [-1, 1]) mesh(roundedBox(0.05, 0.012, 0.012, 0.004), B, { parent: tool, at: [s * W * 0.32, -0.1, 0.002] });
  } else if (variant === 'rake' || variant === 'garden-fork' || variant === 'hoe') {
    const L = (variant === 'garden-fork' ? 0.75 : 1.35) * k;
    long(L, variant === 'garden-fork');
    collar(0.12);
    if (variant === 'rake') {
      const W = 0.36 * (T.w ?? 1), n = T.chunky ? 10 : 14;
      mesh(roundedBox(W, 0.025, 0.02, 0.006), B, { parent: tool, at: [0, -0.12, 0] });
      const g = [];
      for (let i = 0; i < n; i++) { const x = -W / 2 + 0.01 + (i * (W - 0.02)) / (n - 1); g.push(rodGeo([x, -0.12, 0], [x, -0.19, 0.03], 0.0035, 6)); }
      mesh(merge(g), B, { parent: tool, name: 'tines' });
    } else if (variant === 'garden-fork') {
      const W = 0.18;
      curveTube([[-W / 2, -0.3, 0.01], [-W / 2, -0.11, 0], [0, -0.09, 0], [W / 2, -0.11, 0], [W / 2, -0.3, 0.01]], 0.006, B, { parent: tool, segments: 24 });
      for (const x of [-W / 6, W / 6]) mesh(new THREE.CylinderGeometry(0.0055, 0.003, 0.21, 8), B, { parent: tool, at: [x, -0.2, 0.004] });
      mesh(new THREE.CylinderGeometry(0.004, 0.004, W, 8).rotateZ(Math.PI / 2), B, { parent: tool, at: [0, -0.097, 0] });
    } else {
      mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 8), B, { parent: tool, at: [0, -0.13, 0.03], rot: [0.7, 0, 0] });
      mesh(roundedBox(0.17, 0.08, 0.004, 0.0015), B, { parent: tool, at: [0, -0.2, 0.065], rot: [-0.2, 0, 0], name: 'blade' });
    }
  } else if (variant === 'leaf-rake') {
    const L = 1.3 * k;
    long(L);
    collar(0.08);
    const n = T.chunky ? 14 : 22, spread = 0.55 * (T.w ?? 1);
    const tm2 = T.trim === 'plastic' || T.trim === 'kids' ? fin(T, T.p, 'plastic') : T.trim === 'bamboo' ? fin(T, '#d1b072', 'wood') : B;
    const g = [];
    for (let i = 0; i < n; i++) {
      const a = -spread / 2 + (i * spread) / (n - 1);
      const x1 = Math.sin(a) * 0.42, y1 = -0.05 - Math.cos(a) * 0.42;
      g.push(rodGeo([0, -0.05, 0], [x1, y1, 0], 0.003, 4));
      g.push(rodGeo([x1, y1, 0], [x1 * 1.03, y1 - 0.025, 0.03], 0.003, 4));
    }
    mesh(merge(g), tm2, { parent: tool, name: 'tines' });
    curveTube(Array.from({ length: 9 }, (_, i) => { const a = -spread / 2 + (i * spread) / 8; return [Math.sin(a) * 0.2, -0.05 - Math.cos(a) * 0.2, 0]; }), 0.004, tm2, { parent: tool, segments: 24 });
  } else if (variant === 'trowel') {
    lying = true;
    const s = k * (T.chunky ? 1.15 : 1);
    mesh(lathe([[0, 0], [0.016, 0.005], [0.018, 0.05], [0.015, 0.11], [0.012, 0.12], [0, 0.12]].map(([r, y]) => [r * s, y * s]), 16), H, { parent: tool, name: 'handle' });
    mesh(new THREE.CylinderGeometry(0.006 * s, 0.009 * s, 0.05 * s, 10), B, { parent: tool, at: [0, -0.02 * s, 0] });
    const out = [[-0.04, 0], [0.04, 0], [0.042, -0.08], [0.02, -0.14], [0, -0.155], [-0.02, -0.14], [-0.042, -0.08]].map(([x, y]) => [x * s, y * s]);
    mesh(blade(out, 0.003, 8), B, { parent: tool, at: [0, -0.04 * s, -0.004], name: 'blade' });
  } else if (variant === 'pruning-shears') {
    const s = k;
    const pv = group('pivot', { parent: tool });
    for (const sd of [-1, 1]) {
      const side = group(sd < 0 ? 'jawL' : 'jawR', { parent: pv, rot: [0, 0, sd * 0.12] });
      curveTube([[0, 0, sd * 0.004], [sd * 0.025 * s, -0.08 * s, sd * 0.004], [sd * 0.03 * s, -0.19 * s, sd * 0.004]], 0.0075 * s, fin(T, T.p, 'rubber'), { parent: side, segments: 16 });
      const bo = sd < 0 ? [[0, 0], [0.012, 0.02], [0.006, 0.07], [-0.004, 0.075], [-0.01, 0.02]] : [[0, 0], [0.01, 0.02], [0.004, 0.06], [-0.006, 0.065], [-0.012, 0.02]];
      mesh(extrudeOutline(bo.map(([x, y]) => [x * 2.2 * s, y * 1.1 * s]), 0.004, { bevel: 0.001, segments: 1 }), sd < 0 ? M.metal('#d6d9de', 0.2) : B, { parent: side, at: [0, 0, sd * 0.003] });
    }
    mesh(new THREE.CylinderGeometry(0.008 * s, 0.008 * s, 0.014, 16).rotateX(Math.PI / 2), hw(T), { parent: pv });
    curveTube([[-0.012 * s, -0.04 * s, 0], [0, -0.03 * s, 0.002], [0.012 * s, -0.04 * s, 0]], 0.002, M.metal('#888', 0.3), { parent: pv, segments: 8 });
  } else {
    // gardening gloves: a pair lying flat
    lying = false;
    const gm = T.trim === 'leather' ? fin(T, '#b8864e', 'leather') : tm(T, 'p', T.mat === 'wood' ? 'fabric' : T.mat === 'metal' ? 'rubber' : undefined);
    const cuff = fin(T, T.s, 'fabric');
    const s = k;
    for (const sd of [-1, 1]) {
      const gl = group(sd < 0 ? 'gloveL' : 'gloveR', { parent: root, at: [sd * 0.065 * s, 0, sd * 0.02], rot: [0, sd * 0.25, 0] });
      mesh(cushion(0.09 * s, 0.022 * s, 0.1 * s, { bulge: 0.25 }), gm, { parent: gl, at: [0, 0.011 * s, 0] });
      for (let i = 0; i < 4; i++) {
        const x = (-0.033 + i * 0.022) * s, len = [0.06, 0.075, 0.07, 0.055][i] * s;
        mesh(new THREE.CapsuleGeometry(0.0095 * s, len, 4, 10).rotateX(Math.PI / 2), gm, { parent: gl, at: [x, 0.01 * s, -0.05 * s - len / 2] });
      }
      mesh(new THREE.CapsuleGeometry(0.011 * s, 0.045 * s, 4, 10).rotateX(Math.PI / 2), gm, { parent: gl, at: [sd * -0.058 * s, 0.01 * s, -0.01 * s], rot: [0, sd * -0.7, 0] });
      mesh(cushion(0.1 * s, 0.024 * s, 0.07 * s, { bulge: 0.15 }), cuff, { parent: gl, at: [0, 0.012 * s, 0.08 * s] });
    }
  }
  if (lying) {
    tool.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  }
  return done(root, 'gardening', variant, o);
}

/* ================================ GARDEN HOSE ================================ */

export const GARDEN_HOSE_VARIANTS = { 'hose-reel': {}, 'coiled-hose': {}, 'hose-cart': {}, sprinkler: {}, 'spray-nozzle': {} };

function hoseCoils(parent, R, r, n, layers, mat, { rise = 0, axis = 'y' } = {}) {
  const geos = [];
  for (let L = 0; L < layers; L++) for (let i = 0; i < n; i++) {
    const rr = R + L * r * 1.9;
    geos.push(torusGeo(rr, r, axis === 'y' ? [0, r + i * r * 1.95 + rise, 0] : [(i - (n - 1) / 2) * r * 1.95, 0, 0], axis === 'y' ? [Math.PI / 2, 0, 0] : [0, Math.PI / 2, 0], Math.PI * 2, 40));
  }
  return mesh(merge(geos), mat, { parent, name: 'hose' });
}

export function createGardenHose(options = {}) {
  const { o, variant, T } = setup(options, GARDEN_HOSE_VARIANTS, 'garden-hose', { p: '#2f8a3a', s: '#2a2b2e', a: '#f2a516', mat: 'rubber' });
  const root = group(`garden-hose-${variant}`);
  const k = T.k;
  const hoseM = fin(T, T.p, 'rubber');
  hoseM.roughness = 0.5;
  const frameM = T.trim === 'metal' || T.trim === 'steel' ? M.metal('#9aa0a6', 0.35) : fin(T, T.s, 'plastic');
  const accM = fin(T, T.a, 'plastic');
  const hr = 0.009 * (T.chunky ? 1.2 : 1);
  let anim = () => [];
  if (variant === 'hose-reel' || variant === 'hose-cart') {
    const cart = variant === 'hose-cart';
    const R = 0.17 * k, W = 0.2 * k, ay = cart ? 0.3 * k : 0.33 * k;
    const drum = group('drum', { parent: root, at: [0, ay, 0] });
    mesh(new THREE.CylinderGeometry(0.07 * k, 0.07 * k, W, 24).rotateZ(Math.PI / 2), frameM, { parent: drum });
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(R, R, 0.012, 32).rotateZ(Math.PI / 2), frameM, { parent: drum, at: [s * W / 2, 0, 0] });
    hoseCoils(drum, 0.07 * k + hr, hr, Math.floor((W - 0.02) / (hr * 1.95)), T.trim === 'xl' || T.chunky ? 4 : 3, hoseM, { axis: 'x' });
    // crank
    const crank = group('crank', { parent: drum, at: [W / 2 + 0.02, 0, 0] });
    mesh(roundedBox(0.012, 0.1 * k, 0.018, 0.005), accM, { parent: crank, at: [0.002, 0.045 * k, 0] });
    mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 12).rotateZ(Math.PI / 2), accM, { parent: crank, at: [0.03, 0.09 * k, 0] });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 12).rotateZ(Math.PI / 2), frameM, { parent: crank, at: [-0.01, 0, 0] });
    // frame
    for (const s of [-1, 1]) {
      const x = s * (W / 2 + 0.01);
      tube([x, ay, 0], [x, 0.02, cart ? -0.05 : 0.14 * k], 0.012, frameM, { parent: root });
      tube([x, ay, 0], [x, 0.02, -0.14 * k], 0.012, frameM, { parent: root });
      if (!cart) tube([x, 0.015, 0.14 * k], [x, 0.015, -0.14 * k], 0.012, frameM, { parent: root });
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 16).rotateZ(Math.PI / 2), frameM, { parent: root, at: [x, ay, 0] });
    }
    if (!cart) {
      tube([-(W / 2 + 0.01), ay + 0.02, -0.05], [-(W / 2 + 0.01), ay + 0.22 * k, -0.08], 0.011, frameM, { parent: root });
      tube([W / 2 + 0.01, ay + 0.02, -0.05], [W / 2 + 0.01, ay + 0.22 * k, -0.08], 0.011, frameM, { parent: root });
      tube([-(W / 2 + 0.01), ay + 0.22 * k, -0.08], [W / 2 + 0.01, ay + 0.22 * k, -0.08], 0.014, accM, { parent: root });
    } else {
      for (const s of [-1, 1]) wheel(0.1 * k, 0.04, { parent: root, at: [s * (W / 2 + 0.05), 0.1 * k, 0.1 * k], name: s < 0 ? 'wheelL' : 'wheelR', hub: accM });
      tube([-(W / 2 + 0.025), 0.1 * k, 0.1 * k], [W / 2 + 0.025, 0.1 * k, 0.1 * k], 0.008, M.metal('#888', 0.3), { parent: root });
      for (const s of [-1, 1]) {
        tube([s * (W / 2 + 0.01), 0.1 * k, 0.1 * k], [s * (W / 2 + 0.01), ay, 0], 0.011, frameM, { parent: root });
        tube([s * (W / 2 + 0.01), ay, 0], [s * (W / 2 + 0.01), 0.85 * k, -0.25 * k], 0.012, frameM, { parent: root });
      }
      tube([-(W / 2 + 0.01), 0.85 * k, -0.25 * k], [W / 2 + 0.01, 0.85 * k, -0.25 * k], 0.016, accM, { parent: root });
    }
    // hose end with nozzle trailing to the ground
    curveTube([[0, ay - 0.07 * k - hr * 3, 0.06 * k], [0, ay * 0.4, 0.2 * k], [0.05, hr, 0.35 * k], [0.12, hr, 0.45 * k]], hr, hoseM, { parent: root, segments: 32 });
    mesh(new THREE.CylinderGeometry(hr * 1.4, hr * 1.6, 0.09, 12).rotateZ(Math.PI / 2), accM, { parent: root, at: [0.16, hr * 1.6, 0.45 * k] });
    anim = () => [clip('reel', 2, [spinTrack(drum, 'x', 2)])];
  } else if (variant === 'coiled-hose') {
    const R = 0.2 * k * T.w;
    hoseCoils(root, R, hr, T.chunky ? 6 : 5, 1, hoseM);
    // loose end and brass connector
    curveTube([[R, hr, 0], [R + 0.08, hr, 0.1], [R + 0.12, hr, 0.22]], hr, hoseM, { parent: root, segments: 16 });
    mesh(new THREE.CylinderGeometry(hr * 1.5, hr * 1.5, 0.04, 12).rotateX(Math.PI / 2), T.trim === 'metal' ? M.metal('#b8913f', 0.3) : accM, { parent: root, at: [R + 0.125, hr * 1.5, 0.24] });
    if (T.detail) {
      const nz = group('nozzle', { parent: root, at: [0, 0, 0] });
      mesh(roundedBox(0.035, 0.03, 0.15, 0.012), accM, { parent: nz, at: [0, 0.015, 0] });
      mesh(roundedBox(0.03, 0.1, 0.03, 0.01), frameM, { parent: nz, at: [0, 0.03, 0.07], rot: [-0.3, 0, 0] });
    }
  } else if (variant === 'sprinkler') {
    // rotary sprinkler: spike base + spinning arms
    const base = fin(T, T.s, 'plastic');
    mesh(lathe([[0, 0], [0.1 * k, 0], [0.11 * k, 0.012], [0.05 * k, 0.04 * k], [0.02 * k, 0.07 * k], [0, 0.07 * k]], 32), base, { parent: root });
    const head = group('head', { parent: root, at: [0, 0.07 * k, 0] });
    mesh(new THREE.CylinderGeometry(0.02 * k, 0.022 * k, 0.04 * k, 16), accM, { parent: head, at: [0, 0.02 * k, 0] });
    const n = T.chunky ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      curveTube([[0, 0.03 * k, 0], [c * 0.12 * k, 0.04 * k, s * 0.12 * k], [c * 0.15 * k - s * 0.03, 0.055 * k, s * 0.15 * k + c * 0.03]], 0.006 * k, fin(T, T.p, 'plastic'), { parent: head, segments: 12 });
    }
    curveTube([[0.1 * k, 0.01, 0], [0.25, hr, 0.05], [0.45, hr, 0.2]], hr, hoseM, { parent: root, segments: 16 });
    anim = () => [clip('spray', 1.2, [spinTrack(head, 'y', 1.2)])];
  } else {
    // pistol-grip spray nozzle with a short length of hose
    const s = k * (T.chunky ? 1.15 : 1);
    const g = group('nozzle', { parent: root });
    mesh(roundedBox(0.035 * s, 0.035 * s, 0.17 * s, 0.014 * s), fin(T, T.a, T.trim === 'metal' ? 'metal' : 'plastic'), { parent: g, at: [0, 0.12 * s, 0] });
    mesh(roundedBox(0.03 * s, 0.13 * s, 0.035 * s, 0.012 * s), frameM, { parent: g, at: [0, 0.06 * s, 0.06 * s], rot: [-0.25, 0, 0] });
    mesh(roundedBox(0.012 * s, 0.09 * s, 0.015 * s, 0.005), fin(T, T.p, 'plastic'), { parent: g, at: [0, 0.075 * s, 0.025 * s], rot: [-0.25, 0, 0] });
    mesh(new THREE.CylinderGeometry(0.022 * s, 0.018 * s, 0.03 * s, 16).rotateX(Math.PI / 2), M.metal('#b8913f', 0.3), { parent: g, at: [0, 0.12 * s, -0.095 * s] });
    curveTube([[0, 0.01 * s, 0.075 * s], [0, hr, 0.15 * s], [0.08, hr, 0.3 * s], [0.2, hr, 0.35 * s]], hr, hoseM, { parent: root, segments: 16 });
  }
  return done(root, 'garden-hose', variant, o, anim);
}

/* ================================ WATERING CAN ================================ */

export const WATERING_CAN_VARIANTS = { metal: {}, plastic: {}, indoor: {}, 'long-reach': {}, kids: { k: 0.6 } };

export function createWateringCan(options = {}) {
  const { o, variant, T } = setup(options, WATERING_CAN_VARIANTS, 'watering-can', { p: '#3a8a5a', s: '#e9e6df', a: '#f2a516' });
  if (!TRIMS[T.trim]?.mat) T.mat = variant === 'metal' ? 'metal' : 'plastic';
  const root = group(`watering-can-${variant}`);
  const k = T.k;
  const galv = variant === 'metal' && !T.trim;
  const body = galv ? M.metal('#aeb4bb', 0.42) : tm(T, 'p');
  const acc = galv ? M.metal('#8f959c', 0.35) : fin(T, variant === 'kids' ? T.a : T.s, T.mat === 'metal' ? 'metal' : T.mat === 'ceramic' ? 'ceramic' : 'plastic');
  let R, H, spoutLen, rose = true;
  if (variant === 'metal') { R = 0.12; H = 0.26; spoutLen = 0.42; }
  else if (variant === 'plastic' || variant === 'kids') { R = 0.13; H = 0.28; spoutLen = 0.34; }
  else if (variant === 'indoor') { R = 0.075; H = 0.15; spoutLen = 0.3; rose = false; }
  else { R = 0.1; H = 0.2; spoutLen = 0.6; rose = false; }
  R *= k * T.w; H *= k * T.h; spoutLen *= k;
  const g = group('can', { parent: root });
  let prof;
  if (variant === 'plastic' || variant === 'kids') prof = [[R * 0.85, 0], [R, H * 0.15], [R * 1.02, H * 0.55], [R * 0.85, H * 0.88], [R * 0.45, H]];
  else if (variant === 'indoor' || variant === 'long-reach') prof = [[R * 0.9, 0], [R, H * 0.2], [R * 0.95, H * 0.65], [R * 0.6, H * 0.95], [R * 0.35, H]];
  else prof = [[R, 0], [R, H * 0.97], [R * 0.96, H]];
  mesh(vessel(prof, 0.003, 0.004, 40), body, { parent: g, name: 'body' });
  if (variant === 'metal') for (const y of [0.005, H * 0.5]) mesh(new THREE.TorusGeometry(R + 0.001, 0.004, 6, 40), acc, { parent: g, at: [0, y + 0.004, 0], rot: [Math.PI / 2, 0, 0] });
  // spout from low front up and out
  const sx = R * 0.7;
  const tip = [sx + spoutLen * 0.75, H * (variant === 'long-reach' ? 1.05 : 1.2), 0];
  const sr = (variant === 'indoor' || variant === 'long-reach' ? 0.007 : 0.013) * k;
  const tipT = curveTube([[sx, H * 0.12, 0], [sx + spoutLen * 0.3, H * 0.5, 0], tip], sr, body, { parent: g, segments: 24, name: 'spout' });
  void tipT;
  if (rose) {
    const dir = new THREE.Vector3(spoutLen * 0.45, H * 0.7, 0).normalize();
    const rm = mesh(lathe([[sr * 0.9, 0], [sr * 3.2, 0.05 * k], [sr * 3.3, 0.055 * k], [0, 0.056 * k]], 24), acc, { parent: g, at: tip });
    rm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    rm.position.addScaledVector(dir, -0.01);
  }
  // handle
  const hr = (T.chunky ? 0.012 : 0.009) * k;
  if (variant === 'metal') {
    curveTube([[-R * 0.6, H - 0.005, 0], [-R * 0.3, H + 0.11 * k, 0], [R * 0.4, H + 0.11 * k, 0], [R * 0.7, H - 0.005, 0]], hr, acc, { parent: g, segments: 32 });
    curveTube([[-R + 0.004, H * 0.85, 0], [-R - 0.05 * k, H * 0.6, 0], [-R + 0.004, H * 0.2, 0]], hr, acc, { parent: g, segments: 24 });
  } else {
    curveTube([[-R * 0.98, H * 0.45, 0], [-R * 1.35, H * 0.9, 0], [-R * 0.8, H + 0.08 * k, 0], [R * 0.2, H + 0.08 * k, 0], [R * 0.4, H * 0.96, 0]], hr * 1.3, variant === 'kids' ? acc : body, { parent: g, segments: 32 });
    mesh(new THREE.TorusGeometry(R * 0.38, 0.006, 8, 32), acc, { parent: g, at: [0, H, 0], rot: [Math.PI / 2, 0, 0] });
  }
  return done(root, 'watering-can', variant, o);
}

/* ================================ WHEELBARROW ================================ */

export const WHEELBARROW_VARIANTS = { classic: {}, 'two-wheel': {}, 'garden-cart': {}, wagon: {} };

export function createWheelbarrow(options = {}) {
  const { o, variant, T } = setup(options, WHEELBARROW_VARIANTS, 'wheelbarrow', { p: '#2f6fb0', s: '#2a2b2e', a: '#e8402f', mat: 'metal' });
  const root = group(`wheelbarrow-${variant}`);
  const k = T.k;
  const tray = T.trim ? tm(T, 'p', T.mat === 'leather' ? 'plastic' : undefined) : M.paint(T.p, { metallic: 0.3, roughness: 0.45 });
  const frame = T.worn ? M.metal('#6a5a48', 0.7) : fin(T, T.s, 'metal');
  const handle = T.trim === 'wooden' || T.trim === 'rustic' ? fin(T, '#a5733f', 'wood') : frame;
  const grip = fin(T, '#1d1d1d', 'rubber');
  const wheels = [];
  if (variant === 'classic' || variant === 'two-wheel') {
    const two = variant === 'two-wheel';
    const WR = 0.19 * k, W = 0.62 * k * T.w, L = 0.82 * k, D = 0.28 * k * T.h;
    const ty = 0.38 * k;
    mesh(boxVessel(W, D, L, { t: 0.004, base: 0.62, n: 4, lip: 0.012 }), tray, { parent: root, at: [0, ty, -0.02 * k], name: 'tray' });
    const wz = 0.5 * k;
    const wx = two ? [-0.2 * k, 0.2 * k] : [0];
    for (const x of wx) {
      const wh = wheel(WR, 0.09 * k, { parent: root, at: [x, WR, wz], hub: fin(T, T.a, 'plastic'), name: `wheel${wheels.length}` });
      wheels.push(wh);
    }
    tube([-0.24 * k, WR, wz], [0.24 * k, WR, wz], 0.01, frame, { parent: root });
    for (const s of [-1, 1]) {
      const x0 = s * 0.08 * k, x1 = s * 0.27 * k;
      tube([x0 + s * 0.16 * k * (two ? 1 : 0), WR, wz], [x1, ty + 0.05, -0.55 * k], 0.016, handle, { parent: root });
      tube([x1, ty + 0.05, -0.55 * k], [x1 * 1.05, ty + 0.18 * k, -0.95 * k], 0.016, handle, { parent: root });
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.13, 12), grip, { parent: root, at: [x1 * 1.05, ty + 0.18 * k, -0.95 * k], rot: [Math.PI / 2 - 0.3, 0, 0] });
      // leg
      tube([x1 * 0.9, ty + 0.02, -0.3 * k], [x1 * 0.95, 0.0, -0.36 * k], 0.013, frame, { parent: root });
      mesh(roundedBox(0.04, 0.012, 0.08, 0.004), grip, { parent: root, at: [x1 * 0.95, 0.006, -0.36 * k] });
      tube([x1 * 0.9, ty + 0.02, -0.3 * k], [x1 * 0.8, ty + 0.02, 0.15 * k], 0.012, frame, { parent: root });
    }
  } else if (variant === 'garden-cart') {
    const WR = 0.26 * k, W = 0.7 * k * T.w, L = 0.95 * k, D = 0.32 * k * T.h;
    const ty = 0.3 * k;
    mesh(boxVessel(W, D, L, { t: 0.006, base: 0.9, n: 6, lip: 0.01 }), tray, { parent: root, at: [0, ty, 0], name: 'tray' });
    for (const s of [-1, 1]) wheels.push(wheel(WR, 0.08 * k, { parent: root, at: [s * (W / 2 + 0.06 * k), WR, 0.05 * k], spokes: T.trim === 'rustic' ? 8 : 0, hub: fin(T, T.a, 'plastic'), name: s < 0 ? 'wheelL' : 'wheelR' }));
    tube([-(W / 2 + 0.06 * k), WR, 0.05 * k], [W / 2 + 0.06 * k, WR, 0.05 * k], 0.012, frame, { parent: root });
    for (const s of [-1, 1]) {
      tube([s * W * 0.35, WR, 0.05 * k], [s * W * 0.35, ty + 0.005, 0.05 * k], 0.014, frame, { parent: root });
      tube([s * W * 0.4, ty + D * 0.5, -L / 2 - 0.004], [s * 0.22 * k, ty + 0.45 * k, -L / 2 - 0.45 * k], 0.015, handle, { parent: root });
      tube([s * W * 0.4, ty + 0.01, L / 2 - 0.08], [s * W * 0.4, 0, L / 2 - 0.08], 0.014, frame, { parent: root });
    }
    tube([-0.22 * k, ty + 0.45 * k, -L / 2 - 0.45 * k], [0.22 * k, ty + 0.45 * k, -L / 2 - 0.45 * k], 0.02, grip, { parent: root });
  } else {
    // kid's wagon: 4 wheels, steel box, T-handle
    const WR = 0.12 * k, W = 0.45 * k * T.w, L = 0.9 * k, D = 0.14 * k * T.h;
    const ty = WR * 1.75;
    mesh(boxVessel(W, D, L, { t: 0.005, base: 0.97, n: 10, lip: 0.008 }), tray, { parent: root, at: [0, ty, 0], name: 'tray' });
    if (T.trim === 'wooden' || T.trim === 'rustic') for (const s of [-1, 1]) for (let i = 0; i < 3; i++) mesh(roundedBox(0.015, 0.12 * k, 0.015, 0.004), fin(T, '#a5733f', 'wood'), { parent: root, at: [s * (W / 2 + 0.01), ty + D + 0.04 * k, -L / 3 + (i * L) / 3] });
    if (T.trim === 'wooden' || T.trim === 'rustic') for (const s of [-1, 1]) mesh(roundedBox(0.012, 0.03, L, 0.004), fin(T, '#a5733f', 'wood'), { parent: root, at: [s * (W / 2 + 0.01), ty + D + 0.1 * k, 0] });
    for (const zs of [-1, 1]) {
      const z = zs * L * 0.35;
      tube([-(W / 2 + 0.04), WR, z], [W / 2 + 0.04, WR, z], 0.008, frame, { parent: root });
      for (const s of [-1, 1]) {
        wheels.push(wheel(WR, 0.05 * k, { parent: root, at: [s * (W / 2 + 0.04), WR, z], hub: fin(T, T.s, 'plastic'), name: `wheel${wheels.length}` }));
        tube([s * W * 0.3, WR, z], [s * W * 0.3, ty + 0.003, z], 0.01, frame, { parent: root });
      }
    }
    tube([0, WR, L * 0.35], [0, WR * 1.2, L * 0.35 + 0.15], 0.012, frame, { parent: root });
    tube([0, WR * 1.2, L * 0.35 + 0.15], [0, 0.5 * k, L * 0.35 + 0.6 * k], 0.012, frame, { parent: root });
    tube([-0.07, 0.5 * k, L * 0.35 + 0.6 * k], [0.07, 0.5 * k, L * 0.35 + 0.6 * k], 0.018, grip, { parent: root });
  }
  return done(root, 'wheelbarrow', variant, o, () => [clip('roll', 1.5, wheels.map((w) => spinTrack(w, 'x', 1.5)))]);
}

/* ================================ FLOWER POT ================================ */

export const FLOWER_POT_VARIANTS = { 'terracotta-pot': {}, 'glazed-pot': {}, 'hanging-pot': {}, 'window-box': {}, 'seed-tray': {}, 'self-watering-pot': {} };

export function createFlowerPot(options = {}) {
  const { o, variant, T } = setup(options, FLOWER_POT_VARIANTS, 'flower-pot', { p: '#b8603a', s: '#8a4428', a: '#e8435a' });
  if (!TRIMS[T.trim]?.mat) T.mat = variant === 'glazed-pot' ? 'ceramic' : variant === 'terracotta-pot' ? 'matte' : 'plastic';
  const root = group(`flower-pot-${variant}`);
  const k = T.k;
  const potM = variant === 'glazed-pot' && !T.trim ? fin(T, '#2c5e8a', 'ceramic') : tm(T, 'p');
  const soilM = new THREE.MeshStandardMaterial({ name: 'soil', color: '#3b2a1e', roughness: 1 });
  const planted = T.trim !== 'large' || variant !== 'terracotta-pot';
  if (variant === 'terracotta-pot' || variant === 'glazed-pot' || variant === 'self-watering-pot') {
    const R = 0.1 * k * T.w, H = 0.18 * k * T.h;
    let prof;
    if (variant === 'terracotta-pot') prof = [[R * 0.68, 0], [R * 0.92, H * 0.78], [R * 1.05, H * 0.8], [R * 1.05, H]];
    else if (variant === 'glazed-pot') prof = [[R * 0.6, 0], [R * 0.95, H * 0.3], [R * 1.05, H * 0.6], [R * 0.9, H * 0.92], [R * 0.95, H]];
    else prof = [[R * 0.9, 0], [R * 0.95, H * 0.95], [R, H]];
    const seg = T.trim === 'modern' ? 6 : T.trim === 'rustic' ? 10 : 40;
    const pot = mesh(vessel(prof, 0.008 * k, 0.012, seg), potM, { parent: root, at: [0, 0.012, 0], name: 'pot' });
    void pot;
    // saucer
    if (variant !== 'self-watering-pot') mesh(vessel([[R * 0.7, 0], [R * 0.85, 0.012], [R * 0.86, 0.014]], 0.004, 0.003, seg), potM, { parent: root, name: 'saucer' });
    else {
      mesh(vessel([[R * 0.92, 0], [R * 0.95, 0.012]], 0.004, 0.004, 40), fin(T, T.s, 'plastic'), { parent: root });
      mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 10), fin(T, T.a, 'plastic'), { parent: root, at: [R * 0.75, H + 0.03, 0] });
    }
    const top = 0.012 + H * 0.88;
    const rIn = variant === 'terracotta-pot' ? R * 0.88 : variant === 'glazed-pot' ? R * 0.88 : R * 0.88;
    mesh(new THREE.CylinderGeometry(rIn, rIn * 0.95, 0.02, 32), soilM, { parent: root, at: [0, top - 0.01, 0], name: 'soil' });
    if (planted) foliage(root, T, { r: R * 0.8, h: H * (T.trim === 'tall' ? 1.6 : 1.1), n: 8, flowers: T.trim !== 'modern', at: [0, top, 0] });
    if (variant === 'terracotta-pot' && T.detail) mesh(new THREE.TorusGeometry(R * 1.05, 0.003, 6, 40), fin(T, T.a, 'matte'), { parent: root, at: [0, 0.012 + H * 0.9, 0], rot: [Math.PI / 2, 0, 0] });
  } else if (variant === 'hanging-pot') {
    // shepherd's hook stand with a hanging basket pot
    const hookM = fin(T, '#1d1d1d', 'metal');
    const Hs = 1.2 * k;
    tube([0, 0, 0], [0, Hs, 0], 0.008, hookM, { parent: root });
    mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.012, 24), hookM, { parent: root, at: [0, 0.006, 0] });
    curveTube([[0, Hs - 0.01, 0], [0, Hs + 0.1, 0], [0.12, Hs + 0.12, 0], [0.24, Hs + 0.04, 0], [0.25, Hs - 0.04, 0]], 0.007, hookM, { parent: root, segments: 32 });
    const R = 0.13 * k * T.w, H = 0.13 * k;
    const py = Hs - 0.42;
    mesh(vessel([[R * 0.5, 0], [R * 0.85, H * 0.4], [R, H]], 0.006, 0.01, 32), potM, { parent: root, at: [0.25, py, 0], name: 'pot' });
    mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.9, 0.02, 32), soilM, { parent: root, at: [0.25, py + H - 0.02, 0] });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      tube([0.25 + Math.cos(a) * R * 0.97, py + H, Math.sin(a) * R * 0.97], [0.25, Hs - 0.045, 0], 0.0018, hookM, { parent: root });
    }
    // trailing plant
    foliage(root, T, { r: R * 0.9, h: 0.08, n: 9, flowers: true, at: [0.25, py + H - 0.01, 0] });
    const vm = new THREE.MeshStandardMaterial({ name: 'leaf', color: '#3f8a3a', roughness: 0.6 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      curveTube([[0.25 + Math.cos(a) * R * 0.8, py + H - 0.005, Math.sin(a) * R * 0.8], [0.25 + Math.cos(a) * R * 1.15, py + H * 0.6, Math.sin(a) * R * 1.15], [0.25 + Math.cos(a) * R * 1.1, py - 0.12, Math.sin(a) * R * 1.1]], 0.006, vm, { parent: root, segments: 12 });
    }
  } else if (variant === 'window-box') {
    const W = 0.7 * k * T.w, H = 0.16 * k * T.h, D = 0.18 * k;
    mesh(boxVessel(W, H, D, { t: 0.01, base: 0.92, n: 10, lip: 0.006 }), potM, { parent: root, name: 'box' });
    mesh(roundedBox(W * 0.95, 0.02, D * 0.88, 0.006), soilM, { parent: root, at: [0, H * 0.82, 0] });
    for (let i = 0; i < 4; i++) foliage(root, T, { r: 0.06, h: 0.13 * k, n: 6, flowers: true, at: [-W * 0.36 + (i * W * 0.72) / 3, H * 0.82 + 0.01, 0] });
  } else {
    // seed tray: shallow cellular tray with seedlings
    const nx = T.trim === 'large' ? 8 : 6, nz = T.trim === 'large' ? 5 : 4, c = 0.05 * k;
    const W = nx * c + 0.02, D = nz * c + 0.02;
    mesh(boxVessel(W, 0.05 * k, D, { t: 0.003, base: 0.96, n: 12, lip: 0.006 }), tm(T, 'p'), { parent: root, name: 'tray' });
    const cells = [];
    for (let i = 0; i <= nx; i++) cells.push(new THREE.BoxGeometry(0.002, 0.045 * k, D - 0.01).translate(-W / 2 + 0.01 + i * c, 0.0225 * k + 0.003, 0));
    for (let j = 0; j <= nz; j++) cells.push(new THREE.BoxGeometry(W - 0.01, 0.045 * k, 0.002).translate(0, 0.0225 * k + 0.003, -D / 2 + 0.01 + j * c));
    mesh(merge(cells), tm(T, 'p'), { parent: root });
    const sm = new THREE.MeshStandardMaterial({ name: 'leaf', color: '#5aa83a', roughness: 0.6 });
    const soil = [], sprouts = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = -W / 2 + 0.01 + (i + 0.5) * c, z = -D / 2 + 0.01 + (j + 0.5) * c;
      soil.push(new THREE.BoxGeometry(c - 0.003, 0.035 * k, c - 0.003).translate(x, 0.0175 * k + 0.003, z));
      sprouts.push(rodGeo([x, 0.035 * k, z], [x, 0.07 * k, z], 0.0015, 4));
      sprouts.push(new THREE.SphereGeometry(0.008, 6, 4).scale(1.4, 0.3, 0.7).translate(x + 0.007, 0.07 * k, z));
      sprouts.push(new THREE.SphereGeometry(0.008, 6, 4).scale(1.4, 0.3, 0.7).translate(x - 0.007, 0.07 * k, z));
    }
    mesh(merge(soil), soilM, { parent: root });
    mesh(merge(sprouts), sm, { parent: root, name: 'seedlings' });
  }
  return done(root, 'flower-pot', variant, o);
}

/* ================================ BIRD FEEDER ================================ */

export const BIRD_FEEDER_VARIANTS = { 'tube-feeder': {}, birdhouse: {}, 'platform-feeder': {}, 'suet-cage': {}, 'hanging-house-feeder': {} };

export function createBirdFeeder(options = {}) {
  const { o, variant, T } = setup(options, BIRD_FEEDER_VARIANTS, 'bird-feeder', { p: '#a5733f', s: '#5b3a24', a: '#2f7a4a', mat: 'wood' });
  const root = group(`bird-feeder-${variant}`);
  const k = T.k;
  const woodM = tm(T, 'p');
  const roofM = fin(T, T.trim ? T.s : '#5b3a24', T.mat === 'metal' ? 'metal' : T.mat === 'plastic' ? 'plastic' : 'wood');
  const poleM = fin(T, '#1d1d1d', 'metal');
  const seedM = new THREE.MeshStandardMaterial({ name: 'seed', color: '#b89a62', roughness: 1 });
  const hanging = variant === 'tube-feeder' || variant === 'suet-cage' || variant === 'hanging-house-feeder';
  let topY;
  if (hanging) {
    // shepherd's hook pole
    const Hs = 1.5 * k;
    tube([0, 0, 0], [0, Hs, 0], 0.009, poleM, { parent: root });
    mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.014, 24), poleM, { parent: root, at: [0, 0.007, 0] });
    curveTube([[0, Hs - 0.01, 0], [0, Hs + 0.1, 0], [0.12, Hs + 0.12, 0], [0.22, Hs + 0.03, 0], [0.22, Hs - 0.04, 0]], 0.008, poleM, { parent: root, segments: 32 });
    topY = Hs - 0.04;
  }
  const X = hanging ? 0.22 : 0;
  if (variant === 'tube-feeder') {
    const L = 0.32 * k * T.h, R = 0.035 * k * T.w;
    const by = topY - 0.12 - L;
    const clear = fin(T, '#d7ecef', 'glass');
    mesh(new THREE.CylinderGeometry(R, R, L, 24, 1, true), clear, { parent: root, at: [X, by + L / 2, 0], name: 'tube' });
    mesh(new THREE.CylinderGeometry(R * 0.95, R * 0.95, L * 0.7, 20), seedM, { parent: root, at: [X, by + L * 0.35 + 0.005, 0] });
    const capM = T.mat === 'wood' && !T.trim ? fin(T, T.a, 'metal') : roofM;
    mesh(lathe([[0, 0], [R * 1.2, 0], [R * 1.25, 0.015], [R * 0.6, 0.04], [0, 0.045]], 24), capM, { parent: root, at: [X, by + L - 0.003, 0], name: 'cap' });
    mesh(lathe([[0, -0.02], [R * 1.25, -0.02], [R * 1.3, 0.005], [R * 1.05, 0.01], [0, 0.01]], 24), capM, { parent: root, at: [X, by, 0] });
    tube([X, by + L + 0.04, 0], [X, topY, 0], 0.0018, poleM, { parent: root });
    for (const y of [0.04, L * 0.55]) {
      tube([X - R * 1.9, by + y, 0], [X + R * 1.9, by + y, 0], 0.003, capM, { parent: root });
      for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.006, 12).rotateZ(Math.PI / 2), capM, { parent: root, at: [X + s * R * 1.0, by + y + 0.012, 0] });
    }
  } else if (variant === 'suet-cage') {
    const W = 0.13 * k * T.w, H = 0.13 * k, D = 0.04;
    const by = topY - 0.1 - H;
    mesh(roundedBox(W * 0.95, H * 0.95, D * 0.85, 0.005), new THREE.MeshStandardMaterial({ name: 'suet', color: '#d9c99a', roughness: 0.9 }), { parent: root, at: [X, by + H / 2, 0] });
    const gm = [];
    for (let i = 0; i <= 6; i++) { const x = -W / 2 + (i * W) / 6; for (const z of [-D / 2, D / 2]) gm.push(rodGeo([X + x, by, z], [X + x, by + H, z], 0.0015, 4)); }
    for (let j = 0; j <= 6; j++) { const y = by + (j * H) / 6; for (const z of [-D / 2, D / 2]) gm.push(rodGeo([X - W / 2, y, z], [X + W / 2, y, z], 0.0015, 4)); }
    mesh(merge(gm), fin(T, T.trim ? T.p : '#2f6a3a', T.mat === 'wood' ? 'metal' : undefined), { parent: root, name: 'cage' });
    mesh(roundedBox(W + 0.01, 0.012, D + 0.012, 0.004), roofM, { parent: root, at: [X, by + H + 0.006, 0] });
    tube([X - W / 2, by + H + 0.01, 0], [X, topY, 0], 0.0015, poleM, { parent: root });
    tube([X + W / 2, by + H + 0.01, 0], [X, topY, 0], 0.0015, poleM, { parent: root });
  } else {
    // houses and platforms
    let baseY;
    const house = variant === 'birdhouse' || variant === 'hanging-house-feeder';
    const W = (house ? 0.16 : 0.32) * k * T.w, D = (house ? 0.16 : 0.26) * k;
    if (!hanging) {
      const Hp = 1.25 * k;
      const postM = T.mat === 'metal' ? poleM : fin(T, T.trim ? T.s : '#7a5a3a', 'wood');
      mesh(roundedBox(0.07, Hp, 0.07, 0.008), postM, { parent: root, at: [0, Hp / 2, 0] });
      mesh(roundedBox(0.28, 0.025, 0.07, 0.008), postM, { parent: root, at: [0, 0.0125, 0] });
      mesh(roundedBox(0.07, 0.025, 0.28, 0.008), postM, { parent: root, at: [0, 0.0125, 0] });
      baseY = Hp;
    } else baseY = topY - 0.36 * k;
    const bh = 0.018;
    mesh(roundedBox(W + 0.04, bh, D + 0.04, 0.005), woodM, { parent: root, at: [X, baseY + bh / 2, 0] });
    if (house) {
      const Hh = 0.18 * k * T.h;
      const box = mesh(roundedBox(W, Hh, D, 0.006), woodM, { parent: root, at: [X, baseY + bh + Hh / 2, 0] });
      void box;
      const hole = mesh(new THREE.CylinderGeometry(0.02 * k, 0.02 * k, 0.004, 24).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#120c08', roughness: 1 }), { parent: root, at: [X, baseY + bh + Hh * 0.62, D / 2 + 0.0015] });
      void hole;
      tube([X, baseY + bh + Hh * 0.38, D / 2], [X, baseY + bh + Hh * 0.38, D / 2 + 0.04], 0.004, roofM, { parent: root });
      // gable roof
      const ry = baseY + bh + Hh;
      for (const s of [-1, 1]) {
        const p = mesh(roundedBox(W * 0.78, 0.014, D + 0.06, 0.004), roofM, { parent: root, at: [X + s * W * 0.27, ry + W * 0.19, 0], rot: [0, 0, -s * 0.72] });
        void p;
      }
      // gable fill: triangle front/back
      const tri = extrudeOutline([[-W / 2, 0], [W / 2, 0], [0, W * 0.42]], D, { bevel: 0.002, segments: 1 });
      mesh(tri, woodM, { parent: root, at: [X, ry - 0.002, 0] });
      if (hanging) {
        tube([X, ry + W * 0.42, 0], [X, topY, 0], 0.0018, poleM, { parent: root });
        mesh(boxVessel(W + 0.03, 0.025, D + 0.03, { t: 0.004, n: 10 }), woodM, { parent: root, at: [X, baseY, 0] });
      }
      if (T.trim === 'rustic' || T.detail) mesh(new THREE.SphereGeometry(0.012, 10, 8), seedM, { parent: root, at: [X + W * 0.3, baseY + bh + 0.006, D / 2 + 0.008], scale: [1, 0.4, 1] });
    } else {
      // platform with raised edge, 4 corner posts and a roof
      for (const [sx, sz, len, rot] of [[0, -1, W + 0.04, 0], [0, 1, W + 0.04, 0], [-1, 0, D + 0.04, 1], [1, 0, D + 0.04, 1]]) {
        mesh(roundedBox(rot ? 0.012 : len, 0.025, rot ? len : 0.012, 0.004), woodM, { parent: root, at: [X + sx * (W / 2 + 0.014), baseY + bh + 0.0125, sz * (D / 2 + 0.014)] });
      }
      mesh(roundedBox(W * 0.9, 0.012, D * 0.9, 0.004), seedM, { parent: root, at: [X, baseY + bh + 0.006, 0] });
      const ph = 0.2 * k;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.016, ph, 0.016, 0.003), woodM, { parent: root, at: [X + sx * W / 2, baseY + bh + ph / 2, sz * D / 2] });
      for (const s of [-1, 1]) mesh(roundedBox(W * 0.62, 0.014, D + 0.08, 0.004), roofM, { parent: root, at: [X + s * W * 0.27, baseY + bh + ph + W * 0.13, 0], rot: [0, 0, -s * 0.5] });
    }
  }
  return done(root, 'bird-feeder', variant, o);
}
