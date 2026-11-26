/*
 * Meals: pizza (whole/slice/box, topping trims), burgers, hot dogs, sandwiches, tacos,
 * burritos, sushi, ramen, pasta, salads, steak, fried chicken, fries, breakfast,
 * pancakes and soup. Bowls/cups are hollow; hot food steams ('steam').
 */
import {
  THREE, PI, TAU, mesh, group, curveTube, roundedBox, lathe, sweep, scatter, cached, jitter, cushion, trayBox,
  crust, gloss, glaze, cream, flesh, phys, paperMat, plate, board, bowl, cup, ceramic, metalMat, woodMat, leafy, meat, waxy, foil, plasticMat,
  vcolor, fbm, toColor, make, vessel, fillGeo, extrudeOutline, leafGeo, seedGeo, steam, clip, rotateTrack, labelTex, napkin, disc,
} from './common.js';
import { cutTexture } from './cut.js';

const C = (h) => toColor(h);
function rnd(seed) { let a = 0; for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const inSector = (a, t0, len) => { if (len >= TAU - 1e-4) return true; const d = (((a - t0) % TAU) + TAU) % TAU; return d > 0.05 && d < len - 0.05; };
/** Points scattered in a disc (optionally a sector, angle measured like CylinderGeometry: x=sin, z=cos). */
function discPts(n, R, rand, { t0 = 0, len = TAU, rMin = 0 } = {}) {
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 20) { const a = rand() * TAU, d = Math.sqrt(rMin * rMin + rand() * (R * R - rMin * rMin)); if (inSector(a, t0, len)) out.push({ a, d, x: Math.sin(a) * d, z: Math.cos(a) * d }); }
  return out;
}
const ketchup = () => glaze('#b8141a');
const mustard = () => glaze('#e8b818');

/* ================================================================= PIZZA */
const TOPS = {
  cheese: [], margherita: ['mozz', 'basil'], pepperoni: ['pepperoni'], veggie: ['pepper', 'olive', 'mushroom', 'onion'], hawaiian: ['ham', 'pineapple'],
  mushroom: ['mushroom', 'mushroom'], 'bbq-chicken': ['chicken', 'onion', 'bbq'], 'four-cheese': ['mozz', 'blue', 'parm'], 'meat-lovers': ['pepperoni', 'sausage', 'ham', 'bacon'],
  supreme: ['pepperoni', 'sausage', 'pepper', 'olive', 'onion'], diavola: ['pepperoni', 'jalapeno', 'chili'],
};
const TGEO = {
  pepperoni: () => cached('pep', () => { const g = new THREE.CylinderGeometry(0.014, 0.014, 0.003, 18); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getZ(i)); p.setY(i, p.getY(i) + (r / 0.014) ** 2 * 0.002); } g.computeVertexNormals(); return g; }),
  mozz: () => cached('mozz', () => new THREE.SphereGeometry(0.014, 14, 8, 0, TAU, 0, PI / 2).scale(1, 0.3, 1)),
  blue: () => cached('bluech', () => jitter(new THREE.IcosahedronGeometry(0.006, 0), rnd('b'), 0.2)),
  parm: () => cached('parm', () => new THREE.BoxGeometry(0.008, 0.0015, 0.004)),
  basil: () => leafGeo(0.03, 0.018, { cup: 0.3, curl: 0.1 }),
  pepper: () => cached('pstrip', () => new THREE.TorusGeometry(0.012, 0.0022, 4, 12, PI).rotateX(PI / 2).scale(1, 1, 0.5)),
  olive: () => cached('olivering', () => new THREE.TorusGeometry(0.0045, 0.0022, 6, 14).rotateX(PI / 2)),
  mushroom: () => cached('mslice', () => { const s = new THREE.Shape(); s.moveTo(-0.003, -0.008); s.lineTo(0.003, -0.008); s.lineTo(0.003, 0); s.absarc(0, 0, 0.011, 0, PI, false); s.lineTo(-0.003, 0); s.lineTo(-0.003, -0.008); const g = extrudeOutline(s, 0.002, { bevel: 0.0005, segments: 1 }); g.rotateX(-PI / 2); return g; }),
  onion: () => cached('oring', () => new THREE.TorusGeometry(0.012, 0.0014, 4, 18, PI * 1.2).rotateX(PI / 2)),
  ham: () => cached('hamsq', () => roundedBox(0.014, 0.0025, 0.014, 0.001, 1)),
  pineapple: () => cached('pinech', () => roundedBox(0.012, 0.007, 0.009, 0.002, 1)),
  chicken: () => cached('chick', () => jitter(roundedBox(0.012, 0.007, 0.01, 0.003, 1), rnd('c'), 0.12)),
  sausage: () => cached('saus', () => jitter(new THREE.IcosahedronGeometry(0.0055, 0), rnd('s'), 0.2)),
  bacon: () => cached('baconb', () => roundedBox(0.016, 0.002, 0.006, 0.0008, 1)),
  jalapeno: () => cached('jring', () => new THREE.TorusGeometry(0.007, 0.0025, 6, 14).rotateX(PI / 2)),
  chili: () => cached('chflake', () => new THREE.BoxGeometry(0.003, 0.001, 0.002)),
};
const TMAT = {
  pepperoni: () => meat('#a8261a', { rough: 0.35, cc: 0.7 }), mozz: () => cream('#fbf6e6', { rough: 0.35, cc: 0.4 }), blue: () => cream('#e8ecef'), parm: () => cream('#f6e8b0'), basil: () => leafy('#2f7a22', { cc: 0.6 }),
  pepper: () => waxy('#2f8a2a', { cc: 0.8 }), olive: () => glaze('#1e1a18'), mushroom: () => phys('#d8c8b0', { rough: 0.7 }), onion: () => flesh('#e8c8e0'), ham: () => meat('#f08a8a'),
  pineapple: () => flesh('#f6d84a'), chicken: () => meat('#d8a870'), sausage: () => meat('#8a4a2a'), bacon: () => meat('#a8402a'), jalapeno: () => waxy('#3a8a2a'), chili: () => glaze('#c8201a'),
};
function pizza(parent, ctx, { trim, R = 0.15, t0 = 0, len = TAU, at = [0, 0, 0], name = 'pizza', square = false }) {
  const rand = rnd(`${name}${trim}`);
  const g = group(name, { parent, at });
  const tops = TOPS[trim] ?? TOPS.cheese;
  const full = len >= TAU - 1e-4;
  const n = Math.max(8, Math.round((72 * len) / TAU));
  if (square) {
    const W = 0.36, D = 0.26;
    mesh(roundedBox(W, 0.022, D, 0.008), crust('#d8a050'), { parent: g, at: [0, 0.011, 0], name: `${name}_base` });
    mesh(cushion(W - 0.03, 0.006, D - 0.03, { radius: 0.0025, bulge: 0.2 }), cheeseMat(), { parent: g, at: [0, 0.024, 0], name: `${name}_cheese` });
    const pts = []; for (let i = 0; i < 60; i++) pts.push({ x: (rand() - 0.5) * (W - 0.06), z: (rand() - 0.5) * (D - 0.06), a: rand() * TAU, d: 0 });
    toppings(g, tops, pts, 0.027, rand, name);
    return g;
  }
  // base disc + puffy rim
  const base = new THREE.CylinderGeometry(R - 0.012, R - 0.012, 0.006, n, 1, false, t0, len);
  mesh(base, crust('#e0b070'), { parent: g, at: [0, 0.003, 0], name: `${name}_base` });
  const rim = new THREE.TorusGeometry(R - 0.012, 0.012, 10, n, len);
  // torus arc runs from angle 0 in XY plane; map to the cylinder's angular convention
  rim.rotateX(PI / 2); rim.rotateY(t0 + len - PI / 2);
  vcolor(rim, (x, y, z, c) => c.set('#c8823a').lerp(C('#7a3a12'), Math.max(0, fbm(x * 60, y * 60, z * 60) - 0.45) * 2).lerp(C('#e8c080'), y < -0.004 ? 0.5 : 0));
  const rimM = mesh(rim, crust('#fff', { vc: true }), { parent: g, at: [0, 0.011, 0], scale: [1, 0.85, 1], name: `${name}_rim` });
  void rimM;
  if (!full) {
    // cut faces of the rim (crumb)
    for (const th of [t0, t0 + len]) mesh(new THREE.CircleGeometry(0.0115, 14).scale(1, 0.85, 1).rotateY(th + PI / 2).translate(Math.sin(th) * (R - 0.012), 0.011, Math.cos(th) * (R - 0.012)), phys('#f2e2c0', { rough: 0.9, side: THREE.DoubleSide }), { parent: g, name: `${name}_crumb${th === t0 ? 0 : 1}` });
  }
  mesh(new THREE.CylinderGeometry(R - 0.016, R - 0.016, 0.002, n, 1, false, t0, len), glaze('#b8301a', { rough: 0.4 }), { parent: g, at: [0, 0.007, 0], name: `${name}_sauce` });
  const ch = new THREE.CylinderGeometry(R - 0.02, R - 0.022, 0.004, n, 3, false, t0, len);
  mesh(ch, cheeseMat(trim === 'margherita' ? 0.4 : 1), { parent: g, at: [0, 0.009, 0], name: `${name}_cheese` });
  const pts = discPts(70, R - 0.03, rand, { t0, len });
  toppings(g, tops, pts, 0.011, rand, name);
  if (full) for (let k = 0; k < 4; k++) mesh(new THREE.BoxGeometry(0.0012, 0.0008, (R - 0.02) * 2), phys('#8a5a2a', { rough: 1 }), { parent: g, at: [0, 0.0112, 0], rot: [0, (k * PI) / 4, 0], name: `${name}_cut${k}` });
  return g;
}
function cheeseMat(browning = 1) {
  return phys('#f6d36a', { rough: 0.35, cc: 0.6, ccr: 0.3, sheen: 0.4, sheenColor: '#806020', name: 'cheese' }) && (() => { const m = phys('#f2c95a', { rough: 0.35, cc: 0.6, ccr: 0.3, name: 'cheese' }); m.color.lerp(new THREE.Color('#fbe8a8'), 1 - browning); return m; })();
}
function toppings(g, tops, pts, y, rand, name) {
  if (!tops.length) return;
  const groups = {};
  pts.forEach((p, i) => { const t = tops[i % tops.length]; (groups[t] ??= []).push(p); });
  for (const [t, list] of Object.entries(groups)) {
    if (t === 'bbq') { for (let k = 0; k < 4; k++) curveTube([[-0.08, y + 0.004, -0.06 + k * 0.04], [0, y + 0.005, -0.05 + k * 0.04], [0.08, y + 0.004, -0.06 + k * 0.04]], 0.0016, glaze('#5a1e0e'), { parent: g, segments: 16, radialSegments: 5, name: `${name}_bbq${k}` }); continue; }
    const geo = TGEO[t](), mat = TMAT[t]();
    const lift = { mozz: 0.0005, basil: 0.004, pineapple: 0.003, chicken: 0.003, sausage: 0.003, blue: 0.003, pepper: 0.0025, olive: 0.0025, onion: 0.0015, jalapeno: 0.0025 }[t] ?? 0.0018;
    scatter(g, geo, mat, list.slice(0, t === 'chili' ? 40 : 18).map((p) => ({ at: [p.x, y + lift, p.z], rot: [0, rand() * TAU, 0], scale: t === 'mozz' ? 0.8 + rand() * 0.6 : 1 })), `${name}_${t}`);
  }
}
function pizzaBox(parent, ctx, trim) {
  const W = 0.36, H = 0.045;
  trayBox(parent, W, H, W, paperMat('#c8a27a'), 0.003, { name: 'box' });
  const lid = group('lid', { parent, at: [0, H, -W / 2] });
  const lt = trayBox(lid, W, 0.006, W, paperMat('#d8b48a'), 0.003, { name: 'lid_shell' });
  lt.rotation.x = PI; lt.position.set(0, 0.006, W / 2);
  const tex = labelTex({ bg: '#d8b48a', fg: '#b8201a', accent: '#b8201a', brand: 'Forno Nove', name: 'hot & fresh', motif: 'frame', w: 512, h: 512, serif: true });
  mesh(new THREE.PlaneGeometry(W * 0.8, W * 0.8).rotateX(PI / 2), phys('#d8b48a', { rough: 0.9, map: tex, side: THREE.DoubleSide }), { parent: lid, at: [0, -0.0005, W / 2], name: 'lid_print' });
  lid.rotation.x = -1.95;
  pizza(parent, ctx, { trim, R: 0.16, at: [0, 0.003, 0] });
  ctx.animations.push(clip('lidClose', 1.2, [rotateTrack(lid, 'x', 1.2, (t) => Math.min(1, t * 1.25) * 1.95)]));
  ctx.oneShot.push('lidClose');
}

/* ================================================================= BURGER */
function bun(parent, { r = 0.05, h = 0.035, top = true, y = 0, name = 'bun', seeds = true, color = '#b8641e', rand }) {
  const ctrl = top ? [[0, 0], [r * 0.98, 0], [r, h * 0.2], [r * 0.9, h * 0.65], [r * 0.55, h * 0.95], [0, h]] : [[0, 0], [r * 0.9, 0], [r, h * 0.35], [r * 0.98, h], [0, h]];
  const geo = lathe(ctrl, 40);
  vcolor(geo, (x, yy, z, c) => { const t = yy / h; c.set(top ? (t < 0.12 ? '#f2dcb0' : color) : t > 0.85 ? '#f2dcb0' : '#d8a060').multiplyScalar(0.9 + fbm(x * 60, yy * 60, z * 60) * 0.2); });
  mesh(geo, gloss('#fff', { vc: true, rough: 0.35, cc: 0.6 }), { parent, at: [0, y, 0], name });
  if (top && seeds && rand) { const items = []; for (let i = 0; i < 50; i++) { const a = rand() * TAU, k = Math.sqrt(rand()) * 0.85; const rr = r * k; const yy = h * (1 - k ** 2 * 0.75); items.push({ at: [Math.cos(a) * rr, y + yy + 0.0006, Math.sin(a) * rr], rot: [rand() * 0.6, a, 0] }); } scatter(parent, seedGeo(), phys('#f6ecd0', { rough: 0.6 }), items, `${name}_seeds`); }
  return y + (top ? h : h);
}
function patty(parent, y, { r = 0.052, h = 0.016, name = 'patty', color = '#5a3220', chicken = false, veggie = false }) {
  const geo = cushion(r * 2, h, r * 2, { radius: h * 0.48, bulge: 0.15 });
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const d = Math.hypot(x, z); const k = Math.min(1, r / Math.max(Math.abs(x), Math.abs(z), 1e-4)) * (d > 1e-4 ? Math.max(Math.abs(x), Math.abs(z)) / d : 1); p.setX(i, x * k); p.setZ(i, z * k); }
  jitter(geo, rnd(name), 0.02);
  vcolor(geo, (x, yy, z, c) => { if (chicken) c.set('#c8862e').lerp(C('#f0c070'), fbm(x * 120, yy * 120, z * 120)); else if (veggie) c.set('#7a6a3a').lerp(C('#a8502a'), fbm(x * 90, yy * 90, z * 90)).lerp(C('#4a8a2a'), fbm(x * 200, 1, z * 200) > 0.66 ? 0.6 : 0); else { c.set(color).lerp(C('#2a160c'), Math.max(0, fbm(x * 90, yy * 90, z * 90) - 0.45) * 2); if (Math.abs(yy) > h * 0.4 && Math.sin(x * 260) > 0.85) c.set('#1e100a'); } });
  mesh(geo, meat('#fff', { vc: true, rough: chicken ? 0.75 : 0.5 }), { parent, at: [0, y + h / 2, 0], name });
  return y + h;
}
function cheeseSlice(parent, y, { w = 0.088, name = 'cheese', color = '#f2b82a' }) {
  const geo = new THREE.BoxGeometry(w, 0.003, w, 8, 1, 8);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const d = Math.max(Math.abs(x), Math.abs(z)) / (w / 2); p.setY(i, p.getY(i) - Math.max(0, d - 0.55) ** 2 * 0.02); }
  geo.computeVertexNormals();
  mesh(geo, phys(color, { rough: 0.3, cc: 0.6 }), { parent, at: [0, y + 0.0015, 0], rot: [0, PI / 4, 0], name });
  return y + 0.003;
}
function lettuce(parent, y, { r = 0.058, name = 'lettuce' }) {
  const geo = new THREE.CircleGeometry(r, 48, 0, TAU); geo.rotateX(-PI / 2);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const a = Math.atan2(z, x), d = Math.hypot(x, z) / r; const k = 1 + 0.12 * Math.sin(a * 11) * d; p.setX(i, x * k); p.setZ(i, z * k); p.setY(i, Math.sin(a * 9) * 0.004 * d - d * d * 0.004); }
  geo.computeVertexNormals();
  mesh(geo, leafy('#7ab83a', { cc: 0.5 }), { parent, at: [0, y + 0.004, 0], name });
  return y + 0.004;
}
function tomatoSlices(parent, y, { name = 'tomato', n = 2 }) {
  const outline = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; outline.push([Math.cos(a) * 0.03, Math.sin(a) * 0.03]); }
  const tex = cutTexture('tomato', { flesh: '#e8322a', flesh2: '#f86a4a', seed: '#f7a07a', skin: '#c81e14', rind: '#d82a20', rindW: 0.08 }, outline, 40, [0, 0], 0.03, 'burger-tomato');
  const top = flesh('#e8322a', { map: tex });
  for (let i = 0; i < n; i++) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 32), [waxy('#c81e14'), top, top], { parent, at: [(i - (n - 1) / 2) * 0.034, y + 0.003, (i % 2) * 0.01], name: `${name}${i}` });
  return y + 0.006;
}
function onionRings(parent, y, { name = 'onion', fried = false, n = 3 }) {
  for (let i = 0; i < n; i++) mesh(new THREE.TorusGeometry(0.018 + i * 0.008, fried ? 0.006 : 0.0018, 8, 32).rotateX(PI / 2), fried ? crust('#c8862e') : flesh('#ecd8f0', { opacity: 0.9, transparent: true }), { parent, at: [Math.sin(i) * 0.008, y + (fried ? 0.006 : 0.0018), Math.cos(i) * 0.008], name: `${name}${i}` });
  return y + (fried ? 0.012 : 0.0036);
}
function baconStrips(parent, y, { name = 'bacon', n = 2, L = 0.1 }) {
  for (let i = 0; i < n; i++) {
    const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([-L / 2 + t * L, Math.sin(t * PI * 3 + i) * 0.003, (i - (n - 1) / 2) * 0.022]); }
    const geo = sweep(pts, { r: () => 0.008, ell: [0.25, 1], seg: 30, sides: 8 });
    vcolor(geo, (x, yy, z, c) => c.set(Math.sin(z * 900 + x * 20) > 0.2 ? '#8a2a1a' : '#e8b890'));
    mesh(geo, meat('#fff', { vc: true }), { parent, at: [0, y + 0.004, 0], rot: [PI / 2, 0, 0], name: `${name}${i}` }).rotation.set(0, 0, 0);
  }
  return y + 0.005;
}
function pickles(parent, y, { name = 'pickle', n = 3 }) {
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU; mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.003, 16), waxy('#6a8a2a', { rough: 0.4 }), { parent, at: [Math.cos(a) * 0.022, y + 0.0015, Math.sin(a) * 0.022], name: `${name}${i}` }); }
  return y + 0.003;
}
function sauce(parent, y, color, name = 'sauce', r = 0.05) {
  const geo = new THREE.CylinderGeometry(r, r, 0.003, 32);
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 + 0.12 * Math.sin(a * 7); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  mesh(geo, glaze(color), { parent, at: [0, y + 0.0015, 0], name });
  return y + 0.003;
}
function burger(parent, ctx, { variant = 'classic', trim, at = [0, 0, 0], s = 1, name = 'burger' }) {
  const g = group(name, { parent, at });
  const inner = group(`${name}_s`, { parent: g }); inner.scale.setScalar(s);
  const rand = ctx.rand;
  let y = bun(inner, { top: false, h: 0.022, name: `${name}_heel`, color: variant === 'veggie' ? '#8a5a2a' : '#b8641e' });
  const chicken = variant === 'chicken', veggie = variant === 'veggie';
  const deluxe = trim === 'deluxe' || chicken || veggie;
  if (deluxe || trim === 'bbq') y = lettuce(inner, y, { name: `${name}_lettuce` });
  if (deluxe) y = tomatoSlices(inner, y, { name: `${name}_tomato` });
  const pattiesN = variant === 'double' ? 2 : variant === 'tower' ? 3 : 1;
  for (let i = 0; i < pattiesN; i++) {
    y = patty(inner, y, { name: `${name}_patty${i}`, chicken, veggie });
    if (trim === 'cheese' || trim === 'deluxe' || trim === 'bacon' || variant === 'double' || variant === 'tower') y = cheeseSlice(inner, y, { name: `${name}_cheese${i}` });
    if (trim === 'mushroom-swiss') { y = cheeseSlice(inner, y, { name: `${name}_swiss${i}`, color: '#f6ecc8' }); scatter(inner, TGEO.mushroom(), phys('#8a6a4a', { rough: 0.6 }), Array.from({ length: 6 }, (_, k) => ({ at: [Math.cos(k) * 0.025, y + 0.002, Math.sin(k) * 0.025], rot: [0, k, 0] })), `${name}_mush${i}`); y += 0.004; }
  }
  if (trim === 'bacon' || variant === 'tower') y = baconStrips(inner, y, { name: `${name}_bacon` });
  if (trim === 'bbq') { y = sauce(inner, y, '#5a1e0e', `${name}_bbq`); y = onionRings(inner, y, { name: `${name}_rings`, fried: true, n: 2 }); }
  else if (!chicken) y = onionRings(inner, y, { name: `${name}_onion` });
  if (!chicken && !veggie) y = pickles(inner, y, { name: `${name}_pickle` });
  y = sauce(inner, y, chicken ? '#f6eed6' : '#b8141a', `${name}_sauce`, 0.042);
  const topY = bun(inner, { top: true, y: y - 0.001, h: 0.034, name: `${name}_crown`, rand, color: variant === 'veggie' ? '#8a5a2a' : '#b8641e' });
  if (variant === 'tower') { tube([0, topY - 0.01, 0], [0, topY + 0.05, 0], 0.0012, woodMat('#e8d0a0'), { parent: inner, name: `${name}_pick` }); mesh(new THREE.PlaneGeometry(0.03, 0.018).translate(0.015, 0, 0), phys('#d81e2a', { side: THREE.DoubleSide, rough: 0.8 }), { parent: inner, at: [0, topY + 0.04, 0], name: `${name}_flag` }); }
  return { g, top: topY * s };
}
import { tube } from './common.js';
function fries(parent, { at = [0, 0, 0], kind = 'carton', trim, name = 'fries', rand }) {
  const g = group(name, { parent, at });
  const fryGeo = cached('fry', () => roundedBox(0.008, 0.08, 0.008, 0.002, 1));
  const fryMat = () => { const m = crust('#f0c050', { rough: 0.55, sheen: 0.3 }); return m; };
  let bottom = 0, rTop = 0.045, depth = 0.1;
  if (kind === 'carton') {
    const v = vessel([[0, 0], [0.032, 0], [0.034, 0.004], [0.05, 0.11]], 0.0015, { seg: 4 });
    v.geo.rotateY(PI / 4); v.geo.scale(1, 1, 0.6);
    const tex = labelTex({ bg: '#d81e2a', fg: '#ffd23f', accent: '#ffd23f', brand: 'CRISPO', name: 'golden fries', motif: 'wave', w: 256, h: 256 });
    mesh(v.geo, phys('#d81e2a', { rough: 0.6, map: tex, side: THREE.DoubleSide, name: 'carton' }), { parent: g, name: `${name}_carton` });
    bottom = v.floor; depth = 0.11;
  } else if (kind === 'cone') {
    const v = vessel([[0, 0], [0.006, 0.002], [0.05, 0.14]], 0.0012, { seg: 32 });
    mesh(v.geo, paperMat('#f2e8d4', { side: THREE.DoubleSide }), { parent: g, name: `${name}_cone` });
    bottom = 0.06; rTop = 0.04; depth = 0.14;
  } else if (kind === 'basket') {
    trayBox(g, 0.18, 0.05, 0.12, metalMat('#c8202a', { rough: 0.5, metal: 0.3 }), 0.003, { name: `${name}_basket` });
    mesh(roundedBox(0.17, 0.002, 0.11, 0.0008), paperMat('#f6f0e2'), { parent: g, at: [0, 0.004, 0], name: `${name}_paper` });
    bottom = 0.005; depth = 0.05;
  }
  const items = [];
  const curly = trim === 'curly';
  const N = kind === 'basket' ? 40 : 34;
  for (let i = 0; i < N; i++) {
    if (kind === 'basket') { items.push({ at: [(rand() - 0.5) * 0.15, bottom + 0.005 + rand() * 0.02, (rand() - 0.5) * 0.09], rot: [PI / 2 + (rand() - 0.5) * 0.3, rand() * TAU, 0] }); continue; }
    const a = rand() * TAU, d = Math.sqrt(rand()) * (kind === 'cone' ? 0.025 : 0.03);
    items.push({ at: [Math.cos(a) * d, bottom + depth * 0.5 + rand() * 0.04, Math.sin(a) * d * (kind === 'carton' ? 0.55 : 1)], rot: [(rand() - 0.5) * 0.4, rand() * TAU, (rand() - 0.5) * 0.4] });
  }
  if (curly) { for (let i = 0; i < 9; i++) { const pts = []; for (let k = 0; k <= 20; k++) { const t = k / 20; pts.push([Math.cos(t * 14) * 0.008 + (i % 3 - 1) * 0.015, bottom + depth * 0.4 + t * 0.07, Math.sin(t * 14) * 0.008 + (Math.floor(i / 3) - 1) * 0.012]); } curveTube(pts, 0.0035, crust('#d8902a'), { parent: g, segments: 50, radialSegments: 6, name: `${name}_curl${i}` }); } }
  else scatter(g, fryGeo, fryMat(), items, `${name}_sticks`);
  const pt = kind === 'basket' ? bottom + 0.012 : bottom + depth * 0.5 + 0.035;
  if (trim === 'cheese' || trim === 'loaded') { mesh(new THREE.SphereGeometry(0.04, 20, 10, 0, TAU, 0, PI / 2).scale(1, 0.35, kind === 'carton' ? 0.6 : 1), glaze('#f2a81a'), { parent: g, at: [0, pt, 0], name: `${name}_cheese` }); }
  if (trim === 'loaded') { scatter(g, TGEO.bacon(), TMAT.bacon(), Array.from({ length: 8 }, (_, i) => ({ at: [Math.cos(i) * 0.02, pt + 0.013, Math.sin(i) * 0.015], rot: [0, i, 0] })), `${name}_bacon`); scatter(g, cached('scallion', () => new THREE.TorusGeometry(0.002, 0.001, 4, 8).rotateX(PI / 2)), leafy('#4aa83a'), Array.from({ length: 12 }, (_, i) => ({ at: [Math.cos(i * 2) * 0.018, pt + 0.014, Math.sin(i * 2) * 0.012] })), `${name}_scallion`); }
  if (trim === 'ketchup') { const b = cup(parent, { rTop: 0.022, rBot: 0.018, h: 0.022, mat: paperMat('#ffffff'), at: [at[0] + 0.08, 0, at[2] + 0.02], name: `${name}_cup` }); mesh(fillGeo(b.local.inner, b.local.floor, 0.018), ketchup(), { parent, at: [at[0] + 0.08, 0, at[2] + 0.02], name: `${name}_ketchup` }); }
  return g;
}

/* ================================================================= other meals */
function sausage(parent, { L = 0.17, r = 0.011, at = [0, 0, 0], name = 'sausage', color = '#a8502a', grill = true, bend = 0.008 }) {
  const geo = sweep([[-L / 2, 0, 0], [0, 0, bend], [L / 2, 0, 0]], { r: (t) => r * Math.pow(Math.sin(Math.max(0.02, Math.min(0.98, t)) * PI), 0.18), seg: 30, sides: 18 });
  vcolor(geo, (x, y, z, c) => { c.set(color).lerp(C('#5a2010'), fbm(x * 80, y * 80, z * 80) * 0.5); if (grill && y > r * 0.3 && Math.sin((x + z) * 250) > 0.88) c.set('#2a120a'); });
  return mesh(geo, meat('#fff', { vc: true, rough: 0.3, cc: 0.9 }), { parent, at, name });
}
function hotdog(parent, ctx, { variant, trim, at = [0, 0, 0], name = 'hotdog' }) {
  const g = group(name, { parent, at });
  if (variant === 'corn-dog') {
    const geo = sweep([[0, 0.012, 0], [0.13, 0.012, 0]], { r: (t) => 0.018 * Math.pow(Math.sin(Math.max(0.03, Math.min(0.97, t)) * PI), 0.3), seg: 30, sides: 18 });
    vcolor(geo, (x, y, z, c) => c.set('#c8862e').lerp(C('#8a4a1a'), fbm(x * 70, y * 70, z * 70) * 0.7));
    mesh(geo, crust('#fff', { vc: true }), { parent: g, at: [-0.06, 0.006, 0], name: `${name}_batter` });
    mesh(roundedBox(0.09, 0.005, 0.006, 0.002), woodMat('#e8d0a0'), { parent: g, at: [-0.11, 0.0025, 0], name: `${name}_stick` });
    if (trim === 'mustard' || trim === 'ketchup') curveTube(Array.from({ length: 14 }, (_, i) => [-0.05 + i * 0.008, 0.035, Math.sin(i * 1.4) * 0.008]), 0.0022, trim === 'mustard' ? mustard() : ketchup(), { parent: g, segments: 50, radialSegments: 6, name: `${name}_zig` });
    return g;
  }
  const L = variant === 'bratwurst' ? 0.2 : 0.17;
  // bun: two halves of a split roll
  const bunGeo = sweep([[-L / 2 + 0.005, 0, 0], [L / 2 - 0.005, 0, 0]], { r: (t) => 0.024 * Math.pow(Math.sin(Math.max(0.03, Math.min(0.97, t)) * PI), 0.22), ell: [1, 0.85], seg: 24, sides: 24 });
  const bp = bunGeo.attributes.position; for (let i = 0; i < bp.count; i++) { const y = bp.getY(i), z = bp.getZ(i); if (y > 0.004 && Math.abs(z) < 0.012) { bp.setY(i, 0.004 + (y - 0.004) * 0.2); } bp.setZ(i, z + Math.sign(z) * 0.006); }
  bunGeo.computeVertexNormals();
  vcolor(bunGeo, (x, y, z, c) => c.set(Math.abs(z) < 0.016 && y > 0.002 ? '#f6e6c4' : '#c8803a').multiplyScalar(0.9 + fbm(x * 60, y * 60, z * 60) * 0.2));
  mesh(bunGeo, gloss('#fff', { vc: true, rough: 0.45, side: THREE.DoubleSide }), { parent: g, at: [0, 0.02, 0], name: `${name}_bun` });
  sausage(g, { L, r: variant === 'bratwurst' ? 0.013 : 0.0105, at: [0, 0.027, 0], name: `${name}_sausage`, color: variant === 'bratwurst' ? '#b87a4a' : '#b8502a' });
  const top = 0.038;
  const zig = (mat, nm, dy = 0) => curveTube(Array.from({ length: 16 }, (_, i) => [-L / 2 + 0.02 + i * ((L - 0.04) / 15), top + dy, Math.sin(i * 1.6) * 0.007]), 0.002, mat, { parent: g, segments: 60, radialSegments: 6, name: nm });
  if (trim === 'mustard' || trim === 'classic' || !trim) zig(mustard(), `${name}_mustard`);
  if (trim === 'ketchup' || trim === 'classic') zig(ketchup(), `${name}_ketchup`, 0.002);
  if (trim === 'relish') scatter(g, cached('relish', () => roundedBox(0.004, 0.003, 0.004, 0.001, 1)), glaze('#4a8a1e'), Array.from({ length: 30 }, (_, i) => ({ at: [-L / 2 + 0.02 + (i / 30) * (L - 0.04), top, Math.sin(i * 2) * 0.006], rot: [i, i, 0] })), `${name}_relish`);
  if (trim === 'onions') scatter(g, cached('onionbit', () => roundedBox(0.004, 0.003, 0.004, 0.001, 1)), flesh('#f6f0e0'), Array.from({ length: 30 }, (_, i) => ({ at: [-L / 2 + 0.02 + (i / 30) * (L - 0.04), top, Math.sin(i * 2) * 0.006], rot: [i, i, 0] })), `${name}_onions`);
  if (trim === 'chili') mesh(cushion(L - 0.03, 0.01, 0.026, { radius: 0.004, bulge: 0.3 }), meat('#7a2e14', { rough: 0.6 }), { parent: g, at: [0, top, 0], name: `${name}_chili` });
  if (trim === 'cheese' || trim === 'chili') curveTube(Array.from({ length: 16 }, (_, i) => [-L / 2 + 0.02 + i * ((L - 0.04) / 15), top + 0.005, Math.sin(i * 1.3) * 0.009]), 0.0026, glaze('#f2a81a'), { parent: g, segments: 60, radialSegments: 6, name: `${name}_cheese` });
  return g;
}
function sandwich(parent, ctx, { variant, trim, at = [0, 0, 0], name = 'sandwich' }) {
  const g = group(name, { parent, at });
  const fill = { 'ham-cheese': ['#f08a8a', '#f6d04a'], turkey: ['#e8c8a8', '#f6ecc8'], veggie: ['#7ab83a', '#e8322a'], blt: ['#a8402a', '#7ab83a'], tuna: ['#e8dcc0', '#7ab83a'], 'grilled-cheese': ['#f2b82a', '#f2b82a'] }[trim ?? 'ham-cheese'] ?? ['#f08a8a', '#f6d04a'];
  if (variant === 'sub') {
    const L = 0.26;
    const geoB = sweep([[-L / 2, 0, 0], [L / 2, 0, 0]], { r: (t) => 0.028 * Math.pow(Math.sin(Math.max(0.03, Math.min(0.97, t)) * PI), 0.25), ell: [1, 0.55], seg: 24, sides: 24 });
    vcolor(geoB, (x, y, z, c) => c.set(y > 0 ? '#c8803a' : '#e0b070').multiplyScalar(0.9 + fbm(x * 60, y * 60, z * 60) * 0.2));
    mesh(geoB, crust('#fff', { vc: true }), { parent: g, at: [0, 0.016, 0], name: `${name}_bottom` });
    let y = 0.028;
    for (const [i, col] of fill.entries()) { mesh(cushion(L - 0.03, 0.008, 0.06, { radius: 0.003, bulge: 0.2 }), i ? phys(col, { rough: 0.4, cc: 0.4 }) : meat(col), { parent: g, at: [0, y, 0], name: `${name}_fill${i}` }); y += 0.007; }
    y = lettuce(g, y - 0.004, { name: `${name}_lettuce`, r: 0.05 });
    const top = sweep([[-L / 2, 0, 0], [L / 2, 0, 0]], { r: (t) => 0.03 * Math.pow(Math.sin(Math.max(0.03, Math.min(0.97, t)) * PI), 0.25), ell: [1, 0.7], seg: 24, sides: 24 });
    vcolor(top, (x, yy, z, c) => c.set(yy > 0 ? '#b8702e' : '#f2e2c0').multiplyScalar(0.9 + fbm(x * 60, yy * 60, z * 60) * 0.2));
    mesh(top, crust('#fff', { vc: true }), { parent: g, at: [0, y + 0.012, 0], name: `${name}_top` });
    return g;
  }
  // square sandwich halves (club = triangles stacked)
  const slice = (parentG, y, nm, toast) => { const geo = cushion(0.1, 0.012, 0.1, { radius: 0.005, bulge: 0.15 }); vcolor(geo, (x, yy, z, c) => { const edge = Math.max(Math.abs(x), Math.abs(z)) > 0.046; c.set(edge ? '#a8662a' : toast ? '#d8a050' : '#f6ead0').multiplyScalar(0.92 + fbm(x * 90, yy * 90, z * 90) * 0.16); }); mesh(geo, crust('#fff', { vc: true }), { parent: parentG, at: [0, y + 0.006, 0], name: nm }); return y + 0.012; };
  const layer = (parentG, y, col, nm, h = 0.006) => { mesh(cushion(0.104, h, 0.104, { radius: h * 0.45, bulge: 0.25 }), nm.includes('let') ? leafy(col) : meat(col, { rough: 0.45 }), { parent: parentG, at: [0, y + h / 2, 0], name: nm }); return y + h; };
  const toast = variant === 'grilled' || variant === 'club';
  const build = (hg, nm) => {
    let y = slice(hg, 0, `${nm}_b`, toast);
    y = layer(hg, y, fill[0], `${nm}_f0`);
    if (variant === 'club') { y = layer(hg, y, '#7ab83a', `${nm}_let`, 0.004); y = slice(hg, y, `${nm}_m`, toast); y = layer(hg, y, fill[1], `${nm}_f1`); y = layer(hg, y, '#e8322a', `${nm}_tom`, 0.004); }
    else y = layer(hg, y, fill[1], `${nm}_f1`, 0.004);
    y = slice(hg, y, `${nm}_t`, toast);
    return y;
  };
  if (variant === 'grilled') { const hg = group(`${name}_whole`, { parent: g }); const top = build(hg, `${name}_w`); for (let k = -2; k <= 2; k++) mesh(new THREE.BoxGeometry(0.1, 0.0008, 0.004), phys('#5a2e12', { rough: 0.9 }), { parent: hg, at: [0, top + 0.0002, k * 0.018], rot: [0, 0.5, 0], name: `${name}_mark${k}` }); return g; }
  for (const s of [-1, 1]) {
    const hg = group(`${name}_half${s}`, { parent: g, at: [s * 0.04, 0, 0], rot: [0, s > 0 ? 0 : PI, 0] });
    // half = triangle: clip by scaling the square into a wedge visually (rotate 45° and scale)
    const inner = group(`${name}_tri${s}`, { parent: hg, rot: [0, PI / 4, 0] });
    inner.scale.set(0.72, 1, 0.72);
    const top = build(inner, `${name}_${s > 0 ? 'r' : 'l'}`);
    if (variant === 'club') tube([0, top - 0.01, 0], [0, top + 0.03, 0], 0.0012, woodMat('#e8d0a0'), { parent: hg, name: `${name}_pick${s}` });
  }
  return g;
}
function taco(parent, ctx, { soft = false, trim, at = [0, 0, 0], rotY = 0, name = 'taco' }) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const R = 0.075;
  const shell = new THREE.CylinderGeometry(R, R, 0.0025, 40, 1, false, 0, PI);
  shell.rotateX(PI / 2); // half-disc standing in XY plane, then fold
  const p = shell.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const fold = (y / R) ** 2; const ang = (x / R) * (soft ? 1.1 : 1.3); void ang; p.setXYZ(i, x * 0.95, Math.abs(y) * (1 - 0.15 * fold), z + Math.sign(z || 1) * 0 + (y / R) * R * 0.0); }
  shell.computeVertexNormals();
  // build as a U: two leaning half-ellipses joined at the bottom
  const geo = new THREE.SphereGeometry(R, 32, 16, 0, PI, 0, PI).rotateZ(PI / 2).scale(1, 0.75, 0.42);
  const gp = geo.attributes.position; for (let i = 0; i < gp.count; i++) if (gp.getY(i) > 0) gp.setY(i, -gp.getY(i));
  geo.computeVertexNormals();
  vcolor(geo, (x, y, z, c) => c.set(soft ? '#f2e2b8' : '#e8b040').lerp(C(soft ? '#c8a060' : '#c8822a'), fbm(x * 80, y * 80, z * 80) > 0.62 ? 0.7 : 0.1));
  const sm = mesh(geo, crust('#fff', { vc: true, side: THREE.DoubleSide }), { parent: g, at: [0, R * 0.75, 0], name: `${name}_shell` });
  void sm; void shell;
  const fillCol = { beef: '#6a3a22', chicken: '#d8a870', fish: '#f2e6c8', veggie: '#5a7a2a', 'al-pastor': '#c8601e', shrimp: '#f2905a' }[trim ?? 'beef'] ?? '#6a3a22';
  const rand = rnd(name + trim);
  const items = []; for (let i = 0; i < 40; i++) items.push({ at: [(rand() - 0.5) * R * 1.5, R * 0.75 - 0.012 + rand() * 0.012, (rand() - 0.5) * R * 0.45], rot: [rand() * 3, rand() * 3, 0] });
  items.push({ at: [0, 0.012, 0] }); for (let k = 1; k < 6; k++) items.push({ at: [0, 0.012 + k * (R * 0.75 - 0.012) / 5, 0] });
  scatter(g, cached('tfill', () => jitter(new THREE.IcosahedronGeometry(0.008, 0), rnd('t'), 0.2)), meat(fillCol, { rough: 0.6 }), items, `${name}_filling`);
  const lt = []; for (let i = 0; i < 30; i++) lt.push({ at: [(rand() - 0.5) * R * 1.6, R * 0.75 + rand() * 0.008, (rand() - 0.5) * R * 0.5], rot: [rand(), rand() * 3, rand()] });
  scatter(g, cached('shred2', () => new THREE.BoxGeometry(0.018, 0.0015, 0.003)), leafy('#8ac84a'), lt, `${name}_lettuce`);
  const ch = []; for (let i = 0; i < 24; i++) ch.push({ at: [(rand() - 0.5) * R * 1.4, R * 0.75 + 0.006 + rand() * 0.004, (rand() - 0.5) * R * 0.4], rot: [rand(), rand() * 3, rand()] });
  scatter(g, cached('shredch', () => new THREE.BoxGeometry(0.012, 0.0015, 0.002)), phys('#f2b82a', { rough: 0.4 }), ch, `${name}_cheese`);
  scatter(g, cached('tomcube', () => roundedBox(0.006, 0.006, 0.006, 0.0015, 1)), flesh('#e8322a'), Array.from({ length: 8 }, (_, i) => ({ at: [(i - 3.5) * 0.014, R * 0.75 + 0.01, Math.sin(i) * 0.008] })), `${name}_tomato`);
  return g;
}
function burrito(parent, ctx, { variant, trim, at = [0, 0, 0], name = 'burrito' }) {
  const g = group(name, { parent, at });
  const fill = { beef: '#6a3a22', chicken: '#d8a870', bean: '#5a2e1e', breakfast: '#f6d04a', veggie: '#5a8a2a' }[trim ?? 'beef'] ?? '#6a3a22';
  const L = 0.2, R = 0.034;
  if (variant === 'bowl') {
    const b = bowl(g, { r: 0.1, h: 0.06, color: '#2a3a4a' });
    const y = b.floor + 0.03;
    mesh(fillGeo(b.local.inner, b.local.floor, 0.03), phys('#f6f0e0', { rough: 0.8 }), { parent: g, name: 'rice' });
    const sects = [[fill, 'meat'], ['#3a2a1e', 'beans'], ['#f2c63a', 'corn'], ['#7ab83a', 'lettuce'], ['#e8322a', 'salsa']];
    sects.forEach(([col, nm], i) => { const a = (i / sects.length) * TAU; mesh(new THREE.SphereGeometry(0.03, 14, 8, 0, TAU, 0, PI / 2).scale(1, 0.4, 1), phys(col, { rough: 0.5, cc: 0.4 }), { parent: g, at: [Math.sin(a) * 0.045, y, Math.cos(a) * 0.045], name: nm }); });
    mesh(new THREE.SphereGeometry(0.02, 14, 8, 0, TAU, 0, PI / 2).scale(1, 0.5, 1), cream('#f6f6ee'), { parent: g, at: [0, y, 0], name: 'sour_cream' });
    mesh(new THREE.SphereGeometry(0.016, 14, 8, 0, TAU, 0, PI / 2).scale(1, 0.6, 1), phys('#8ab84a', { rough: 0.6 }), { parent: g, at: [0.015, y + 0.008, 0.01], name: 'guac' });
    return g;
  }
  const geo = sweep([[-L / 2, 0, 0], [L / 2, 0, 0]], { r: (t) => R * Math.pow(Math.sin(Math.max(0.02, Math.min(0.98, t)) * PI), 0.15), ell: [1, 0.9], seg: 30, sides: 28 });
  vcolor(geo, (x, y, z, c) => { c.set('#f2e2b8').lerp(C('#c89a5a'), fbm(x * 60, y * 60, z * 60) > 0.64 ? 0.6 : 0.05); if (Math.abs(Math.sin(Math.atan2(y, z) * 1 + x * 30)) < 0.03) c.multiplyScalar(0.85); });
  if (variant === 'cut') {
    for (const s of [-1, 1]) {
      const hg = group(`${name}_h${s}`, { parent: g, at: [s * 0.012, 0, 0] });
      const half = sweep(s < 0 ? [[-L / 2, 0, 0], [0, 0, 0]] : [[0, 0, 0], [L / 2, 0, 0]], { r: (t) => { const tt = s < 0 ? t / 2 : 0.5 + t / 2; return R * Math.pow(Math.sin(Math.max(0.02, Math.min(0.98, tt)) * PI), 0.15); }, ell: [1, 0.9], seg: 16, sides: 28, caps: false });
      vcolor(half, (x, y, z, c) => c.set('#f2e2b8').lerp(C('#c89a5a'), fbm(x * 60, y * 60, z * 60) > 0.64 ? 0.6 : 0.05));
      mesh(half, crust('#fff', { vc: true, side: THREE.DoubleSide }), { parent: hg, at: [0, R * 0.9, 0], name: `${name}_wrap${s}` });
      const outline = []; for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU; outline.push([Math.cos(a) * R * 0.97, Math.sin(a) * R * 0.87]); }
      const tex = cutTexture('crumb', { skin: '#f2e2b8', flesh: fill, flesh2: '#f6f0e0', rind: '#f2e2b8', rindW: 0.06, dots: ['#3a2a1e', '#7ab83a', '#e8322a', '#f2c63a'] }, outline, 32, [0, 0], R, `burrito:${trim}`);
      mesh(new THREE.CircleGeometry(R * 0.97, 32).scale(1, 0.9, 1).rotateY(s < 0 ? PI / 2 : -PI / 2), phys(fill, { rough: 0.6, map: tex, side: THREE.DoubleSide }), { parent: hg, at: [0, R * 0.9, 0], name: `${name}_face${s}` });
      hg.rotation.y = s * 0.25;
    }
    return g;
  }
  mesh(geo, crust('#fff', { vc: true }), { parent: g, at: [0, R * 0.9, 0], name: `${name}_wrap` });
  const fl = vessel([[0, 0], [R * 1.02, 0.0], [R * 1.05, 0.002], [R * 1.05, L * 0.45]], 0.0008, { seg: 32 });
  const fm = mesh(fl.geo, foil(), { parent: g, at: [L / 2 + 0.002, R * 0.9, 0], rot: [0, 0, PI / 2], name: `${name}_foil` });
  fm.scale.set(1, 1, 0.9);
  return g;
}
function sushiPiece(parent, kind, { at = [0, 0, 0], rotY = 0, name = 'sushi' }) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const fishC = { salmon: '#f27a4a', tuna: '#b8202a', shrimp: '#f6a080', egg: '#f6d84a', eel: '#5a2e1a', avocado: '#9ac45a', cucumber: '#5a9a3a' }[kind] ?? '#f27a4a';
  const rice = phys('#fbfaf4', { rough: 0.9, sheen: 0.4, sheenColor: '#ffffff', name: 'rice' });
  const riceGeo = cached('nigiri-rice', () => jitter(cushion(0.045, 0.02, 0.022, { radius: 0.009, bulge: 0.3 }), rnd('r'), 0.04));
  mesh(riceGeo, rice, { parent: g, at: [0, 0.01, 0], name: `${name}_rice` });
  const topGeo = cushion(0.052, 0.008, 0.026, { radius: 0.0035, bulge: 0.3 });
  if (kind === 'salmon' || kind === 'tuna') vcolor(topGeo, (x, y, z, c) => c.set(fishC).lerp(C('#fbe8d8'), Math.abs(Math.sin((x + z * 0.6) * 260)) > 0.9 ? 0.7 : 0));
  else vcolor(topGeo, (x, y, z, c) => c.set(fishC));
  mesh(topGeo, flesh('#fff', { vc: true, rough: 0.25, cc: 0.9 }), { parent: g, at: [0, 0.023, 0], rot: [0, 0, 0.04], name: `${name}_topping` });
  if (kind === 'egg' || kind === 'eel') mesh(roundedBox(0.008, 0.03, 0.024, 0.001), phys('#1e2a1a', { rough: 0.7 }), { parent: g, at: [0, 0.015, 0], name: `${name}_nori` });
  return g;
}
function makiRoll(parent, kind, { at = [0, 0, 0], name = 'maki', rotY = 0 }) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const inner = { salmon: '#f27a4a', tuna: '#b8202a', shrimp: '#f6a080', egg: '#f6d84a', eel: '#5a2e1a', avocado: '#9ac45a', cucumber: '#5a9a3a' }[kind] ?? '#f27a4a';
  mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.024, 28, 1, true), phys('#1a2418', { rough: 0.6, side: THREE.DoubleSide }), { parent: g, at: [0, 0.012, 0], name: `${name}_nori` });
  const outline = []; for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; outline.push([Math.cos(a) * 0.016, Math.sin(a) * 0.016]); }
  const tex = cutTexture('crumb', { skin: '#1a2418', flesh: '#fbfaf4', flesh2: '#efece0', rind: '#1a2418', rindW: 0.06, dots: [inner, inner] }, outline, 28, [0, 0], 0.016, `maki:${kind}`);
  mesh(new THREE.CircleGeometry(0.0158, 28).rotateX(-PI / 2), phys('#fbfaf4', { rough: 0.85, map: tex }), { parent: g, at: [0, 0.0241, 0], name: `${name}_top` });
  mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 12), flesh(inner, { cc: 0.8 }), { parent: g, at: [0, 0.024, 0], name: `${name}_centre` });
  return g;
}
function sushi(parent, ctx, { variant, trim, name = 'sushi' }) {
  const g = group(name, { parent });
  const kind = trim ?? 'salmon';
  const kinds = ['salmon', 'tuna', 'shrimp', 'egg', 'eel', 'avocado'];
  const slate = (w, d) => { mesh(roundedBox(w, 0.012, d, 0.004), phys('#2a2a2c', { rough: 0.6 }), { parent: g, at: [0, 0.006, 0], name: 'slate' }); return 0.012; };
  const extras = (y, x0) => { mesh(new THREE.SphereGeometry(0.01, 12, 8).scale(1, 0.7, 1), phys('#8ab84a', { rough: 0.6 }), { parent: g, at: [x0, y + 0.006, 0.03], name: 'wasabi' }); for (let i = 0; i < 4; i++) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.001, 16).scale(1, 1, 0.7), flesh('#f6b8a8', { opacity: 0.9, transparent: true }), { parent: g, at: [x0 + 0.02, y + 0.001 + i * 0.002, 0.03 + i * 0.004], rot: [0.3, i, 0], name: `ginger${i}` }); };
  if (variant === 'nigiri') { const y = slate(0.2, 0.09); for (let i = 0; i < 3; i++) sushiPiece(g, kind, { at: [(i - 1) * 0.055, y, -0.01], name: `n${i}` }); extras(y, 0.06); return g; }
  if (variant === 'maki') { const y = slate(0.2, 0.09); for (let i = 0; i < 6; i++) makiRoll(g, kind, { at: [(i % 3 - 1) * 0.036, y, (Math.floor(i / 3) - 0.5) * 0.034 - 0.005], name: `m${i}` }); extras(y, 0.075); return g; }
  if (variant === 'platter' || variant === 'set') {
    const y = variant === 'platter' ? (mesh(roundedBox(0.36, 0.02, 0.22, 0.006), woodMat('#c89a62'), { parent: g, at: [0, 0.01, 0], name: 'geta' }), 0.02) : slate(0.28, 0.14);
    const ks = [kind, ...kinds.filter((k) => k !== kind)];
    for (let i = 0; i < (variant === 'platter' ? 6 : 3); i++) sushiPiece(g, ks[i], { at: [-0.13 + i * 0.05, y, -0.05], name: `n${i}` });
    for (let i = 0; i < (variant === 'platter' ? 8 : 4); i++) makiRoll(g, ks[(i + 1) % ks.length], { at: [-0.12 + i * 0.036, y, 0.04], name: `m${i}` });
    extras(y, 0.13);
    // chopsticks
    for (const dz of [-0.004, 0.004]) mesh(new THREE.CylinderGeometry(0.0018, 0.003, 0.22, 8).rotateZ(PI / 2), woodMat('#d8b88a'), { parent: g, at: [0, y + 0.003, 0.095 + dz], rot: [0, 0.05, 0], name: `chop${dz > 0 ? 1 : 0}` });
    return g;
  }
  if (variant === 'bento') {
    trayBox(g, 0.24, 0.045, 0.16, plasticMat('#1a1a1c', { rough: 0.3, cc: 0.8 }), 0.003, { name: 'bento' });
    mesh(roundedBox(0.004, 0.04, 0.155, 0.001), plasticMat('#b8201a'), { parent: g, at: [0.03, 0.022, 0], name: 'divider' });
    for (let i = 0; i < 2; i++) sushiPiece(g, kind, { at: [-0.06, 0.003, (i - 0.5) * 0.06], name: `n${i}` });
    for (let i = 0; i < 4; i++) makiRoll(g, 'cucumber', { at: [0.06 + (i % 2) * 0.036, 0.003, (Math.floor(i / 2) - 0.5) * 0.04], name: `m${i}` });
    return g;
  }
  return g;
}
function noodleBowl(parent, ctx, { variant, trim, name = 'ramen' }) {
  const g = group(name, { parent });
  const broth = { tonkotsu: '#ecd8b0', shoyu: '#a8642a', miso: '#c88a40', spicy: '#c8401a', veggie: '#d8b060' }[trim ?? 'shoyu'] ?? '#a8642a';
  if (variant === 'cup') {
    const c = cup(g, { rTop: 0.048, rBot: 0.034, h: 0.11, mat: phys('#f6f2ea', { rough: 0.7, map: labelTex({ bg: '#f6f2ea', fg: '#b8201a', accent: '#b8201a', brand: 'OODO', name: `${trim ?? 'shoyu'} noodle`, motif: 'band', wrap: true }), name: 'cup' }), name: 'cup' });
    mesh(fillGeo(c.local.inner, c.local.floor, 0.08), liquidMat(broth), { parent: g, name: 'broth' });
    noodleTop(g, 0.08, 0.042, rnd('cup'));
    const lid = group('lid', { parent: g, at: [0.045, 0.111, 0] });
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.001, 32), foil('#e8e8ee'), { parent: lid, at: [-0.045, 0, 0], name: 'lid_foil' });
    lid.rotation.z = 1.9;
    ctx.animations.push(clip('lidClose', 1, [rotateTrack(lid, 'z', 1, (t) => -Math.min(1, t * 1.25) * 1.9)]));
    ctx.oneShot.push('lidClose');
    ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, 0.08, 0], r: 0.03 })));
    return g;
  }
  const b = bowl(g, { r: 0.1, h: 0.08, color: variant === 'udon' ? '#2a2a2e' : '#b8201a', mat: ceramic(variant === 'udon' ? '#2a2a2e' : '#f6f2ea') });
  const level = 0.062;
  mesh(fillGeo(b.local.inner, b.local.floor, level), liquidMat(broth), { parent: g, name: 'broth' });
  const rand = rnd(name + trim);
  noodleTop(g, level, b.inner(level) * 0.7, rand, variant === 'udon' ? 0.004 : 0.0018);
  const R = b.inner(level);
  // toppings
  for (let i = 0; i < 2; i++) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 24), meat('#e8c0a0'), { parent: g, at: [-0.035 + i * 0.012, level + 0.003, -0.025 + i * 0.01], rot: [0.3, 0, 0.2], name: `chashu${i}` });
  const egg = group('egg', { parent: g, at: [0.035, level, 0.02] });
  mesh(new THREE.SphereGeometry(0.02, 18, 10, 0, TAU, 0, PI / 2).scale(1, 0.7, 1.3), cream('#fbf8f0'), { parent: egg, name: 'egg_white' });
  mesh(new THREE.CircleGeometry(0.011, 18).rotateX(-PI / 2).scale(1, 1, 1.2), glaze('#f2901a'), { parent: egg, at: [0, 0.0005, 0], name: 'egg_yolk' });
  for (let i = 0; i < 2; i++) mesh(roundedBox(0.04, 0.05, 0.001, 0.0005), phys('#1a2418', { rough: 0.6 }), { parent: g, at: [-R * 0.65, level + 0.02, 0.02 + i * 0.012], rot: [0, 0.3, -0.25], name: `nori${i}` });
  scatter(g, cached('scallion2', () => new THREE.TorusGeometry(0.0025, 0.0011, 4, 10).rotateX(PI / 2)), leafy('#5ab83a'), Array.from({ length: 24 }, () => ({ at: [(rand() - 0.5) * 0.05, level + 0.002, 0.04 + (rand() - 0.5) * 0.02] })), 'scallions');
  if (trim === 'spicy') scatter(g, cached('chflake2', () => new THREE.BoxGeometry(0.003, 0.001, 0.002)), glaze('#e8201a'), Array.from({ length: 40 }, () => ({ at: [(rand() - 0.5) * R * 1.4, level + 0.0008, (rand() - 0.5) * R * 1.4], rot: [0, rand() * 3, 0] })), 'chili');
  if (trim === 'miso') scatter(g, cached('corn2', () => roundedBox(0.005, 0.004, 0.005, 0.0015, 1)), glaze('#f2c63a'), Array.from({ length: 24 }, () => ({ at: [-0.02 + (rand() - 0.5) * 0.03, level + 0.002, 0.045 + (rand() - 0.5) * 0.015] })), 'corn');
  if (trim === 'veggie') { g.getObjectByName('chashu0').material = phys('#f6f2e2', { rough: 0.6 }); scatter(g, TGEO.mushroom(), phys('#8a6a4a'), Array.from({ length: 6 }, (_, i) => ({ at: [-0.04 + i * 0.008, level + 0.002, -0.03], rot: [0, i, 0] })), 'mushrooms'); }
  // chopsticks resting on rim
  for (const dz of [-0.005, 0.005]) mesh(new THREE.CylinderGeometry(0.0022, 0.0032, 0.23, 8).rotateZ(PI / 2), woodMat('#8a5a32'), { parent: g, at: [0.02, 0.083, -0.04 + dz], rot: [0, 0.4, 0], name: `chop${dz > 0 ? 1 : 0}` });
  ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, level, 0], r: 0.05, n: 4 })));
  return g;
}
const liquidMat = (c) => phys(c, { rough: 0.08, cc: 1, ccr: 0.04, name: 'broth' });
function noodleTop(g, y, r, rand, rr = 0.0018) {
  for (let i = 0; i < 10; i++) { const pts = []; const a0 = rand() * TAU; for (let k = 0; k <= 16; k++) { const t = k / 16; const a = a0 + t * 3; pts.push([Math.cos(a) * r * (0.3 + 0.6 * t) * (rand() * 0.2 + 0.9), y + 0.0015 + Math.sin(t * 9 + i) * 0.0012, Math.sin(a) * r * (0.3 + 0.6 * t)]); } curveTube(pts, rr, phys('#f2d88a', { rough: 0.4, cc: 0.5 }), { parent: g, segments: 40, radialSegments: 5, name: `noodle${i}` }); }
}
function pastaPlate(parent, ctx, { variant, trim, name = 'pasta' }) {
  const g = group(name, { parent });
  const rand = rnd(name + variant + trim);
  const sauceC = { tomato: '#c8301a', pesto: '#4a8a2a', alfredo: '#f6ecd0', bolognese: '#8a2e14', meatballs: '#b8281a', carbonara: '#f2e2a0' }[trim ?? 'tomato'] ?? '#c8301a';
  if (variant === 'lasagna') {
    const t = plate(g, { r: 0.13 }).top;
    let y = t;
    for (let i = 0; i < 4; i++) { mesh(roundedBox(0.1, 0.006, 0.08, 0.002), phys('#f2d890', { rough: 0.5 }), { parent: g, at: [0, y + 0.003, 0], name: `sheet${i}` }); y += 0.006; mesh(roundedBox(0.1, 0.008, 0.08, 0.003), meat(i % 2 ? '#f6ecd8' : sauceC === '#f6ecd0' ? '#f6ecd0' : '#a8301a'), { parent: g, at: [0, y + 0.004, 0], name: `layer${i}` }); y += 0.008; }
    mesh(cushion(0.1, 0.008, 0.08, { radius: 0.003, bulge: 0.3 }), phys('#e8a83a', { rough: 0.35, cc: 0.6 }), { parent: g, at: [0, y + 0.004, 0], name: 'cheese_top' });
    mesh(leafGeo(0.025, 0.014), leafy('#2f7a22'), { parent: g, at: [0.02, y + 0.009, 0], name: 'basil' });
    ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, y + 0.008, 0], r: 0.03 })));
    return g;
  }
  if (variant === 'mac-cheese') {
    const b = bowl(g, { r: 0.08, h: 0.055, color: '#f2f0ea' });
    const lvl = 0.045; mesh(fillGeo(b.local.inner, b.local.floor, lvl - 0.006), glaze('#f2b82a'), { parent: g, name: 'sauce' });
    const items = []; for (let i = 0; i < 70; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * b.inner(lvl) * 0.85; items.push({ at: [Math.cos(a) * d, lvl - 0.004 + rand() * 0.006, Math.sin(a) * d], rot: [rand() * 3, rand() * 3, rand() * 3] }); }
    scatter(g, cached('macaroni', () => new THREE.TorusGeometry(0.006, 0.003, 6, 10, PI)), phys('#f6c84a', { rough: 0.35, cc: 0.6 }), items, 'macaroni');
    if (trim === 'bacon' || trim === 'bolognese') scatter(g, TGEO.bacon(), TMAT.bacon(), items.slice(0, 10), 'bacon');
    ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, lvl, 0], r: 0.04 })));
    return g;
  }
  const t = plate(g, { r: 0.13, deep: true }).top;
  const pile = group('pile', { parent: g, at: [0, t, 0] });
  if (variant === 'spaghetti') {
    mesh(new THREE.SphereGeometry(0.06, 24, 10, 0, TAU, 0, PI / 2).scale(1, 0.4, 1), phys('#f2d890', { rough: 0.45 }), { parent: pile, name: 'nest' });
    for (let i = 0; i < 14; i++) { const pts = []; const a0 = rand() * TAU; for (let k = 0; k <= 24; k++) { const tt = k / 24; const a = a0 + tt * 6; const rr = 0.058 * (1 - tt * 0.7); pts.push([Math.cos(a) * rr, 0.004 + Math.sqrt(Math.max(0, 1 - (rr / 0.06) ** 2)) * 0.024, Math.sin(a) * rr]); } curveTube(pts, 0.0016, phys('#f2d890', { rough: 0.4, cc: 0.4 }), { parent: pile, segments: 60, radialSegments: 5, name: `strand${i}` }); }
  } else {
    // short pasta: penne / ravioli / farfalle
    const geo = variant === 'ravioli' ? cached('ravioli', () => { const gg = cushion(0.035, 0.008, 0.035, { radius: 0.0035, bulge: 0.6 }); return gg; }) : variant === 'farfalle' ? cached('farfalle', () => { const gg = new THREE.SphereGeometry(0.012, 10, 6).scale(1.4, 0.3, 0.8); const p = gg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) * (0.4 + Math.abs(x) / 0.017)); } gg.computeVertexNormals(); return gg; }) : cached('penne', () => new THREE.CylinderGeometry(0.0045, 0.0045, 0.03, 10, 1, true).rotateZ(PI / 2 - 0.4));
    const items = []; const N = variant === 'ravioli' ? 9 : 50;
    for (let i = 0; i < N; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * 0.06; items.push({ at: [Math.cos(a) * d, 0.006 + (0.06 - d) * 0.35 * rand(), Math.sin(a) * d], rot: [rand() * 3, rand() * 3, rand() * 3] }); }
    items.push({ at: [0, 0.006, 0] });
    scatter(pile, geo, phys('#f2d890', { rough: 0.45, side: THREE.DoubleSide }), items, 'pasta');
  }
  // sauce on top
  mesh(new THREE.SphereGeometry(0.04, 20, 8, 0, TAU, 0, PI / 2).scale(1, 0.25, 1), glaze(sauceC, { rough: 0.3 }), { parent: pile, at: [0, 0.018, 0], name: 'sauce' });
  if (trim === 'meatballs') scatter(pile, cached('meatball', () => jitter(new THREE.SphereGeometry(0.013, 14, 10), rnd('mb'), 0.06)), meat('#6a2e18'), [{ at: [0, 0.03, 0] }, { at: [0.022, 0.025, 0.01] }, { at: [-0.02, 0.025, 0.012] }], 'meatballs');
  if (trim !== 'alfredo' && trim !== 'carbonara') mesh(leafGeo(0.028, 0.016), leafy('#2f7a22'), { parent: pile, at: [0.01, 0.03, -0.01], rot: [0, 1, 0], name: 'basil' });
  scatter(pile, cached('parm2', () => new THREE.BoxGeometry(0.004, 0.0012, 0.002)), cream('#f6ecc8'), Array.from({ length: 30 }, () => ({ at: [(rand() - 0.5) * 0.06, 0.028, (rand() - 0.5) * 0.06], rot: [0, rand() * 3, 0] })), 'parmesan');
  mesh(roundedBox(0.012, 0.003, 0.16, 0.0012), metalMat('#d8dce0'), { parent: g, at: [0.11, t + 0.004, 0], rot: [0, 0.15, 0], name: 'fork' });
  ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, t + 0.02, 0], r: 0.03 })));
  return g;
}
function salad(parent, ctx, { variant, trim, name = 'salad' }) {
  const g = group(name, { parent });
  const rand = rnd(name + variant + trim);
  let y0, R;
  if (variant === 'jar') {
    const v = vessel([[0, 0], [0.04, 0], [0.042, 0.006], [0.042, 0.14], [0.036, 0.15], [0.035, 0.16]], 0.0025);
    mesh(v.geo, clearGlassMat(), { parent: g, name: 'jar' });
    const layers = [['#f6ecd0', 0.02], ['#e8322a', 0.025], ['#f2c63a', 0.02], ['#5a2e1e', 0.02], ['#7ab83a', 0.04]];
    let y = v.floor;
    layers.forEach(([c, h], i) => { mesh(fillGeo(v.inner, y, y + h, { n: 2 }), phys(c, { rough: 0.6, cc: 0.3 }), { parent: g, name: `layer${i}` }); y += h; });
    mesh(lathe([[0.037, 0], [0.039, 0.003], [0.039, 0.014], [0, 0.015]], 32), metalMat('#c8ccd2'), { parent: g, at: [0, 0.16, 0], name: 'lid' });
    return g;
  }
  if (variant === 'plate') { y0 = plate(g, { r: 0.13 }).top; R = 0.08; }
  else { const b = bowl(g, { r: 0.11, h: 0.07, mat: woodMat('#a8784a') }); y0 = b.floor; R = 0.08; }
  const leafs = []; for (let i = 0; i < 40; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * R; leafs.push({ at: [Math.cos(a) * d, y0 + 0.004 + (R - d) * 0.35 * rand() + rand() * 0.012, Math.sin(a) * d], rot: [(rand() - 0.5) * 1.2, rand() * TAU, (rand() - 0.5) * 1.2] }); }
  for (let k = 0; k < 5; k++) leafs.push({ at: [0, y0 + 0.004 + k * 0.007, 0], rot: [0.5, k, 0.3] });
  const fruitSalad = trim === 'fruit';
  if (!fruitSalad) scatter(g, leafGeo(0.045, 0.03, { cup: 0.5, curl: 0.2, serrate: trim === 'garden' ? 0.3 : 0 }), leafy(trim === 'caesar' ? '#8ac84a' : '#5aa83a', { cc: 0.6 }), leafs, 'greens');
  const top = y0 + 0.03;
  const add = (geo, mat, n, nm, lift = 0) => scatter(g, geo, mat, Array.from({ length: n }, () => { const a = rand() * TAU, d = Math.sqrt(rand()) * R * 0.8; return { at: [Math.cos(a) * d, top - d * 0.25 + lift, Math.sin(a) * d], rot: [rand() * 3, rand() * 3, rand() * 3] }; }), nm);
  const cube = (s) => cached(`cube${s}`, () => roundedBox(s, s, s, s * 0.25, 1));
  switch (trim ?? 'garden') {
    case 'caesar': add(cube(0.012), crust('#d8a050'), 12, 'croutons'); add(cached('parm3', () => new THREE.BoxGeometry(0.012, 0.0015, 0.006)), cream('#f6ecc8'), 20, 'parm'); add(TGEO.chicken(), TMAT.chicken(), 10, 'chicken'); break;
    case 'greek': add(cube(0.012), cream('#fbfaf4'), 10, 'feta'); add(TGEO.olive(), glaze('#2a1a2a'), 10, 'olives'); add(cube(0.012), flesh('#e8322a'), 10, 'tomato'); add(cached('cucslice', () => new THREE.CylinderGeometry(0.01, 0.01, 0.003, 14)), flesh('#c8e08a'), 10, 'cucumber'); add(TGEO.onion(), TMAT.onion(), 6, 'onion'); break;
    case 'caprese': { for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 20), i % 2 ? cream('#fbfaf4') : flesh('#e0281a'), { parent: g, at: [Math.cos(a) * 0.05, top + 0.003 + i * 0.0008, Math.sin(a) * 0.05], rot: [0.12, 0, 0], name: `slice${i}` }); } add(TGEO.basil(), TMAT.basil(), 6, 'basil', 0.008); break; }
    case 'fruit': { const fs = [['#e8203a', 'straw'], ['#f2a81a', 'orange'], ['#7ab83a', 'kiwi'], ['#2e2a5a', 'blue'], ['#f6d84a', 'pineapple']]; for (const [c, nm] of fs) add(nm === 'blue' ? cached('fb', () => new THREE.SphereGeometry(0.007, 10, 8)) : cube(0.014), flesh(c), 14, nm, -0.012); add(leafGeo(0.02, 0.012), leafy('#3a8a2a'), 3, 'mint', 0.004); break; }
    case 'cobb': add(cube(0.012), flesh('#e8322a'), 8, 'tomato'); add(TGEO.bacon(), TMAT.bacon(), 10, 'bacon'); add(cube(0.012), flesh('#9ac45a'), 8, 'avocado'); add(cached('eggq', () => new THREE.SphereGeometry(0.012, 12, 8, 0, PI)), cream('#fbf8f0'), 4, 'egg'); add(TGEO.blue(), TMAT.blue(), 10, 'blue_cheese'); break;
    case 'quinoa': add(cached('quinoa', () => new THREE.SphereGeometry(0.0022, 5, 4)), phys('#e8d8a8', { rough: 0.8 }), 120, 'quinoa'); add(cube(0.01), flesh('#e8322a'), 10, 'tomato'); add(cube(0.01), flesh('#f2c63a'), 10, 'pepper'); break;
    default: add(cube(0.012), flesh('#e8322a'), 10, 'tomato'); add(cached('cucslice', () => new THREE.CylinderGeometry(0.01, 0.01, 0.003, 14)), flesh('#c8e08a'), 10, 'cucumber'); add(cached('carrotsh', () => new THREE.BoxGeometry(0.02, 0.002, 0.002)), flesh('#f27a1a'), 20, 'carrot'); add(TGEO.onion(), TMAT.onion(), 5, 'onion');
  }
  return g;
}
const clearGlassMat = () => phys('#eef6f8', { rough: 0.03, cc: 1, opacity: 0.28, depthWrite: false, name: 'glass' });
function steakPlate(parent, ctx, { variant, trim, name = 'steak' }) {
  const g = group(name, { parent });
  const done = trim === 'rare' ? '#c8283a' : trim === 'well-done' ? '#8a5a40' : '#d8606a';
  const rand = rnd(name + variant + trim);
  const steakGeo = () => { const s = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; const r = 0.06 * (1 + 0.15 * Math.sin(a * 2 + 1) + 0.05 * Math.sin(a * 5)); s.push([Math.cos(a) * r * 1.3, Math.sin(a) * r]); } const geo = extrudeOutline(s, 0.025, { bevel: 0.006, segments: 3 }); geo.rotateX(-PI / 2); vcolor(geo, (x, y, z, c) => { c.set('#5a2a14').lerp(C('#2a120a'), fbm(x * 70, y * 70, z * 70) * 0.6); if (y > 0.008 && Math.sin((x + z) * 200) > 0.86) c.set('#1a0a06'); }); return geo; };
  if (variant === 'skewer') {
    const t = plate(g, { r: 0.14, color: '#f6f2ea' }).top;
    for (let k = 0; k < 2; k++) {
      const z = (k - 0.5) * 0.06;
      tube([-0.13, t + 0.014, z], [0.13, t + 0.014, z], 0.0015, metalMat('#c8ccd2'), { parent: g, name: `skewer${k}` });
      for (let i = 0; i < 6; i++) { const x = -0.08 + i * 0.032; const m = i % 3 === 1 ? waxy(i % 2 ? '#c81e1a' : '#2f8a2a', { cc: 0.8 }) : i % 3 === 2 ? flesh('#e8c8e0') : meat('#6a2e14', { vc: false }); mesh(jitter(roundedBox(0.024, 0.024, 0.024, 0.006, 2), rand, 0.08), m, { parent: g, at: [x, t + 0.014, z], name: `chunk${k}_${i}` }); }
    }
    return g;
  }
  if (variant === 'board') {
    const t = board(g, { w: 0.34, d: 0.22 });
    for (let i = 0; i < 6; i++) {
      const sl = group(`slice${i}`, { parent: g, at: [-0.09 + i * 0.03, t, 0], rot: [0, 0, -0.35] });
      const outline = []; for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; outline.push([Math.cos(a) * 0.035, Math.sin(a) * 0.013]); }
      const tex = cutTexture('beet', { skin: '#3a1a0a', flesh: done, flesh2: done, rind: '#7a4a3a', rindW: 0.18 }, outline, 24, [0, 0], 0.035, `steak:${trim}`);
      const geo = extrudeOutline(outline, 0.012, { bevel: 0.0015, segments: 1 });
      const p = geo.attributes.uv; const pp = geo.attributes.position; for (let k = 0; k < p.count; k++) p.setXY(k, (pp.getX(k) + 0.035) / 0.07, (pp.getY(k) + 0.013) / 0.026);
      const m = mesh(geo, [meat('#fff', { map: tex, rough: 0.5 }), meat('#3a1a0a')], { parent: sl, at: [0, 0.03, 0], rot: [0, PI / 2, 0], name: `slice${i}_m` });
      m.position.set(0.004, 0.026, 0);
    }
    scatter(g, cached('salt', () => new THREE.BoxGeometry(0.0028, 0.0022, 0.0026)), phys('#fff', { rough: 0.3 }), Array.from({ length: 20 }, () => ({ at: [(rand() - 0.5) * 0.18, t + 0.0012, 0.07 + (rand() - 0.5) * 0.04] })), 'salt');
    return g;
  }
  const t = plate(g, { r: 0.14 }).top;
  mesh(steakGeo(), meat('#fff', { vc: true, rough: 0.4 }), { parent: g, at: [-0.02, t + 0.0125, 0], name: 'steak' });
  mesh(roundedBox(0.02, 0.008, 0.016, 0.003), cream('#f8e08a'), { parent: g, at: [-0.02, t + 0.029, 0], name: 'butter' });
  mesh(leafGeo(0.04, 0.008), leafy('#3a5a2a'), { parent: g, at: [-0.03, t + 0.026, 0.01], name: 'rosemary' });
  if (trim === 'with-fries') { const items = []; for (let i = 0; i < 16; i++) items.push({ at: [0.075 + (rand() - 0.5) * 0.04, t + 0.005 + (i % 3) * 0.008, (rand() - 0.5) * 0.08], rot: [PI / 2, rand() * 3, 0] }); scatter(g, cached('fry', () => roundedBox(0.008, 0.08, 0.008, 0.002, 1)), crust('#f0c050'), items, 'fries'); }
  else { scatter(g, cached('broc2', () => jitter(new THREE.IcosahedronGeometry(0.012, 1), rnd('x'), 0.15)), phys('#3a7a2a', { rough: 0.9, flat: true }), [{ at: [0.08, t + 0.012, -0.03] }, { at: [0.09, t + 0.012, 0.0] }, { at: [0.075, t + 0.012, 0.03] }], 'broccoli'); scatter(g, cached('carrotc', () => new THREE.CylinderGeometry(0.008, 0.008, 0.004, 12)), flesh('#f27a1a'), [{ at: [0.05, t + 0.003, 0.06] }, { at: [0.065, t + 0.003, 0.07] }, { at: [0.04, t + 0.003, 0.075] }], 'carrots'); }
  ctx.animations.push(clip('steam', 2.4, steam(g, { at: [-0.02, t + 0.025, 0], r: 0.04 })));
  return g;
}
function friedChicken(parent, ctx, { variant, trim, name = 'chicken' }) {
  const g = group(name, { parent });
  const rand = rnd(name + variant + trim);
  const coat = { original: '#c8822a', spicy: '#a8401a', bbq: '#6a2a10', 'honey-glazed': '#c8761a', crispy: '#d8963a' }[trim ?? 'original'] ?? '#c8822a';
  const shiny = trim === 'bbq' || trim === 'honey-glazed';
  const coatMat = () => (shiny ? glaze(coat, { rough: 0.3 }) : crust(coat, { rough: 0.85, flat: true }));
  const drum = (parentG, at, rot, nm) => {
    const dg = group(nm, { parent: parentG, at, rot });
    const geo = jitter(lathe([[0, 0], [0.018, 0.005], [0.026, 0.025], [0.022, 0.05], [0.01, 0.065], [0.007, 0.08], [0, 0.082]], 16), rand, 0.08);
    mesh(geo, coatMat(), { parent: dg, name: `${nm}_meat` });
    mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.022, 10), phys('#f2ead8', { rough: 0.5 }), { parent: dg, at: [0, 0.088, 0], name: `${nm}_bone` });
    mesh(new THREE.SphereGeometry(0.008, 10, 8).scale(1.3, 0.8, 1), phys('#f2ead8', { rough: 0.5 }), { parent: dg, at: [0, 0.1, 0], name: `${nm}_knuckle` });
    return dg;
  };
  if (variant === 'bucket') {
    const out = [[0, 0], [0.075, 0], [0.078, 0.004], [0.1, 0.16]];
    const v = vessel(out, 0.002);
    const tex = labelTex({ bg: '#ffffff', fg: '#b8201a', accent: '#b8201a', brand: 'CLUCKERS', name: 'crispy family bucket', motif: 'stripes', w: 1024, h: 256, wrap: true });
    mesh(v.geo, phys('#ffffff', { rough: 0.6, map: tex, name: 'bucket' }), { parent: g, name: 'bucket' });
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; drum(g, [Math.cos(a) * 0.045, 0.095 + (i % 2) * 0.02, Math.sin(a) * 0.045], [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4], `piece${i}`); }
    drum(g, [0, 0.11, 0], [0, 0, 0.2], 'piece_top');
    mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.09, 24), coatMat(), { parent: g, at: [0, 0.05, 0], name: 'fill' });
    return g;
  }
  if (variant === 'drumstick') { const t = plate(g, { r: 0.11 }).top; for (let i = 0; i < 3; i++) { const d = drum(g, [(i - 1) * 0.045, t + 0.022, 0], [0, i * 0.4, PI / 2 - 0.1], `drum${i}`); void d; } return g; }
  if (variant === 'wings') {
    trayBox(g, 0.2, 0.05, 0.13, metalMat('#c8202a', { rough: 0.5, metal: 0.3 }), 0.003, { name: 'basket' });
    mesh(roundedBox(0.19, 0.002, 0.12, 0.0008), paperMat('#f6f0e2'), { parent: g, at: [0, 0.004, 0], name: 'paper' });
    const items = []; for (let i = 0; i < 9; i++) items.push({ at: [(i % 3 - 1) * 0.055, 0.016 + Math.floor(i / 3) * 0.004, (Math.floor(i / 3) - 1) * 0.035], rot: [0, rand() * 3, 0] });
    scatter(g, cached('wing', () => jitter(new THREE.CapsuleGeometry(0.012, 0.03, 4, 10).rotateZ(PI / 2).scale(1, 0.8, 1), rnd('w'), 0.1)), coatMat(), items, 'wings');
    const c = cup(g, { rTop: 0.022, rBot: 0.018, h: 0.025, mat: plasticMat('#ffffff'), at: [0.12, 0, 0.0], name: 'dip_cup' });
    mesh(fillGeo(c.local.inner, c.local.floor, 0.02), cream('#f6f2e2'), { parent: g, at: [0.12, 0, 0], name: 'ranch' });
    return g;
  }
  if (variant === 'nuggets') {
    trayBox(g, 0.12, 0.05, 0.08, paperMat('#f2c63a'), 0.002, { name: 'box' });
    const items = []; for (let i = 0; i < 8; i++) items.push({ at: [(i % 4 - 1.5) * 0.026, 0.012 + Math.floor(i / 4) * 0.014, (Math.floor(i / 4) - 0.5) * 0.03], rot: [rand(), rand() * 3, rand()] });
    scatter(g, cached('nugget', () => jitter(cushion(0.03, 0.012, 0.022, { radius: 0.005, bulge: 0.4 }), rnd('n'), 0.08)), crust('#d8963a', { flat: true }), items, 'nuggets');
    return g;
  }
  if (variant === 'roast') {
    const t = plate(g, { r: 0.17, color: '#f2efe6' }).top;
    const body = jitter(new THREE.SphereGeometry(0.075, 28, 18).scale(1.25, 0.75, 1), rand, 0.03);
    vcolor(body, (x, y, z, c) => c.set(shiny ? coat : '#c8782a').lerp(C('#7a3a12'), fbm(x * 40, y * 40, z * 40) * 0.6).lerp(C('#f2c070'), y < -0.02 ? 0.5 : 0));
    mesh(body, gloss('#fff', { vc: true, rough: 0.35, cc: 0.8 }), { parent: g, at: [0, t + 0.05, 0], name: 'roast' });
    for (const s of [-1, 1]) drum(g, [0.085, t + 0.03, s * 0.035], [0, 0, -PI / 2 + 0.3], `leg${s}`);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; mesh(jitter(new THREE.SphereGeometry(0.016, 10, 8), rand, 0.1), crust('#d8a050'), { parent: g, at: [Math.cos(a) * 0.12, t + 0.012, Math.sin(a) * 0.12], name: `potato${i}` }); }
    ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, t + 0.1, 0], r: 0.05 })));
    return g;
  }
  return g;
}
function eggFried(parent, at, name, rand) {
  const s = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; const r = 0.04 * (1 + 0.15 * Math.sin(a * 3 + rand() * 2) + 0.07 * Math.sin(a * 7)); s.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const geo = extrudeOutline(s, 0.004, { bevel: 0.0015, segments: 2 }); geo.rotateX(-PI / 2);
  const g = group(name, { parent, at });
  mesh(geo, cream('#fbfaf4', { rough: 0.3, cc: 0.6 }), { parent: g, at: [0, 0.002, 0], name: `${name}_white` });
  mesh(new THREE.SphereGeometry(0.014, 18, 10, 0, TAU, 0, PI / 2).scale(1, 0.6, 1), glaze('#f2900a'), { parent: g, at: [0.005, 0.004, 0.004], name: `${name}_yolk` });
  return g;
}
function breakfast(parent, ctx, { variant, trim, name = 'breakfast' }) {
  const g = group(name, { parent });
  const rand = rnd(name + variant + trim);
  const t = plate(g, { r: variant === 'full' ? 0.15 : 0.13 }).top;
  const toast = (at, nm) => { const geo = cushion(0.08, 0.012, 0.08, { radius: 0.005, bulge: 0.15 }); vcolor(geo, (x, y, z, c) => c.set(Math.max(Math.abs(x), Math.abs(z)) > 0.036 ? '#8a4a1a' : '#d8a050').multiplyScalar(0.9 + fbm(x * 90, y * 90, z * 90) * 0.2)); return mesh(geo, crust('#fff', { vc: true }), { parent: g, at: [at[0], t + 0.006, at[2]], rot: [0, at[3] ?? 0, 0], name: nm }); };
  const scrambled = trim === 'scrambled';
  const eggs = (at) => { if (scrambled) scatter(g, cached('scram', () => jitter(new THREE.IcosahedronGeometry(0.012, 1), rnd('e'), 0.25)), cream('#f6d84a', { rough: 0.5 }), Array.from({ length: 12 }, () => ({ at: [at[0] + (rand() - 0.5) * 0.05, t + 0.008, at[2] + (rand() - 0.5) * 0.05], rot: [rand(), rand(), rand()] })), 'scrambled'); else { eggFried(g, [at[0], t, at[2]], 'egg1', rand); eggFried(g, [at[0] + 0.03, t + 0.0001, at[2] + 0.04], 'egg2', rand); } };
  switch (variant) {
    case 'full': {
      eggs([-0.05, 0, -0.04]);
      for (let i = 0; i < 2; i++) sausage(g, { L: 0.09, r: 0.011, at: [0.05, t + 0.011, -0.05 + i * 0.024], name: `sausage${i}` });
      baconStrips(g, t, { name: 'bacon', n: 2, L: 0.09 }).valueOf();
      g.getObjectByName('bacon0').position.set(0.04, t + 0.004, 0.04); g.getObjectByName('bacon1').position.set(0.04, t + 0.004, 0.065);
      const b = bowl(g, { r: 0.028, h: 0.022, at: [-0.06, t, 0.06], color: '#f6f2ea' }); mesh(fillGeo(b.local.inner, b.local.floor, 0.017), glaze('#c8501a'), { parent: g, at: [-0.06, t, 0.06], name: 'beans' });
      toast([0.0, 0, 0.09, 0.3], 'toast');
      mesh(new THREE.SphereGeometry(0.02, 16, 8, 0, TAU, 0, PI / 2), flesh('#d8301a'), { parent: g, at: [-0.095, t, -0.0], name: 'tomato' });
      break;
    }
    case 'eggs-bacon': eggs([-0.03, 0, -0.02]); baconStrips(g, t, { name: 'bacon', n: 3, L: 0.1 }); for (let i = 0; i < 3; i++) g.getObjectByName(`bacon${i}`).position.set(0.04, t + 0.004 + i * 0.0005, 0.03 + (i - 1) * 0.022); break;
    case 'benedict': {
      for (let i = 0; i < 2; i++) { const x = (i - 0.5) * 0.08; mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.016, 24), crust('#e8c080'), { parent: g, at: [x, t + 0.008, 0], name: `muffin${i}` }); mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.004, 24), meat('#e88a7a'), { parent: g, at: [x, t + 0.018, 0], name: `ham${i}` }); mesh(new THREE.SphereGeometry(0.03, 20, 10, 0, TAU, 0, PI / 2).scale(1, 0.6, 1), cream('#fbf8f0'), { parent: g, at: [x, t + 0.02, 0], name: `egg${i}` }); mesh(new THREE.SphereGeometry(0.033, 20, 10, 0, TAU, 0, PI / 2.3).scale(1, 0.62, 1), glaze('#f6cc4a', { opacity: 0.95, transparent: true }), { parent: g, at: [x, t + 0.02, 0], name: `hollandaise${i}` }); }
      break;
    }
    case 'avocado-toast': {
      toast([0, 0, 0, 0.2], 'toast');
      const items = []; for (let i = 0; i < 8; i++) items.push({ at: [-0.03 + i * 0.008, t + 0.016, (i % 2) * 0.006 - 0.003], rot: [0, 0.2, 0.4] });
      scatter(g, cached('avoslice', () => new THREE.CylinderGeometry(0.03, 0.03, 0.004, 20, 1, false, 0, PI).rotateX(PI / 2).scale(1, 0.6, 1)), flesh('#b8d266'), items, 'avocado');
      if (!scrambled) eggFried(g, [0.0, t + 0.02, 0.0], 'egg', rand);
      scatter(g, cached('chflake3', () => new THREE.BoxGeometry(0.002, 0.001, 0.0015)), glaze('#c8201a'), Array.from({ length: 30 }, () => ({ at: [(rand() - 0.5) * 0.06, t + 0.03, (rand() - 0.5) * 0.06] })), 'chili');
      break;
    }
    case 'omelette': {
      const geo = new THREE.SphereGeometry(0.06, 28, 12, 0, PI, 0, PI).rotateZ(PI / 2).scale(1.2, 0.22, 0.55);
      const p = geo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, p.getY(i) * 0.1);
      geo.computeVertexNormals();
      vcolor(geo, (x, y, z, c) => c.set('#f6d04a').lerp(C('#d8a030'), fbm(x * 60, y * 60, z * 60) * 0.6));
      mesh(geo, cream('#fff', { vc: true, rough: 0.4 }), { parent: g, at: [0, t + 0.002, 0], name: 'omelette' });
      scatter(g, cached('chive2', () => new THREE.CylinderGeometry(0.001, 0.001, 0.006, 4).rotateZ(PI / 2)), leafy('#3a8a2a'), Array.from({ length: 20 }, () => ({ at: [(rand() - 0.5) * 0.1, t + 0.015, (rand() - 0.5) * 0.03], rot: [0, rand() * 3, 0] })), 'chives');
      break;
    }
    default: break;
  }
  ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, t + 0.01, 0], r: 0.04 })));
  return g;
}
function pancakes(parent, ctx, { variant, trim, name = 'pancakes' }) {
  const g = group(name, { parent });
  const rand = rnd(name + variant + trim);
  const t = plate(g, { r: 0.13 }).top;
  const crepe = variant === 'crepes';
  const n = variant === 'short-stack' ? 3 : crepe ? 1 : 6;
  let y = t;
  for (let i = 0; i < n; i++) {
    if (crepe) {
      const geo = new THREE.CylinderGeometry(0.03, 0.03, 0.09, 24, 1, false).rotateZ(PI / 2).scale(1, 0.55, 1);
      for (let k = 0; k < 2; k++) mesh(geo, crust('#e8b870', { side: THREE.DoubleSide }), { parent: g, at: [0, t + 0.0165, (k - 0.5) * 0.065], rot: [0, 0.1, 0], name: `crepe${k}` });
      y = t + 0.033; break;
    }
    const geo = lathe([[0, 0], [0.056, 0], [0.06, 0.006], [0.056, 0.012], [0, 0.0125]], 40);
    vcolor(geo, (x, yy, z, c) => { const edge = Math.hypot(x, z) > 0.054; c.set(edge ? '#e8c080' : '#b8702e').lerp(C('#d8964a'), fbm(x * 70, 0, z * 70) * 0.7); });
    mesh(geo, crust('#fff', { vc: true }), { parent: g, at: [Math.sin(i * 2) * 0.003, y, Math.cos(i * 3) * 0.003], rot: [0, i, 0], name: `pancake${i}` });
    y += 0.0122;
  }
  const top = y;
  const syrupC = trim === 'chocolate' ? '#3a1e10' : '#a8501a';
  if (trim !== 'berries' || true) {
    const geo = new THREE.CylinderGeometry(0.045, 0.05, 0.002, 32); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 + 0.2 * Math.sin(a * 5); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    if (trim === 'syrup' || trim === 'chocolate' || trim === 'butter' || !trim) mesh(geo, glaze(syrupC, { opacity: 0.92, transparent: true }), { parent: g, at: [0, top + 0.001, 0], name: 'syrup' });
  }
  if (trim === 'butter' || !trim || trim === 'syrup') mesh(roundedBox(0.022, 0.01, 0.018, 0.003), cream('#f8e08a'), { parent: g, at: [0, top + 0.006, 0], rot: [0, 0.4, 0], name: 'butter' });
  if (trim === 'berries') { scatter(g, cached('wberry', () => new THREE.SphereGeometry(0.006, 10, 8)), phys('#2e3a6a', { rough: 0.5, sheen: 1, sheenColor: '#9aa8d0' }), Array.from({ length: 12 }, () => { const a = rand() * TAU, d = Math.sqrt(rand()) * 0.04; return { at: [Math.cos(a) * d, top + 0.006, Math.sin(a) * d] }; }), 'blueberries'); for (let i = 0; i < 3; i++) mesh(new THREE.ConeGeometry(0.01, 0.02, 10).rotateX(PI), waxy('#d81e2a', { rough: 0.2 }), { parent: g, at: [Math.cos(i * 2) * 0.02, top + 0.009, Math.sin(i * 2) * 0.02], rot: [0.5, i, 0], name: `straw${i}` }); }
  if (trim === 'banana') scatter(g, cached('banslice2', () => new THREE.CylinderGeometry(0.012, 0.012, 0.005, 16)), flesh('#f6ecc0'), Array.from({ length: 8 }, (_, i) => ({ at: [Math.cos(i * 0.8) * 0.03, top + 0.0025 + (i % 2) * 0.001, Math.sin(i * 0.8) * 0.03], rot: [0.1, 0, 0.1] })), 'banana');
  if (trim === 'cream' || trim === 'chocolate') { swirlCream2(g, [0, top, 0]); }
  if (trim === 'chocolate') scatter(g, cached('chip3', () => new THREE.ConeGeometry(0.003, 0.004, 8)), phys('#2a160c'), Array.from({ length: 14 }, () => { const a = rand() * TAU, d = 0.02 + rand() * 0.02; return { at: [Math.cos(a) * d, top + 0.003, Math.sin(a) * d] }; }), 'chips');
  ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, top, 0], r: 0.035 })));
  return g;
}
function swirlCream2(g, at) {
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; const a = t * TAU * 2.5; const rr = 0.02 * (1 - t * 0.85); pts.push([at[0] + Math.cos(a) * rr, at[1] + 0.005 + t * 0.025, at[2] + Math.sin(a) * rr]); }
  mesh(sweep(pts, { r: (t) => 0.008 * (1 - t * 0.6), ring: (a) => 1 + 0.15 * Math.cos(a * 8), seg: 80, sides: 18 }), cream('#fffaf2'), { parent: g, name: 'cream' });
}
function soup(parent, ctx, { variant, trim, name = 'soup' }) {
  const g = group(name, { parent });
  const rand = rnd(name + variant + trim);
  const col = { tomato: '#c8301a', pumpkin: '#e8801a', 'chicken-noodle': '#e8c870', minestrone: '#b8502a', pea: '#8ab83a', mushroom: '#c8a87a', 'broccoli-cheddar': '#e8b83a', borscht: '#9a1a3a' }[trim ?? 'tomato'] ?? '#c8301a';
  let level, inner, cx = 0;
  if (variant === 'bread-bowl') {
    const geo = new THREE.SphereGeometry(0.075, 32, 16, 0, TAU, PI * 0.28, PI * 0.72);
    const outer = vcolor(geo, (x, y, z, c) => c.set('#a8622a').lerp(C('#6a3612'), fbm(x * 50, y * 50, z * 50) * 0.6));
    mesh(outer, crust('#fff', { vc: true, side: THREE.DoubleSide }), { parent: g, at: [0, 0.075 * 0.95, 0], scale: [1, 0.95, 1], name: 'bread' });
    level = 0.075 * 0.95 + 0.075 * Math.cos(PI * 0.28) * 0.95 - 0.006;
    const r = 0.075 * Math.sin(PI * 0.28) - 0.004;
    mesh(new THREE.CircleGeometry(r, 32).rotateX(-PI / 2), liquidMat(col), { parent: g, at: [0, level, 0], name: 'soup' });
    mesh(new THREE.TorusGeometry(r + 0.002, 0.006, 8, 32).rotateX(PI / 2), crumbMat(), { parent: g, at: [0, level + 0.003, 0], name: 'crumb_rim' });
    inner = () => r;
  } else if (variant === 'mug') {
    const c = cup(g, { rTop: 0.045, rBot: 0.04, h: 0.09, mat: ceramic('#e8eef2') });
    handle(g, { x: 0.045, y0: 0.025, y1: 0.075, mat: ceramic('#e8eef2') });
    level = 0.078; mesh(fillGeo(c.local.inner, c.local.floor, level), liquidMat(col), { parent: g, name: 'soup' });
    inner = c.inner;
  } else if (variant === 'pot') {
    const c = cup(g, { rTop: 0.11, rBot: 0.105, h: 0.12, wall: 0.003, mat: metalMat('#2a2a2e', { rough: 0.35 }) });
    for (const s of [-1, 1]) curveTube([[s * 0.11, 0.1, -0.03], [s * 0.135, 0.103, -0.02], [s * 0.135, 0.103, 0.02], [s * 0.11, 0.1, 0.03]], 0.005, metalMat('#1a1a1c'), { parent: g, segments: 12, radialSegments: 8, name: `pot_handle${s}` });
    level = 0.1; mesh(fillGeo(c.local.inner, c.local.floor, level), liquidMat(col), { parent: g, name: 'soup' });
    inner = c.inner;
    const ladle = group('ladle', { parent: g, at: [0.04, level, 0] });
    mesh(new THREE.SphereGeometry(0.03, 16, 8, 0, TAU, PI / 2, PI / 2), metalMat('#c8ccd2'), { parent: ladle, at: [0, 0.01, 0], name: 'ladle_cup' });
    tube([0, 0.012, 0], [0.09, 0.14, 0], 0.004, metalMat('#c8ccd2'), { parent: ladle, name: 'ladle_handle' });
  } else {
    const b = bowl(g, { r: 0.08, h: 0.06, color: '#f6f2ea' });
    level = 0.05; mesh(fillGeo(b.local.inner, b.local.floor, level), liquidMat(col), { parent: g, name: 'soup' });
    inner = b.inner;
    mesh(roundedBox(0.012, 0.004, 0.17, 0.0015), metalMat('#d8dce0'), { parent: g, at: [0.1, 0.002, 0], name: 'spoon' });
  }
  const R = inner(level) * 0.8;
  const pick = (n) => Array.from({ length: n }, () => { const a = rand() * TAU, d = Math.sqrt(rand()) * R; return { at: [cx + Math.cos(a) * d, level + 0.0008, Math.sin(a) * d], rot: [0, rand() * 3, 0] }; });
  if (trim === 'tomato' || !trim) { mesh(new THREE.CircleGeometry(R * 0.35, 24).rotateX(-PI / 2), cream('#fbf6ee'), { parent: g, at: [0, level + 0.0006, 0], name: 'cream_swirl' }); mesh(leafGeo(0.025, 0.014), leafy('#2f7a22'), { parent: g, at: [0, level + 0.002, 0], name: 'basil' }); }
  if (trim === 'pumpkin') { scatter(g, seedGeo(), phys('#4a7a2a', { rough: 0.5 }), pick(14).map((p) => ({ ...p, scale: 3 })), 'pepitas'); mesh(new THREE.CircleGeometry(R * 0.3, 24).rotateX(-PI / 2), cream('#fbf6ee'), { parent: g, at: [0, level + 0.0006, 0], name: 'cream' }); }
  if (trim === 'chicken-noodle') { noodleTop(g, level - 0.001, R, rand, 0.0016); scatter(g, cached('carrotc', () => new THREE.CylinderGeometry(0.006, 0.006, 0.003, 12)), flesh('#f27a1a'), pick(12), 'carrots'); scatter(g, TGEO.chicken(), TMAT.chicken(), pick(8), 'chicken'); }
  if (trim === 'minestrone') { scatter(g, cached('bean', () => new THREE.SphereGeometry(0.005, 8, 6).scale(1.5, 0.7, 1)), phys('#f2ead8', { rough: 0.5 }), pick(10), 'beans'); scatter(g, cached('penne2', () => new THREE.CylinderGeometry(0.003, 0.003, 0.014, 8, 1, true).rotateZ(PI / 2)), phys('#f2d890', { side: THREE.DoubleSide }), pick(12), 'pasta'); scatter(g, cached('cube8', () => roundedBox(0.008, 0.008, 0.008, 0.002, 1)), flesh('#f27a1a'), pick(10), 'veg'); }
  if (trim === 'pea') scatter(g, cached('crout', () => roundedBox(0.01, 0.01, 0.01, 0.002, 1)), crust('#d8a050'), pick(8), 'croutons');
  if (trim === 'mushroom') scatter(g, TGEO.mushroom(), phys('#8a6a4a', { rough: 0.6 }), pick(8), 'mushrooms');
  if (trim === 'broccoli-cheddar') scatter(g, cached('broc3', () => jitter(new THREE.IcosahedronGeometry(0.009, 1), rnd('bb'), 0.15)), phys('#3a7a2a', { rough: 0.9, flat: true }), pick(7), 'broccoli');
  if (trim === 'borscht') mesh(new THREE.CircleGeometry(R * 0.3, 24).rotateX(-PI / 2), cream('#fbfaf4'), { parent: g, at: [0, level + 0.0006, 0], name: 'sour_cream' });
  ctx.animations.push(clip('steam', 2.4, steam(g, { at: [0, level, 0], r: Math.min(0.05, R) })));
  return g;
}
const crumbMat = () => phys('#f2e2c0', { rough: 0.95 });
import { handle } from './common.js';

/* ================================================================= factories */
const mk = (type, variants, fn) => make(type, Object.fromEntries(variants.map((v) => [v, {}])), fn);
export const createPizza = mk('pizza', ['whole', 'slice', 'box', 'personal', 'square'], (ctx) => {
  const { variant, trim, root } = ctx;
  if (variant === 'whole') { const t = board(root, { w: 0.4, d: 0.4, round: true, color: '#b8864a' }); pizza(root, ctx, { trim, at: [0, t, 0] }); }
  else if (variant === 'slice') { const t = plate(root, { r: 0.12 }).top; const len = TAU / 8; const s = pizza(root, ctx, { trim, t0: -len / 2, len, at: [0, t, -0.085], R: 0.16 }); void s; }
  else if (variant === 'box') pizzaBox(root, ctx, trim);
  else if (variant === 'personal') { const t = plate(root, { r: 0.13, color: '#2a2a2c' }).top; pizza(root, ctx, { trim, R: 0.11, at: [0, t, 0] }); }
  else if (variant === 'square') { const t = board(root, { w: 0.44, d: 0.32 }); pizza(root, ctx, { trim, square: true, at: [0, t, 0] }); }
  ctx.animations.push(clip('steam', 2.4, steam(root, { at: [0, 0.03, 0], r: 0.06 })));
});
export const createBurger = mk('burger', ['classic', 'double', 'slider', 'chicken', 'veggie', 'tower'], (ctx) => {
  const { variant, trim, root, rand } = ctx;
  if (trim === 'in-wrapper') {
    const b = burger(root, ctx, { variant: variant === 'slider' ? 'classic' : variant, trim: 'cheese' });
    const w = vessel([[0, 0], [0.065, 0], [0.068, 0.004], [0.07, 0.05]], 0.001, { seg: 40 });
    const p = w.geo.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, p.getY(i) * (1 + 0.15 * Math.sin(a * 9))); }
    mesh(w.geo, paperMat('#f2e6c8', { side: THREE.DoubleSide, map: labelTex({ bg: '#f2e6c8', fg: '#b8201a', accent: '#b8201a', brand: 'GRILLHOUSE', name: '', motif: 'dots', w: 512, h: 128, wrap: true }) }), { parent: root, name: 'wrapper' });
    void b; return;
  }
  if (variant === 'slider') { const t = board(root, { w: 0.34, d: 0.16 }); for (let i = 0; i < 3; i++) burger(root, ctx, { variant: 'classic', trim: trim ?? 'cheese', at: [(i - 1) * 0.1, t, 0], s: 0.55, name: `slider${i}` }); return; }
  if (trim === 'with-fries') { const t = board(root, { w: 0.36, d: 0.24 }); burger(root, ctx, { variant, trim: 'cheese', at: [-0.06, t, 0] }); fries(root, { at: [0.09, t, 0], kind: 'cone', rand }); return; }
  if (trim === 'on-plate') { const t = plate(root, { r: 0.13 }).top; burger(root, ctx, { variant, trim: 'deluxe', at: [0, t, 0] }); return; }
  burger(root, ctx, { variant, trim });
});
export const createHotdog = mk('hotdog', ['classic', 'bratwurst', 'corn-dog'], (ctx) => {
  const { variant, trim, root } = ctx;
  if (trim === 'in-tray') { trayBox(root, 0.21, 0.04, 0.07, paperMat('#f6f0e2'), 0.0015, { name: 'tray' }); hotdog(root, ctx, { variant, trim: 'classic', at: [0, 0.0015, 0] }); return; }
  hotdog(root, ctx, { variant, trim });
});
export const createSandwich = mk('sandwich', ['club', 'half', 'sub', 'grilled'], (ctx) => {
  const { variant, trim, root } = ctx;
  if (trim === 'on-plate') { const t = plate(root, { r: 0.13 }).top; const g = group('p', { parent: root, at: [0, t, 0] }); sandwich(g, ctx, { variant: variant === 'half' ? 'half' : variant, trim: 'ham-cheese' }); return; }
  sandwich(root, ctx, { variant: variant === 'half' ? 'half' : variant, trim: variant === 'grilled' ? trim ?? 'grilled-cheese' : trim });
});
export const createTaco = mk('taco', ['hard-shell', 'soft', 'trio'], (ctx) => {
  const { variant, trim, root } = ctx;
  if (variant === 'trio') { const t = plate(root, { r: 0.15, color: '#e8a83a' }).top; for (let i = 0; i < 3; i++) taco(root, ctx, { trim, at: [0, t, (i - 1) * 0.06], name: `taco${i}`, soft: i === 1 }); mesh(new THREE.SphereGeometry(0.02, 12, 8).scale(1.3, 0.6, 1), flesh('#d8e84a'), { parent: root, at: [0.1, t + 0.004, 0.08], name: 'lime' }); return; }
  taco(root, ctx, { soft: variant === 'soft', trim });
});
export const createBurrito = mk('burrito', ['wrapped', 'cut', 'bowl'], (ctx) => { burrito(ctx.root, ctx, { variant: ctx.variant, trim: ctx.trim }); });
export const createSushi = mk('sushi', ['nigiri', 'maki', 'set', 'platter', 'bento'], (ctx) => { sushi(ctx.root, ctx, { variant: ctx.variant, trim: ctx.trim }); });
export const createRamen = mk('ramen', ['bowl', 'udon', 'cup'], (ctx) => { noodleBowl(ctx.root, ctx, { variant: ctx.variant, trim: ctx.trim }); });
export const createPasta = mk('pasta', ['spaghetti', 'penne', 'farfalle', 'ravioli', 'lasagna', 'mac-cheese'], (ctx) => { pastaPlate(ctx.root, ctx, { variant: ctx.variant, trim: ctx.trim }); });
export const createSalad = mk('salad', ['bowl', 'plate', 'jar'], (ctx) => { salad(ctx.root, ctx, { variant: ctx.variant, trim: ctx.trim }); });
export const createSteak = mk('steak', ['plate', 'board', 'skewer'], (ctx) => { steakPlate(ctx.root, ctx, { variant: ctx.variant, trim: ctx.trim }); });
export const createChicken = mk('chicken', ['bucket', 'drumstick', 'wings', 'nuggets', 'roast'], (ctx) => { friedChicken(ctx.root, ctx, { variant: ctx.variant, trim: ctx.trim }); });
export const createFries = mk('fries', ['carton', 'cone', 'basket'], (ctx) => { fries(ctx.root, { kind: ctx.variant, trim: ctx.trim, rand: ctx.rand }); });
export const createBreakfast = mk('breakfast', ['full', 'eggs-bacon', 'benedict', 'avocado-toast', 'omelette'], (ctx) => { breakfast(ctx.root, ctx, { variant: ctx.variant, trim: ctx.trim }); });
export const createPancakes = mk('pancakes', ['stack', 'short-stack', 'crepes'], (ctx) => { pancakes(ctx.root, ctx, { variant: ctx.variant, trim: ctx.trim }); });
export const createSoup = mk('soup', ['bowl', 'bread-bowl', 'mug', 'pot'], (ctx) => { soup(ctx.root, ctx, { variant: ctx.variant, trim: ctx.trim }); });
void napkin; void disc; void gloss; void crumbMat;
