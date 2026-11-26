/*
 * Bread & pastry: lofted loaves with baked crust colour (scoring, flour, seeds), real crumb
 * faces when sliced, plus laminated croissants, bagels, pretzels, rolls, eclairs, macarons…
 */
import {
  THREE, PI, TAU, trayBox, extrudeOutline, mesh, group, curveTube, roundedBox, lathe, sweep, scatter, cached, jitter, cushion,
  crust, gloss, glaze, cream, flesh, phys, woodMat, paperMat, plate, board, bowl, vcolor, fbm, toColor, make, seedGeo, ballGeo, fitUV, leafGeo, leafy, metalMat, SPRINKLES,
} from './common.js';
import { cutTexture } from './cut.js';

const C = (h) => toColor(h);
const sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);

/* ------------------------------------------------------------ loaf loft */
/**
 * Loaf surface over t∈[t0,t1] along X. spec: { L, w, h, sq, tip, endExp, hb, lumps, flat }.
 * Returns { geo, ring(t) → [[z,y]...] outline, x(t) }.
 */
function loafGeo(s, t0 = 0, t1 = 1, { seg = 40, sides = 36 } = {}) {
  const { L, w, h, sq = 2, tip = 2, endExp = 0.5, hb = 0.004, lumps = 0, lumpN = 4 } = s;
  const e = (t) => Math.max(0.05, Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * t - 1), tip)), endExp));
  const pt = (t, a) => {
    const k = e(t);
    const ca = Math.cos(a), sa = Math.sin(a);
    const lump = 1 + lumps * Math.abs(Math.sin(t * PI * lumpN));
    const z = (w / 2) * k * sp(ca, 2 / sq);
    const y = sa >= 0 ? hb + (h - hb) * Math.pow(k, 0.8) * lump * Math.pow(sa, 2 / sq) : hb * (1 - Math.pow(-sa, 0.5));
    return [-L / 2 + t * L, y, z];
  };
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const t = t0 + ((t1 - t0) * i) / seg;
    for (let j = 0; j <= sides; j++) { const p = pt(t, (j / sides) * TAU); pos.push(...p); uv.push(t, j / sides); }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < sides; j++) { const a = i * (sides + 1) + j, b = a + sides + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // end fans where the loaf ends naturally
  const fan = (i, flip, t) => { const c = pos.length / 3; const P = pt(t, PI / 2); const B = pt(t, -PI / 2); pos.push(P[0], (P[1] + B[1]) / 2, 0); uv.push(t, 0.5); for (let j = 0; j < sides; j++) { const a = i * (sides + 1) + j; flip ? idx.push(c, a + 1, a) : idx.push(c, a, a + 1); } };
  if (t0 <= 0) fan(0, true, 0);
  if (t1 >= 1) fan(seg, false, 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const ring = (t) => { const out = []; for (let j = 0; j < sides; j++) { const p = pt(t, (j / sides) * TAU); out.push([p[2], p[1]]); } return out; };
  return { geo, ring, x: (t) => -L / 2 + t * L };
}
function paintCrust(geo, s, cols) {
  const top = C(cols.top), mid = C(cols.mid), bot = C(cols.bot), fl = C('#f4efe6');
  vcolor(geo, (x, y, z, c) => {
    const ty = Math.min(1, y / s.h);
    const n = fbm(x * 70, y * 70, z * 70, 3);
    c.copy(bot).lerp(mid, Math.min(1, ty * 2.2)).lerp(top, Math.max(0, ty - 0.5) * 1.6);
    c.multiplyScalar((0.85 + n * 0.3) * 0.78);
    if (s.score) {
      const v = s.score(x, y, z, ty);
      if (v > 0) c.lerp(C(cols.score ?? '#e8c890'), Math.min(1, v));
    }
    if (cols.flour && ty > 0.45) c.lerp(fl, Math.max(0, fbm(x * 40 + 9, y * 40, z * 40) - 0.38) * 1.8 * cols.flour);
  });
  return geo;
}
function crumbFace(parent, ring, x, dir, s, cols, key, name) {
  const outline = ring.slice();
  const shape = new THREE.Shape(outline.map(([u, v]) => new THREE.Vector2(u, v)));
  const geo = fitUV(new THREE.ShapeGeometry(shape, 1));
  geo.rotateY(dir > 0 ? PI / 2 : -PI / 2);
  const tex = cutTexture(cols.crumbKind ?? 'crumb', { skin: cols.top, flesh: cols.crumb, flesh2: cols.crumb2 ?? cols.crumb, rind: cols.mid, rindW: 0.035, swirl: cols.swirl, dots: cols.dots }, outline, outline.length, [0, s.h / 2], Math.max(s.w, s.h) / 2, key);
  return mesh(geo, phys(cols.crumb, { rough: 0.95, sheen: 0.3, map: tex, side: THREE.DoubleSide, name: 'crumb' }), { parent, at: [x, 0, 0], name });
}

/* ------------------------------------------------------------ bread specs */
const BREADS = {
  baguette: { s: { L: 0.6, w: 0.062, h: 0.055, tip: 2, endExp: 0.75, score: (x, y, z, ty) => (ty > 0.7 ? Math.max(0, 1 - Math.abs(((x + z * 2.5) % 0.11 + 0.11) % 0.11 - 0.055) / 0.006) * (Math.abs(x) < 0.25 ? 1 : 0) : 0) }, cols: { top: '#a8622a', mid: '#c98a3a', bot: '#e0b878', crumb: '#f4e6c4', crumb2: '#e6d2a6', crumbKind: 'open-crumb' } },
  sourdough: { s: { L: 0.2, w: 0.2, h: 0.1, tip: 2, endExp: 0.5, sq: 2.2, score: (x, y, z, ty) => (ty > 0.75 ? Math.max(0, 1 - Math.min(Math.abs(x), Math.abs(z)) / 0.005) : 0) }, cols: { top: '#8a4a1e', mid: '#b8742e', bot: '#d8aa6a', crumb: '#f2e2c0', crumb2: '#e2cca0', crumbKind: 'open-crumb', flour: 0.8, score: '#f0dcb0' } },
  batard: { s: { L: 0.3, w: 0.14, h: 0.09, tip: 2, endExp: 0.6, score: (x, y, z, ty) => (ty > 0.8 ? Math.max(0, 1 - Math.abs(z - x * 0.15) / 0.006) * (Math.abs(x) < 0.11 ? 1 : 0) : 0) }, cols: { top: '#9a5222', mid: '#c07a32', bot: '#dcae6e', crumb: '#f2e2c0', crumb2: '#e2cca0', crumbKind: 'open-crumb', flour: 0.5 } },
  'sandwich-loaf': { s: { L: 0.24, w: 0.11, h: 0.125, sq: 7, tip: 12, endExp: 0.3 }, cols: { top: '#9a5a26', mid: '#c88a40', bot: '#d8a868', crumb: '#f8f0dc', crumb2: '#efe2c4', crumbKind: 'sponge' } },
  rye: { s: { L: 0.24, w: 0.12, h: 0.09, tip: 3, endExp: 0.5, sq: 2.6 }, cols: { top: '#4a2a16', mid: '#6a4024', bot: '#8a5a34', crumb: '#8a6a4a', crumb2: '#6a4a30', crumbKind: 'crumb', seeds: '#3a2a1a' } },
  ciabatta: { s: { L: 0.26, w: 0.13, h: 0.06, tip: 4, endExp: 0.4, sq: 3 }, cols: { top: '#c8925a', mid: '#d8a86a', bot: '#e6c08a', crumb: '#f2e4c8', crumb2: '#d8c49a', crumbKind: 'open-crumb', flour: 1 } },
  brioche: { s: { L: 0.22, w: 0.11, h: 0.1, tip: 8, endExp: 0.4, sq: 3, lumps: 0.18, lumpN: 4 }, cols: { top: '#6a3210', mid: '#a85a1e', bot: '#d8964a', crumb: '#fae6b0', crumb2: '#f0d490', crumbKind: 'sponge', shiny: true } },
  challah: { s: { L: 0.3, w: 0.12, h: 0.09, tip: 2, endExp: 0.6, lumps: 0.15, lumpN: 6 }, cols: { top: '#7a3a12', mid: '#b0642a', bot: '#dca060', crumb: '#fae8b8', crumb2: '#efd8a0', crumbKind: 'sponge', shiny: true, seeds: '#f4ead0' } },
  roll: { s: { L: 0.09, w: 0.085, h: 0.06, tip: 2, endExp: 0.5, sq: 2.2 }, cols: { top: '#a8622a', mid: '#c98a3a', bot: '#e0b878', crumb: '#f6eacc', crumb2: '#e6d2a6', crumbKind: 'crumb' } },
  focaccia: { s: { L: 0.26, w: 0.18, h: 0.032, sq: 8, tip: 10, endExp: 0.25, score: (x, y, z, ty) => (ty > 0.9 ? Math.max(0, 1 - Math.hypot(((x % 0.03) + 0.03) % 0.03 - 0.015, ((z % 0.03) + 0.03) % 0.03 - 0.015) / 0.005) : 0) }, cols: { top: '#c8862e', mid: '#d8a046', bot: '#e8c27a', crumb: '#f6e6c0', crumb2: '#e6cc96', crumbKind: 'open-crumb', score: '#9a5a1e' } },
  pita: { s: { L: 0.17, w: 0.17, h: 0.016, sq: 2, tip: 2, endExp: 0.5, hb: 0.004 }, cols: { top: '#d8a868', mid: '#e8c896', bot: '#f0dcb0', crumb: '#f6ecd6', crumb2: '#e8dcbc', crumbKind: 'sponge' } },
  bun: { s: { L: 0.105, w: 0.105, h: 0.055, sq: 2.3, tip: 2, endExp: 0.5, hb: 0.003 }, cols: { top: '#a8561e', mid: '#c87a32', bot: '#e8c27a', crumb: '#f8ecd0', crumb2: '#eadcb4', crumbKind: 'sponge', shiny: true, seeds: '#f6ecd0' } },
};
function crustMat(cols) { return cols.shiny ? gloss('#fff', { vc: true, rough: 0.3, cc: 0.8 }) : crust('#fff', { vc: true }); }
function seedsOnTop(parent, s, rand, color, n, name = 'seeds') {
  const items = [];
  for (let i = 0; i < n; i++) {
    const t = 0.1 + rand() * 0.8, a = PI * (0.2 + rand() * 0.6);
    const k = Math.max(0.05, Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * t - 1), s.tip ?? 2)), s.endExp ?? 0.5));
    const lump = 1 + (s.lumps ?? 0) * Math.abs(Math.sin(t * PI * (s.lumpN ?? 4)));
    const ca = Math.cos(a), sa = Math.sin(a);
    const z = (s.w / 2) * k * sp(ca, 2 / (s.sq ?? 2)) * 0.98;
    const y = (s.hb ?? 0.004) + (s.h - (s.hb ?? 0.004)) * Math.pow(k, 0.8) * lump * Math.pow(sa, 2 / (s.sq ?? 2));
    items.push({ at: [-s.L / 2 + t * s.L, y, z], rot: [rand() * 3, rand() * 3, 0] });
  }
  return scatter(parent, seedGeo(), phys(color, { rough: 0.6 }), items, name);
}
function buildLoaf(parent, kind, { t0 = 0, t1 = 1, at = [0, 0, 0], rotY = 0, name = 'loaf', seeds, flour, rand }) {
  const { s: s0, cols: c0 } = BREADS[kind];
  const cols = { ...c0, flour: flour ?? c0.flour };
  const s = s0;
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const L = loafGeo(s, t0, t1);
  paintCrust(L.geo, s, cols);
  mesh(L.geo, crustMat(cols), { parent: g, name: `${name}_crust` });
  if (t0 > 0) crumbFace(g, L.ring(t0), L.x(t0), -1, s, cols, `${kind}:a`, `${name}_face0`);
  if (t1 < 1) crumbFace(g, L.ring(t1), L.x(t1), 1, s, cols, `${kind}:b`, `${name}_face1`);
  const sd = seeds ?? cols.seeds;
  if (sd && rand) {
    const sub = group(`${name}_seedgrp`, { parent: g });
    seedsOnTop(sub, s, rand, sd, Math.round(60 + s.L * s.w * 9000), `${name}_seeds`);
    // drop seeds outside [t0, t1]
    const im = sub.children[0];
    const m = new THREE.Matrix4(), p = new THREE.Vector3();
    let k = 0;
    for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m); p.setFromMatrixPosition(m); const t = (p.x + s.L / 2) / s.L; if (t >= t0 + 0.02 && t <= t1 - 0.02) im.setMatrixAt(k++, m); }
    im.count = Math.max(1, k);
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingBox?.(); im.computeBoundingSphere?.();
  }
  return g;
}
function slicePiece(parent, kind, t0, t1, { at, rotY = 0, name }) {
  const { s, cols } = BREADS[kind];
  const holder = group(name, { parent, at, rot: [0, rotY, 0] });
  const g = group(`${name}_r`, { parent: holder });
  const L = loafGeo(s, t0, t1, { seg: 2 });
  paintCrust(L.geo, s, cols);
  mesh(L.geo, crustMat(cols), { parent: g, name: `${name}_crust` });
  crumbFace(g, L.ring(t0), L.x(t0), -1, s, cols, `${kind}:a`, `${name}_f0`);
  crumbFace(g, L.ring(t1), L.x(t1), 1, s, cols, `${kind}:b`, `${name}_f1`);
  // lay the slice face-down
  const xm = (L.x(t0) + L.x(t1)) / 2, th = L.x(t1) - L.x(t0);
  holder.remove(g);
  const wrap = group(`${name}_lay`, { parent: holder, at: [-s.h / 2, th / 2, 0], rot: [0, 0, -PI / 2] });
  wrap.add(g);
  g.position.set(-xm, 0, 0);
  return holder;
}
function knife(parent, at, rotY = 0) {
  const g = group('knife', { parent, at, rot: [0, rotY, 0] });
  mesh(roundedBox(0.2, 0.002, 0.026, 0.0008), metalMat('#d8dce0'), { parent: g, at: [0, 0.006, 0], name: 'blade' });
  mesh(roundedBox(0.11, 0.016, 0.022, 0.006), woodMat('#5a3a22'), { parent: g, at: [0.15, 0.008, 0], name: 'knife_handle' });
  // serrations as a thin darker strip
  mesh(roundedBox(0.19, 0.0022, 0.003, 0.0008), metalMat('#a8acb0'), { parent: g, at: [0, 0.006, -0.012], name: 'serration' });
  return g;
}
function basket(parent, r = 0.17, h = 0.07) {
  const b = bowl(parent, { r, h, mat: woodMat('#b8864a', { rough: 0.85 }), wall: 0.006, foot: false, flare: 1.4 });
  // woven bands
  for (let i = 1; i < 4; i++) { const y = (h * i) / 4; mesh(new THREE.TorusGeometry(b.inner(y) + 0.0058, 0.0025, 4, 48).rotateX(PI / 2), woodMat('#9a6a32', { rough: 0.9 }), { parent, at: [0, y, 0], name: `weave${i}` }); }
  mesh(cushion(r * 1.2, 0.004, r * 1.2, { radius: 0.0018, bulge: 0.2 }), phys('#e8e2d6', { rough: 1, sheen: 0.6, name: 'cloth' }), { parent, at: [0, b.floor + 0.002, 0], name: 'cloth' });
  return b.floor + 0.004;
}

/* ------------------------------------------------------------ bread factory */
export const BREAD_VARIANTS = Object.fromEntries(Object.keys(BREADS).map((k) => [k, {}]));
export const createBread = make('bread', BREAD_VARIANTS, (ctx) => {
  const { variant: kind, trim, root, rand } = ctx;
  const { s } = BREADS[kind];
  const seeds = trim === 'seeded' ? (kind === 'rye' ? '#3a2a1a' : kind === 'baguette' || kind === 'bun' || kind === 'challah' ? '#f6ecd0' : '#2a2a2a') : undefined;
  const flour = trim === 'floured' ? 1 : undefined;
  if (trim === 'sliced') {
    const top = board(root, { w: s.L + 0.2, d: Math.max(0.22, s.w + 0.08) });
    const g = group('on_board', { parent: root, at: [-0.04, top, 0] });
    buildLoaf(g, kind, { t1: 0.6, rand, at: [-0.02, 0, 0], name: 'loaf' });
    const th = kind === 'baguette' ? 0.03 / s.L : 0.014 / s.L;
    for (let i = 0; i < 3; i++) slicePiece(g, kind, 0.62 + i * th * 1.05, 0.62 + i * th * 1.05 + th, { at: [s.L * 0.15 + 0.03 + i * (s.h * 0.35), 0.0, (i - 1) * 0.012], rotY: 0.1 * i, name: `slice${i}` });
    if (kind === 'baguette') g.position.x = -0.02;
    knife(root, [0.02, top, s.w / 2 + 0.05], 0.15);
    return;
  }
  if (trim === 'half') {
    buildLoaf(root, kind, { t1: 0.5, rand, name: 'half' });
    buildLoaf(root, kind, { t0: 0.5, rand, at: [0.05 + Math.min(0.08, s.L * 0.2), 0, s.w * 0.8], rotY: 0.6, name: 'other' });
    return;
  }
  if (trim === 'on-board') {
    const top = board(root, { w: s.L + 0.12, d: Math.max(0.2, s.w + 0.1), round: kind === 'sourdough' || kind === 'roll' || kind === 'bun' || kind === 'pita' });
    const g = group('on_board', { parent: root, at: [0, top, 0] });
    if (kind === 'roll' || kind === 'bun') { for (let i = 0; i < 3; i++) buildLoaf(g, kind, { at: [Math.cos(i * 2.1) * 0.055, 0, Math.sin(i * 2.1) * 0.055], rotY: i, rand, name: `roll${i}` }); }
    else buildLoaf(g, kind, { rand, name: 'loaf' });
    knife(root, [0, top, Math.max(0.2, s.w + 0.1) / 2 + 0.03], 0);
    return;
  }
  if (trim === 'in-basket') {
    const y = basket(root, Math.max(0.14, Math.min(0.2, s.L * 0.5)), 0.07);
    if (kind === 'baguette') { for (let i = 0; i < 3; i++) { const g = buildLoaf(root, kind, { at: [0, y + 0.03 + i * 0.02, (i - 1) * 0.05], rotY: (i - 1) * 0.2, rand, name: `loaf${i}` }); g.rotation.z = 0.35; g.scale.setScalar(0.7); } }
    else if (s.L < 0.15) { for (let i = 0; i < 5; i++) buildLoaf(root, kind, { at: [Math.cos(i * 1.26) * 0.06 * (i ? 1 : 0), y, Math.sin(i * 1.26) * 0.06 * (i ? 1 : 0)], rotY: i, rand, name: `roll${i}` }); }
    else { const g = buildLoaf(root, kind, { at: [0, y, 0], rand, name: 'loaf' }); g.scale.setScalar(Math.min(1, 0.26 / s.L)); }
    return;
  }
  const g = buildLoaf(root, kind, { rand, seeds, flour, name: 'loaf' });
  if (kind === 'challah') braidDetail(g, s);
  if (kind === 'focaccia') {
    const items = []; for (let i = 0; i < 18; i++) items.push({ at: [(rand() - 0.5) * s.L * 0.8, s.h - 0.002, (rand() - 0.5) * s.w * 0.75], rot: [0, rand() * 3, 0] });
    scatter(g, cached('olive', () => new THREE.SphereGeometry(0.006, 10, 6).scale(1.2, 0.6, 1)), glaze('#2a2a1e'), items.slice(0, 9), 'olives');
    scatter(g, leafGeo(0.014, 0.0025, { cup: 0, curl: 0 }), leafy('#3a5a2a'), items.slice(9).map((q) => ({ ...q, at: [q.at[0], q.at[1] + 0.001, q.at[2]] })), 'rosemary');
  }
});
function braidDetail(g, s) {
  // braid grooves as glossy ropes along the top
  const m = gloss('#8a4416', { rough: 0.35 });
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i <= 24; i++) { const t = 0.08 + (i / 24) * 0.84; const x = -s.L / 2 + t * s.L; const e = Math.pow(1 - Math.abs(2 * t - 1) ** 2, 0.6); pts.push([x, s.h * 0.62 * e + Math.cos(t * 26 + k * 2.1) * 0.012 * e, Math.sin(t * 26 + k * 2.1) * s.w * 0.28 * e]); }
    curveTube(pts, s.h * 0.3, m, { parent: g, segments: 80, radialSegments: 10, name: `strand${k}` });
  }
}

/* ------------------------------------------------------------ pastry */
function croissant(parent, { at = [0, 0, 0], rotY = 0, s = 1, name = 'croissant', choc = false, almond = false, filled = false, bites, rand }) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; const a = -1.15 + t * 2.3; pts.push([Math.sin(a) * 0.075 * s, 0, (1 - Math.cos(a)) * -0.05 * s]); }
  const R = (t) => 0.03 * s * (0.25 + 0.75 * Math.pow(Math.sin(t * PI), 0.9));
  const ridge = (a, t) => 1 + 0.12 * Math.pow(Math.abs(Math.sin(t * PI * 7)), 0.5);
  const geo = sweep(pts, { r: R, ring: ridge, ell: [1, 0.78], seg: 70, sides: 22 });
  const uv = geo.attributes.uv;
  const top = C('#9a4a14'), mid = C('#c8762a'), pale = C('#e8b870');
  vcolor(geo, (x, y, z, c, i) => { const t = uv.getX(i); const band = Math.abs(Math.sin(t * PI * 7)); c.copy(pale).lerp(mid, band).lerp(top, Math.max(0, y / (0.03 * s)) * 0.8 * band); c.multiplyScalar(0.9 + fbm(x * 90, y * 90, z * 90) * 0.2); });
  if (bites) { /* bitten end: shorten by hiding verts */ const p = geo.attributes.position; for (let i = 0; i < p.count; i++) if (uv.getX(i) > 0.82) { const k = 0.82 * 10; void k; p.setXYZ(i, p.getX(i) * 0.94, p.getY(i), p.getZ(i)); } geo.computeVertexNormals(); }
  const m = mesh(geo, gloss('#fff', { vc: true, rough: 0.35, cc: 0.7 }), { parent: g, at: [0, 0.03 * s * 0.78 * 0.95, 0], name: `${name}_body` });
  void m;
  if (choc) { const half = sweep(pts.slice(2, 9), { r: (t) => 0.03 * s * (0.6 + 0.4 * Math.sin(t * PI)) * 1.04, ring: ridge, ell: [1, 0.78], seg: 40, sides: 22 }); const p = half.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, p.getY(i) * 0.05); half.computeVertexNormals(); mesh(half, glaze('#3a1e10'), { parent: g, at: [0, 0.03 * s * 0.78 * 0.95, 0], name: `${name}_choc` }); }
  if (almond && rand) { const items = []; for (let i = 0; i < 28; i++) { const t = 0.15 + rand() * 0.7; const a = -1.15 + t * 2.3; items.push({ at: [Math.sin(a) * 0.075 * s + (rand() - 0.5) * 0.02, 0.03 * s * 1.45 * Math.sin(t * PI) ** 0.9, (1 - Math.cos(a)) * -0.05 * s + (rand() - 0.5) * 0.02], rot: [rand() * 0.6, rand() * 3, rand() * 0.6] }); } scatter(g, cached('almondflake', () => new THREE.CylinderGeometry(0.006, 0.006, 0.0012, 10).scale(1.4, 1, 0.8)), phys('#f0d8a8', { rough: 0.6 }), items, `${name}_almonds`); }
  if (filled) { mesh(roundedBox(0.09 * s, 0.008, 0.035 * s, 0.003), phys('#e88a8a', { rough: 0.5, cc: 0.3 }), { parent: g, at: [0, 0.022 * s, -0.045 * s * 0.6], name: `${name}_ham` }); mesh(roundedBox(0.085 * s, 0.004, 0.04 * s, 0.0015), phys('#f6d04a', { rough: 0.4 }), { parent: g, at: [0, 0.028 * s, -0.045 * s * 0.6], name: `${name}_cheese` }); }
  return g;
}
function bagel(parent, { at = [0, 0, 0], topping = 'plain', name = 'bagel', rand, halfOpen = false, spread, salmon, blue = false }) {
  const g = group(name, { parent, at });
  const geo = new THREE.TorusGeometry(0.038, 0.02, 20, 40);
  geo.rotateX(PI / 2); geo.scale(1, 0.8, 1);
  vcolor(geo, (x, y, z, c) => { c.set(y > 0 ? '#a8602a' : '#d8a868').lerp(C('#c8803a'), 0.3 + fbm(x * 60, y * 60, z * 60) * 0.4); if (blue && fbm(x * 200, y * 200, z * 200) > 0.66) c.set('#3a2a5a'); });
  if (halfOpen) {
    // two halves cut-side up
    for (const [i, dx] of [[0, -0.05], [1, 0.05]]) {
      const half = new THREE.TorusGeometry(0.038, 0.02, 20, 40, TAU); half.rotateX(PI / 2); half.scale(1, 0.4, 1);
      const p = half.attributes.position; for (let k = 0; k < p.count; k++) if (p.getY(k) > 0) p.setY(k, 0.0005); half.computeVertexNormals();
      vcolor(half, (x, y, z, c) => c.set(y > 0.0003 ? '#f4e2c0' : '#a8602a').multiplyScalar(0.9 + fbm(x * 90, 1, z * 90) * 0.2));
      const hg = group(`${name}_h${i}`, { parent: g, at: [dx, 0.008, 0] });
      mesh(half, crust('#fff', { vc: true }), { parent: hg, rot: [PI, 0, 0], name: `${name}_half${i}` });
      if (spread) mesh(new THREE.RingGeometry(0.02, 0.056, 40).rotateX(-PI / 2), cream(spread), { parent: hg, at: [0, 0.0015, 0], name: `${name}_spread${i}` });
      if (spread) mesh(new THREE.TorusGeometry(0.038, 0.017, 8, 40).rotateX(PI / 2).scale(1, 0.12, 1), cream(spread), { parent: hg, at: [0, 0.0015, 0], name: `${name}_spreadb${i}` });
      if (salmon && i === 0) for (let k = 0; k < 3; k++) mesh(cushion(0.05, 0.004, 0.024, { radius: 0.0018 }), flesh('#f2805a', { rough: 0.35 }), { parent: hg, at: [Math.cos(k * 2.1) * 0.02, 0.005, Math.sin(k * 2.1) * 0.02], rot: [0, k * 2.1, 0.05], name: `${name}_salmon${k}` });
    }
    return g;
  }
  mesh(geo, gloss('#fff', { vc: true, rough: 0.45, cc: 0.5 }), { parent: g, at: [0, 0.016, 0], name: `${name}_body` });
  if (topping !== 'plain' && rand) {
    const cols = { sesame: ['#f2e2b8'], poppy: ['#1e1e24'], everything: ['#f2e2b8', '#1e1e24', '#e8dcc0', '#8a5a2a'], salt: ['#ffffff'] }[topping];
    const items = [];
    for (let i = 0; i < 160; i++) { const u = rand() * TAU, v = rand() * PI * 0.8 + PI * 0.1; const rr = 0.038 + Math.cos(v) * 0.02; items.push({ at: [Math.cos(u) * rr, 0.016 + Math.sin(v) * 0.016 + 0.0008, Math.sin(u) * rr], rot: [rand() * 3, rand() * 3, 0], color: cols[i % cols.length] }); }
    scatter(g, seedGeo(), phys('#ffffff', { rough: 0.6 }), items, `${name}_seeds`);
  }
  return g;
}
function pretzel(parent, { at = [0, 0, 0], s = 1, topping = 'salt', name = 'pretzel', rand }) {
  const g = group(name, { parent, at });
  const k = 0.06 * s;
  const P = (x, z, y = 0) => [x * k, y * k, z * k];
  const pts = [P(-0.2, 1.0), P(-0.9, 0.7), P(-1.05, 0.0), P(-0.7, -0.6), P(0, -0.65, 0.12), P(0.7, -0.6), P(1.05, 0.0), P(0.9, 0.7), P(0.2, 1.0), P(-0.15, 0.2, 0.18), P(0.15, -0.2, 0.0), P(0.18, -0.95), P(-0.18, -0.95)];
  const pts2 = [P(-0.2, 1.0), P(0.15, 0.2, 0.0), P(-0.15, -0.2, 0.18), P(-0.18, -0.95)];
  const r = 0.0115 * s;
  const geoA = sweep(pts.slice(0, 9).concat([P(0.15, 0.2, 0.18), P(-0.15, -0.2, 0), P(-0.2, -0.95)]), { r: (t) => r * (0.75 + 0.35 * Math.sin(t * PI)), seg: 90, sides: 14 });
  const geoB = sweep([P(0.2, 1.0), P(0.0, 0.7, 0.05), P(-0.15, 0.2, 0.0), P(0.15, -0.2, 0.18), P(0.2, -0.95)], { r: () => r * 0.8, seg: 30, sides: 14 });
  const paint = (geo) => vcolor(geo, (x, y, z, c) => c.set('#6a2e0e').lerp(C('#9a4a1a'), fbm(x * 80, y * 80, z * 80)).lerp(C('#c88a4a'), y < r * 0.4 ? 0.4 : 0));
  const mat = glaze('#fff', { vc: true, rough: 0.25, cc: 0.9 });
  mesh(paint(geoA), mat, { parent: g, at: [0, r, 0], name: `${name}_loop` });
  mesh(paint(geoB), mat, { parent: g, at: [0, r, 0], name: `${name}_twist` });
  void pts2;
  if (rand && topping !== 'plain') {
    const items = [];
    const src = geoA.attributes.position;
    for (let i = 0; i < (topping === 'salt' ? 40 : 120); i++) { const j = Math.floor(rand() * src.count); const y = src.getY(j); if (y < r * 0.6) continue; items.push({ at: [src.getX(j), src.getY(j) + r + 0.0008, src.getZ(j)], rot: [rand() * 3, rand() * 3, rand() * 3], scale: topping === 'salt' ? 1 : 0.5 }); }
    scatter(g, cached('salt', () => new THREE.BoxGeometry(0.0028, 0.0022, 0.0026)), phys(topping === 'cinnamon' ? '#c88a5a' : '#ffffff', { rough: 0.3, cc: 0.6 }), items, `${name}_crystals`);
  }
  if (topping === 'chocolate') { const half = sweep(pts.slice(1, 8), { r: () => r * 1.06, seg: 50, sides: 14 }); const p = half.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, p.getY(i) * 0.2); half.computeVertexNormals(); mesh(half, glaze('#3a1e10'), { parent: g, at: [0, r, 0], name: `${name}_choc` }); }
  return g;
}
function cinnamonRoll(parent, { at = [0, 0, 0], icing = true, pecan = false, name = 'roll', rand }) {
  const g = group(name, { parent, at });
  const outer = [], inner = [];
  for (let i = 0; i <= 90; i++) { const t = i / 90; const a = t * TAU * 3.1; const r = 0.006 + t * 0.04; outer.push([Math.cos(a) * (r + 0.0042), Math.sin(a) * (r + 0.0042)]); inner.push([Math.cos(a) * Math.max(0.001, r - 0.0042), Math.sin(a) * Math.max(0.001, r - 0.0042)]); }
  const geo = extrudeOutline([...outer, ...inner.reverse()], 0.046, { bevel: 0.0015, segments: 2 });
  geo.rotateX(-PI / 2);
  vcolor(geo, (x, y, z, c) => c.set('#d89a52').lerp(C('#8a4a1e'), Math.max(0, fbm(x * 80, y * 80, z * 80) - 0.35) * 2).lerp(C('#7a3a12'), y > 0.02 ? 0.35 : 0));
  mesh(geo, gloss('#fff', { vc: true, rough: 0.4 }), { parent: g, at: [0, 0.03, 0], name: `${name}_spiral` });
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.004, 32), crust('#b8702e'), { parent: g, at: [0, 0.006, 0], name: `${name}_base` });
  if (icing) { const ip = []; for (let i = 0; i <= 60; i++) { const t = i / 60; const a = t * TAU * 2.4; ip.push([Math.cos(a) * 0.04 * (1 - t * 0.6), 0.055 + Math.sin(t * 30) * 0.001, Math.sin(a) * 0.04 * (1 - t * 0.6)]); } curveTube(ip, 0.0035, cream('#fbf6ec', { rough: 0.3, cc: 0.5 }), { parent: g, segments: 120, radialSegments: 6, name: `${name}_icing` }); mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.003, 24), cream('#fbf6ec', { rough: 0.3 }), { parent: g, at: [0, 0.0555, 0], name: `${name}_pool` }); }
  if (pecan && rand) { const items = []; for (let i = 0; i < 10; i++) { const a = rand() * TAU, d = rand() * 0.035; items.push({ at: [Math.cos(a) * d, 0.058, Math.sin(a) * d], rot: [0, rand() * 3, 0] }); } scatter(g, cached('pecan', () => jitter(new THREE.SphereGeometry(0.007, 10, 6).scale(1.5, 0.5, 0.8), rand, 0.12)), glaze('#5a2a10'), items, `${name}_pecans`); mesh(new THREE.CylinderGeometry(0.045, 0.047, 0.003, 24), glaze('#7a3a10'), { parent: g, at: [0, 0.0555, 0], name: `${name}_caramel` }); }
  return g;
}
function eclair(parent, { at = [0, 0, 0], rotY = 0, glazeCol = '#3a1e10', name = 'eclair', stripe }) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const L = 0.13, R = 0.016;
  const body = sweep([[-L / 2, 0, 0], [L / 2, 0, 0]], { r: (t) => R * Math.pow(Math.sin(Math.max(0.02, Math.min(0.98, t)) * PI), 0.25), ell: [1, 0.85], seg: 30, sides: 20 });
  vcolor(body, (x, y, z, c) => c.set('#d8964a').lerp(C('#a8601e'), fbm(x * 70, y * 70, z * 70) * 0.7));
  mesh(body, crust('#fff', { vc: true }), { parent: g, at: [0, R * 0.85, 0], name: `${name}_shell` });
  const top = sweep([[-L / 2 + 0.006, 0, 0], [L / 2 - 0.006, 0, 0]], { r: (t) => R * 1.06 * Math.pow(Math.sin(Math.max(0.02, Math.min(0.98, t)) * PI), 0.25), ell: [1, 0.85], seg: 30, sides: 20 });
  const p = top.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < R * 0.25) p.setY(i, R * 0.25 + (p.getY(i) - R * 0.25) * 0.02); top.computeVertexNormals();
  mesh(top, glaze(glazeCol), { parent: g, at: [0, R * 0.85, 0], name: `${name}_glaze` });
  if (stripe) for (let i = 0; i < 5; i++) curveTube([[-0.05 + i * 0.024, R * 1.6, -0.009], [-0.045 + i * 0.024, R * 1.76, 0], [-0.04 + i * 0.024, R * 1.6, 0.009]], 0.0012, glaze(stripe), { parent: g, segments: 8, radialSegments: 5, name: `${name}_drizzle${i}` });
  return g;
}
const MACARON = { pistachio: ['#b8d890', '#f2f0d0'], raspberry: ['#f07090', '#c81e4a'], lemon: ['#f6e070', '#fff4b0'], chocolate: ['#6a3a22', '#3a1e10'], vanilla: ['#f6eedc', '#fff8ea'], lavender: ['#c8b0e8', '#f2eaf6'], coffee: ['#b8885a', '#7a4a2a'], mint: ['#a8e8d0', '#f2fff6'] };
function macaron(parent, { at = [0, 0, 0], flavour = 'raspberry', rot = [0, 0, 0], name = 'macaron' }) {
  const [shellC, fillC] = MACARON[flavour];
  const g = group(name, { parent, at, rot });
  const shell = lathe([[0, 0], [0.019, 0], [0.0205, 0.002], [0.02, 0.006], [0.016, 0.009], [0.008, 0.0105], [0, 0.011]], 32);
  const foot = new THREE.TorusGeometry(0.0195, 0.0016, 6, 36).rotateX(PI / 2);
  const sm = phys(shellC, { rough: 0.45, sheen: 0.4 });
  const fm = phys(shellC, { rough: 0.95, flat: true });
  mesh(shell.clone().scale(1, -1, 1), sm, { parent: g, at: [0, 0.011, 0], name: `${name}_bottom` });
  mesh(foot, fm, { parent: g, at: [0, 0.011, 0], name: `${name}_foot0` });
  mesh(new THREE.CylinderGeometry(0.0175, 0.0175, 0.006, 28), cream(fillC), { parent: g, at: [0, 0.015, 0], name: `${name}_filling` });
  mesh(foot, fm, { parent: g, at: [0, 0.019, 0], name: `${name}_foot1` });
  mesh(shell, sm, { parent: g, at: [0, 0.019, 0], name: `${name}_top` });
  return g;
}
function waffle(parent, { at = [0, 0, 0], topping, name = 'waffle', rand, belgian = true }) {
  const g = group(name, { parent, at });
  const W = belgian ? 0.12 : 0.1, T = belgian ? 0.026 : 0.012;
  const base = new THREE.CylinderGeometry(W / 2, W / 2, T * 0.45, 40);
  vcolor(base, (x, y, z, c) => c.set('#c8862e').multiplyScalar(0.9 + fbm(x * 60, y * 60, z * 60) * 0.2));
  mesh(base, crust('#fff', { vc: true }), { parent: g, at: [0, T * 0.225, 0], name: `${name}_base` });
  const n = belgian ? 5 : 7, cell = W / n;
  const grid = [];
  for (let i = 0; i <= n; i++) {
    const x = -W / 2 + i * cell;
    const half = Math.sqrt(Math.max(0, (W / 2) ** 2 - x * x));
    if (half < 0.004) continue;
    grid.push({ at: [x, T * 0.45 + T * 0.275, 0], scale: [1, 1, (half * 2) / W] });
    grid.push({ at: [0, T * 0.45 + T * 0.275, x], scale: [(half * 2) / W, 1, 1], rot: [0, PI / 2, 0] });
  }
  scatter(g, cached(`wgrid${W}${T}`, () => roundedBox(0.008, T * 0.55, W, 0.003, 2)), crust('#d8964a'), grid.map((q) => ({ ...q, scale: q.rot ? [1, 1, q.scale[0]] : q.scale })), `${name}_grid`);
  const top = T;
  if (topping === 'berries' && rand) { const items = []; for (let i = 0; i < 14; i++) items.push({ at: [(rand() - 0.5) * W * 0.6, top + 0.004, (rand() - 0.5) * W * 0.6] }); scatter(g, cached('wberry', () => new THREE.SphereGeometry(0.006, 10, 8)), phys('#2e3a6a', { rough: 0.5, sheen: 1, sheenColor: '#9aa8d0' }), items, `${name}_berries`); mesh(new THREE.ConeGeometry(0.012, 0.022, 8).rotateX(PI), phys('#d81e2a', { rough: 0.3, cc: 0.8 }), { parent: g, at: [0.01, top + 0.012, 0.01], name: `${name}_straw` }); }
  if (topping === 'syrup' || topping === 'chocolate') { const geo = new THREE.CylinderGeometry(W * 0.32, W * 0.36, 0.002, 32); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 + 0.25 * Math.sin(a * 5); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } mesh(geo, glaze(topping === 'syrup' ? '#a8501a' : '#3a1e10', { opacity: 0.95, transparent: true }), { parent: g, at: [0, top + 0.001, 0], name: `${name}_syrup` }); mesh(roundedBox(0.022, 0.012, 0.018, 0.004), cream('#f8e08a'), { parent: g, at: [0, top + 0.008, 0], name: `${name}_butter` }); }
  if (topping === 'cream') { swirlCream(g, [0, top, 0], 0.025, 0.035, '#fffaf2', `${name}_cream`); mesh(new THREE.ConeGeometry(0.012, 0.022, 8).rotateX(PI), phys('#d81e2a', { rough: 0.3, cc: 0.8 }), { parent: g, at: [0.0, top + 0.045, 0.0], name: `${name}_straw` }); }
  return g;
}
export function swirlCream(parent, at, r, h, color, name, { star = true, turns = 3 } = {}) {
  const pts = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60; const a = t * TAU * turns; const rr = r * (1 - t * 0.85); pts.push([at[0] + Math.cos(a) * rr, at[1] + r * 0.32 + t * (h - r * 0.4), at[2] + Math.sin(a) * rr]); }
  const geo = sweep(pts, { r: (t) => r * 0.38 * (1 - t * 0.6), ring: star ? (a) => 1 + 0.16 * Math.cos(a * 8) : () => 1, seg: 120, sides: 24 });
  return mesh(geo, cream(color), { parent, name });
}
function churro(parent, { at = [0, 0, 0], rotY = 0, name = 'churro', L = 0.16, sugar = true }) {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const geo = sweep([[-L / 2, 0, 0], [0, 0.006, 0.01], [L / 2, 0, 0]], { r: (t) => 0.009 * (t < 0.04 || t > 0.96 ? 0.85 : 1), ring: (a) => 1 + 0.18 * Math.cos(a * 6), seg: 30, sides: 30 });
  vcolor(geo, (x, y, z, c) => { c.set('#b8702a').lerp(C('#8a4a1a'), fbm(x * 80, y * 80, z * 80) * 0.6); if (sugar && fbm(x * 400, y * 400, z * 400) > 0.55) c.lerp(C('#f4e6d0'), 0.6); });
  mesh(geo, crust('#fff', { vc: true }), { parent: g, at: [0, 0.009, 0], name: `${name}_body` });
  return g;
}

/* ------------------------------------------------------------ pastry factory */
export const PASTRY_VARIANTS = { croissant: {}, 'pain-au-chocolat': {}, bagel: {}, pretzel: {}, 'cinnamon-roll': {}, danish: {}, eclair: {}, macaron: {}, waffle: {}, churro: {}, scone: {} };
export const createPastry = make('pastry', PASTRY_VARIANTS, (ctx) => {
  const { variant, trim, root, rand } = ctx;
  const onPlate = trim === 'on-plate';
  let base = root, y0 = 0;
  if (onPlate) { y0 = plate(root, { r: 0.12 }).top; base = group('on_plate', { parent: root, at: [0, y0, 0] }); }
  switch (variant) {
    case 'croissant':
      if (trim === 'mini') { for (let i = 0; i < 3; i++) croissant(root, { at: [(i - 1) * 0.06, 0, (i % 2) * 0.03], rotY: i * 0.8, s: 0.55, name: `mini${i}` }); break; }
      croissant(base, { choc: trim === 'chocolate-dipped', almond: trim === 'almond', filled: trim === 'ham-cheese', rand });
      if (trim === 'almond') { const g = base.children[0]; g.traverse((o) => { if (o.name === 'croissant_body') o.material.color.set('#fff8f0'); }); }
      break;
    case 'pain-au-chocolat': {
      const one = (parent, at, rotY, name) => {
        const g = group(name, { parent, at, rot: [0, rotY, 0] });
        const geo = cushion(0.11, 0.035, 0.07, { radius: 0.014, bulge: 0.35 });
        vcolor(geo, (x, y, z, c) => { const band = Math.abs(Math.sin(z * 120)); c.set('#e0aa60').lerp(C('#a8561e'), Math.max(0, y / 0.0175) * band * 0.9); });
        mesh(geo, gloss('#fff', { vc: true, rough: 0.35, cc: 0.7 }), { parent: g, at: [0, 0.0175, 0], name: `${name}_body` });
        for (const z of [-0.012, 0.012]) for (const s of [-1, 1]) mesh(roundedBox(0.006, 0.006, 0.014, 0.002), glaze('#3a1e10'), { parent: g, at: [s * 0.054, 0.016, z], name: `${name}_bar${z > 0 ? 'a' : 'b'}${s}` });
        if (trim === 'powdered') { mesh(cushion(0.1, 0.004, 0.06, { radius: 0.0018 }), phys('#ffffff', { rough: 1 }), { parent: g, at: [0, 0.035, 0], name: `${name}_sugar` }); }
        return g;
      };
      if (trim === 'pair') { one(root, [0, 0, -0.04], 0.1, 'p1'); one(root, [0, 0, 0.04], -0.1, 'p2'); }
      else one(base, [0, 0, 0], 0, 'pain');
      break;
    }
    case 'bagel': {
      const top = { sesame: 'sesame', poppy: 'poppy', everything: 'everything' }[trim] ?? 'plain';
      if (trim === 'cream-cheese') bagel(base, { halfOpen: true, spread: '#fbf8f0', rand });
      else if (trim === 'salmon') bagel(base, { halfOpen: true, spread: '#fbf8f0', salmon: true, rand });
      else if (trim === 'pile') { bagel(root, { at: [-0.045, 0, 0], topping: 'sesame', rand, name: 'b1' }); bagel(root, { at: [0.045, 0, 0], topping: 'poppy', rand, name: 'b2' }); bagel(root, { at: [0, 0.028, 0], topping: 'everything', rand, name: 'b3' }); }
      else bagel(base, { topping: top, rand, blue: trim === 'blueberry' });
      break;
    }
    case 'pretzel':
      if (trim === 'bites') { const b = bowl(root, { r: 0.07, h: 0.04, mat: paperMat('#f2e8d6'), wall: 0.002 }); for (let i = 0; i < 9; i++) { const a = i * 2.4; const g = group(`bite${i}`, { parent: root, at: [Math.cos(a) * 0.035 * (i ? 1 : 0), b.floor + (i > 6 ? 0.02 : 0), Math.sin(a) * 0.035 * (i ? 1 : 0)] }); const geo = sweep([[-0.014, 0, 0], [0.014, 0, 0]], { r: (t) => 0.011 * Math.pow(Math.sin(Math.max(0.03, Math.min(0.97, t)) * PI), 0.3), seg: 10, sides: 14 }); mesh(geo, glaze('#7a3612'), { parent: g, at: [0, 0.01, 0], name: `bite${i}_b` }); } break; }
      if (trim === 'on-paper') { mesh(roundedBox(0.2, 0.002, 0.18, 0.0008), paperMat('#f6f0e2'), { parent: root, at: [0, 0.001, 0], name: 'paper' }); pretzel(root, { at: [0, 0.002, 0], rand }); break; }
      pretzel(base, { topping: trim === 'cinnamon-sugar' ? 'cinnamon' : trim === 'chocolate' ? 'chocolate' : 'salt', rand, s: trim === 'mini' ? 0.6 : 1 });
      break;
    case 'cinnamon-roll':
      if (trim === 'tray') { mesh(roundedBox(0.24, 0.03, 0.24, 0.006), metalMat('#b8bcc0'), { parent: root, at: [0, 0.015, 0], name: 'tray' }); for (let i = 0; i < 4; i++) cinnamonRoll(root, { at: [(i % 2 - 0.5) * 0.105, 0.028, (Math.floor(i / 2) - 0.5) * 0.105], name: `roll${i}`, rand }); break; }
      cinnamonRoll(base, { icing: trim !== 'plain', pecan: trim === 'pecan', rand });
      break;
    case 'danish': {
      const fill = { cherry: '#a8102a', apricot: '#f2902a', custard: '#f6d24a', blueberry: '#3a2a6a', apple: '#d8a84a' }[trim ?? 'cherry'] ?? '#a8102a';
      const g = group('danish', { parent: base });
      const geo = cushion(0.1, 0.022, 0.1, { radius: 0.03, bulge: 0.4 });
      const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 + 0.12 * Math.cos(a * 4); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
      geo.computeVertexNormals();
      vcolor(geo, (x, y, z, c) => c.set('#e0a85a').lerp(C('#9a4a14'), Math.max(0, y / 0.011) * (0.5 + fbm(x * 60, y * 60, z * 60) * 0.5)));
      mesh(geo, gloss('#fff', { vc: true }), { parent: g, at: [0, 0.011, 0], name: 'pastry' });
      mesh(new THREE.SphereGeometry(0.024, 24, 10, 0, TAU, 0, PI / 2).scale(1, 0.32, 1), glaze(fill), { parent: g, at: [0, 0.02, 0], name: 'filling' });
      if (trim === 'blueberry' || trim === 'cherry') scatter(g, cached('dberry', () => new THREE.SphereGeometry(0.0055, 10, 8)), glaze(fill), Array.from({ length: 6 }, (_, i) => ({ at: [Math.cos(i) * 0.012, 0.026, Math.sin(i) * 0.012] })), 'fruit');
      for (let i = 0; i < 4; i++) curveTube([[-0.04, 0.026, -0.03 + i * 0.02], [0, 0.03, -0.025 + i * 0.02], [0.04, 0.026, -0.03 + i * 0.02]], 0.0012, cream('#fbf6ee', { cc: 0.5, rough: 0.3 }), { parent: g, segments: 12, radialSegments: 5, name: `icing${i}` });
      break;
    }
    case 'eclair': {
      const gc = { chocolate: '#3a1e10', vanilla: '#f6ecd6', strawberry: '#f08aa0', coffee: '#9a6a42', pistachio: '#b8d890', caramel: '#c8782a' }[trim ?? 'chocolate'] ?? '#3a1e10';
      if (trim === 'box') { mesh(roundedBox(0.2, 0.012, 0.16, 0.004), paperMat('#f2e6d0'), { parent: root, at: [0, 0.006, 0], name: 'tray' }); ['#3a1e10', '#f6ecd6', '#f08aa0'].forEach((c, i) => eclair(root, { at: [0, 0.012, (i - 1) * 0.045], glazeCol: c, name: `eclair${i}` })); break; }
      eclair(base, { glazeCol: gc, stripe: trim === 'vanilla' ? '#3a1e10' : trim === 'strawberry' ? '#fbf6ee' : null });
      break;
    }
    case 'macaron': {
      if (trim === 'tower') { let y = 0; for (let i = 0; i < 12; i++) { const fl = Object.keys(MACARON)[i % 8]; const ring = Math.floor(i / 4); const a = (i % 4) * PI / 2 + ring * 0.6; const r = 0.032 - ring * 0.012; y = ring * 0.022; macaron(root, { at: [Math.cos(a) * r, y, Math.sin(a) * r], flavour: fl, name: `m${i}` }); } break; }
      if (trim === 'stack') { Object.keys(MACARON).slice(0, 5).forEach((fl, i) => macaron(root, { at: [0, i * 0.021, 0], flavour: fl, rot: [0, i * 0.5, 0], name: `m${i}` })); break; }
      if (trim === 'box') { trayBox(root, 0.22, 0.03, 0.06, plasticMat2(), 0.0015); Object.keys(MACARON).forEach((fl, i) => macaron(root, { at: [-0.088 + i * 0.025, 0.026, 0], flavour: fl, rot: [0, 0, PI / 2], name: `m${i}` })); break; }
      macaron(base, { flavour: MACARON[trim] ? trim : 'raspberry' });
      if (!onPlate && !MACARON[trim]) macaron(root, { at: [0.045, 0, 0.01], flavour: 'pistachio', name: 'm2' });
      break;
    }
    case 'waffle':
      if (trim === 'stack') { for (let i = 0; i < 3; i++) waffle(root, { at: [0, i * 0.026, 0], name: `w${i}`, rand }); waffle(root, { at: [0, 0.078, 0], topping: 'syrup', name: 'wtop', rand }); break; }
      waffle(base, { topping: trim, rand });
      break;
    case 'churro':
      if (trim === 'chocolate-dip') { const b = bowl(root, { r: 0.04, h: 0.035, at: [0.07, 0, 0] }); mesh(new THREE.CircleGeometry(b.inner(0.028), 24).rotateX(-PI / 2), glaze('#3a1e10'), { parent: root, at: [0.07, 0.028, 0], name: 'dip' }); for (let i = 0; i < 3; i++) churro(root, { at: [-0.05, 0, (i - 1) * 0.022], rotY: (i - 1) * 0.1, name: `c${i}` }); break; }
      if (trim === 'cone') { const v = bowl(root, { r: 0.045, h: 0.09, mat: paperMat('#f6efe0'), wall: 0.002, foot: false, flare: 0.6 }); for (let i = 0; i < 4; i++) { const g = churro(root, { at: [Math.cos(i * 1.6) * 0.012, v.floor + 0.075, Math.sin(i * 1.6) * 0.012], name: `c${i}` }); g.rotation.z = PI / 2 - 0.15; } break; }
      for (let i = 0; i < 2; i++) churro(base, { at: [0, 0, (i - 0.5) * 0.022], rotY: (i - 0.5) * 0.2, name: `c${i}`, sugar: trim !== 'plain' });
      break;
    case 'scone': {
      const g = group('scone', { parent: base });
      const geo = jitter(lathe([[0, 0], [0.034, 0], [0.036, 0.01], [0.032, 0.035], [0.02, 0.045], [0, 0.047]], 24), rand, 0.06);
      vcolor(geo, (x, y, z, c) => c.set('#e0b878').lerp(C('#a8662a'), Math.max(0, y / 0.047 - 0.5) * 1.6 * fbm(x * 60, y * 60, z * 60) + 0.1));
      mesh(geo, crust('#fff', { vc: true }), { parent: g, name: 'scone_body' });
      if (trim === 'raisin' || trim === 'blueberry') scatter(g, cached('raisin', () => new THREE.SphereGeometry(0.0035, 8, 6).scale(1, 0.7, 1)), phys(trim === 'raisin' ? '#3a1a10' : '#2e2a5a', { rough: 0.4 }), Array.from({ length: 14 }, (_, i) => { const a = i * 2.4, yy = 0.008 + (i % 5) * 0.007; const r = Math.max(0.006, 0.034 - yy * 0.3); return { at: [Math.cos(a) * r, yy, Math.sin(a) * r] }; }), 'scone_bits');
      if (trim === 'jam-cream') { mesh(new THREE.SphereGeometry(0.024, 16, 8, 0, TAU, 0, PI / 2).scale(1, 0.5, 1), glaze('#a8142a'), { parent: g, at: [0, 0.044, 0], name: 'jam' }); swirlCream(g, [0, 0.05, 0], 0.016, 0.028, '#fffaf0', 'cream', { star: false, turns: 2 }); }
      break;
    }
    default: break;
  }
});
function plasticMat2() { return phys('#f2eef8', { rough: 0.2, cc: 0.6, opacity: 0.45, transparent: true, depthWrite: false, name: 'plastic' }); }
void SPRINKLES; void ballGeo; void flesh;
