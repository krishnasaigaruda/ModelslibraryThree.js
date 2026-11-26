// Shared helpers for the fashion category: fabric trims, canvas fabric patterns, parametric
// surfaces (garments, shoe uppers), tapered tubes (sleeves, legs, straps), hangers and the
// "settle on the ground" wrapper every factory uses.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { smoothKeys } from '../../core/loft.js';

export { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant, smoothKeys };

/*
 * Fabric trims: material + pattern + cut. Every garment / hat / bag builder reads
 *   fab (material family), c / c2 / c3 (colours), len (length ×), wid (width ×),
 *   sleeve (sleeve length 0..1), flare (hem flare ×), crop, loose …
 */
export const FABRIC_TRIMS = {
  denim: { fab: 'denim', c: '#2f4d7a', c2: '#d9a441', len: 1, wid: 0.97, stitch: true },
  leather: { fab: 'leather', c: '#17171a', c2: '#b9bcc2', len: 0.9, wid: 0.95, sleeve: 1, slim: true },
  wool: { fab: 'wool', c: '#5d5f63', c2: '#3c3d40', len: 1.15, wid: 1.04, thick: true },
  silk: { fab: 'silk', c: '#e9d6b4', c2: '#c7a76a', len: 1.12, wid: 1, flare: 1.25, flowing: true },
  plaid: { fab: 'plaid', c: '#a3202a', c2: '#1d2230', c3: '#e8c547', len: 1.02, wid: 1.12, loose: true },
  stripes: { fab: 'stripes', c: '#f3efe6', c2: '#1f2d55', len: 0.84, wid: 1, crop: true, sleeve: 0.75 },
  floral: { fab: 'floral', c: '#f6dfe4', c2: '#d4507a', c3: '#5e9a52', len: 1, wid: 1, flare: 1.35, sleeve: 0.3 },
  polka: { fab: 'polka', c: '#c3242f', c2: '#fbf6ee', len: 0.95, wid: 1, flare: 1.5, sleeve: 0.25 },
  velvet: { fab: 'velvet', c: '#155c45', c2: '#c9a24a', len: 1.2, wid: 1, flare: 1.1 },
  linen: { fab: 'linen', c: '#d8c8a6', c2: '#8f7a55', len: 1.05, wid: 1.1, loose: true, sleeve: 0.6 },
  knit: { fab: 'knit', c: '#d39a2b', c2: '#b67f1c', len: 1.05, wid: 1.08, thick: true, chunky: true },
  neon: { fab: 'neon', c: '#b8ff1f', c2: '#ff2fa0', len: 0.92, wid: 0.98, sport: true },
};
export const FABRICS = Object.keys(FABRIC_TRIMS);

/** Resolve options → { o, variant, trim, T, V }. `trims` = table of trim specs for this type. */
export function setup(options, VARIANTS, type, trims = FABRIC_TRIMS) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VARIANTS, o.variant, type);
  const trim = o.trim && trims[o.trim] ? o.trim : null;
  const V = VARIANTS[variant] || {};
  const T = { len: 1, wid: 1, sleeve: 1, flare: 1, fab: 'cotton', ...V, ...(trim ? trims[trim] : {}), trim };
  if (!trim && o.color) T.c = o.color;
  T.r = rng(`${type}-${variant}-${trim}`);
  return { o, variant, trim, T, V };
}

/* -------------------------------- canvas -------------------------------- */

export function canvasTex(w, h, draw, { repeat } = {}) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

const _patCache = new Map();
/** Tileable fabric pattern canvas (256²) for a fabric family. Returns a texture or null (Node). */
export function patternTex(fab, c, c2, c3, repeat = [1, 1]) {
  if (typeof document === 'undefined') return null;
  const key = `${fab}|${c}|${c2}|${c3}`;
  let base = _patCache.get(key);
  if (!base) {
    const r = rng(key);
    base = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = c;
      g.fillRect(0, 0, w, h);
      const noise = (n, a, col = '#ffffff') => {
        g.fillStyle = col;
        for (let i = 0; i < n; i++) { g.globalAlpha = r() * a; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
        g.globalAlpha = 1;
      };
      if (fab === 'denim') {
        g.strokeStyle = 'rgba(255,255,255,0.13)';
        g.lineWidth = 1.2;
        for (let i = -h; i < w; i += 4) { g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); }
        noise(2500, 0.18);
        noise(1500, 0.2, '#0b1326');
      } else if (fab === 'plaid') {
        const band = (pos, wd, col, a, vert) => { g.globalAlpha = a; g.fillStyle = col; vert ? g.fillRect(pos, 0, wd, h) : g.fillRect(0, pos, w, wd); };
        for (const v of [false, true]) {
          band(0, 64, c2, 0.55, v); band(128, 64, c2, 0.55, v);
          band(96, 8, c3, 0.8, v); band(224, 8, c3, 0.8, v);
          band(40, 4, '#ffffff', 0.35, v); band(168, 4, '#ffffff', 0.35, v);
        }
        g.globalAlpha = 1;
        noise(1500, 0.12, '#000000');
      } else if (fab === 'stripes') {
        g.fillStyle = c2;
        for (let y = 0; y < h; y += 32) g.fillRect(0, y, w, 12);
        noise(800, 0.08, '#000000');
      } else if (fab === 'floral') {
        for (let i = 0; i < 14; i++) {
          const x = r() * w, y = r() * h, s = 9 + r() * 9;
          for (const [dx, dy] of [[0, 0], [w, 0], [-w, 0], [0, h], [0, -h]]) {
            g.fillStyle = c3;
            g.beginPath(); g.ellipse(x + dx + s * 1.3, y + dy + s * 0.6, s * 0.7, s * 0.3, 0.6, 0, Math.PI * 2); g.fill();
            g.fillStyle = c2;
            for (let k = 0; k < 5; k++) {
              const a = (k / 5) * Math.PI * 2;
              g.beginPath(); g.arc(x + dx + Math.cos(a) * s * 0.55, y + dy + Math.sin(a) * s * 0.55, s * 0.48, 0, Math.PI * 2); g.fill();
            }
            g.fillStyle = '#f2c94c';
            g.beginPath(); g.arc(x + dx, y + dy, s * 0.3, 0, Math.PI * 2); g.fill();
          }
        }
      } else if (fab === 'polka') {
        g.fillStyle = c2;
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
          g.beginPath(); g.arc(x * 32 + (y % 2) * 16 + 8, y * 32 + 16, 6.5, 0, Math.PI * 2); g.fill();
        }
      } else if (fab === 'knit') {
        g.strokeStyle = c2;
        g.lineWidth = 3;
        for (let x = 0; x < w; x += 16) for (let y = 0; y < h; y += 12) {
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + 10); g.lineTo(x + 16, y); g.stroke();
        }
        g.fillStyle = 'rgba(0,0,0,0.18)';
        for (let x = 0; x < w; x += 64) g.fillRect(x + 28, 0, 8, h);
      } else if (fab === 'wool' || fab === 'linen') {
        noise(fab === 'wool' ? 6000 : 3000, 0.25, c2);
        noise(3000, 0.15);
        if (fab === 'linen') {
          g.strokeStyle = 'rgba(0,0,0,0.06)';
          for (let i = 0; i < w; i += 3) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
        }
      } else if (fab === 'neon') {
        g.fillStyle = c2;
        g.fillRect(0, 0, w, 20);
        g.fillRect(0, 128, w, 8);
      } else if (fab === 'leather' || fab === 'suede') {
        noise(5000, 0.12, '#000000');
        noise(1500, 0.08);
      } else if (fab === 'tortoise') {
        for (let i = 0; i < 70; i++) {
          g.fillStyle = r() < 0.5 ? c2 : c3;
          g.globalAlpha = 0.35 + r() * 0.5;
          g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 22, 4 + r() * 12, r() * 3, 0, Math.PI * 2); g.fill();
        }
        g.globalAlpha = 1;
      } else if (fab === 'snake') {
        g.strokeStyle = c2;
        g.lineWidth = 2;
        for (let y = 0; y < h + 16; y += 16) for (let x = 0; x < w + 16; x += 16) {
          g.beginPath(); g.ellipse(x + (y % 32 ? 8 : 0), y, 8, 7, 0, 0, Math.PI * 2); g.stroke();
        }
      } else {
        noise(1500, 0.08, '#000000');
      }
    });
    _patCache.set(key, base);
  }
  const t = base.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.needsUpdate = true;
  return t;
}

/** Material for a fabric family (cotton, denim, leather, silk …). */
export function fabricMat(fab, c, { c2 = '#ffffff', c3 = '#ffd23f', repeat = [3, 3], side = THREE.DoubleSide, plain = false } = {}) {
  const tex = plain ? null : patternTex(fab, M.toColor(c).getStyle(), M.toColor(c2).getStyle(), M.toColor(c3).getStyle(), repeat);
  const col = tex ? new THREE.Color('#ffffff') : M.toColor(c);
  const base = { color: col, map: tex, side };
  switch (fab) {
    case 'leather': return new THREE.MeshPhysicalMaterial({ name: 'leather', ...base, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35 });
    case 'tortoise':
    case 'patent': return new THREE.MeshPhysicalMaterial({ name: 'patent', ...base, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03 });
    case 'suede': return new THREE.MeshPhysicalMaterial({ name: 'suede', ...base, roughness: 1, sheen: 0.8, sheenRoughness: 0.8, sheenColor: M.toColor(c).lerp(new THREE.Color('#fff'), 0.4) });
    case 'silk': return new THREE.MeshPhysicalMaterial({ name: 'silk', ...base, roughness: 0.33, sheen: 1, sheenRoughness: 0.25, sheenColor: M.toColor(c).lerp(new THREE.Color('#fff'), 0.6) });
    case 'velvet': return new THREE.MeshPhysicalMaterial({ name: 'velvet', ...base, roughness: 1, sheen: 1, sheenRoughness: 0.35, sheenColor: M.toColor(c).lerp(new THREE.Color('#fff'), 0.45) });
    case 'neon': return new THREE.MeshPhysicalMaterial({ name: 'neon', ...base, roughness: 0.45, emissive: M.toColor(c), emissiveIntensity: 0.22, clearcoat: 0.3 });
    case 'metallic': return new THREE.MeshPhysicalMaterial({ name: 'metallic', ...base, metalness: 0.85, roughness: 0.25, clearcoat: 0.6 });
    case 'straw': return new THREE.MeshStandardMaterial({ name: 'straw', ...base, roughness: 0.85 });
    case 'canvas': return new THREE.MeshPhysicalMaterial({ name: 'canvas', ...base, roughness: 0.95, sheen: 0.3 });
    default: return new THREE.MeshPhysicalMaterial({ name: 'fabric', ...base, roughness: 0.92, sheen: 0.7, sheenRoughness: 0.6, sheenColor: M.toColor(c).lerp(new THREE.Color('#fff'), 0.3) });
  }
}

/** Main fabric material of a trim (T.fab / T.c / T.c2 / T.c3). */
export const mainMat = (T, repeat, extra = {}) => fabricMat(T.fab, T.c, { c2: T.c2, c3: T.c3, repeat, ...extra });

/** Gem material (transmission + ior). */
export function gemMat(color, { ior = 2.42, dispersion = 0.6 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    name: 'gem', color: M.toColor(color), metalness: 0, roughness: 0, transmission: 1, thickness: 0.004, ior,
    dispersion, specularIntensity: 1, clearcoat: 1, attenuationColor: M.toColor(color), attenuationDistance: 0.01, flatShading: true,
  });
}
export const PRECIOUS = {
  gold: () => M.metal('#e0b44c', 0.18),
  'rose-gold': () => M.metal('#e3a587', 0.2),
  silver: () => M.metal('#d8dade', 0.16),
  platinum: () => M.metal('#c9ccd1', 0.12),
  black: () => M.metal('#2a2a2e', 0.3),
};

/* ------------------------------ geometry ------------------------------- */

/**
 * Parametric grid surface. fn(u, v) → [x, y, z], u,v ∈ [0,1]. closedU averages the seam normals.
 */
export function paramGeo(fn, nu = 32, nv = 24, { closedU = false } = {}) {
  const pos = [];
  const uv = [];
  const idx = [];
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const v = j / nv;
      pos.push(...fn(u, v));
      uv.push(u, 1 - v);
    }
  }
  const row = nu + 1;
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * row + i;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  if (closedU) {
    const n = g.attributes.normal;
    for (let j = 0; j <= nv; j++) {
      const a = j * row;
      const b = a + nu;
      const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
      const l = Math.hypot(x, y, z) || 1;
      n.setXYZ(a, x / l, y / l, z / l);
      n.setXYZ(b, x / l, y / l, z / l);
    }
  }
  return g;
}

/**
 * Tube with varying radius along a smooth curve. radius: number | [r0, r1] | fn(t).
 * flat squashes the ring along the binormal (ribbons, flattened sleeves), roll rotates the ring.
 */
export function taperTube(points, radius, { seg = 24, radial = 14, flat = 1, up = [0, 0, 1], side, caps = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const rf = typeof radius === 'function' ? radius : Array.isArray(radius) ? (t) => radius[0] + (radius[1] - radius[0]) * t : () => radius;
  const U = new THREE.Vector3(...up).normalize();
  const S = side ? new THREE.Vector3(...side).normalize() : null;
  const P = [];
  const N = [];
  const B = [];
  for (let j = 0; j <= seg; j++) {
    const t = j / seg;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    let b = S ? S.clone().addScaledVector(tan, -S.dot(tan)) : new THREE.Vector3().crossVectors(tan, U);
    if (b.lengthSq() < 1e-6) b = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(1, 0, 0));
    b.normalize();
    const n = new THREE.Vector3().crossVectors(b, tan).normalize();
    P.push(p); N.push(n); B.push(b);
  }
  const g = paramGeo((u, v) => {
    const j = Math.round(v * seg);
    const a = u * Math.PI * 2;
    const r = rf(v);
    const p = P[j].clone().addScaledVector(B[j], Math.cos(a) * r).addScaledVector(N[j], Math.sin(a) * r * flat);
    return [p.x, p.y, p.z];
  }, radial, seg, { closedU: true });
  if (caps) {
    const parts = [g];
    for (const e of [0, 1]) {
      const r = rf(e);
      if (r <= 1e-4) continue;
      const s = new THREE.SphereGeometry(r, radial, 8);
      s.scale(1, 1, 1);
      const p = P[e * seg];
      s.translate(p.x, p.y, p.z);
      parts.push(s);
    }
    return mergeGeos(parts);
  }
  return g;
}

/** Merge geometries (position/normal/uv only). */
export function mergeGeos(geos) {
  const list = geos.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    if (!n.attributes.normal) n.computeVertexNormals();
    return n;
  });
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    const size = list[0].attributes[name].itemSize;
    const total = list.reduce((s, g) => s + g.attributes[name].count, 0);
    const arr = new Float32Array(total * size);
    let off = 0;
    for (const g of list) { arr.set(g.attributes[name].array, off); off += g.attributes[name].array.length; }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  return out;
}

/** Superellipse helpers: signed power. */
export const spow = (x, p) => Math.sign(x) * Math.abs(x) ** p;

/** Brilliant-cut gem (table up), radius r, flat facets. */
export function gemGeo(r, { cut = 'round', facets = 8 } = {}) {
  if (cut === 'emerald') {
    const g = new THREE.CylinderGeometry(r * 0.7, r * 0.5, r * 0.9, 4, 1);
    g.rotateY(Math.PI / 4);
    g.scale(1, 1, 0.75);
    return g;
  }
  if (cut === 'pearl') return new THREE.SphereGeometry(r, 20, 14);
  const prof = [[0, -r * 0.86], [r, -0.02 * r], [r, 0.04 * r], [r * 0.56, r * 0.38], [0, r * 0.38]];
  const g = lathe(prof, facets * 2);
  if (cut === 'heart' || cut === 'pear') g.scale(1, 1, 1.3);
  if (cut === 'oval') g.scale(1, 1, 1.35);
  g.computeVertexNormals();
  return g;
}

/* ------------------------------ fixtures ------------------------------- */

/**
 * Coat hanger hanging from a hook point at (0,0,0) (top of hook). Shoulders span ±w/2
 * at y ≈ -0.11. kind: 'wood' | 'plastic' | 'wire' | 'clip' (trousers / skirts).
 * Returns { g, shoulderY, barY } in local coords.
 */
export function hanger(parent, { w = 0.42, kind = 'wood', mat, at = [0, 0, 0], rotY = 0 } = {}) {
  const g = group('hanger', { parent, at, rot: [0, rotY, 0] });
  const hookM = M.chrome();
  const bodyM = mat ?? (kind === 'wood' ? M.wood('#a3734a') : kind === 'plastic' ? M.plastic('#1b1b1d', 0.4) : kind === 'clip' ? M.plastic('#202022', 0.4) : M.metal('#b8bcc2', 0.3));
  // hook: hooks over a rail at y=0 (the rail axis); the top of the curl touches the rail top
  curveTube([[0, -0.07, 0], [0, -0.035, 0], [0.012, 0.0, 0], [0.0, 0.022, 0], [-0.018, 0.012, 0], [-0.022, -0.005, 0]], 0.0025, hookM, { parent: g, segments: 24, radialSegments: 8 });
  const sy = -0.11;
  if (kind === 'clip') {
    mesh(roundedBox(w * 0.85, 0.022, 0.012, 0.005), bodyM, { parent: g, at: [0, -0.075, 0] });
    for (const s of [-1, 1]) {
      mesh(roundedBox(0.03, 0.045, 0.02, 0.005), bodyM, { parent: g, at: [s * w * 0.36, -0.105, 0] });
    }
    return { g, shoulderY: -0.128, barY: -0.128, clip: true };
  }
  const r = kind === 'wire' ? 0.0022 : kind === 'wood' ? 0.009 : 0.006;
  const th = kind === 'wood' ? 1.6 : 1;
  curveTube([[-w / 2, sy, 0], [-w * 0.3, sy + 0.02, 0], [0, -0.07, 0], [w * 0.3, sy + 0.02, 0], [w / 2, sy, 0]], r * th, bodyM, { parent: g, segments: 40, radialSegments: 10 });
  mesh(new THREE.SphereGeometry(r * th, 10, 8), bodyM, { parent: g, at: [-w / 2, sy, 0] });
  mesh(new THREE.SphereGeometry(r * th, 10, 8), bodyM, { parent: g, at: [w / 2, sy, 0] });
  if (kind !== 'plastic') curveTube([[-w / 2, sy, 0], [-w * 0.45, sy - 0.03, 0], [0, sy - 0.035, 0], [w * 0.45, sy - 0.03, 0], [w / 2, sy, 0]], kind === 'wood' ? 0.005 : r, kind === 'wood' ? M.wood('#a3734a') : bodyM, { parent: g, segments: 30, radialSegments: 8 });
  return { g, shoulderY: sy - r * th * 0.5, barY: sy - 0.035 };
}

/* -------------------------------- finish -------------------------------- */

/** Splits triangles whose longest edge exceeds maxEdge, so big flat faces get evenly spaced vertices. */
export function densify(geo, maxEdge) {
  const pos0 = geo.attributes.position.array;
  const ix = geo.index ? geo.index.array : null;
  const triN = ix ? ix.length / 3 : pos0.length / 9;
  const m2 = maxEdge * maxEdge;
  const d2 = (i, j) => { const dx = pos0[i * 3] - pos0[j * 3], dy = pos0[i * 3 + 1] - pos0[j * 3 + 1], dz = pos0[i * 3 + 2] - pos0[j * 3 + 2]; return dx * dx + dy * dy + dz * dz; };
  let need = false;
  for (let t = 0; t < triN && !need; t++) {
    const a = ix ? ix[t * 3] : t * 3, b = ix ? ix[t * 3 + 1] : t * 3 + 1, c = ix ? ix[t * 3 + 2] : t * 3 + 2;
    if (d2(a, b) > m2 || d2(b, c) > m2 || d2(c, a) > m2) need = true;
  }
  if (!need) return geo;
  const g = geo.index ? geo.toNonIndexed() : geo;
  const names = Object.keys(g.attributes).filter((n) => !g.attributes[n].isInterleavedBufferAttribute);
  const src = names.map((n) => g.attributes[n]);
  const sizes = src.map((a) => a.itemSize);
  const stride = sizes.reduce((x, y) => x + y, 0);
  const out = [];
  const pos = g.attributes.position;
  const vert = (i) => { const v = new Array(stride); let o = 0; for (let k = 0; k < src.length; k++) { const a = src[k].array, sz = sizes[k]; for (let q = 0; q < sz; q++) v[o++] = a[i * sz + q]; } return v; };
  const pi = names.indexOf('position');
  const po = sizes.slice(0, pi).reduce((x, y) => x + y, 0);
  const e2 = (u, v) => { const dx = u[po] - v[po], dy = u[po + 1] - v[po + 1], dz = u[po + 2] - v[po + 2]; return dx * dx + dy * dy + dz * dz; };
  const split = (p, q, r, depth) => {
    const e = [e2(p, q), e2(q, r), e2(r, p)];
    const m = Math.max(e[0], e[1], e[2]);
    if (m <= m2 || depth > 12) { out.push(p, q, r); return; }
    const i = e.indexOf(m);
    const tri = [p, q, r];
    const A = tri[i], B = tri[(i + 1) % 3], C = tri[(i + 2) % 3];
    const Mv = A.map((x, k) => (x + B[k]) / 2);
    split(A, Mv, C, depth + 1);
    split(Mv, B, C, depth + 1);
  };
  for (let t = 0; t < pos.count; t += 3) split(vert(t), vert(t + 1), vert(t + 2), 0);
  const res = new THREE.BufferGeometry();
  let o = 0;
  names.forEach((n, k) => {
    const sz = sizes[k];
    const arr = new Float32Array(out.length * sz);
    for (let i = 0; i < out.length; i++) for (let q = 0; q < sz; q++) arr[i * sz + q] = out[i][o + q];
    o += sz;
    res.setAttribute(n, new THREE.BufferAttribute(arr, sz));
  });
  return res;
}

/** Shifts the model so it rests on y = 0, densifies big flat faces, then finalizes. */
export function done(root, type, variant, o, animations = []) {
  root.updateMatrixWorld(true);
  const ws = new THREE.Vector3();
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.noShadow) return;
    const g = m.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    m.getWorldScale(ws);
    const s = g.boundingBox.getSize(new THREE.Vector3()).multiply(ws);
    const big = Math.max(s.x, s.y, s.z);
    const lim = Math.max(0.12, big / 8);
    if (big > 0.2 && g.attributes.position.count < 20000) m.geometry = densify(g, lim / Math.max(1e-6, ws.length() / Math.sqrt(3)));
  });
  const box = new THREE.Box3().setFromObject(root);
  for (const c of root.children) c.position.y -= box.min.y;
  root.updateMatrixWorld(true);
  const anims = typeof animations === 'function' ? animations() : animations;
  return finalize(root, { type, variant, options: o, animations: anims });
}
