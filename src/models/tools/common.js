// Shared helpers for the tools category: trims (palettes + shape flags), per-trim material kits,
// handle styles, hollow boxes, hazard decals, rust vertex colouring and the "settle + finalize" wrapper.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { spinTrack, rotateTrack, moveTrack, scaleTrack, numberTrack, clip, wave, pingPong } from '../../core/animation.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';

export { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng };
export { spinTrack, rotateTrack, moveTrack, scaleTrack, numberTrack, clip, wave, pingPong, lampGroup, lampTracks };

/*
 * Trims. Every tool type uses a subset. Besides the palette (p = body, s = secondary, a = accent)
 * they carry shape flags that the builders read:
 *   rust   → steel and paint get rust blotches, wood turns grey, handles are taped
 *   kids   → toy version: chunky, smaller, all glossy plastic, rounded
 *   heavy  → bigger, thicker, extra reinforcement / guards
 *   grip   → handle style (bi | tape | pro | wood | toy | heavy | dip)
 *   steel  → steel finish (bright | dark | forged | rough | chrome)
 *   set    → workshop set: several pieces in an open case / on a rack
 *   cordless / compact (power tools) → battery packs, smaller bodies
 */
export const TRIMS = {
  rusty: { p: '#9a6a4a', s: '#3a332d', a: '#6b5a48', rust: 0.7, wear: 1, wood: '#8c7d6a', grip: 'tape', steel: 'rough', finish: 'paint' },
  pro: { p: '#f5b301', s: '#17181b', a: '#17181b', steel: 'dark', grip: 'pro', hazard: true, pro: true },
  vintage: { p: '#2f5a44', s: '#5b3a24', a: '#c9a14a', steel: 'forged', wood: 'walnut', grip: 'wood', vintage: true },
  kids: { p: '#ff5436', s: '#2f80ed', a: '#ffd02f', kids: true, scale: 0.62, chunky: 1.45, grip: 'toy' },
  heavy: { p: '#e8650f', s: '#202124', a: '#a6acb3', steel: 'rough', heavy: true, scale: 1.15, chunky: 1.3, grip: 'heavy' },
  chrome: { p: '#1f5fd1', s: '#101114', a: '#d9dde2', steel: 'chrome', grip: 'dip', polished: true },
  stainless: { p: '#c9ced4', s: '#7d848c', a: '#2a6fd1', steel: 'chrome', grip: 'dip', polished: true, stainless: true },
  set: { set: true },
  cordless: { p: '#d2302a', s: '#1b1c1f', a: '#c9ccd1', cordless: true },
  compact: { p: '#22a06b', s: '#1b1c1f', a: '#e8e8e8', cordless: true, compact: true, scale: 0.8 },
};
export const HAND_TRIMS = ['rusty', 'pro', 'vintage', 'kids', 'heavy', 'chrome', 'set'];
export const POWER_TRIMS = ['cordless', 'compact', 'pro', 'heavy', 'vintage', 'kids', 'rusty', 'set'];
export const SHOP_TRIMS = ['rusty', 'pro', 'vintage', 'kids', 'heavy', 'set'];
export const IND_TRIMS = ['rusty', 'pro', 'vintage', 'kids', 'heavy', 'stainless', 'set'];

/** Resolve options → { o, variant, trim, T, V }. base = palette/flags for the untrimmed model. */
export function setup(options, VARIANTS, type, base = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VARIANTS, o.variant, type);
  const trim = o.trim && TRIMS[o.trim] ? o.trim : null;
  const V = VARIANTS[variant] || {};
  const T = { p: '#d1322b', s: '#1c1d20', a: '#e9e9e9', scale: 1, chunky: 1, wear: 0, rust: 0, grip: 'bi', steel: 'bright', wood: '#c49a62', ...base, ...V, ...(trim ? TRIMS[trim] : {}), trim };
  if (trim === 'set') Object.assign(T, { ...base, ...V, set: true, trim });
  if (!trim && o.color) T.p = o.color;
  T.r = rng(`${type}-${variant}-${trim}`);
  return { o, variant, trim, T, V };
}

/* ------------------------------ materials ------------------------------ */

/** Rust-able material: vertex colours are filled in by done() (base colour blotched with rust). */
export function rustMat(base, amount = 0.7, roughness = 0.85) {
  const m = new THREE.MeshStandardMaterial({ name: 'rust', color: 0xffffff, vertexColors: true, roughness, metalness: 0.25 });
  m.userData.rust = { base: M.toColor(base), amount };
  return m;
}
const paintMat = (c, rough = 0.35) => new THREE.MeshPhysicalMaterial({ name: 'paint', color: M.toColor(c), roughness: rough, clearcoat: 0.6, clearcoatRoughness: 0.2 });
const toy = (c) => new THREE.MeshPhysicalMaterial({ name: 'toy', color: M.toColor(c), roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.1 });

/**
 * Material kit for a trim. Keys: steel, chrome, dark, body, body2, accent, grip, grip2, wood, brass,
 * rubber, black, plastic(c), paint(c), glass, alu.
 */
export function kit(T) {
  const k = T.kids, r = T.rust;
  const fade = (c) => M.toColor(c).lerp(new THREE.Color('#b8ad98'), 0.35);
  const paint = (c) => (k ? toy(c) : r ? rustMat(fade(c), r * 0.8, 0.7) : paintMat(c));
  const steelOf = (s) => {
    if (k) return toy('#d4dbe3');
    if (r) return rustMat('#8e9298', r);
    if (s === 'chrome') return M.chrome();
    if (s === 'dark') return M.metal('#3b3f45', 0.42);
    if (s === 'forged') return M.metal('#6f6a62', 0.6);
    if (s === 'rough') return M.metal('#7c8188', 0.5);
    return M.metal('#c3c8ce', 0.28);
  };
  return {
    steel: steelOf(T.steel),
    chrome: k ? toy('#eef1f4') : r ? rustMat('#a7a39b', r * 0.8) : M.chrome(),
    dark: k ? toy(T.s) : r ? rustMat('#4a4744', r) : M.metal('#2c2f33', 0.45),
    alu: k ? toy('#cfd6de') : r ? rustMat('#a9a9a2', r * 0.5, 0.7) : M.metal('#d4d8dc', 0.38),
    body: paint(T.p),
    body2: paint(T.s),
    accent: paint(T.a),
    paint,
    grip: k ? toy(T.a) : r ? M.matte('#2b2622', 0.95) : new THREE.MeshStandardMaterial({ name: 'grip', color: M.toColor(T.s), roughness: 0.88 }),
    grip2: k ? toy(T.s) : r ? M.matte(fade(T.p), 0.9) : new THREE.MeshStandardMaterial({ name: 'grip', color: M.toColor(T.p), roughness: 0.8 }),
    wood: k ? toy(T.s) : r ? M.matte(T.wood, 0.92) : M.wood(T.wood),
    brass: k ? toy(T.a) : r ? rustMat('#7a7a4a', 0.5) : M.metal('#c9a14a', 0.3),
    rubber: k ? toy('#2b2b30') : new THREE.MeshStandardMaterial({ name: 'rubber', color: 0x18181a, roughness: 0.92 }),
    black: k ? toy('#33363b') : M.plastic('#1d1e21', 0.5),
    plastic: (c, rough = 0.45) => (k ? toy(c) : r ? M.matte(fade(c), 0.8) : M.plastic(c, rough)),
    glass: M.glass({ tint: '#9fb8c8', opacity: 0.45 }),
    tape: M.matte('#6d6e70', 0.7),
  };
}

/* ---------------------------- canvas decals ---------------------------- */

export function canvasTex(w, h, draw) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Flat decal (plane facing +Z) with a canvas drawing; plain colour in Node. */
export function decal(parent, w, h, draw, { at = [0, 0, 0], rot = [0, 0, 0], bg = '#f5b301', px = 256, name } = {}) {
  const tex = canvasTex(px, Math.max(16, Math.round((px * h) / w)), draw);
  const mat = new THREE.MeshStandardMaterial({ name: 'decal', color: tex ? '#ffffff' : bg, map: tex, roughness: 0.5 });
  return mesh(new THREE.PlaneGeometry(w, h), mat, { parent, at, rot, name });
}
export const hazardDraw = (ctx, w, h) => {
  ctx.fillStyle = '#f5b301'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#17181b';
  const s = h * 0.9;
  for (let x = -h * 2; x < w + h; x += s * 2) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + s, h); ctx.lineTo(x + s + h, 0); ctx.lineTo(x + h, 0); ctx.fill(); }
};
/** Hazard stripe band. */
export const hazard = (parent, w, h, opts = {}) => decal(parent, w, h, hazardDraw, { ...opts, bg: '#f5b301' });
/** Text label (white text on colour). */
export const textDecal = (parent, w, h, text, { color = '#ffffff', bg = '#17181b', ...opts } = {}) =>
  decal(parent, w, h, (ctx, cw, ch) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = color; ctx.font = `bold ${Math.round(ch * 0.62)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cw / 2, ch / 2);
  }, { ...opts, bg });

/* ------------------------------ geometry ------------------------------ */

export const cyl = (r1, r2, h, seg = 20) => new THREE.CylinderGeometry(r1, r2, h, seg);
export const cylX = (r, h, seg = 20) => new THREE.CylinderGeometry(r, r, h, seg).rotateZ(Math.PI / 2);
export const cylZ = (r, h, seg = 20) => new THREE.CylinderGeometry(r, r, h, seg).rotateX(Math.PI / 2);
export const sphere = (r, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h);
export const torus = (R, r, seg = 24, rs = 8, arc = Math.PI * 2) => new THREE.TorusGeometry(R, r, rs, seg, arc);

/** Ring / washer in XY plane (extruded along Z, centred). */
export function ringGeo(R, r, depth, seg = 32, bevel = 0) {
  const s = new THREE.Shape(); s.absarc(0, 0, R, 0, Math.PI * 2, false);
  const h = new THREE.Path(); h.absarc(0, 0, r, 0, Math.PI * 2, true); s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(1e-4, depth - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: seg });
  g.translate(0, 0, -(depth - 2 * bevel) / 2);
  return g;
}

/** Outline with holes → extruded geometry (XY, depth along Z). holes: arrays of [x,y] or {c:[x,y], r}. */
export function shapeGeo(pts, depth, { holes = [], bevel = 0.002, seg = 2, curve = 12 } = {}) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) {
    const p = new THREE.Path();
    if (h.r) p.absarc(h.c[0], h.c[1], h.r, 0, Math.PI * 2, true);
    else p.setFromPoints(h.map(([x, y]) => new THREE.Vector2(x, y)).reverse());
    s.holes.push(p);
  }
  const b = Math.min(bevel, depth * 0.45);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(1e-4, depth - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: seg, curveSegments: curve });
  g.translate(0, 0, -(depth - 2 * b) / 2);
  g.computeVertexNormals();
  return g;
}

/** Scales a geometry's Z by f(x, y) (wedge blades, tapering heads). */
export function taperZ(geo, f) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * f(p.getX(i), p.getY(i)));
  geo.computeVertexNormals();
  return geo;
}

/** Arc points (2D) around centre c, radius r from angle a0 to a1. */
export function arc(c, r, a0, a1, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
  return out;
}

/** Thick-walled open container: rectangular (seg=4) or round lathe. Profile from floor up. */
export function tub(rBot, rTop, h, t, seg = 4, { lip = 0 } = {}) {
  const pr = [[0, 0], [rBot, 0], [rTop, h]];
  if (lip) pr.push([rTop + lip, h], [rTop + lip, h + t], [rTop - t, h + t]);
  else pr.push([rTop - t, h]);
  pr.push([rBot - t, t], [0, t]);
  const g = lathe(pr, seg);
  if (seg === 4) g.rotateY(Math.PI / 4);
  g.computeVertexNormals();
  return g;
}

/** Hollow rectangular box made of 5 rounded panels (open top). Floor bottom at y=0. Returns group. */
export function hollowBox(parent, w, h, d, t, mat, { at = [0, 0, 0], r = 0.004, name = 'box', floorMat } = {}) {
  const g = group(name, { parent, at });
  const rr = Math.min(r, t * 0.45);
  mesh(roundedBox(w, t, d, rr), floorMat ?? mat, { parent: g, at: [0, t / 2, 0], name: `${name}_floor` });
  mesh(roundedBox(w, h, t, rr), mat, { parent: g, at: [0, h / 2, d / 2 - t / 2], name: `${name}_front` });
  mesh(roundedBox(w, h, t, rr), mat, { parent: g, at: [0, h / 2, -d / 2 + t / 2], name: `${name}_back` });
  mesh(roundedBox(t, h, d - t * 1.5, rr), mat, { parent: g, at: [w / 2 - t / 2, h / 2, 0], name: `${name}_right` });
  mesh(roundedBox(t, h, d - t * 1.5, rr), mat, { parent: g, at: [-w / 2 + t / 2, h / 2, 0], name: `${name}_left` });
  return g;
}

/* ------------------------------- handles ------------------------------- */

/**
 * Tool handle along +Y from y=0 (butt) to y=len (where the head attaches). Style from T.grip.
 * oval squashes it in Z (hammer / axe handles). Returns the group.
 */
export function handle(parent, T, m, len, r, { oval = 1, at = [0, 0, 0], rot, name = 'handle', style } = {}) {
  const g = group(name, { parent, at, rot });
  const st = style ?? T.grip;
  const L = (pts, mat, seg = 20) => mesh(lathe(pts, seg), mat, { parent: g });
  if (st === 'wood' || st === 'tape') {
    L([[0, 0], [r * 1.0, 0], [r * 1.22, len * 0.03], [r * 1.25, len * 0.1], [r * 1.0, len * 0.4], [r * 0.82, len * 0.85], [r * 0.86, len], [0, len]], m.wood);
    if (T.vintage) mesh(cyl(r * 0.92, r * 0.88, len * 0.07, 20), m.brass, { parent: g, at: [0, len * 0.93, 0] });
    if (st === 'tape') for (const f of [0.12, 0.22, 0.6]) mesh(cyl(r * (f > 0.5 ? 0.92 : 1.27), r * (f > 0.5 ? 0.9 : 1.22), len * 0.06, 16), m.tape, { parent: g, at: [0, len * f, 0] });
  } else if (st === 'toy') {
    const R = r * 1.5;
    L([[0, 0], [R * 0.6, 0], [R, R * 0.4], [R, len - R * 0.2], [R * 0.7, len], [0, len]], m.grip, 16);
    mesh(sphere(R * 1.25), m.accent, { parent: g, at: [0, 0, 0] });
  } else if (st === 'dip') {
    L([[0, 0], [r * 0.55, 0], [r * 0.6, len], [0, len]], m.steel, 14);
    L([[0, -0.002], [r * 1.0, -0.002], [r * 1.12, len * 0.05], [r * 1.0, len * 0.5], [r * 0.7, len * 0.6], [0, len * 0.6]], m.grip2, 18);
  } else if (st === 'heavy') {
    L([[0, 0], [r * 1.5, 0], [r * 1.55, len * 0.05], [r * 1.25, len * 0.1], [r * 1.25, len * 0.62], [r * 1.05, len * 0.7], [r * 0.9, len], [0, len]], m.grip, 22);
    mesh(cyl(r * 1.3, r * 1.3, len * 0.12, 20), m.body, { parent: g, at: [0, len * 0.66, 0] });
    mesh(torus(r * 0.9, r * 0.22, 16, 6), m.steel, { parent: g, at: [0, -r * 0.6, 0], rot: [0, 0, 0] });
  } else {
    // bi-material (default) and pro: hard core in body colour + rubber overmould
    const core = st === 'pro' ? m.body : m.grip2;
    L([[0, 0], [r * 0.9, 0], [r * 1.0, len * 0.6], [r * 0.85, len * 0.8], [r * 0.82, len], [0, len]], core, 18);
    L([[0, -0.003], [r * 1.18, -0.003], [r * 1.22, len * 0.04], [r * 1.05, len * 0.12], [r * 1.12, len * 0.45], [r * 1.0, len * 0.64], [0, len * 0.64]], m.grip, 20);
    if (st === 'pro') for (const f of [0.18, 0.3, 0.42]) mesh(torus(r * 1.12, r * 0.08, 20, 5), m.body, { parent: g, at: [0, len * f, 0], rot: [Math.PI / 2, 0, 0] });
  }
  if (oval !== 1) g.scale.set(1, 1, oval);
  return g;
}

/* ------------------------------ sets / lay ------------------------------ */

/**
 * Lay items side by side (along Z) inside an open case. items: groups already lying flat.
 * Returns the case group. The case is hollow; items rest on its floor.
 */
export function caseSet(root, items, m, T, { pad = 0.02, wall = 0.008, color } = {}) {
  const boxes = items.map((it) => { it.updateMatrixWorld(true); return new THREE.Box3().setFromObject(it); });
  const W = Math.max(...boxes.map((b) => b.max.x - b.min.x)) + pad * 2;
  const D = boxes.reduce((s, b) => s + (b.max.z - b.min.z) + pad, pad);
  const H = Math.max(0.03, Math.max(...boxes.map((b) => b.max.y - b.min.y)) * 0.7 + wall);
  const caseMat = T.kids ? m.accent : T.vintage ? m.wood : m.plastic(color ?? (T.pro ? '#17181b' : '#2b2e33'), 0.5);
  hollowBox(root, W + wall * 2, H, D + wall * 2, wall, caseMat, { name: 'case', floorMat: T.vintage ? M.fabric('#6b1f2a') : undefined });
  let z = -D / 2 + pad;
  items.forEach((it, i) => {
    const b = boxes[i];
    const cx = (b.min.x + b.max.x) / 2;
    it.position.x -= cx;
    it.position.z += z - b.min.z;
    it.position.y += wall - b.min.y;
    z += b.max.z - b.min.z + pad;
    root.add(it);
  });
  return root;
}

/** Rename all descendants with a suffix (keeps animation targets unique for copies). */
export function suffixNames(obj, sfx) {
  obj.traverse((o) => { if (o.name) o.name = `${o.name}${sfx}`; });
  return obj;
}

/* -------------------------------- done -------------------------------- */

const _h = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let r = 0;
  for (let i = 0; i < 8; i++) {
    const dx = i & 1, dy = (i >> 1) & 1, dz = (i >> 2) & 1;
    r += _h(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
  }
  return r;
}
const RUST_A = new THREE.Color('#8a4a22'), RUST_B = new THREE.Color('#4e2c18');
function rustColors(m) {
  const g = m.geometry;
  if (g.attributes.color) return;
  const { base, amount } = m.material.userData.rust;
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  const sc = m.getWorldScale(new THREE.Vector3());
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * sc.x, y = p.getY(i) * sc.y, z = p.getZ(i) * sc.z;
    const n = vnoise(x * 30, y * 30, z * 30) * 0.65 + vnoise(x * 110, y * 110, z * 110) * 0.35;
    const k = THREE.MathUtils.smoothstep(n, 1 - amount * 0.85, 1.05 - amount * 0.6);
    c.copy(base).lerp(n > 0.62 ? RUST_B : RUST_A, k);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
}

/** Densify (long flat faces need vertices for the contact test). Longest-edge bisection. */
export function densify(geo, maxEdge) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const names = Object.keys(g.attributes);
  const src = names.map((n) => g.attributes[n]);
  const out = names.map(() => []);
  const pos = g.attributes.position;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3();
  let changed = false;
  const read = (i) => src.map((a) => Array.from({ length: a.itemSize }, (_, k) => a.array[i * a.itemSize + k]));
  const emit = (tri) => tri.forEach((v) => v.forEach((arr, ai) => out[ai].push(...arr)));
  const mid = (u, v) => u.map((arr, ai) => arr.map((x, k) => (x + v[ai][k]) / 2));
  const split = (tri, depth) => {
    A.fromArray(tri[0][0]); B.fromArray(tri[1][0]); Cc.fromArray(tri[2][0]);
    const e = [A.distanceTo(B), B.distanceTo(Cc), Cc.distanceTo(A)];
    const mx = Math.max(...e);
    if (mx <= maxEdge || depth > 12) return emit(tri);
    changed = true;
    const i = e.indexOf(mx);
    const [p, q, r] = [tri[i], tri[(i + 1) % 3], tri[(i + 2) % 3]];
    const M2 = mid(p, q);
    split([p, M2, r], depth + 1);
    split([M2, q, r], depth + 1);
  };
  for (let t = 0; t < pos.count; t += 3) split([read(t), read(t + 1), read(t + 2)], 0);
  if (!changed) return geo;
  const res = new THREE.BufferGeometry();
  names.forEach((n, ai) => res.setAttribute(n, new THREE.BufferAttribute(new Float32Array(out[ai]), src[ai].itemSize)));
  return res;
}

/**
 * Wraps the built group: applies the trim scale, densifies big faces, adds rust colours,
 * settles the model on y = 0 and finalizes. animations: array or () => array (called after settling).
 */
export function done(g, T, type, variant, o, animations = []) {
  const root = new THREE.Group();
  root.add(g);
  if (T.scale !== 1) g.scale.multiplyScalar(T.scale);
  root.updateMatrixWorld(true);
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.noShadow) return;
    const geo = m.geometry;
    geo.computeBoundingBox(); // cushion() leaves a stale box from roundedBox()
    const ws = m.getWorldScale(new THREE.Vector3());
    const s = geo.boundingBox.getSize(new THREE.Vector3()).multiply(ws);
    if (Math.max(s.x, s.y, s.z) > 0.72 && geo.attributes.position.count < 20000) m.geometry = densify(geo, 0.7 / Math.max(1e-6, ws.length() / Math.sqrt(3)));
    if (m.material?.userData?.rust) rustColors(m);
  });
  const box = new THREE.Box3();
  root.traverse((c) => { if (c.isMesh && !c.userData.noShadow && c.visible) box.expandByObject(c); });
  g.position.y -= box.min.y;
  root.updateMatrixWorld(true);
  const anims = typeof animations === 'function' ? animations() : animations;
  return finalize(root, { type, variant, options: o, animations: anims.filter(Boolean) });
}

/**
 * Standard factory for tools. build(holder, ctx) builds ONE tool (upright: handle along +Y; when
 * lay=true the holder is rotated so the tool lies on its side) and returns animation clips.
 * Trim 'set' builds several (scaled) copies in an open case. ctx = { variant, T, m, i, V, o }.
 */
export function makeTool(type, VARIANTS, base, build, { setScales = [1, 0.82, 0.66], lay = true, set } = {}) {
  return (options = {}) => {
    const { o, variant, T, V } = setup(options, VARIANTS, type, base);
    const m = kit(T);
    const g = group(type);
    const one = (parent, i) => {
      const holder = group('tool', { parent, rot: lay ? [-Math.PI / 2, 0, 0] : undefined });
      return build(holder, { variant, T, m, i, V, o }) || [];
    };
    let anims = [];
    if (T.set && set) anims = set(g, { variant, T, m, V, o, one }) || [];
    else if (T.set && setScales) {
      const items = setScales.map((s, i) => {
        const it = group(`item${i}`);
        it.scale.setScalar(s);
        const a = one(it, i);
        if (!i) anims = a; else suffixNames(it, `_${i}`);
        return it;
      });
      caseSet(g, items, m, T);
    } else anims = one(g, 0);
    return done(g, T, type, variant, o, anims);
  };
}

/** Lathe profile along +X (profile [r, x]). */
export const latheX = (pr, seg = 24) => lathe(pr, seg).rotateZ(-Math.PI / 2);
/** Lathe profile along -X. */
export const latheNX = (pr, seg = 24) => lathe(pr, seg).rotateZ(Math.PI / 2);
