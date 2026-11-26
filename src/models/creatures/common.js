// Shared kit for the 'creatures' category: elemental trims, skin materials, a lofted
// "spine" body builder with surface queries, limbs (two-bone legs), heads, wings,
// spikes / crystals / plates / ribs, glowing eyes, ground bases and the settle wrapper.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { rotateTrack, scaleTrack, moveTrack, clip, wave } from '../../core/animation.js';
import { lampGroup, lampTracks, glowMaterial } from '../../core/lamps.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, rng, rotateTrack, scaleTrack, moveTrack, clip, wave, lampTracks };

const V3 = (a) => (a.isVector3 ? a.clone() : new THREE.Vector3(...a));
export const TAU = Math.PI * 2;

/*
 * Elemental trims. Every fantasy type reads the same fields:
 *   p body, b belly, h horns/claws, w wing membrane, eye, glow (emissive extras)
 *   rough/metal/clear/bump skin finish, pattern (scales|spots|cracks|fur|plain|bands)
 *   spikes style, plus part flags: flames, crystals, plates, ribs, frill, tattered, hoard, moss, leaves, lightning
 *   scale (overall) and chunky (head / limb thickness) — baby = small + chunky.
 */
export const TRIMS = {
  fire: { p: '#7a1a0d', b: '#e8892c', h: '#1d1512', w: '#a8361a', eye: '#ffb21f', glow: '#ff5a12', rough: 0.45, bump: 0.05, pattern: 'scales', spikes: 'flame', flames: true, horns: 4, smoulder: '#ff3200' },
  ice: { p: '#a5d3e8', b: '#f1fafd', h: '#e9f7ff', w: '#c6e7f5', eye: '#7fe0ff', glow: '#a6ecff', rough: 0.22, clear: 1, bump: 0.03, pattern: 'scales', spikes: 'ice', crystals: 'ice' },
  poison: { p: '#3d6b1b', b: '#d2e054', h: '#3a1f48', w: '#6f9b2b', eye: '#a8ff2a', glow: '#9cff2e', spot: '#6a2290', rough: 0.4, clear: 0.6, bump: 0.04, pattern: 'spots', spikes: 'thorn', frill: true },
  shadow: { p: '#16121e', b: '#2c2440', h: '#0b0a0e', w: '#221a31', eye: '#c84cff', glow: '#8a2cff', rough: 0.55, bump: 0.04, pattern: 'scales', spikes: 'blade', tattered: true, smoulder: '#2a0050' },
  stone: { p: '#8a857a', b: '#a09a8d', h: '#6c675d', w: '#7c776c', eye: '#ffcf6a', glow: '#ffb84a', rough: 0.95, bump: 0.12, pattern: 'cracks', spikes: 'rock', moss: true, horns: 2, ram: true },
  gold: { p: '#d6a43a', b: '#efc969', h: '#fff1b8', w: '#c4902c', eye: '#ff2a3a', glow: '#ffd36a', rough: 0.24, metal: 1, bump: 0.04, pattern: 'scales', spikes: 'cone', hoard: true, gems: true },
  undead: { p: '#5b5f50', b: '#86866e', h: '#e6dcc0', w: '#47473b', eye: '#5cff9a', glow: '#5cff9a', rough: 0.92, bump: 0.08, pattern: 'cracks', spikes: 'bone', ribs: true, tattered: true },
  crystal: { p: '#3a296c', b: '#7c5bc8', h: '#cbb8ff', w: '#5a3fa5', eye: '#e8b8ff', glow: '#c08cff', rough: 0.3, clear: 0.8, bump: 0.03, pattern: 'scales', spikes: 'crystal', crystals: 'amethyst' },
  baby: { p: '#7cc5a2', b: '#f6e7b0', h: '#f5eedc', w: '#a5dbbf', eye: '#ffd27a', glow: '#ffe2a0', rough: 0.7, bump: 0.01, pattern: 'plain', spikes: 'nub', scale: 0.42, chunky: 1.45, horns: 1, baby: true },
  armoured: { p: '#3c4939', b: '#9a8a6a', h: '#c3c5c9', w: '#4a5248', eye: '#ff5a2a', glow: '#ff7a3a', rough: 0.6, bump: 0.05, pattern: 'scales', spikes: 'metal', plates: true, helm: true },
  storm: { p: '#2e3d55', b: '#8ea5c1', h: '#d8e4f0', w: '#40577a', eye: '#7ad8ff', glow: '#6fe0ff', rough: 0.4, clear: 0.5, bump: 0.04, pattern: 'bands', spikes: 'fin', lightning: true },
  forest: { p: '#4a5d29', b: '#a8a46a', h: '#6b4a2a', w: '#5c7a39', eye: '#ffe25a', glow: '#d8ff6a', rough: 0.8, bump: 0.07, pattern: 'spots', spot: '#2e3d18', spikes: 'leaf', moss: true, leaves: true, antler: true },
};
export const ELEMENTS = Object.keys(TRIMS);

/** Resolve options → { o, variant, trim, T, V, r }. extra = type-specific trim table merged over TRIMS. */
export function setup(options, VARIANTS, type, extra = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VARIANTS, o.variant, type);
  const table = { ...TRIMS, ...extra };
  const trim = o.trim && table[o.trim] ? o.trim : null;
  const V = VARIANTS[variant] || {};
  const T = { scale: 1, chunky: 1, horns: 2, bump: 0.04, rough: 0.5, metal: 0, clear: 0.3, pattern: 'scales', spikes: 'cone', p: '#6b4a3a', b: '#c9a874', h: '#2a2420', w: '#7a4a3a', eye: '#ffc23a', glow: '#ffb040', ...V, ...(trim ? table[trim] : {}), trim };
  if (trim && V.keep) for (const k of V.keep) T[k] = V[k];
  if (!trim && o.color) T.p = o.color;
  T.r = rng(`${type}-${variant}-${trim}`);
  return { o, variant, trim, T, V, r: T.r };
}

/* ----------------------------------- noise ----------------------------------- */

function hash3(x, y, z) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Smooth 3D value noise in [0,1]. */
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const s = (t) => t * t * (3 - 2 * t);
  const u = s(xf), v = s(yf), w = s(zf);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export { sstep };

/* --------------------------------- materials --------------------------------- */

/** Vertex-coloured skin material for a trim. */
export function skinMat(T, { rough, metal, clear, emissive } = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    name: 'skin', vertexColors: true, color: 0xffffff,
    roughness: rough ?? T.rough, metalness: metal ?? T.metal ?? 0,
    clearcoat: clear ?? T.clear ?? 0.3, clearcoatRoughness: 0.35,
  });
  m.userData.tint = T.p;
  const em = emissive ?? T.smoulder;
  if (em) { m.emissive = new THREE.Color(em); m.emissiveIntensity = T.smoulder === '#2a0050' ? 0.25 : 0.12; }
  return m;
}
export const hornMat = (T, c = T.h) => (T.metal ? M.metal(c, 0.25) : new THREE.MeshPhysicalMaterial({ name: 'horn', color: c, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }));
export const membraneMat = (T, c = T.w) => new THREE.MeshPhysicalMaterial({ name: 'membrane', color: c, roughness: 0.6, metalness: T.metal ? 0.8 : 0, side: THREE.DoubleSide, sheen: 0.3, sheenColor: new THREE.Color(c).offsetHSL(0, 0, 0.2) });
export const glowMat = (c, i = 1.2, opacity = 1) => new THREE.MeshStandardMaterial({ name: 'glow', color: c, emissive: c, emissiveIntensity: i, roughness: 0.35, transparent: opacity < 1, opacity });
export const crystalMat = (c, glowI = 0.45) => new THREE.MeshPhysicalMaterial({ name: 'crystal', color: c, emissive: c, emissiveIntensity: glowI, roughness: 0.08, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.88, flatShading: true });
export const darkMat = (c = '#0c0a09') => new THREE.MeshStandardMaterial({ name: 'dark', color: c, roughness: 0.5 });
export const plainMat = (c, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ name: 'mat', color: c, roughness: rough, metalness: metal });

/** Skin colour function from the trim pattern. u = 0..1 along, a = angle (0 = top), p = local point. */
export function skinColor(T, { spot = 1, freq = 3 } = {}) {
  const P = new THREE.Color(T.p), B = new THREE.Color(T.b);
  const S = new THREE.Color(T.spot ?? T.b);
  const moss = new THREE.Color('#4f6a2a');
  const c = new THREE.Color();
  return (u, a, p) => {
    const up = Math.cos(a);
    c.copy(B).lerp(P, sstep(-0.8, -0.25, up));
    const n = noise3(p.x * freq * 2.2, p.y * freq * 2.2, p.z * freq * 2.2);
    switch (T.pattern) {
      case 'spots': if (noise3(p.x * freq * 1.3 + 7, p.y * freq * 1.3, p.z * freq * 1.3) > 0.64 && up > -0.3) c.lerp(S, 0.85 * spot); break;
      case 'cracks': { const k = Math.abs(noise3(p.x * freq * 1.6, p.y * freq * 1.6, p.z * freq * 1.6) - 0.5); if (k < 0.04) c.multiplyScalar(0.55); break; }
      case 'bands': if (Math.sin(u * 40) > 0.55 && up > -0.2) c.lerp(B, 0.6); break;
      case 'fur': c.multiplyScalar(0.82 + 0.3 * n); break;
      default: break;
    }
    if (T.pattern === 'scales') { if (up < -0.35 && Math.sin(u * 90) > 0.4) c.multiplyScalar(0.86); }
    c.multiplyScalar(0.9 + 0.2 * n);
    if (T.moss && up > 0.45 && noise3(p.x * 2.5 + 3, p.y * 2.5, p.z * 2.5) > 0.55) c.lerp(moss, 0.75);
    return c;
  };
}

/* ------------------------------- lofted bodies ------------------------------- */

/**
 * Smooth tube through points with a varying (elliptical) cross-section.
 *   radius: number | t → r | t → [rWidth, rHeight]
 *   color(u, a, p) → THREE.Color  (vertex colours; a = 0 at the "up" side)
 *   bump: radial noise amount (fraction of r), up: reference up vector for the cross-section.
 * Returns a Mesh; mesh.userData.surf(t, a) → { p, n } (in the mesh's parent space).
 */
export function loft(points, radius, mat, { seg = 40, rad = 16, color, bump = 0, bumpFreq = 6, up = [0, 1, 0], parent, name, capStart = 0.6, capEnd = 0.6, seed = 1 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(V3), false, 'centripetal');
  const rf = typeof radius === 'function' ? radius : () => radius;
  const R = (t) => { const r = rf(t); return Array.isArray(r) ? r : [r, r]; };
  const C = [], Tn = [], N = [], B = [];
  let ref = V3(up).normalize();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    C.push(curve.getPointAt(t));
    const tg = curve.getTangentAt(t).normalize();
    Tn.push(tg);
    let n;
    if (i === 0) {
      n = ref.clone().addScaledVector(tg, -ref.dot(tg));
      if (n.lengthSq() < 1e-6) n = new THREE.Vector3(1, 0, 0).addScaledVector(tg, -tg.x);
    } else {
      n = N[i - 1].clone().addScaledVector(tg, -N[i - 1].dot(tg));
    }
    n.normalize();
    N.push(n);
    B.push(new THREE.Vector3().crossVectors(tg, n).normalize());
  }
  const pos = [], col = [], idx = [];
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  const sd = seed * 13.1;
  const ringPt = (i, j, out) => {
    const t = i / seg;
    const a = (j / rad) * TAU;
    const [rw, rh] = R(t);
    out.copy(C[i]).addScaledVector(N[i], Math.cos(a) * rh).addScaledVector(B[i], Math.sin(a) * rw);
    if (bump) {
      const k = 1 + bump * (noise3(out.x * bumpFreq + sd, out.y * bumpFreq, out.z * bumpFreq) - 0.5) * 2;
      out.sub(C[i]).multiplyScalar(k).add(C[i]);
    }
    return a;
  };
  const white = new THREE.Color(1, 1, 1);
  for (let i = 0; i <= seg; i++) {
    for (let j = 0; j <= rad; j++) {
      const a = ringPt(i, j % rad, p);
      pos.push(p.x, p.y, p.z);
      const c = color ? color(i / seg, a, p) : white;
      col.push(c.r, c.g, c.b);
    }
  }
  const W = rad + 1;
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) {
    const a = i * W + j, b = a + W;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  // rounded caps: fan to a tip pushed out along the tangent
  const cap = (i, dir, push) => {
    const [rw, rh] = R(i / seg);
    q.copy(C[i]).addScaledVector(Tn[i], dir * push * Math.max(rw, rh));
    const c0 = pos.length / 3;
    pos.push(q.x, q.y, q.z);
    const c = color ? color(i / seg, 0, q) : white;
    col.push(c.r, c.g, c.b);
    for (let j = 0; j < rad; j++) {
      const a = i * W + j;
      if (dir > 0) idx.push(a, c0, a + 1); else idx.push(a, a + 1, c0);
    }
  };
  cap(0, -1, capStart);
  cap(seg, 1, capEnd);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  if (name) m.name = name;
  if (parent) parent.add(m);
  m.userData.surf = (t, a, inset = 0) => {
    const i = Math.min(seg, Math.max(0, Math.round(t * seg)));
    const [rw, rh] = R(i / seg);
    const nrm = new THREE.Vector3().addScaledVector(N[i], Math.cos(a) * rw).addScaledVector(B[i], Math.sin(a) * rh).normalize();
    const pt = C[i].clone().addScaledVector(N[i], Math.cos(a) * rh * (1 - inset)).addScaledVector(B[i], Math.sin(a) * rw * (1 - inset));
    return { p: pt, n: nrm, t: Tn[i].clone(), c: C[i].clone(), r: [rw, rh] };
  };
  return m;
}

/** Tapered horn / claw / tentacle: points + base radius → tip radius. */
export function taper(points, r0, r1, mat, opts = {}) {
  const pw = opts.pow ?? 1;
  return loft(points, (t) => r1 + (r0 - r1) * (1 - t) ** pw, mat, { seg: opts.seg ?? 14, rad: opts.rad ?? 10, capStart: 0.3, capEnd: 0.4, ...opts });
}

/** Ellipsoid (sphere scaled), optional jitter + vertex colour fn(p). */
export function blob(rx, ry, rz, mat, { at, rot, parent, name, ws = 24, hs = 16, jitter: jit = 0, seed = 1, color } = {}) {
  const g = new THREE.SphereGeometry(1, ws, hs);
  g.scale(rx, ry, rz);
  if (jit || color) {
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    const col = [];
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (jit) { const k = 1 + jit * (noise3(v.x * 4 / rx + seed, v.y * 4 / ry, v.z * 4 / rz) - 0.5) * 2; v.multiplyScalar(k); pos.setXYZ(i, v.x, v.y, v.z); }
      if (color) { const c = color(v); col.push(c.r, c.g, c.b); }
    }
    if (color) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    // seam fix: average duplicated seam vertices
    g.computeVertexNormals();
  }
  return mesh(g, mat, { at, rot, parent, name });
}

/** Merge geometries (strips to position/normal[/color]). */
export function merge(geos) {
  const withColor = geos.every((g) => g.attributes.color);
  const list = geos.map((g0) => {
    let g = g0.index ? g0.toNonIndexed() : g0;
    if (!g.attributes.normal) g.computeVertexNormals();
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', g.attributes.position);
    out.setAttribute('normal', g.attributes.normal);
    if (withColor) out.setAttribute('color', g.attributes.color);
    return out;
  });
  return mergeGeometries(list, false);
}

/** Geometry transform helper: place geo at p, rotate so +Y points along dir, optional roll. */
export function orient(geo, p, dir, roll = 0) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), V3(dir).normalize());
  if (roll) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), roll));
  geo.applyQuaternion(q);
  geo.translate(p.x ?? p[0], p.y ?? p[1], p.z ?? p[2]);
  return geo;
}

/* ---------------------------- surface ornaments ---------------------------- */

/** One spike geometry of a style, base at origin pointing +Y, height h, base radius r. */
export function spikeGeo(style, h, r, rand = Math.random) {
  switch (style) {
    case 'flame': { const g = new THREE.SphereGeometry(1, 10, 8); g.translate(0, 1, 0); const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); const k = Math.max(0, 1 - y / 2) ** 0.8; pos.setXYZ(i, pos.getX(i) * r * (0.3 + k), (y / 2) * h * 1.3, pos.getZ(i) * r * (0.3 + k) * 0.6); } g.computeVertexNormals(); return g; }
    case 'ice': return new THREE.CylinderGeometry(0, r, h, 6).translate(0, h / 2, 0);
    case 'crystal': { const g = new THREE.OctahedronGeometry(1, 0); g.scale(r, h / 2, r); g.translate(0, h * 0.35, 0); return g; }
    case 'rock': { const g = new THREE.DodecahedronGeometry(r * 1.1, 0); g.scale(1, (h / r) * 0.45, 1); return g; }
    case 'blade': { const g = extrudeOutline([[-r, 0], [r, 0], [r * 0.2, h * 0.6], [-r * 0.3, h * 1.1]], r * 0.25, { bevel: r * 0.08, segments: 1 }); g.rotateY(Math.PI / 2); return g; }
    case 'fin': { const g = extrudeOutline([[-r * 1.4, 0], [r * 1.2, 0], [-r * 0.6, h]], r * 0.18, { bevel: r * 0.06, segments: 1 }); g.rotateY(Math.PI / 2); return g; }
    case 'leaf': { const g = new THREE.SphereGeometry(1, 8, 6); g.scale(r * 1.1, h * 0.55, r * 0.25); g.translate(0, h * 0.45, 0); return g; }
    case 'nub': { const g = new THREE.SphereGeometry(r * 0.9, 10, 8); g.scale(1, 0.8, 1); return g; }
    case 'metal': { const g = new THREE.ConeGeometry(r * 1.1, h * 0.7, 4); g.translate(0, h * 0.35, 0); return g; }
    case 'thorn': case 'bone': { const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push(new THREE.Vector3(-t * t * h * 0.35, t * h, 0)); } const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, 1, 8); const pos = g.attributes.position; const cc = new THREE.Vector3(); for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); const t = Math.min(1, Math.max(0, y / h)); const c = new THREE.CatmullRomCurve3(pts).getPointAt(t, cc); pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * r * (1 - t * 0.92), y, pos.getZ(i) * r * (1 - t * 0.92)); } g.computeVertexNormals(); return g; }
    default: { void rand; return new THREE.ConeGeometry(r, h, 10).translate(0, h / 2, 0); }
  }
}

/** Material for a spike style. */
export function spikeMat(T, style = T.spikes) {
  if (style === 'flame') return glowMat(T.glow, 1.6, 0.92);
  if (style === 'ice') return crystalMat(T.glow ?? '#bfefff', 0.25);
  if (style === 'crystal') return crystalMat(T.glow, 0.6);
  if (style === 'rock') return plainMat(T.h, 0.95);
  if (style === 'leaf') return M.foliage('#5d8a2c');
  if (style === 'metal') return M.metal('#9da2a8', 0.35);
  if (style === 'fin') return membraneMat(T, T.b);
  return hornMat(T);
}

/**
 * Row of spikes along a lofted mesh's top (angle a), merged into one mesh in the loft's parent.
 * h(t) gives spike height. Bases are sunk into the surface so they always touch.
 */
export function spikeRow(lm, { from = 0.1, to = 0.9, n = 10, h = 0.2, r, a = 0, style, mat, T, lean = 0.4, parent, name = 'spikes', side = 0 } = {}) {
  const st = style ?? T.spikes;
  if (!st || st === 'none') return null;
  const geos = [];
  for (let i = 0; i < n; i++) {
    const t = from + ((to - from) * (i + 0.5)) / n;
    const hh = typeof h === 'function' ? h(t) : h;
    if (hh <= 0.002) continue;
    const rr = r ? (typeof r === 'function' ? r(t) : r) : hh * 0.32;
    const angles = side ? [a + side, a - side] : [a];
    for (const aa of angles) {
      const s = lm.userData.surf(t, aa);
      const dir = s.n.clone().addScaledVector(s.t, -lean).normalize();
      const p = s.p.clone().addScaledVector(s.n, -rr * 0.5);
      geos.push(orient(spikeGeo(st, hh, rr), p, dir));
    }
  }
  if (!geos.length) return null;
  return mesh(merge(geos), mat ?? spikeMat(T, st), { parent: parent ?? lm.parent, name });
}

/** Cluster of crystal shards at a surface point. */
export function crystalCluster(p, n, size, mat, rand, { count = 5, parent, name = 'crystals' } = {}) {
  const geos = [];
  const nn = V3(n).normalize();
  for (let i = 0; i < count; i++) {
    const h = size * (0.5 + rand() * 0.8) * (i === 0 ? 1.4 : 1);
    const dir = nn.clone().add(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(i === 0 ? 0.3 : 1.1)).normalize();
    const g = new THREE.CylinderGeometry(0, h * 0.2, h * 0.35, 6).translate(0, h * 0.82, 0);
    const g2 = new THREE.CylinderGeometry(h * 0.2, h * 0.17, h * 0.65, 6).translate(0, h * 0.32, 0);
    const pp = V3(p).addScaledVector(nn, -h * 0.12);
    geos.push(orient(g, pp, dir), orient(g2, pp.clone(), dir));
  }
  return mesh(merge(geos), mat, { parent, name });
}

/** Armour plates along a loft top: cushion plates oriented to the surface. */
export function plateRow(lm, { from = 0.2, to = 0.8, n = 6, w = 0.3, l = 0.25, th = 0.04, a = 0, mat, parent, name = 'plates', side = 0 } = {}) {
  const geos = [];
  for (let i = 0; i < n; i++) {
    const t = from + ((to - from) * (i + 0.5)) / n;
    for (const aa of side ? [a + side, a - side] : [a]) {
      const s = lm.userData.surf(t, aa);
      const ww = typeof w === 'function' ? w(t) : w;
      const g = cushion(l, th, ww, { radius: th * 0.45, bulge: 0.6 });
      const bend = new THREE.Matrix4().lookAt(new THREE.Vector3(), s.t, s.n);
      void bend;
      // basis: x along tangent, y along normal, z = cross
      const x = s.t.clone().addScaledVector(s.n, -s.t.dot(s.n)).normalize();
      const y = s.n.clone();
      const z = new THREE.Vector3().crossVectors(x, y);
      g.applyMatrix4(new THREE.Matrix4().makeBasis(x, y, z));
      g.translate(...s.p.clone().addScaledVector(s.n, th * 0.1).toArray());
      geos.push(g);
    }
  }
  return mesh(merge(geos), mat, { parent: parent ?? lm.parent, name });
}

/** Exposed ribs (undead) curving around a loft from a0 to a1 on both sides. */
export function ribs(lm, { from = 0.3, to = 0.75, n = 6, a0 = 0.35, a1 = 2.2, r = 0.025, mat, parent, name = 'ribs' } = {}) {
  const geos = [];
  for (let i = 0; i < n; i++) {
    const t = from + ((to - from) * i) / Math.max(1, n - 1);
    for (const sgn of [1, -1]) {
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const a = sgn * (a0 + ((a1 - a0) * k) / 6);
        const s = lm.userData.surf(t, a);
        pts.push(s.p.addScaledVector(s.n, r * 0.4));
      }
      geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, r, 6));
    }
  }
  return mesh(merge(geos), mat, { parent: parent ?? lm.parent, name });
}

/** Glowing eyes (lamp group 'eyes'): spheres on a loft at (t, ±a), half sunk into the surface. */
export function eyes(lm, T, { t = 0.5, a = 1.1, r = 0.03, name = 'eyes', pupil = true, parent, slit = true } = {}) {
  const col = new THREE.Color(T.eye);
  const lens = new THREE.MeshPhysicalMaterial({ name: `${name}_lens`, color: col, emissive: col, emissiveIntensity: 0.35, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, toneMapped: false });
  const glow = glowMaterial('white');
  glow.color.copy(col);
  const lg = lampGroup(name, 'white', { lens, glow });
  const par = parent ?? lm.parent;
  const pm = darkMat('#050404');
  for (const sgn of [1, -1]) {
    const s = lm.userData.surf(t, sgn * a);
    const c = s.p.clone().addScaledVector(s.n, -r * 0.35);
    const g = new THREE.SphereGeometry(r, 14, 10).translate(c.x, c.y, c.z);
    lg.add(par, { geometry: g, normal: s.n.toArray(), depth: r * 0.6, glowSize: Math.min(r * 7, 0.5) });
    if (pupil) {
      const pg = new THREE.SphereGeometry(r * 0.55, 10, 8);
      pg.scale(slit && !T.baby ? 0.28 : 0.8, slit && !T.baby ? 1 : 0.8, 0.5);
      orient(pg.rotateX(Math.PI / 2), c.clone().addScaledVector(s.n, r * 0.78), s.n);
      mesh(pg, pm, { parent: par, name: `${name}_pupil` });
    }
  }
  return lg;
}

/* ----------------------------------- limbs ----------------------------------- */

/**
 * Two-bone leg in the parent's space, wrapped in a pivot group at the hip (named `name`).
 * hip, foot: world points; bend: knee direction (e.g. [1,0,0] knee forward, [-1,0,0] back).
 * hock: optional extra joint above the foot (digitigrade hind legs) as offset from foot.
 * foot: 'claw' | 'paw' | 'hoof' | 'talon' | 'stump' | 'none'.
 */
export function leg(parent, name, { hip, foot, bend = [1, 0, 0], len, hock, r = [0.2, 0.12, 0.08], mat, color, footType = 'claw', clawMat, footMat, footLen, toes = 3, bump = 0, spread = 0.5 }) {
  const H = V3(hip), F = V3(foot);
  const piv = group(name, { parent, at: H.toArray() });
  const A = hock ? F.clone().add(V3(hock)) : F.clone().add(new THREE.Vector3(0, r[2] * 1.4, 0));
  const d = H.distanceTo(A);
  const L = Math.max(len ?? d * 1.15, d * 1.02);
  const mid = H.clone().lerp(A, 0.5);
  const k = Math.sqrt(Math.max(0, (L / 2) ** 2 - (d / 2) ** 2));
  const bd = V3(bend).normalize();
  const axis = A.clone().sub(H).normalize();
  bd.addScaledVector(axis, -bd.dot(axis)).normalize();
  const K = mid.addScaledVector(bd, k);
  const pts = [H, K, A];
  if (hock) pts.push(F.clone().add(new THREE.Vector3(0, r[2] * 1.2, 0)));
  const local = pts.map((p) => p.clone().sub(H));
  const rr = (t) => {
    const n = local.length - 1;
    const x = t * n;
    const i = Math.min(n - 1, Math.floor(x));
    const f = x - i;
    const rs = hock ? [r[0], r[1], r[2] * 1.1, r[2]] : [r[0], r[1], r[2]];
    return rs[i] + (rs[i + 1] - rs[i]) * f;
  };
  const lm = loft([local[0].clone().add(new THREE.Vector3(0, r[0] * 0.5, 0)), ...local], rr, mat, { seg: 20, rad: 12, color, bump, parent: piv, name: `${name}_limb`, capStart: 0.8, capEnd: 0.5 });
  const fl = footLen ?? r[2] * 3.2;
  const fo = F.clone().sub(H); // foot ground point, local
  const fwd = new THREE.Vector3(1, 0, 0);
  const ft = footMat ?? mat;
  const cm = clawMat ?? darkMat('#1a1714');
  if (footType === 'hoof') {
    mesh(lathe([[0, 0], [r[2] * 1.35, 0], [r[2] * 1.3, r[2] * 0.4], [r[2] * 1.05, r[2] * 1.5], [0, r[2] * 1.55]], 20), cm, { parent: piv, at: [fo.x, fo.y, fo.z], name: `${name}_hoof` });
    if (footMat) mesh(lathe([[r[2] * 1.02, 0], [r[2] * 1.3, -r[2] * 0.6], [r[2] * 0.9, -r[2] * 0.9], [0, -r[2] * 0.9]].map(([a, b]) => [a, b + r[2] * 2.4]), 16), footMat, { parent: piv, at: [fo.x, fo.y, fo.z], name: `${name}_feather` });
  } else if (footType !== 'none') {
    const padH = r[2] * (footType === 'stump' ? 1.4 : 0.9);
    const pad = blob(fl * 0.55, padH, r[2] * (footType === 'stump' ? 1.5 : 1.25), ft, { parent: piv, at: [fo.x + fl * 0.2, fo.y + padH * 0.85, fo.z], ws: 16, hs: 10, name: `${name}_foot` });
    pad.geometry.translate(0, 0, 0);
    if (footType === 'claw' || footType === 'talon' || footType === 'paw') {
      const geos = [];
      for (let i = 0; i < toes; i++) {
        const ang = toes > 1 ? (i / (toes - 1) - 0.5) * spread * 2 : 0;
        const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
        const base = fo.clone().add(new THREE.Vector3(fl * 0.2, 0, 0)).addScaledVector(dir, fl * 0.45);
        base.y += r[2] * 0.6;
        const cl = (footType === 'paw' ? 0.5 : footType === 'talon' ? 1.6 : 1.1) * r[2];
        const tipDir = dir.clone().multiplyScalar(cl).add(new THREE.Vector3(0, -r[2] * 0.55, 0));
        const pts2 = [base, base.clone().addScaledVector(dir, cl * 0.6).add(new THREE.Vector3(0, r[2] * 0.05, 0)), base.clone().add(tipDir)];
        const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 6, 1, 6);
        const pos = tg.attributes.position;
        const crv = new THREE.CatmullRomCurve3(pts2);
        for (let v = 0; v < pos.count; v++) {
          const tt = Math.floor(v / 7) / 6;
          const cc = crv.getPointAt(Math.min(1, tt));
          const rad = r[2] * 0.32 * (1 - tt * 0.9);
          const off = new THREE.Vector3(pos.getX(v), pos.getY(v), pos.getZ(v)).sub(cc);
          if (off.lengthSq() > 1e-12) off.normalize().multiplyScalar(rad);
          pos.setXYZ(v, cc.x + off.x, cc.y + off.y, cc.z + off.z);
        }
        tg.computeVertexNormals();
        geos.push(tg);
      }
      if (footType === 'talon') {
        const back = fo.clone().add(new THREE.Vector3(-fl * 0.1, r[2] * 0.6, 0));
        geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([back, back.clone().add(new THREE.Vector3(-r[2] * 0.9, -r[2] * 0.2, 0)), back.clone().add(new THREE.Vector3(-r[2] * 1.3, -r[2] * 0.6, 0))]), 5, r[2] * 0.22, 6));
      }
      mesh(merge(geos), cm, { parent: piv, name: `${name}_claws` });
    }
  }
  void fwd;
  piv.userData.limb = lm;
  return piv;
}

/* ------------------------------------ wings ------------------------------------ */

/**
 * Membrane (bat/dragon) wing in a pivot group at `root` (named name). Built in a 2D plane:
 * u = outward span, v = along body (+ forward); mapped to 3D with sideways sign `side` (±1 on z),
 * then lifted by `raise` (radians about the body axis) and swept by `sweep` (about y).
 */
export function batWing(parent, name, T, { root, side = 1, span = 2.4, chord = 1.4, raise = 0.5, sweep = 0, fingers = 4, boneR = 0.04, tattered = T.tattered, droop = 0.15, mat, boneMat, rand = Math.random, claws = true, veins }) {
  const piv = group(name, { parent, at: V3(root).toArray() });
  const inner = group(`${name}_fold`, { parent: piv, rot: [side * -raise, sweep * side, 0] });
  // key points in (u, v)
  const elbow = [span * 0.32, chord * 0.12];
  const wrist = [span * 0.55, chord * 0.28];
  const tips = [];
  for (let i = 0; i < fingers; i++) {
    const f = i / (fingers - 1);
    const ang = 0.35 - f * 1.55; // forward-up to back
    const L = span * (0.52 - f * 0.18);
    tips.push([wrist[0] + Math.cos(ang) * L, wrist[1] + Math.sin(ang) * L * 0.95]);
  }
  const bodyBack = [0.02, -chord * 0.85];
  const map = (u, v) => new THREE.Vector3(v, -droop * (u / span) ** 2 * span + Math.sin((u / span) * Math.PI) * 0.06 * span, side * u);
  // outline: root(0,0) → elbow → wrist → tip0, scallops between tips, last tip → bodyBack
  const outline = [[0, chord * 0.05], elbow, wrist, tips[0]];
  for (let i = 0; i < fingers - 1; i++) {
    const a = tips[i], b = tips[i + 1];
    const steps = 4;
    for (let s = 1; s <= steps; s++) {
      const f = s / steps;
      const mx = a[0] + (b[0] - a[0]) * f, my = a[1] + (b[1] - a[1]) * f;
      // scallop toward the wrist
      const sc = Math.sin(f * Math.PI) * 0.22 * (tattered ? 1.5 + rand() * 0.8 : 1);
      const cx = mx + (wrist[0] - mx) * sc, cy = my + (wrist[1] - my) * sc;
      outline.push(s === steps ? b : [cx, cy]);
    }
  }
  const last = tips[fingers - 1];
  for (let s = 1; s <= 4; s++) {
    const f = s / 4;
    const mx = last[0] + (bodyBack[0] - last[0]) * f, my = last[1] + (bodyBack[1] - last[1]) * f;
    const sc = Math.sin(f * Math.PI) * 0.12 * (tattered ? 2 : 1);
    outline.push([mx + (0 - mx) * sc, my + (wrist[1] - my) * sc * 0.4]);
  }
  const shape = new THREE.Shape(outline.map(([u, v]) => new THREE.Vector2(u, v)));
  if (tattered) {
    for (let i = 0; i < 4; i++) {
      const f = 0.2 + rand() * 0.6;
      const tIdx = Math.floor(rand() * (fingers - 1));
      const a = tips[tIdx], b = tips[tIdx + 1];
      const cx = wrist[0] + ((a[0] + b[0]) / 2 - wrist[0]) * (0.45 + f * 0.25), cy = wrist[1] + ((a[1] + b[1]) / 2 - wrist[1]) * (0.45 + f * 0.25);
      const hr = span * (0.025 + rand() * 0.03);
      const hole = new THREE.Path();
      hole.absellipse(cx, cy, hr, hr * (0.6 + rand() * 0.6), 0, TAU, true);
      shape.holes.push(hole);
    }
  }
  const sg = new THREE.ShapeGeometry(shape, 6);
  const pos = sg.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const p = map(pos.getX(i), pos.getY(i));
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  sg.computeVertexNormals();
  mesh(sg, mat ?? membraneMat(T), { parent: inner, name: `${name}_membrane` });
  // bones
  const bm = boneMat ?? hornMat(T, new THREE.Color(T.w).multiplyScalar(0.6));
  const bone = (pts, r0, r1) => taper(pts.map(([u, v]) => map(u, v).toArray()), r0, r1, bm, { parent: inner, seg: 10, rad: 8 });
  bone([[-boneR * 2, chord * 0.05], elbow, wrist], boneR * 1.6, boneR * 1.1).name = `${name}_arm`;
  tips.forEach((tp, i) => { bone([wrist, [wrist[0] + (tp[0] - wrist[0]) * 0.5, wrist[1] + (tp[1] - wrist[1]) * 0.5 + 0.02 * span], tp], boneR * 1.05, boneR * 0.35).name = `${name}_finger${i}`; });
  if (veins) {
    const vg = [];
    for (let i = 0; i < fingers - 1; i++) {
      const a = tips[i], b = tips[i + 1];
      const end = [wrist[0] + ((a[0] + b[0]) / 2 - wrist[0]) * 0.7, wrist[1] + ((a[1] + b[1]) / 2 - wrist[1]) * 0.7];
      const pts = [];
      for (let k = 0; k <= 5; k++) {
        const f = k / 5;
        const u = wrist[0] + (end[0] - wrist[0]) * f, v = wrist[1] + (end[1] - wrist[1]) * f;
        const j = k && k < 5 ? (k % 2 ? 1 : -1) * span * 0.025 : 0;
        pts.push(map(u + j, v - j));
      }
      for (let k = 0; k < 5; k++) {
        const len = pts[k].distanceTo(pts[k + 1]);
        const g = new THREE.CylinderGeometry(boneR * 0.3, boneR * 0.3, len + boneR * 0.3, 5).translate(0, len / 2, 0);
        vg.push(orient(g, pts[k], pts[k + 1].clone().sub(pts[k])));
      }
    }
    mesh(merge(vg), veins, { parent: inner, name: `${name}_veins` });
  }
  if (claws) {
    const w3 = map(...wrist);
    taper([w3.toArray(), w3.clone().add(new THREE.Vector3(boneR * 3, boneR * 3, 0)).toArray(), w3.clone().add(new THREE.Vector3(boneR * 5, boneR * 2, 0)).toArray()], boneR * 0.9, boneR * 0.1, hornMat(T), { parent: inner, name: `${name}_thumb` });
  }
  return piv;
}

/** Feathered wing (griffin / phoenix / angelic): layered feather rows, merged. */
export function featherWing(parent, name, T, { root, side = 1, span = 2.2, chord = 0.9, raise = 0.6, sweep = 0.1, primary, secondary, covert, mat2, rand = Math.random, fold = 0, glowTips }) {
  const piv = group(name, { parent, at: V3(root).toArray() });
  const inner = group(`${name}_fold`, { parent: piv, rot: [side * -raise, sweep * side, 0] });
  const m1 = primary ?? plainMat(T.w, 0.8);
  const m2 = secondary ?? plainMat(T.p, 0.8);
  // leading-edge arm (bone) as a tapered loft: shoulder → wrist → tip
  const lift = (u) => Math.sin((u / span) * Math.PI) * 0.08 * span;
  const P = (u, v) => new THREE.Vector3(v, lift(u) - fold * (u / span) * 0.2, side * u);
  const arm = taper([P(-0.05, 0).toArray(), P(span * 0.35, chord * 0.1).toArray(), P(span * 0.62, chord * 0.05).toArray(), P(span * 0.95, -chord * 0.2).toArray()], chord * 0.12, chord * 0.03, covert ?? m2, { parent: inner, name: `${name}_arm`, seg: 16 });
  const feather = (base, dir, len, w) => {
    // vane: wide, thin, tapering to a rounded tip (dense rows overlap like real flight feathers)
    const g = new THREE.SphereGeometry(1, 10, 8);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) * (y > 0 ? 1 - 0.45 * y * y : 1)); }
    g.scale(w, len / 2, chord * 0.018);
    g.translate(0, len / 2, 0);
    return orient(g, base, dir);
  };
  const fGeo = [], sGeo = [], cGeo = [];
  // primaries fan from the hand
  const nP = 13;
  for (let i = 0; i < nP; i++) {
    const f = i / (nP - 1);
    const u = span * (0.55 + f * 0.38);
    const base = P(u, chord * 0.02);
    const ang = -Math.PI / 2 - (1 - f) * 0.15 + f * 0.95;
    const dir = new THREE.Vector3(Math.cos(ang) * 0.9 - 0.1, 0, side * Math.sin(ang + Math.PI / 2) * 0.6 + side * f * 0.4);
    dir.set(-Math.cos(f * 1.1), 0, side * Math.sin(f * 1.1));
    const len = chord * (1.15 - f * 0.25 + 0.05 * rand());
    base.y -= i * chord * 0.004; // each primary tucks under the previous one
    fGeo.push(feather(base, dir, len, chord * 0.17));
  }
  // secondaries along the forearm, pointing back
  const nS = 16;
  for (let i = 0; i < nS; i++) {
    const f = i / (nS - 1);
    const u = span * (0.03 + f * 0.52);
    const base = P(u, chord * 0.05);
    const dir = new THREE.Vector3(-1, -0.05, side * 0.08 * f);
    base.y -= (i % 2) * chord * 0.006;
    sGeo.push(feather(base, dir, chord * (0.84 + 0.06 * rand()), chord * 0.2));
  }
  // coverts: shorter overlapping row on top
  for (const [row, n, len, up] of [[0, 16, 0.5, 0.035], [1, 14, 0.3, 0.05]]) {
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const u = span * (0.02 + f * (row ? 0.6 : 0.72));
      const base = P(u, chord * (0.07 - row * 0.02)).add(new THREE.Vector3(0, chord * up, 0));
      cGeo.push(feather(base, new THREE.Vector3(-1, 0.04, side * 0.1 * f), chord * len, chord * (row ? 0.16 : 0.2)));
    }
  }
  mesh(merge(fGeo), m1, { parent: inner, name: `${name}_primaries` });
  mesh(merge(sGeo), mat2 ?? m1, { parent: inner, name: `${name}_secondaries` });
  mesh(merge(cGeo), covert ?? m2, { parent: inner, name: `${name}_coverts` });
  if (glowTips) {
    const tg = [];
    for (let i = 0; i < nP; i += 2) { const f = i / (nP - 1); const u = span * (0.55 + f * 0.38); const dir = new THREE.Vector3(-Math.cos(f * 1.1), 0, side * Math.sin(f * 1.1)); const len = chord * (1.15 - f * 0.25); tg.push(feather(P(u, 0).addScaledVector(dir, len * 0.55), dir, len * 0.6, chord * 0.07)); }
    mesh(merge(tg), glowTips, { parent: inner, name: `${name}_flametips` });
  }
  void arm;
  return piv;
}

/* ------------------------------------ bases ------------------------------------ */

/** Rough rock (top at y = h). Returns mesh; userData.top = h. */
export function rock(parent, w, h, d, mat, { at = [0, 0, 0], seed = 3, name = 'rock', detail = 2 } = {}) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = 1 + (noise3(v.x * 2.2 + seed, v.y * 2.2, v.z * 2.2) - 0.5) * 0.45;
    v.multiplyScalar(k);
    v.y = v.y > 0 ? Math.min(v.y, 0.75) : Math.max(v.y, -0.6);
    pos.setXYZ(i, v.x * w / 2, (v.y + 0.6) / 1.35 * h, v.z * d / 2);
  }
  g.computeVertexNormals();
  const m = mesh(g, mat, { parent, at, name });
  m.userData.top = h;
  return m;
}
export const rockMat = (c = '#77736b') => new THREE.MeshStandardMaterial({ name: 'rock', color: c, roughness: 0.95, flatShading: true });

/** Water disc (sea creatures rise out of it): slightly rippled, bottom at y=0, surface at y=h. */
export function waterDisc(parent, r, { h = 0.06, color = '#1f5f7a', name = 'water' } = {}) {
  const mat = new THREE.MeshPhysicalMaterial({ name: 'water', color, roughness: 0.08, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.86 });
  const prof = [[0, 0], [r * 0.98, 0], [r, h * 0.4], [r * 0.985, h], [r * 0.9, h * 1.02]];
  for (let i = 1; i <= 8; i++) prof.push([r * 0.9 * (1 - i / 8), h * (1.02 + 0.06 * Math.sin(i * 1.7))]);
  const m = mesh(lathe(prof, 48), mat, { parent, name });
  // foam ring
  const foam = mesh(new THREE.TorusGeometry(r * 0.985, h * 0.18, 6, 48).rotateX(Math.PI / 2), plainMat('#e8f4f6', 0.9), { parent, at: [0, h * 0.75, 0], name: 'foam' });
  void foam;
  return m;
}

/** Gold coin hoard: low pile whose TOP is at y = 0 (the creature stands on it), coins + gems scattered. */
export function hoard(parent, r, rand, { name = 'hoard' } = {}) {
  const gold = M.metal('#d8a838', 0.28);
  const h = 0.07;
  const prof = [[0, -h], [r, -h], [r * 1.02, -h * 0.75], [r * 0.9, -h * 0.25], [r * 0.6, -h * 0.02], [0, 0]];
  const pile = mesh(lathe(prof, 40), gold, { parent, name });
  const geos = [];
  const coinAt = [];
  for (let i = 0; i < 70; i++) {
    const a = rand() * TAU, d = r * (0.25 + rand() * 0.8);
    const y = d > r * 0.9 ? -h * 0.6 : d > r * 0.6 ? -h * 0.15 * (d / r) : 0;
    const g = new THREE.CylinderGeometry(0.018, 0.018, 0.004, 12);
    g.rotateX((rand() - 0.5) * 0.6).rotateZ((rand() - 0.5) * 0.6);
    g.translate(Math.cos(a) * d, y + 0.001, Math.sin(a) * d);
    geos.push(g);
    coinAt.push([Math.cos(a) * d, y + 0.001, Math.sin(a) * d, d]);
  }
  mesh(merge(geos), gold, { parent, name: `${name}_coins` });
  const gm = [crystalMat('#e0203a', 0.3), crystalMat('#2060e0', 0.3), crystalMat('#20c060', 0.3)];
  for (let i = 0; i < 6; i++) {
    const a = rand() * TAU, d = r * (0.4 + rand() * 0.45);
    // gems rest on a coin of the pile (mid-pile coins), slightly sunk in
    const mid = coinAt.filter((c) => c[3] > r * 0.35 && c[3] < r * 0.85);
    const [cx, cy, cz] = mid.length ? mid[Math.floor(rand() * mid.length)] : [Math.cos(a) * d, 0, Math.sin(a) * d];
    mesh(new THREE.OctahedronGeometry(0.03, 0).scale(1, 0.8, 1), gm[i % 3], { parent, at: [cx, cy + 0.018, cz], name: `${name}_gem` });
  }
  // goblet
  const gx = r * 0.55;
  mesh(lathe([[0, 0], [0.04, 0], [0.04, 0.006], [0.008, 0.02], [0.008, 0.07], [0.045, 0.09], [0.05, 0.16], [0.046, 0.16], [0.04, 0.095], [0, 0.085]], 20), gold, { parent, at: [gx, -0.003, -r * 0.3], name: `${name}_goblet` });
  return pile;
}

/** Stone plinth (statues / perches): lathe or rounded box, bottom at y=0. Returns top height. */
export function plinth(parent, w, h, mat, { round = false, name = 'plinth' } = {}) {
  if (round) mesh(lathe([[0, 0], [w / 2, 0], [w / 2, h * 0.12], [w * 0.45, h * 0.2], [w * 0.42, h * 0.8], [w * 0.48, h * 0.88], [w * 0.48, h], [0, h]], 32), mat, { parent, name });
  else {
    mesh(roundedBox(w, h * 0.18, w, 0.01), mat, { parent, at: [0, h * 0.09, 0], name });
    mesh(roundedBox(w * 0.86, h * 0.68, w * 0.86, 0.01), mat, { parent, at: [0, h * 0.5, 0], name: `${name}_die` });
    mesh(roundedBox(w * 0.96, h * 0.16, w * 0.96, 0.01), mat, { parent, at: [0, h * 0.91, 0], name: `${name}_cap` });
  }
  return h;
}

/* ------------------------------- animation kit ------------------------------- */

/** Collect tracks per clip name → AnimationClip list. */
export function animKit() {
  const clips = new Map();
  return {
    add(name, period, ...tracks) {
      if (!clips.has(name)) clips.set(name, { period, tracks: [] });
      const c = clips.get(name);
      for (const t of tracks.flat()) if (t) c.tracks.push(t);
    },
    list() { return [...clips.entries()].filter(([, c]) => c.tracks.length).map(([n, c]) => clip(n, c.period, c.tracks)); },
  };
}
/** rotateTrack shortcut with a sine of amplitude amp (radians), phase in cycles. */
export const swing = (node, axis, period, amp, phase = 0, cycles = 1, offset = 0) => (node ? rotateTrack(node, axis, period, (t) => offset + amp * Math.sin(TAU * (t * cycles + phase))) : null);
/** Breathing scale on a node. */
export const breathe = (node, period, amt = 0.03) => (node ? scaleTrack(node, period, (t) => { const s = 1 + amt * (0.5 - 0.5 * Math.cos(TAU * t)); return [1, s, s]; }) : null);

/* ----------------------------------- settle ----------------------------------- */

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
    if (m <= maxEdge || depth > 10) return emit(tri);
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

/**
 * Settle: optional uniform trim scale (baby), shift onto y = 0, finalize.
 * The root's children are wrapped so options.scale etc. still apply to the root.
 */
export function done(root, type, variant, o, T, animations = []) {
  root.updateMatrixWorld(true);
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.noShadow) return;
    const g = m.geometry;
    if (m.material?.vertexColors && !g.attributes.color) {
      const c = new THREE.Color(m.material.userData.tint ?? '#ffffff');
      const n = g.attributes.position.count;
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    }
    if (!g.boundingBox) g.computeBoundingBox();
    const s = g.boundingBox.getSize(new THREE.Vector3()).multiply(m.getWorldScale(new THREE.Vector3()));
    void s;
  });
  // ground on solid parts only (additive glow cards can hang below the feet)
  const box = new THREE.Box3();
  root.traverse((m) => { if (m.isMesh && !m.userData.noShadow) box.expandByObject(m); });
  for (const c of root.children) c.position.y -= box.min.y;
  root.updateMatrixWorld(true);
  const anims = typeof animations === 'function' ? animations() : animations;
  return finalize(root, { type, variant, options: o, animations: anims });
}

/** Piecewise smooth interpolation through [[t, v], ...] (t ascending). */
export function keys(t, k) {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const f = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      const s = f * f * (3 - 2 * f);
      return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * s;
    }
  }
  return k[k.length - 1][1];
}

/** Zigzag glowing streaks (lightning / lava veins) between pairs of points. */
export function zigzag(a, b, r, mat, rand, { parent, name = 'veins', kinks = 5, amp = 0.08 } = {}) {
  const A = V3(a), B = V3(b);
  const pts = [A];
  const d = B.clone().sub(A);
  const perp = new THREE.Vector3(-d.z, 0, d.x).normalize();
  if (perp.lengthSq() < 0.1) perp.set(1, 0, 0);
  for (let i = 1; i < kinks; i++) pts.push(A.clone().addScaledVector(d, i / kinks).addScaledVector(perp, (i % 2 ? 1 : -1) * amp * (0.5 + rand())));
  pts.push(B);
  const geos = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const g = new THREE.CylinderGeometry(r, r, pts[i].distanceTo(pts[i + 1]) + r, 5);
    geos.push(orient(g.translate(0, pts[i].distanceTo(pts[i + 1]) / 2, 0), pts[i], pts[i + 1].clone().sub(pts[i])));
  }
  return mesh(merge(geos), mat, { parent, name });
}
