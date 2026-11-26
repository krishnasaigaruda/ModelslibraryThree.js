// Shared helpers for the sports category: trims, finishes, vertex-coloured pattern spheres,
// canvas labels and the "settle on the ground" wrapper every factory uses.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant };

/*
 * Trims: every sports type uses these names (subset per type). Each carries a palette
 * (p = primary, s = secondary, a = accent), a finish and shape flags that every builder
 * reads: kids = smaller + chunkier + foam, retro = wood/leather + vintage shapes,
 * worn = faded + dented + scuffed, stealth = blacked-out carbon, champion = gold, etc.
 */
export const TRIMS = {
  pro: { p: '#f3f3f1', s: '#15171b', a: '#e5402a', finish: 'gloss', detail: 2 },
  retro: { p: '#8a5530', s: '#efe2c4', a: '#9e2f25', finish: 'leather', vintage: true, wood: 'walnut' },
  kids: { p: '#ffc81e', s: '#2b7de1', a: '#ff4d6d', finish: 'foam', kids: true, scale: 0.7, chunky: 1.6 },
  neon: { p: '#c8ff12', s: '#101114', a: '#ff2bd6', finish: 'gloss', neon: true },
  worn: { p: '#b5a993', s: '#4b4239', a: '#7a3d2c', finish: 'matte', wear: 1 },
  stealth: { p: '#1c1d20', s: '#2e3036', a: '#8d939c', finish: 'carbon' },
  'team-crimson': { p: '#b10f2e', s: '#fafafa', a: '#ffcc33', finish: 'gloss', pattern: 'stripes' },
  'team-navy': { p: '#132a5e', s: '#f2f2f2', a: '#f0812a', finish: 'gloss', pattern: 'hoops' },
  'team-emerald': { p: '#0e7a4b', s: '#f4e4b4', a: '#141414', finish: 'gloss', pattern: 'chevron' },
  champion: { p: '#d6a93c', s: '#1b1b1d', a: '#f6e3a1', finish: 'gold', champion: true },
  set: { p: '#f3f3f1', s: '#15171b', a: '#e5402a', finish: 'gloss', set: true },
};
export const STD_TRIMS = ['pro', 'retro', 'kids', 'neon', 'worn', 'stealth', 'team-crimson', 'team-navy', 'team-emerald', 'champion'];

/** Resolve options → { o, variant, trim, T (trim spec merged over base palette) }. */
export function setup(options, VARIANTS, type, base = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VARIANTS, o.variant, type);
  const trim = o.trim && TRIMS[o.trim] ? o.trim : null;
  const V = VARIANTS[variant] || {};
  const T = { scale: 1, chunky: 1, wear: 0, detail: 1, ...base, ...V, ...(trim ? TRIMS[trim] : {}), trim };
  if (!trim && o.color) T.p = o.color;
  if (!trim && !T.finish) T.finish = 'gloss';
  T.r = rng(`${type}-${variant}-${trim}`);
  return { o, variant, trim, T, V };
}

/** Material for a finish. kind lets callers force e.g. 'rubber' or 'metal'. */
export function fin(T, color, kind) {
  const f = kind ?? T.finish;
  const c = M.toColor(color);
  if (T.wear && f !== 'metal' && f !== 'chrome') c.lerp(new THREE.Color('#b8ad98'), 0.28 * T.wear);
  switch (f) {
    case 'foam': return new THREE.MeshStandardMaterial({ name: 'foam', color: c, roughness: 0.97 });
    case 'leather': return new THREE.MeshPhysicalMaterial({ name: 'leather', color: c, roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5 });
    case 'matte': return M.matte(c, 0.82);
    case 'carbon': return new THREE.MeshPhysicalMaterial({ name: 'carbon', color: c, roughness: 0.32, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 });
    case 'gold': return M.metal('#d6a93c', 0.22);
    case 'silver': return M.metal('#c9ccd2', 0.2);
    case 'bronze': return M.metal('#a8673a', 0.3);
    case 'metal': return M.metal(c, T.wear ? 0.6 : 0.3);
    case 'chrome': return T.wear ? M.metal('#a7a39b', 0.55) : M.chrome();
    case 'rubber': return new THREE.MeshStandardMaterial({ name: 'rubber', color: c, roughness: 0.9 });
    case 'wood': return M.wood(color);
    case 'fabric': return M.fabric(c);
    case 'plastic': return M.plastic(c, 0.45);
    case 'neon': return new THREE.MeshStandardMaterial({ name: 'neon', color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.4 });
    default: return new THREE.MeshPhysicalMaterial({ name: 'gloss', color: c, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  }
}

/** Material for the main body colour of a trim (neon gets a faint self-glow). */
export const bodyMat = (T, color = T.p) => fin(T, color, T.neon ? 'neon' : undefined);

/**
 * Splits triangles whose longest edge exceeds maxEdge (longest-edge bisection, all attributes
 * interpolated). Big flat faces (table tops, walls) then have evenly spaced vertices.
 */
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

/** Shifts the model so it rests on y = 0, then finalizes. */
export function done(root, type, variant, o, animations = []) {
  root.updateMatrixWorld(true);
  // big flat faces get evenly spaced vertices (needed for reliable surface-contact checks)
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.noShadow) return;
    const g = m.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    const s = g.boundingBox.getSize(new THREE.Vector3()).multiply(m.getWorldScale(new THREE.Vector3()));
    if (Math.max(s.x, s.y, s.z) > 0.72 && g.attributes.position.count < 20000) m.geometry = densify(g, 0.7 / Math.max(1e-6, m.getWorldScale(new THREE.Vector3()).length() / Math.sqrt(3)));
  });
  const box = new THREE.Box3().setFromObject(root);
  for (const c of root.children) c.position.y -= box.min.y;
  root.updateMatrixWorld(true);
  const anims = typeof animations === 'function' ? animations() : animations;
  return finalize(root, { type, variant, options: o, animations: anims });
}

/* ---------------------------- pattern spheres ---------------------------- */

const _geoCache = new Map();
/**
 * Unit icosphere whose vertices are coloured / pushed in by fn(p) → { c: THREE.Color, d: inset (fraction of r) }.
 * Smooth normals (merged vertices). Cached by key.
 */
export function patternSphere(r, detail, fn, key) {
  const k = key ? `${key}|${detail}` : null;
  let g = k && _geoCache.get(k);
  if (!g) {
    let base = new THREE.IcosahedronGeometry(1, detail);
    base.deleteAttribute('normal');
    base.deleteAttribute('uv');
    g = mergeVertices(base);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const p = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i).normalize();
      const { c, d = 0 } = fn(p);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      p.multiplyScalar(1 - d);
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    if (k) _geoCache.set(k, g);
  }
  const out = g.clone();
  out.scale(r, r, r);
  return out;
}

export function vcMat({ roughness = 0.45, clearcoat = 0.4, sheen = 0, metalness = 0, emissive } = {}) {
  const m = new THREE.MeshPhysicalMaterial({ name: 'ball', vertexColors: true, color: 0xffffff, roughness, clearcoat, clearcoatRoughness: 0.2, metalness, sheen, sheenRoughness: 0.7, sheenColor: new THREE.Color('#ffffff') });
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 0.12; }
  return m;
}

/* -------------------------------- labels -------------------------------- */

/** Canvas texture (null in Node). draw(ctx, w, h). */
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

/** Flat plane carrying a canvas label (falls back to a plain colour in Node). Faces +Z. */
export function labelPlane(w, h, draw, { bg = '#ffffff', emissive = 0, px = 256 } = {}) {
  const tex = canvasTex(px, Math.max(16, Math.round((px * h) / w)), draw);
  const mat = emissive
    ? new THREE.MeshStandardMaterial({ name: 'screen', color: tex ? '#ffffff' : bg, map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: tex ? emissive : 0.2, roughness: 0.4 })
    : new THREE.MeshStandardMaterial({ name: 'label', color: tex ? '#ffffff' : bg, map: tex, roughness: 0.5 });
  if (emissive && !tex) mat.emissive = M.toColor(bg);
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

/* ------------------------------ small parts ------------------------------ */

/** Rounded rod along X between x0 and x1 at (y,z). */
export function rodX(x0, x1, r, mat, parent, { y = 0, z = 0, seg = 16 } = {}) {
  return mesh(new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), seg).rotateZ(Math.PI / 2), mat, { parent, at: [(x0 + x1) / 2, y, z] });
}
export function rodY(y0, y1, r, mat, parent, { x = 0, z = 0, seg = 16, r2 } = {}) {
  return mesh(new THREE.CylinderGeometry(r2 ?? r, r, Math.abs(y1 - y0), seg), mat, { parent, at: [x, (y0 + y1) / 2, z] });
}
export function rodZ(z0, z1, r, mat, parent, { x = 0, y = 0, seg = 16 } = {}) {
  return mesh(new THREE.CylinderGeometry(r, r, Math.abs(z1 - z0), seg).rotateX(Math.PI / 2), mat, { parent, at: [x, y, (z0 + z1) / 2] });
}

/** Square/round steel tube frame segment between two points. */
export function bar(a, b, r, mat, parent) {
  return tube(a, b, r, mat, { parent, radialSegments: 10 });
}

/** Net mesh: thin cords on a grid inside a w×h rectangle, plane XY centred at origin. */
export function netGrid(w, h, cell, r, mat, parent, { at = [0, 0, 0], rot = [0, 0, 0], sag = 0 } = {}) {
  const g = group('net', { parent, at, rot });
  const nx = Math.max(1, Math.round(w / cell));
  const ny = Math.max(1, Math.round(h / cell));
  for (let i = 0; i <= nx; i++) {
    const x = -w / 2 + (i * w) / nx;
    mesh(new THREE.CylinderGeometry(r, r, h, 4), mat, { parent: g, at: [x, 0, sag * Math.sin((i / nx) * Math.PI)] });
  }
  for (let j = 0; j <= ny; j++) {
    const y = -h / 2 + (j * h) / ny;
    mesh(new THREE.CylinderGeometry(r, r, w, 4).rotateZ(Math.PI / 2), mat, { parent: g, at: [0, y, sag * 0.5] });
  }
  return g;
}

/** Plinth + engraved plate (trophies, champion display stands). Returns top y. */
export function plinth(parent, w, h, { mat, plate = true, round = false } = {}) {
  const m = mat ?? M.wood('walnut');
  if (round) mesh(lathe([[0, 0], [w / 2, 0], [w / 2, h * 0.1], [w * 0.47, h * 0.15], [w * 0.47, h * 0.9], [w * 0.44, h], [0, h]], 40), m, { parent });
  else mesh(roundedBox(w, h, w, Math.min(0.01, h * 0.15)), m, { parent, at: [0, h / 2, 0] });
  if (plate) {
    const pl = mesh(roundedBox(w * 0.6, h * 0.4, 0.003, 0.001), M.metal('#d6b45a', 0.25), { parent, at: [0, h * 0.5, (round ? w * 0.47 : w / 2) + 0.0015] });
    pl.name = 'plate';
  }
  return h;
}

/** Stripe/hoop/chevron team pattern on a body coordinate; returns true for secondary colour. */
export function teamPattern(pattern, u, v) {
  if (pattern === 'stripes') return Math.abs(((u * 6) % 2) + 2) % 2 < 0.5;
  if (pattern === 'hoops') return Math.abs(((v * 5) % 2) + 2) % 2 < 0.7;
  if (pattern === 'chevron') return Math.abs((((v + Math.abs(u) * 0.8) * 5) % 2) + 2) % 2 < 0.6;
  return false;
}
