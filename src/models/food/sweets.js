/*
 * Sweet bakery: donuts (drippy glazes, sprinkles, fillings), muffins, cupcakes, layer
 * cakes with real cut layers, pies & tarts, and cookies. Candles light up ('on').
 */
import {
  THREE, PI, TAU, mesh, group, curveTube, roundedBox, lathe, sweep, scatter, cached, jitter, cushion, trayBox,
  crust, gloss, glaze, cream, flesh, phys, paperMat, plate, board, ceramic, clearGlass, metalMat, vcolor, fbm, toColor, make, vessel, extrudeOutline, biteGeo,
  sprinkleGeo, seedGeo, SPRINKLES, rotateTrack, numberTrack, clip, leafGeo, leafy, waxy, plasticMat,
} from './common.js';
import { swirlCream } from './bread.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';

const C = (h) => toColor(h);
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------------------------------------------------------------- candles */
function candles(parent, positions, { h = 0.06, colors = ['#f25a8a', '#3ec1ff', '#ffd23f', '#7be07b'], ctx, spiral = true } = {}) {
  const lamp = lampGroup('flames', 'amber');
  positions.forEach(([x, y, z], i) => {
    const g = group(`candle${i}`, { parent, at: [x, y, z] });
    const c = mesh(new THREE.CylinderGeometry(0.0032, 0.0032, h, 10), phys(colors[i % colors.length], { rough: 0.4, cc: 0.4 }), { parent: g, at: [0, h / 2, 0], name: `candle${i}_wax` });
    if (spiral) vcolor(c.geometry, (xx, yy, zz, col) => col.set(Math.sin(Math.atan2(xx, zz) * 1 + yy * 300) > 0.3 ? '#ffffff' : colors[i % colors.length]));
    if (spiral) c.material.vertexColors = true, c.material.color.set('#ffffff');
    tube([0, h, 0], [0, h + 0.007, 0], 0.0006, phys('#222', { rough: 0.9 }), { parent: g, name: `wick${i}` });
    const flame = new THREE.SphereGeometry(0.0035, 10, 8);
    flame.scale(1, 2.3, 1); flame.translate(x, y + h + 0.012, z);
    lamp.add(parent, { geometry: flame, depth: 0.004, normal: [0, 0, 1] });
  });
  if (ctx) ctx.animations.push(clip('on', 1, [...lampTracks('flames', LAMP_ON.amber), numberTrack('flames.material.emissiveIntensity', 1, (t) => 2.2 + Math.sin(t * TAU * 5) * 0.4 + Math.sin(t * TAU * 11) * 0.25, 24)]));
  return lamp;
}
import { tube } from './common.js';

/* ---------------------------------------------------------------- donuts */
function torusGeo(R, r, fnR, { su = 64, sv = 24, sy = 0.78 } = {}) {
  const pos = [], idx = [], uv = [];
  for (let i = 0; i <= su; i++) {
    const u = (i / su) * TAU;
    for (let j = 0; j <= sv; j++) {
      const v = (j / sv) * TAU;
      const rr = fnR(u, v);
      pos.push((R + rr * Math.cos(v)) * Math.cos(u), rr * Math.sin(v) * sy, (R + rr * Math.cos(v)) * Math.sin(u));
      uv.push(i / su, j / sv);
    }
  }
  for (let i = 0; i < su; i++) for (let j = 0; j < sv; j++) { const a = i * (sv + 1) + j, b = a + sv + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const DONUT = {
  classic: { glaze: '#e8b860', op: 0.42, full: true },
  glazed: { glaze: '#e8b860', op: 0.42, full: true },
  chocolate: { glaze: '#3a1e10' },
  strawberry: { glaze: '#f48aa8', drizzle: '#fbf4ea' },
  vanilla: { glaze: '#fbf4e6', drizzle: '#3a1e10' },
  maple: { glaze: '#b8702a', bacon: true },
  matcha: { glaze: '#9ac46a', drizzle: '#fbf4e6' },
  sprinkles: { glaze: '#f9b7cc', sprinkles: true },
  'chocolate-sprinkles': { glaze: '#3a1e10', sprinkles: true },
  powdered: { coat: '#fbfaf6' },
  cinnamon: { coat: '#d8a878', speck: '#7a4a2a' },
  'boston-cream': { glaze: '#3a1e10', cream: true },
  bitten: { glaze: '#e8b860', op: 0.42, full: true, bite: true },
  caramel: { glaze: '#c8782a', drizzle: '#fbf4ea', nuts: true },
  blueberry: { glaze: '#8a7ad8', drizzle: '#fbf4ea' },
};
function donutRing(parent, { flavour = 'classic', at = [0, 0, 0], rot = [0, 0, 0], s = 1, name = 'donut', rand, cruller = false }) {
  const f = DONUT[flavour] ?? DONUT.classic;
  const g = group(name, { parent, at, rot });
  const R = 0.034 * s, r = 0.02 * s;
  const ridge = cruller ? (u, v) => 1 + 0.13 * Math.max(0, Math.cos(u * 8 + v * 1.2)) ** 0.6 : () => 1;
  const dough = torusGeo(R, r, (u, v) => r * ridge(u, v), { su: cruller ? 96 : 56 });
  const pale = C('#f0d4a0'), brown = C(cruller ? '#b8782e' : '#9a5420');
  vcolor(dough, (x, y, z, c) => { const band = Math.abs(y) < r * 0.18 ? 1 : 0; c.copy(brown).lerp(pale, band * 0.8).multiplyScalar(0.88 + fbm(x * 90, y * 90, z * 90) * 0.24); if (f.coat) { c.set(f.coat).multiplyScalar(0.92 + fbm(x * 200, y * 200, z * 200) * 0.12); if (f.speck && fbm(x * 400, y * 400, z * 400) > 0.6) c.lerp(C(f.speck), 0.7); } });
  const bites = f.bite ? [{ at: [R + r * 1.2, 0.0, 0], r: r * 1.15 }, { at: [R + r * 1.0, 0.0, r * 0.9], r: r * 0.9 }, { at: [R + r * 1.0, 0.0, -r * 0.9], r: r * 0.9 }] : null;
  const lift = r * 0.78;
  if (bites) biteGeo(dough, bites.map((b) => ({ ...b, at: [b.at[0], b.at[1], b.at[2]] })), { centre: [0, 0, 0], color: '#f8e8c0' });
  mesh(dough, crust('#fff', { vc: true, rough: f.coat ? 0.95 : 0.6 }), { parent: g, at: [0, lift, 0], name: `${name}_dough` });
  if (f.glaze) {
    const thr = (u) => (f.full ? -0.55 : -0.2) + 0.13 * Math.sin(u * 7 + 1) + 0.07 * Math.sin(u * 17);
    const gl = torusGeo(R, r, (u, v) => r * ridge(u, v) - 0.003 * s + (0.0048 * s) * ss(-0.04, 0.04, Math.sin(v) - thr(u)), { su: cruller ? 96 : 72, sv: 28 });
    if (bites) biteGeo(gl, bites.map((b) => ({ ...b, r: b.r + 0.002 })), { centre: [0, 0, 0] });
    mesh(gl, glaze(f.glaze, { opacity: f.op ?? 1, transparent: (f.op ?? 1) < 1 }), { parent: g, at: [0, lift, 0], name: `${name}_glaze` });
    if (f.sprinkles && rand) {
      const items = [];
      for (let i = 0; i < 110 * s; i++) { const u = rand() * TAU, v = 0.25 + rand() * (PI - 0.5); const rr = r + 0.0019 * s; items.push({ at: [(R + rr * Math.cos(v)) * Math.cos(u), lift + rr * Math.sin(v) * 0.78, (R + rr * Math.cos(v)) * Math.sin(u)], rot: [0, rand() * TAU, (rand() - 0.5) * 0.6], color: SPRINKLES[i % SPRINKLES.length], scale: s }); }
      scatter(g, sprinkleGeo(), phys('#ffffff', { rough: 0.35, cc: 0.5 }), items, `${name}_sprinkles`);
    }
    if (f.drizzle) for (let k = 0; k < 5; k++) { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; const u = -0.9 + t * 1.8 + k * 1.25; const v = PI / 2 + Math.sin(t * PI * 3 + k) * 0.9; const rr = r + 0.0024 * s; pts.push([(R + rr * Math.cos(v)) * Math.cos(u), lift + rr * Math.sin(v) * 0.78, (R + rr * Math.cos(v)) * Math.sin(u)]); } curveTube(pts, 0.0011 * s, glaze(f.drizzle), { parent: g, segments: 40, radialSegments: 5, name: `${name}_drizzle${k}` }); }
    if (f.bacon && rand) scatter(g, cached('bacon', () => roundedBox(0.008, 0.002, 0.004, 0.0008, 1)), meatMat('#a8402a'), Array.from({ length: 16 }, (_, i) => { const u = (i / 16) * TAU; const rr = r + 0.002; return { at: [R * Math.cos(u), lift + rr * 0.78, R * Math.sin(u)], rot: [0, u, 0.1] }; }), `${name}_bacon`);
    if (f.nuts && rand) scatter(g, cached('nutbit', () => new THREE.DodecahedronGeometry(0.0022, 0)), phys('#e0b880', { rough: 0.7 }), Array.from({ length: 30 }, (_, i) => { const u = rand() * TAU, v = PI / 2 + (rand() - 0.5) * 1.6; const rr = r + 0.002; return { at: [(R + rr * Math.cos(v)) * Math.cos(u), lift + rr * Math.sin(v) * 0.78, (R + rr * Math.cos(v)) * Math.sin(u)] }; }), `${name}_nuts`);
    if (f.cream) { const pts = []; for (let i = 0; i <= 40; i++) { const u = (i / 40) * TAU; pts.push([R * Math.cos(u), lift + r * 0.8 + 0.002, R * Math.sin(u)]); } curveTube(pts, 0.0025, cream('#f8e6a8'), { parent: g, segments: 60, radialSegments: 6, closed: true, name: `${name}_cream` }); }
  }
  return g;
}
const meatMat = (c) => phys(c, { rough: 0.5, cc: 0.4, name: 'meat' });
function donutFilled(parent, { flavour = 'powdered', at = [0, 0, 0], name = 'filled', rand, s = 1 }) {
  const f = DONUT[flavour] ?? DONUT.powdered;
  const g = group(name, { parent, at });
  const R = 0.042 * s, H = 0.045 * s;
  const ctrl = [[0, 0], [R * 0.7, 0.001], [R * 0.98, H * 0.25], [R, H * 0.5], [R * 0.85, H * 0.85], [R * 0.4, H], [0, H]];
  const geo = lathe(ctrl, 40);
  vcolor(geo, (x, y, z, c) => { const band = Math.abs(y - H * 0.5) < H * 0.08; c.set('#b8702e').lerp(C('#f0d4a0'), band ? 0.8 : 0).multiplyScalar(0.9 + fbm(x * 90, y * 90, z * 90) * 0.2); if (f.coat) { c.set(f.coat); if (f.speck && fbm(x * 400, y * 400, z * 400) > 0.6) c.lerp(C(f.speck), 0.7); } });
  if (f.bite) biteGeo(geo, [{ at: [R * 1.2, H * 0.5, 0], r: R * 0.6 }], { centre: [0, H * 0.5, 0], color: '#f8e8c0' });
  mesh(geo, crust('#fff', { vc: true }), { parent: g, name: `${name}_dough` });
  if (f.glaze) {
    const cap = lathe([[0, H + 0.0025], [R * 0.42, H + 0.002], [R * 0.86, H * 0.86 + 0.002], [R * 0.99, H * 0.62 + Math.sin(0) * 0.002], [R * 0.96, H * 0.6]], 40);
    const p = cap.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); if (p.getY(i) < H * 0.7) p.setY(i, p.getY(i) - Math.max(0, Math.sin(a * 6)) * H * 0.12); }
    cap.computeVertexNormals();
    mesh(cap, glaze(f.glaze, { opacity: f.op ?? 1, transparent: (f.op ?? 1) < 1, side: THREE.DoubleSide }), { parent: g, name: `${name}_glaze` });
    if (f.sprinkles && rand) scatter(g, sprinkleGeo(), phys('#fff', { rough: 0.35 }), Array.from({ length: 60 }, (_, i) => { const a = rand() * TAU, d = Math.sqrt(rand()) * R * 0.7; return { at: [Math.cos(a) * d, H + 0.003 - (d / R) ** 2 * H * 0.12, Math.sin(a) * d], rot: [0, rand() * 3, 0], color: SPRINKLES[i % 7] }; }), `${name}_sprinkles`);
  }
  // filling squirt
  const fillCol = flavour === 'boston-cream' || flavour === 'vanilla' ? '#f8e6a8' : flavour === 'chocolate' ? '#5a2e18' : '#c8142e';
  mesh(new THREE.SphereGeometry(0.008 * s, 12, 8), glaze(fillCol), { parent: g, at: [R * 0.98, H * 0.5, 0], scale: [0.8, 0.8, 1], name: `${name}_jam` });
  return g;
}
function longJohn(parent, { flavour = 'maple', at = [0, 0, 0], rotY = 0, name = 'longjohn', rand }) {
  const f = DONUT[flavour] ?? DONUT.maple;
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const L = 0.14, R = 0.022;
  const body = sweep([[-L / 2, 0, 0], [L / 2, 0, 0]], { r: (t) => R * Math.pow(Math.sin(Math.max(0.02, Math.min(0.98, t)) * PI), 0.28), ell: [1.25, 0.8], seg: 30, sides: 22 });
  vcolor(body, (x, y, z, c) => { c.set('#b8702e').lerp(C('#f0d4a0'), Math.abs(y) < 0.004 ? 0.8 : 0); if (f.coat) c.set(f.coat); });
  mesh(body, crust('#fff', { vc: true }), { parent: g, at: [0, R * 0.8, 0], name: `${name}_dough` });
  if (f.glaze) {
    const top = sweep([[-L / 2 + 0.004, 0, 0], [L / 2 - 0.004, 0, 0]], { r: (t) => R * 1.07 * Math.pow(Math.sin(Math.max(0.02, Math.min(0.98, t)) * PI), 0.28), ell: [1.25, 0.8], seg: 30, sides: 22 });
    const p = top.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < R * 0.3) p.setY(i, R * 0.3 - (R * 0.3 - p.getY(i)) * 0.03);
    top.computeVertexNormals();
    mesh(top, glaze(f.glaze, { opacity: f.op ?? 1, transparent: (f.op ?? 1) < 1 }), { parent: g, at: [0, R * 0.8, 0], name: `${name}_glaze` });
    if (f.sprinkles && rand) scatter(g, sprinkleGeo(), phys('#fff', { rough: 0.35 }), Array.from({ length: 50 }, (_, i) => ({ at: [(rand() - 0.5) * L * 0.85, R * 1.62, (rand() - 0.5) * R * 1.4], rot: [0, rand() * 3, 0], color: SPRINKLES[i % 7] })), `${name}_sprinkles`);
    if (f.bacon) scatter(g, cached('baconstrip', () => roundedBox(0.05, 0.003, 0.012, 0.001, 1)), meatMat('#a8402a'), [{ at: [-0.02, R * 1.64, 0], rot: [0, 0.1, 0] }, { at: [0.03, R * 1.64, 0.002], rot: [0, -0.1, 0] }], `${name}_bacon`);
  }
  return g;
}
function donutBox(parent, ctx, n) {
  const W = n > 6 ? 0.36 : 0.27, D = 0.2, H = 0.07;
  const box = trayBox(parent, W, H, D, paperMat('#f6e8d4'), 0.0025, { name: 'box' });
  void box;
  const lid = group('lid', { parent, at: [0, H, -D / 2] });
  const lg = trayBox(lid, W, 0.012, D, paperMat('#e86a8a'), 0.0022, { name: 'lid_shell' });
  lg.rotation.x = PI; lg.position.set(0, 0.012, D / 2);
  const flavs = ['chocolate-sprinkles', 'glazed', 'strawberry', 'powdered', 'maple', 'vanilla', 'matcha', 'chocolate', 'sprinkles', 'cinnamon', 'blueberry', 'caramel'];
  const cols = n > 6 ? 4 : 3, rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) { const cx = (i % cols - (cols - 1) / 2) * 0.085, cz = (Math.floor(i / cols) - (rows - 1) / 2) * (D / rows); donutRing(parent, { flavour: flavs[i % flavs.length], at: [cx, 0.0025, cz], s: 0.85, name: `d${i}`, rand: ctx.rand }); }
  lid.rotation.x = -1.9;
  ctx.animations.push(clip('lidClose', 1.2, [rotateTrack(lid, 'x', 1.2, (t) => Math.min(1, t * 1.25) * 1.9)]));
  ctx.oneShot.push('lidClose');
}
export const DONUT_VARIANTS = { ring: {}, filled: {}, cruller: {}, 'long-john': {}, mini: {}, box: {} };
export const createDonut = make('donut', DONUT_VARIANTS, (ctx) => {
  const { variant, trim, root, rand } = ctx;
  switch (variant) {
    case 'ring': donutRing(root, { flavour: trim ?? 'classic', rand }); break;
    case 'cruller': donutRing(root, { flavour: trim ?? 'classic', rand, cruller: true }); break;
    case 'filled': donutFilled(root, { flavour: trim ?? 'powdered', rand }); break;
    case 'long-john': longJohn(root, { flavour: trim ?? 'maple', rand }); break;
    case 'mini': { const fl = trim ?? 'cinnamon'; const pos = [[-0.03, 0, -0.02], [0.03, 0, -0.02], [0, 0, 0.03], [0.0, 0.026, 0.0]]; pos.forEach((q, i) => donutRing(root, { flavour: fl, at: q, rot: [i === 3 ? 0.3 : 0, i, 0], s: 0.45, name: `mini${i}`, rand })); break; }
    case 'box': donutBox(root, ctx, trim === 'dozen' ? 12 : trim === 'four' ? 4 : 6); break;
    default: break;
  }
});

/* ---------------------------------------------------------------- muffins & cupcakes */
function paperCase(parent, { r0 = 0.026, r1 = 0.034, h = 0.032, color = '#f4f0e6', foil = false, name = 'case', pleats = 26 }) {
  const out = [[0, 0], [r0, 0]];
  for (let i = 1; i <= 6; i++) { const t = i / 6; out.push([r0 + (r1 - r0) * t, h * t]); }
  const v = vessel(out, 0.0008, { seg: pleats * 4 });
  const p = v.geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i); if (y < 0.0012) continue; const a = Math.atan2(z, x); const k = 1 + 0.035 * Math.abs(Math.sin(a * pleats / 2)) ** 0.5; p.setX(i, x * k); p.setZ(i, z * k); }
  v.geo.computeVertexNormals();
  const m = foil ? phys(color, { metal: 0.9, rough: 0.25, side: THREE.DoubleSide, name: 'foil' }) : paperMat(color, { side: THREE.DoubleSide });
  mesh(v.geo, m, { parent, name });
  return v;
}
const MUFFIN = {
  blueberry: { dough: '#d8a860', top: '#b8762e', bits: '#2e2a5a', bitGeo: 'berry' },
  'chocolate-chip': { dough: '#d8a860', top: '#b8762e', bits: '#2a160c', bitGeo: 'chip' },
  'double-chocolate': { dough: '#5a3420', top: '#3a2014', bits: '#1a0e08', bitGeo: 'chip' },
  'banana-walnut': { dough: '#c8904a', top: '#9a5a26', bits: '#c8a070', bitGeo: 'nut' },
  'lemon-poppy': { dough: '#ecd27a', top: '#d8b04a', bits: '#141418', bitGeo: 'seed', drizzle: '#fbf6e6' },
  cranberry: { dough: '#e0b878', top: '#b8762e', bits: '#a8142e', bitGeo: 'berry' },
  bran: { dough: '#8a5a32', top: '#6a4024', bits: '#3a2414', bitGeo: 'seed' },
  streusel: { dough: '#d8a860', top: '#b8762e', bits: '#e8c890', bitGeo: 'crumb' },
  'apple-cinnamon': { dough: '#d0985a', top: '#a8662a', bits: '#f2dc9a', bitGeo: 'cube' },
};
const BITS = {
  berry: () => cached('mb', () => new THREE.SphereGeometry(0.0045, 10, 8)),
  chip: () => cached('chip', () => new THREE.ConeGeometry(0.003, 0.004, 8)),
  nut: () => cached('mnut', () => jitter(new THREE.SphereGeometry(0.004, 8, 6).scale(1.3, 0.6, 1), () => 0.5, 0)),
  seed: () => seedGeo(),
  crumb: () => cached('crumbbit', () => new THREE.DodecahedronGeometry(0.0035, 0)),
  cube: () => cached('acube', () => roundedBox(0.006, 0.006, 0.006, 0.0015, 1)),
};
function muffin(parent, { flavour = 'blueberry', at = [0, 0, 0], s = 1, tulip = false, name = 'muffin', rand }) {
  const f = MUFFIN[flavour] ?? MUFFIN.blueberry;
  const g = group(name, { parent, at, rot: [0, 0, 0] });
  const inner = group(`${name}_s`, { parent: g });
  inner.scale.setScalar(s);
  const h = tulip ? 0.05 : 0.036;
  paperCase(inner, { r0: 0.024, r1: 0.031, h, color: tulip ? '#7a4a2a' : '#f2ece2', name: `${name}_case` });
  if (tulip) for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; const petal = new THREE.PlaneGeometry(0.05, 0.05, 2, 4); const p = petal.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k); p.setZ(k, ((y + 0.025) / 0.05) ** 2 * 0.012); } petal.computeVertexNormals(); mesh(petal, paperMat('#7a4a2a', { side: THREE.DoubleSide }), { parent: inner, at: [Math.cos(a) * 0.031, h + 0.02, Math.sin(a) * 0.031], rot: [0, -a + PI / 2, 0], name: `${name}_petal${i}` }); }
  const top = jitter(lathe([[0.029, 0], [0.036, 0.004], [0.04, 0.012], [0.036, 0.024], [0.024, 0.033], [0, 0.037]], 36), rand, 0.05);
  vcolor(top, (x, y, z, c) => c.set(f.dough).lerp(C(f.top), Math.min(1, y / 0.02)).multiplyScalar(0.85 + fbm(x * 120, y * 120, z * 120) * 0.3));
  mesh(top, crust('#fff', { vc: true }), { parent: inner, at: [0, h - 0.002, 0], name: `${name}_top` });
  mesh(new THREE.CylinderGeometry(0.029, 0.0235, h - 0.001, 28), crust(f.dough), { parent: inner, at: [0, h / 2 + 0.0005, 0], name: `${name}_body` });
  if (rand) {
    const items = [];
    for (let i = 0; i < (f.bitGeo === 'seed' ? 80 : 18); i++) { const a = rand() * TAU, k = Math.sqrt(rand()) * 0.95; const rr = 0.038 * k; items.push({ at: [Math.cos(a) * rr, h - 0.002 + 0.036 * Math.sqrt(Math.max(0, 1 - k * k)) * 0.95 + 0.001, Math.sin(a) * rr], rot: [rand() * 3, rand() * 3, 0] }); }
    items.push({ at: [0, h + 0.036, 0] });
    scatter(inner, BITS[f.bitGeo](), phys(f.bits, { rough: f.bitGeo === 'berry' ? 0.3 : 0.6, cc: f.bitGeo === 'berry' ? 0.6 : 0 }), items, `${name}_bits`);
  }
  if (f.drizzle) for (let k = 0; k < 4; k++) curveTube([[-0.03, h + 0.02, -0.02 + k * 0.013], [0, h + 0.036, -0.018 + k * 0.012], [0.03, h + 0.02, -0.02 + k * 0.013]], 0.0012, glaze(f.drizzle), { parent: inner, segments: 12, radialSegments: 5, name: `${name}_drizzle${k}` });
  return g;
}
const CUPCAKE = {
  vanilla: { cake: '#ecd08a', frost: '#fbf3e2' }, chocolate: { cake: '#5a3420', frost: '#6a3a22' }, strawberry: { cake: '#ecd08a', frost: '#f6a8bc', top: 'strawberry' },
  'red-velvet': { cake: '#8a1a22', frost: '#fbf6ee', crumbs: '#8a1a22' }, lemon: { cake: '#f0d878', frost: '#fbf0a0', top: 'lemon' }, 'mint-choc': { cake: '#5a3420', frost: '#b8ecd2', top: 'chips' },
  blueberry: { cake: '#ecd08a', frost: '#c8b8ec', top: 'berries' }, 'salted-caramel': { cake: '#d8a860', frost: '#e0b070', top: 'drizzle' }, unicorn: { cake: '#ecd08a', frost: '#f2c0e6', pastel: true, top: 'horn' },
  sprinkles: { cake: '#ecd08a', frost: '#fbf3e2', top: 'sprinkles' }, cherry: { cake: '#ecd08a', frost: '#fbf3e2', top: 'cherry' }, birthday: { cake: '#ecd08a', frost: '#9ad8f6', top: 'candle' },
  'cookies-cream': { cake: '#3a2418', frost: '#f6f2ea', crumbs: '#1e1410', top: 'cookie' },
};
function cupcake(parent, ctx, { flavour = 'vanilla', style = 'swirl', at = [0, 0, 0], name = 'cupcake', s = 1 }) {
  const f = CUPCAKE[flavour] ?? CUPCAKE.vanilla;
  const { rand } = ctx;
  const g = group(name, { parent, at });
  const inner = group(`${name}_s`, { parent: g }); inner.scale.setScalar(s);
  const h = 0.034;
  paperCase(inner, { r0: 0.024, r1: 0.031, h, color: f.pastel ? '#c8e8f6' : flavour === 'chocolate' ? '#3a2a24' : '#d8c8a8', foil: flavour === 'birthday' || flavour === 'unicorn', name: `${name}_case` });
  mesh(new THREE.CylinderGeometry(0.0302, 0.0235, h, 28), crust(f.cake), { parent: inner, at: [0, h / 2 + 0.0004, 0], name: `${name}_cake` });
  mesh(lathe([[0.03, 0], [0.032, 0.004], [0.026, 0.01], [0, 0.012]], 28), crust(f.cake), { parent: inner, at: [0, h - 0.001, 0], name: `${name}_dome` });
  const y0 = h + 0.004;
  let topY;
  if (style === 'swirl' || style === 'tall') {
    const H = style === 'tall' ? 0.07 : 0.045;
    const m = swirlCream(inner, [0, y0 - 0.006, 0], 0.03, H, f.frost, `${name}_frosting`);
    if (f.pastel) { vcolor(m.geometry, (x, y, z, c) => c.set(['#f2c0e6', '#b8e0f6', '#f6eeb0', '#c8f0d0'][Math.floor((Math.atan2(z, x) + PI) / (PI / 2)) % 4])); m.material.vertexColors = true; m.material.color.set('#fff'); }
    topY = y0 + H - 0.012;
  } else if (style === 'dome') {
    mesh(new THREE.SphereGeometry(0.032, 28, 14, 0, TAU, 0, PI / 2).scale(1, 0.75, 1), cream(f.frost, { rough: 0.35, cc: 0.3 }), { parent: inner, at: [0, y0 - 0.004, 0], name: `${name}_frosting` });
    topY = y0 + 0.02;
  } else {
    // rosette: flat spiral
    const m = swirlCream(inner, [0, y0 - 0.012, 0], 0.033, 0.016, f.frost, `${name}_frosting`, { turns: 2.4 });
    void m; topY = y0 + 0.008;
  }
  if (f.crumbs && rand) scatter(inner, cached('ccrumb', () => new THREE.DodecahedronGeometry(0.0022, 0)), crust(f.crumbs), Array.from({ length: 22 }, () => { const a = rand() * TAU, d = rand() * 0.008; return { at: [Math.cos(a) * d, topY + 0.004, Math.sin(a) * d], rot: [rand(), rand(), rand()] }; }), `${name}_crumbs`);
  const tp = f.top;
  if (tp === 'sprinkles' || (style === 'dome' && !tp)) { if (rand) scatter(inner, sprinkleGeo(), phys('#fff', { rough: 0.35 }), Array.from({ length: 70 }, (_, i) => { const a = rand() * TAU, k = Math.sqrt(rand()) * 0.8; return { at: [Math.cos(a) * k * 0.03, style === 'dome' ? y0 - 0.004 + 0.024 * Math.sqrt(1 - k * k) + 0.001 : topY - 0.004 * k, Math.sin(a) * k * 0.03], rot: [0, rand() * 3, 0], color: SPRINKLES[i % 7] }; }), `${name}_sprinkles`); }
  if (tp === 'cherry') { mesh(new THREE.SphereGeometry(0.008, 16, 12), waxy('#b8101e', { cc: 1, rough: 0.1 }), { parent: inner, at: [0, topY + 0.008, 0], name: `${name}_cherry` }); curveTube([[0, topY + 0.015, 0], [0.004, topY + 0.03, 0], [0.01, topY + 0.04, 0]], 0.0008, phys('#5a7a2a'), { parent: inner, segments: 8, radialSegments: 4, name: `${name}_stem` }); }
  if (tp === 'strawberry') mesh(new THREE.ConeGeometry(0.009, 0.018, 10).rotateX(PI), waxy('#d81e2a', { rough: 0.2 }), { parent: inner, at: [0, topY + 0.012, 0], name: `${name}_berry` });
  if (tp === 'lemon') mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.003, 20), waxy('#f6d82a'), { parent: inner, at: [0, topY + 0.008, 0], rot: [PI / 2 - 0.3, 0, 0], name: `${name}_lemon` });
  if (tp === 'berries' && rand) scatter(inner, cached('mb', () => new THREE.SphereGeometry(0.0045, 10, 8)), phys('#2e2a5a', { rough: 0.5, sheen: 1, sheenColor: '#8a9ad0' }), [{ at: [0, topY + 0.004, 0] }, { at: [0.006, topY + 0.001, 0.004] }, { at: [-0.005, topY + 0.001, 0.005] }], `${name}_berries`);
  if (tp === 'chips' && rand) scatter(inner, BITS.chip(), phys('#2a160c', { rough: 0.5 }), Array.from({ length: 10 }, (_, i) => ({ at: [Math.cos(i * 2.4) * 0.01 * (i % 3), topY - 0.002 * (i % 3) + 0.002, Math.sin(i * 2.4) * 0.01 * (i % 3)] })), `${name}_chips`);
  if (tp === 'drizzle') { const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; const a = t * TAU * 2; pts.push([Math.cos(a) * 0.022 * (1 - t * 0.7), y0 + t * 0.03 - 0.002, Math.sin(a) * 0.022 * (1 - t * 0.7)]); } curveTube(pts, 0.0018, glaze('#a8501a'), { parent: inner, segments: 80, radialSegments: 5, name: `${name}_caramel` }); scatter(inner, cached('salt', () => new THREE.BoxGeometry(0.0028, 0.0022, 0.0026)), phys('#fff', { rough: 0.3 }), [{ at: [0, topY + 0.002, 0] }, { at: [0.003, topY + 0.001, 0.002] }], `${name}_salt`); }
  if (tp === 'horn') { mesh(new THREE.ConeGeometry(0.006, 0.03, 12), phys('#f6e08a', { metal: 0.6, rough: 0.25 }), { parent: inner, at: [0, topY + 0.016, 0], name: `${name}_horn` }); }
  if (tp === 'cookie') mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.007, 20), crust('#1e1410'), { parent: inner, at: [0, topY + 0.004, 0], rot: [PI / 2 - 0.4, 0, 0], name: `${name}_cookie` });
  if (tp === 'candle') candles(inner, [[0, topY - 0.002, 0]], { h: 0.04, ctx });
  return g;
}
export const MUFFIN_VARIANTS = { classic: {}, tulip: {}, jumbo: {}, mini: {} };
export const createMuffin = make('muffin', MUFFIN_VARIANTS, (ctx) => {
  const { variant, trim, root, rand } = ctx;
  const flavour = trim ?? 'blueberry';
  if (variant === 'mini') { for (let i = 0; i < 4; i++) muffin(root, { flavour, at: [(i % 2 - 0.5) * 0.052, 0, (Math.floor(i / 2) - 0.5) * 0.052], s: 0.6, name: `m${i}`, rand }); return; }
  muffin(root, { flavour, tulip: variant === 'tulip', s: variant === 'jumbo' ? 1.45 : 1, rand });
});
export const CUPCAKE_VARIANTS = { swirl: {}, dome: {}, rosette: {}, tall: {}, trio: {} };
export const createCupcake = make('cupcake', CUPCAKE_VARIANTS, (ctx) => {
  const { variant, trim, root } = ctx;
  const flavour = trim ?? 'vanilla';
  if (variant === 'trio') { const t = plate(root, { r: 0.13 }).top; ['swirl', 'rosette', 'dome'].forEach((st, i) => cupcake(root, ctx, { flavour, style: st, at: [Math.cos(i * 2.1) * 0.05, t, Math.sin(i * 2.1) * 0.05], name: `c${i}` })); return; }
  cupcake(root, ctx, { flavour, style: variant });
});

/* ---------------------------------------------------------------- cakes */
const CAKE = {
  vanilla: { sponge: '#f2d898', fill: '#fbf2dc', frost: '#fbf4e6', deco: '#f6a8bc' },
  chocolate: { sponge: '#4a2a18', fill: '#2a160c', frost: '#4a2616', deco: '#2a140a', ganache: true },
  strawberry: { sponge: '#f6dca0', fill: '#e83a5a', frost: '#f8c8d4', deco: '#d81e3a', berries: true },
  'red-velvet': { sponge: '#8a1420', fill: '#fbf6ee', frost: '#fbf6ee', deco: '#8a1420' },
  lemon: { sponge: '#f2dc7a', fill: '#f6e04a', frost: '#fbf6dc', deco: '#f6d82a' },
  carrot: { sponge: '#c8823a', fill: '#fbf2e2', frost: '#fbf2e2', deco: '#f27a1a', nuts: true },
  'black-forest': { sponge: '#3a2014', fill: '#fbf6ee', frost: '#fbf6ee', deco: '#8a0a1a', shavings: true },
  matcha: { sponge: '#b8d48a', fill: '#fbf6e6', frost: '#a8cc7a', deco: '#5a8a3a' },
  funfetti: { sponge: '#f6e0a8', fill: '#fbf4e6', frost: '#fbf4e6', deco: '#3ec1ff', fetti: true },
  caramel: { sponge: '#d8a860', fill: '#b8702a', frost: '#e8c08a', deco: '#a8501a', ganache: true },
};
function sectorPiece(parent, { rIn = 0, r, y, h, t0 = 0, len = TAU, mat, name, faces = true, seg = 56 }) {
  const full = len >= TAU - 1e-4;
  const n = Math.max(6, Math.round((seg * len) / TAU));
  const g = new THREE.CylinderGeometry(r, r, h, n, 1, rIn > 0, t0, len);
  const m = mesh(g, mat, { parent, at: [0, y + h / 2, 0], name });
  if (rIn > 0) {
    const ringTop = new THREE.RingGeometry(rIn, r, n, 1, t0, len); // RingGeometry theta is in XY plane; map below
    ringTop.rotateX(-PI / 2);
    // RingGeometry angle θ maps to (cos θ, -sin θ) after rotateX(-π/2); cylinder uses (sin θ, cos θ) → rotate
    ringTop.rotateY(-PI / 2);
    mesh(ringTop, mat, { parent, at: [0, y + h, 0], name: `${name}_top` });
  }
  if (!full && faces) {
    for (const th of [t0, t0 + len]) {
      const pl = new THREE.PlaneGeometry(r - rIn, h);
      pl.translate(rIn + (r - rIn) / 2, 0, 0);
      pl.rotateY(th - PI / 2);
      mesh(pl, mat.clone ? Object.assign(mat.clone(), { side: THREE.DoubleSide }) : mat, { parent, at: [0, y + h / 2, 0], name: `${name}_cut${th === t0 ? 0 : 1}` });
    }
  }
  return m;
}
function layerCake(parent, ctx, { flavour = 'vanilla', r = 0.1, layers = 3, lh = 0.03, t0 = 0, len = TAU, at = [0, 0, 0], name = 'cake', deco = true, naked = false }) {
  const f = CAKE[flavour] ?? CAKE.vanilla;
  const g = group(name, { parent, at });
  const sponge = crust(f.sponge, { rough: 0.9, sheen: 0.3 });
  const fill = cream(f.fill);
  const frost = cream(f.frost, { rough: 0.45 });
  let y = 0;
  const fh = 0.008;
  for (let i = 0; i < layers; i++) {
    sectorPiece(g, { r, y, h: lh, t0, len, mat: sponge, name: `${name}_sponge${i}` });
    y += lh;
    if (i < layers - 1) { sectorPiece(g, { r, y, h: fh, t0, len, mat: fill, name: `${name}_fill${i}` }); y += fh; }
  }
  const H = y;
  if (!naked) {
    sectorPiece(g, { rIn: r, r: r + 0.005, y: 0, h: H, t0, len, mat: frost, name: `${name}_side` });
    sectorPiece(g, { r: r + 0.005, y: H, h: 0.006, t0, len, mat: frost, name: `${name}_top` });
  }
  const top = H + (naked ? 0 : 0.006);
  if (!deco) return { g, top, H };
  const inSector = (a) => { if (len >= TAU - 1e-4) return true; const d = (((a - t0) % TAU) + TAU) % TAU; return d > 0.06 && d < len - 0.06; };
  const ring = (n, rr, yy) => { const out = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; if (inSector(a)) out.push({ a, at: [Math.sin(a) * rr, yy, Math.cos(a) * rr] }); } return out; };
  const rosettes = ring(Math.round(r * 160), r - 0.008, top);
  if (rosettes.length) scatter(g, cached('rosette', () => { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30; const a = t * TAU * 2; pts.push([Math.cos(a) * 0.008 * (1 - t * 0.7), 0.003 + t * 0.012, Math.sin(a) * 0.008 * (1 - t * 0.7)]); } return sweep(pts, { r: (t) => 0.0045 * (1 - t * 0.5), ring: (a) => 1 + 0.18 * Math.cos(a * 8), seg: 50, sides: 16 }); }), cream(f.frost), rosettes.map((q) => ({ at: [q.at[0], q.at[1] - 0.003, q.at[2]], rot: [0, q.a, 0] })), `${name}_rosettes`);
  if (!naked) { const beads = ring(Math.round(r * 300), r + 0.005, 0.004); if (beads.length) scatter(g, cached('bead', () => new THREE.SphereGeometry(0.0045, 10, 8)), cream(f.frost), beads, `${name}_beads`); }
  if (f.ganache && !naked) { const drips = ring(Math.round(r * 220), r + 0.0058, top - 0.002); if (drips.length) scatter(g, cached('drip', () => new THREE.CapsuleGeometry(0.0035, 0.012, 3, 8).translate(0, -0.006, 0).scale(1, 1, 0.6)), glaze(f.deco), drips.map((q, i) => ({ at: q.at, rot: [0, q.a, 0], scale: [1, 0.6 + ((i * 7) % 5) * 0.35, 1] })), `${name}_drips`); sectorPiece(g, { r: r + 0.0055, y: top - 0.0005, h: 0.0035, t0, len, mat: glaze(f.deco), name: `${name}_ganache` }); }
  const ctop = top + (f.ganache && !naked ? 0.003 : 0);
  if (f.berries && ctx.rand) { const pts = ring(9, r * 0.55, ctop); scatter(g, cached('cberry', () => new THREE.ConeGeometry(0.008, 0.016, 10).rotateX(PI).translate(0, 0.008, 0)), waxy('#d81e2a', { rough: 0.2 }), pts.map((q) => ({ at: q.at, rot: [0.2, q.a, 0] })), `${name}_berries`); }
  if (f.shavings && ctx.rand) { const items = []; for (let i = 0; i < 40; i++) { const a = ctx.rand() * TAU, d = Math.sqrt(ctx.rand()) * r * 0.45; if (inSector(a)) items.push({ at: [Math.sin(a) * d, ctop + 0.001, Math.cos(a) * d], rot: [ctx.rand() * 0.5, ctx.rand() * 3, 0] }); } if (items.length) scatter(g, cached('shave', () => roundedBox(0.008, 0.0015, 0.004, 0.0006, 1)), phys('#2a140a', { rough: 0.5 }), items, `${name}_shavings`); const ch = ring(8, r - 0.008, ctop + 0.012); if (ch.length) scatter(g, cached('ccherry', () => new THREE.SphereGeometry(0.0065, 12, 10)), waxy('#8a0a1a', { cc: 1, rough: 0.1 }), ch, `${name}_cherries`); }
  if (f.fetti && ctx.rand) { const items = []; for (let i = 0; i < 160; i++) { const a = ctx.rand() * TAU, d = Math.sqrt(ctx.rand()) * r * 0.85; if (inSector(a)) items.push({ at: [Math.sin(a) * d, ctop + 0.0012, Math.cos(a) * d], rot: [0, ctx.rand() * 3, 0], color: SPRINKLES[i % 7] }); } if (items.length) scatter(g, sprinkleGeo(), phys('#fff', { rough: 0.35 }), items, `${name}_sprinkles`); }
  if (f.nuts && ctx.rand) { const pts = ring(10, r * 0.6, ctop + 0.002); if (pts.length) scatter(g, cached('ccarrot', () => new THREE.ConeGeometry(0.004, 0.014, 8).rotateZ(PI / 2)), phys('#f27a1a', { rough: 0.4, cc: 0.4 }), pts.map((q) => ({ at: q.at, rot: [0, q.a, 0] })), `${name}_carrots`); }
  return { g, top: ctop, H };
}
function cakeSlice(parent, ctx, flavour, { at = [0, 0, 0], rotY = 0, name = 'slice', r = 0.1, kind = 'layer' }) {
  const len = TAU / 10;
  const holder = group(name, { parent, at, rot: [0, rotY, 0] });
  const inner = group(`${name}_c`, { parent: holder });
  if (kind === 'cheesecake') cheesecake(inner, ctx, flavour, { t0: -len / 2, len, name: `${name}_cc` });
  else layerCake(inner, ctx, { flavour, r, t0: -len / 2, len, name: `${name}_cake` });
  inner.position.z = -r * 0.55;
  return holder;
}
function cheesecake(parent, ctx, flavour, { t0 = 0, len = TAU, name = 'cheesecake', r = 0.1 } = {}) {
  const f = CAKE[flavour] ?? CAKE.vanilla;
  const g = group(name, { parent });
  sectorPiece(g, { r, y: 0, h: 0.012, t0, len, mat: crust('#b8803e'), name: `${name}_base` });
  sectorPiece(g, { r, y: 0.012, h: 0.045, t0, len, mat: cream(flavour === 'chocolate' ? '#7a4a2e' : flavour === 'matcha' ? '#c8dca0' : '#fbf2d8', { rough: 0.5 }), name: `${name}_filling` });
  const topC = { strawberry: '#c8142e', 'black-forest': '#7a0a1a', lemon: '#f6d82a', caramel: '#a8501a', chocolate: '#2a140a', 'red-velvet': '#8a1420', carrot: '#d8903a', funfetti: '#f6a8bc', matcha: '#7aa84a', vanilla: '#f6e2b0' }[flavour] ?? '#c8142e';
  sectorPiece(g, { r, y: 0.057, h: 0.005, t0, len, mat: glaze(topC), name: `${name}_topping` });
  if (f.berries && ctx.rand) { const items = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; const d = (((a - t0) % TAU) + TAU) % TAU; if (len >= TAU - 1e-4 || (d > 0.05 && d < len - 0.05)) items.push({ at: [Math.sin(a) * r * 0.75, 0.066, Math.cos(a) * r * 0.75] }); } if (items.length) scatter(g, cached('ccberry', () => new THREE.SphereGeometry(0.007, 12, 8)), waxy('#c8142e', { cc: 1 }), items, `${name}_berries`); }
  return g;
}
function bundt(parent, flavour, name = 'bundt') {
  const f = CAKE[flavour] ?? CAKE.vanilla;
  const g = group(name, { parent });
  const pts = [[0.03, 0], [0.11, 0], [0.115, 0.03], [0.1, 0.075], [0.07, 0.09], [0.045, 0.08], [0.032, 0.06], [0.03, 0]];
  const geo = lathe(pts, 72);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i); const a = Math.atan2(z, x); const k = 1 + 0.06 * Math.cos(a * 12) * Math.sin((y / 0.09) * PI * 0.9); p.setX(i, x * k); p.setZ(i, z * k); }
  geo.computeVertexNormals();
  mesh(geo, crust(f.sponge === '#4a2a18' ? '#4a2a18' : '#b8702e', { rough: 0.6, sheen: 0.3 }), { parent: g, name: `${name}_body` });
  const icing = lathe([[0.09, 0.08], [0.1, 0.076], [0.07, 0.0915], [0.046, 0.0825]], 72);
  const ip = icing.attributes.position;
  for (let i = 0; i < ip.count; i++) { const x = ip.getX(i), z = ip.getZ(i), y = ip.getY(i); const a = Math.atan2(z, x); const k = 1 + 0.065 * Math.cos(a * 12); ip.setX(i, x * k); ip.setZ(i, z * k); if (y < 0.08) ip.setY(i, y - Math.max(0, Math.sin(a * 12 + 0.5)) * 0.03); }
  icing.computeVertexNormals();
  mesh(icing, glaze(f.ganache ? f.deco : '#fbf6ee', { side: THREE.DoubleSide }), { parent: g, name: `${name}_icing` });
  return g;
}
function swissRoll(parent, flavour, name = 'roll') {
  const f = CAKE[flavour] ?? CAKE.vanilla;
  const g = group(name, { parent });
  const L = 0.22, R = 0.045;
  const body = new THREE.CylinderGeometry(R, R, L, 40, 1, true).rotateZ(PI / 2);
  mesh(body, crust(f.sponge === '#f2d898' ? '#c88a40' : f.sponge, { rough: 0.6 }), { parent: g, at: [0, R, 0], name: `${name}_outer` });
  for (const s of [-1, 1]) {
    const outer = [], inner = [];
    for (let i = 0; i <= 80; i++) { const t = i / 80; const a = t * TAU * 2.6; const r = 0.003 + t * (R - 0.006); outer.push([Math.cos(a) * (r + 0.0028), Math.sin(a) * (r + 0.0028)]); inner.push([Math.cos(a) * Math.max(0.0005, r - 0.0028), Math.sin(a) * Math.max(0.0005, r - 0.0028)]); }
    const spiral = new THREE.ShapeGeometry(new THREE.Shape([...outer, ...inner.reverse()].map(([x, y]) => new THREE.Vector2(x, y))));
    spiral.rotateY(s * PI / 2);
    mesh(spiral, cream(f.fill, { side: THREE.DoubleSide }), { parent: g, at: [s * (L / 2 + 0.0006), R, 0], name: `${name}_swirl${s}` });
    mesh(new THREE.CircleGeometry(R, 40).rotateY(s * PI / 2), crust(f.sponge, { side: THREE.DoubleSide }), { parent: g, at: [s * L / 2, R, 0], name: `${name}_end${s}` });
  }
  mesh(cushion(L * 0.9, 0.004, R * 1.2, { radius: 0.0018 }), phys('#ffffff', { rough: 1 }), { parent: g, at: [0, R * 2, 0], name: `${name}_sugar` });
  return g;
}
export const CAKE_VARIANTS = { layer: {}, slice: {}, birthday: {}, cut: {}, bundt: {}, cheesecake: {}, 'swiss-roll': {}, tiered: {}, sheet: {}, drip: {} };
export const createCake = make('cake', CAKE_VARIANTS, (ctx) => {
  const { variant, trim, root, rand } = ctx;
  const fl = trim ?? 'vanilla';
  const stand = (r = 0.15) => { const top = 0.09; mesh(lathe([[0, 0], [0.06, 0], [0.065, 0.006], [0.02, 0.012], [0.015, top - 0.008], [r, top - 0.004], [r, top], [0, top]], 48), ceramic('#f8f6f0'), { parent: root, name: 'stand' }); return top; };
  switch (variant) {
    case 'layer': { const t = stand(); layerCake(root, ctx, { flavour: fl, at: [0, t, 0] }); break; }
    case 'slice': { const t = plate(root, { r: 0.1 }).top; cakeSlice(root, ctx, fl, { at: [0.0, t, 0.02] }); mesh(roundedBox(0.012, 0.003, 0.14, 0.0012), metalMat('#d8dce0'), { parent: root, at: [0.06, t + 0.0015, 0], rot: [0, 0.2, 0], name: 'fork' }); break; }
    case 'birthday': {
      const t = plate(root, { r: 0.15, color: '#e8f2f8' }).top;
      const c = layerCake(root, ctx, { flavour: fl, at: [0, t, 0] });
      const pos = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; pos.push([Math.sin(a) * 0.05, t + c.top, Math.cos(a) * 0.05]); }
      candles(root, pos, { ctx });
      if (rand && !CAKE[fl]?.fetti) scatter(root, sprinkleGeo(), phys('#fff', { rough: 0.35 }), Array.from({ length: 90 }, (_, i) => { const a = rand() * TAU, d = Math.sqrt(rand()) * 0.08; return { at: [Math.sin(a) * d, t + c.top + 0.0012, Math.cos(a) * d], rot: [0, rand() * 3, 0], color: SPRINKLES[i % 7] }; }), 'sprinkles');
      break;
    }
    case 'cut': {
      const t = board(root, { w: 0.34, d: 0.34, round: true, color: '#a8784a' });
      const len = TAU / 8;
      layerCake(root, ctx, { flavour: fl, at: [0, t, 0], t0: len / 2, len: TAU - len });
      const s = cakeSlice(root, ctx, fl, { at: [0.0, t, 0.11], name: 'slice' });
      s.rotation.y = PI * 0.95; s.position.set(0.02, t, 0.2);
      mesh(roundedBox(0.03, 0.002, 0.16, 0.0008), metalMat('#d8dce0'), { parent: root, at: [0.13, t + 0.001, 0], name: 'server' });
      break;
    }
    case 'bundt': { const t = plate(root, { r: 0.14 }).top; const g = bundt(root, fl); g.position.y = t; break; }
    case 'cheesecake': { const t = stand(); const g = cheesecake(root, ctx, fl === 'vanilla' ? 'strawberry' : fl); g.position.y = t; break; }
    case 'swiss-roll': { const t = board(root, { w: 0.3, d: 0.14 }); const g = swissRoll(root, fl); g.position.y = t; break; }
    case 'tiered': {
      const t = stand(0.17);
      const a = layerCake(root, ctx, { flavour: fl, r: 0.14, layers: 2, lh: 0.035, at: [0, t, 0], name: 'tier1' });
      const b = layerCake(root, ctx, { flavour: fl, r: 0.1, layers: 2, lh: 0.03, at: [0, t + a.top, 0], name: 'tier2' });
      const c = layerCake(root, ctx, { flavour: fl, r: 0.065, layers: 2, lh: 0.026, at: [0, t + a.top + b.top, 0], name: 'tier3' });
      const y = t + a.top + b.top + c.top;
      for (let i = 0; i < 5; i++) { const ang = (i / 5) * TAU; mesh(new THREE.SphereGeometry(0.012, 14, 10).scale(1, 0.6, 1), cream(CAKE[fl].deco), { parent: root, at: [Math.sin(ang) * 0.015, y + 0.006, Math.cos(ang) * 0.015], name: `flower${i}` }); }
      break;
    }
    case 'sheet': {
      const f = CAKE[fl];
      const top = board(root, { w: 0.4, d: 0.3 });
      mesh(roundedBox(0.34, 0.05, 0.24, 0.008), crust(f.sponge), { parent: root, at: [0, top + 0.025, 0], name: 'sponge' });
      mesh(cushion(0.35, 0.012, 0.25, { radius: 0.005, bulge: 0.15 }), cream(f.frost), { parent: root, at: [0, top + 0.054, 0], name: 'frosting' });
      const items = []; for (let i = 0; i < 26; i++) { const t = i / 26; const p = t < 0.3 ? [-0.16 + t / 0.3 * 0.32, -0.11] : t < 0.5 ? [0.16, -0.11 + (t - 0.3) / 0.2 * 0.22] : t < 0.8 ? [0.16 - (t - 0.5) / 0.3 * 0.32, 0.11] : [-0.16, 0.11 - (t - 0.8) / 0.2 * 0.22]; items.push({ at: [p[0], top + 0.058, p[1]], rot: [0, t * 9, 0] }); }
      scatter(root, cached('rosette2', () => new THREE.SphereGeometry(0.008, 10, 8).scale(1, 0.8, 1)), cream(f.deco), items, 'border');
      break;
    }
    case 'drip': {
      const t = stand();
      const c = layerCake(root, ctx, { flavour: fl, r: 0.08, layers: 4, lh: 0.028, at: [0, t, 0], deco: false });
      const f = CAKE[fl];
      const g = group('drip', { parent: root, at: [0, t, 0] });
      const n = 22; const items = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU; items.push({ at: [Math.sin(a) * 0.0858, c.top - 0.002, Math.cos(a) * 0.0858], rot: [0, a, 0], scale: [1, 0.8 + ((i * 7) % 5) * 0.5, 1] }); }
      const dc = f.ganache ? f.deco : '#3a1e10';
      scatter(g, cached('drip', () => new THREE.CapsuleGeometry(0.0035, 0.012, 3, 8).translate(0, -0.006, 0).scale(1, 1, 0.6)), glaze(dc), items, 'drips');
      mesh(new THREE.CylinderGeometry(0.0855, 0.0855, 0.004, 48), glaze(dc), { parent: g, at: [0, c.top + 0.0015, 0], name: 'ganache' });
      // toppings: macarons-like discs, berries, a wafer
      const tops = [[0.03, 0.01], [-0.02, 0.03], [-0.03, -0.02], [0.02, -0.03]];
      tops.forEach(([x, z], i) => mesh(new THREE.SphereGeometry(0.013, 14, 10), i % 2 ? waxy(f.deco, { cc: 1 }) : cream('#fbf4e6'), { parent: g, at: [x, c.top + 0.012, z], name: `topper${i}` }));
      mesh(roundedBox(0.008, 0.05, 0.03, 0.002), crust('#d8a860'), { parent: g, at: [0, c.top + 0.026, 0], rot: [0, 0.4, 0.3], name: 'wafer' });
      break;
    }
    default: break;
  }
});

/* ---------------------------------------------------------------- pies */
const PIE = {
  apple: { fill: '#d8a040', chunks: '#e8c060' }, cherry: { fill: '#9a0e1e', chunks: '#b8101e', round: true }, blueberry: { fill: '#2e1e4a', chunks: '#3a2a6a', round: true },
  pumpkin: { fill: '#d0702a', smooth: true }, pecan: { fill: '#5a2a10', pecans: true }, lemon: { fill: '#f6d83a', smooth: true, meringue: true }, 'key-lime': { fill: '#dce8a0', smooth: true, cream: true },
  strawberry: { fill: '#d8203a', chunks: '#e83040', round: true }, peach: { fill: '#f2a040', chunks: '#f6b050' }, rhubarb: { fill: '#c83a4a', chunks: '#d84a5a' },
};
function pieDish(parent, r = 0.12, h = 0.04) {
  const out = [[0, 0], [r * 0.78, 0], [r * 0.82, 0.004], [r * 0.95, h * 0.9], [r, h]];
  const v = vessel(out, 0.005);
  mesh(v.geo, ceramic('#e8eef2'), { parent, name: 'dish' });
  return v;
}
function crimp(parent, r, y, name = 'rim', col = '#d0904a') {
  const geo = new THREE.TorusGeometry(r, 0.009, 10, 96);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), yy = p.getY(i); const a = Math.atan2(yy, x); const k = 1 + 0.0 * a; void k; const w = 0.004 * Math.cos(a * 30); const rr = Math.hypot(x, yy); p.setX(i, x * (1 + w / rr)); p.setY(i, yy * (1 + w / rr)); }
  geo.rotateX(PI / 2); geo.scale(1, 0.75, 1);
  geo.computeVertexNormals();
  vcolor(geo, (x, yy, z, c) => c.set(col).lerp(C('#8a4a1a'), Math.max(0, yy / 0.007) * 0.7).multiplyScalar(0.9 + fbm(x * 90, yy * 90, z * 90) * 0.2));
  return mesh(geo, gloss('#fff', { vc: true, rough: 0.45 }), { parent, at: [0, y, 0], name });
}
function pieWhole(parent, ctx, { filling = 'apple', style = 'lattice', at = [0, 0, 0], s = 1, name = 'pie' }) {
  const f = PIE[filling] ?? PIE.apple;
  const { rand } = ctx;
  const g = group(name, { parent, at });
  const inner = group(`${name}_s`, { parent: g }); inner.scale.setScalar(s);
  const R = 0.12, H = 0.04;
  const tart = style === 'tart';
  let fy;
  if (tart) {
    const out = [[0, 0], [R * 0.9, 0]]; for (let i = 1; i <= 4; i++) out.push([R * (0.9 + 0.1 * (i / 4)), 0.028 * (i / 4)]);
    const v = vessel(out, 0.006, { seg: 96 });
    const p = v.geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i); if (y < 0.002) continue; const a = Math.atan2(z, x); const k = 1 + 0.03 * Math.abs(Math.sin(a * 18)); p.setX(i, x * k); p.setZ(i, z * k); }
    v.geo.computeVertexNormals();
    mesh(v.geo, crust('#d8a050'), { parent: inner, name: `${name}_shell` });
    fy = 0.022;
    mesh(new THREE.CylinderGeometry(v.inner(fy), v.inner(0.006), fy - 0.006, 64), cream(f.smooth ? f.fill : '#f6e2a0', { rough: 0.35 }), { parent: inner, at: [0, (fy + 0.006) / 2, 0], name: `${name}_custard` });
    if (!f.smooth && rand) { const items = []; for (let k = 0; k < 3; k++) { const n = [1, 8, 14][k]; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; const d = [0, 0.04, 0.08][k]; items.push({ at: [Math.cos(a) * d, fy + 0.005, Math.sin(a) * d], rot: [0, -a, 0] }); } } scatter(inner, f.round ? cached('tberry', () => new THREE.SphereGeometry(0.009, 12, 10)) : cached('tslice', () => new THREE.SphereGeometry(0.014, 14, 8, 0, TAU, 0, PI / 2).scale(1, 0.35, 0.6)), glaze(f.chunks), items, `${name}_fruit`); }
    return g;
  }
  pieDish(inner, R, H);
  fy = H - 0.006;
  mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.8, fy - 0.005, 64), glaze(f.fill, { rough: 0.25 }), { parent: inner, at: [0, (fy + 0.005) / 2, 0], name: `${name}_filling` });
  if (f.chunks && style !== 'double' && rand) { const items = []; for (let i = 0; i < 40; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * R * 0.85; items.push({ at: [Math.cos(a) * d, fy + 0.001, Math.sin(a) * d], rot: [rand(), rand() * 3, rand()] }); } scatter(inner, f.round ? cached('pberry', () => new THREE.SphereGeometry(0.007, 10, 8)) : cached('pchunk', () => roundedBox(0.014, 0.008, 0.01, 0.003, 1)), glaze(f.chunks), items, `${name}_chunks`); }
  crimp(inner, R * 0.95, H + 0.002, `${name}_rim`);
  if (style === 'lattice') {
    const strips = [];
    for (const dir of [0, 1]) for (let i = -3; i <= 3; i++) {
      const off = i * 0.03;
      const len = 2 * Math.sqrt(Math.max(0, (R * 0.95) ** 2 - off * off));
      strips.push({ at: dir ? [off, fy + 0.006 + (i % 2 ? 0.002 : 0), 0] : [0, fy + 0.006 + (i % 2 ? 0 : 0.002), off], rot: [0, dir ? 0 : PI / 2, 0], scale: [1, 1, len / 0.2] });
    }
    const lm = gloss('#c8803a', { rough: 0.45 });
    scatter(inner, cached('latstrip', () => roundedBox(0.018, 0.005, 0.2, 0.002, 2)), lm, strips, `${name}_lattice`);
  } else if (style === 'double') {
    const dome = lathe([[R * 0.97, H], [R * 0.85, H + 0.015], [R * 0.5, H + 0.03], [0, H + 0.034]], 64);
    vcolor(dome, (x, y, z, c) => { c.set('#d0904a').lerp(C('#8a4a1a'), Math.max(0, (y - H) / 0.034) * 0.7 * fbm(x * 40, y * 40, z * 40) + 0.1); const a = Math.atan2(z, x); const d = Math.hypot(x, z); if (d > 0.015 && d < 0.05 && Math.abs(Math.sin(a * 3)) < 0.06) c.set(f.fill); });
    mesh(dome, gloss('#fff', { vc: true, rough: 0.4 }), { parent: inner, name: `${name}_top` });
  } else if (style === 'crumble') {
    if (rand) { const items = []; for (let i = 0; i < 160; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * R * 0.9; items.push({ at: [Math.cos(a) * d, fy + 0.002 + rand() * 0.006, Math.sin(a) * d], rot: [rand() * 3, rand() * 3, 0], scale: 0.7 + rand() * 0.8 }); } scatter(inner, cached('crumble', () => new THREE.DodecahedronGeometry(0.006, 0)), crust('#c88a4a'), items, `${name}_crumble`); }
  } else if (style === 'meringue') {
    if (rand) { const items = []; for (let i = 0; i < 40; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * R * 0.82; items.push({ at: [Math.cos(a) * d, fy, Math.sin(a) * d], rot: [0, rand() * 3, 0], scale: 0.8 + rand() * 0.6 }); } const mg = cached('meringue', () => { const g2 = new THREE.ConeGeometry(0.016, 0.03, 12, 4); g2.translate(0, 0.015, 0); vcolor(g2, (x, y, z, c) => c.set('#fbf6ec').lerp(C('#c8803a'), Math.max(0, y / 0.03 - 0.55) * 1.6)); return g2; }); scatter(inner, mg, cream('#fff', { vc: true }), items, `${name}_meringue`); }
  }
  if (f.pecans && style !== 'double') { const items = []; for (let k = 0; k < 2; k++) for (let i = 0; i < (k ? 16 : 8); i++) { const a = (i / (k ? 16 : 8)) * TAU; const d = k ? 0.08 : 0.04; items.push({ at: [Math.cos(a) * d, fy + 0.002, Math.sin(a) * d], rot: [0, -a, 0] }); } scatter(inner, cached('pecan2', () => new THREE.SphereGeometry(0.008, 10, 6).scale(1.6, 0.5, 0.8)), glaze('#4a2010'), items, `${name}_pecans`); }
  if (f.cream && style !== 'double') { const items = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; items.push({ at: [Math.cos(a) * 0.085, fy + 0.002, Math.sin(a) * 0.085] }); } scatter(inner, cached('rosette3', () => new THREE.ConeGeometry(0.009, 0.016, 8).translate(0, 0.008, 0)), cream('#fbf8f0'), items, `${name}_cream`); }
  return g;
}
function pieSlice(parent, ctx, filling, { at = [0, 0, 0], name = 'slice' }) {
  const f = PIE[filling] ?? PIE.apple;
  const len = TAU / 8, t0 = -len / 2;
  const g = group(name, { parent, at });
  const inner = group(`${name}_c`, { parent: g, at: [0, 0, -0.06] });
  sectorPiece(inner, { r: 0.11, y: 0, h: 0.006, t0, len, mat: crust('#d8a050'), name: `${name}_base` });
  sectorPiece(inner, { r: 0.105, y: 0.006, h: 0.03, t0, len, mat: glaze(f.fill, { rough: 0.3 }), name: `${name}_filling` });
  sectorPiece(inner, { rIn: 0.098, r: 0.115, y: 0.0, h: 0.042, t0, len, mat: gloss('#c8803a', { rough: 0.45 }), name: `${name}_crust` });
  if (f.meringue) sectorPiece(inner, { r: 0.105, y: 0.036, h: 0.03, t0, len, mat: cream('#fbf4e6'), name: `${name}_meringue` });
  else if (f.cream) sectorPiece(inner, { r: 0.1, y: 0.036, h: 0.012, t0, len, mat: cream('#fbf8f0'), name: `${name}_cream` });
  else if (!f.smooth) sectorPiece(inner, { r: 0.112, y: 0.036, h: 0.007, t0, len, mat: gloss('#c8803a', { rough: 0.45 }), name: `${name}_top` });
  return g;
}
export const PIE_VARIANTS = { lattice: {}, double: {}, slice: {}, tart: {}, crumble: {}, meringue: {}, mini: {} };
export const createPie = make('pie', PIE_VARIANTS, (ctx) => {
  const { variant, trim, root } = ctx;
  const fill = trim ?? (variant === 'meringue' ? 'lemon' : variant === 'tart' ? 'strawberry' : 'apple');
  if (variant === 'slice') { const t = plate(root, { r: 0.1 }).top; pieSlice(root, ctx, fill, { at: [0, t, 0.01] }); return; }
  if (variant === 'mini') { [[-0.07, 0], [0.07, 0], [0, 0.11]].forEach(([x, z], i) => pieWhole(root, ctx, { filling: fill, style: ['lattice', 'double', 'crumble'][i], at: [x, 0, z], s: 0.5, name: `mini${i}` })); return; }
  pieWhole(root, ctx, { filling: fill, style: variant });
});

/* ---------------------------------------------------------------- cookies */
const COOKIE = {
  'chocolate-chip': { dough: '#c8904a', edge: '#a8662a', bits: '#2a160c' }, 'double-chocolate': { dough: '#4a2a18', edge: '#2e180e', bits: '#f6efe0' },
  'oatmeal-raisin': { dough: '#c8a060', edge: '#a87a3a', bits: '#3a1a14', oats: true }, sugar: { dough: '#f2dcaa', edge: '#d8b070', sugar: true },
  'peanut-butter': { dough: '#c88a4a', edge: '#a8662a', cross: true }, 'white-macadamia': { dough: '#d8a860', edge: '#b0702e', bits: '#f6f0e0' },
  'red-velvet': { dough: '#8a1a22', edge: '#6a1018', bits: '#f6f0e6' }, matcha: { dough: '#a8c47a', edge: '#7a9a4a', bits: '#f6f0e6' },
};
function cookie(parent, { flavour = 'chocolate-chip', at = [0, 0, 0], rot = [0, 0, 0], name = 'cookie', rand, r = 0.04, bitten = false }) {
  const f = COOKIE[flavour] ?? COOKIE['chocolate-chip'];
  const g = group(name, { parent, at, rot });
  const h = 0.011;
  const geo = jitter(lathe([[0, 0], [r * 0.95, 0], [r, h * 0.35], [r * 0.9, h * 0.85], [r * 0.5, h], [0, h * 1.02]], 40), rand ?? (() => 0.5), 0.025);
  vcolor(geo, (x, y, z, c) => { const d = Math.hypot(x, z) / r; c.set(f.dough).lerp(C(f.edge), Math.max(0, d - 0.6) * 2.2).multiplyScalar(0.85 + fbm(x * 90, y * 90, z * 90) * 0.3); if (fbm(x * 60, 0, z * 60) > 0.66) c.multiplyScalar(0.78); if (f.cross && (Math.abs(((x * 300) % 6 + 6) % 6 - 3) < 0.5 || Math.abs(((z * 300) % 6 + 6) % 6 - 3) < 0.5)) c.multiplyScalar(0.8); });
  if (bitten) biteGeo(geo, [{ at: [r * 1.15, h / 2, 0], r: r * 0.42 }, { at: [r * 1.05, h / 2, r * 0.35], r: r * 0.3 }], { centre: [0, h / 2, 0], color: f.dough });
  mesh(geo, crust('#fff', { vc: true, rough: f.sugar ? 0.5 : 0.75 }), { parent: g, name: `${name}_body` });
  if (f.bits && rand) { const items = []; for (let i = 0; i < 12; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * r * 0.75; if (bitten && Math.cos(a) * d > r * 0.6) continue; items.push({ at: [Math.cos(a) * d, h * (1 - (d / r) ** 2 * 0.4) - 0.001, Math.sin(a) * d], rot: [rand(), rand(), rand()] }); } items.push({ at: [0, h, 0] }); scatter(g, f.oats ? cached('raisin2', () => jitter(new THREE.SphereGeometry(0.004, 8, 6).scale(1, 0.6, 1), () => 0.4, 0)) : cached('chip2', () => new THREE.DodecahedronGeometry(0.0045, 0).scale(1, 0.75, 1)), phys(f.bits, { rough: 0.45, cc: 0.3 }), items, `${name}_chips`); }
  if (f.sugar && rand) scatter(g, cached('sugarx', () => new THREE.BoxGeometry(0.0015, 0.0012, 0.0015)), phys('#ffffff', { rough: 0.1, cc: 1 }), Array.from({ length: 70 }, () => { const a = rand() * TAU, d = Math.sqrt(rand()) * r * 0.85; return { at: [Math.cos(a) * d, h * (1 - (d / r) ** 2 * 0.3), Math.sin(a) * d], rot: [rand(), rand(), 0] }; }), `${name}_sugar`);
  return g;
}
function shapeOutline(kind, s = 0.045) {
  const pts = [];
  if (kind === 'star') for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + PI / 2; const r = i % 2 ? s * 0.45 : s; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  else if (kind === 'heart') for (let i = 0; i < 40; i++) { const t = (i / 40) * TAU; pts.push([s * 0.06 * 16 * Math.sin(t) ** 3 / 1.0, s * 0.06 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
  else if (kind === 'tree') pts.push([-s * 0.15, -s], [s * 0.15, -s], [s * 0.15, -s * 0.75], [s * 0.8, -s * 0.75], [s * 0.35, -s * 0.2], [s * 0.6, -s * 0.2], [s * 0.2, s * 0.35], [s * 0.4, s * 0.35], [0, s], [-s * 0.4, s * 0.35], [-s * 0.2, s * 0.35], [-s * 0.6, -s * 0.2], [-s * 0.35, -s * 0.2], [-s * 0.8, -s * 0.75], [-s * 0.15, -s * 0.75]);
  else if (kind === 'man') { const add = (cx, cy, rx, ry, a0, a1, n = 8) => { for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } };
    add(0, s * 0.62, s * 0.3, s * 0.3, -0.9, PI + 0.9, 14); pts.push([-s * 0.28, s * 0.25]); add(-s * 0.62, s * 0.18, s * 0.14, s * 0.14, PI / 2, PI * 1.5, 6); pts.push([-s * 0.3, -s * 0.15]); add(-s * 0.32, -s * 0.85, s * 0.16, s * 0.16, PI * 0.8, TAU, 8); pts.push([0, -s * 0.45]); add(s * 0.32, -s * 0.85, s * 0.16, s * 0.16, PI, TAU + PI * 0.2, 8); pts.push([s * 0.3, -s * 0.15]); add(s * 0.62, s * 0.18, s * 0.14, s * 0.14, -PI / 2, PI / 2, 6); pts.push([s * 0.28, s * 0.25]); }
  else for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU; pts.push([Math.cos(a) * s, Math.sin(a) * s]); }
  return pts;
}
function cutCookie(parent, { kind = 'star', icing = '#fbf6ee', at = [0, 0, 0], rotY = 0, name = 'cookie', dough = '#d8a050', rand, sprinkles = false, piping = false }) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const pts = shapeOutline(kind);
  const base = extrudeOutline(pts, 0.008, { bevel: 0.0025, segments: 2 });
  base.rotateX(-PI / 2);
  mesh(base, crust(dough), { parent: g, at: [0, 0.004, 0], name: `${name}_base` });
  if (icing) {
    const ic = extrudeOutline(pts.map(([x, y]) => [x * 0.88, y * 0.88]), 0.003, { bevel: 0.0012, segments: 2 });
    ic.rotateX(-PI / 2);
    mesh(ic, glaze(icing, { rough: 0.3 }), { parent: g, at: [0, 0.0095, 0], name: `${name}_icing` });
    if (sprinkles && rand) scatter(g, sprinkleGeo(), phys('#fff', { rough: 0.35 }), Array.from({ length: 30 }, (_, i) => ({ at: [(rand() - 0.5) * 0.04, 0.0113, (rand() - 0.5) * 0.04], rot: [0, rand() * 3, 0], color: SPRINKLES[i % 7] })), `${name}_sprinkles`);
  }
  if (piping) {
    const pl = pts.map(([x, y]) => [x * 0.86, 0.0085, -y * 0.86]);
    curveTube(pl, 0.0012, cream('#fbfaf6', { cc: 0.5, rough: 0.3 }), { parent: g, segments: 120, radialSegments: 5, closed: true, name: `${name}_piping` });
    if (kind === 'man') { scatter(g, cached('button', () => new THREE.SphereGeometry(0.003, 8, 6)), glaze('#e8203a'), [{ at: [0, 0.0095, 0.0] }, { at: [0, 0.0095, -0.01] }, { at: [0, 0.0095, 0.01] }], `${name}_buttons`); scatter(g, cached('eyeb', () => new THREE.SphereGeometry(0.0022, 8, 6)), phys('#fbfaf6'), [{ at: [-0.006, 0.0095, -0.03] }, { at: [0.006, 0.0095, -0.03] }], `${name}_eyes`); curveTube([[-0.007, 0.0092, -0.021], [0, 0.0092, -0.018], [0.007, 0.0092, -0.021]], 0.001, cream('#fbfaf6'), { parent: g, segments: 8, radialSegments: 4, name: `${name}_smile` }); }
  }
  return g;
}
function gingerHouse(parent) {
  const g = group('house', { parent });
  const dough = crust('#a8662a');
  const icing = cream('#fbfaf6', { cc: 0.4, rough: 0.3 });
  mesh(roundedBox(0.2, 0.008, 0.17, 0.003), cream('#fbfaf6'), { parent: g, at: [0, 0.004, 0], name: 'snow' });
  const W = 0.12, D = 0.09, Hh = 0.07;
  const gable = [[-W / 2, 0], [W / 2, 0], [W / 2, Hh], [0, Hh + 0.045], [-W / 2, Hh]];
  for (const z of [-D / 2, D / 2]) { const geo = extrudeOutline(gable, 0.008, { bevel: 0.0015, segments: 1 }); mesh(geo, dough, { parent: g, at: [0, 0.008, z], name: `gable${z > 0 ? 'f' : 'b'}` }); }
  for (const x of [-W / 2, W / 2]) mesh(roundedBox(0.008, Hh, D - 0.008, 0.002), dough, { parent: g, at: [x, 0.008 + Hh / 2, 0], name: `wall${x > 0 ? 'r' : 'l'}` });
  const roofL = Math.hypot(W / 2, 0.045) + 0.015;
  for (const s of [-1, 1]) {
    const rf = group(`roof${s}`, { parent: g, at: [0, 0.008 + Hh + 0.045, 0], rot: [0, 0, s * -Math.atan2(0.045, W / 2)] });
    mesh(roundedBox(roofL, 0.008, D + 0.03, 0.002), dough, { parent: rf, at: [s * roofL / 2, 0.004, 0], name: `roof${s}_panel` });
    for (let k = 0; k < 3; k++) curveTube([[s * (0.01 + k * 0.025), 0.009, -D / 2 - 0.012], [s * (0.012 + k * 0.025), 0.01, 0], [s * (0.01 + k * 0.025), 0.009, D / 2 + 0.012]], 0.002, icing, { parent: rf, segments: 12, radialSegments: 5, name: `roof${s}_icing${k}` });
  }
  mesh(roundedBox(0.03, 0.04, 0.004, 0.002), crust('#5a2e12'), { parent: g, at: [0, 0.028, D / 2 + 0.006], name: 'door' });
  scatter(g, cached('gumdrop', () => new THREE.SphereGeometry(0.005, 10, 6, 0, TAU, 0, PI / 2)), phys('#ffffff', { rough: 0.25, cc: 0.6 }), Array.from({ length: 8 }, (_, i) => ({ at: [-0.05 + i * 0.0145, 0.008, D / 2 + 0.012], color: SPRINKLES[i % 7] })), 'gumdrops');
  return g;
}
export const COOKIE_VARIANTS = { round: {}, sandwich: {}, stack: {}, jar: {}, iced: {}, gingerbread: {}, biscotti: {}, thumbprint: {} };
export const createCookie = make('cookie', COOKIE_VARIANTS, (ctx) => {
  const { variant, trim, root, rand, animations, oneShot } = ctx;
  const fl = COOKIE[trim] ? trim : 'chocolate-chip';
  switch (variant) {
    case 'round':
      if (trim === 'bitten') { cookie(root, { rand, bitten: true }); break; }
      if (trim === 'milk') { cookie(root, { flavour: 'chocolate-chip', rand, at: [-0.05, 0, 0] }); const c = cup(root, { rTop: 0.035, rBot: 0.03, h: 0.12, mat: clearGlass(), at: [0.04, 0, 0] }); mesh(fillGeo(c.local.inner, c.local.floor, 0.095), phys('#fbfbf6', { rough: 0.2, cc: 0.5 }), { parent: root, at: [0.04, 0, 0], name: 'milk' }); break; }
      cookie(root, { flavour: fl, rand, r: 0.045 }); break;
    case 'sandwich': {
      const dark = trim !== 'vanilla';
      const shell = dark ? '#1e1410' : '#e8c88a';
      const fill = { mint: '#b8ecd2', strawberry: '#f6b8c8', vanilla: '#fbf6ee', 'peanut-butter': '#c88a4a' }[trim] ?? '#fbf6ee';
      const g = group('sandwich', { parent: root });
      const disc = () => { const d = lathe([[0, 0], [0.024, 0], [0.025, 0.003], [0.024, 0.006], [0, 0.006]], 36); return d; };
      mesh(disc(), crust(shell, { rough: 0.6 }), { parent: g, name: 'bottom' });
      mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.006, 32), cream(fill), { parent: g, at: [0, 0.009, 0], name: 'cream' });
      mesh(disc(), crust(shell, { rough: 0.6 }), { parent: g, at: [0, 0.012, 0], name: 'top' });
      // embossed pattern ring
      mesh(new THREE.TorusGeometry(0.018, 0.0012, 4, 32).rotateX(PI / 2), crust(shell), { parent: g, at: [0, 0.018, 0], name: 'emboss' });
      if (trim === 'stack' || trim === undefined) { for (let i = 1; i < 3; i++) { const c = g.clone(); c.name = `sandwich${i}`; c.traverse((o) => { if (o !== c) o.name = `${o.name}_${i}`; }); c.position.set(i * 0.05 - 0.05, 0, (i % 2) * 0.02); g.parent.add(c); } }
      break;
    }
    case 'stack': for (let i = 0; i < 5; i++) cookie(root, { flavour: fl, rand, at: [Math.sin(i * 2) * 0.004, i * 0.0108, Math.cos(i * 3) * 0.004], rot: [0, i, 0], name: `c${i}`, r: 0.042 }); break;
    case 'jar': {
      const jarOut = [[0, 0], [0.065, 0], [0.07, 0.008], [0.07, 0.16], [0.06, 0.175], [0.058, 0.185]];
      const v = vessel(jarOut, 0.003);
      mesh(v.geo, clearGlass('#f2f8fa'), { parent: root, name: 'jar' });
      for (let i = 0; i < 7; i++) { const c = cookie(root, { flavour: fl, rand, at: [0, v.floor + 0.04 + i * 0.016, 0], rot: [PI / 2 - 0.3 + (i % 3) * 0.2, i * 0.9, 0], name: `c${i}`, r: 0.04 }); void c; }
      cookie(root, { flavour: fl, rand, at: [0, v.floor, 0], name: 'cbase', r: 0.05 });
      const lid = group('lid', { parent: root, at: [0, 0.185, 0] });
      mesh(lathe([[0.064, 0], [0.066, 0.004], [0.066, 0.016], [0.06, 0.02], [0, 0.022]], 40), clearGlass('#f2f8fa', { opacity: 0.4 }), { parent: lid, name: 'lid_glass' });
      mesh(new THREE.SphereGeometry(0.014, 16, 10), clearGlass('#f2f8fa', { opacity: 0.4 }), { parent: lid, at: [0, 0.03, 0], name: 'lid_knob' });
      mesh(new THREE.TorusGeometry(0.06, 0.003, 6, 40).rotateX(PI / 2), plasticMat('#e0e4e6'), { parent: lid, at: [0, 0.002, 0], name: 'lid_seal' });
      animations.push(clip('lidOpen', 1, [moveTrackLocal(lid)]));
      oneShot.push('lidOpen');
      break;
    }
    case 'iced': {
      const kind = ['star', 'heart', 'tree', 'round'].includes(trim) ? trim : 'star';
      const ic = { star: '#ffd23f', heart: '#f48aa8', tree: '#4ab85a', round: '#9ad8f6' }[kind];
      for (let i = 0; i < 3; i++) cutCookie(root, { kind, icing: i === 1 ? '#fbf6ee' : ic, at: [(i - 1) * 0.1, 0, (i % 2) * 0.03], rotY: (i - 1) * 0.3, name: `c${i}`, rand, sprinkles: kind === 'round' || i === 1 });
      break;
    }
    case 'gingerbread':
      if (trim === 'house') { gingerHouse(root); break; }
      if (trim === 'tray') { mesh(roundedBox(0.32, 0.012, 0.24, 0.004), metalMat('#b8bcc0'), { parent: root, at: [0, 0.006, 0], name: 'tray' }); for (let i = 0; i < 6; i++) cutCookie(root, { kind: 'man', icing: null, piping: true, dough: '#a8662a', at: [(i % 3 - 1) * 0.1, 0.012, (Math.floor(i / 3) - 0.5) * 0.11], rotY: (i % 2) * 0.2, name: `g${i}` }); break; }
      cutCookie(root, { kind: 'man', icing: null, piping: true, dough: '#a8662a', name: 'man' });
      break;
    case 'biscotti': {
      const n = 4;
      for (let i = 0; i < n; i++) {
        const g = group(`b${i}`, { parent: root, at: [(i - 1.5) * 0.028, 0, 0], rot: [0, 0, 0] });
        const geo = cushion(0.018, 0.035, 0.11, { radius: 0.006, bulge: 0.15 });
        vcolor(geo, (x, y, z, c) => { c.set(Math.abs(x) > 0.007 ? '#e8c88a' : '#b8702e').lerp(C('#e8c88a'), Math.abs(y) < 0.014 ? 0.6 : 0).multiplyScalar(0.9 + fbm(x * 90, y * 90, z * 90) * 0.2); if (fbm(x * 70 + 3, y * 70, z * 70) > 0.68) c.set('#f6ecd0'); if (trim === 'chocolate-dipped' && z > 0.02) c.set('#3a1e10'); if (trim === 'pistachio' && fbm(x * 90, y * 90 + 2, z * 90) > 0.65) c.set('#8ab85a'); });
        mesh(geo, crust('#fff', { vc: true }), { parent: g, at: [0, 0.0175, 0], name: `b${i}_body` });
      }
      break;
    }
    case 'thumbprint': {
      const jam = { strawberry: '#c8142e', apricot: '#f2902a', blueberry: '#3a2a6a', chocolate: '#3a1e10' }[trim] ?? '#c8142e';
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; const c = cookie(root, { flavour: 'sugar', rand, at: [Math.cos(a) * 0.05 * (i ? 1 : 0), 0, Math.sin(a) * 0.05 * (i ? 1 : 0)], name: `t${i}`, r: 0.024 }); mesh(new THREE.SphereGeometry(0.009, 14, 8, 0, TAU, 0, PI / 2).scale(1, 0.45, 1), glaze(jam), { parent: c, at: [0, 0.0095, 0], name: `t${i}_jam` }); }
      break;
    }
    default: break;
  }
});
import { cup, fillGeo, moveTrack } from './common.js';
function moveTrackLocal(lid) { return moveTrack(lid, 1, (t) => [0, Math.min(1, t * 1.3) * 0.05, 0]); }
void leafGeo; void leafy; void flesh; void rotateTrack;
