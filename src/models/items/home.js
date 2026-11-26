// Everyday items, home group: bean bags, pillows, blankets, towels, laundry, cleaning,
// step stools, umbrellas, toilet paper, tissues, candles, bulbs, power, remotes, clocks, hooks.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, cushion, setup, done, fin, tm, hw, anims, slab } from './common.js';
import { drapeGeo, spiralEnd, button, pillowGeo } from './home-util.js';

export * from './home-clean.js';
export * from './home-misc.js';
export * from './home-tech.js';

/* ================================ BEAN BAG ================================ */

export const BEAN_BAG_VARIANTS = { classic: {}, lounger: {}, pouf: {}, 'kids-bean-bag': { k: 0.7 }, 'gaming-chair': {} };

/** Bean-bag body: a squashed sphere deformed into a seat (dent on top, back rise). */
function beanGeo(R, H, { back = 0.5, dent = 0.25, lumpy = 0.03, r }) {
  const g = new THREE.SphereGeometry(1, 48, 32);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let y = v.y;
    // flatten bottom
    if (y < -0.35) y = -0.35 - (y + 0.35) * 0.08;
    // backrest: points behind (z<0) rise
    const bz = Math.max(0, -v.z);
    y += back * bz * bz * Math.max(0, v.y + 0.2);
    // seat dent on top-front
    const fr = Math.max(0, v.y) * Math.max(0, 1 - Math.hypot(v.x * 1.1, v.z - 0.25) * 1.4);
    y -= dent * fr;
    const n = lumpy * Math.sin(v.x * 9 + v.z * 7) * Math.sin(v.y * 8 + v.x * 3);
    p.setXYZ(i, v.x * R * (1 + n), (y + 0.35) * H * 0.75, v.z * R * (1 + n));
  }
  void r;
  g.computeVertexNormals();
  return g;
}

export function createBeanBag(options = {}) {
  const { o, variant, T } = setup(options, BEAN_BAG_VARIANTS, 'bean-bag', { p: '#3d6f9e', s: '#25425e', a: '#d8d2c4', mat: 'nylon' });
  const root = group(`bean-bag-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const pip = tm(T, 's', T.mat === 'fur' ? 'fabric' : undefined);
  let geo;
  if (variant === 'pouf') {
    const R = 0.28 * k * T.w, H = 0.4 * k * T.h;
    if (T.round >= 1.2 || T.soft) {
      // round drum pouf: lathe with rounded edges, piping exactly on the two seams
      const c = 0.06 * k, dome = 0.025 * k;
      const prof = [[0, 0], [R - c, 0]];
      for (let i = 1; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; prof.push([R - c + Math.sin(a) * c, c - Math.cos(a) * c]); }
      prof.push([R * 1.02, H / 2]);
      for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; prof.push([R - c + Math.cos(a) * c, H - c + Math.sin(a) * c]); }
      prof.push([R * 0.5, H + dome * 0.8], [0, H + dome]);
      mesh(lathe(prof, 56), body, { parent: root, name: 'body' });
      for (const y of [c, H - c]) mesh(new THREE.TorusGeometry(R, 0.008 * k, 8, 64), pip, { parent: root, at: [0, y, 0], rot: [Math.PI / 2, 0, 0] });
      mesh(new THREE.SphereGeometry(0.025 * k, 16, 8).scale(1, 0.4, 1), pip, { parent: root, at: [0, H + dome - 0.003, 0] });
    } else {
      // cube pouf with a tufted button and handle
      geo = cushion(R * 2, H, R * 2, { radius: R * 0.3, bulge: 0.12 });
      mesh(geo, body, { parent: root, at: [0, H / 2, 0], name: 'body' });
      mesh(new THREE.SphereGeometry(0.025 * k, 16, 8).scale(1, 0.4, 1), pip, { parent: root, at: [0, H + H * 0.06 - 0.004, 0] });
      curveTube([[R * 1.0, H * 0.62, -0.05], [R * 1.07, H * 0.6, 0], [R * 1.0, H * 0.62, 0.05]], 0.009, pip, { parent: root, segments: 10 });
    }
  } else if (variant === 'lounger') {
    // long L-shaped floor lounger
    const W = 0.75 * k * T.w, L = 1.35 * k, H = 0.32 * k * T.h;
    const seat = cushion(W, H, L, { radius: H * 0.45 * T.round, bulge: 0.2 });
    mesh(seat, body, { parent: root, at: [0, H / 2, 0.15 * k], name: 'body' });
    const back = cushion(W * 0.98, H * 1.1, 0.6 * k, { radius: H * 0.45, bulge: 0.25 });
    mesh(back, body, { parent: root, at: [0, H * 0.95, -0.5 * k], rot: [-0.95, 0, 0], name: 'back' });
    for (const s of [-1, 1]) curveTube([[s * W * 0.5, H * 0.55, 0.8 * k], [s * W * 0.51, H * 0.6, -0.1 * k], [s * W * 0.5, H * 1.25, -0.55 * k]], 0.008, pip, { parent: root, segments: 24 });
  } else {
    const kids = variant === 'kids-bean-bag';
    const gaming = variant === 'gaming-chair';
    const R = 0.45 * k * T.w * (kids ? 0.75 : 1), H = 0.85 * k * T.h * (kids ? 0.7 : 1);
    geo = beanGeo(R, H, { back: gaming ? 1.1 : 0.55 + (T.soft ? 0.1 : 0), dent: 0.28 + T.worn * 0.15, lumpy: T.soft ? 0.05 : 0.025 + T.worn * 0.03 });
    const b = mesh(geo, body, { parent: root, name: 'body' });
    b.position.y = 0;
    // seam/piping ring at the base
    mesh(new THREE.TorusGeometry(R * 0.985, 0.008, 8, 64), pip, { parent: root, at: [0, 0.035 * H / 0.85, 0], rot: [Math.PI / 2, 0, 0], scale: [1, 1, 1] });
    if (gaming) {
      // side pockets + headrest band
      for (const s of [-1, 1]) mesh(cushion(0.05, 0.2 * k, 0.22 * k, { bulge: 0.1 }), pip, { parent: root, at: [s * R * 0.93, H * 0.28, 0], rot: [0, 0, s * 0.12] });
      mesh(roundedBox(R * 0.9, 0.06 * k, 0.02, 0.01), fin(T, T.a), { parent: root, at: [0, H * 1.02, -R * 0.62], rot: [-0.55, 0, 0] });
    }
    if (T.detail >= 1 || kids) {
      // carry handle on the back
      curveTube([[-0.07, H * 0.62, -R * 0.84], [0, H * 0.67, -R * 0.93], [0.07, H * 0.62, -R * 0.84]], 0.012, pip, { parent: root, segments: 12 });
    }
  }
  return done(root, 'bean-bag', variant, o);
}

/* ================================ PILLOW ================================ */

export const PILLOW_VARIANTS = { 'bed-pillow': {}, 'throw-pillow': {}, 'round-cushion': {}, bolster: {}, 'floor-cushion': {}, 'neck-pillow': {} };

export function createPillow(options = {}) {
  const { o, variant, T } = setup(options, PILLOW_VARIANTS, 'pillow', { p: '#f2efe8', s: '#b9c7d6', a: '#5f7b99', mat: 'fabric' });
  const root = group(`pillow-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const sec = tm(T, 's', T.mat === 'fur' ? 'fabric' : undefined);
  if (variant === 'bed-pillow') {
    const W = 0.66 * k * T.w, H = 0.17 * k * T.h * (T.chunky ? 1.25 : 1) * (1 - T.worn * 0.3), D = 0.46 * k * T.d;
    mesh(pillowGeo(W, H, D, { p: 3, q: 0.45, pinch: T.worn ? 0.06 : 0.02 }), body, { parent: root, at: [0, H / 2, 0], name: 'body' });
    if (T.lux || T.detail >= 2) mesh(slab(W + 0.07, 0.01, D + 0.07, { bulge: 0 }), sec, { parent: root, at: [0, H / 2, 0] });
  } else if (variant === 'throw-pillow') {
    const S = 0.45 * k * T.w, H = 0.17 * k * T.h * (T.chunky ? 1.2 : 1);
    mesh(pillowGeo(S, H, S, { p: 2, q: 0.6, pinch: 0.12 }), body, { parent: root, at: [0, H / 2, 0], name: 'body' });
    if (T.detail >= 1 || T.lux) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      mesh(new THREE.ConeGeometry(0.012, 0.045, 10), fin(T, T.a, 'fabric'), { parent: root, at: [sx * S * 0.57, H / 2 - 0.004, sz * S * 0.57], rot: [sz * 1.2, 0, -sx * 1.2], name: 'tassel' });
    }
    else if (T.pattern) mesh(new THREE.TorusGeometry(1, 0.005, 6, 64).scale(S * 0.5, S * 0.5, 1), sec, { parent: root, at: [0, H / 2, 0], rot: [Math.PI / 2, 0, 0] }).scale.set(1.02, 1.02, 1);
    if (!T.pattern && !T.soft) button(root, [0, H - 0.003, 0], 0.018, sec);
  } else if (variant === 'round-cushion') {
    const R = 0.21 * k * T.w, H = 0.08 * k * T.h * (T.chunky ? 1.3 : 1);
    const prof = [[0, 0], [R * 0.8, 0.002], [R * 0.97, H * 0.2], [R, H * 0.5], [R * 0.97, H * 0.8], [R * 0.8, H], [R * 0.3, H * 1.12], [0, H * 1.0]];
    mesh(lathe(prof, 48), body, { parent: root, name: 'body' });
    mesh(new THREE.TorusGeometry(R, 0.006, 6, 48), sec, { parent: root, at: [0, H * 0.5, 0], rot: [Math.PI / 2, 0, 0] });
    button(root, [0, H * 1.0, 0], 0.02, sec);
    if (T.detail >= 1) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; curveTube([[0, H * 1.02, 0], [Math.cos(a) * R * 0.5, H * 1.08, Math.sin(a) * R * 0.5], [Math.cos(a) * R * 0.86, H * 0.86, Math.sin(a) * R * 0.86]], 0.003, sec, { parent: root, segments: 10, radialSegments: 5 }); }
  } else if (variant === 'bolster') {
    const R = 0.1 * k * T.h, L = 0.5 * k * T.w;
    const g = new THREE.CapsuleGeometry(R, L - 2 * R, 8, 32).rotateZ(Math.PI / 2);
    g.scale(1, 1, 1);
    mesh(g, body, { parent: root, at: [0, R, 0], name: 'body' });
    for (const s of [-1, 1]) {
      mesh(new THREE.TorusGeometry(R * 0.99, 0.006, 6, 40), sec, { parent: root, at: [s * (L / 2 - R), R, 0], rot: [0, Math.PI / 2, 0] });
      button(root, [s * (L / 2 - 0.004), R, 0], 0.018, sec, [0, 0, Math.PI / 2]);
      if (T.detail >= 1 || T.lux) mesh(new THREE.ConeGeometry(0.014, 0.05, 10), fin(T, T.a, 'fabric'), { parent: root, at: [s * (L / 2 + 0.008), R - 0.03, 0], rot: [0, 0, s * 0.3] });
    }
  } else if (variant === 'floor-cushion') {
    const S = 0.7 * k * T.w, H = 0.14 * k * T.h * (T.chunky ? 1.2 : 1);
    mesh(cushion(S, H, S, { radius: H * 0.4, bulge: 0.25 }), body, { parent: root, at: [0, H / 2, 0], name: 'body' });
    const n = T.detail >= 2 ? 3 : 2;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = (i - (n - 1) / 2) * S / (n + 0.5), z = (j - (n - 1) / 2) * S / (n + 0.5);
      button(root, [x, H + H * 0.12 * (1 - (2 * x / S) ** 2) * (1 - (2 * z / S) ** 2) - 0.006, z], 0.018, sec);
    }
    if (T.rugged || T.detail >= 1) curveTube([[-0.08, H * 0.65, S / 2 + 0.003], [0, H * 0.68, S / 2 + 0.03], [0.08, H * 0.65, S / 2 + 0.003]], 0.008, sec, { parent: root, segments: 10 });
  } else {
    // neck pillow: U-shaped torus lying flat, opening towards +z
    const R = 0.11 * k * T.w, r = 0.05 * k * T.h * (T.chunky ? 1.2 : 1);
    const gap = Math.PI * 0.42, arc = Math.PI * 2 - gap, t1 = Math.PI / 2 + gap / 2, t2 = t1 + arc;
    mesh(new THREE.TorusGeometry(R, r, 20, 48, arc).rotateZ(t1).rotateX(Math.PI / 2), body, { parent: root, at: [0, r, 0], name: 'body' });
    for (const a of [t1, t2]) mesh(new THREE.SphereGeometry(r, 20, 14), body, { parent: root, at: [Math.cos(a) * R, r, Math.sin(a) * R] });
    if (T.detail >= 1) curveTube([[Math.cos(t1) * R, r * 1.6, Math.sin(t1) * R], [0, r * 1.7, R * 1.05], [Math.cos(t2) * R, r * 1.6, Math.sin(t2) * R]], 0.006, sec, { parent: root, segments: 12 });
    else curveTube([[-r * 0.8, r * 0.3, -R - r * 0.9], [0, r * 0.05, -R - r * 1.3], [r * 0.8, r * 0.3, -R - r * 0.9]], 0.005, sec, { parent: root, segments: 10 });
  }
  return done(root, 'pillow', variant, o);
}

/* ================================ BLANKET ================================ */

export const BLANKET_VARIANTS = { 'folded-blanket': {}, 'rolled-blanket': {}, quilt: { pattern: 'check' }, 'throw-blanket': {} };

/** Folded cloth stack: n layers, each with a rounded fold on the front edge. */
function foldedStack(root, W, D, layerH, n, mats, { offset = 0, y0 = 0, fringe = null } = {}) {
  let y = y0;
  for (let i = 0; i < n; i++) {
    const m = mats[i % mats.length];
    const g = group('layer', { parent: root, at: [(i % 2 ? 1 : -1) * offset, 0, 0] });
    mesh(slab(W, layerH, D, { bulge: 0.12, r: layerH * 0.48 }), m, { parent: g, at: [0, y + layerH / 2, 0] });
    if (fringe && i === n - 1) for (let f = 0; f < 14; f++) mesh(new THREE.CylinderGeometry(0.003, 0.002, 0.035, 5), fringe, { parent: g, at: [-W / 2 + 0.02 + f * (W - 0.04) / 13, y + layerH * 0.5, D / 2 + 0.014], rot: [Math.PI / 2 - 0.2, 0, 0] });
    y += layerH * 0.97;
  }
  return y;
}

export function createBlanket(options = {}) {
  const { o, variant, T } = setup(options, BLANKET_VARIANTS, 'blanket', { p: '#8a4a3a', s: '#e3d6bd', a: '#3b4d5e', mat: 'fabric', pattern: undefined });
  const root = group(`blanket-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const sec = tm(T, 's', T.mat === 'fur' ? 'fabric' : undefined);
  const lay = (T.chunky ? 0.035 : 0.022) * (T.mat === 'fur' ? 1.4 : 1);
  if (variant === 'folded-blanket') {
    const W = 0.5 * k * T.w, D = 0.36 * k * T.d;
    const n = T.chunky ? 3 : 4;
    foldedStack(root, W, D, lay, n, [body], { offset: 0.004 + T.worn * 0.01 });
    // satin binding edge on the visible side
    if (T.lux || T.detail >= 1) mesh(roundedBox(W * 1.002, lay * n * 0.95, 0.012, 0.005), sec, { parent: root, at: [0, lay * n * 0.48, D / 2 - 0.004] });
  } else if (variant === 'rolled-blanket') {
    const R = 0.1 * k * T.h * (T.chunky ? 1.15 : 1), L = 0.6 * k * T.w;
    mesh(new THREE.CylinderGeometry(R, R, L, 40).rotateZ(Math.PI / 2), body, { parent: root, at: [0, R, 0], name: 'roll' });
    for (const s of [-1, 1]) {
      spiralEnd(root, s * (L / 2 + 0.002), R, R * 0.96, 3.2, 0.004, sec);
      mesh(new THREE.TorusGeometry(R * 1.01, 0.008, 8, 40), T.rugged || T.detail ? M.matte('#4a3524') : sec, { parent: root, at: [s * L * 0.28, R, 0], rot: [0, Math.PI / 2, 0], name: 'strap' });
    }
    if (T.detail >= 1 || T.rugged) curveTube([[-L * 0.28, R * 2, 0], [-L * 0.1, R * 2 + 0.06, 0], [L * 0.1, R * 2 + 0.06, 0], [L * 0.28, R * 2, 0]], 0.007, M.matte('#4a3524'), { parent: root, segments: 16 });
  } else if (variant === 'quilt') {
    const W = 0.55 * k * T.w, D = 0.4 * k * T.d;
    const qm = fin(T, T.p, T.mat === 'fur' ? 'fabric' : T.mat, { pattern: T.pattern ?? 'check' });
    const y = foldedStack(root, W, D, lay * 1.4, 3, [qm, sec]);
    // quilting stitches on top
    for (let i = -2; i <= 2; i++) curveTube([[i * W / 6, y + lay * 0.25, -D * 0.46], [i * W / 6, y + lay * 0.32, 0], [i * W / 6, y + lay * 0.25, D * 0.46]], 0.0018, fin(T, T.a, 'fabric'), { parent: root, segments: 8, radialSegments: 4 });
  } else {
    // throw blanket stack: two different throws, top with fringe, slightly askew
    const W = 0.46 * k * T.w, D = 0.32 * k * T.d;
    const y = foldedStack(root, W, D, lay, 2, [sec], {});
    const top = group('top', { parent: root, rot: [0, 0.18, 0] });
    foldedStack(top, W * 0.95, D * 0.9, lay, 2, [body], { y0: y, fringe: fin(T, T.p, 'fabric') });
  }
  return done(root, 'blanket', variant, o);
}

/* ================================ TOWEL ================================ */

export const TOWEL_VARIANTS = { 'bath-towel': {}, 'hand-towel': {}, 'rolled-towels': {}, 'towel-stack': {}, 'towel-rack': {} };

function foldedTowel(parent, W, D, H, mat, band, at = [0, 0, 0]) {
  const g = group('towel', { parent, at });
  mesh(slab(W, H, D, { bulge: 0.18, r: H * 0.48 }), mat, { parent: g, at: [0, H / 2, 0] });
  // woven dobby band across the folded towel
  if (band) mesh(roundedBox(W * 0.12, H * 1.02, D * 1.01, H * 0.45), band, { parent: g, at: [W * 0.28, H / 2, 0] });
  return g;
}

export function createTowel(options = {}) {
  const { o, variant, T } = setup(options, TOWEL_VARIANTS, 'towel', { p: '#f2efe8', s: '#7fa7c9', a: '#c9ced4', mat: 'fabric' });
  const root = group(`towel-${variant}`);
  const k = T.k;
  const body = tm(T, 'p');
  const band = T.slim ? null : fin(T, T.s, 'fabric');
  const thick = (T.chunky || T.lux ? 0.024 : 0.017) * (1 - T.worn * 0.35);
  if (variant === 'bath-towel') {
    foldedTowel(root, 0.34 * k * T.w, 0.26 * k * T.d, thick * 4 * T.h, body, band);
  } else if (variant === 'hand-towel') {
    const g = foldedTowel(root, 0.24 * k * T.w, 0.17 * k * T.d, thick * 3 * T.h, body, band);
    // hanging loop
    curveTube([[-0.02, thick * 2.8, -0.085 * k], [0, thick * 3.1, -0.12 * k], [0.02, thick * 2.8, -0.085 * k]], 0.003, fin(T, T.s, 'fabric'), { parent: g, segments: 10 });
  } else if (variant === 'rolled-towels') {
    const R = 0.055 * k * T.h, L = 0.3 * k * T.w;
    const spots = [[-R, R], [R, R], [0, R * 2.72]];
    if (T.k > 1.1) spots.push([-R * 2, R], [R * 2, R]);
    spots.forEach(([z, y], i) => {
      const m = i % 2 && band ? fin(T, T.s, 'fabric') : body;
      mesh(new THREE.CylinderGeometry(R, R, L, 32).rotateZ(Math.PI / 2), m, { parent: root, at: [0, y, z] });
      spiralEnd(root, L / 2 + 0.002, y, R * 0.95, 2.5, 0.003, m).position.z = z;
    });
  } else if (variant === 'towel-stack') {
    const n = T.k > 1.1 ? 5 : 4;
    const H = thick * 3.2 * T.h;
    for (let i = 0; i < n; i++) foldedTowel(root, 0.32 * k * T.w * (1 - i * 0.03), 0.24 * k * T.d * (1 - i * 0.03), H, i % 2 ? fin(T, T.s, 'fabric') : body, i % 2 ? null : band, [(i % 2 ? 0.006 : -0.004), i * H * 0.98, 0]);
  } else {
    // freestanding towel rack with a towel draped over the top bar
    const W = 0.55 * k * T.w, Ht = 0.85 * k * T.h, D = 0.3 * k;
    const fm = T.mat === 'wood' || T.trim === 'rustic' || T.trim === 'bamboo' ? fin(T, T.trim === 'bamboo' ? '#d1b072' : '#a5733f', 'wood') : T.lux ? M.metal('#d6a93c', 0.22) : M.chrome();
    const rr = T.mat === 'wood' ? 0.012 : 0.008;
    for (const sx of [-1, 1]) {
      curveTube([[sx * W / 2, 0.012, -D / 2], [sx * W / 2, Ht * 0.5, -0.02], [sx * W / 2, Ht, 0]], rr, fm, { parent: root, segments: 16 });
      curveTube([[sx * W / 2, 0.012, D / 2], [sx * W / 2, Ht * 0.5, 0.02], [sx * W / 2, Ht, 0]], rr, fm, { parent: root, segments: 16 });
      mesh(new THREE.SphereGeometry(rr * 1.4, 10, 8), fm, { parent: root, at: [sx * W / 2, Ht, 0] });
      for (const sz of [-1, 1]) mesh(new THREE.SphereGeometry(rr * 1.2, 10, 8).scale(1, 0.6, 1), M.plastic('#202020'), { parent: root, at: [sx * W / 2, rr * 0.6, sz * D / 2] });
    }
    mesh(new THREE.CylinderGeometry(rr, rr, W, 12).rotateZ(Math.PI / 2), fm, { parent: root, at: [0, Ht, 0] });
    mesh(new THREE.CylinderGeometry(rr, rr, W, 12).rotateZ(Math.PI / 2), fm, { parent: root, at: [0, Ht * 0.45, -D * 0.27] });
    const t = thick * 0.9;
    const drop = Ht * 0.55;
    const towel = mesh(drapeGeo([[-0.06, Ht - drop], [-0.035, Ht - drop * 0.5], [-0.016, Ht - 0.005], [0, Ht + rr + t / 2], [0.016, Ht - 0.005], [0.035, Ht - drop * 0.4], [0.05, Ht - drop * 0.8]], t, W * 0.8), body, { parent: root, name: 'towel' });
    { const g = towel.geometry, p = g.attributes.position; for (let i = 0; i < p.count; i++) { const dy = Math.max(0, Ht - p.getY(i)); p.setZ(i, p.getZ(i) + Math.sign(p.getZ(i)) * 0.006 * (1 + Math.sin(p.getX(i) * 45)) * Math.min(1, dy / 0.12)); } g.computeVertexNormals(); }
    if (band) mesh(drapeGeo([[-0.062, Ht - drop + 0.06], [-0.06, Ht - drop + 0.02]], t * 1.3, W * 0.8), band, { parent: root });
  }
  return done(root, 'towel', variant, o);
}
