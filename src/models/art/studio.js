// Studio & gallery: art supplies, pottery wheels (spinning), ceramics with glaze patterns,
// gallery pedestals and gallery benches.
import { THREE, M, mesh, group, roundedBox, lathe, curveTube, extrudeOutline, cushion, tube, setup, done, fin, mainMat, accentMat, roughen, vnoise, capTop, paintedPlane, artFn, mergeGeometries } from './common.js';
import { seat } from './sculpture.js';
import { beam } from './canvas.js';
import { clip, spinTrack } from '../../core/animation.js';

const C = (h) => new THREE.Color(h);
const dbl = (m) => { const c = m.clone(); c.side = THREE.DoubleSide; return c; };

/** Smooth an outer profile ([r, y] from bottom centre to rim) and make it a closed hollow wall. */
export function hollowProfile(outer, t, n = 36) {
  const sp = new THREE.SplineCurve(outer.slice(1).map(([r, y]) => new THREE.Vector2(r, y)));
  const pts = [[0, 0], ...sp.getPoints(n).map((p) => [Math.max(0.001, p.x), p.y])];
  const rim = pts[pts.length - 1];
  const inner = pts.slice(1).map(([r, y]) => [Math.max(0.0015, r - t), Math.max(t, y)]).reverse();
  return [...pts, [rim[0] - t * 0.5, rim[1] + t * 0.35], ...inner, [0.0005, t]];
}
/** Radius of a profile at height y (outer part only). */
function rAt(outer, y) {
  for (let i = 1; i < outer.length; i++) {
    const [r0, y0] = outer[i - 1], [r1, y1] = outer[i];
    if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / Math.max(1e-6, y1 - y0);
  }
  return outer[outer.length - 1][0];
}

/* ================================ CERAMICS ================================ */

export const VASE_VARIANTS = {
  amphora: { prof: [[0, 0], [0.06, 0], [0.07, 0.03], [0.14, 0.18], [0.16, 0.3], [0.12, 0.42], [0.06, 0.5], [0.05, 0.55], [0.07, 0.58]], glaze: 'bands', c: ['#c4632e', '#1b1b1b', '#e2c79a'] },
  bottle: { prof: [[0, 0], [0.08, 0], [0.1, 0.05], [0.1, 0.2], [0.07, 0.26], [0.03, 0.3], [0.028, 0.38], [0.035, 0.4]], glaze: 'drip', c: ['#2c5d7c', '#e8e2d2', '#8a5a3a'] },
  bowl: { prof: [[0, 0], [0.05, 0], [0.12, 0.04], [0.16, 0.09], [0.17, 0.12]], glaze: 'wave', c: ['#f2eee4', '#2a5fa8', '#d9c9a8'], t: 0.007 },
  urn: { prof: [[0, 0], [0.07, 0], [0.07, 0.03], [0.04, 0.06], [0.05, 0.09], [0.14, 0.2], [0.15, 0.3], [0.11, 0.38], [0.12, 0.42]], glaze: 'crackle', c: ['#9fb8a0', '#3a4a3c', '#e8e2d2'] },
  jug: { prof: [[0, 0], [0.07, 0], [0.09, 0.06], [0.1, 0.14], [0.08, 0.22], [0.06, 0.27], [0.07, 0.3]], glaze: 'speckle', c: ['#e9dfc9', '#5a4636', '#b06a3a'] },
  'moon-jar': { prof: [[0, 0], [0.06, 0], [0.14, 0.06], [0.17, 0.17], [0.14, 0.28], [0.07, 0.33], [0.07, 0.35]], glaze: 'ombre', c: ['#f4f1ea', '#d8d0c0', '#bfb39c'] },
  'bud-vase': { prof: [[0, 0], [0.04, 0], [0.05, 0.04], [0.045, 0.1], [0.015, 0.18], [0.012, 0.22], [0.018, 0.23]], glaze: 'ombre', c: ['#2a1f4a', '#d13d6a', '#f2c14e'], t: 0.004 },
  planter: { prof: [[0, 0], [0.1, 0], [0.11, 0.02], [0.14, 0.2], [0.155, 0.21]], glaze: 'dots', c: ['#e76f51', '#f4efe6', '#264653'] },
  goblet: { prof: [[0, 0], [0.06, 0], [0.06, 0.01], [0.015, 0.03], [0.012, 0.1], [0.06, 0.13], [0.09, 0.2], [0.095, 0.24]], glaze: 'bands', c: ['#1d3557', '#a8dadc', '#e63946'], t: 0.005 },
  gourd: { prof: [[0, 0], [0.06, 0], [0.11, 0.05], [0.12, 0.11], [0.08, 0.18], [0.07, 0.2], [0.08, 0.25], [0.06, 0.31], [0.025, 0.35], [0.025, 0.39]], glaze: 'drip', c: ['#6b3a2a', '#d9a55a', '#2a1a12'] },
};

function glazeColor(kind, cols, u, a, seed) {
  const [c0, c1, c2] = cols.map(C);
  switch (kind) {
    case 'bands': { const b = Math.floor(u * 9); return b % 3 === 1 ? c1 : b % 3 === 2 && Math.sin(a * 12) > 0 ? c2 : c0; }
    case 'drip': { const edge = 0.62 - 0.25 * Math.pow(vnoise(a * 2.5, seed, 1), 3) * 2; return u > edge ? c0 : u > edge - 0.03 ? c2 : c1; }
    case 'wave': return Math.abs(u - 0.6 - 0.08 * Math.sin(a * 6)) < 0.07 ? c1 : u < 0.15 ? c2 : c0;
    case 'crackle': { const n = Math.abs(vnoise(a * 6, u * 14, seed) - 0.5); return n < 0.03 ? c1 : c0.clone().lerp(c2, u * 0.4); }
    case 'speckle': { const h = Math.sin(a * 913.1 + u * 3711.7) * 43758.5; return h - Math.floor(h) > 0.93 ? c1 : u > 0.8 ? c2 : c0; }
    case 'dots': { const da = ((a / (Math.PI * 2)) * 14) % 1, du = (u * 8) % 1; return Math.hypot(da - 0.5, du - 0.5) < 0.25 && u > 0.15 && u < 0.92 ? c2 : u > 0.92 ? c1 : c0; }
    case 'kintsugi': { const n = Math.abs(vnoise(a * 3, u * 6, seed) - 0.5); return n < 0.035 ? C('#e0b04a') : c0; }
    default: return c0.clone().lerp(c1, u).lerp(c2, Math.max(0, u - 0.7) * 2);
  }
}

function colorize(geo, H, kind, cols, seed) {
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const c = glazeColor(kind, cols, Math.max(0, Math.min(1, p.getY(i) / H)), Math.atan2(p.getZ(i), p.getX(i)) + Math.PI, seed);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

export function createVase(options = {}) {
  const { o, variant, trim, T, V } = setup(options, VASE_VARIANTS, 'ceramic-vase', { finish: 'ceramic' });
  const root = group(`vase-${variant}`);
  const sr = T.pop ? 1.2 : T.slim ? 0.85 : T.chunky ? 1.12 : 1, sy = T.pop ? 0.9 : T.slim ? 1.15 : T.chunky ? 0.85 : T.trim === 'glass' ? 1.1 : 1;
  const outer = V.prof.map(([r, y]) => [r * sr, y * sy]);
  const H = outer[outer.length - 1][1];
  const t = (V.t ?? 0.006) * (T.chunky ? 2 : 1);
  const prof = hollowProfile(outer, t);
  const seg = T.facet ? 12 : 64;
  const geo = lathe(prof, seg);
  if (T.rough) roughen(geo, 0.004, 25);
  let mat;
  const vcol = !T.trim || T.pop || T.trim === 'gold' || T.rough || T.trim === 'mini' || T.trim === 'grand';
  if (vcol) {
    const kind = T.trim === 'gold' ? 'kintsugi' : T.rough ? 'bands' : V.glaze;
    const cols = T.trim === 'gold' ? ['#141416', '#141416', '#141416'] : T.pop ? ['#ffd400', '#ff2f6d', '#1e8fff'] : T.rough ? ['#b0643a', '#2a1d16', '#c98a5a'] : (o.color && !trim ? [o.color, V.c[1], V.c[2]] : V.c);
    colorize(geo, H, kind, cols, 3);
    mat = new THREE.MeshPhysicalMaterial({ name: 'glaze', vertexColors: true, roughness: T.rough ? 0.85 : 0.2, clearcoat: T.rough ? 0 : 0.9, clearcoatRoughness: 0.08, metalness: T.trim === 'gold' ? 0.3 : 0 });
  } else mat = T.trim === 'wood' ? M.wood('walnut') : mainMat(T);
  if (T.trim === 'glass') mat = dbl(mat);
  const v = mesh(geo, mat, { parent: root, name: 'vase' });
  void v;
  const hm = mat;
  const hr = 0.012 * (T.chunky ? 1.4 : 1);
  if (variant === 'amphora' || variant === 'urn') {
    const yTop = H * (variant === 'amphora' ? 0.86 : 0.85), yBot = H * (variant === 'amphora' ? 0.55 : 0.6);
    for (const s of [-1, 1]) {
      const r1 = rAt(outer, yTop) - hr * 0.5, r2 = rAt(outer, yBot) - hr * 0.5;
      curveTube([[s * r1, yTop, 0], [s * (r1 + 0.06), yTop + 0.01, 0], [s * (r2 + 0.06), (yTop + yBot) / 2, 0], [s * r2, yBot, 0]], hr, hm, { parent: root, segments: 24, radialSegments: 10 });
    }
  } else if (variant === 'jug') {
    const r1 = rAt(outer, H * 0.85) - hr * 0.5, r2 = rAt(outer, H * 0.4) - hr * 0.5;
    curveTube([[-r1, H * 0.85, 0], [-(r1 + 0.07), H * 0.82, 0], [-(r2 + 0.06), H * 0.5, 0], [-r2, H * 0.4, 0]], hr * 1.2, hm, { parent: root, segments: 24, radialSegments: 10 });
    const sp = new THREE.ConeGeometry(0.03, 0.06, 16, 1, true).rotateZ(-Math.PI / 2 - 0.5).scale(1, 0.5, 1);
    mesh(sp, dbl(hm), { parent: root, at: [rAt(outer, H) + 0.012, H - 0.006, 0] });
  } else if (variant === 'planter') {
    const rs = rAt(outer, H - 0.03) - t;
    mesh(new THREE.CircleGeometry(rs, 32).rotateX(-Math.PI / 2), M.matte('#3b2a1e', 0.98), { parent: root, at: [0, H - 0.03, 0], name: 'soil' });
    const lm = M.foliage('#3f8a3a');
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2, l = 0.12 + (i % 3) * 0.05;
      const leaf = mesh(new THREE.SphereGeometry(1, 10, 6).scale(0.025, l, 0.008), lm, { parent: root, at: [Math.cos(a) * 0.02, H - 0.03 + l * 0.9, Math.sin(a) * 0.02] });
      leaf.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      leaf.position.x += Math.cos(a) * l * 0.4; leaf.position.z += Math.sin(a) * l * 0.4;
    }
  } else if (variant === 'bud-vase') {
    curveTube([[0, 0.004, 0], [0, H * 0.6, 0], [0.005, H + 0.08, 0], [0.02, H + 0.18, 0.01]], 0.002, M.foliage('#3f8a3a'), { parent: root, segments: 10, radialSegments: 5 });
    mesh(new THREE.SphereGeometry(0.018, 12, 8).scale(1, 0.8, 1), fin(T, '#e24a6a', 'fabric'), { parent: root, at: [0.02, H + 0.19, 0.01] });
  }
  return done(root, 'ceramic-vase', variant, o, [], T);
}

/* =============================== POTTERY WHEEL =============================== */

export const WHEEL_VARIANTS = { electric: {}, 'kick-wheel': {}, tabletop: {}, studio: {} };

function claypot(parent, T, s = 1) {
  const outer = [[0, 0], [0.06, 0], [0.075, 0.04], [0.08, 0.1], [0.065, 0.15], [0.07, 0.17]].map(([r, y]) => [r * s, y * s]);
  return mesh(lathe(hollowProfile(outer, 0.008 * s), 40), fin(T, T.trim === 'black' ? '#6d6a66' : '#a8693e', 'clay'), { parent, name: 'clay' });
}

export function createPotteryWheel(options = {}) {
  const { o, variant, trim, T } = setup(options, WHEEL_VARIANTS, 'pottery-wheel', { p: '#e9e7e2', finish: 'paint', a: '#2b2c2f' });
  const root = group(`wheel-${variant}`);
  const body = T.trim === 'wood' ? M.wood('oak') : T.kids ? fin(T, T.p, 'plastic') : T.pop ? fin(T, T.p, 'pop') : T.rough ? fin(T, '#8c8a84', 'weathered') : T.trim && !['white', 'black'].includes(T.trim) ? mainMat(T) : fin(T, T.p, 'paint');
  const dark = fin(T, '#2b2c2f', 'plastic');
  const steel = T.trim === 'gold' ? fin(T, '', 'gold') : T.trim === 'bronze' ? fin(T, '#8a5a30', 'bronze') : M.metal('#b5b8bc', 0.3);
  const anims = [];
  let headY;
  const head = (y, R = 0.15, parent = root) => {
    const h = group('wheelhead', { parent, at: [0, y, 0] });
    mesh(new THREE.CylinderGeometry(R, R, 0.025, 48), steel, { parent: h, at: [0, 0.0125, 0] });
    for (let i = 0; i < 3; i++) mesh(new THREE.TorusGeometry(R * (0.35 + i * 0.22), 0.0015, 4, 48).rotateX(Math.PI / 2), M.metal('#7c8085', 0.4), { parent: h, at: [0, 0.025, 0] });
    const pot = claypot(h, T, R / 0.15);
    pot.position.y = 0.024;
    if (parent === root) anims.push(spinTrack(h, 'y', 0.8, 1));
    return h;
  };
  if (variant === 'kick-wheel') {
    const W = 0.9, D = 0.75, Ht = 0.62;
    const wm = T.trim && !['wood', 'weathered'].includes(T.trim) ? body : M.wood('oak');
    for (const x of [-1, 1]) for (const z of [-1, 1]) mesh(roundedBox(0.06, Ht, 0.06, 0.01), wm, { parent: root, at: [x * W / 2, Ht / 2, z * D / 2] });
    for (const z of [-1, 1]) mesh(roundedBox(W + 0.06, 0.06, 0.05, 0.01), wm, { parent: root, at: [0, 0.12, z * D / 2] });
    mesh(roundedBox(W + 0.1, 0.04, 0.34, 0.01), wm, { parent: root, at: [0, Ht + 0.02, D / 2 - 0.2] });
    mesh(roundedBox(0.4, 0.04, D + 0.06, 0.01), wm, { parent: root, at: [-W / 2 + 0.15, Ht + 0.02, 0], name: 'seat' });
    mesh(roundedBox(0.08, 0.05, D + 0.06, 0.01), wm, { parent: root, at: [0.15, 0.12, 0] });
    const fly = group('flywheel', { parent: root, at: [0.15, 0.16, 0] });
    mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.07, 48), T.rough ? fin(T, '#77736c', 'weathered') : fin(T, '#8d8a85', 'concrete'), { parent: fly, at: [0, 0.035, 0] });
    mesh(new THREE.CylinderGeometry(0.02, 0.02, Ht - 0.04, 12), steel, { parent: fly, at: [0, (Ht - 0.04) / 2 + 0.03, 0] });
    anims.push(spinTrack(fly, 'y', 0.8, 1));
    headY = Ht - 0.03 + 0.16;
    head(headY - 0.16 + 0.02 - 0.01, 0.14, fly);
    // splash ring around the head, resting on the front table board
    mesh(lathe([[0.17, 0], [0.2, 0], [0.2, 0.08], [0.19, 0.08], [0.19, 0.01], [0.17, 0.01]], 40), dark, { parent: root, at: [0.15, Ht + 0.04, 0] });
    mesh(roundedBox(0.44, 0.04, D * 0.55, 0.01), wm, { parent: root, at: [0.15, Ht + 0.02, -0.05] });
  } else {
    const s = variant === 'tabletop' ? 0.6 : 1;
    const bh = (variant === 'tabletop' ? 0.18 : 0.36) * (T.slim ? 1.1 : 1), bw = 0.5 * s * (T.chunky ? 1.15 : 1);
    if (variant !== 'tabletop') for (const x of [-1, 1]) for (const z of [-1, 1]) mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.12, 12), dark, { parent: root, at: [x * bw * 0.38, 0.06, z * bw * 0.38] });
    const y0 = variant === 'tabletop' ? 0 : 0.11;
    mesh(roundedBox(bw, bh, bw * 1.1, 0.04 * s), body, { parent: root, at: [0, y0 + bh / 2, 0], name: 'body' });
    // splash pan: hollow tray
    const sp = [[0.0, 0], [0.24 * s, 0], [0.26 * s, 0.08 * s], [0.245 * s, 0.08 * s], [0.23 * s, 0.012 * s], [0.0, 0.012 * s]];
    mesh(lathe(sp, 48), T.kids ? fin(T, T.s, 'plastic') : T.pop ? fin(T, T.s, 'pop') : dark, { parent: root, at: [0, y0 + bh - 0.004, 0], name: 'splash-pan' });
    const hy = y0 + bh + 0.012 * s - 0.006;
    mesh(new THREE.CylinderGeometry(0.02 * s, 0.02 * s, 0.04, 12), steel, { parent: root, at: [0, hy + 0.01, 0] });
    head(hy + 0.025, 0.15 * s);
    // controls
    mesh(roundedBox(0.08 * s, 0.03, 0.04, 0.008), dark, { parent: root, at: [bw / 2 - 0.05, y0 + bh * 0.6, bw * 0.55 + 0.012] });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 16).rotateX(Math.PI / 2), T.kids ? fin(T, T.a, 'plastic') : M.metal('#d33', 0.3), { parent: root, at: [bw / 2 - 0.05, y0 + bh * 0.6, bw * 0.55 + 0.03] });
    if (variant !== 'tabletop') {
      // foot pedal on a cable
      mesh(roundedBox(0.16, 0.05, 0.24, 0.015), dark, { parent: root, at: [0.25, 0.025, 0.45], rot: [0, -0.3, 0] });
      curveTube([[0.25, 0.04, 0.33], [0.24, 0.01, 0.25], [0.2, 0.01, 0.15], [bw * 0.3, y0 + 0.05, bw * 0.55]], 0.006, dark, { parent: root, segments: 16 });
    }
    if (variant === 'studio') {
      // stool and a water bucket (hollow)
      const st = group('stool', { parent: root, at: [0, 0, -0.62] });
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; tube([Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17], [Math.cos(a) * 0.1, 0.44, Math.sin(a) * 0.1], 0.012, steel, { parent: st }); }
      mesh(cushion(0.32, 0.06, 0.32, { radius: 0.03 }), T.pop ? fin(T, T.a, 'pop') : fin(T, '#2f2f33', 'leather'), { parent: st, at: [0, 0.47, 0] });
      const bucket = [[0, 0], [0.1, 0], [0.12, 0.22], [0.125, 0.23]];
      mesh(lathe(hollowProfile(bucket, 0.004), 32), T.kids ? fin(T, T.s, 'plastic') : fin(T, '#3a7fc0', 'plastic'), { parent: root, at: [0.5, 0, -0.1] });
      mesh(new THREE.CircleGeometry(0.105, 24).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ name: 'water', color: '#8a7058', roughness: 0.1, transparent: true, opacity: 0.85 }), { parent: root, at: [0.5, 0.15, -0.1] });
    }
  }
  return done(root, 'pottery-wheel', variant, o, () => [clip('spin', 0.8, anims)], T);
}

/* ================================ PEDESTALS ================================ */

export const PEDESTAL_VARIANTS = { cube: {}, column: {}, fluted: {}, stepped: {}, tapered: {}, cylinder: {}, vitrine: {} };

export function createPedestal(options = {}) {
  const { o, variant, trim, T } = setup(options, PEDESTAL_VARIANTS, 'gallery-pedestal', { p: '#f4f2ee', finish: 'paint' });
  const root = group(`pedestal-${variant}`);
  const m = mainMat(T);
  const w = 0.42 * (T.chunky ? 1.2 : T.slim ? 0.8 : 1), H = (T.slim ? 1.1 : T.chunky ? 0.85 : 1.0);
  const seg = T.facet ? 8 : 48;
  const acc = T.pop ? fin(T, T.s, 'pop') : T.trim === 'gold' ? fin(T, '', 'gold') : m;
  let top = H;
  const P = (geo, mat = m, at, name) => mesh(T.rough ? roughen(geo, 0.008, 12) : geo, mat, { parent: root, at, name });
  if (variant === 'cube' || variant === 'vitrine') {
    P(roundedBox(w, H, w, 0.008), m, [0, H / 2, 0], 'pedestal');
    mesh(roundedBox(w - 0.02, 0.02, w - 0.02, 0.004), fin(T, '#1c1c1e', 'paint'), { parent: root, at: [0, 0.009, 0] });
    if (T.pop) for (const y of [0.25, 0.5, 0.75]) mesh(roundedBox(w + 0.004, 0.05, w + 0.004, 0.004), fin(T, y === 0.5 ? T.a : T.s, 'pop'), { parent: root, at: [0, H * y, 0] });
    capTop(root, w * 0.94, H);
    if (variant === 'vitrine') {
      const cw = w - 0.03, ch = 0.4;
      const g = fin(T, '#e8f2f6', 'glass');
      for (const [x, z, rw, rd] of [[0, cw / 2, cw, 0.006], [0, -cw / 2, cw, 0.006], [cw / 2, 0, 0.006, cw], [-cw / 2, 0, 0.006, cw]]) mesh(roundedBox(rw, ch, rd, 0.002), g, { parent: root, at: [x, H + ch / 2 - 0.001, z] });
      mesh(roundedBox(cw + 0.006, 0.006, cw + 0.006, 0.002), g, { parent: root, at: [0, H + ch, 0] });
      // a small object on display inside
      const ob = [[0, 0], [0.04, 0], [0.06, 0.06], [0.045, 0.14], [0.03, 0.16], [0.035, 0.17]];
      mesh(lathe(hollowProfile(ob, 0.004), 40), T.pop ? fin(T, T.a, 'pop') : fin(T, '#2c5d7c', 'ceramic'), { parent: root, at: [0, H - 0.001, 0] });
      top = H + ch;
    }
  } else if (variant === 'column' || variant === 'fluted') {
    const r = w / 2;
    P(roundedBox(w * 1.15, 0.08, w * 1.15, 0.008), m, [0, 0.04, 0]);
    P(lathe([[0, 0], [r * 0.95, 0], [r * 0.95, 0.02], [r * 0.82, 0.05], [r * 0.85, 0.07], [r * 0.75, 0.09], [0, 0.09]], seg), m, [0, 0.079, 0]);
    const shaft = new THREE.CylinderGeometry(r * 0.66, r * 0.74, H - 0.32, seg, 8);
    if (variant === 'fluted') { const p = shaft.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 - 0.05 * Math.max(0, Math.cos(a * 20)); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } shaft.computeVertexNormals(); }
    P(shaft, m, [0, 0.165 + (H - 0.32) / 2, 0]);
    P(lathe([[0, 0], [r * 0.7, 0], [r * 0.8, 0.03], [r * 0.95, 0.07], [r * 0.95, 0.09], [0, 0.09]], seg), acc, [0, H - 0.16, 0]);
    P(roundedBox(w * 1.1, 0.07, w * 1.1, 0.008), m, [0, H - 0.035 - 0.002, 0]);
    capTop(root, w * 1.0, H - 0.002);
  } else if (variant === 'stepped') {
    P(roundedBox(w * 1.4, H * 0.12, w * 1.4, 0.01), m, [0, H * 0.06, 0]);
    P(roundedBox(w * 1.2, H * 0.12, w * 1.2, 0.01), acc, [0, H * 0.18 - 0.002, 0]);
    P(roundedBox(w, H * 0.76 + 0.006, w, 0.01), m, [0, H * 0.24 + H * 0.38 - 0.004, 0]);
    capTop(root, w * 0.95, H - 0.001);
  } else if (variant === 'tapered') {
    P(new THREE.CylinderGeometry(w * 0.45, w * 0.7, H, 4, 6).rotateY(Math.PI / 4), m, [0, H / 2, 0]);
    capTop(root, w * 0.6, H);
  } else {
    P(new THREE.CylinderGeometry(w / 2, w / 2, H, seg, 6), m, [0, H / 2, 0]);
    mesh(new THREE.TorusGeometry(w / 2, 0.006, 6, seg).rotateX(Math.PI / 2), acc, { parent: root, at: [0, H - 0.01, 0] });
    capTop(root, w * 0.98, H, true);
  }
  void top;
  return done(root, 'gallery-pedestal', variant, o, [], T);
}

/* ============================== GALLERY BENCHES ============================== */

export const BENCH_VARIANTS = { 'leather-ottoman': {}, 'wood-slat': {}, 'stone-block': {}, curved: {}, 'back-to-back': {}, 'cube-seats': {} };

export function createGalleryBench(options = {}) {
  const { o, variant, trim, T } = setup(options, BENCH_VARIANTS, 'gallery-bench', { p: '#2f2b28', finish: 'leather' });
  const root = group(`bench-${variant}`);
  const m = mainMat(T);
  const legM = T.trim === 'gold' ? fin(T, '', 'gold') : T.trim === 'bronze' ? fin(T, '#6e4a2a', 'bronze') : T.trim === 'glass' ? fin(T, '#e8f2f6', 'glass') : T.pop ? fin(T, T.s, 'pop') : M.metal('#2a2b2e', 0.35);
  const L = 1.5, D = 0.48, SH = 0.45;
  const seatM = !T.trim ? fin(T, '#2f2b28', 'leather') : T.trim === 'wood' ? M.wood('oak') : m;
  const k = T.chunky ? 1.3 : 1;
  if (variant === 'leather-ottoman') {
    const ch = 0.13;
    const cg = cushion(L, ch, D, { radius: 0.04, bulge: 0.18 });
    mesh(cg, seatM, { parent: root, at: [0, SH - ch / 2, 0], name: 'cushion' });
    mesh(roundedBox(L - 0.04, 0.03, D - 0.04, 0.008), legM, { parent: root, at: [0, SH - ch - 0.01, 0] });
    for (const x of [-1, 1]) {
      beam([x * (L / 2 - 0.08), 0, 0], [x * (L / 2 - 0.08), SH - ch - 0.02, 0], 0.03 * k, D - 0.08, legM, root);
    }
    // tufting buttons
    const bm = T.trim ? accentMat(T) : fin(T, '#1a1714', 'leather');
    for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) {
      const x = -L / 2 + (i + 0.5) * (L / 7), z = -D / 2 + (j + 0.5) * (D / 2);
      const kk = Math.max(0, (1 - (x / (L / 2)) ** 2) * (1 - (z / (D / 2)) ** 2));
      mesh(new THREE.SphereGeometry(0.012, 10, 6), bm, { parent: root, at: [x, SH + kk * ch * 0.18 * 0.5 - 0.004, z] });
    }
  } else if (variant === 'wood-slat') {
    const sm = T.trim && T.trim !== 'wood' ? m : M.wood('oak');
    const n = T.chunky ? 4 : 6;
    for (let i = 0; i < n; i++) mesh(roundedBox(L, 0.035, D / n - 0.012, 0.008), sm, { parent: root, at: [0, SH - 0.0175, -D / 2 + (i + 0.5) * (D / n)] });
    for (const x of [-1, 1]) {
      mesh(roundedBox(0.05, 0.04, D, 0.008), legM, { parent: root, at: [x * (L / 2 - 0.12), SH - 0.035 - 0.02 + 0.002, 0] });
      for (const z of [-1, 1]) beam([x * (L / 2 - 0.12), 0, z * (D / 2 - 0.04)], [x * (L / 2 - 0.12), SH - 0.05, z * (D / 2 - 0.04)], 0.04 * k, 0.04 * k, legM, root);
      mesh(roundedBox(0.04, 0.03, D - 0.06, 0.006), legM, { parent: root, at: [x * (L / 2 - 0.12), 0.12, 0] });
    }
  } else if (variant === 'stone-block') {
    const bm = !T.trim ? fin(T, '#cfc9be', 'stone') : m;
    const g = roundedBox(L, SH * 0.82, D, 0.02);
    if (T.rough) roughen(g, 0.01, 8);
    mesh(g, bm, { parent: root, at: [0, SH * 0.41 + SH * 0.18, 0] });
    for (const x of [-1, 1]) mesh(roundedBox(0.3 * k, SH * 0.18 + 0.004, D * 0.8, 0.01), bm, { parent: root, at: [x * L * 0.3, SH * 0.09, 0] });
    capTop(root, L * 0.96, SH, false, undefined, D * 0.92);
  } else if (variant === 'curved') {
    const R1 = 1.4, R0 = R1 - D, a0 = -0.55, a1 = 0.55;
    const pts = [];
    for (let i = 0; i <= 24; i++) { const a = a0 + ((a1 - a0) * i) / 24; pts.push([Math.sin(a) * R1, Math.cos(a) * R1 - R1]); }
    for (let i = 24; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / 24; pts.push([Math.sin(a) * R0, Math.cos(a) * R0 - R1]); }
    const g = extrudeOutline(pts, 0.08, { bevel: 0.015 }).rotateX(Math.PI / 2);
    mesh(g, seatM, { parent: root, at: [0, SH - 0.04, 0] });
    for (const a of [a0 + 0.12, 0, a1 - 0.12]) {
      const rm = (R0 + R1) / 2;
      mesh(roundedBox(0.08 * k, SH - 0.08 + 0.004, D * 0.8, 0.01), legM, { parent: root, at: [Math.sin(a) * rm, (SH - 0.08) / 2, Math.cos(a) * rm - R1], rot: [0, a, 0] });
    }
  } else if (variant === 'back-to-back') {
    const cm = T.trim ? seatM : fin(T, '#5a2a2a', 'fabric');
    for (const s of [-1, 1]) mesh(cushion(L, 0.1, D * 0.8, { radius: 0.03, bulge: 0.12 }), cm, { parent: root, at: [0, SH - 0.05, s * D * 0.45] });
    mesh(roundedBox(L, SH - 0.1, D * 1.7, 0.02), T.trim ? legM : M.wood('walnut'), { parent: root, at: [0, (SH - 0.1) / 2 + 0.002, 0] });
    mesh(cushion(L, 0.4, 0.12, { radius: 0.04, bulge: 0.1 }), cm, { parent: root, at: [0, SH + 0.18, 0] });
  } else {
    const n = 3, s = 0.42 * k;
    const cols = T.pop ? ['#ff2f6d', '#ffd400', '#1e8fff'] : null;
    for (let i = 0; i < n; i++) {
      const x = (i - 1) * (s + 0.08);
      const cmat = cols ? fin(T, cols[i], 'pop') : T.trim ? m : fin(T, ['#2f2b28', '#7a6a58', '#c2b49c'][i], 'leather');
      mesh(cushion(s, SH, s, { radius: 0.05, bulge: 0.08 }), cmat, { parent: root, at: [x, SH / 2 + 0.0, 0] });
    }
  }
  return done(root, 'gallery-bench', variant, o, [], T);
}

/* =============================== ART SUPPLIES =============================== */

export const SUPPLY_VARIANTS = { 'palette-brushes': {}, 'paint-tubes': {}, 'brush-jar': {}, sketchbook: {}, 'pencil-cup': {}, 'paint-set': {}, 'paint-cans': {}, 'canvas-stack': {} };
const PAINTS = ['#d7263d', '#f46036', '#f2c14e', '#2e9e4f', '#1b6ca8', '#5b2a86', '#f5f5f5', '#1a1a1a'];

/** Paint brush pointing along +Y from the handle end at origin. len = total length. */
function brush(parent, T, len, r, bristle, handle, { flat = false, at = [0, 0, 0], rot = [0, 0, 0] } = {}) {
  const g = group('brush', { parent, at, rot });
  const hl = len * 0.62;
  mesh(lathe([[0, 0], [r * 0.6, 0], [r * 0.8, hl * 0.1], [r, hl * 0.7], [r * 0.9, hl], [0, hl]], 10), handle, { parent: g });
  mesh(new THREE.CylinderGeometry(r * 0.85, r * 0.95, len * 0.14, 12), T.trim === 'gold' ? fin(T, '', 'gold') : M.metal('#c9ccd2', 0.25), { parent: g, at: [0, hl + len * 0.07 - 0.001, 0] });
  const bg = flat ? new THREE.CylinderGeometry(r * 0.3, r * 0.85, len * 0.24, 12).scale(1.4, 1, 0.45) : new THREE.ConeGeometry(r * 0.9, len * 0.24, 12).rotateX(Math.PI);
  if (!flat) bg.rotateX(Math.PI);
  mesh(bg, bristle, { parent: g, at: [0, hl + len * 0.14 + len * 0.12 - 0.002, 0] });
  return g;
}

export function createArtSupplies(options = {}) {
  const { o, variant, trim, T } = setup(options, SUPPLY_VARIANTS, 'art-supplies', { p: '#c99a5b', finish: 'wood' });
  const root = group(`supplies-${variant}`);
  const r = T.r;
  const kids = T.kids;
  const fat = kids ? 1.8 : 1;
  const paints = T.pop ? ['#ff2f6d', '#ffd400', '#1e8fff', '#22b04a', '#111111'] : kids ? ['#ff2f6d', '#ffd400', '#1e8fff', '#22b04a'] : PAINTS;
  const handleM = (i) => (T.trim === 'gold' || T.trim === 'black' ? fin(T, '#141416', 'paint') : T.trim === 'white' ? fin(T, '#f1efe9', 'paint') : kids || T.pop ? fin(T, paints[i % paints.length], kids ? 'plastic' : 'pop') : T.rough ? fin(T, '#a58a66', 'weathered') : fin(T, ['#c0392b', '#d9b98a', '#1b1b1b', '#2e6e9e'][i % 4], 'paint'));
  const bristleM = fin(T, T.rough ? '#5a4a3a' : '#e3c9a0', 'fabric');
  const pm = (c) => new THREE.MeshPhysicalMaterial({ name: 'paint', color: c, roughness: 0.25, clearcoat: 0.8 });
  const n = kids ? 3 : 5;
  if (variant === 'palette-brushes') {
    const s = kids ? 1.2 : 1;
    const outerPts = [];
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; const rr = 1 - 0.18 * Math.exp(-(((a - Math.PI) / 0.3) ** 2)); outerPts.push(new THREE.Vector2(Math.cos(a) * 0.2 * s * rr, Math.sin(a) * 0.15 * s * rr)); }
    const sh = new THREE.Shape(outerPts);
    const hole = new THREE.Path();
    hole.absellipse(-0.13 * s, 0.0, 0.018 * s, 0.022 * s, 0, Math.PI * 2, true);
    sh.holes.push(hole);
    const pal = T.trim === 'white' || T.trim === 'black' || T.pop || kids ? fin(T, T.trim === 'black' ? '#1c1c1e' : T.pop ? '#ffd400' : kids ? '#f4f4f4' : '#f1efe9', kids ? 'plastic' : 'paint') : M.wood(T.rough ? '#9a7a55' : T.trim === 'gold' ? 'walnut' : 'maple');
    mesh(extrudeOutline(sh, 0.006, { bevel: 0.0015, segments: 1 }).rotateX(-Math.PI / 2), pal, { parent: root, at: [0, 0.003, 0], name: 'palette' });
    for (let i = 0; i < (kids ? 5 : 8); i++) {
      const a = -1.1 + (i / 7) * 2.6 * (kids ? 1.3 : 1);
      mesh(new THREE.SphereGeometry(0.016 * s, 12, 8).scale(1, 0.35, 1), pm(paints[i % paints.length]), { parent: root, at: [Math.cos(a) * 0.14 * s, 0.006, Math.sin(a) * 0.1 * s] });
    }
    if (T.rough) for (let i = 0; i < 6; i++) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.002, 16).scale(1, 1, 0.5), pm(paints[(i * 3) % paints.length]), { parent: root, at: [(r() - 0.5) * 0.18, 0.0065, (r() - 0.5) * 0.12] });
    for (let i = 0; i < (kids ? 2 : 3); i++) brush(root, T, 0.24 * (kids ? 0.8 : 1), 0.0045 * fat, bristleM, handleM(i), { flat: i === 1, at: [-0.11 + i * 0.01, 0.006 + 0.0045 * fat, -0.04 + i * 0.04], rot: [0, 0.2 * i, -Math.PI / 2] });
  } else if (variant === 'paint-tubes') {
    for (let i = 0; i < n + (T.trim === 'grand' ? 3 : 0); i++) {
      const tr = 0.013 * fat, L = 0.11 * (kids ? 0.8 : 1);
      const g = new THREE.CylinderGeometry(tr, tr, L, 20, 8);
      const p = g.attributes.position;
      for (let v = 0; v < p.count; v++) { const y = p.getY(v); if (y > -L * 0.1) { const f = (y + L * 0.1) / (L * 0.6); p.setZ(v, p.getZ(v) * Math.max(0.08, 1 - f * 0.95)); p.setX(v, p.getX(v) * (1 + f * 0.25)); } }
      g.computeVertexNormals();
      const tg = group('tube', { parent: root, at: [(i - n / 2) * 0.045 * fat, tr * 0.92, (r() - 0.5) * 0.06], rot: [0, (r() - 0.5) * 0.5, Math.PI / 2] });
      mesh(g, T.trim === 'gold' ? fin(T, '#d6b45a', 'silver') : T.pop || kids ? fin(T, '#f4f4f4', 'plastic') : M.metal('#d8dade', 0.35), { parent: tg, name: 'tube-body' });
      mesh(new THREE.CylinderGeometry(tr * 1.02, tr * 1.02, L * 0.3, 20), pm(paints[i % paints.length]), { parent: tg, at: [0, -L * 0.25, 0] });
      mesh(new THREE.CylinderGeometry(tr * 0.5, tr, L * 0.08, 16), M.metal('#d8dade', 0.35), { parent: tg, at: [0, -L / 2 - L * 0.04 + 0.001, 0] });
      mesh(new THREE.CylinderGeometry(tr * 0.55, tr * 0.55, L * 0.14, 12), T.trim === 'black' ? fin(T, '#d33', 'plastic') : fin(T, '#1a1a1a', 'plastic'), { parent: tg, at: [0, -L / 2 - L * 0.08 - L * 0.07 + 0.002, 0] });
    }
  } else if (variant === 'brush-jar' || variant === 'pencil-cup') {
    const jar = variant === 'brush-jar';
    const outer = jar ? [[0, 0], [0.045, 0], [0.05, 0.01], [0.05, 0.12], [0.046, 0.13]] : [[0, 0], [0.04, 0], [0.042, 0.005], [0.042, 0.1], [0.043, 0.105]];
    const jm = jar ? (T.pop || kids ? fin(T, T.pop ? '#1e8fff' : '#ff2f6d', kids ? 'plastic' : 'pop') : T.trim === 'gold' ? fin(T, '', 'gold') : dbl(fin(T, '#dfeef2', 'glass'))) : T.trim === 'wood' || !T.trim ? M.wood('walnut') : mainMat(T);
    mesh(lathe(hollowProfile(outer, 0.003), 40), jm, { parent: root, name: jar ? 'jar' : 'cup' });
    if (jar) mesh(new THREE.CircleGeometry(0.044, 24).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ name: 'water', color: '#7f8f9a', transparent: true, opacity: 0.6, roughness: 0.05 }), { parent: root, at: [0, 0.06, 0] });
    const cnt = kids ? 4 : 7;
    const H = outer[outer.length - 1][1], R = outer[outer.length - 1][0] - 0.004;
    for (let i = 0; i < cnt; i++) {
      const a = (i / cnt) * Math.PI * 2, tilt = 0.2 + (i % 3) * 0.05;
      const g = group('stick', { parent: root, at: [Math.cos(a) * 0.012, 0.003, Math.sin(a) * 0.012] });
      // tilt so the shaft rests on the rim
      g.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
      void R; void H;
      if (jar) brush(g, T, (0.24 + (i % 3) * 0.04) * (kids ? 0.8 : 1), 0.004 * fat, bristleM, handleM(i), { flat: i % 2 === 1, at: [0, 0, 0] });
      else {
        const pl = 0.17 + (i % 3) * 0.015;
        mesh(new THREE.CylinderGeometry(0.0045 * fat, 0.0045 * fat, pl, 6), handleM(i + 1), { parent: g, at: [0, pl / 2, 0] });
        mesh(new THREE.ConeGeometry(0.0045 * fat, 0.018, 6), M.wood('maple'), { parent: g, at: [0, pl + 0.009 - 0.001, 0] });
        mesh(new THREE.ConeGeometry(0.0015 * fat, 0.005, 6), fin(T, '#222', 'paint'), { parent: g, at: [0, pl + 0.016, 0] });
      }
    }
  } else if (variant === 'sketchbook') {
    const s = kids ? 1.3 : 1;
    const cover = T.trim === 'gold' ? fin(T, '#1a1a1a', 'leather') : T.pop || kids ? fin(T, T.pop ? '#ff2f6d' : '#1e8fff', 'plastic') : T.rough ? fin(T, '#7a5a3a', 'leather') : fin(T, T.trim === 'white' ? '#e8e4dc' : '#2a2a2c', 'leather');
    const pw = 0.21 * s, ph = 0.28 * s;
    for (const side of [-1, 1]) {
      mesh(roundedBox(pw + 0.006, 0.003, ph + 0.008, 0.001), cover, { parent: root, at: [side * (pw / 2 + 0.008), 0.0015, 0] });
      mesh(roundedBox(pw, 0.008, ph, 0.002), fin(T, '#f7f3ea', 'matte'), { parent: root, at: [side * (pw / 2 + 0.008), 0.0068, 0] });
    }
    for (let i = 0; i < 14; i++) mesh(new THREE.TorusGeometry(0.0085, 0.0012, 6, 16), M.metal('#9aa0a6', 0.3), { parent: root, at: [0, 0.007, -ph / 2 + 0.01 + (i * (ph - 0.02)) / 13] });
    const base = artFn(['portrait', 'landscape', 'still-life'][Math.floor(r() * 3)], 4);
    const sketch = T.pop || kids ? base : (u, v) => { const c = base(u, v); const l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; const k = 0.35 + 0.65 * Math.round(l * 4) / 4; return new THREE.Color(k * 0.97, k * 0.95, k * 0.9); };
    const pic = paintedPlane(pw - 0.03, ph - 0.04, sketch, { px: 128 });
    pic.rotation.x = -Math.PI / 2;
    pic.position.set(pw / 2 + 0.008, 0.0109, 0);
    root.add(pic);
    const pg = group('pencil', { parent: root, at: [-pw / 2, 0.0108 + 0.004 * fat, 0.02], rot: [0, 0.4, Math.PI / 2] });
    mesh(new THREE.CylinderGeometry(0.004 * fat, 0.004 * fat, 0.16, 6), handleM(1), { parent: pg });
    mesh(new THREE.ConeGeometry(0.004 * fat, 0.016, 6), M.wood('maple'), { parent: pg, at: [0, 0.088, 0] });
  } else if (variant === 'paint-set') {
    const W = 0.24 * fat, D = 0.12 * fat, Hh = 0.02;
    const tin = T.trim === 'gold' ? fin(T, '', 'gold') : T.trim === 'black' ? fin(T, '#1c1c1e', 'paint') : T.pop || kids ? fin(T, T.pop ? '#1e8fff' : '#ffd400', kids ? 'plastic' : 'pop') : T.rough ? M.metal('#7d7a72', 0.6) : fin(T, '#d9d6cf', 'paint');
    // hollow tray: floor + 4 walls
    mesh(roundedBox(W, 0.003, D, 0.001), tin, { parent: root, at: [0, 0.0015, 0] });
    for (const [x, z, w, d] of [[0, D / 2, W, 0.003], [0, -D / 2, W, 0.003], [W / 2, 0, 0.003, D], [-W / 2, 0, 0.003, D]]) mesh(roundedBox(w, Hh, d, 0.001), tin, { parent: root, at: [x, Hh / 2, z] });
    const cols = Math.round(W / 0.03), rows = 2;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      mesh(roundedBox(0.024, 0.008, 0.032, 0.002), fin(T, '#f4f4f4', 'plastic'), { parent: root, at: [-W / 2 + 0.015 + i * ((W - 0.03) / (cols - 1)), 0.007, -D / 4 + j * (D / 2) - 0.0], name: 'pan' });
      mesh(roundedBox(0.02, 0.003, 0.028, 0.001), pm(paints[(i + j * cols) % paints.length]), { parent: root, at: [-W / 2 + 0.015 + i * ((W - 0.03) / (cols - 1)), 0.0115, -D / 4 + j * (D / 2)] });
    }
    // open lid hinged at the back
    const lid = group('lid', { parent: root, at: [0, Hh, -D / 2 - 0.0015] });
    lid.rotation.x = 1.39;
    mesh(roundedBox(W, D, 0.003, 0.001), tin, { parent: lid, at: [0, -D / 2, 0.0], rot: [0, 0, 0] });
    lid.children[0].position.set(0, 0, -D / 2);
    lid.children[0].rotation.x = Math.PI / 2;
    brush(root, T, 0.16, 0.0035 * fat, bristleM, handleM(0), { at: [-W / 2 + 0.02, 0.0115 + 0.0035 * fat + 0.003, D / 2 - 0.012], rot: [0, 0, -Math.PI / 2] });
  } else if (variant === 'paint-cans') {
    const cnt = kids ? 2 : 3;
    for (let i = 0; i < cnt; i++) {
      const cr = 0.06 * fat * (i === 2 ? 0.7 : 1), ch = 0.12 * fat * (i === 2 ? 0.7 : 1);
      const x = (i - (cnt - 1) / 2) * 0.15 * fat;
      const outer = [[0, 0], [cr, 0], [cr + 0.002, 0.004], [cr + 0.002, ch], [cr, ch + 0.004]];
      mesh(lathe(hollowProfile(outer, 0.0025), 40), T.trim === 'gold' ? fin(T, '', 'gold') : T.pop ? fin(T, paints[i], 'pop') : M.metal(T.rough ? '#8a857a' : '#c9ccd2', T.rough ? 0.6 : 0.3), { parent: root, at: [x, 0, 0], name: 'can' });
      mesh(new THREE.CylinderGeometry(cr + 0.003, cr + 0.003, ch * 0.45, 40, 1, true), fin(T, ['#f4efe6', '#1b6ca8', '#d7263d'][i], 'paint'), { parent: root, at: [x, ch * 0.45, 0] }).material.side = THREE.DoubleSide;
      mesh(new THREE.CircleGeometry(cr - 0.002, 32).rotateX(-Math.PI / 2), pm(paints[(i * 2 + 1) % paints.length]), { parent: root, at: [x, ch * 0.8, 0] });
      if (i === 0) {
        // stir stick leaning on the rim
        mesh(roundedBox(0.02, 0.26, 0.004, 0.001), M.wood('pine'), { parent: root, at: [x + 0.02, 0.0025 + 0.13 * Math.cos(0.3), 0], rot: [0, 0, -0.3] });
      }
    }
    // lid on the floor
    mesh(new THREE.CylinderGeometry(0.063 * fat, 0.063 * fat, 0.006, 40), M.metal('#c9ccd2', 0.3), { parent: root, at: [0, 0.003, 0.14 * fat] });
  } else {
    // canvas stack: stretched canvases piled + a roll of raw canvas
    for (let i = 0; i < (kids ? 3 : 5); i++) {
      const w = (0.6 - i * 0.07) * (kids ? 0.6 : 1), d = (0.45 - i * 0.05) * (kids ? 0.6 : 1);
      mesh(roundedBox(w, 0.025, d, 0.003), fin(T, i % 2 ? '#f2eee6' : '#ebe6db', 'fabric'), { parent: root, at: [(r() - 0.5) * 0.04, 0.0125 + i * 0.0245, (r() - 0.5) * 0.04], rot: [0, (r() - 0.5) * 0.25, 0] });
    }
    const rl = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 24).rotateZ(Math.PI / 2), fin(T, '#e6dcc8', 'fabric'), { parent: root, at: [0, 0.05, 0.32] });
    void rl;
    mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.74, 12).rotateZ(Math.PI / 2), fin(T, '#3a3a3a', 'plastic'), { parent: root, at: [0, 0.05, 0.32] });
  }
  return done(root, 'art-supplies', variant, o, [], T);
}
