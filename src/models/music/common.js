// Shared helpers for the music category: trims (finish + shape flags), materials, smooth
// outlines, hollow shells, sunburst vertex colours, canvas labels and the ground settler.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, mergeGeometries };

/*
 * Trims shared by every music type. Each carries a palette (p body, s secondary/pickguard,
 * a accent), a finish, a hardware metal (hw) and SHAPE flags every builder reads:
 *   round   – vintage: softer, rounder outlines, older forms (tweed, ribbon mics, horns)
 *   burst   – sunburst gradient (dark rim → amber centre) on wooden tops
 *   sharp   – angular/faceted outlines, pointy headstocks (black, neon)
 *   ornate  – extra binding, inlays, engraving, tiered details (gold-plated)
 *   wear    – faded paint, chips, aged metal, missing bits (relic)
 *   kids    – smaller, chunkier, toy-bright, fewer parts
 *   head    – guitar headstock style; pg – pickguard style; horn – electric horn stretch
 */
export const TRIMS = {
  vintage: { p: '#b5722c', s: '#efe1c2', a: '#5a3218', finish: 'nitro', hw: 'nickel', round: true, head: 'open3', pg: 'tear', horn: 0.8, wood: '#7a4a22', tolex: '#c9b48a' },
  sunburst: { p: '#d38b2c', edge: '#1b0d06', s: '#141414', a: '#f0e6d2', finish: 'gloss', hw: 'chrome', burst: true, head: 'inline', pg: 'large', horn: 1.1, wood: '#5b3a24', tolex: '#3a1d10' },
  natural: { p: '#dcbc8c', s: '#a7774a', a: '#3d2a1a', finish: 'satin', hw: 'nickel', natural: true, head: 'paddle', pg: 'none', horn: 1, wood: '#d9b98a', tolex: '#b8874f' },
  black: { p: '#0e0e10', s: '#2a2a2e', a: '#c9ccd2', finish: 'gloss', hw: 'black', sharp: 1, head: 'reverse', pg: 'none', horn: 1.35, wood: '#1f1d1b', tolex: '#111111' },
  white: { p: '#f2efe6', s: '#cfe3d4', a: '#1a1a1a', finish: 'gloss', hw: 'chrome', head: 'inline', pg: 'mirror', horn: 1.05, wood: '#eeeae2', tolex: '#f0ede4' },
  neon: { p: '#ff2bd6', s: '#c8ff12', a: '#14f0ff', finish: 'neon', hw: 'black', sharp: 2, neon: true, head: 'pointy', pg: 'small', horn: 1.6, wood: '#141418', tolex: '#18181c' },
  relic: { p: '#6fa597', s: '#e3d9b8', a: '#5b3a24', finish: 'worn', hw: 'aged', wear: 1, head: 'inline', pg: 'tear', horn: 1, wood: '#8a5a33', tolex: '#5e5446' },
  gold: { p: '#d6a93c', s: '#1b1b1d', a: '#f6e3a1', finish: 'gold', hw: 'gold', ornate: true, head: 'open3', pg: 'small', horn: 0.95, wood: '#3a2416', tolex: '#1b1b1d' },
  kids: { p: '#2b7de1', s: '#ffc81e', a: '#ff4d6d', finish: 'plastic', hw: 'chrome', kids: true, scale: 0.62, chunky: 1.5, head: 'paddle', pg: 'none', horn: 1, wood: '#e8b04a', tolex: '#2b7de1' },
};
export const STD_TRIMS = Object.keys(TRIMS);

/** Resolve options → { o, variant, trim, T }. base = the variant's untrimmed look. */
export function setup(options, VARIANTS, type, base = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VARIANTS, o.variant, type);
  const trim = o.trim && TRIMS[o.trim] ? o.trim : null;
  const V = VARIANTS[variant] || {};
  const T = { scale: 1, chunky: 1, wear: 0, horn: 1, hw: 'chrome', finish: 'gloss', head: 'inline', pg: 'none', ...base, ...V, ...(trim ? TRIMS[trim] : {}), trim };
  if (!trim && o.color && o.color !== 'blue') T.p = o.color;
  T.r = rng(`${type}-${variant}-${trim}`);
  return { o, variant, trim, T, V };
}

/** Finish material for a colour. kind forces a finish ('metal', 'plastic' …). */
export function fin(T, color, kind) {
  const f = kind ?? T.finish;
  const c = M.toColor(color);
  if (T.wear && f !== 'gold' && f !== 'metal') c.lerp(new THREE.Color('#b9ae95'), 0.22 * T.wear);
  switch (f) {
    case 'nitro': return new THREE.MeshPhysicalMaterial({ name: 'nitro', color: c, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25 });
    case 'satin': return new THREE.MeshPhysicalMaterial({ name: 'satin', color: c, roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.6 });
    case 'worn': return new THREE.MeshStandardMaterial({ name: 'worn', color: c, roughness: 0.78 });
    case 'neon': return new THREE.MeshStandardMaterial({ name: 'neon', color: c, emissive: c, emissiveIntensity: 0.4, roughness: 0.35 });
    case 'gold': return new THREE.MeshStandardMaterial({ name: 'gold', color: '#e0b04a', metalness: 1, roughness: 0.16 });
    case 'metal': return M.metal(c, T.wear ? 0.6 : 0.28);
    case 'plastic': return new THREE.MeshPhysicalMaterial({ name: 'toy', color: c, roughness: 0.4, clearcoat: 0.3 });
    case 'matte': return M.matte(c, 0.85);
    case 'rubber': return new THREE.MeshStandardMaterial({ name: 'rubber', color: c, roughness: 0.92 });
    case 'fabric': return M.fabric(c);
    case 'vc': return new THREE.MeshPhysicalMaterial({ name: 'burst', vertexColors: true, color: 0xffffff, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06 });
    default: return new THREE.MeshPhysicalMaterial({ name: 'gloss', color: c, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 });
  }
}

/** Main body material for a trim (the variant's own colour when untrimmed). */
export const bodyMat = (T, color = T.p) => fin(T, color);

/** Hardware metal for the trim (tuners, bridges, stands, keys…). */
export function hwMat(T) {
  switch (T.hw) {
    case 'gold': return new THREE.MeshStandardMaterial({ name: 'gold_hw', color: '#e6b54e', metalness: 1, roughness: 0.15 });
    case 'black': return new THREE.MeshStandardMaterial({ name: 'black_hw', color: '#1a1b1e', metalness: 0.85, roughness: 0.3 });
    case 'nickel': return M.metal('#c4c0b4', 0.3);
    case 'aged': return M.metal('#8d8370', 0.62);
    default: return M.chrome();
  }
}

/** Brass-instrument metal: lacquered brass by default, trims change it. */
export function brassMat(T) {
  if (!T.trim) return new THREE.MeshStandardMaterial({ name: 'brass', color: '#d9a94a', metalness: 1, roughness: 0.2 });
  switch (T.trim) {
    case 'vintage': return new THREE.MeshStandardMaterial({ name: 'brass_old', color: '#b88a3e', metalness: 1, roughness: 0.38 });
    case 'sunburst': return new THREE.MeshStandardMaterial({ name: 'copper', color: '#c9774a', metalness: 1, roughness: 0.22 });
    case 'natural': return new THREE.MeshStandardMaterial({ name: 'raw_brass', color: '#c8a868', metalness: 1, roughness: 0.45 });
    case 'black': return new THREE.MeshPhysicalMaterial({ name: 'black_lacquer', color: '#121214', metalness: 0.6, roughness: 0.2, clearcoat: 1 });
    case 'white': return new THREE.MeshPhysicalMaterial({ name: 'white_lacquer', color: '#f1eee6', metalness: 0.1, roughness: 0.25, clearcoat: 1 });
    case 'neon': return fin(T, T.p, 'neon');
    case 'relic': return new THREE.MeshStandardMaterial({ name: 'tarnish', color: '#7d7148', metalness: 0.8, roughness: 0.65 });
    case 'gold': return new THREE.MeshStandardMaterial({ name: 'gold', color: '#f0c45a', metalness: 1, roughness: 0.1 });
    case 'kids': return fin(T, T.p, 'plastic');
    default: return M.metal('#d9a94a', 0.2);
  }
}

/** Wood material honouring the trim (sunburst/relic/neon bodies use their colour). */
export function woodMat(T, def = '#8a5a33') {
  if (!T.trim) return M.wood(def);
  if (T.kids) return fin(T, T.p, 'plastic');
  if (T.neon) return fin(T, T.p, 'neon');
  if (T.trim === 'black' || T.trim === 'white') return fin(T, T.p, 'gloss');
  if (T.trim === 'gold') return fin(T, T.wood, 'gloss');
  return fin(T, T.wood, T.trim === 'relic' ? 'worn' : T.trim === 'natural' ? 'satin' : 'nitro');
}

/* ------------------------------- outlines ------------------------------- */

/** Smooth closed outline through 2D control points (Catmull-Rom); sharp → straight facets. */
export function blob(points, n = 64, sharp = false) {
  if (sharp) return points.map(([x, y]) => [x, y]);
  const c = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal');
  return c.getPoints(n).slice(0, -1).map((p) => [p.x, p.y]);
}
/** Mirror a right-half list ([x≥0,y] from bottom centre to top centre) into a full outline. */
export function mirrorHalf(half) {
  const right = half.slice(0, -1);
  const left = half.slice(1).reverse().map(([x, y]) => [-x, y]);
  return [...right, half[half.length - 1], ...left.slice(1, -1)];
}
export const toShape = (pts) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
export function toPath(pts) {
  const p = new THREE.Path(pts.slice().reverse().map(([x, y]) => new THREE.Vector2(x, y)));
  return p;
}
/** Shrink an outline toward its centroid by d (approx inward offset). */
export function inset(pts, d) {
  let cx = 0, cy = 0;
  for (const [x, y] of pts) { cx += x; cy += y; }
  cx /= pts.length; cy /= pts.length;
  return pts.map(([x, y]) => {
    const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1;
    return [x - (dx / l) * d, y - (dy / l) * d];
  });
}
export function circlePts(cx, cy, r, n = 28) {
  return Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r]);
}

/** Flat plate from an outline with optional holes, extruded along Z (centred), bevelled. */
export function plate(pts, depth, { holes = [], bevel = 0.002 } = {}) {
  const s = toShape(pts);
  for (const h of holes) s.holes.push(toPath(h));
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(depth - 2 * bevel, 1e-4), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 12 });
  g.translate(0, 0, -(depth - 2 * bevel) / 2);
  g.computeVertexNormals();
  return g;
}

/**
 * Hollow instrument shell: back plate, rim of sides, top plate (with holes) — returns group.
 * Body lies in XY, depth along Z, front (top) at +depth/2.
 */
export function hollowBody(pts, depth, { top, back, sides, holes = [], wall = 0.003, arch = 0, parent, name = 'body' }) {
  const g = group(name, { parent });
  const rim = plate(pts, depth - 2 * wall, { holes: [inset(pts, wall * 1.4)], bevel: 0.0015 });
  mesh(rim, sides ?? top, { parent: g, name: `${name}_sides` });
  const tg = plate(pts, wall, { holes, bevel: 0.0012 });
  if (arch) archGeo(tg, pts, arch);
  mesh(tg, top, { parent: g, at: [0, 0, depth / 2 - wall / 2], name: `${name}_top` });
  const bg = plate(pts, wall, { bevel: 0.0012 });
  if (arch) archGeo(bg, pts, -arch * 0.7);
  mesh(bg, back ?? sides ?? top, { parent: g, at: [0, 0, -depth / 2 + wall / 2], name: `${name}_back` });
  return g;
}

/** Arch a flat plate (violin tops, archtops): z += h · dome(x,y) inside the outline bbox. */
export function archGeo(geo, pts, h) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) / 2, hh = (y1 - y0) / 2;
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = (pos.getX(i) - cx) / hw, v = (pos.getY(i) - cy) / hh;
    const k = Math.max(0, 1 - u * u) * Math.max(0, 1 - v * v);
    pos.setZ(i, pos.getZ(i) + h * Math.sqrt(k));
  }
  geo.computeVertexNormals();
  return geo;
}

/** Sunburst / gradient vertex colours by normalised elliptical radius from (cx,cy). */
export function burst(geo, { cx = 0, cy = 0, rx = 0.2, ry = 0.25, inner = '#d38b2c', outer = '#1b0d06', start = 0.45, power = 1.6 } = {}) {
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const a = M.toColor(inner), b = M.toColor(outer), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const d = Math.hypot((pos.getX(i) - cx) / rx, (pos.getY(i) - cy) / ry);
    const t = Math.min(1, Math.max(0, (d - start) / (1 - start))) ** power;
    c.copy(a).lerp(b, t);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/** Merge a list of geometries into one mesh (frets, keys, rivets…). */
export function merged(geos, mat, opts = {}) {
  const list = geos.filter(Boolean).map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of list) { for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); }
  return mesh(mergeGeometries(list), mat, opts);
}
/** Geometry placed with position/rotation baked in (for merging). */
export function placed(geo, at = [0, 0, 0], rot = [0, 0, 0], scale) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...at), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...(scale ?? [1, 1, 1])));
  return geo.applyMatrix4(m);
}
/** Cylinder geometry between two points (for merging). */
export function segGeo(a, b, r, seg = 8) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const d = vb.clone().sub(va);
  const g = new THREE.CylinderGeometry(r, r, d.length(), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
  g.translate(...va.clone().addScaledVector(d, 0.5).toArray());
  return g;
}

/* ------------------------------ densify / done ------------------------------ */

/** Splits triangles whose longest edge exceeds maxEdge (for reliable contact checks). */
export function densify(geo, maxEdge) {
  // fast path: nothing to split
  {
    const p = geo.attributes.position, idx = geo.index;
    const n = idx ? idx.count : p.count;
    const m2 = maxEdge * maxEdge;
    let need = false;
    const d2 = (a, b) => { const dx = p.getX(a) - p.getX(b), dy = p.getY(a) - p.getY(b), dz = p.getZ(a) - p.getZ(b); return dx * dx + dy * dy + dz * dz; };
    for (let t = 0; t < n && !need; t += 3) {
      const a = idx ? idx.getX(t) : t, b = idx ? idx.getX(t + 1) : t + 1, c = idx ? idx.getX(t + 2) : t + 2;
      if (d2(a, b) > m2 || d2(b, c) > m2 || d2(c, a) > m2) need = true;
    }
    if (!need) return geo;
  }
  const g = geo.index ? geo.toNonIndexed() : geo;
  const names = Object.keys(g.attributes);
  const src = names.map((n) => g.attributes[n]);
  const out = names.map(() => []);
  const pos = g.attributes.position;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  let changed = false;
  const read = (i) => src.map((a) => Array.from({ length: a.itemSize }, (_, k) => a.array[i * a.itemSize + k]));
  const emit = (tri) => tri.forEach((v) => v.forEach((arr, ai) => out[ai].push(...arr)));
  const mid = (u, v) => u.map((arr, ai) => arr.map((x, k) => (x + v[ai][k]) / 2));
  const split = (tri, depth) => {
    A.fromArray(tri[0][0]); B.fromArray(tri[1][0]); C.fromArray(tri[2][0]);
    const e = [A.distanceTo(B), B.distanceTo(C), C.distanceTo(A)];
    const m = Math.max(...e);
    if (m <= maxEdge || depth > 12) return emit(tri);
    changed = true;
    const i = e.indexOf(m);
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

/** Shifts the model to rest on y = 0, densifies big faces, then finalizes. */
export function done(root, type, variant, o, animations = []) {
  root.updateMatrixWorld(true);
  const ws = new THREE.Vector3();
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.noShadow) return;
    const g = m.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    m.getWorldScale(ws);
    const s = g.boundingBox.getSize(new THREE.Vector3()).multiply(ws);
    if (Math.max(s.x, s.y, s.z) > 0.6 && g.attributes.position.count < 20000) m.geometry = densify(g, 0.45 / Math.max(1e-6, ws.length() / Math.sqrt(3)));
  });
  // ground on real geometry only (glow cards of lamps can hang lower)
  const box = new THREE.Box3();
  root.traverse((m) => { if (m.isMesh && !m.userData.noShadow && m.material?.blending !== THREE.AdditiveBlending) box.union(new THREE.Box3().setFromObject(m)); });
  for (const c of root.children) { c.position.y -= box.min.y; }
  root.updateMatrixWorld(true);
  const anims = typeof animations === 'function' ? animations() : animations;
  return finalize(root, { type, variant, options: o, animations: anims });
}

/** Lowest world-space vertex of a subtree (for standing instruments on cradles). */
export function lowestPoint(obj) {
  obj.updateMatrixWorld(true);
  const best = new THREE.Vector3(0, Infinity, 0), v = new THREE.Vector3();
  obj.traverse((m) => {
    if (!m.isMesh || m.userData.noShadow) return;
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      if (v.y < best.y) best.copy(v);
    }
  });
  return best;
}

/* -------------------------------- labels -------------------------------- */

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

/** Flat plane with a canvas texture (plain colour in Node). Faces +Z. */
export function labelPlane(w, h, draw, { bg = '#ffffff', emissive = 0, px = 256 } = {}) {
  const tex = canvasTex(px, Math.max(16, Math.round((px * h) / w)), draw);
  const mat = emissive
    ? new THREE.MeshStandardMaterial({ name: 'screen', color: tex ? '#ffffff' : bg, map: tex, emissive: tex ? '#ffffff' : bg, emissiveMap: tex, emissiveIntensity: emissive, roughness: 0.4 })
    : new THREE.MeshStandardMaterial({ name: 'label', color: tex ? '#ffffff' : bg, map: tex, roughness: 0.5 });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

/** Speaker grille cloth material with a woven/perforated canvas texture. */
export function grilleMat(color = '#1a1a1a', { tweed = false } = {}) {
  const tex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.globalAlpha = 0.35;
    for (let i = 0; i < w; i += 4) { g.fillStyle = i % 8 ? '#000' : '#fff'; g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); }
    if (tweed) { g.globalAlpha = 0.25; g.strokeStyle = '#3a2a10'; for (let i = -h; i < w; i += 6) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); } }
  });
  if (tex) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 4); }
  return new THREE.MeshStandardMaterial({ name: 'grille', color: tex ? '#ffffff' : color, map: tex, roughness: 0.95 });
}

/** Simple speaker cone (surround + cone + dust cap) facing +Z, radius r. Returns group. */
export function speakerCone(parent, r, { at = [0, 0, 0], name = 'cone', mat } = {}) {
  const g = group(name, { parent, at });
  const cm = mat ?? M.matte('#1c1c1e', 0.8);
  mesh(new THREE.TorusGeometry(r * 0.9, r * 0.1, 8, 32), M.rubber(), { parent: g, at: [0, 0, r * 0.02] });
  mesh(lathe([[r * 0.82, 0], [r * 0.5, -r * 0.12], [r * 0.2, -r * 0.3], [r * 0.18, -r * 0.32]], 32).rotateX(Math.PI / 2), cm, { parent: g });
  mesh(new THREE.SphereGeometry(r * 0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, 0.5), cm, { parent: g, at: [0, 0, -r * 0.2] });
  return g;
}

/** Knob (cylinder with a pointer line) facing +Z. */
export function knobGeo(r, h, seg = 16) {
  return mergeGeometries([new THREE.CylinderGeometry(r, r * 1.08, h, seg).rotateX(Math.PI / 2).translate(0, 0, h / 2).toNonIndexed(), new THREE.BoxGeometry(r * 0.18, r * 0.9, h * 0.25).translate(0, r * 0.45, h * 1.05).toNonIndexed()]);
}

/** Tubular stand leg/pole between two points. */
export const bar = (a, b, r, mat, parent, name) => tube(a, b, r, mat, { parent, radialSegments: 10, name });
