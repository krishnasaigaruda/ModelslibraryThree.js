import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, rng, lathe, finalize } from '../../core/utils.js';
import { CATALOG, resolveVariant, expandVariants } from '../../catalog.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

/*
 * Maps kit: whole scenes assembled from the library's own models.
 *   terrain()  heightfield ground with biome colours (flat where things are built, hills around)
 *   water()    lakes / sea plane
 *   road()     asphalt ribbons with kerbs, sidewalks and lane markings
 *   put()      places any catalog model (createObject) on the ground
 * Everything is in metres; maps are roughly 60–140 m across.
 */

export const hasDOM = typeof document !== 'undefined';
let _create = null;
async function create(type, opts) {
  if (!_create) _create = (await import('../../index.js')).createObject;
  const e = CATALOG[type];
  if (!e || e.category === 'maps') throw new Error(`map: unknown type ${type}`);
  let variant = opts.variant;
  if (!variant || !resolveVariant(e, variant)) {
    // fall back to the closest real variant (same base word), else the first one
    const all = expandVariants(e);
    const base = String(variant ?? '').split('-')[0];
    variant = all.find((n) => n === base) ?? all.find((n) => n.startsWith(base)) ?? e.variants[0];
  }
  return _create(type, { ...opts, variant });
}

/** Map context: root group, seeded random, placement list and helpers. */
// let the browser paint between model builds (no-op in Node)
const yieldFrame = () => (typeof window === 'undefined' ? Promise.resolve() : new Promise((r) => setTimeout(r, 0)));

export const MAP_SCALE = 2.24; // maps are ~5x the area of their hand layout: outskirts fill in automatically

export function makeMap(name, seed, { size = 100 } = {}) {
  const root = group(name);
  const r = rng(`map-${name}-${seed}`);
  const reqs = []; // placement requests; built in done(): one model per unique (type, variant, opts), instanced
  const taken = []; // [x, z, radius] footprints so scatter doesn't overlap buildings
  size *= MAP_SCALE;
  const ctx = {
    root, r, size, taken, k: MAP_SCALE,
    rand: (a, b) => a + (b - a) * r(),
    pick: (list) => list[Math.floor(r() * list.length) % list.length],
    /** Place a catalog model at (x, z) facing ry; `fit` scales it down to a max footprint (m). */
    put(type, variant, x, z, ry = 0, { opts = {}, fit, y = null, scale = 1, claim = true } = {}) {
      reqs.push({ type, variant, opts, fit, x, z, ry, y, scale });
      if (claim) taken.push([x, z, fit ? fit / 2 : 4]);
    },
    free(x, z, rad) {
      return !taken.some(([tx, tz, tr]) => Math.hypot(tx - x, tz - z) < tr + rad);
    },
    /** Scatter ~n (x density) models from `list` ([type, variant] pairs) inside a shape test. */
    scatter(n, list, inside, { rad = 1.5, fit, tries = 40, rot = true, dense = true } = {}) {
      const N = dense ? Math.round(n * MAP_SCALE * MAP_SCALE * 0.55) : n;
      for (let i = 0; i < N; i++) {
        for (let t = 0; t < tries; t++) {
          const x = ctx.rand(-size / 2, size / 2);
          const z = ctx.rand(-size / 2, size / 2);
          if (!inside(x, z) || !ctx.free(x, z, rad)) continue;
          const [type, variant] = ctx.pick(list);
          ctx.put(type, variant, x, z, rot ? ctx.rand(0, Math.PI * 2) : 0, { fit, claim: false });
          taken.push([x, z, rad]);
          break;
        }
      }
    },
    /** Fill every free spot of the map (jittered grid) with weighted [[type, variant], weight, fit] items. */
    fill(list, { spacing = 10, minR = 0, water = -0.15 } = {}) {
      const total = list.reduce((a, it) => a + it[1], 0);
      const half = size * 0.72;
      for (let x = -half; x <= half; x += spacing) for (let z = -half; z <= half; z += spacing) {
        const px = x + ctx.rand(-0.45, 0.45) * spacing;
        const pz = z + ctx.rand(-0.45, 0.45) * spacing;
        if (Math.max(Math.abs(px), Math.abs(pz)) < minR) continue;
        if (ctx.heightAt && ctx.heightAt(px, pz) < water) continue;
        if (ctx.noFill && ctx.noFill(px, pz)) continue;
        let w = ctx.rand(0, total);
        const it = list.find((e) => (w -= e[1]) <= 0) ?? list[0];
        const rad = Math.max(1, (it[2] || 4) * 0.45);
        if (!ctx.free(px, pz, rad)) continue;
        ctx.put(it[0][0], it[0][1], px, pz, ctx.rand(0, Math.PI * 2), { fit: it[2] || undefined, claim: false });
        taken.push([px, pz, rad]);
      }
    },
    async done({ floating = true } = {}) {
      // fill the rest of the map so nothing is empty (families can set ctx.fillList / ctx.fillSpacing / ctx.townFill)
      if (ctx.fillList !== false) zones(ctx, ctx.fillList ?? FILL[ctx.biome] ?? FILL.grass);
      // build each unique model once
      const protos = new Map();
      for (const q of reqs) {
        const key = `${q.type}|${q.variant}|${JSON.stringify(q.opts)}|${q.fit ?? ''}|${q.scale}`;
        q.key = key;
        if (!protos.has(key)) protos.set(key, (async () => { await yieldFrame(); return create(q.type, { variant: q.variant, ...q.opts }); })().then((o) => {
          o.animations = [];
          o.scale.multiplyScalar(q.scale);
          if (q.fit) {
            const s0 = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
            const kk = q.fit / Math.max(s0.x, s0.z, 1e-3);
            if (kk < 1) o.scale.multiplyScalar(kk);
          }
          o.updateMatrixWorld(true);
          const sz = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
          return { o, rr: Math.min(Math.max(sz.x, sz.z) * 0.35, 6), uses: [] };
        }).catch(() => null));
      }
      const built = new Map(await Promise.all([...protos].map(async ([k, p]) => [k, await p])));
      for (const q of reqs) {
        const p = built.get(q.key);
        if (!p) continue;
        let yy = q.y;
        if (yy === null) yy = ctx.heightAt ? Math.min(...[[0, 0], [p.rr, 0], [-p.rr, 0], [0, p.rr], [0, -p.rr]].map(([dx, dz]) => ctx.heightAt(q.x + dx, q.z + dz))) : 0;
        p.uses.push([q.x, yy, q.z, q.ry]);
      }
      const place = new THREE.Matrix4();
      const q4 = new THREE.Quaternion();
      const one = new THREE.Vector3(1, 1, 1);
      for (const p of built.values()) {
        if (!p || !p.uses.length) continue;
        const { o, uses } = p;
        let skinned = false;
        let morph = false;
        o.traverse((m) => { if (m.isSkinnedMesh) skinned = true; if (m.isMesh && m.geometry.morphAttributes && Object.keys(m.geometry.morphAttributes).length) morph = true; });
        if (uses.length === 1 || skinned || morph) { // skinned / morphing models can't be instanced
          // people (skinned) and one-offs: real objects
          uses.forEach(([x, y, z, ry], i) => {
            const c = i === 0 ? o : skinned ? cloneSkinned(o) : o.clone(true); // skinned copies need their own skeleton
            c.position.set(x, y, z);
            c.rotation.y = ry;
            root.add(c);
          });
          continue;
        }
        // everything repeated: one InstancedMesh per sub-mesh
        o.position.set(0, 0, 0);
        o.rotation.set(0, 0, 0);
        o.updateMatrixWorld(true);
        o.traverse((m) => {
          if (!m.isMesh || m.isInstancedMesh) return;
          const im = new THREE.InstancedMesh(m.geometry, m.material, uses.length);
          im.name = `${m.name || 'part'}_x${uses.length}`;
          uses.forEach(([x, y, z, ry], i) => {
            place.compose(new THREE.Vector3(x, y, z), q4.setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), one).multiply(m.matrixWorld);
            im.setMatrixAt(i, place);
          });
          im.castShadow = !m.userData.noShadow;
          im.receiveShadow = true;
          im.userData.noShadow = m.userData.noShadow;
          im.computeBoundingSphere();
          root.add(im);
        });
      }
      mergeStatic(root);
      const obj = finalize(root, { type: 'map', variant: name, options: {}, animations: [] });
      obj.userData.floating = floating; // composite scene: parts are tested as single models
      return obj;
    },
  };
  return ctx;
}

/** What fills the empty parts of a map, per biome: [[type, variant], weight, fit]. */
export const FILL = {
  grass: [[['tree', 'oak'], 3, 7], [['tree', 'maple'], 3, 7], [['tree', 'birch'], 2, 6], [['bush', 'round'], 3, 2.5], [['bush', 'flowering'], 2, 2.5], [['grass', 'clump'], 3, 1.5], [['flower', 'daisy'], 1, 1], [['rock', 'boulder'], 1, 2.5]],
  meadow: [[['tree', 'oak'], 2, 7], [['tree', 'beech'], 2, 7], [['bush', 'round'], 3, 2.5], [['grass', 'tall'], 3, 1.5], [['flower', 'poppy'], 2, 1], [['flower', 'daisy'], 2, 1], [['rock', 'flat'], 1, 2]],
  forest: [[['tree', 'pine'], 4, 7], [['tree', 'spruce'], 3, 7], [['tree', 'oak'], 2, 7], [['bush', 'fern'], 3, 2], [['log', 'log'], 1, 3], [['log', 'stump'], 1, 1.5], [['mushroom', 'cluster'], 1, 0.6], [['rock', 'mossy'], 1, 2.5]],
  autumn: [[['tree', 'maple-autumn'], 4, 7], [['tree', 'oak-autumn'], 3, 7], [['tree', 'beech-autumn'], 2, 7], [['bush', 'round'], 2, 2.5], [['log', 'log'], 1, 3], [['rock', 'mossy'], 1, 2]],
  desert: [[['cactus', 'saguaro'], 3, 4], [['cactus', 'barrel'], 2, 1.5], [['cactus', 'prickly-pear'], 2, 2], [['succulent', 'agave'], 2, 1.5], [['rock', 'boulder'], 3, 3], [['grass', 'clump'], 2, 1.2]],
  sand: [[['tree', 'palm'], 3, 6], [['grass', 'pampas'], 3, 2], [['rock', 'flat'], 1, 2], [['succulent', 'agave'], 1, 1.5]],
  snow: [[['tree', 'pine-winter'], 4, 7], [['tree', 'spruce-winter'], 3, 7], [['rock', 'granite'], 2, 3], [['log', 'stump'], 1, 1.5]],
  mars: [[['rock', 'boulder'], 4, 4], [['rock', 'granite'], 3, 3], [['rock', 'flat'], 3, 3], [['rock', 'pebbles'], 2, 2]],
  moon: [[['rock', 'boulder'], 4, 3.5], [['rock', 'granite'], 3, 3], [['rock', 'pebbles'], 3, 2]],
  swamp: [[['tree', 'willow'], 3, 7], [['tree', 'cypress'], 3, 6], [['water-plant', 'reeds'], 3, 2], [['water-plant', 'cattails'], 3, 2], [['log', 'hollow-log'], 1, 3], [['bush', 'fern'], 2, 2]],
  tropical: [[['tree', 'palm'], 4, 6], [['tree', 'coconut-palm'], 3, 6], [['bush', 'fern'], 3, 2.5], [['flower', 'sunflower'], 1, 1]],
  rock: [[['rock', 'boulder'], 3, 4], [['rock', 'granite'], 3, 4], [['tree', 'pine'], 3, 7], [['grass', 'clump'], 2, 1.5], [['bush', 'round'], 1, 2.5]],
  fantasy: [[['tree', 'cherry'], 3, 7], [['tree', 'willow'], 2, 7], [['mushroom', 'fly-agaric'], 2, 1], [['flower', 'lavender'], 2, 1], [['bush', 'flowering'], 2, 2.5], [['rock', 'mossy'], 1, 2.5]],
};
export const TOWN_FILL = [[['house', 'cottage'], 2, 12], [['house', 'suburban'], 2, 12], [['house', 'bungalow'], 2, 12], [['house', 'farmhouse'], 1, 13], [['shed', 'garden'], 1, 4], [['car', 'sedan'], 1, 0], [['car', 'suv'], 1, 0]];

/* ------------------------------ terrain ------------------------------ */

function noise2(r) {
  // value noise on a lattice, smooth-interpolated (seeded)
  const N = 64;
  const g = Array.from({ length: N * N }, () => r());
  const at = (i, j) => g[((i % N) + N) % N * N + (((j % N) + N) % N)];
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, z) => {
    const i = Math.floor(x), j = Math.floor(z);
    const fx = sm(x - i), fz = sm(z - j);
    const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
    return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
  };
}

export const BIOMES = {
  grass: { low: '#5f8a36', mid: '#517a2f', high: '#5d7a3c', top: '#7d8068' },
  meadow: { low: '#6f9a40', mid: '#5f8a38', high: '#6a8442', top: '#848a6a' },
  forest: { low: '#4f6e32', mid: '#42602b', high: '#5f5a4a', top: '#77736a' },
  autumn: { low: '#7f8a3a', mid: '#8a6f2e', high: '#7a5a34', top: '#7f7468' },
  desert: { low: '#d9b77e', mid: '#cfa66a', high: '#b98a55', top: '#a87a4a' },
  sand: { low: '#e6d3a3', mid: '#d9c38e', high: '#bfae80', top: '#a8a08a' },
  snow: { low: '#eef3f7', mid: '#e3eaf0', high: '#c9d2da', top: '#ffffff' },
  mars: { low: '#b5603a', mid: '#a2512f', high: '#8a4428', top: '#6e3a26' },
  moon: { low: '#9a9a98', mid: '#8a8a88', high: '#77777a', top: '#6a6a6c' },
  swamp: { low: '#4c5a33', mid: '#424f2c', high: '#55553e', top: '#66644e' },
  tropical: { low: '#e9d8a6', mid: '#5f9a3a', high: '#4b7f2e', top: '#6c6a58' },
  rock: { low: '#8a8478', mid: '#7a7468', high: '#6a6458', top: '#9a948a' },
  fantasy: { low: '#5f9a5a', mid: '#4f8a6a', high: '#6a6a8a', top: '#9a8ab0' },
};

/**
 * Heightfield ground. Flat (y = 0) inside `flat` metres of the centre (or wherever
 * flatFn(x,z) returns true) so buildings sit on it; hills grow toward the edges.
 * `dip(x,z)` can carve lakes/sea (negative metres).
 */
export function terrain(ctx, { biome = 'grass', hills = 8, flat = 0.32, extent = 1.5, seg = 110, flatFn, dip } = {}) {
  const S = ctx.size * extent;
  const n = noise2(ctx.r);
  const B = BIOMES[biome] ?? BIOMES.grass;
  const g = new THREE.PlaneGeometry(S, S, seg, seg).rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const cl = [B.low, B.mid, B.high, B.top].map((c) => new THREE.Color(c));
  const fr = ctx.size * flat;
  const c = new THREE.Color();
  const heightAt = (x, z) => {
    const d = Math.max(Math.abs(x), Math.abs(z));
    let k = THREE.MathUtils.smoothstep(d, fr, ctx.size * 0.62);
    if (flatFn && flatFn(x, z)) k = 0;
    const f = n(x / 22, z / 22) * 0.65 + n(x / 8, z / 8) * 0.25 + n(x / 3, z / 3) * 0.1;
    return k * hills * (0.35 + f) + (dip ? dip(x, z) : 0);
  };
  ctx.heightAt = heightAt;
  ctx.biome = biome;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const f = n(x / 22, z / 22) * 0.65 + n(x / 8, z / 8) * 0.25 + n(x / 3, z / 3) * 0.1;
    const y = heightAt(x, z);
    p.setY(i, y);
    const h = THREE.MathUtils.clamp(y / Math.max(hills, 0.1), -1, 1.4);
    if (h < 0.15) c.copy(cl[0]).lerp(cl[1], Math.max(0, h / 0.15) * 0.6 + f * 0.3);
    else if (h < 0.6) c.copy(cl[1]).lerp(cl[2], (h - 0.15) / 0.45);
    else c.copy(cl[2]).lerp(cl[3], Math.min(1, (h - 0.6) / 0.5));
    c.offsetHSL(0, 0, (f - 0.5) * 0.06);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  g.translate(0, 0.012, 0); // a hair above y=0 so it never z-fights a viewer's own ground plane
  const t = mesh(g, new THREE.MeshStandardMaterial({ name: 'terrain', vertexColors: true, roughness: 1 }), { parent: ctx.root, name: 'terrain' });
  t.receiveShadow = true;
  return t;
}

/** Water plane (sea, lake, river) at height y covering a w×d area. */
export function water(ctx, { y = -0.25, w = ctx.size * 1.5, d = ctx.size * 1.5, x = 0, z = 0, color = '#3f7480' } = {}) {
  const m = new THREE.MeshPhysicalMaterial({ name: 'water', color, roughness: 0.08, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.86 });
  const o = mesh(new THREE.PlaneGeometry(w, d), m, { parent: ctx.root, at: [x, y, z], rot: [-Math.PI / 2, 0, 0], name: 'water' });
  o.receiveShadow = true;
  return o;
}

/* ------------------------------- roads ------------------------------- */

const ASPHALT = () => new THREE.MeshStandardMaterial({ name: 'asphalt', color: '#3d3f43', roughness: 0.95 });
const PAVE = () => new THREE.MeshStandardMaterial({ name: 'sidewalk', color: '#bdb9b0', roughness: 0.9 });
const PAINT = (c = '#f2f2ec') => new THREE.MeshStandardMaterial({ name: 'road-paint', color: c, roughness: 0.6 });
const DIRT = () => new THREE.MeshStandardMaterial({ name: 'dirt-road', color: '#9a8466', roughness: 1 });

/** Straight road from (x0,z0) to (x1,z1). kind: 'street' (sidewalks), 'highway', 'dirt', 'track'. */
export function road(ctx, x0, z0, x1, z1, { w = 7, kind = 'street', lines = true, extend = true } = {}) {
  // hand-made layouts were drawn for the small map: roads reaching its old edge run on to the new edge
  if (extend) {
    // lengthen along the road's own direction only (never shift it sideways off its blocks)
    const edge = 45, far = ctx.size * 0.5 * 0.92;
    const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz) || 1;
    const ux = dx / len, uz = dz / len;
    const reach = (x, z) => Math.max(Math.abs(x), Math.abs(z)) >= edge;
    if (reach(x1, z1)) { const t = Math.max(0, (far - Math.max(Math.abs(x1), Math.abs(z1))) / Math.max(Math.abs(ux), Math.abs(uz), 1e-3)); x1 += ux * t; z1 += uz * t; }
    if (reach(x0, z0)) { const t = Math.max(0, (far - Math.max(Math.abs(x0), Math.abs(z0))) / Math.max(Math.abs(ux), Math.abs(uz), 1e-3)); x0 -= ux * t; z0 -= uz * t; }
  }
  const len = Math.hypot(x1 - x0, z1 - z0);
  const g = group('road', { parent: ctx.root, at: [(x0 + x1) / 2, 0, (z0 + z1) / 2], rot: [0, Math.atan2(x1 - x0, z1 - z0), 0] });
  const surf = kind === 'dirt' ? DIRT() : ASPHALT();
  mesh(new THREE.BoxGeometry(w, 0.06, len), surf, { parent: g, at: [0, 0.03, 0] }).receiveShadow = true;
  if (kind === 'street') {
    for (const s of [-1, 1]) {
      mesh(new THREE.BoxGeometry(2.2, 0.16, len), PAVE(), { parent: g, at: [s * (w / 2 + 1.1), 0.08, 0] }).receiveShadow = true;
      mesh(new THREE.BoxGeometry(0.18, 0.18, len), M.matte('#9a968c'), { parent: g, at: [s * (w / 2 + 0.05), 0.09, 0] });
    }
  }
  if (lines && kind !== 'dirt') {
    const dash = kind === 'highway' ? 0 : 3;
    if (dash) {
      const n = Math.floor(len / (dash * 2));
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 0.012, dash), PAINT(), Math.max(1, n));
      const mtx = new THREE.Matrix4();
      for (let i = 0; i < n; i++) im.setMatrixAt(i, mtx.makeTranslation(0, 0.066, -len / 2 + dash + i * dash * 2));
      g.add(im);
    } else {
      for (const s of [-0.5, 0.5]) mesh(new THREE.BoxGeometry(0.15, 0.012, len), PAINT('#f2c200'), { parent: g, at: [s * 0.4, 0.066, 0] });
      for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.15, 0.012, len), PAINT(), { parent: g, at: [s * (w / 2 - 0.4), 0.066, 0] });
    }
  }
  ctx.taken.push(...Array.from({ length: Math.ceil(len / 6) + 1 }, (_, i) => {
    const t = i / Math.max(1, Math.ceil(len / 6));
    return [x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, w / 2 + (kind === 'street' ? 2.4 : 0.6)];
  }));
  return g;
}

/** Flat paved plaza / parking / pad. */
export function pad(ctx, x, z, w, d, { color = '#b9b5ac', h = 0.08, name = 'plaza' } = {}) {
  const o = mesh(new THREE.BoxGeometry(w, h, d), M.matte(color, 0.9), { parent: ctx.root, at: [x, h / 2, z], name });
  o.receiveShadow = true;
  ctx.taken.push([x, z, Math.min(w, d) / 2]);
  return o;
}

/** Painted parking bays on a pad. */
export function bays(ctx, x, z, n, { w = 2.6, d = 5, ry = 0 } = {}) {
  const g = group('bays', { parent: ctx.root, at: [x, 0.085, z], rot: [0, ry, 0] });
  for (let i = 0; i <= n; i++) mesh(new THREE.BoxGeometry(0.12, 0.01, d), PAINT(), { parent: g, at: [(i - n / 2) * w, 0, 0] });
}

/** Race / running track loop (stadium shape) with kerbs. */
export function trackLoop(ctx, { sx = 60, r = 18, w = 10, color = '#3d3f43', kerb = true } = {}) {
  const shape = (rad) => {
    const s = new THREE.Shape();
    s.absarc(sx / 2, 0, rad, -Math.PI / 2, Math.PI / 2, false);
    s.absarc(-sx / 2, 0, rad, Math.PI / 2, Math.PI * 1.5, false);
    return s;
  };
  const outer = shape(r + w / 2);
  outer.holes.push(new THREE.Path(shape(r - w / 2).getPoints(64).reverse()));
  const g = new THREE.ExtrudeGeometry(outer, { depth: 0.06, bevelEnabled: false, curveSegments: 48 }).rotateX(-Math.PI / 2);
  mesh(g, new THREE.MeshStandardMaterial({ name: 'track', color, roughness: 0.9 }), { parent: ctx.root, name: 'track' }).receiveShadow = true;
  if (kerb) {
    for (const rad of [r + w / 2 + 0.3, r - w / 2 - 0.3]) {
      const pts = shape(rad).getPoints(96);
      const n = pts.length;
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.12, 0.5), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }), n);
      const red = new THREE.Color('#c8102e');
      const wht = new THREE.Color('#ffffff');
      const mtx = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.atan2(-b.y + a.y, b.x - a.x));
        mtx.compose(new THREE.Vector3(a.x, 0.06, -a.y), q, new THREE.Vector3(1, 1, 1));
        im.setMatrixAt(i, mtx);
        im.setColorAt(i, i % 2 ? red : wht);
      }
      ctx.root.add(im);
    }
  }
  ctx.taken.push([0, 0, r + w]);
}

/* ------------------------- custom map structures ------------------------- */

/** Sci-fi habitat dome with ribs and an airlock tunnel. */
export function dome(ctx, x, z, rad, { glass = true, color = '#e8ecef' } = {}) {
  const g = group('habitat-dome', { parent: ctx.root, at: [x, 0, z] });
  mesh(new THREE.CylinderGeometry(rad + 0.4, rad + 0.6, 0.6, 48), M.matte('#9aa0a6'), { parent: g, at: [0, 0.3, 0] });
  const shell = new THREE.SphereGeometry(rad, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const mat = glass ? new THREE.MeshPhysicalMaterial({ name: 'dome-glass', color: '#bfe3f2', roughness: 0.05, metalness: 0.1, transmission: 0.6, transparent: true, opacity: 0.55 }) : M.paint(color, { metallic: 0.3, roughness: 0.4 });
  mesh(shell, mat, { parent: g, at: [0, 0.6, 0] });
  for (let i = 0; i < 8; i++) {
    const rib = new THREE.TorusGeometry(rad + 0.02, 0.08, 6, 48, Math.PI);
    mesh(rib, M.metal('#c9cdd2', 0.3), { parent: g, at: [0, 0.6, 0], rot: [0, (i / 8) * Math.PI, 0] });
  }
  mesh(roundedBox(2.6, 2.6, 4, 0.5), M.paint(color, { metallic: 0.3, roughness: 0.4 }), { parent: g, at: [rad + 1.2, 1.3, 0], rot: [0, Math.PI / 2, 0] });
  ctx.taken.push([x, z, rad + 3]);
  return g;
}

export function habModule(ctx, x, z, ry = 0, { len = 9, color = '#e8ecef' } = {}) {
  const g = group('hab-module', { parent: ctx.root, at: [x, 0, z], rot: [0, ry, 0] });
  const body = mesh(new THREE.CylinderGeometry(1.8, 1.8, len, 32), M.paint(color, { metallic: 0.3, roughness: 0.4 }), { parent: g, at: [0, 2.1, 0], rot: [Math.PI / 2, 0, 0] });
  body.castShadow = true;
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(1.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.paint(color, { metallic: 0.3, roughness: 0.4 }), { parent: g, at: [0, 2.1, (s * len) / 2], rot: [s * Math.PI / 2, 0, 0] });
  for (let i = 0; i < 4; i++) {
    const zz = -len / 2 + 1 + (i * (len - 2)) / 3;
    for (const s of [-1, 1]) mesh(roundedBox(0.4, 1.4, 0.4, 0.1), M.metal('#7a8086', 0.4), { parent: g, at: [s * 1.2, 0.5, zz] });
  }
  for (let i = 0; i < 3; i++) mesh(new THREE.CircleGeometry(0.35, 20), M.emissive('#9fd8ff', 1.2), { parent: g, at: [1.81, 2.4, -len / 3 + i * len / 3], rot: [0, Math.PI / 2, 0] });
  ctx.taken.push([x, z, len / 2 + 1]);
  return g;
}

export function antenna(ctx, x, z, { h = 14 } = {}) {
  const g = group('antenna', { parent: ctx.root, at: [x, 0, z] });
  mesh(new THREE.CylinderGeometry(0.15, 0.3, h, 12), M.metal('#c9cdd2', 0.3), { parent: g, at: [0, h / 2, 0] });
  const dish = lathe([[0.01, 0], [1.2, 0.3], [2.2, 0.9], [2.25, 0.95]], 32);
  mesh(dish, M.matte('#eef0f2', 0.5), { parent: g, at: [0, h * 0.7, 0.3], rot: [-1.0, 0, 0] });
  mesh(new THREE.SphereGeometry(0.25, 12, 8), M.emissive('#ff3a2a', 2), { parent: g, at: [0, h + 0.2, 0] });
  ctx.taken.push([x, z, 2.5]);
}

export function solarArray(ctx, x, z, { n = 4, ry = 0 } = {}) {
  const g = group('solar-array', { parent: ctx.root, at: [x, 0, z], rot: [0, ry, 0] });
  const cell = new THREE.MeshPhysicalMaterial({ name: 'solar-cell', color: '#1c2f5a', roughness: 0.2, metalness: 0.5, clearcoat: 1 });
  for (let i = 0; i < n; i++) {
    mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 8), M.metal('#9aa0a6'), { parent: g, at: [i * 2.4, 0.8, 0] });
    mesh(new THREE.BoxGeometry(2.2, 0.06, 1.4), cell, { parent: g, at: [i * 2.4, 1.7, 0], rot: [-0.45, 0, 0] });
  }
  ctx.taken.push([x + n * 1.2, z, n * 1.3]);
}

export function landingPad(ctx, x, z, rad = 9, { mark = 'H' } = {}) {
  const g = group('landing-pad', { parent: ctx.root, at: [x, 0, z] });
  mesh(new THREE.CylinderGeometry(rad, rad + 0.3, 0.3, 48), M.matte('#4a4d52', 0.8), { parent: g, at: [0, 0.15, 0] });
  mesh(new THREE.TorusGeometry(rad * 0.82, 0.18, 6, 64), M.matte('#f2c200', 0.6), { parent: g, at: [0, 0.31, 0], rot: [Math.PI / 2, 0, 0] });
  if (hasDOM) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x2 = c.getContext('2d');
    x2.fillStyle = '#f4f4f0'; x2.font = 'bold 200px Helvetica, Arial'; x2.textAlign = 'center'; x2.textBaseline = 'middle';
    x2.fillText(mark, 128, 136);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    mesh(new THREE.PlaneGeometry(rad, rad), new THREE.MeshBasicMaterial({ map: t, transparent: true }), { parent: g, at: [0, 0.32, 0], rot: [-Math.PI / 2, 0, 0] });
  }
  ctx.taken.push([x, z, rad + 1]);
}

/** Glowing crystal cluster (fantasy). */
export function crystals(ctx, x, z, { color = '#9a6cff', n = 7, h = 4 } = {}) {
  const g = group('crystals', { parent: ctx.root, at: [x, 0, z] });
  const m = new THREE.MeshPhysicalMaterial({ name: 'crystal', color, emissive: color, emissiveIntensity: 0.5, roughness: 0.1, transmission: 0.3, transparent: true, opacity: 0.85, flatShading: true });
  for (let i = 0; i < n; i++) {
    const hh = h * (0.4 + ctx.r() * 0.8);
    const c = mesh(new THREE.ConeGeometry(hh * 0.18, hh, 6), m, { parent: g, at: [(ctx.r() - 0.5) * 2, hh / 2 - 0.1, (ctx.r() - 0.5) * 2] });
    c.rotation.set((ctx.r() - 0.5) * 0.6, ctx.r() * 3, (ctx.r() - 0.5) * 0.6);
  }
  ctx.taken.push([x, z, 2.5]);
}

/** Simple stone wall run (medieval / farm) between two points. */
export function wall(ctx, x0, z0, x1, z1, { h = 1.2, t = 0.6, color = '#8f877a' } = {}) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  mesh(roundedBox(t, h, len, 0.12), M.matte(color, 0.95), { parent: ctx.root, at: [(x0 + x1) / 2, h / 2, (z0 + z1) / 2], rot: [0, Math.atan2(x1 - x0, z1 - z0), 0], name: 'wall' });
}

/* ---------------- merge static meshes by look (thousands of draw calls -> hundreds) ---------------- */
const matKey = (m) => [m.type, m.color?.getHexString(), m.emissive?.getHexString(), m.emissiveIntensity?.toFixed(2), m.roughness?.toFixed(2), m.metalness?.toFixed(2),
  m.map?.uuid, m.emissiveMap?.uuid, m.transparent, m.opacity?.toFixed(2), m.vertexColors, m.side, m.clearcoat?.toFixed(2), m.transmission?.toFixed(2), m.flatShading, m.polygonOffset].join('|');
export function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const groups = new Map();
  const victims = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || o.geometry.morphAttributes?.position || o.userData.noShadow) return;
    const k = matKey(o.material);
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(name)) g.deleteAttribute(name);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (o.material.vertexColors && !g.attributes.color) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(1), 3));
    if (!o.material.vertexColors && g.attributes.color) g.deleteAttribute('color');
    g.applyMatrix4(o.matrixWorld);
    g.clearGroups();
    (groups.get(k) ?? groups.set(k, { mat: o.material, geos: [], shadow: o.castShadow }).get(k)).geos.push(g);
    victims.push(o);
  });
  for (const o of victims) o.parent.remove(o);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  for (const { mat, geos } of groups.values()) {
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (!merged) continue;
    merged.applyMatrix4(inv);
    const m = new THREE.Mesh(merged, mat);
    m.name = 'merged';
    m.castShadow = m.receiveShadow = true;
    root.add(m);
  }
}

/* --------------- structured outskirts: groves, meadows, homesteads, hamlets --------------- */
const HOMESTEAD = {
  grass: [['house', 'farmhouse'], ['barn', 'gable'], ['shed', 'garden'], ['silo', 'farm']],
  meadow: [['house', 'farmhouse'], ['barn', 'gambrel'], ['shed', 'garden'], ['windmill', 'windpump']],
  forest: [['shed', 'tiny-cabin'], ['ranger-station', 'cabin'], ['log', 'log-pile']],
  autumn: [['shed', 'tiny-cabin'], ['house', 'cottage'], ['log', 'log-pile']],
  desert: [['house', 'bungalow'], ['ancient-ruins', 'foundations'], ['tent', 'dome'], ['windmill', 'windpump']],
  sand: [['beach-set', 'beach-hut'], ['umbrella', 'beach']],
  snow: [['house', 'cottage-winter'], ['shed', 'tiny-cabin'], ['log', 'log-pile']],
  tropical: [['beach-set', 'beach-hut'], ['shed', 'tiny-cabin']],
  swamp: [['shed', 'tiny-cabin'], ['boardwalk', 'straight']],
  rock: [['shed', 'metal'], ['ranger-station', 'tower']],
  fantasy: [['treehouse', 'classic'], ['mushroom-folk', 'colony'], ['stone-well', 'covered']],
  mars: [], moon: [],
};
const VEHICLE = { grass: [['farm', 'tractor-compact'], ['car', 'wagon']], meadow: [['farm', 'tractor-utility'], ['car', 'suv']], desert: [['car', 'suv'], ['misc-vehicle', 'atv']], snow: [['misc-vehicle', 'snowmobile']], forest: [['car', 'suv']], autumn: [['car', 'wagon']] };

function zones(ctx, list) {
  const half = ctx.size * 0.7;
  const biome = ctx.biome ?? 'grass';
  const trees = list.filter((e) => e[0][0] === 'tree');
  const low = list.filter((e) => e[0][0] !== 'tree');
  const pickW = (l) => { const t = l.reduce((a, e) => a + e[1], 0); let w = ctx.rand(0, t); return l.find((e) => (w -= e[1]) <= 0) ?? l[0]; };
  const drop = (it, x, z, extra = 0) => {
    const rad = Math.max(1, (it[2] || 4) * 0.45) + extra;
    if (Math.abs(x) > half || Math.abs(z) > half) return false;
    if (ctx.heightAt && ctx.heightAt(x, z) < -0.15) return false;
    if (!ctx.free(x, z, rad)) return false;
    ctx.put(it[0][0], it[0][1], x, z, ctx.rand(0, Math.PI * 2), { fit: it[2] || undefined, claim: false });
    ctx.taken.push([x, z, rad]);
    return true;
  };
  // zone centres on a jittered grid (~48 m apart) over the whole map
  const step = 48;
  for (let gx = -half; gx <= half; gx += step) for (let gz = -half; gz <= half; gz += step) {
    const cx = gx + ctx.rand(-0.35, 0.35) * step;
    const cz = gz + ctx.rand(-0.35, 0.35) * step;
    if (!ctx.free(cx, cz, 10)) continue; // the hand-made centre of the map stays as designed
    const town = ctx.townFill && Math.max(Math.abs(cx), Math.abs(cz)) > ctx.townFill;
    const homes = HOMESTEAD[biome] ?? HOMESTEAD.grass;
    const roll = ctx.r();
    if (town && roll < 0.55) {
      // hamlet: a short dirt lane with houses facing it on both sides
      const ang = ctx.rand(0, Math.PI);
      const dx = Math.cos(ang), dz = Math.sin(ang);
      road(ctx, cx - dx * 20, cz - dz * 20, cx + dx * 20, cz + dz * 20, { w: 5, kind: 'dirt', extend: false });
      for (let k = -1; k <= 1; k++) for (const side of [-1, 1]) {
        const it = pickW(TOWN_FILL.slice(0, 5));
        const hx = cx + dx * k * 13 - dz * side * 11, hz = cz + dz * k * 13 + dx * side * 11;
        if (ctx.free(hx, hz, 5) && (!ctx.heightAt || ctx.heightAt(hx, hz) > -0.15)) { ctx.put(it[0][0], it[0][1], hx, hz, Math.atan2(dz * side, -dx * side), { fit: it[2], claim: false }); ctx.taken.push([hx, hz, 6]); } // front faces the lane
      }
      if (ctx.r() < 0.6) drop([['car', ctx.pick(['sedan', 'suv', 'hatchback', 'wagon'])], 1, 0], cx + dx * 4, cz + dz * 4);
    } else if (homes.length && roll < (town ? 0.7 : 0.22)) {
      // homestead: main building, outbuildings, a vehicle, a few trees as a windbreak
      homes.forEach((h, i) => drop([h, 1, i ? 6 : 13], cx + (i ? ctx.rand(-14, 14) : 0), cz + (i ? ctx.rand(-14, 14) : 0), i ? 1 : 3));
      const v = VEHICLE[biome];
      if (v && ctx.r() < 0.7) drop([ctx.pick(v), 1, 0], cx + ctx.rand(-8, 8), cz + ctx.rand(-8, 8));
      for (let i = 0; i < 5 && trees.length; i++) drop(pickW(trees), cx + ctx.rand(-20, 20), cz + ctx.rand(-20, 20));
    } else if (trees.length && roll < 0.68) {
      // grove: a dense clump of trees with undergrowth around its edge
      const n = 6 + Math.floor(ctx.r() * 8);
      for (let i = 0; i < n; i++) { const a = ctx.rand(0, Math.PI * 2), rr = Math.sqrt(ctx.r()) * 16; drop(pickW(trees), cx + Math.cos(a) * rr, cz + Math.sin(a) * rr); }
      for (let i = 0; i < 5 && low.length; i++) { const a = ctx.rand(0, Math.PI * 2), rr = 15 + ctx.r() * 6; drop(pickW(low), cx + Math.cos(a) * rr, cz + Math.sin(a) * rr); }
    } else if (low.length) {
      // meadow / outcrop: low plants or rocks in a loose patch
      for (let i = 0; i < 7; i++) drop(pickW(low), cx + ctx.rand(-16, 16), cz + ctx.rand(-16, 16));
    }
  }
  // a light background layer ties the zones together
  for (let x = -half; x <= half; x += 26) for (let z = -half; z <= half; z += 26) drop(pickW(list), x + ctx.rand(-10, 10), z + ctx.rand(-10, 10));
}
