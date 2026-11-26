// Shared helpers for the history category: trims (era finishes), role-based materials,
// generic weathering / snow / ivy / night-fire passes, ruin cutting, rubble and the
// "settle on the ground" wrapper every factory ends with.
import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { clip, numberTrack, moveTrack, rotateTrack, spinTrack, scaleTrack, pingPong, wave } from '../../core/animation.js';
import { lampGroup, lampTracks } from '../../core/lamps.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, tube, rng, clip, numberTrack, moveTrack, rotateTrack, spinTrack, scaleTrack, pingPong, wave, lampGroup, lampTracks, mergeVertices };

/* --------------------------------- trims --------------------------------- */
/*
 * Every trim is a bag of flags the builders and the generic passes read:
 *   stone/wood/cloth…  colour overrides for material roles
 *   wear (0..1)        grime, dirt at the foot, erosion, chips on the ground
 *   moss (0..1)        green growth on up-facing surfaces
 *   ruin               builders cut the model down, topple the top, scatter rubble
 *   ivy                climbing vines + leaves, grass patch at the foot
 *   snow               snow sheets on every up-facing surface + snowy ground patch
 *   night              braziers / candles with live flames, darker tint
 *   paint / gild       polychrome paint or gold on accents and details
 */
export const TRIMS = {
  weathered: { wear: 1, moss: 0.5, stone: '#b7ad98', wood: '#857b6c', iron: 'rust', bronze: 'verdigris', clothFade: 0.45, chips: 1 },
  ruined: { wear: 0.8, moss: 0.35, ruin: true, stone: '#c2b49a', wood: '#6e6355', iron: 'rust', bronze: 'verdigris', clothFade: 0.5, tattered: true },
  polychrome: { paint: true, stone: '#efe2c6', accent: '#b2382c', detail: '#2a4f9f', trimGold: true },
  painted: { paint: true, wood: '#7a2c22', accent: '#1f4f8a', detail: '#d9a23a', trimGold: true },
  marble: { stone: '#f3f1ec', polish: true, veins: 1 },
  sandstone: { stone: '#d6a565', strata: 1 },
  granite: { stone: '#8f8a86', speckle: 1, polish: true },
  basalt: { stone: '#3d3d40', speckle: 0.6 },
  gilded: { gild: true, stone: '#f4f0e6', polish: true, wood: '#3a2416', cloth: '#7a1424' },
  royal: { gild: true, wood: '#4a2614', cloth: '#5b1a6e', cloth2: '#e3b341', polish: true },
  'dark-oak': { wood: '#3b2617', iron: '#1d1d20' },
  'iron-bound': { wood: '#6b4a2c', ironHeavy: true, iron: '#2a2b2e' },
  overgrown: { ivy: 1, moss: 1, wear: 0.6, stone: '#bdb39e', wood: '#7d7466' },
  jungle: { ivy: 1.8, moss: 1.2, wear: 0.8, stone: '#a9a28c', wood: '#6f6758' },
  snowy: { snow: 1, wear: 0.15, stone: '#cfcac0' },
  night: { night: true },
  desert: { sand: 1, wear: 0.7, stone: '#d8b27a' },
  // vessels / pottery
  'black-figure': { vase: 'black-figure', clay: '#c4642f' },
  'red-figure': { vase: 'red-figure', clay: '#c46a35' },
  glazed: { vase: 'glazed', glaze: '#2f9aa0' },
  celadon: { vase: 'glazed', glaze: '#9fc4a4' },
  burnished: { vase: 'burnished', clay: '#2a2421' },
  slipware: { vase: 'slipware', clay: '#b4612e' },
  broken: { broken: true, wear: 0.6, clay: '#b97a52' },
  bronze: { metalVase: 'bronze' },
  silver: { metalVase: 'silver', coin: 'silver' },
  shipwreck: { barnacles: 1, wear: 1, clay: '#8e7a5c', moss: 0.4, mossColor: '#5d7a62' },
  buried: { buried: true, wear: 0.7, clay: '#a77452' },
  // coins
  electrum: { coin: 'electrum' },
  patina: { coin: 'patina' },
  worn: { coin: 'worn', wear: 1 },
  holed: { coin: 'bronze', holed: true },
  tarnished: { coin: 'tarnished' },
  iron: { coin: 'iron', wood: '#4b3a2a' },
  // scrolls / books
  papyrus: { paper: '#d8c38c' },
  vellum: { paper: '#efe3c8' },
  burnt: { paper: '#c9b48a', burnt: true },
  sealed: { seals: true, paper: '#e8d9b2' },
  imperial: { paper: '#efe0b6', cloth: '#5b1a6e', gild: true },
  // wood species / hourglasses
  oak: { wood: '#a87a46' },
  ebony: { wood: '#1e1714', iron: '#b38b3c' },
  brass: { brassFrame: true, wood: '#5b3a24' },
  ivory: { wood: '#efe6d2' },
  unlit: { unlit: true },
  // castles
  whitewashed: { stone: '#eeeae0', roof: '#a8432c', cloth: '#1f4f9a' },
  // heraldry (banners)
  crusader: { heraldry: 'cross', cloth: '#f1ede4', cloth2: '#b3121c' },
  checky: { heraldry: 'checky', cloth: '#1e3f8a', cloth2: '#e8c33a' },
  chevron: { heraldry: 'chevron', cloth: '#0f6b3a', cloth2: '#f1ede4' },
  quarterly: { heraldry: 'quarterly', cloth: '#b3121c', cloth2: '#e8c33a' },
  saltire: { heraldry: 'saltire', cloth: '#1a4fa0', cloth2: '#f4f4f4' },
};

export const STONE_TRIMS = ['weathered', 'ruined', 'polychrome', 'marble', 'sandstone', 'granite', 'basalt', 'gilded', 'overgrown', 'snowy', 'night'];
export const WOOD_TRIMS = ['weathered', 'ruined', 'royal', 'dark-oak', 'painted', 'iron-bound', 'overgrown', 'snowy', 'night'];

/** Resolve options → { o, variant, trim, T, V }. */
export function setup(options, VARIANTS, type, base = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(VARIANTS, o.variant, type);
  const trim = o.trim && TRIMS[o.trim] ? o.trim : null;
  const V = VARIANTS[variant] || {};
  const T = { wear: 0, moss: 0, ...base, ...V, ...(trim ? TRIMS[trim] : {}), trim, variant, type };
  T.r = rng(`${type}-${variant}-${trim}`);
  T.mats = makeMats(T);
  T.o = o;
  return { o, variant, trim, T, V };
}

/* ------------------------------- materials ------------------------------- */

function std(name, color, rough = 0.8, extra = {}) {
  return new THREE.MeshStandardMaterial({ name, color: M.toColor(color), roughness: rough, metalness: 0, ...extra });
}
/** Weatherable material: vertex colours carry grime / moss / speckle (filled in by done()). */
function weatherMat(name, color, T, rough = 0.85) {
  const polish = T.polish && !T.wear;
  const m = polish
    ? new THREE.MeshPhysicalMaterial({ name, color: M.toColor(color), roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.25, vertexColors: true })
    : std(name, color, rough, { vertexColors: true });
  m.userData.weather = true;
  return m;
}
function shade(c, k) {
  return '#' + M.toColor(c).multiplyScalar(k).getHexString();
}
function metalFor(kind, T) {
  if (kind === 'rust') return std('rust', '#6b3d24', 0.95, { metalness: 0.3 });
  if (kind === 'verdigris') return std('verdigris', '#5f9c84', 0.8, { metalness: 0.25 });
  return M.metal(kind, 0.4);
}

/** Lazily built role materials for a trim. */
function makeMats(T) {
  const cache = {};
  const def = {
    stone: () => weatherMat('stone', T.stone ?? '#e3d8c1', T),
    stone2: () => weatherMat('stone', shade(T.stone ?? '#e3d8c1', 0.86), T),
    accent: () => (T.gild ? M.metal('#d4a63a', 0.25) : T.paint ? std('paint', T.accent ?? '#b2382c', 0.7) : weatherMat('stone', T.stone ?? '#e3d8c1', T)),
    detail: () => (T.gild ? M.metal('#e0b44a', 0.2) : T.paint ? std('paint', T.detail ?? '#2a4f9f', 0.7) : weatherMat('stone', shade(T.stone ?? '#e3d8c1', 0.95), T)),
    gold: () => (T.wear ? M.metal('#a88a43', 0.55) : M.metal('#d4a63a', 0.22)),
    iron: () => (T.iron === 'rust' ? metalFor('rust') : M.metal(T.iron ?? '#2e2f33', 0.55)),
    bronze: () => (T.bronze === 'verdigris' ? metalFor('verdigris') : M.metal('#a8703c', 0.35)),
    wood: () => weatherMat('wood', T.wood ?? '#8a5a34', T, 0.7),
    wood2: () => weatherMat('wood', shade(T.wood ?? '#8a5a34', 0.7), T, 0.7),
    cloth: () => M.fabric(fade(T.cloth ?? T.o?.color ?? '#9a1f1f', T)),
    cloth2: () => M.fabric(fade(T.cloth2 ?? '#d9b04a', T)),
    clay: () => weatherMat('clay', T.clay ?? '#b8643a', T, 0.8),
    rope: () => std('rope', '#a8875a', 0.95),
    straw: () => std('straw', '#d6b45c', 0.95),
    water: () => new THREE.MeshPhysicalMaterial({ name: 'water', color: '#1d3b40', roughness: 0.05, clearcoat: 1 }),
    glass: () => new THREE.MeshPhysicalMaterial({ name: 'glass', color: '#e8f2f4', roughness: 0.05, transmission: 0.9, thickness: 0.004, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }),
    sand: () => std('sand', '#e1bf7c', 0.95),
    paper: () => std('paper', T.paper ?? '#e6d6ad', 0.9),
    leather: () => std('leather', T.wear ? '#5e4a38' : '#6b3f22', 0.65),
    dark: () => std('dark', '#151312', 0.9),
    wax: () => std('wax', '#9c1b1b', 0.5),
    candle: () => std('wax', '#efe6cf', 0.6),
    coal: () => std('coal', '#1b1714', 0.95, { emissive: M.toColor('#4a1404'), emissiveIntensity: 0.6 }),
    snow: () => std('snow', '#f4f7fb', 0.92),
    moss: () => std('moss', '#4f6b2a', 0.95),
    leaf: () => new THREE.MeshStandardMaterial({ name: 'leaf', color: '#3e6b2a', roughness: 0.7, side: THREE.DoubleSide }),
    grass: () => new THREE.MeshStandardMaterial({ name: 'grass', color: '#5f8a34', roughness: 0.9, side: THREE.DoubleSide }),
  };
  return new Proxy(cache, { get: (c, k) => (k in c ? c[k] : def[k] ? (c[k] = def[k]()) : undefined) });
}
function fade(color, T) {
  const c = M.toColor(color);
  if (T.clothFade) c.lerp(new THREE.Color('#a39a88'), T.clothFade);
  if (T.night) c.multiplyScalar(0.8);
  return c;
}

/* --------------------------------- noise --------------------------------- */

function h3(x, y, z) {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) * 2.3283064365386963e-10;
}
/** Smooth 3D value noise in [0,1]. */
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const a0 = h3(xi, yi, zi), a1 = h3(xi + 1, yi, zi), a2 = h3(xi, yi + 1, zi), a3 = h3(xi + 1, yi + 1, zi);
  const b0 = h3(xi, yi, zi + 1), b1 = h3(xi + 1, yi, zi + 1), b2 = h3(xi, yi + 1, zi + 1), b3 = h3(xi + 1, yi + 1, zi + 1);
  const p0 = a0 + (a1 - a0) * u, p1 = a2 + (a3 - a2) * u, q0 = b0 + (b1 - b0) * u, q1 = b2 + (b3 - b2) * u;
  const p = p0 + (p1 - p0) * v, q = q0 + (q1 - q0) * v;
  return p + (q - p) * w;
}
export const fbm = (x, y, z) => noise3(x, y, z) * 0.65 + noise3(x * 2.3 + 7, y * 2.3, z * 2.3) * 0.35;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* -------------------------------- geometry -------------------------------- */

/** Longest-edge bisection until every edge ≤ maxEdge (attributes interpolated). */
export function densify(geo, maxEdge, maxTris = 60000) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const names = Object.keys(g.attributes).filter((n) => !g.attributes[n].isInterleavedBufferAttribute);
  const src = names.map((n) => g.attributes[n].array);
  const sz = names.map((n) => g.attributes[n].itemSize);
  const P = g.attributes.position.array;
  const nv = P.length / 3;
  // quick check: anything to split?
  const me2 = maxEdge * maxEdge;
  let need = false;
  for (let t = 0; t < nv && !need; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = (t + e) * 3, b = (t + ((e + 1) % 3)) * 3;
      if ((P[a] - P[b]) ** 2 + (P[a + 1] - P[b + 1]) ** 2 + (P[a + 2] - P[b + 2]) ** 2 > me2) { need = true; break; }
    }
  }
  if (!need) return geo;
  // vertex pool: each vertex = concatenated attributes
  const stride = sz.reduce((x, y) => x + y, 0);
  let pool = new Float32Array(Math.max(1024, nv * stride * 2));
  let pn = 0;
  const addV = (vals, off) => {
    if ((pn + 1) * stride > pool.length) { const np = new Float32Array(pool.length * 2); np.set(pool); pool = np; }
    for (let k = 0; k < stride; k++) pool[pn * stride + k] = vals[off + k];
    return pn++;
  };
  const tmp = new Float32Array(stride);
  for (let i = 0; i < nv; i++) {
    let o = 0;
    for (let ai = 0; ai < names.length; ai++) for (let k = 0; k < sz[ai]; k++) tmp[o++] = src[ai][i * sz[ai] + k];
    addV(tmp, 0);
  }
  const mid = (a, b) => {
    for (let k = 0; k < stride; k++) tmp[k] = (pool[a * stride + k] + pool[b * stride + k]) / 2;
    return addV(tmp, 0);
  };
  const d2 = (a, b) => { const A = a * stride, B = b * stride; return (pool[A] - pool[B]) ** 2 + (pool[A + 1] - pool[B + 1]) ** 2 + (pool[A + 2] - pool[B + 2]) ** 2; };
  const out = [];
  const stack = [];
  for (let t = 0; t < nv; t += 3) {
    stack.push(t, t + 1, t + 2, 0);
    while (stack.length) {
      const depth = stack.pop(), c = stack.pop(), b = stack.pop(), a = stack.pop();
      const e0 = d2(a, b), e1 = d2(b, c), e2 = d2(c, a);
      const m = Math.max(e0, e1, e2);
      let thin = false;
      if (m > me2) {
        // skip slivers (bevel strips): area tiny compared with the edge limit
        const A = a * stride, B = b * stride, C = c * stride;
        const ux = pool[B] - pool[A], uy = pool[B + 1] - pool[A + 1], uz = pool[B + 2] - pool[A + 2];
        const vx = pool[C] - pool[A], vy = pool[C + 1] - pool[A + 1], vz = pool[C + 2] - pool[A + 2];
        const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
        thin = cx * cx + cy * cy + cz * cz < me2 * me2 * 0.0025;
      }
      if (m <= me2 || thin || depth > 14 || out.length / 3 > maxTris) { out.push(a, b, c); continue; }
      if (m === e0) { const x = mid(a, b); stack.push(a, x, c, depth + 1, x, b, c, depth + 1); }
      else if (m === e1) { const x = mid(b, c); stack.push(b, x, a, depth + 1, x, c, a, depth + 1); }
      else { const x = mid(c, a); stack.push(c, x, b, depth + 1, x, a, b, depth + 1); }
    }
  }
  const res = new THREE.BufferGeometry();
  let o = 0;
  names.forEach((n, ai) => {
    const s = sz[ai];
    const arr = new Float32Array(out.length * s);
    for (let i = 0; i < out.length; i++) for (let k = 0; k < s; k++) arr[i * s + k] = pool[out[i] * stride + o + k];
    res.setAttribute(n, new THREE.BufferAttribute(arr, s));
    o += s;
  });
  return res;
}

/** Jittered low-poly rock / rubble stone (unit size, centred). */
export function rockGeo(r, seed = 1, detail = 0) {
  const g = new THREE.DodecahedronGeometry(1, detail);
  const rr = rng(seed);
  const pos = g.attributes.position;
  const cache = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!cache.has(k)) cache.set(k, 0.75 + rr() * 0.45);
    const s = cache.get(k);
    pos.setXYZ(i, pos.getX(i) * s, pos.getY(i) * s, pos.getZ(i) * s);
  }
  g.computeVertexNormals();
  return g;
}

/** Ashlar block with slightly irregular rounded edges. */
export function blockGeo(w, h, d, r = 0.02) {
  return roundedBox(w, h, d, Math.min(r, w / 4, h / 4, d / 4), 2);
}

/** Bake a mesh's world transform into a fresh geometry clone. */
function baked(m) {
  const g = m.geometry.clone();
  g.applyMatrix4(m.matrixWorld);
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv' && k !== 'color') g.deleteAttribute(k);
  g.morphAttributes = {};
  return g;
}

/** Add an InstancedMesh with the given matrices (or [pos, rotY, scale] specs). */
export function instanced(geo, mat, items, parent, name) {
  const im = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  items.forEach((it, i) => {
    if (it.isMatrix4) return im.setMatrixAt(i, it);
    p.set(...it.p);
    e.set(...(it.r ?? [0, 0, 0]));
    q.setFromEuler(e);
    typeof it.s === 'number' ? s.setScalar(it.s) : s.set(...(it.s ?? [1, 1, 1]));
    im.setMatrixAt(i, m4.compose(p, q, s));
    if (it.c) im.setColorAt(i, M.toColor(it.c));
  });
  im.count = items.length;
  im.computeBoundingBox?.();
  im.computeBoundingSphere();
  if (name) im.name = name;
  if (parent && items.length) parent.add(im);
  return im;
}

/* -------------------------------- rubble -------------------------------- */

/**
 * Scatter n broken stones on the ground around a footprint (box: {x0,x1,z0,z1} or THREE.Box3).
 * kind 'rock' (irregular) or 'block' (cut ashlar pieces).
 */
export function rubble(parent, T, box, n, size, { mat, kind = 'mix', spread = 0.6 } = {}) {
  const b = box.isBox3 ? { x0: box.min.x, x1: box.max.x, z0: box.min.z, z1: box.max.z } : box;
  const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  const hx = (b.x1 - b.x0) / 2, hz = (b.z1 - b.z0) / 2;
  const r = T.r;
  const m = mat ?? T.mats.stone;
  let top = parent;
  while (top.parent) top = top.parent;
  top.updateMatrixWorld(true); // positions may have just changed (e.g. a tipped table)
  const sb = solidBox(top);
  const ground = sb.isEmpty() ? 0 : Math.min(0, sb.min.y);
  const g = group('rubble', { parent });
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const k = 1.02 + r() * spread;
    const x = cx + Math.cos(a) * (hx * k + size * 0.6);
    const z = cz + Math.sin(a) * (hz * k + size * 0.6);
    const s = size * (0.45 + r() * 0.75);
    const block = kind === 'block' || (kind === 'mix' && r() < 0.5);
    let geo;
    if (block) geo = blockGeo(s * (1 + r()), s * (0.5 + r() * 0.4), s * (0.8 + r() * 0.5), s * 0.12);
    else geo = rockGeo(1, `${T.type}${i}${T.trim}`).scale(s * 0.6, s * 0.35, s * 0.5);
    geo.computeBoundingBox();
    const rm = mesh(geo, m, { parent: g, at: [x, 0, z], rot: [0, r() * 6.28, 0], name: 'rubble' });
    rm.position.y = ground - geo.boundingBox.min.y - 0.003;
  }
  return g;
}

/* ------------------------------- ruin cut ------------------------------- */

/**
 * Cut everything above a jagged plane at height `cut` (world y, model built at origin).
 * Upper parts are optionally toppled (laid on their side next to the stump) — or dropped.
 * Returns the bbox of what still stands.
 */
export function ruinCut(root, T, cut, { jag = 0.12, topple = true, dir = 1, maxFallen = 60, slope = 0 } = {}) {
  root.updateMatrixWorld(true);
  const meshes = [];
  root.traverse((m) => { if (m.isMesh && !m.userData.noShadow && m.material?.blending !== THREE.AdditiveBlending) meshes.push(m); });
  const jy = (x, z) => cut + slope * x + (noise3(x * 3.1, 0.5, z * 3.1) - 0.5) * 2 * jag + (noise3(x * 11, 3, z * 11) - 0.5) * jag * 0.6;
  const fallen = [];
  const box = new THREE.Box3();
  for (const m of meshes) {
    box.setFromObject(m);
    if (m.isInstancedMesh) {
      const keep = [];
      const m4 = new THREE.Matrix4(), p = new THREE.Vector3();
      for (let i = 0; i < m.count; i++) {
        m.getMatrixAt(i, m4);
        p.setFromMatrixPosition(m4).applyMatrix4(m.matrixWorld);
        if (p.y < jy(p.x, p.z)) keep.push(m4.clone());
      }
      keep.forEach((k, i) => m.setMatrixAt(i, k));
      m.count = keep.length;
      if (!keep.length) m.removeFromParent();
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
      m.boundingBox = null;
      continue;
    }
    const jc = jy((box.min.x + box.max.x) / 2, (box.min.z + box.max.z) / 2);
    const small = box.getSize(new THREE.Vector3()).length() < jag * 2.5;
    if (box.min.y >= jc - 0.002 || (small && box.min.y > jc - jag)) {
      m.removeFromParent();
      if (fallen.length < maxFallen) fallen.push({ geo: baked(m), mat: m.material, name: m.name });
      continue;
    }
    if (box.max.y <= cut - jag * 1.6) continue;
    let g = baked(m);
    const sz = box.getSize(new THREE.Vector3());
    if (g.attributes.position.count < 2500) g = densify(g, Math.max(0.06, Math.max(sz.x, sz.y, sz.z) / 8), 8000);
    const lower = g.clone();
    const lp = lower.attributes.position;
    for (let i = 0; i < lp.count; i++) {
      const y = jy(lp.getX(i), lp.getZ(i));
      if (lp.getY(i) > y) lp.setY(i, y);
    }
    lower.computeVertexNormals();
    const up = g;
    const upos = up.attributes.position;
    let any = false;
    for (let i = 0; i < upos.count; i++) {
      const y = jy(upos.getX(i), upos.getZ(i));
      if (upos.getY(i) < y) upos.setY(i, y);
      else any = true;
    }
    up.computeVertexNormals();
    up.computeBoundingBox();
    const parent = m.parent;
    m.removeFromParent();
    void parent;
    const nm = new THREE.Mesh(lower, m.material);
    nm.name = m.name;
    root.add(nm);
    if (any && up.boundingBox.max.y - up.boundingBox.min.y > 0.03 && fallen.length < maxFallen) fallen.push({ geo: up, mat: m.material, name: m.name });
  }
  pruneFloating(root);
  root.updateMatrixWorld(true);
  const standing = new THREE.Box3().setFromObject(root);
  if (topple && fallen.length) {
    const G = group('fallen', { parent: root });
    for (const f of fallen) mesh(f.geo, f.mat, { parent: G, name: `fallen-${f.name || 'piece'}` });
    const fb = new THREE.Box3().setFromObject(G);
    const c = fb.getCenter(new THREE.Vector3());
    // pivot about the foot of the fallen piece, lay it along ±x
    const piv = group('fallen-pivot', { parent: root });
    piv.position.set(c.x, fb.min.y, c.z);
    G.position.set(-c.x, -fb.min.y, -c.z);
    piv.add(G);
    piv.rotation.set(0, (T.r() - 0.5) * 0.5, -dir * Math.PI / 2);
    root.updateMatrixWorld(true);
    const nb = new THREE.Box3().setFromObject(piv);
    piv.position.y -= nb.min.y;
    piv.position.x += dir > 0 ? standing.max.x - nb.min.x + 0.05 : standing.min.x - nb.max.x - 0.05;
    root.updateMatrixWorld(true);
    // every lying piece rests on the ground on its own
    const inv = G.getWorldQuaternion(new THREE.Quaternion()).invert();
    for (const ch of G.children) {
      const b = new THREE.Box3().setFromObject(ch);
      if (b.min.y > 0.004) ch.position.add(new THREE.Vector3(0, -b.min.y + 0.002, 0).applyQuaternion(inv));
    }
    root.updateMatrixWorld(true);
  }
  return standing;
}

/** Remove meshes whose bounding boxes no longer connect to the ground (after cutting). */
export function pruneFloating(root, tol = 0.01) {
  root.updateMatrixWorld(true);
  const parts = [];
  root.traverse((m) => { if (m.isMesh && !m.userData.noShadow && m.material?.blending !== THREE.AdditiveBlending) parts.push({ m, b: new THREE.Box3().setFromObject(m).expandByScalar(tol) }); });
  const seen = new Array(parts.length).fill(false);
  const q = [];
  parts.forEach((p, i) => { if (p.b.min.y <= 0.03 + tol) { seen[i] = true; q.push(i); } });
  while (q.length) {
    const i = q.pop();
    for (let j = 0; j < parts.length; j++) if (!seen[j] && parts[i].b.intersectsBox(parts[j].b)) { seen[j] = true; q.push(j); }
  }
  parts.forEach((p, i) => { if (!seen[i]) p.m.removeFromParent(); });
}

/** Vertical crumble of one mesh: cut a single geometry above a jagged plane (no topple). */
export function crumble(geo, cut, jag, seed = 0) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.computeBoundingBox();
  const sz = g.boundingBox.getSize(new THREE.Vector3());
  if (g.attributes.position.count < 1500) g = densify(g, Math.max(0.03, Math.max(sz.x, sz.y, sz.z) / 10), 8000);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = cut + (noise3(p.getX(i) * 3 + seed, 1, p.getZ(i) * 3) - 0.5) * 2 * jag;
    if (p.getY(i) > y) p.setY(i, y);
  }
  g.computeVertexNormals();
  return g;
}

/* ------------------------------ generic passes ------------------------------ */

const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();

function weatherPass(root, T) {
  const mossC = M.toColor(T.mossColor ?? '#55702c');
  const nightK = T.night ? new THREE.Color(0.62, 0.66, 0.82) : null;
  const sandC = M.toColor('#e2c48a');
  const active = T.wear || T.moss || T.speckle || T.veins || T.strata || T.sand || T.night;
  root.traverse((m) => {
    if (!m.isMesh || !m.material?.userData?.weather) return;
    if (!active) { m.material.vertexColors = false; return; }
    const g = m.geometry;
    const pos = g.attributes.position;
    if (!g.attributes.normal) g.computeVertexNormals();
    const nor = g.attributes.normal;
    const base = m.material.color;
    const col = new Float32Array(pos.count * 3);
    const nm = new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
    const erode = T.wear && !m.isInstancedMesh && !m.userData.noErode ? T.wear * 0.004 : 0;
    const c = new THREE.Color(), tc = new THREE.Color();
    const cache = new Map();
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      _n.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
      if (m.isInstancedMesh) { _v.fromBufferAttribute(pos, i); _n.fromBufferAttribute(nor, i); }
      const x = _v.x, y = _v.y, z = _v.z;
      const key = Math.round(x * 2000) * 92837111 + Math.round(y * 2000) * 689287499 + Math.round(z * 2000) * 283923481;
      let N = cache.get(key);
      if (!N) {
        N = [
          T.wear ? fbm(x * 2.2, y * 2.2, z * 2.2) : 0,
          T.wear ? noise3(x * 6, y * 0.6, z * 6) : 0,
          T.moss || T.sand ? fbm(x * 3 + 5, y * 3, z * 3) : 0,
          T.veins || T.strata ? fbm(x * 1.4, y * 1.4, z * 1.4) : 0,
          erode ? (noise3(x * 7, y * 7, z * 7) - 0.5) * erode * 2 : 0,
          erode ? (noise3(x * 7 + 3, y * 7, z * 7) - 0.5) * erode * 2 : 0,
          erode ? (noise3(x * 7, y * 7 + 9, z * 7) - 0.5) * erode * 2 : 0,
        ];
        cache.set(key, N);
      }
      let k = 1;
      if (T.speckle) k *= 1 + (h3(x * 90, y * 90, z * 90) - 0.5) * 0.55 * T.speckle;
      if (T.veins) {
        const v = Math.abs(Math.sin(x * 2.1 + y * 3.3 + z * 1.7 + N[3] * 7));
        k *= 0.84 + 0.16 * smooth(0.02, 0.18, v);
      }
      if (T.strata) k *= 0.9 + 0.1 * Math.sin(y * 9 + N[3] * 3);
      if (T.wear) {
        k *= 1 - T.wear * 0.32 * N[0];
        k *= 1 - T.wear * 0.22 * Math.exp(-Math.max(0, y) / 0.5);
        k *= 1 - T.wear * 0.12 * smooth(0.55, 0.9, N[1]) * (1 - Math.abs(_n.y));
      }
      c.setRGB(k, k, k);
      const mz = T.moss ? T.moss * smooth(0.48, 0.85, _n.y * 0.55 + N[2] * 0.75 + Math.exp(-Math.max(0, y) / 0.4) * 0.25) : 0;
      if (mz > 0) c.lerp(tc.setRGB(mossC.r / base.r, mossC.g / base.g, mossC.b / base.b), mz * 0.9);
      if (T.sand) {
        const sz = smooth(0.6, 0.95, _n.y + N[2] * 0.4) * 0.8;
        c.lerp(tc.setRGB(sandC.r / base.r, sandC.g / base.g, sandC.b / base.b), sz);
      }
      if (nightK) c.multiply(nightK);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      if (erode) {
        _a.fromBufferAttribute(pos, i);
        pos.setXYZ(i, _a.x + N[4], _a.y + N[5], _a.z + N[6]);
      }
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    if (erode) g.computeVertexNormals();
  });
  // any other mesh sharing a vertex-coloured material needs a colour attribute too
  root.traverse((m) => {
    if (m.isMesh && m.material?.vertexColors && !m.geometry.attributes.color) {
      const n = m.geometry.attributes.position.count;
      m.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
    }
  });
}

/** White snow sheets over every up-facing surface (domed in the middle, flush at the edges). */
function snowPass(root, T, diag) {
  const depth = Math.min(0.6, Math.max(0.012, diag * 0.012));
  const maxEdge = Math.max(depth * 3, diag / 45);
  const pts = [];
  root.updateMatrixWorld(true);
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.noShadow || m.userData.noSnow || m.material?.transparent || m.material?.blending === THREE.AdditiveBlending) return;
    const g = m.geometry;
    const pos = g.attributes.position;
    const idx = g.index;
    const n = idx ? idx.count : pos.count;
    if (n > 60000) return;
    for (let t = 0; t < n; t += 3) {
      _a.fromBufferAttribute(pos, idx ? idx.getX(t) : t).applyMatrix4(m.matrixWorld);
      _b.fromBufferAttribute(pos, idx ? idx.getX(t + 1) : t + 1).applyMatrix4(m.matrixWorld);
      _c.fromBufferAttribute(pos, idx ? idx.getX(t + 2) : t + 2).applyMatrix4(m.matrixWorld);
      _n.subVectors(_b, _a).cross(_v.subVectors(_c, _a));
      const area = _n.length();
      if (area < 1e-9) continue;
      _n.divideScalar(area);
      if (_n.y < 0.6 || Math.min(_a.y, _b.y, _c.y) < 0.02) continue;
      pts.push(_a.x, _a.y + 0.003, _a.z, _b.x, _b.y + 0.003, _b.z, _c.x, _c.y + 0.003, _c.z);
    }
  });
  if (!pts.length) return;
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g = densify(g, maxEdge, 40000);
  g = mergeVertices(g, 1e-4);
  const idx = g.index.array;
  const edges = new Map();
  for (let t = 0; t < idx.length; t += 3) {
    for (let e = 0; e < 3; e++) {
      const a = idx[t + e], b = idx[t + ((e + 1) % 3)];
      const k = a < b ? a * 1e7 + b : b * 1e7 + a;
      edges.set(k, (edges.get(k) || 0) + 1);
    }
  }
  const bnd = new Set();
  for (const [k, c] of edges) if (c === 1) { bnd.add(Math.floor(k / 1e7)); bnd.add(k % 1e7); }
  const pos = g.attributes.position;
  const B = [...bnd];
  const stride = Math.max(1, Math.ceil((B.length * pos.count) / 3e6));
  const bx = [], bz = [], by = [];
  for (let i = 0; i < B.length; i += stride) { bx.push(pos.getX(B[i])); by.push(pos.getY(B[i])); bz.push(pos.getZ(B[i])); }
  for (let i = 0; i < pos.count; i++) {
    if (bnd.has(i)) continue;
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let d = Infinity;
    for (let j = 0; j < bx.length; j++) {
      if (Math.abs(by[j] - y) > depth * 6) continue;
      const dd = (bx[j] - x) ** 2 + (bz[j] - z) ** 2;
      if (dd < d) d = dd;
    }
    d = Math.sqrt(d);
    pos.setY(i, y + depth * smooth(0, depth * 2.5, d) * (0.7 + 0.6 * noise3(x * 4, y * 4, z * 4)));
  }
  g.computeVertexNormals();
  const sm = mesh(g, T.mats.snow, { parent: root, name: 'snow' });
  sm.userData.noSnow = true;
}

/** Irregular flat ground patch (snow / grass / sand) under and around the footprint. */
function groundPatch(root, T, box, mat, h, name) {
  const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
  const rx = (box.max.x - box.min.x) / 2 * 1.25 + h * 6, rz = (box.max.z - box.min.z) / 2 * 1.25 + h * 6;
  const shape = new THREE.Shape();
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k = 0.85 + 0.3 * noise3(Math.cos(a) * 2 + 3, Math.sin(a) * 2, 1);
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * rz * k;
    i ? shape.lineTo(x, y) : shape.moveTo(x, y);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h * 0.4, bevelEnabled: true, bevelThickness: h * 0.3, bevelSize: h * 2, bevelSegments: 3, curveSegments: 4 });
  geo.rotateX(-Math.PI / 2);
  geo.computeBoundingBox();
  geo.translate(cx, -geo.boundingBox.min.y - h * 0.15, cz);
  const m = mesh(geo, mat, { parent: root, name });
  m.userData.noSnow = true;
  return m;
}

/** Climbing ivy found by ray-casting onto the real surfaces. */
function ivyPass(root, T, box, diag) {
  const s = Math.min(3, Math.max(0.25, diag / 6));
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const targets = [];
  root.traverse((m) => {
    if (m.isMesh && !m.isInstancedMesh && !m.userData.noShadow && m.material?.blending !== THREE.AdditiveBlending && !m.material?.transparent && m.name !== 'snow') targets.push(m);
  });
  targets.sort((a, b) => {
    const va = new THREE.Box3().setFromObject(a).getSize(_a), la = va.x * va.y * va.z;
    const vb = new THREE.Box3().setFromObject(b).getSize(_b), lb = vb.x * vb.y * vb.z;
    return lb - la;
  });
  const tg = targets.slice(0, 8);
  const tgb = tg.map((o) => new THREE.Box3().setFromObject(o));
  const ray = new THREE.Raycaster();
  const r = T.r;
  const vines = Math.round((4 + 4 * Math.min(2, T.ivy)) * Math.min(1.6, Math.max(0.7, (size.x + size.z) / Math.max(0.5, size.y) / 2)));
  const leaves = [];
  const vm = new THREE.MeshStandardMaterial({ name: 'vine', color: '#4a3b22', roughness: 0.9 });
  const R = diag * 1.2;
  for (let v = 0; v < vines; v++) {
    let a = r() * Math.PI * 2;
    const pts = [];
    const top = size.y * (0.35 + r() * 0.6 * Math.min(1, T.ivy));
    const step = Math.max(size.y / 12, 0.04 * s);
    for (let y = box.min.y + 0.02; y < box.min.y + top; y += step) {
      const d = _a.set(Math.cos(a), 0, Math.sin(a));
      ray.set(_b.set(center.x + d.x * R, y, center.z + d.z * R), _c.set(-d.x, 0, -d.z));
      ray.far = R * 2;
      const hit = ray.intersectObjects(tg.filter((o, oi) => tgb[oi].min.y <= y && tgb[oi].max.y >= y), false)[0];
      if (!hit) break;
      const nrm = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      const p = hit.point.clone().addScaledVector(nrm, 0.004 * s);
      if (pts.length && p.distanceTo(pts[pts.length - 1]) > step * 3) break;
      pts.push(p);
      a += (r() - 0.5) * 0.5 / Math.max(0.3, Math.max(size.x, size.z));
      for (let k = 0; k < 4; k++) {
        const q = p.clone().addScaledVector(nrm, 0.003 * s);
        const m4 = new THREE.Matrix4().lookAt(q, q.clone().add(nrm), new THREE.Vector3(r() - 0.5, 1, r() - 0.5).normalize());
        const sc = (0.05 + r() * 0.04) * s;
        m4.multiply(new THREE.Matrix4().makeRotationZ(r() * 6.28)).scale(_v.set(sc, sc, sc));
        m4.setPosition(q);
        leaves.push(m4);
      }
    }
    if (pts.length >= 2) {
      pts[0].y = Math.min(pts[0].y, 0.01);
      curveTube(pts.map((p) => p.toArray()), 0.007 * s, vm, { parent: root, segments: Math.min(60, pts.length * 4), radialSegments: 5, name: 'ivy' }).userData.noSnow = true;
    } else leaves.splice(leaves.length - 4 * pts.length, 4 * pts.length);
  }
  if (leaves.length) {
    const lg = new THREE.ShapeGeometry(leafShape(), 3);
    instanced(lg, T.mats.leaf, leaves, root, 'ivy-leaves');
  }
}
function leafShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.55, -0.2, 0.6, 0.35, 0, 0.55);
  s.bezierCurveTo(-0.6, 0.35, -0.55, -0.2, 0, -0.5);
  return s;
}

/** Grass tufts around the foot. */
function grassTufts(root, T, box, diag, n) {
  const s = Math.min(2, Math.max(0.25, diag / 5));
  const blade = new THREE.ConeGeometry(0.012 * s, 0.16 * s, 3, 1);
  blade.translate(0, 0.08 * s, 0);
  const items = [];
  const r = T.r;
  root.updateMatrixWorld(true);
  const gy = Math.min(box.min.y, solidBox(root).min.y) - 0.004; // root blades just into the ground
  const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
  const hx = (box.max.x - box.min.x) / 2, hz = (box.max.z - box.min.z) / 2;
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28, k = 0.9 + r() * 0.45;
    const x = cx + Math.cos(a) * (hx * k + 0.05 * s), z = cz + Math.sin(a) * (hz * k + 0.05 * s);
    for (let b = 0; b < 5; b++) items.push({ p: [x + (r() - 0.5) * 0.08 * s, gy, z + (r() - 0.5) * 0.08 * s], r: [(r() - 0.5) * 0.7, r() * 6, (r() - 0.5) * 0.7], s: 0.6 + r() * 0.8 });
  }
  instanced(blade, T.mats.grass, items, root, 'grass');
}

/* ------------------------------- fire / lamps ------------------------------- */

/** Teardrop flame geometry (height h) standing on (x,y,z). */
export function flameGeo(h, x = 0, y = 0, z = 0) {
  const r = h * 0.32;
  const g = lathe([[0, 0], [r * 0.7, h * 0.08], [r, h * 0.25], [r * 0.8, h * 0.5], [r * 0.4, h * 0.78], [0, h]], 14);
  g.translate(x, y, z);
  return g;
}

/** Iron brazier on a tripod with coals; the flame is added to lamp group `fire`. */
export function brazier(parent, T, fire, s, at) {
  const g = group('brazier', { parent, at });
  const iron = M.metal('#2a2a2c', 0.6);
  const H = 1.0 * s, R = 0.26 * s;
  mesh(lathe([[0.03 * s, 0], [R * 0.6, 0.02 * s], [R, 0.17 * s], [R * 1.04, 0.19 * s], [R * 0.97, 0.19 * s], [R * 0.56, 0.035 * s], [0.0, 0.03 * s]], 24), iron, { parent: g, at: [0, H - 0.17 * s, 0], name: 'brazier-bowl' }).material.side = THREE.DoubleSide;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    curveTube([[Math.cos(a) * R * 1.05, 0.012 * s * 0, Math.sin(a) * R * 1.05], [Math.cos(a) * R * 0.5, H * 0.5, Math.sin(a) * R * 0.5], [Math.cos(a) * R * 0.75, H - 0.08 * s, Math.sin(a) * R * 0.75]], 0.014 * s, iron, { parent: g, segments: 12, radialSegments: 6 });
  }
  mesh(new THREE.TorusGeometry(R * 0.5, 0.01 * s, 6, 24).rotateX(Math.PI / 2), iron, { parent: g, at: [0, H * 0.5, 0] });
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9, rr = i ? R * 0.55 : 0;
    mesh(rockGeo(1, i + 3).scale(0.07 * s, 0.05 * s, 0.07 * s), T.mats.coal, { parent: g, at: [Math.cos(a) * rr, H - 0.06 * s, Math.sin(a) * rr] });
  }
  fire.add(g, { geometry: flameGeo(0.45 * s, 0, H - 0.07 * s, 0), normal: [0, 0.2, 1], depth: 0.1 * s, glowSize: 1.3 * s });
  fire.add(g, { geometry: flameGeo(0.3 * s, 0.07 * s, H - 0.08 * s, 0.04 * s), normal: [0, 0.2, 1], depth: 0.05 * s, glowSize: 0.6 * s });
  return g;
}

/** Candle in a dish (small night light for tabletop artefacts). */
export function candle(parent, T, fire, s, at) {
  const g = group('candle', { parent, at });
  const brass = M.metal('#b8913f', 0.3);
  mesh(lathe([[0, 0], [0.045 * s, 0], [0.05 * s, 0.008 * s], [0.046 * s, 0.012 * s], [0.012 * s, 0.012 * s], [0.012 * s, 0.025 * s], [0, 0.025 * s]], 24), brass, { parent: g });
  mesh(new THREE.CylinderGeometry(0.011 * s, 0.012 * s, 0.09 * s, 14), T.mats.candle, { parent: g, at: [0, 0.065 * s, 0] });
  mesh(new THREE.CylinderGeometry(0.0012 * s, 0.0012 * s, 0.012 * s, 4), T.mats.dark, { parent: g, at: [0, 0.114 * s, 0] });
  fire.add(g, { geometry: flameGeo(0.035 * s, 0, 0.114 * s, 0), normal: [0, 0.2, 1], depth: 0.01 * s, glowSize: 0.14 * s });
  return g;
}

/** Light a lamp group (flame lit in the still pose) and return its 'fire' flicker tracks. */
export function lightUp(grp, k = 2.6, glow = 0.85) {
  grp.lens.emissiveIntensity = k;
  grp.glow.opacity = glow;
  grp.lens.toneMapped = false;
}
export function flickerTracks(name, k = 2.6, glow = 0.85) {
  const r = rng(name);
  const vals = Array.from({ length: 13 }, () => 0.75 + r() * 0.5);
  vals[12] = vals[0];
  const f = (t) => { const i = t * 12, a = Math.floor(i), b = Math.min(12, a + 1); return vals[a] + (vals[b] - vals[a]) * (i - a); };
  return [numberTrack(`${name}.material.emissiveIntensity`, 1.2, (t) => k * f(t), 24), numberTrack(`${name}_glow.material.opacity`, 1.2, (t) => Math.min(1, glow * f(t)), 24)];
}

/* --------------------------------- done --------------------------------- */

/** Bounding box of everything except glow cards. */
export function solidBox(root) {
  const b = new THREE.Box3();
  root.traverse((m) => {
    if (!m.isMesh || m.userData.noShadow || m.material?.blending === THREE.AdditiveBlending) return;
    // instanced meshes: box must cover the instances, not the bare geometry at the origin
    if (m.isInstancedMesh) { if (!m.count) return; m.computeBoundingBox(); }
    b.expandByObject(m);
  });
  return b;
}

/**
 * Generic trim passes, ground settle and finalize.
 * anims: array or () => array of AnimationClips (called after settling).
 */
export function done(root, T, anims = []) {
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  const diag = box.getSize(new THREE.Vector3()).length();
  const detail = T.wear || T.moss || T.speckle || T.veins || T.strata || T.sand;
  // big flat faces get evenly spaced vertices (surface-contact checks + weathering detail)
  const maxE = detail ? Math.max(0.1, diag / 26) : Math.max(0.7, diag / 16);
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || m.userData.noShadow || m.userData.noDensify) return;
    const g = m.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    const ws = m.getWorldScale(_v);
    const s = g.boundingBox.getSize(_a).multiply(ws);
    const lim = m.material?.userData?.weather ? maxE : Math.max(0.7, diag / 16);
    if (Math.max(s.x, s.y, s.z) > lim && g.attributes.position.count < (lim === maxE && detail ? 4000 : 20000)) {
      const k = Math.max(1e-6, (Math.abs(ws.x) + Math.abs(ws.y) + Math.abs(ws.z)) / 3);
      m.geometry = densify(g, lim / k, detail ? 12000 : 5000);
      if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
    }
  });
  if (T.chips && !T.ruin) rubble(root, T, box, 4 + Math.floor(T.r() * 3), Math.max(0.02, diag * 0.025), { kind: 'rock', spread: 0.4 });
  weatherPass(root, T);
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  if (T.snow) {
    snowPass(root, T, diag);
    groundPatch(root, T, box, T.mats.snow, Math.max(0.01, diag * 0.008), 'snow-ground');
  }
  if (T.ivy) {
    ivyPass(root, T, box, diag);
    groundPatch(root, T, box, T.mats.moss, Math.max(0.008, diag * 0.005), 'grass-ground');
    grassTufts(root, T, box, diag, Math.round(14 * T.ivy));
  }
  if (T.sand) groundPatch(root, T, box, T.mats.sand, Math.max(0.01, diag * 0.01), 'sand-drift');
  let fire = null;
  const preFire = root.children.length;
  if (T.night && !T.noNightFire) {
    fire = lampGroup('fire', 'amber');
    const H = box.max.y - box.min.y;
    const w = box.max.x - box.min.x;
    if (H < 0.45 && diag < 1.4) {
      const s = Math.max(0.6, Math.min(1.6, diag * 2.5));
      candle(root, T, fire, s, [box.max.x + 0.06 * s, box.min.y, box.max.z * 0.3]);
    } else {
      const s = Math.max(0.5, Math.min(12, H / 3.2));
      for (const sx of [-1, 1]) brazier(root, T, fire, s, [sx > 0 ? box.max.x + 0.4 * s : box.min.x - 0.4 * s, box.min.y, box.max.z + 0.2 * s - Math.min(w, 2) * 0]);
    }
    lightUp(fire);
    // braziers/candles must stand on the SAME ground as the model; if one dipped below it,
    // the drop-to-ground below would lift the whole model into the air
    root.updateMatrixWorld(true);
    for (const c of root.children.slice(preFire)) {
      const b = new THREE.Box3().setFromObject(c);
      if (!b.isEmpty() && b.min.y < box.min.y) c.position.y += box.min.y - b.min.y;
    }
  }
  root.updateMatrixWorld(true);
  box = solidBox(root);
  for (const c of root.children) c.position.y -= box.min.y;
  root.updateMatrixWorld(true);
  let list = typeof anims === 'function' ? anims() : anims;
  list = (list || []).filter(Boolean);
  if (fire) list.push(clip('fire', 1.2, flickerTracks('fire')));
  // drop clips whose targets were cut away (ruined trims)
  list = list.filter((c) => c.tracks.every((t) => root.getObjectByName(THREE.PropertyBinding.parseTrackName(t.name).nodeName)));
  const o = T.o;
  return finalize(root, { type: T.type, variant: T.variant, options: o, animations: list });
}

/* ------------------------------ canvas texture ------------------------------ */

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

/** Vertex-coloured grid plane (w×d on XZ, top at y=0) painted by fn(u,v) → colour. */
export function paintedPlane(w, d, nx, nz, fn) {
  const g = new THREE.PlaneGeometry(w, d, nx, nz).rotateX(-Math.PI / 2).toNonIndexed();
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let t = 0; t < pos.count; t += 3) {
    const cx = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3, cz = (pos.getZ(t) + pos.getZ(t + 1) + pos.getZ(t + 2)) / 3;
    c.set(fn(cx / w + 0.5, cz / d + 0.5));
    for (let k = 0; k < 3; k++) { col[(t + k) * 3] = c.r; col[(t + k) * 3 + 1] = c.g; col[(t + k) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
export const vcMat = (rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ name: 'painted', vertexColors: true, color: 0xffffff, roughness: rough, ...extra });
