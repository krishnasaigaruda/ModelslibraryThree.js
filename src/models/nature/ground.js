import * as THREE from 'three';
import { group, mesh, rng, lathe, finalize, normalizeOptions } from '../../core/utils.js';
import { sweep, merge, paintVertices, blob, fbm, barkColor, barkMaterial, snowify, snowMound, seedOf, vcMat, checkVariant, instanced } from './common.js';

const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0);

/* ================================ Rocks ================================ */

/*
 * Real rock types: igneous (granite speckle, basalt columns, porous volcanic),
 * sedimentary (sandstone strata, limestone karren grooves, slate plates) and
 * landforms (cliff, outcrop, arch, scree, cairn, standing stone).
 */
export const ROCK_VARIANTS = {
  boulder: { color: '#5d5953' },
  pebbles: { color: '#6a645d' },
  cliff: { color: '#57514a' },
  mossy: { color: '#57534e', moss: 1 },
  flat: { color: '#686259' },
  granite: { color: '#8a8480', speckle: true },
  sandstone: { color: '#b8744a', strata: 0.07, bands: ['#c8844e', '#a8603a', '#d89a62'] },
  basalt: { color: '#3a3a3c' },
  slate: { color: '#4a5058' },
  volcanic: { color: '#2a2624', pores: true },
  limestone: { color: '#c8c2b4', grooves: 0.08 },
  'river-stones': { color: '#7a7470' },
  cairn: { color: '#7a746c' },
  'standing-stone': { color: '#6e6a64' },
  arch: { color: '#a8704a', strata: 0.05, bands: ['#b87a50', '#98603c', '#c88a5a'] },
  scree: { color: '#6a665e' },
  outcrop: { color: '#625c54', strata: 0.04 },
};
export const ROCK_TRIMS = Object.fromEntries(Object.keys(ROCK_VARIANTS).map((k) => [k, ['small', 'large', 'mossy', 'snow', 'cracked', 'buried', 'cluster', 'lichen']]));

function rockGeometry(r, { seed, scale, strata = 0, detail = 12, amount = 0.3, grooves = 0, smooth = false } = {}) {
  const g = blob(r, { detail: Math.max(detail, 3), seed, amount, freq: 1.4, scale });
  const p = g.attributes.position;
  const v = new V3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const ridge = 1 - Math.abs(fbm(v.x * 2.2, v.y * 2.2, v.z * 2.2, seed + 7, 3));
    let n = 1 + (smooth ? 0.015 : 0.07) * fbm(v.x * 7, v.y * 7, v.z * 7, seed + 3, 4) - (smooth ? 0 : 0.09 * ridge * ridge);
    if (strata) n += strata * Math.sin(v.y * 11 / Math.max(0.4, r) + fbm(v.x, v.y, v.z, seed, 2) * 2);
    if (grooves) n -= grooves * Math.pow(Math.abs(Math.sin(Math.atan2(v.z, v.x) * 9 + fbm(v.x * 2, v.y, v.z * 2, seed, 2))), 6) * Math.max(0, v.y / r);
    v.x *= n;
    v.z *= n;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  // flatten the underside so it sits on the ground
  g.computeBoundingBox();
  const minY = g.boundingBox.min.y;
  const cut = minY + (g.boundingBox.max.y - minY) * 0.18;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < cut) p.setY(i, cut - (cut - p.getY(i)) * 0.15);
  g.computeBoundingBox();
  g.translate(0, -g.boundingBox.min.y - 0.01, 0);
  g.computeVertexNormals();
  return g;
}

function rockColors(g, base, seed, { moss = 0, speckle = false, bands = null, pores = false, lichen = false } = {}) {
  const c0 = new THREE.Color(base);
  const mossC = new THREE.Color('#3d5a22');
  const bandC = bands?.map((b) => new THREE.Color(b));
  return paintVertices(g, (v, n) => {
    const k = 0.62 + 0.45 * fbm(v.x * 4, v.y * 4, v.z * 4, seed, 4) + 0.12 * Math.max(0, n.y);
    let c = bandC ? bandC[Math.floor((Math.sin(v.y * 9 + fbm(v.x, v.y, v.z, seed, 2)) * 0.5 + 0.5) * bandC.length) % bandC.length].clone().multiplyScalar(k * 1.1) : c0.clone().multiplyScalar(k);
    if (speckle) {
      const s = fbm(v.x * 60, v.y * 60, v.z * 60, seed + 2, 1);
      if (s > 0.35) c = new THREE.Color('#1e1c1c');
      else if (s < -0.4) c = new THREE.Color('#e8dcd4');
      else if (s < -0.25) c = new THREE.Color('#c8a8a0');
    }
    if (pores && fbm(v.x * 30, v.y * 30, v.z * 30, seed + 5, 2) > 0.3) c.multiplyScalar(0.35);
    c.offsetHSL(0.02 * fbm(v.x * 2, v.y * 2, v.z * 2, seed + 9, 2), 0, 0);
    if (moss && n.y > 0.2) {
      const m = THREE.MathUtils.smoothstep(n.y + 0.35 * fbm(v.x * 5, v.y * 5, v.z * 5, seed + 4, 3), 0.35, 0.75) * moss;
      c.lerp(mossC.clone().multiplyScalar(0.8 + 0.4 * fbm(v.x * 12, v.y * 12, v.z * 12, seed, 2)), m);
    }
    if (lichen) {
      const l = fbm(v.x * 5, v.y * 5, v.z * 5, seed + 13, 4);
      const k2 = THREE.MathUtils.smoothstep(l, 0.08, 0.22);
      if (k2 > 0) c.lerp(new THREE.Color(fbm(v.x * 2, v.y * 2, v.z * 2, seed + 3, 2) > 0 ? '#d8a030' : '#c8cc8a'), 0.85 * k2);
    }
    return c;
  });
}

/** Base pieces of a rock variant: [geometry] with world placement, before trims. */
function rockPieces(variant, v, s, seed, rand) {
  const out = [];
  const R = (r, opts) => rockGeometry(r, { seed: seed + out.length * 7, ...opts });
  switch (variant) {
    case 'cliff': out.push(R(1 * s, { scale: [1.5, 2.2, 1.1], strata: 0.06, amount: 0.38 })); break;
    case 'flat': out.push(R(0.4 * s, { scale: [1.3, 0.22, 1.0], amount: 0.18 })); break;
    case 'granite': out.push(R(0.7 * s, { scale: [1.2, 0.9, 1.05], amount: 0.2, smooth: true })); break;
    case 'sandstone': out.push(R(0.8 * s, { scale: [1.4, 1.0, 1.0], strata: 0.07, amount: 0.25 })); break;
    case 'limestone': out.push(R(0.8 * s, { scale: [1.1, 1.2, 1.0], grooves: 0.12, amount: 0.22 })); break;
    case 'volcanic': out.push(R(0.6 * s, { scale: [1.3, 0.8, 1.1], amount: 0.42 })); break;
    case 'standing-stone': out.push(R(0.5 * s, { scale: [0.6, 3.2, 0.32], amount: 0.18 })); break;
    case 'outcrop': {
      out.push(R(1.2 * s, { scale: [1.8, 0.9, 1.3], strata: 0.05, amount: 0.3 }));
      const g = R(0.7 * s, { scale: [1.2, 0.8, 1.0], strata: 0.05, amount: 0.3 });
      g.translate(1.1 * s, 0, 0.5 * s);
      out.push(g);
      break;
    }
    case 'basalt': {
      // hexagonal columns (columnar jointing) on a hex grid, tops at varied heights
      const cols = [];
      const rr = 0.18 * s;
      for (let q = -2; q <= 2; q++) for (let r2 = -2; r2 <= 2; r2++) {
        if (Math.abs(q + r2) > 2) continue;
        const x = rr * 1.73 * (q + r2 / 2);
        const z = rr * 1.5 * r2;
        const h = (0.5 + rand() * 1.4) * s * (1 - Math.hypot(x, z) / (rr * 6));
        const g = new THREE.CylinderGeometry(rr * 0.98, rr, Math.max(0.15, h), 6, 2);
        g.translate(x, Math.max(0.15, h) / 2, z);
        const tp = g.attributes.position;
        for (let i = 0; i < tp.count; i++) if (tp.getY(i) > Math.max(0.15, h) - 0.01) tp.setY(i, tp.getY(i) + (tp.getX(i) - x) * 0.25 * (rand() - 0.5));
        g.computeVertexNormals();
        cols.push(g);
      }
      out.push(merge(cols));
      break;
    }
    case 'slate': {
      let y = 0;
      for (let i = 0; i < 6; i++) {
        const g = R((0.5 - i * 0.04) * s, { scale: [1.4, 0.08, 1.0], amount: 0.2, detail: 3 });
        g.rotateY(rand() * 0.6);
        g.translate((rand() - 0.5) * 0.1 * s, y, (rand() - 0.5) * 0.1 * s);
        g.computeBoundingBox();
        y = g.boundingBox.max.y - 0.012;
        out.push(g);
      }
      break;
    }
    case 'cairn': {
      let y = 0;
      for (let i = 0; i < 6; i++) {
        const g = R((0.28 - i * 0.035) * s, { scale: [1.3, 0.55, 1.1], amount: 0.12, smooth: true, detail: 3 });
        g.rotateY(rand() * 6.28);
        g.translate((rand() - 0.5) * 0.03, y, (rand() - 0.5) * 0.03);
        g.computeBoundingBox();
        y = g.boundingBox.max.y - 0.025 * s;
        out.push(g);
      }
      break;
    }
    case 'arch': {
      // natural sandstone arch: two weathered legs joined by a curved span
      const W = 2.2 * s;
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI - (i / 16) * Math.PI;
        pts.push(new V3(Math.cos(a) * W / 2, Math.min(1, Math.sin(a) * 1.25) * W * 0.62 - 0.15 * s, 0));
      }
      const g = sweep(pts, (t, a) => (0.3 + 0.42 * Math.pow(Math.abs(t * 2 - 1), 3)) * s * (1 + 0.15 * fbm(Math.cos(a) * 2, t * 10, Math.sin(a) * 2, seed, 3) + 0.05 * Math.sin(t * 60)), { radial: 16, segments: 60, closeEnd: false });
      const gp = g.attributes.position;
      for (let i = 0; i < gp.count; i++) if (gp.getY(i) < 0) gp.setY(i, 0);
      g.computeVertexNormals();
      out.push(g);
      for (const sx of [-1, 1]) {
        const foot = R(0.45 * s, { scale: [1.2, 0.7, 1.1], strata: 0.05, amount: 0.25 });
        foot.translate(sx * W / 2, 0, 0);
        out.push(foot);
      }
      break;
    }
    case 'scree': {
      for (let i = 0; i < 22; i++) {
        const r = (0.07 + rand() * 0.15) * s;
        const g = R(r, { scale: [1.2, 0.8, 1], amount: 0.35, detail: 3 });
        const a = rand() * 6.28;
        const d = Math.sqrt(rand()) * 0.9 * s;
        const y = Math.max(0, (0.9 * s - d) * 0.5 - r * 0.5);
        g.rotateY(rand() * 6.28);
        g.translate(Math.cos(a) * d, y, Math.sin(a) * d);
        out.push(g);
      }
      // earthy core so the pile is solid
      const core = blob(0.75 * s, { detail: 3, seed, amount: 0.2, scale: [1.2, 0.5, 1.2] });
      const cp = core.attributes.position;
      for (let i = 0; i < cp.count; i++) if (cp.getY(i) < 0) cp.setY(i, 0);
      core.computeVertexNormals();
      out.push(core);
      break;
    }
    case 'pebbles':
    case 'river-stones': {
      const n = variant === 'pebbles' ? 14 : 9;
      for (let i = 0; i < n; i++) {
        const r = (variant === 'pebbles' ? 0.04 + rand() * 0.09 : 0.1 + rand() * 0.12) * s;
        const g = R(r, { scale: [1.25, 0.6, 1], amount: variant === 'pebbles' ? 0.15 : 0.08, detail: 3, smooth: variant === 'river-stones' });
        const a = rand() * 6.28;
        const rr = Math.sqrt(rand()) * (variant === 'pebbles' ? 0.45 : 0.5) * s;
        g.rotateY(rand() * 6.28);
        g.translate(Math.cos(a) * rr, 0, Math.sin(a) * rr);
        g.userData.tint = (rand() - 0.5) * 0.3;
        out.push(g);
      }
      break;
    }
    default:
      out.push(R(0.6 * s, { scale: [1.3 + rand() * 0.3, 0.85, 1 + rand() * 0.2] }));
  }
  return out;
}

export function createRock(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('rock', ROCK_VARIANTS, ROCK_TRIMS, o.variant, o.trim);
  const v = ROCK_VARIANTS[variant];
  const trim = o.trim ?? null;
  const color = o.color ?? v.color;
  const seed = seedOf(o, 17 + variant.length);
  const rand = rng(seed * 53 + 9);
  const s = (o.size ?? 1) * (trim === 'small' ? 0.4 : trim === 'large' ? 2.2 : 1);
  const root = group(`rock-${variant}${trim ? `-${trim}` : ''}`);
  let pieces = rockPieces(variant, v, s, seed, rand);
  if (trim === 'cluster') {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rand();
      const g = rockGeometry((0.15 + rand() * 0.2) * s, { seed: seed + 100 + i, scale: [1.2, 0.7, 1], amount: 0.3, detail: 3 });
      const box = new THREE.Box3();
      for (const p of pieces) { p.computeBoundingBox(); box.union(p.boundingBox); }
      const d = Math.max(box.max.x, box.max.z) + 0.1 * s;
      g.translate(Math.cos(a) * d, 0, Math.sin(a) * d);
      pieces.push(g);
    }
  }
  if (trim === 'cracked') {
    // split along a vertical plane: the far half shifts away, opening a dark crack
    const box = new THREE.Box3();
    for (const p of pieces) { p.computeBoundingBox(); box.union(p.boundingBox); }
    const wdt = box.max.x - box.min.x;
    const gap = Math.max(0.05, wdt * 0.1);
    const cx = (box.min.x + box.max.x) / 2;
    pieces = pieces.map((g) => {
      const p = g.attributes.position;
      const dark = new Uint8Array(p.count);
      for (let i = 0; i < p.count; i++) {
        // diagonal split plane (faces the usual 3/4 camera)
        const x = (p.getX(i) - p.getZ(i)) * 0.7071;
        const along = (p.getX(i) + p.getZ(i)) * 0.7071;
        const zigzag = cx + Math.sin(along * 9 + p.getY(i) * 5) * wdt * 0.04;
        if (Math.abs(x - zigzag) < wdt * 0.06) dark[i] = 1;
        if (x > zigzag) { p.setX(i, p.getX(i) + gap * 0.7071); p.setZ(i, p.getZ(i) - gap * 0.7071); p.setY(i, p.getY(i) * 0.96); }
      }
      g.computeVertexNormals();
      g.userData.crack = dark;
      return g;
    });
  }
  let geo = merge(pieces.map((g, i) => {
    const c = g.userData.tint ? new THREE.Color(color).offsetHSL(0, 0, g.userData.tint * 0.4) : color;
    const out = rockColors(g, c, seed + i, { moss: trim === 'mossy' ? 1.2 : v.moss ?? 0, speckle: v.speckle, bands: v.bands, pores: v.pores, lichen: trim === 'lichen' });
    if (g.userData.crack) {
      const dark = g.userData.crack;
      const col = out.attributes.color;
      for (let k = 0; k < col.count; k++) if (dark[k]) col.setXYZ(k, 0.06, 0.05, 0.045);
    }
    return out;
  }));
  if (trim === 'buried') {
    // sunk 40% into the ground with a soil collar
    geo.computeBoundingBox();
    const h = geo.boundingBox.max.y;
    geo.translate(0, -h * 0.4, 0);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) < -0.02) p.setY(i, -0.02);
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    const r = Math.max(geo.boundingBox.max.x, geo.boundingBox.max.z) * 1.35;
    const soil = blob(r, { detail: 3, seed, amount: 0.2, freq: 2, scale: [1, 0.08, 1] });
    const sp = soil.attributes.position;
    for (let i = 0; i < sp.count; i++) if (sp.getY(i) < 0) sp.setY(i, 0);
    soil.computeVertexNormals();
    mesh(paintVertices(soil, (vv) => new THREE.Color('#5a4630').multiplyScalar(0.75 + 0.3 * fbm(vv.x * 8, 0, vv.z * 8, seed, 2))), vcMat(0.98), { parent: root, name: 'soil' });
  }
  if (trim === 'snow') snowify(geo, 1, { seed, threshold: 0.3 });
  mesh(geo, vcMat(0.92, THREE.FrontSide, { name: 'rock' }), { parent: root, name: 'rock' });
  if (trim === 'mossy') {
    // moss cushions sitting on the tops
    geo.computeBoundingBox();
    const items = [];
    const p = geo.attributes.position;
    const n = geo.attributes.normal;
    for (let i = 0; i < p.count; i += 7) {
      if (n.getY(i) > 0.75 && rand() < 0.08) items.push({ p: new V3(p.getX(i), p.getY(i) - 0.005, p.getZ(i)), s: new V3(1, 0.35, 1).multiplyScalar(0.5 + rand() * 0.8), c: rand() < 0.5 ? '#4a6a24' : '#5a7a2a' });
    }
    root.add(instanced(new THREE.IcosahedronGeometry(0.05 * Math.max(0.6, s), 1), new THREE.MeshStandardMaterial({ roughness: 1, color: '#ffffff' }), items.slice(0, 300), 'moss'));
  }
  if (trim === 'snow') {
    geo.computeBoundingBox();
    mesh(snowMound(Math.max(geo.boundingBox.max.x, geo.boundingBox.max.z) * 1.2 + 0.1, seed), vcMat(0.85), { parent: root, name: 'snow' });
  }
  return finalize(root, { type: 'rock', variant, options: o, animations: [] });
}

/* ================================ Mushrooms ================================ */

export const MUSHROOM_VARIANTS = {
  'fly-agaric': { cap: '#c62828', stem: '#f3eee2', shape: 'convex', spots: true, h: 0.14, r: 0.07, n: 3 },
  porcini: { cap: '#7a4b2a', stem: '#e6d8bd', shape: 'bun', h: 0.1, r: 0.08, n: 2, fatStem: true },
  cluster: { cap: '#a8865c', stem: '#efe6d3', shape: 'convex', h: 0.07, r: 0.035, n: 7 },
  chanterelle: { cap: '#e8a52a', stem: '#e8a52a', shape: 'funnel', h: 0.06, r: 0.035, n: 6 },
  morel: { cap: '#8a6a44', stem: '#efe6d3', shape: 'morel', h: 0.06, r: 0.025, n: 3 },
  inkcap: { cap: '#f2efe6', stem: '#f6f2ea', shape: 'shaggy', h: 0.12, r: 0.025, n: 4 },
  puffball: { cap: '#f2eee4', stem: '#f2eee4', shape: 'puff', h: 0.0, r: 0.06, n: 3 },
  parasol: { cap: '#c8b496', stem: '#d8ccb4', shape: 'parasol', h: 0.26, r: 0.12, n: 2, ring: true },
  oyster: { cap: '#b8b0a4', stem: '#e8e2d8', shape: 'shelf', h: 0.0, r: 0.07, n: 7, substrate: true },
  button: { cap: '#f4f0e8', stem: '#f4f0e8', shape: 'convex', h: 0.05, r: 0.03, n: 6 },
};
export const MUSHROOM_TRIMS = Object.fromEntries(Object.keys(MUSHROOM_VARIANTS).map((k) => [k, ['young', 'old', 'single', 'ring', 'on-log']]));

function capProfile(shape, h, R, age) {
  // age: 0 = young (closed egg), 1 = mature, 2 = old (flattened / upturned)
  const lift = age === 0 ? 0.9 : age === 2 ? 0.15 : 0.55;
  const spread = age === 0 ? 0.7 : 1;
  const r = R * spread;
  switch (shape) {
    case 'bun': return [[0.001, h + r * lift * 0.9], [r * 0.6, h + r * lift * 0.8], [r * 0.95, h + r * lift * 0.4], [r, h + r * 0.05], [r * 0.85, h - r * 0.08], [r * 0.3, h - 0.004]];
    case 'funnel': return [[0.001, h - r * 0.25], [r * 0.4, h - r * 0.15], [r * 0.9, h + r * 0.15], [r * 1.05, h + r * (age === 2 ? 0.45 : 0.25)], [r, h + r * 0.1], [r * 0.4, h - r * 0.35], [r * 0.15, h - r * 0.7]];
    case 'parasol': return [[0.001, h + r * 0.25 * (age === 0 ? 3 : 1)], [r * 0.15, h + r * 0.24], [r * 0.6, h + r * 0.12 * (age === 0 ? 4 : 1)], [r, h - r * 0.02 * (age === 0 ? -8 : 1)], [r * 0.92, h - r * 0.06], [r * 0.2, h - 0.006]];
    case 'shaggy': return [[0.001, h + r * 3.2], [r * 0.7, h + r * 2.8], [r, h + r * 1.6], [r * (age === 2 ? 1.4 : 1.05), h + (age === 2 ? r * 0.2 : 0)], [r * 0.6, h + r * 0.2]];
    default: return [[0.001, h + r * lift], [r * 0.5, h + r * lift * 0.9], [r * 0.85, h + r * lift * 0.55], [r, h + r * 0.05 + (age === 2 ? r * 0.12 : 0)], [r * 0.96, h - r * 0.04], [r * 0.7, h - 0.005], [r * 0.25, h - 0.01]];
  }
}

function mushroomGeo(v, h, R, age, rand, seed) {
  const parts = [];
  const capCol = new THREE.Color(v.cap).lerp(new THREE.Color('#6a4a2a'), age === 2 ? 0.35 : 0);
  if (v.shape === 'puff') {
    const g = new THREE.SphereGeometry(R * (age === 0 ? 0.6 : 1), 18, 12);
    g.scale(1, 0.85, 1);
    g.translate(0, R * 0.8 * (age === 0 ? 0.6 : 1), 0);
    parts.push(paintVertices(g, (p) => (age === 2 ? new THREE.Color('#a08a62') : capCol.clone()).multiplyScalar(0.9 + 0.1 * fbm(p.x * 60, p.y * 60, p.z * 60, seed, 2))));
    if (age === 2) { const hole = new THREE.CircleGeometry(R * 0.2, 10); hole.rotateX(-Math.PI / 2); hole.translate(0, R * 1.62, 0); parts.push(paintVertices(hole, () => new THREE.Color('#3a2a1a'))); }
    return merge(parts);
  }
  if (v.shape === 'morel') {
    const stem = lathe([[0.001, 0], [R * 0.6, 0], [R * 0.7, h * 0.5], [R * 0.6, h], [0.001, h]], 14);
    parts.push(paintVertices(stem, () => new THREE.Color(v.stem)));
    const cap = new THREE.SphereGeometry(R, 20, 16);
    cap.scale(1, 1.9, 1);
    const p = cap.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const pit = Math.abs(Math.sin(Math.atan2(z, x) * 6 + y * 50) * Math.sin(y * 70));
      const k = 1 + 0.18 * pit;
      p.setXYZ(i, x * k, y, z * k);
    }
    cap.computeVertexNormals();
    cap.translate(0, h + R * 1.6, 0);
    parts.push(paintVertices(cap, (q) => capCol.clone().multiplyScalar(0.55 + 0.6 * Math.abs(Math.sin(Math.atan2(q.z, q.x) * 6 + q.y * 50)))));
    return merge(parts);
  }
  const fat = v.fatStem ? 1.6 : 1;
  const stem = lathe([[0.001, 0], [R * 0.32 * fat, 0], [R * 0.38 * fat, h * 0.15], [R * 0.28 * fat, h * 0.6], [R * 0.22 * fat, h * 0.95], [0.001, h]], 18);
  parts.push(paintVertices(stem, (p) => new THREE.Color(v.stem).multiplyScalar(0.85 + 0.15 * (p.y / Math.max(0.01, h)))));
  if (v.ring && age !== 0) {
    const ring = new THREE.TorusGeometry(R * 0.28, R * 0.06, 6, 16);
    ring.rotateX(Math.PI / 2);
    ring.translate(0, h * 0.7, 0);
    parts.push(paintVertices(ring, () => new THREE.Color(v.stem)));
  }
  const cap = lathe(capProfile(v.shape, h, R, age), 32);
  if (v.shape === 'funnel') {
    const p = cap.attributes.position;
    for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, p.getY(i) + Math.sin(a * 5) * R * 0.08 * Math.hypot(p.getX(i), p.getZ(i)) / R); }
    cap.computeVertexNormals();
  }
  parts.push(paintVertices(cap, (p, n) => {
    const under = p.y < h + R * 0.07 && Math.hypot(p.x, p.z) < R * 0.97;
    if (under && v.shape !== 'shaggy') return new THREE.Color(v.shape === 'funnel' ? v.cap : '#e9dcc2').multiplyScalar(0.85);
    let c = capCol.clone().multiplyScalar(0.8 + 0.3 * Math.max(0, n.y) + 0.08 * fbm(p.x * 30, p.y * 30, p.z * 30, seed, 2));
    if (v.shape === 'shaggy' && fbm(p.x * 80, p.y * 80, p.z * 80, seed, 1) > 0.2) c = new THREE.Color('#a8988a');
    if (v.shape === 'shaggy' && age === 2 && p.y < h + R * 0.6) c = new THREE.Color('#1a1816');
    if (v.shape === 'parasol' && fbm(p.x * 50, p.y * 50, p.z * 50, seed, 1) > 0.25) c = new THREE.Color('#7a5a3a');
    return c;
  }));
  if (v.spots && age !== 2) {
    for (let i = 0; i < 14; i++) {
      const a = rand() * 6.28;
      const t = 0.15 + rand() * 0.65;
      const sp = new THREE.SphereGeometry(R * 0.08 * (0.6 + rand() * 0.6), 8, 5);
      sp.scale(1, 0.35, 1);
      const lift = age === 0 ? 0.9 : 0.55;
      sp.translate(Math.cos(a) * R * Math.sin(t * Math.PI * 0.55) * (age === 0 ? 0.7 : 1), h + R * lift * Math.cos(t * Math.PI * 0.55), Math.sin(a) * R * Math.sin(t * Math.PI * 0.55) * (age === 0 ? 0.7 : 1));
      parts.push(paintVertices(sp, () => new THREE.Color('#fbf8f0')));
    }
  }
  return merge(parts);
}

/** Shelf / bracket fungus fan, attached at its back edge (x = 0) to a vertical surface. */
function shelfGeo(R, color, age) {
  const g = new THREE.SphereGeometry(R, 16, 8, -Math.PI / 2, Math.PI, 0, Math.PI / 2);
  g.scale(1, 0.32 * (age === 0 ? 1.5 : 1), 1);
  g.rotateY(Math.PI / 2);
  const c0 = new THREE.Color(color);
  return paintVertices(g, (p, n) => (n.y < -0.1 ? new THREE.Color('#e8e2d8') : c0.clone().multiplyScalar(0.8 + 0.2 * Math.sin(Math.hypot(p.x, p.z) * 120))));
}

function smallLog(seed, len = 0.9, r = 0.13, bark = '#5d4a3a') {
  const pts = [];
  for (let i = 0; i <= 4; i++) pts.push(new V3((i / 4 - 0.5) * len, r, Math.sin(i + seed) * 0.015));
  const side = sweep(pts, (t, a) => r * (1 + 0.05 * fbm(Math.cos(a) * 2, t * 6, Math.sin(a) * 2, seed, 3)), { radial: 16, segments: 12 });
  barkColor(side, bark, { seed });
  const mossC = new THREE.Color('#4c6a2a');
  const col = side.attributes.color;
  const n = side.attributes.normal;
  for (let i = 0; i < col.count; i++) if (n.getY(i) > 0.5) { const c = new THREE.Color().fromBufferAttribute(col, i).lerp(mossC, 0.6); col.setXYZ(i, c.r, c.g, c.b); }
  return side;
}

export function createMushroom(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('mushroom', MUSHROOM_VARIANTS, MUSHROOM_TRIMS, o.variant, o.trim);
  const v = { ...MUSHROOM_VARIANTS[variant], cap: o.color ?? MUSHROOM_VARIANTS[variant].cap };
  const trim = o.trim ?? null;
  const seed = seedOf(o, 3 + variant.length);
  const rand = rng(seed * 11 + 7);
  const root = group(`mushroom-${variant}${trim ? `-${trim}` : ''}`);
  const age = trim === 'young' ? 0 : trim === 'old' ? 2 : 1;
  const geos = [];
  const onLog = trim === 'on-log' || v.substrate;
  let logLen = 0.9;
  let logR = 0.13;
  if (onLog) {
    if (v.substrate && trim !== 'on-log') { logLen = 0.5; logR = 0.18; }
    geos.push(smallLog(seed, logLen, logR));
  }
  const n = trim === 'single' ? 1 : trim === 'ring' ? 16 : v.n;
  for (let i = 0; i < n; i++) {
    const scale = i === 0 ? 1 : 0.5 + rand() * 0.5;
    const h = v.h * scale;
    const R = v.r * scale;
    if (v.shape === 'shelf') {
      // fans stacked up the side of the log/stump
      const a = (rand() - 0.5) * 1.6;
      const y = logR + Math.sin(a) * logR * 0.6;
      const g = shelfGeo(R, v.cap, age);
      g.rotateY(Math.PI / 2 + a * 0.3);
      g.translate((rand() - 0.5) * logLen * 0.7, y + (rand() - 0.5) * 0.04, Math.cos(a) * logR * 0.95);
      geos.push(g);
      continue;
    }
    const g = mushroomGeo(v, h, R, age, rand, seed + i);
    if (trim === 'ring') {
      const a = (i / n) * Math.PI * 2;
      g.rotateZ((rand() - 0.5) * 0.15);
      g.translate(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55);
    } else if (onLog) {
      // growing up out of the top of the log
      const x = (i / Math.max(1, n - 1) - 0.5) * logLen * 0.7 + (rand() - 0.5) * 0.05;
      g.rotateZ((rand() - 0.5) * 0.3);
      g.translate(x, logR * 2 - 0.012, (rand() - 0.5) * logR * 0.6);
    } else {
      const a = rand() * 6.28;
      const rr = i === 0 ? 0 : 0.04 + rand() * (variant === 'cluster' ? 0.07 : 0.1);
      g.rotateZ(age === 2 ? (rand() - 0.5) * 0.6 : (rand() - 0.5) * 0.25);
      g.translate(Math.cos(a) * rr, 0, Math.sin(a) * rr);
    }
    geos.push(g);
  }
  if (trim === 'ring') {
    // the fairy ring: a band of darker, lusher grass where the mycelium feeds
    const ringG = new THREE.RingGeometry(0.45, 0.68, 40, 1);
    ringG.rotateX(-Math.PI / 2);
    ringG.translate(0, 0.004, 0);
    geos.push(paintVertices(ringG, (p) => new THREE.Color('#3a6a24').multiplyScalar(0.8 + 0.3 * fbm(p.x * 10, 0, p.z * 10, seed, 2))));
  }
  mesh(merge(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), { parent: root, name: 'mushrooms' });
  return finalize(root, { type: 'mushroom', variant, options: o, animations: [] });
}

/* ================================ Logs & stumps ================================ */

export const LOG_VARIANTS = {
  stump: { bark: '#7a6450' },
  log: { bark: '#7d6650' },
  'log-pile': { bark: '#7d6650' },
  branch: { bark: '#7a6a58' },
  firewood: { bark: '#866c56' },
  'hollow-log': { bark: '#76604a' },
  'root-wad': { bark: '#7a6450' },
  driftwood: { bark: '#b8b0a2' },
};
export const LOG_TRIMS = Object.fromEntries(Object.keys(LOG_VARIANTS).map((k) => [k, ['mossy', 'snow', 'rotten', 'fresh', 'burnt', 'fungi', 'birch']]));

function ringCap(r, seed, wood = '#c8a273', { hollow = 0 } = {}) {
  // enough concentric vertex rings to paint growth rings (a plain circle only has centre + rim vertices)
  const g = new THREE.RingGeometry(hollow ? r * hollow : r * 0.004, r, 48, 22);
  // the log's bark texture must not streak across the cut face: sample one flat spot of it
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5, 0.5);
  const c0 = new THREE.Color(wood);
  const dark = new THREE.Color(wood).multiplyScalar(0.65);
  paintVertices(g, (v) => {
    const d = Math.hypot(v.x, v.y) / r;
    const ring = 0.5 + 0.5 * Math.sin(d * 55 + fbm(v.x * 6, v.y * 6, 0, seed, 2) * 3);
    return d > 0.93 ? new THREE.Color('#4a3828') : c0.clone().lerp(dark, ring * 0.45);
  });
  return g;
}

function logGeo(len, r, seed, bark, { hollow = 0, wood, birch, twist = 0 } = {}) {
  const pts = [];
  for (let i = 0; i <= 6; i++) pts.push(new V3((i / 6 - 0.5) * len, Math.sin(i * 0.9 + seed) * twist, Math.sin(i + seed) * 0.02 + Math.cos(i * 1.3) * twist));
  const side = sweep(pts, (t, a) => r * (1 + 0.04 * fbm(Math.cos(a) * 2, t * 6, Math.sin(a) * 2, seed, 3)), { radial: 18, segments: 18, closeEnd: false, uvScale: Math.max(1, Math.round(len / (Math.PI * 2 * r))) /* whole repeats: no seam band */ });
  barkColor(side, bark, { seed, birch, style: twist ? 'fibrous' : 'furrowed' });
  const parts = [side];
  const caps = [[pts.at(-1), Math.PI / 2], [pts[0], -Math.PI / 2]];
  for (const [p, ry] of caps) {
    const c = ringCap(r * 1.0, seed, wood, { hollow });
    c.rotateY(ry);
    c.translate(p.x, p.y, p.z);
    parts.push(c);
    // the same cap with reversed winding, so the cut end is solid from either side (never a see-through shell)
    const back = c.clone();
    if (back.index) { const ix = back.index.array; for (let k = 0; k < ix.length; k += 3) { const t = ix[k]; ix[k] = ix[k + 2]; ix[k + 2] = t; } }
    else { const pa = back.attributes.position.array; for (let k = 0; k < pa.length; k += 9) for (let q = 0; q < 3; q++) { const t = pa[k + q]; pa[k + q] = pa[k + 6 + q]; pa[k + 6 + q] = t; } }
    back.computeVertexNormals();
    parts.push(back);
  }
  if (hollow) {
    const inner = sweep(pts, () => r * hollow * 1.02, { radial: 14, segments: 6, closeEnd: false });
    inner.index.array.reverse?.();
    paintVertices(inner, () => new THREE.Color('#2a1e14'));
    parts.push(inner);
  }
  return merge(parts);
}

export function createLog(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('log', LOG_VARIANTS, LOG_TRIMS, o.variant, o.trim);
  const trim = o.trim ?? null;
  let bark = o.color ?? LOG_VARIANTS[variant].bark;
  let wood = '#c8a273';
  const birch = trim === 'birch';
  if (trim === 'burnt') { bark = '#1e1a18'; wood = '#2a2220'; }
  if (trim === 'fresh') wood = '#e8c890';
  if (trim === 'rotten') { bark = '#3e3226'; wood = '#7a6248'; }
  const seed = seedOf(o, 8 + variant.length);
  const rand = rng(seed * 5 + 3);
  const root = group(`log-${variant}${trim ? `-${trim}` : ''}`);
  const parts = [];
  let topY = 0.4;
  if (variant === 'stump') {
    const R = 0.32;
    const H = trim === 'rotten' ? 0.32 : 0.45;
    const side = sweep([new V3(0, -0.02, 0), new V3(0, H * 0.5, 0), new V3(0, H, 0)], (t, a) => R * (1 + 0.55 * Math.pow(Math.max(0, 1 - t * 2.6), 2) * (1 + 0.5 * Math.cos(a * 5 + seed))) * (1 + 0.04 * fbm(Math.cos(a) * 3, t * 4, Math.sin(a) * 3, seed, 3)), { radial: 28, segments: 16, closeEnd: false });
    barkColor(side, bark, { seed, birch });
    const top = trim === 'rotten' ? ringCap(R * 0.99, seed, wood, { hollow: 0.6 }) : ringCap(R * 0.99, seed, wood);
    top.rotateX(-Math.PI / 2);
    top.translate(0, H, 0);
    parts.push(side, top);
    if (trim === 'rotten') { const pit = new THREE.CircleGeometry(R * 0.6, 24); pit.rotateX(-Math.PI / 2); pit.translate(0, H * 0.6, 0); parts.push(paintVertices(pit, () => new THREE.Color('#2a1e14'))); }
    if (trim === 'fresh') {
      // fresh chainsaw cut: pale face + a few chips on the ground
      for (let i = 0; i < 18; i++) { const ch = new THREE.BoxGeometry(0.03, 0.006, 0.02); ch.rotateY(rand() * 6.28); const a = rand() * 6.28; const d = R * 1.6 + rand() * 0.4; ch.translate(Math.cos(a) * d, 0.003, Math.sin(a) * d); parts.push(paintVertices(ch, () => new THREE.Color('#e8c890'))); }
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 6.28 + rand();
      const d = new V3(Math.cos(a), 0, Math.sin(a));
      parts.push(barkColor(sweep([d.clone().multiplyScalar(R * 0.7).setY(0.14), d.clone().multiplyScalar(R * 1.4).setY(0.05), d.clone().multiplyScalar(R * 2.0).setY(0.02)], (t) => 0.09 * (1 - t * 0.55), { radial: 8, segments: 8 }), bark, { seed: seed + i, birch }));
    }
    topY = H;
  } else if (variant === 'log' || variant === 'hollow-log') {
    const r = variant === 'hollow-log' ? 0.26 : 0.2;
    const g = logGeo(1.8, r, seed, bark, { hollow: variant === 'hollow-log' ? 0.7 : 0, wood, birch });
    g.translate(0, r, 0);
    g.rotateY(rand() * 0.4);
    parts.push(g);
    topY = r * 2;
  } else if (variant === 'log-pile' || variant === 'firewood') {
    const rows = variant === 'firewood' ? [6, 5, 4, 3] : [4, 3, 2];
    let y = variant === 'firewood' ? 0.07 : 0.14;
    rows.forEach((n, row) => {
      for (let i = 0; i < n; i++) {
        let g;
        if (variant === 'firewood') {
          // split quarters: wedge-shaped billets showing heartwood on the split faces
          const r = 0.1;
          const shape = new THREE.Shape();
          shape.moveTo(0, 0);
          shape.absarc(0, 0, r, 0, Math.PI / 2 + (rand() - 0.5) * 0.3, false);
          shape.lineTo(0, 0);
          g = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false, curveSegments: 6 });
          g.translate(0, 0, -0.25);
          g.rotateZ(rand() * 6.28);
          paintVertices(g, (p, nn) => (Math.abs(nn.z) > 0.9 ? new THREE.Color(wood).multiplyScalar(0.9) : Math.hypot(p.x, p.y) > r * 0.92 ? new THREE.Color(bark) : new THREE.Color(wood).multiplyScalar(0.8)));
          g.translate((i - (n - 1) / 2) * 0.17 + (row % 2) * 0.085, y, 0);
        } else {
          g = logGeo(1.4 + (rand() - 0.5) * 0.2, 0.13 + rand() * 0.02, seed + row * 10 + i, bark, { wood, birch });
          g.rotateY(Math.PI / 2);
          g.translate((rand() - 0.5) * 0.05, y, (i - (n - 1) / 2) * 0.27);
        }
        parts.push(g);
      }
      y += variant === 'firewood' ? 0.15 : 0.235;
    });
    if (variant === 'firewood') {
      // chopping block beside the stack
      const blk = logGeo(0.4, 0.2, seed + 99, bark, { wood });
      blk.rotateZ(Math.PI / 2);
      blk.translate(0.75, 0.2, 0.35);
      parts.push(blk);
    }
    topY = y;
  } else if (variant === 'branch') {
    const main = [new V3(-1.0, 0.07, 0), new V3(-0.3, 0.08, 0.05), new V3(0.4, 0.06, -0.05), new V3(1.0, 0.04, 0.08)];
    parts.push(barkColor(sweep(main, (t) => 0.07 * (1 - t * 0.6), { radial: 9, segments: 16 }), bark, { seed, birch }));
    const curve = new THREE.CatmullRomCurve3(main);
    for (let i = 0; i < 6; i++) {
      const t = 0.2 + i * 0.13;
      const at = curve.getPointAt(t);
      const a = (i % 2 ? 1 : -1) * (0.6 + rand() * 0.5);
      const d = new V3(Math.cos(a) * 0.6, 0.2 + rand() * 0.5, Math.sin(a));
      const e = at.clone().addScaledVector(d.normalize(), 0.3 + rand() * 0.3);
      parts.push(barkColor(sweep([at, at.clone().lerp(e, 0.5).add(new V3(0, 0.02, 0)), e], (tt) => 0.025 * (1 - tt * 0.7), { radial: 5, segments: 6 }), bark, { seed: seed + i }));
    }
    topY = 0.3;
  } else if (variant === 'root-wad') {
    // a toppled tree: trunk lying down, the root plate standing up with soil clinging
    const trunk = logGeo(1.6, 0.22, seed, bark, { wood, birch });
    trunk.translate(0.8, 0.22, 0);
    parts.push(trunk);
    const plate = blob(0.75, { detail: 3, seed, amount: 0.25, scale: [0.25, 1, 1] });
    plate.translate(-0.02, 0.6, 0);
    parts.push(paintVertices(plate, (p) => new THREE.Color('#5a4630').multiplyScalar(0.7 + 0.35 * fbm(p.x * 8, p.y * 8, p.z * 8, seed, 2))));
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const st = new V3(-0.1, 0.6 + Math.sin(a) * 0.55, Math.cos(a) * 0.55);
      const en = st.clone().add(new V3(-0.25 - rand() * 0.3, Math.sin(a) * 0.3, Math.cos(a) * 0.3));
      en.y = Math.max(0.02, en.y);
      parts.push(barkColor(sweep([st, st.clone().lerp(en, 0.5).add(new V3(-0.05, 0.05, 0)), en], (t) => 0.035 * (1 - t * 0.8), { radial: 5, segments: 6 }), bark, { seed: seed + i }));
    }
    topY = 1.3;
  } else {
    // driftwood: sea-bleached, twisted, smooth
    const g = logGeo(1.6, 0.11, seed, bark, { wood: '#d8d0c0', twist: 0.07 });
    g.translate(0, 0.18, 0);
    parts.push(g);
    for (let i = 0; i < 3; i++) {
      const at = new V3(-0.6 + i * 0.55, 0.18, 0);
      const e = at.clone().add(new V3(0.15, -0.1 + rand() * 0.2, (rand() - 0.5) * 0.6));
      e.y = Math.max(0.03, e.y);
      parts.push(barkColor(sweep([at, e], (t) => 0.04 * (1 - t * 0.7), { radial: 6, segments: 3 }), bark, { seed: seed + i, style: 'fibrous' }));
    }
    topY = 0.3;
  }
  let geo = merge(parts);
  if (trim === 'mossy' || trim === 'rotten') {
    const col = geo.attributes.color;
    const n = geo.attributes.normal;
    const p = geo.attributes.position;
    const moss = new THREE.Color('#4c6a2a');
    for (let i = 0; i < col.count; i++) {
      const k = THREE.MathUtils.smoothstep(n.getY(i) + 0.4 * fbm(p.getX(i) * 6, p.getY(i) * 6, p.getZ(i) * 6, seed, 3), 0.1, 0.5) * (trim === 'mossy' ? 1 : 0.6);
      if (k > 0) { const c = new THREE.Color().fromBufferAttribute(col, i).lerp(moss, k); col.setXYZ(i, c.r, c.g, c.b); }
    }
  }
  if (trim === 'burnt') {
    // glowing-edge charcoal checks on the surface
    const col = geo.attributes.color;
    const p = geo.attributes.position;
    for (let i = 0; i < col.count; i++) if (Math.abs(fbm(p.getX(i) * 14, p.getY(i) * 14, p.getZ(i) * 14, seed, 2)) < 0.03) col.setXYZ(i, 0.35, 0.33, 0.3);
  }
  if (trim === 'snow') snowify(geo, 1, { seed, threshold: 0.3 });
  // cut end faces (marked by their uv = 0.5,0.5) get plain wood (vertex-coloured growth rings), not the bark texture
  {
    if (!geo.index) geo.setIndex([...Array(geo.attributes.position.count).keys()]);
    const uv = geo.attributes.uv;
    if (uv && geo.index) {
      const ix = geo.index.array;
      const bark = [], wood = [];
      const isCap = (v) => Math.abs(uv.getX(v) - 0.5) < 1e-6 && Math.abs(uv.getY(v) - 0.5) < 1e-6;
      for (let k = 0; k < ix.length; k += 3) (isCap(ix[k]) && isCap(ix[k + 1]) && isCap(ix[k + 2]) ? wood : bark).push(ix[k], ix[k + 1], ix[k + 2]);
      if (wood.length) {
        geo.setIndex([...bark, ...wood]);
        geo.clearGroups();
        geo.addGroup(0, bark.length, 0);
        geo.addGroup(bark.length, wood.length, 1);
      }
    }
  }
  // bark renders from both sides: swept branches / root wads never show a missing half when you orbit
  const barkM = barkMaterial(birch ? null : 'furrowed');
  barkM.side = THREE.DoubleSide;
  mesh(geo, geo.groups.length ? [barkM, vcMat(0.85, THREE.DoubleSide)] : barkM, { parent: root, name: 'wood' });
  if (trim === 'mossy') {
    // moss cushions on top
    const items = [];
    const p = geo.attributes.position;
    const n = geo.attributes.normal;
    for (let i = 0; i < p.count; i += 5) if (n.getY(i) > 0.8 && rand() < 0.15) items.push({ p: new V3(p.getX(i), p.getY(i) - 0.004, p.getZ(i)), s: new V3(1, 0.4, 1).multiplyScalar(0.6 + rand() * 0.7), c: rand() < 0.5 ? '#4a6a24' : '#5a7a2a' });
    root.add(instanced(new THREE.IcosahedronGeometry(0.035, 1), new THREE.MeshStandardMaterial({ roughness: 1, color: '#ffffff' }), items.slice(0, 250), 'moss'));
  }
  if (trim === 'fungi') {
    // bracket fungi stepping up the sides
    const items = [];
    const p = geo.attributes.position;
    const n = geo.attributes.normal;
    for (let i = 0; i < p.count && items.length < 14; i += 11) {
      if (Math.abs(n.getY(i)) < 0.3 && p.getY(i) > 0.05 && rand() < 0.08) {
        const out = new V3(n.getX(i), 0, n.getZ(i)).normalize();
        items.push({ p: new V3(p.getX(i), p.getY(i), p.getZ(i)).addScaledVector(out, -0.004), q: new THREE.Quaternion().setFromUnitVectors(new V3(1, 0, 0), out), s: new V3(1, 1, 1).multiplyScalar(0.6 + rand() * 0.6) });
      }
    }
    const fan = new THREE.SphereGeometry(0.1, 14, 6, -Math.PI / 2, Math.PI, 0, Math.PI / 2);
    fan.scale(1, 0.3, 1);
    fan.rotateY(-Math.PI / 2);
    fan.rotateY(Math.PI / 2);
    paintVertices(fan, (q, nn) => (nn.y < -0.1 ? new THREE.Color('#e8e0d0') : new THREE.Color('#a8703a').multiplyScalar(0.7 + 0.35 * Math.sin(Math.hypot(q.x, q.z) * 150))));
    root.add(instanced(fan, vcMat(0.7), items, 'fungi'));
  }
  if (trim === 'snow') mesh(snowMound(1.1, seed), vcMat(0.85), { parent: root, name: 'snow' });
  void topY;
  void UP;
  return finalize(root, { type: 'log', variant, options: o, animations: [] });
}
