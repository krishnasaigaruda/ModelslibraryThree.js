import * as THREE from 'three';
import { group, mesh, rng, finalize, normalizeOptions, lathe } from '../../core/utils.js';
import { rotateTrack, clip, wave } from '../../core/animation.js';
import { sweep, merge, paintVertices, blob, fbm, instanced, seedOf, vcMat, checkVariant, potGeometry, snowMound } from './common.js';

const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0);

/* ================================ Cacti ================================ */

export const CACTUS_VARIANTS = {
  saguaro: { color: '#4d7a3a', flower: '#f8f4e6', fruit: '#c8304a', ribs: 14 },
  barrel: { color: '#4f8040', flower: '#f2c12e', fruit: '#e8c43a', ribs: 18, spine: '#c8584a' },
  'prickly-pear': { color: '#5f8f3e', flower: '#f2d02e', fruit: '#b0254f' },
  'organ-pipe': { color: '#4a7a3e', flower: '#f0d6e0', fruit: '#c8304a', ribs: 12 },
  'san-pedro': { color: '#5a8a6a', flower: '#fbf8f2', fruit: '#4a7a3a', ribs: 7 },
  'old-man': { color: '#6a8a4a', flower: '#e85a8a', fruit: '#e85a8a', ribs: 20, hair: true },
  mammillaria: { color: '#4a7a3a', flower: '#e84a9a', fruit: '#d8202a', ribs: 0 },
  cholla: { color: '#7a9a5a', flower: '#c8307a', fruit: '#c8c84a', spine: '#f2ead0' },
  'golden-barrel': { color: '#4a7a36', flower: '#f6d23a', fruit: '#e8c43a', ribs: 22, spine: '#f2c43a', dense: true },
};
export const CACTUS_TRIMS = Object.fromEntries(Object.keys(CACTUS_VARIANTS).map((k) => [k, ['young', 'old', 'flowering', 'fruiting', 'cluster', 'dry', 'snow']]));

function spinesMesh(points, { rand, len = 0.03, color = '#efe6c8', name = 'spines' }) {
  const g = new THREE.ConeGeometry(0.004, len, 3);
  g.translate(0, len / 2, 0);
  const items = points.map(({ p, n }) => {
    const d = n.clone().add(new V3((rand() - 0.5) * 0.6, (rand() - 0.5) * 0.6, (rand() - 0.5) * 0.6)).normalize();
    return { p, q: new THREE.Quaternion().setFromUnitVectors(UP, d), s: new V3(1, 0.7 + rand() * 0.6, 1) };
  });
  return instanced(g, new THREE.MeshStandardMaterial({ color, roughness: 0.6 }), items, name);
}

function ribbedColumn(pts, R, ribs, color, seed, { dry = false, cork = 0 } = {}) {
  const g = sweep(pts, (t, a) => {
    let r = R * (1 + (ribs ? (dry ? 0.16 : 0.09) * Math.cos(a * ribs) : 0));
    if (dry) r *= 1 - 0.05 * Math.abs(Math.sin(t * 40));
    if (t > 0.88) r *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.88) / 0.12, 2)));
    return r;
  }, { radial: Math.max(16, ribs * 4), segments: Math.max(16, pts.length * 6) });
  const base = new THREE.Color(color);
  const uv = g.attributes.uv;
  const H = pts.at(-1).y - pts[0].y;
  paintVertices(g, (v, n, i) => {
    const a = uv.getX(i) * Math.PI * 2;
    const c = base.clone().multiplyScalar(0.7 + 0.3 * (ribs ? 0.5 + 0.5 * Math.cos(a * ribs) : 0.6) + fbm(v.x * 6, v.y * 6, v.z * 6, seed, 2) * 0.08);
    if (cork && v.y < cork * H) c.lerp(new THREE.Color('#7a6a52'), 0.75 * (1 - v.y / (cork * H)));
    return c;
  });
  return g;
}

function cactusFlower(color, size = 1) {
  const pet = [];
  for (let i = 0; i < 10; i++) {
    const g = new THREE.SphereGeometry(0.025 * size, 6, 4);
    g.scale(0.5, 0.25, 1.4);
    g.translate(0, 0.01 * size, 0.03 * size);
    g.rotateX(-0.6);
    g.rotateY((i / 10) * Math.PI * 2);
    pet.push(paintVertices(g, () => new THREE.Color(color)));
  }
  const c = new THREE.SphereGeometry(0.012 * size, 8, 6);
  c.translate(0, 0.012 * size, 0);
  pet.push(paintVertices(c, () => new THREE.Color('#f2e070')));
  return merge(pet);
}

/** One cactus plant at the origin. Returns { geos, spinePts, tops:[{p,n}] }. */
function cactusPlant(variant, v, s, rand, seed, trim) {
  const geos = [];
  const spinePts = [];
  const tops = [];
  const color = trim === 'dry' ? new THREE.Color(v.color).lerp(new THREE.Color('#9a9a5a'), 0.5).getStyle() : v.color;
  const dry = trim === 'dry';
  const old = trim === 'old';
  const young = trim === 'young';
  const column = (pts, R, ribs, cork = 0) => {
    geos.push(ribbedColumn(pts, R, ribs, color, seed + geos.length, { dry, cork }));
    const curve = new THREE.CatmullRomCurve3(pts);
    const L = curve.getLength();
    for (let i = 0; i < Math.round(L * 60); i++) {
      const t = rand() * 0.9;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const ref = Math.abs(tan.y) > 0.9 ? new V3(1, 0, 0) : UP;
      const n0 = new V3().crossVectors(tan, ref).normalize();
      const a = ribs ? Math.floor(rand() * ribs) * ((Math.PI * 2) / ribs) : rand() * Math.PI * 2;
      const n = n0.clone().applyAxisAngle(tan, a);
      spinePts.push({ p: p.clone().addScaledVector(n, R * (1 + (ribs ? 0.09 : 0))), n });
    }
    tops.push({ p: pts.at(-1).clone(), n: curve.getTangentAt(1) });
  };
  switch (variant) {
    case 'saguaro': {
      const H = (young ? 1.0 : old ? 6.5 : 3.5 + rand() * 2.5) * s;
      const R = (young ? 0.16 : old ? 0.32 : 0.26) * s;
      const main = [];
      for (let i = 0; i <= 8; i++) main.push(new V3(Math.sin(i * 0.7 + seed) * 0.04, (i / 8) * H - 0.03, 0));
      column(main, R, v.ribs, old ? 0.12 : 0);
      const arms = young ? 0 : old ? 5 + Math.floor(rand() * 3) : 1 + Math.floor(rand() * 4);
      for (let k = 0; k < arms; k++) {
        const a = rand() * Math.PI * 2;
        const y = H * (0.3 + rand() * 0.35);
        const dir = new V3(Math.cos(a), 0, Math.sin(a));
        const out = (0.35 + rand() * 0.25) * s;
        const up = (0.8 + rand() * (old ? 1.6 : 1.0)) * s;
        column([new V3(dir.x * R * 0.3, y - 0.05, dir.z * R * 0.3), new V3(dir.x * out * 0.55, y - 0.02, dir.z * out * 0.55), new V3(dir.x * out * 0.92, y + 0.12, dir.z * out * 0.92), new V3(dir.x * out, y + 0.38, dir.z * out), new V3(dir.x * out, y + up * 0.7, dir.z * out), new V3(dir.x * out, y + up, dir.z * out)], R * 0.6, 10);
      }
      break;
    }
    case 'organ-pipe':
    case 'san-pedro': {
      const n = variant === 'organ-pipe' ? (young ? 3 : old ? 14 : 8) : (young ? 1 : old ? 7 : 4);
      const R = (variant === 'organ-pipe' ? 0.11 : 0.09) * s * (old ? 1.15 : 1);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + rand() * 0.5;
        const d = new V3(Math.cos(a), 0, Math.sin(a));
        const H = (young ? 0.7 : old ? 4.2 : 2.6) * s * (0.6 + rand() * 0.5);
        const off = k === 0 && variant === 'san-pedro' ? 0 : R * 1.2;
        column([d.clone().multiplyScalar(off * 0.3).setY(-0.02), d.clone().multiplyScalar(off + 0.12 * s).setY(0.25 * s), d.clone().multiplyScalar(off + 0.2 * s).setY(H * 0.5), d.clone().multiplyScalar(off + 0.22 * s).setY(H)], R, v.ribs, old ? 0.15 : 0);
      }
      break;
    }
    case 'old-man': {
      const H = (young ? 0.5 : old ? 3.5 : 1.8) * s;
      const n = young ? 1 : old ? 4 : 2;
      for (let k = 0; k < n; k++) {
        const a = rand() * 6.28;
        const off = k ? 0.22 * s : 0;
        column([new V3(Math.cos(a) * off, -0.02, Math.sin(a) * off), new V3(Math.cos(a) * off, H * (k ? 0.7 : 1) * 0.5, Math.sin(a) * off), new V3(Math.cos(a) * off, H * (k ? 0.7 : 1), Math.sin(a) * off)], 0.13 * s, v.ribs);
      }
      break;
    }
    case 'cholla': {
      // jointed stems: chains of short spiny segments branching
      const seg = (start, dir, depth) => {
        const len = (0.25 + rand() * 0.12) * s;
        const end = start.clone().addScaledVector(dir, len);
        column([start, start.clone().lerp(end, 0.5), end], 0.045 * s, 0);
        if (depth <= 0) return;
        const kids = 1 + (rand() < 0.6 ? 1 : 0);
        for (let k = 0; k < kids; k++) {
          const d2 = dir.clone().add(new V3((rand() - 0.5) * 1.2, 0.3 + rand() * 0.4, (rand() - 0.5) * 1.2)).normalize();
          seg(end.clone().addScaledVector(dir, -0.01), d2, depth - 1);
        }
      };
      const depth = young ? 2 : old ? 6 : 4;
      seg(new V3(0, -0.02, 0), UP.clone(), Math.max(1, Math.round(depth / 2)));
      seg(new V3(0.02, 0.3 * s, 0), new V3(0.4, 1, 0.2).normalize(), depth);
      seg(new V3(-0.02, 0.35 * s, 0), new V3(-0.5, 1, -0.3).normalize(), depth - 1);
      break;
    }
    case 'mammillaria': {
      // a clump of small globes
      const n = young ? 2 : old ? 14 : 7;
      for (let k = 0; k < n; k++) {
        const a = rand() * 6.28;
        const rr = k ? (0.06 + rand() * 0.1) * s * (old ? 1.5 : 1) : 0;
        const R = (k ? 0.04 + rand() * 0.03 : 0.07) * s;
        const g = new THREE.SphereGeometry(R, 20, 14);
        g.scale(1, 1.2, 1);
        g.translate(Math.cos(a) * rr, R * 1.1, Math.sin(a) * rr);
        // tubercles: little bumps in a spiral
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i) - Math.cos(a) * rr;
          const y = p.getY(i) - R * 1.1;
          const z = p.getZ(i) - Math.sin(a) * rr;
          const bump = 1 + 0.08 * Math.max(0, Math.sin(Math.atan2(z, x) * 13 + y / R * 8));
          p.setXYZ(i, x * bump + Math.cos(a) * rr, y * bump + R * 1.1, z * bump + Math.sin(a) * rr);
        }
        g.computeVertexNormals();
        geos.push(paintVertices(g, (vv) => new THREE.Color(color).multiplyScalar(0.85 + 0.2 * fbm(vv.x * 40, vv.y * 40, vv.z * 40, seed, 2))));
        for (let i = 0; i < 60; i++) {
          const d = new V3(rand() * 2 - 1, rand() * 1.2 - 0.1, rand() * 2 - 1).normalize();
          spinePts.push({ p: new V3(Math.cos(a) * rr, R * 1.1, Math.sin(a) * rr).addScaledVector(d, R * 1.08), n: d });
        }
        tops.push({ p: new V3(Math.cos(a) * rr, R * 2.15, Math.sin(a) * rr), n: UP.clone(), ring: R });
      }
      break;
    }
    case 'prickly-pear': {
      const pads = [];
      const make = (pos, ang, yaw, sc, depth) => {
        const g = blob(1, { detail: 3, seed: seed + pads.length, amount: 0.05 });
        g.scale(0.22 * sc, 0.3 * sc, (dry ? 0.03 : 0.045) * sc);
        g.translate(0, 0.28 * sc, 0);
        g.rotateZ(ang);
        g.rotateY(yaw);
        g.translate(pos.x, pos.y, pos.z);
        const base = new THREE.Color(color).multiplyScalar(0.85 + rand() * 0.25);
        paintVertices(g, (vv, n) => base.clone().multiplyScalar(0.75 + 0.3 * Math.abs(n.z)));
        geos.push(g);
        const tip = new V3(0, 0.56 * sc, 0).applyAxisAngle(new V3(0, 0, 1), ang).applyAxisAngle(UP, yaw).add(pos);
        pads.push({ pos, ang, yaw, s: sc, tip });
        tops.push({ p: tip.clone(), n: tip.clone().sub(pos).normalize() });
        if (depth > 0) {
          const kids = 1 + Math.floor(rand() * 2);
          for (let k = 0; k < kids; k++) make(tip.clone().add(new V3(0, -0.06 * sc, 0)), ang + (rand() - 0.5) * 1.2, yaw + (rand() - 0.5) * 1.0, sc * 0.88, depth - 1);
        }
      };
      const depth = young ? 0 : old ? 3 : 2;
      const roots = young ? 1 : old ? 5 : 3;
      for (let i = 0; i < roots; i++) make(new V3((rand() - 0.5) * 0.3 * s, -0.02, (rand() - 0.5) * 0.3 * s), (rand() - 0.5) * 0.6, rand() * 6.28, s, depth);
      for (const pd of pads) for (let k = 0; k < 10; k++) {
        const side = rand() < 0.5 ? 1 : -1;
        const pp = new V3((rand() - 0.5) * 0.3 * pd.s, 0.08 + rand() * 0.42 * pd.s, side * 0.045 * pd.s).applyAxisAngle(new V3(0, 0, 1), pd.ang).applyAxisAngle(UP, pd.yaw).add(pd.pos);
        spinePts.push({ p: pp, n: new V3(0, 0, side).applyAxisAngle(UP, pd.yaw) });
      }
      break;
    }
    default: { // barrel / golden-barrel
      const R = (young ? 0.15 : old ? 0.5 : 0.32 + rand() * 0.12) * s;
      const ribs = v.ribs;
      const g = new THREE.SphereGeometry(R, ribs * 4, 24);
      const p = g.attributes.position;
      const tall = old ? 1.6 : 1.15;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const z = p.getZ(i);
        const y = p.getY(i);
        const k = 1 + (dry ? 0.14 : 0.08) * Math.cos(Math.atan2(z, x) * ribs);
        p.setXYZ(i, x * k, y * tall + R * tall * 0.92, z * k);
      }
      g.computeVertexNormals();
      const base = new THREE.Color(color);
      paintVertices(g, (vv) => base.clone().multiplyScalar(0.72 + 0.28 * (0.5 + 0.5 * Math.cos(Math.atan2(vv.z, vv.x) * ribs))));
      geos.push(g);
      for (let i = 0; i < (v.dense ? 700 : 300) * (young ? 0.4 : 1); i++) {
        const a = Math.floor(rand() * ribs) * ((Math.PI * 2) / ribs);
        const phi = 0.15 + rand() * 2.4;
        const n = new V3(Math.cos(a) * Math.sin(phi), Math.cos(phi) * tall, Math.sin(a) * Math.sin(phi)).normalize();
        spinePts.push({ p: new V3(Math.cos(a) * Math.sin(phi) * R * 1.08, Math.cos(phi) * R * tall + R * tall * 0.92, Math.sin(a) * Math.sin(phi) * R * 1.08), n });
      }
      tops.push({ p: new V3(0, R * tall * 1.9, 0), n: UP.clone(), ring: R * 0.35 });
    }
  }
  return { geos, spinePts, tops };
}

export function createCactus(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('cactus', CACTUS_VARIANTS, CACTUS_TRIMS, o.variant, o.trim);
  const v = { ...CACTUS_VARIANTS[variant], ...(o.color ? { color: o.color } : {}) };
  const trim = o.trim ?? null;
  const seed = seedOf(o, 11 + variant.length);
  const rand = rng(seed * 104729 + 3);
  const root = group(`cactus-${variant}${trim ? `-${trim}` : ''}`);
  const body = group('sway', { parent: root });
  const plants = [{ x: 0, z: 0, s: 1 }];
  if (trim === 'cluster') for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + rand(); plants.push({ x: Math.cos(a) * (0.5 + rand() * 0.3), z: Math.sin(a) * (0.5 + rand() * 0.3), s: 0.35 + rand() * 0.25 }); }
  const geos = [];
  const spinePts = [];
  const tops = [];
  for (const pl of plants) {
    const r = cactusPlant(variant, v, pl.s, rand, seed + geos.length, pl.s < 1 ? 'young' : trim);
    for (const g of r.geos) { g.translate(pl.x, 0, pl.z); geos.push(g); }
    for (const sp of r.spinePts) { sp.p.x += pl.x; sp.p.z += pl.z; spinePts.push(sp); }
    for (const t of r.tops) { t.p.x += pl.x; t.p.z += pl.z; tops.push(t); }
  }
  const bodyGeo = merge(geos);
  if (trim === 'snow') {
    const col = bodyGeo.attributes.color;
    const n = bodyGeo.attributes.normal;
    for (let i = 0; i < col.count; i++) if (n.getY(i) > 0.55) col.setXYZ(i, 0.95, 0.96, 0.98);
  }
  mesh(bodyGeo, vcMat(0.6), { parent: body, name: 'body' });
  body.add(spinesMesh(spinePts, { rand, color: v.spine ?? (v.hair ? '#f4f2ee' : '#efe6c8'), len: v.hair ? 0.06 : 0.03 }));
  if (v.hair && trim !== 'young') {
    // the "old man" cactus: shaggy white hair
    const hairItems = spinePts.filter(() => rand() < 0.8).map(({ p, n }) => ({ p, q: new THREE.Quaternion().setFromUnitVectors(UP, n.clone().add(new V3(0, -0.8, 0)).normalize()), s: new V3(1, 1.5 + rand(), 1) }));
    const hg = new THREE.CylinderGeometry(0.003, 0.001, 0.07, 3);
    hg.translate(0, 0.035, 0);
    body.add(instanced(hg, new THREE.MeshStandardMaterial({ color: '#f6f4f0', roughness: 0.9 }), hairItems, 'hair'));
  }
  if (trim === 'flowering' || trim === 'fruiting') {
    const fl = [];
    for (const t of tops) {
      const count = t.ring ? 6 : variant === 'saguaro' || variant.includes('pipe') || variant === 'san-pedro' ? 4 : 1;
      for (let k = 0; k < count; k++) {
        let g;
        if (trim === 'flowering') g = cactusFlower(v.flower, variant === 'san-pedro' ? 2.2 : variant === 'mammillaria' ? 0.5 : 1);
        else { g = new THREE.SphereGeometry(variant === 'mammillaria' ? 0.008 : 0.03, 8, 6); g.scale(1, 1.4, 1); paintVertices(g, () => new THREE.Color(v.fruit)); }
        const a = (k / count) * Math.PI * 2;
        const rr = t.ring ?? (count > 1 ? 0.08 : 0);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, t.n.clone().lerp(new V3(Math.cos(a), 0.5, Math.sin(a)).normalize(), count > 1 ? 0.4 : 0).normalize()));
        g.translate(t.p.x + Math.cos(a) * rr, t.p.y - 0.01 - (t.ring ? t.ring * 0.15 : 0), t.p.z + Math.sin(a) * rr);
        fl.push(g);
      }
    }
    mesh(merge(fl), vcMat(0.5, THREE.DoubleSide), { parent: body, name: trim === 'flowering' ? 'flowers' : 'fruit' });
  }
  if (trim === 'snow') mesh(snowMound(0.7, seed), vcMat(0.85), { parent: root, name: 'snow' });
  return finalize(root, { type: 'cactus', variant, options: o, animations: [] });
}

/* ================================ Succulents ================================ */

/*
 * Rosette succulents and friends: thick fleshy leaves in a golden-angle spiral.
 * agave (big, toothed, grey-blue), aloe (spotted, toothed), echeveria (tight
 * pastel rosette), haworthia (striped), sempervivum (hen & chicks), yucca
 * (trunk + spiky head), jade (woody shrub with paddle leaves), sedum (mat).
 */
export const SUCCULENT_VARIANTS = {
  agave: { kind: 'rosette', n: 28, len: 0.75, wid: 0.12, thick: 0.035, up: [0.3, 1.3], color: '#7a9a9a', tip: '#5a6a5a', teeth: true, flower: '#e8c84a' },
  aloe: { kind: 'rosette', n: 18, len: 0.45, wid: 0.07, thick: 0.03, up: [0.35, 1.2], color: '#5a8a4a', tip: '#8a5a3a', teeth: true, spots: true, flower: '#f0702a' },
  echeveria: { kind: 'rosette', n: 34, len: 0.08, wid: 0.04, thick: 0.014, up: [0.15, 1.1], color: '#9ab0b0', tip: '#c87a9a', flower: '#f08a5a' },
  haworthia: { kind: 'rosette', n: 22, len: 0.07, wid: 0.018, thick: 0.01, up: [0.4, 1.0], color: '#3a6a3a', tip: '#3a5a2a', stripes: true, flower: '#f4f0e6' },
  sempervivum: { kind: 'rosette', n: 30, len: 0.045, wid: 0.018, thick: 0.008, up: [0.25, 1.2], color: '#6a8a4a', tip: '#a03a4a', chicks: true, flower: '#e86a9a' },
  yucca: { kind: 'yucca', color: '#4a7a4a', tip: '#7a8a4a', flower: '#f6f2e6' },
  jade: { kind: 'jade', color: '#4a7a3a', tip: '#a84a3a', flower: '#f4dce4' },
  sedum: { kind: 'mat', color: '#7a9a4a', tip: '#a8b05a', flower: '#f2d02e' },
};
export const SUCCULENT_TRIMS = Object.fromEntries(Object.keys(SUCCULENT_VARIANTS).map((k) => [k, ['small', 'large', 'flowering', 'cluster', 'potted', 'dry']]));

function fleshyLeaf(len, wid, thick, color, tipColor, { teeth = false, spots = false, stripes = false, curl = 0.2 } = {}) {
  const pts = [];
  for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push(new V3(0, t * len, curl * len * t * t)); }
  const g = sweep(pts, (t, a) => {
    const w = wid * Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)) * (1 - t * 0.35);
    const th = thick * (1 - t * 0.6);
    let r = 1 / Math.sqrt(Math.pow(Math.cos(a) / Math.max(1e-4, w), 2) + Math.pow(Math.sin(a) / Math.max(1e-4, th), 2));
    if (teeth && Math.abs(Math.sin(a)) < 0.2) r *= 1 + 0.25 * Math.max(0, Math.sin(t * 60));
    return r;
  }, { radial: 10, segments: 10 });
  const c0 = new THREE.Color(color);
  const c1 = new THREE.Color(tipColor);
  return paintVertices(g, (v) => {
    const t = THREE.MathUtils.clamp(v.y / len, 0, 1);
    const c = c0.clone().lerp(c1, Math.pow(t, 4));
    if (spots && fbm(v.x * 200, v.y * 120, v.z * 200, 3, 1) > 0.25) c.lerp(new THREE.Color('#d8e0c8'), 0.6);
    if (stripes && Math.sin(v.y * 600) > 0.6) c.lerp(new THREE.Color('#f0f2ea'), 0.75);
    return c;
  });
}

function rosette(v, s, rand, cols, opts = {}) {
  const parts = [];
  const n = Math.round(v.n * (opts.n ?? 1));
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const len = v.len * s * (0.45 + 0.55 * Math.pow(1 - t, 0.7) * (0.9 + rand() * 0.2)) * (opts.dry ? 0.85 : 1);
    const g = fleshyLeaf(len, v.wid * s * (0.6 + 0.4 * (1 - t)), v.thick * s, cols.color, cols.tip, { teeth: v.teeth, spots: v.spots, stripes: v.stripes, curl: opts.dry ? 0.5 : 0.15 });
    // outer leaves splay out, inner ones stand up
    g.rotateX(v.up[1] - (v.up[1] - v.up[0]) * t + (opts.dry ? 0.35 : 0));
    g.rotateY(i * 2.39996);
    parts.push(g);
  }
  return merge(parts);
}

export function createSucculent(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('succulent', SUCCULENT_VARIANTS, SUCCULENT_TRIMS, o.variant, o.trim);
  const v = SUCCULENT_VARIANTS[variant];
  const trim = o.trim ?? null;
  const seed = seedOf(o, 13 + variant.length);
  const rand = rng(seed * 31 + 7);
  const root = group(`succulent-${variant}${trim ? `-${trim}` : ''}`);
  const sway = group('sway', { parent: root });
  const s = trim === 'small' ? 0.5 : trim === 'large' ? 1.8 : 1;
  const dry = trim === 'dry';
  const cols = { color: o.color ?? (dry ? new THREE.Color(v.color).lerp(new THREE.Color('#a89a5a'), 0.5).getStyle() : v.color), tip: dry ? '#6a4a2a' : v.tip };
  const potH = trim === 'potted' ? 0.18 * Math.max(1, s) * (variant === 'agave' || variant === 'yucca' ? 2.2 : 1) : 0;
  const lift = potH * 0.88;
  const parts = [];
  const flowerAt = [];
  if (v.kind === 'rosette') {
    const spots = [{ x: 0, z: 0, k: 1 }];
    if (trim === 'cluster' || v.chicks) {
      const n = trim === 'cluster' ? 6 : 4;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rand(); spots.push({ x: Math.cos(a) * v.len * s * 1.1, z: Math.sin(a) * v.len * s * 1.1, k: 0.45 + rand() * 0.25 }); }
    }
    for (const sp of spots) {
      const g = rosette(v, s * sp.k, rand, cols, { dry });
      g.translate(sp.x, lift, sp.z);
      parts.push(g);
      if (v.chicks && sp.k < 1) parts.push(paintVertices(sweep([new V3(0, lift + 0.005, 0), new V3(sp.x * 0.5, lift + 0.01, sp.z * 0.5), new V3(sp.x, lift, sp.z)], () => 0.003, { radial: 4, segments: 4 }), () => new THREE.Color('#8a6a4a')));
      flowerAt.push(new V3(sp.x, lift, sp.z));
    }
  } else if (v.kind === 'yucca') {
    const H = 1.4 * s;
    const trunks = trim === 'cluster' ? 3 : 1;
    for (let k = 0; k < trunks; k++) {
      const a = rand() * 6.28;
      const off = k ? 0.3 * s : 0;
      const h = H * (k ? 0.65 : 1);
      const base = new V3(Math.cos(a) * off, lift - 0.02, Math.sin(a) * off);
      const top = base.clone().add(new V3((rand() - 0.5) * 0.2, h, (rand() - 0.5) * 0.2));
      parts.push(paintVertices(sweep([base, base.clone().lerp(top, 0.5), top], (t) => 0.07 * s * (1 - t * 0.3), { radial: 10, segments: 8 }), (p) => new THREE.Color('#6a5a44').multiplyScalar(0.75 + 0.4 * fbm(p.x * 30, p.y * 20, p.z * 30, seed, 2))));
      const leaves = [];
      for (let i = 0; i < 46; i++) {
        const phi = Math.acos(1 - ((i + 0.5) / 46) * 1.5);
        const th = i * 2.39996;
        const d = new V3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
        const g = fleshyLeaf(0.6 * s, 0.025 * s, 0.006 * s, cols.color, cols.tip, { curl: 0.05 });
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d));
        leaves.push(g);
      }
      if (dry) for (let i = 0; i < 20; i++) { const g = fleshyLeaf(0.5 * s, 0.02 * s, 0.004, '#a8946a', '#8a7a5a'); g.rotateX(2.6); g.rotateY(rand() * 6.28); leaves.push(g); }
      const lg = merge(leaves);
      lg.translate(top.x, top.y, top.z);
      parts.push(lg);
      flowerAt.push(top);
    }
  } else if (v.kind === 'jade') {
    // woody bonsai-like shrub with fat paddle leaves on the branch tips
    const tips = [];
    const br = (start, dir, len, r, depth) => {
      const end = start.clone().addScaledVector(dir, len);
      parts.push(paintVertices(sweep([start, start.clone().lerp(end, 0.5).add(new V3((rand() - 0.5) * 0.02, 0, 0)), end], (t) => r * (1 - t * 0.35), { radial: 8, segments: 5 }), (p) => new THREE.Color('#7a6a50').lerp(new THREE.Color('#6a8a4a'), depth < 1 ? 0.6 : 0).multiplyScalar(0.8 + 0.3 * fbm(p.x * 40, p.y * 40, p.z * 40, seed, 2))));
      if (depth === 0) { tips.push({ p: end, d: dir }); return; }
      for (let k = 0; k < 2 + (rand() < 0.4 ? 1 : 0); k++) br(end, dir.clone().add(new V3((rand() - 0.5) * 1.3, 0.35, (rand() - 0.5) * 1.3)).normalize(), len * 0.72, r * 0.68, depth - 1);
    };
    br(new V3(0, lift - 0.02, 0), UP.clone(), 0.22 * s, 0.035 * s, trim === 'small' ? 2 : 3);
    for (const t of tips) {
      for (let i = 0; i < 6; i++) {
        const g = new THREE.SphereGeometry(0.022 * s, 10, 8);
        g.scale(1, 1.4, 0.45);
        g.translate(0, 0.028 * s, 0);
        g.rotateX(0.5 + rand() * 0.4);
        g.rotateY(i * 1.1 + rand());
        g.translate(t.p.x, t.p.y, t.p.z);
        parts.push(paintVertices(g, (p) => new THREE.Color(cols.color).lerp(new THREE.Color(cols.tip), THREE.MathUtils.smoothstep(Math.abs(p.y - t.p.y) / (0.06 * s), 0.6, 1))));
      }
      flowerAt.push(t.p.clone());
    }
  } else {
    // sedum mat: hundreds of tiny rosettes hugging the ground
    const items = [];
    const R = 0.35 * s;
    const n = Math.round(240 * s);
    for (let i = 0; i < n; i++) {
      const a = rand() * 6.28;
      const r = Math.sqrt(rand()) * R;
      items.push({ p: new V3(Math.cos(a) * r, lift + 0.012, Math.sin(a) * r), s: new V3(1, 0.8, 1).multiplyScalar(0.7 + rand() * 0.6), c: rand() < 0.3 ? cols.tip : cols.color });
      if (i % 30 === 0) flowerAt.push(items.at(-1).p.clone());
    }
    const tiny = rosette({ ...SUCCULENT_VARIANTS.echeveria, n: 8, len: 0.025, wid: 0.01, thick: 0.005 }, 1, rand, { color: '#ffffff', tip: '#ffffff' });
    sway.add(instanced(tiny, vcMat(0.6), items, 'sedum'));
    const base = blob(R * 1.02, { detail: 3, seed, amount: 0.15, scale: [1, 0.06, 1] });
    base.translate(0, lift, 0);
    const bp = base.attributes.position;
    for (let i = 0; i < bp.count; i++) if (bp.getY(i) < lift) bp.setY(i, lift);
    base.computeVertexNormals();
    parts.push(paintVertices(base, () => new THREE.Color(cols.color).multiplyScalar(0.6)));
  }
  if (trim === 'flowering') {
    const fl = [];
    for (const at of flowerAt.slice(0, variant === 'sedum' ? 12 : 4)) {
      if (variant === 'agave') {
        // century plant: a single huge bloom stalk with candelabra branches
        const H = 4 * s;
        fl.push(paintVertices(sweep([at, at.clone().add(new V3(0.05, H * 0.5, 0)), at.clone().add(new V3(0.1, H, 0))], (t) => 0.06 * s * (1 - t * 0.7), { radial: 8, segments: 10 }), () => new THREE.Color('#7a8a4a')));
        for (let k = 0; k < 10; k++) {
          const y = H * (0.55 + k * 0.045);
          const a = k * 2.39996;
          const st = at.clone().add(new V3(0.05 + 0.05 * (y / H), y, 0));
          const en = st.clone().add(new V3(Math.cos(a) * 0.35 * s, 0.12 * s, Math.sin(a) * 0.35 * s));
          fl.push(paintVertices(sweep([st, en], () => 0.012 * s, { radial: 5, segments: 2 }), () => new THREE.Color('#7a8a4a')));
          const head = blob(0.09 * s, { detail: 2, seed: k, amount: 0.3, scale: [1, 0.6, 1] });
          head.translate(en.x, en.y + 0.03, en.z);
          fl.push(paintVertices(head, () => new THREE.Color(v.flower)));
        }
      } else if (variant === 'yucca') {
        const top = at.clone().add(new V3(0, 0.25 * s, 0));
        fl.push(paintVertices(sweep([at, top.clone().add(new V3(0, 0.6 * s, 0))], () => 0.015 * s, { radial: 5, segments: 3 }), () => new THREE.Color('#7a8a4a')));
        const pan = blob(0.16 * s, { detail: 2, seed, amount: 0.35, freq: 4, scale: [1, 2.4, 1] });
        pan.translate(top.x, top.y + 0.45 * s, top.z);
        fl.push(paintVertices(pan, () => new THREE.Color(v.flower)));
      } else {
        // slender arching stalks carrying small flowers
        const h = (variant === 'aloe' ? 0.7 : variant === 'sedum' ? 0.08 : 0.25) * s;
        for (let k = 0; k < (variant === 'aloe' ? 2 : 1); k++) {
          const a = rand() * 6.28;
          const tp = at.clone().add(new V3(Math.cos(a) * h * 0.3, h, Math.sin(a) * h * 0.3));
          fl.push(paintVertices(sweep([at, at.clone().lerp(tp, 0.5).add(new V3(0, h * 0.1, 0)), tp], () => 0.004 * Math.max(1, s), { radial: 4, segments: 6 }), () => new THREE.Color('#8a7a5a')));
          if (variant === 'aloe') {
            const sp = new THREE.ConeGeometry(0.035 * s, 0.22 * s, 10);
            sp.translate(tp.x, tp.y + 0.08 * s, tp.z);
            fl.push(paintVertices(sp, (p) => new THREE.Color(v.flower).lerp(new THREE.Color('#f2d03a'), Math.max(0, (p.y - tp.y) / (0.2 * s)))));
          } else {
            const head = blob((variant === 'sedum' ? 0.03 : 0.02) * s, { detail: 2, seed: k, amount: 0.3, scale: [1, 0.6, 1] });
            head.translate(tp.x, tp.y + 0.01, tp.z);
            fl.push(paintVertices(head, () => new THREE.Color(v.flower)));
          }
        }
      }
    }
    if (fl.length) parts.push(...fl);
  }
  if (parts.length) {
    const pg = merge(parts);
    const pp = pg.attributes.position;
    for (let i = 0; i < pp.count; i++) if (pp.getY(i) < lift - 0.01) pp.setY(i, lift - 0.01); // splayed leaves rest on the ground/soil
    pg.computeVertexNormals();
    mesh(pg, vcMat(0.55, THREE.DoubleSide), { parent: sway, name: 'plant' });
  }
  if (potH) {
    const pr = Math.max(0.12, (variant === 'sedum' ? 0.38 : v.len ?? 0.3) * s * 0.75);
    mesh(potGeometry(pr, potH, variant === 'echeveria' || variant === 'haworthia' ? '#d8d0c4' : '#b5653a'), vcMat(0.7), { parent: root, name: 'pot' });
    const soil = new THREE.CircleGeometry(pr * 0.92, 24);
    soil.rotateX(-Math.PI / 2);
    soil.translate(0, lift - 0.005, 0);
    mesh(paintVertices(soil, () => new THREE.Color('#6a5040')), vcMat(1), { parent: root, name: 'soil' });
  }
  const animations = [clip('sway', 3, [rotateTrack(sway, new V3(1, 0, 0.5), 3, (t) => wave(t) * 0.006)])];
  return finalize(root, { type: 'succulent', variant, options: o, animations });
}
