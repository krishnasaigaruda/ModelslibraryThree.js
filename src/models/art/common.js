// Shared helpers for the art category: trims (material + shape flags), finishes, trim-specific
// plinths, procedural canvas art (canvas texture in the browser, vertex colours in Node),
// surface roughening and the "settle on the ground" wrapper every factory uses.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant, mergeGeometries, mergeVertices };

/*
 * Trims: every art type uses these names (subset per type). Each changes material AND shape:
 *   marble   → white veined stone, classic moulded column plinth, smooth
 *   bronze   → dark bronze + green patina, stepped granite base
 *   gold     → polished gold, slender black lacquer pedestal, thinner/taller proportions
 *   wood     → carved walnut, faceted (low-poly carving), raw log slab base
 *   concrete → grey cast concrete, chunky + blocky brutalist cube base
 *   glass    → tinted transparent glass, acrylic block base, extra smooth
 *   pop-art  → glossy bright colours, stretched / chunky cartoon proportions, drum base
 *   weathered→ eroded lichen stone, rough displaced surfaces, rubble rock base, tilted
 *   mini     → tabletop size (×0.45) on a small disc
 *   grand    → monumental (×1.7) on a tall plinth
 */
export const TRIMS = {
  marble: { p: '#ece8e1', s: '#cfc8bc', a: '#9c958a', finish: 'marble', plinth: 'column', smooth: 1 },
  bronze: { p: '#6e4a2a', s: '#3a3634', a: '#4f8f78', finish: 'bronze', plinth: 'stepped' },
  gold: { p: '#d9ab3f', s: '#121214', a: '#f3dc8e', finish: 'gold', plinth: 'slender', slim: 1 },
  wood: { p: 'walnut', s: 'oak', a: '#2b1c12', finish: 'wood', plinth: 'log', facet: 1 },
  concrete: { p: '#9d9a94', s: '#7f7c77', a: '#5c5a56', finish: 'concrete', plinth: 'cube', chunky: 1 },
  glass: { p: '#8fd3e8', s: '#dfe9ee', a: '#2f7fb0', finish: 'glass', plinth: 'acrylic', smooth: 1 },
  'pop-art': { p: '#ff2f6d', s: '#ffd400', a: '#1e8fff', finish: 'pop', plinth: 'drum', pop: 1 },
  weathered: { p: '#a99f8b', s: '#7d7464', a: '#6f7d3c', finish: 'weathered', plinth: 'rock', rough: 1 },
  mini: { finish: null, plinth: 'disc', scale: 0.45 },
  grand: { finish: null, plinth: 'tall', scale: 1.7 },
  // equipment / furniture trims (easels, supplies, wheels, benches)
  black: { p: '#1c1c1e', s: '#2c2c30', a: '#b8bcc2', finish: 'paint', plinth: 'block', slim: 1 },
  kids: { p: '#ffd400', s: '#1e8fff', a: '#ff2f6d', finish: 'plastic', plinth: 'disc', kids: 1, chunky: 1, scale: 0.6 },
  // neon colours + board styles
  pink: { neon: '#ff2fa0', board: 'acrylic' },
  'neon-mini': { board: 'acrylic', scale: 0.5 },
  cyan: { neon: '#22e6ff', board: 'acrylic' },
  lime: { neon: '#8dff2a', board: 'acrylic' },
  amber: { neon: '#ffae1a', board: 'box' },
  violet: { neon: '#9a4dff', board: 'box' },
  red: { neon: '#ff2236', board: 'brick' },
};
TRIMS.white = { p: '#f1efe9', s: '#d9d6cf', a: '#9aa0a6', finish: 'paint', plinth: 'block', neon: '#f4f6ff', board: 'brick' };
export const STD_TRIMS = ['marble', 'bronze', 'gold', 'wood', 'concrete', 'glass', 'pop-art', 'weathered', 'mini', 'grand'];

/** Resolve options → { o, variant, trim, T }. base = per-type defaults (p, s, a, finish). */
export function setup(options, VARIANTS, type, base = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VARIANTS, o.variant, type);
  const trim = o.trim && TRIMS[o.trim] ? o.trim : null;
  const V = VARIANTS[variant] || {};
  const tr = trim ? TRIMS[trim] : {};
  const T = { scale: 1, p: '#e6e1d7', s: '#bdb6aa', a: '#8a8174', finish: 'stone', plinth: 'block', ...base, ...V };
  for (const [k, v] of Object.entries(tr)) if (v != null) T[k] = v;
  T.trim = trim;
  if (!trim && o.color) T.p = o.color;
  T.r = rng(`${type}-${variant}-${trim}`);
  return { o, variant, trim, T, V };
}

const _matCache = new Map();
/** Material for a finish (kind overrides the trim finish). */
export function fin(T, color, kind) {
  const f = kind ?? T.finish;
  const key = `${f}|${color}`;
  if (_matCache.has(key)) return _matCache.get(key);
  const c = color in M.WOODS ? M.toColor(M.WOODS[color]) : M.toColor(color);
  let m;
  switch (f) {
    case 'marble': m = new THREE.MeshPhysicalMaterial({ name: 'marble', color: c, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.25, map: marbleTex() }); break;
    case 'bronze': m = M.metal(c, 0.42); m.name = 'bronze'; break;
    case 'gold': m = M.metal('#d9ab3f', 0.16); m.name = 'gold'; break;
    case 'silver': m = M.metal('#cfd2d6', 0.18); break;
    case 'steel': m = M.metal(c, 0.38); break;
    case 'rust': m = new THREE.MeshStandardMaterial({ name: 'corten', color: '#8a4421', metalness: 0.35, roughness: 0.85 }); break;
    case 'wood': m = M.wood(color in M.WOODS ? color : c); break;
    case 'concrete': m = new THREE.MeshStandardMaterial({ name: 'concrete', color: c, roughness: 0.96 }); break;
    case 'glass': m = new THREE.MeshPhysicalMaterial({ name: 'glass', color: c, roughness: 0.05, metalness: 0, transmission: 0.85, thickness: 0.05, transparent: true, opacity: 0.55, clearcoat: 1, side: THREE.DoubleSide }); break;
    case 'pop': m = new THREE.MeshPhysicalMaterial({ name: 'pop', color: c, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }); break;
    case 'weathered': m = new THREE.MeshStandardMaterial({ name: 'weathered-stone', color: c, roughness: 0.98 }); break;
    case 'ceramic': m = new THREE.MeshPhysicalMaterial({ name: 'ceramic', color: c, roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.08 }); break;
    case 'clay': m = new THREE.MeshStandardMaterial({ name: 'clay', color: c, roughness: 0.9 }); break;
    case 'plastic': m = M.plastic(c, 0.4); break;
    case 'fabric': m = M.fabric(c); break;
    case 'leather': m = new THREE.MeshPhysicalMaterial({ name: 'leather', color: c, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.5 }); break;
    case 'paint': m = new THREE.MeshPhysicalMaterial({ name: 'paint', color: c, roughness: 0.4, clearcoat: 0.5 }); break;
    default: m = new THREE.MeshStandardMaterial({ name: 'stone', color: c, roughness: 0.7 });
  }
  _matCache.set(key, m);
  return m;
}
/** Main sculpture material of a trim. */
export const mainMat = (T) => fin(T, T.p);
/** Accent material: bronze patina, gold lacquer etc. */
export const accentMat = (T) => (T.finish === 'bronze' ? fin(T, T.a, 'stone') : T.finish === 'pop' ? fin(T, T.a, 'pop') : fin(T, T.a));

let _marble = null;
function marbleTex() {
  if (_marble || typeof document === 'undefined') return _marble;
  _marble = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = `rgba(110,105,100,${0.12 + r() * 0.25})`;
      g.lineWidth = 0.5 + r() * 2;
      g.beginPath();
      let x = r() * w, y = 0;
      g.moveTo(x, y);
      while (y < h) { x += (r() - 0.5) * 30; y += 8 + r() * 14; g.lineTo(x, y); }
      g.stroke();
    }
  });
  _marble.wrapS = _marble.wrapT = THREE.RepeatWrapping;
  return _marble;
}

/* ------------------------------ geometry utils ------------------------------ */

const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let out = 0;
  for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) for (let dz = 0; dz < 2; dz++) {
    out += hash3(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
  }
  return out;
}
export { vnoise };

/** Position-based noise displacement (seams stay closed: same position → same offset). */
export function roughen(geo, amount, freq = 18) {
  const pos = geo.attributes.position;
  const p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const n = vnoise(p.x * freq, p.y * freq, p.z * freq) - 0.5;
    const n2 = vnoise(p.x * freq + 31, p.y * freq + 17, p.z * freq + 5) - 0.5;
    const n3 = vnoise(p.x * freq + 7, p.y * freq + 51, p.z * freq + 23) - 0.5;
    pos.setXYZ(i, p.x + n * amount, p.y + n2 * amount, p.z + n3 * amount);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Apply the trim's surface treatment to a sculpture geometry (rough / facet). */
export function treat(geo, T, size = 0.3) {
  if (T.rough) roughen(geo, size * 0.05, 6 / size);
  if (T.facet) { const g = geo.index ? geo.toNonIndexed() : geo; g.computeVertexNormals(); return g; }
  return geo;
}

/** Ellipsoid (sphere scaled). */
export function ellipsoid(rx, ry, rz, ws = 24, hs = 16) {
  return new THREE.SphereGeometry(1, ws, hs).scale(rx, ry, rz);
}

/** Splits triangles whose longest edge exceeds maxEdge (needed for surface contact checks). */
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

/** Applies trim scale, shifts the model to rest on y = 0, densifies big faces, finalizes. */
export function done(root, type, variant, o, animations = [], T) {
  if (T && T.scale !== 1) {
    // scale the content (not the root, so options.scale still works)
    const holder = new THREE.Group();
    holder.name = 'scaled';
    while (root.children.length) holder.add(root.children[0]);
    holder.scale.setScalar(T.scale);
    root.add(holder);
  }
  root.updateMatrixWorld(true);
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.noShadow || m.userData.cap || m.userData.noDensify) return;
    const g = m.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    const ws = m.getWorldScale(new THREE.Vector3());
    const s = g.boundingBox.getSize(new THREE.Vector3()).multiply(ws);
    const dims = [s.x, s.y, s.z].sort((p, q) => q - p);
    if (dims[1] > 0.6 && g.attributes.position.count < 20000) m.geometry = densify(g, 0.25 / Math.max(1e-6, ws.length() / Math.sqrt(3)));
  });
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  root.traverse((m) => {
    if (!m.isMesh || m.userData.noShadow || m.material?.blending === THREE.AdditiveBlending) return;
    box.union(tmp.setFromObject(m, true));
  });
  for (const c of root.children) c.position.y -= box.min.y;
  root.updateMatrixWorld(true);
  const anims = typeof animations === 'function' ? animations() : animations;
  return finalize(root, { type, variant, options: o, animations: anims });
}

/* -------------------------------- canvases -------------------------------- */

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

/**
 * Plane w×h (faces +Z) painted by fn(u, v) → THREE.Color (u,v ∈ [0,1], v up).
 * Browser: per-pixel canvas texture. Node: vertex colours on a subdivided plane.
 */
export function paintedPlane(w, h, fn, { px = 160, seg = 20, rough = 0.6, emissive = 0 } = {}) {
  const ph = Math.max(16, Math.round((px * h) / w));
  const tex = canvasTex(px, ph, (g, cw, chh) => {
    const img = g.createImageData(cw, chh);
    for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
      const c = fn((x + 0.5) / cw, 1 - (y + 0.5) / chh);
      const i = (y * cw + x) * 4;
      img.data[i] = Math.max(0, Math.min(255, c.r * 255)); img.data[i + 1] = Math.max(0, Math.min(255, c.g * 255)); img.data[i + 2] = Math.max(0, Math.min(255, c.b * 255)); img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
  const sx = Math.max(2, Math.round(seg * Math.min(1, w / h))), sy = Math.max(2, Math.round(seg * Math.min(1, h / w)));
  const geo = new THREE.PlaneGeometry(w, h, sx, sy);
  let mat;
  if (tex) {
    mat = new THREE.MeshStandardMaterial({ name: 'canvas-art', map: tex, roughness: rough });
    if (emissive) { mat.emissive = new THREE.Color('#ffffff'); mat.emissiveMap = tex; mat.emissiveIntensity = emissive; }
  } else {
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const c = fn(Math.min(0.999, Math.max(0.001, pos.getX(i) / w + 0.5)), Math.min(0.999, Math.max(0.001, pos.getY(i) / h + 0.5)));
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    mat = new THREE.MeshStandardMaterial({ name: 'canvas-art', vertexColors: true, roughness: rough });
  }
  return new THREE.Mesh(geo, mat);
}

const C = (h) => new THREE.Color(h);
export const PALETTES = [
  ['#1d3557', '#e63946', '#f1faee', '#a8dadc', '#457b9d'],
  ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
  ['#0b132b', '#3a506b', '#5bc0be', '#ffffff', '#f2c14e'],
  ['#3d1f4f', '#b5179e', '#f72585', '#4cc9f0', '#fefae0'],
  ['#2b2d42', '#8d99ae', '#edf2f4', '#ef233c', '#d90429'],
  ['#5f0f40', '#9a031e', '#fb8b24', '#e36414', '#0f4c5c'],
  ['#283618', '#606c38', '#fefae0', '#dda15e', '#bc6c25'],
];
const POP = ['#ff2f6d', '#ffd400', '#1e8fff', '#111111', '#ffffff'];

/**
 * Procedural painting styles. Returns fn(u, v) → THREE.Color. Entirely generated in code.
 */
export function artFn(style, seed = 1, { pop = false } = {}) {
  const r = rng(`art-${style}-${seed}`);
  const pal = (pop ? POP : PALETTES[Math.floor(r() * PALETTES.length)]).map(C);
  const tmp = new THREE.Color();
  const mix = (a, b, t) => tmp.copy(a).lerp(b, Math.max(0, Math.min(1, t))).clone();
  const grain = (u, v, c, k = 0.05) => c.clone().multiplyScalar(1 + (vnoise(u * 90, v * 90, seed) - 0.5) * k * 2);
  switch (style) {
    case 'landscape': {
      const sky0 = C(pop ? '#ffd400' : '#f6c58f'), sky1 = C(pop ? '#1e8fff' : '#5d8fc9');
      const hills = [0, 1, 2].map((i) => ({ y: 0.5 - i * 0.12, a: r.range(0.03, 0.08), f: r.range(2, 6), ph: r() * 6, c: mix(C(pop ? '#ff2f6d' : '#6b8f5a'), C(pop ? '#111111' : '#2c4430'), i / 2) }));
      const sun = [r.range(0.2, 0.8), r.range(0.65, 0.85)];
      return (u, v) => {
        for (let i = hills.length - 1; i >= 0; i--) {
          const hl = hills[i];
          if (v < hl.y + hl.a * Math.sin(u * hl.f + hl.ph) + 0.02 * vnoise(u * 20, i, seed)) return grain(u, v, hl.c);
        }
        if (Math.hypot(u - sun[0], (v - sun[1]) * 1.1) < 0.07) return C(pop ? '#ffffff' : '#fff1c9');
        return grain(u, v, mix(sky0, sky1, (v - 0.4) / 0.6), 0.02);
      };
    }
    case 'sunset': {
      const bands = [C('#2a1b3d'), C('#a73d64'), C('#f0784a'), C('#ffcf6e')];
      return (u, v) => {
        const m = 0.25 + 0.1 * Math.sin(u * 7 + seed) + 0.05 * Math.sin(u * 19);
        if (v < m) return C('#1a1424');
        if (v < 0.3) return mix(C('#3a2a4a'), C('#f0784a'), 0.3 + 0.2 * Math.sin(u * 60 + v * 30));
        if (Math.hypot(u - 0.5, v - 0.42) < 0.12) return C('#ffe39a');
        const t = Math.min(0.999, Math.max(0, 1 - (v - 0.3) / 0.7));
        const i = Math.min(2, Math.floor(t * 3));
        return grain(u, v, mix(bands[i], bands[i + 1], t * 3 - i), 0.03);
      };
    }
    case 'seascape': {
      return (u, v) => {
        if (v > 0.55) return grain(u, v, mix(C('#d9ecf2'), C('#5aa0c8'), (v - 0.55) / 0.45), 0.02);
        const w = Math.sin(u * 40 + Math.sin(v * 30) * 2 + v * 80);
        const base = mix(C('#0f3d5e'), C('#2f7ea6'), v / 0.55);
        return w > 0.85 ? C('#e8f4f8') : grain(u, v, base, 0.04);
      };
    }
    case 'night-sky': {
      const moon = [r.range(0.6, 0.85), r.range(0.7, 0.85)];
      return (u, v) => {
        if (Math.hypot(u - moon[0], v - moon[1]) < 0.07) return C('#f6edc4');
        const sw = Math.sin(Math.hypot(u - 0.4, v - 0.6) * 40 + Math.atan2(v - 0.6, u - 0.4) * 3);
        if (v < 0.22 + 0.06 * Math.sin(u * 9)) return C('#111a2c');
        if (hash3(Math.floor(u * 120), Math.floor(v * 120), seed) > 0.992) return C('#fffbe0');
        return grain(u, v, mix(C('#0c1a46'), C('#2c4fa0'), 0.5 + 0.3 * sw), 0.05);
      };
    }
    case 'geometric': {
      const n = 4 + Math.floor(r() * 3);
      const cells = Array.from({ length: n * n }, () => ({ k: Math.floor(r() * 4), rot: Math.floor(r() * 4), a: pal[Math.floor(r() * 5)], b: pal[Math.floor(r() * 5)] }));
      return (u, v) => {
        const cx = Math.max(0, Math.min(n - 1, Math.floor(u * n))), cy = Math.max(0, Math.min(n - 1, Math.floor(v * n)));
        let x = u * n - cx, y = v * n - cy;
        const c = cells[cy * n + cx];
        for (let i = 0; i < c.rot; i++) [x, y] = [y, 1 - x];
        if (Math.min(x, y, 1 - x, 1 - y) < 0.03) return C('#1a1a1a');
        const inside = c.k === 0 ? Math.hypot(x, y) < 1 : c.k === 1 ? x > y : c.k === 2 ? Math.hypot(x - 0.5, y - 0.5) < 0.35 : (x < 0.5) !== (y < 0.5);
        return inside ? c.a : c.b;
      };
    }
    case 'color-field': {
      const bands = [0, 1, 2].map(() => pal[Math.floor(r() * 5)]);
      const bg = pal[Math.floor(r() * 5)];
      return (u, v) => {
        const edge = 0.06 + 0.02 * vnoise(u * 12, v * 12, seed);
        if (u < edge || u > 1 - edge) return grain(u, v, bg, 0.06);
        const t = v * 3, i = Math.min(2, Math.floor(t)), f = t - i;
        if (f < 0.07 || f > 0.93) return grain(u, v, bg, 0.06);
        return grain(u, v, bands[i], 0.08);
      };
    }
    case 'dots': {
      const n = 14;
      return (u, v) => {
        const cx = (Math.floor(u * n) + 0.5) / n, cy = (Math.floor(v * n) + 0.5) / n;
        const rad = (0.15 + 0.35 * (1 - Math.hypot(cx - 0.5, cy - 0.5) * 1.4)) / n;
        if (Math.hypot(u - cx, v - cy) < rad) return pal[(Math.floor(u * n) + Math.floor(v * n)) % 2 ? 1 : 3];
        return pal[pop ? 1 : 2];
      };
    }
    case 'stripes': {
      const ws = Array.from({ length: 12 }, () => r.range(0.4, 1.6));
      const tot = ws.reduce((a, b) => a + b, 0);
      return (u, v) => {
        let t = ((u + v * 0.5) / 1.5) * tot, i = 0;
        while (i < 11 && t > ws[i]) { t -= ws[i]; i++; }
        return grain(u, v, pal[i % 5], 0.05);
      };
    }
    case 'still-life': {
      return (u, v) => {
        if (v < 0.25) return grain(u, v, C('#7a4b2a'), 0.06);
        const vase = Math.abs(u - 0.5) < 0.09 + 0.06 * Math.sin((v - 0.25) * 9) && v < 0.55;
        if (vase) return mix(pal[0], pal[4], u * 2 - 0.6);
        for (let i = 0; i < 6; i++) {
          const fx = 0.5 + Math.cos(i * 1.1 + seed) * 0.16, fy = 0.66 + Math.sin(i * 1.7) * 0.1;
          if (Math.hypot(u - fx, v - fy) < 0.06) return mix(pal[1 + (i % 3)], C('#ffffff'), 0.15);
        }
        if (Math.hypot(u - 0.22, v - 0.31) < 0.06) return C('#d7432b');
        return grain(u, v, mix(C('#3c3a35'), C('#6d6458'), u), 0.08);
      };
    }
    case 'portrait': {
      return (u, v) => {
        const fx = (u - 0.5) / 0.22, fy = (v - 0.58) / 0.3;
        if (fx * fx + fy * fy < 1) {
          const side = u < 0.5 ? pal[1] : pal[3];
          if (Math.hypot(u - 0.42, v - 0.64) < 0.03 || Math.hypot(u - 0.58, v - 0.62) < 0.035) return C('#151515');
          if (Math.abs(v - 0.45) < 0.012 && Math.abs(u - 0.5) < 0.07) return C('#9a1f2b');
          return grain(u, v, side, 0.08);
        }
        if (v < 0.25 && Math.abs(u - 0.5) < 0.35) return pal[0];
        return grain(u, v, mix(pal[2], pal[4], v), 0.06);
      };
    }
    default: { // abstract: soft blobs + gestural strokes
      const blobs = Array.from({ length: 7 }, () => ({ x: r(), y: r(), rad: r.range(0.1, 0.3), c: pal[Math.floor(r() * 5)] }));
      const strokes = Array.from({ length: 4 }, () => ({ a: r() * Math.PI, o: r(), c: pal[Math.floor(r() * 5)], w: r.range(0.01, 0.03) }));
      const bg = pal[Math.floor(r() * 5)];
      return (u, v) => {
        for (const s of strokes) {
          const d = Math.abs((u - 0.5) * Math.sin(s.a) - (v - 0.5) * Math.cos(s.a) - (s.o - 0.5) * 0.6 + 0.03 * Math.sin(u * 20 + v * 13));
          if (d < s.w) return s.c;
        }
        for (const b of blobs) {
          const d = Math.hypot(u - b.x, v - b.y) + (vnoise(u * 8, v * 8, seed) - 0.5) * 0.12;
          if (d < b.rad) return grain(u, v, b.c, 0.07);
        }
        return grain(u, v, bg, 0.06);
      };
    }
  }
}
export const ART_STYLES = ['abstract', 'landscape', 'geometric', 'color-field', 'seascape', 'sunset', 'night-sky', 'dots', 'stripes', 'still-life', 'portrait'];

/* -------------------------------- plinths -------------------------------- */

/**
 * Trim-dependent pedestal under a sculpture of footprint `w`. Returns top y.
 * style from T.plinth: block | column | stepped | slender | log | cube | acrylic | drum | rock | disc | tall | none
 */
export function plinthBase(root, T, w, opts = {}) {
  const top = plinthBody(root, T, w, opts);
  const g = root.getObjectByName('plinth');
  const style = opts.style ?? T.plinth;
  if (style !== 'none') {
    const round = ['column', 'drum', 'log', 'disc', 'rock'].includes(style);
    const size = { column: w * 0.92, drum: w * 1.2, log: w * 1.25, disc: w * 1.3, rock: w * 0.95, stepped: w * 0.9, slender: w * 0.7, cube: w * 1.2, acrylic: w * 1.05, tall: w * 1.3 }[style] ?? w;
    capTop(g, size, top, round);
  }
  return top;
}

/** Evenly tessellated invisible-thin top cap (flush) so surface-contact checks find things resting on it. */
export function capTop(parent, size, y, round = false, mat, depth = size) {
  const geo = round ? new THREE.RingGeometry(0, size / 2, 32, Math.max(2, Math.ceil(size / 2 / 0.05))) : new THREE.PlaneGeometry(size, depth, Math.max(2, Math.ceil(size / 0.06)), Math.max(2, Math.ceil(depth / 0.06)));
  geo.rotateX(-Math.PI / 2);
  const m = mesh(geo, mat ?? new THREE.MeshStandardMaterial({ name: 'cap', color: '#000000', transparent: true, opacity: 0, depthWrite: false }), { parent, at: [0, y + 0.0004, 0], name: 'cap' });
  m.userData.cap = true;
  return m;
}

function plinthBody(root, T, w, { style = T.plinth, h } = {}) {
  const g = group('plinth', { parent: root });
  switch (style) {
    case 'none': return 0;
    case 'column': {
      const H = h ?? w * 2.2;
      const prof = [[0, 0], [w * 0.62, 0], [w * 0.62, H * 0.06], [w * 0.56, H * 0.08], [w * 0.58, H * 0.11], [w * 0.48, H * 0.14], [w * 0.46, H * 0.86], [w * 0.56, H * 0.9], [w * 0.54, H * 0.93], [w * 0.62, H * 0.95], [w * 0.62, H], [0, H]];
      mesh(lathe(prof, 40), fin(T, '#efebe4', 'marble'), { parent: g });
      return H;
    }
    case 'stepped': {
      const st = fin(T, '#3b3a3c', 'stone');
      const H = h ?? w * 0.9;
      mesh(roundedBox(w * 1.3, H * 0.25, w * 1.3, 0.01), st, { parent: g, at: [0, H * 0.125, 0] });
      mesh(roundedBox(w * 1.1, H * 0.5, w * 1.1, 0.01), st, { parent: g, at: [0, H * 0.25 + H * 0.25 - 0.001, 0] });
      mesh(roundedBox(w * 0.95, H * 0.25, w * 0.95, 0.01), st, { parent: g, at: [0, H * 0.875 - 0.002, 0] });
      return H - 0.003;
    }
    case 'slender': {
      const H = h ?? w * 3.2;
      const lac = new THREE.MeshPhysicalMaterial({ name: 'lacquer', color: '#121214', roughness: 0.15, clearcoat: 1 });
      mesh(roundedBox(w * 0.9, w * 0.08, w * 0.9, 0.008), lac, { parent: g, at: [0, w * 0.04, 0] });
      mesh(roundedBox(w * 0.55, H - w * 0.14, w * 0.55, 0.01), lac, { parent: g, at: [0, w * 0.08 + (H - w * 0.14) / 2 - 0.001, 0] });
      mesh(roundedBox(w * 0.75, w * 0.06, w * 0.75, 0.006), fin(T, '#d9ab3f', 'gold'), { parent: g, at: [0, H - w * 0.03 - 0.002, 0] });
      return H - 0.003;
    }
    case 'log': {
      const H = h ?? w * 0.55;
      const geo = new THREE.CylinderGeometry(w * 0.7, w * 0.75, H, 18, 3);
      roughen(geo, w * 0.03, 8 / w);
      mesh(geo, fin(T, 'oak', 'wood'), { parent: g, at: [0, H / 2, 0] });
      mesh(new THREE.CylinderGeometry(w * 0.66, w * 0.66, 0.004, 32), fin(T, '#d9b98a', 'wood'), { parent: g, at: [0, H + 0.001, 0] });
      return H;
    }
    case 'cube': {
      const H = h ?? w * 1.2;
      mesh(roundedBox(w * 1.25, H, w * 1.25, 0.006), fin(T, '#8d8a85', 'concrete'), { parent: g, at: [0, H / 2, 0] });
      return H;
    }
    case 'acrylic': {
      const H = h ?? w * 0.5;
      mesh(roundedBox(w * 1.1, H, w * 1.1, 0.012), fin(T, '#e8f2f6', 'glass'), { parent: g, at: [0, H / 2, 0] });
      mesh(roundedBox(w * 1.14, 0.01, w * 1.14, 0.004), M.plastic('#f5f5f5', 0.3), { parent: g, at: [0, 0.005, 0] });
      return H;
    }
    case 'drum': {
      const H = h ?? w * 0.7;
      mesh(new THREE.CylinderGeometry(w * 0.65, w * 0.65, H, 40), fin(T, '#ffd400', 'pop'), { parent: g, at: [0, H / 2, 0] });
      for (const [y, c] of [[H * 0.18, '#1e8fff'], [H * 0.82, '#ff2f6d']]) mesh(new THREE.TorusGeometry(w * 0.65, H * 0.06, 8, 40).rotateX(Math.PI / 2), fin(T, c, 'pop'), { parent: g, at: [0, y, 0] });
      return H;
    }
    case 'rock': {
      const H = h ?? w * 0.6;
      const geo = new THREE.IcosahedronGeometry(1, 3).scale(w * 0.8, H * 0.75, w * 0.75);
      roughen(geo, w * 0.12, 3 / w);
      const rm = mesh(geo, fin(T, '#6f685d', 'weathered'), { parent: g, at: [0, H * 0.4, 0] });
      void rm;
      mesh(new THREE.CylinderGeometry(w * 0.5, w * 0.6, H * 0.3, 14), fin(T, '#6f685d', 'weathered'), { parent: g, at: [0, H * 0.85, 0] });
      return H;
    }
    case 'disc': {
      mesh(lathe([[0, 0], [w * 0.7, 0], [w * 0.72, 0.012], [w * 0.68, 0.025], [0, 0.025]], 40), fin(T, '#1a1a1c', 'pop'), { parent: g });
      return 0.024;
    }
    case 'tall': {
      const H = h ?? w * 3.5;
      const st = fin(T, '#d8d3ca', 'stone');
      mesh(roundedBox(w * 1.5, H * 0.08, w * 1.5, 0.01), st, { parent: g, at: [0, H * 0.04, 0] });
      mesh(roundedBox(w * 1.2, H * 0.84, w * 1.2, 0.01), st, { parent: g, at: [0, H * 0.08 + H * 0.42 - 0.002, 0] });
      mesh(roundedBox(w * 1.4, H * 0.08, w * 1.4, 0.01), st, { parent: g, at: [0, H * 0.96 - 0.004, 0] });
      return H - 0.005;
    }
    default: {
      const H = h ?? w * 0.35;
      mesh(roundedBox(w * 1.05, H, w * 1.05, Math.min(0.012, H * 0.2)), fin(T, '#d8d3ca', 'stone'), { parent: g, at: [0, H / 2, 0] });
      return H;
    }
  }
}
