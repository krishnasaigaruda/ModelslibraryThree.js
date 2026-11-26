import * as THREE from 'three';
import { group, mesh, rng, finalize, normalizeOptions } from '../../core/utils.js';
import { rotateTrack, moveTrack, clip, wave } from '../../core/animation.js';
import { sweep, merge, paintVertices, barkColor, barkMaterial, leafCards, leafTexture, clumps, blob, fbm, sprigTexture, strandTexture, sprayGeometry, cardMaterial, snowify, snowMound, leafLitter } from './common.js';
import { SPECIES } from './species.js';

const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0);

/*
 * Trees are grown, not placed: a recursive branching system with gnarl,
 * phototropism, gravity (droop) and wind, swept into tapered tubes with a
 * root flare and merged into one bark mesh. Foliage = dark inner clumps
 * (always) + alpha-tested leaf cards in real leaf shapes (browser).
 * Every species has a botanically tuned silhouette; every trim (season, age,
 * shape) changes the geometry. Every seed gives a different tree.
 */

export const TREE_VARIANTS = SPECIES;

const T = {
  deciduous: ['sapling', 'young', 'ancient', 'spring', 'autumn', 'winter', 'snow', 'windswept', 'pollarded', 'ivy'],
  blossom: ['sapling', 'young', 'ancient', 'summer', 'autumn', 'winter', 'snow', 'windswept', 'ivy'],
  fruit: ['sapling', 'young', 'ancient', 'blossom', 'autumn', 'winter', 'snow', 'windswept', 'pruned', 'harvested'],
  evergreen: ['sapling', 'young', 'ancient', 'flowering', 'windswept', 'snow', 'pruned', 'dry'],
  dead: ['young', 'snag', 'burnt', 'mossy', 'snow', 'hollow'],
  conifer: ['sapling', 'young', 'ancient', 'snow', 'windswept', 'dying', 'broken'],
  larch: ['sapling', 'young', 'ancient', 'spring', 'autumn', 'winter', 'snow', 'windswept', 'dying', 'broken'],
  palm: ['sapling', 'young', 'tall', 'windswept', 'fruiting', 'dry', 'twin'],
  willow: ['sapling', 'young', 'ancient', 'spring', 'autumn', 'winter', 'snow', 'windswept'],
  bamboo: ['young', 'grove', 'thin', 'giant', 'snow', 'golden'],
  baobab: ['sapling', 'young', 'ancient', 'leafy', 'flowering', 'fruiting'],
  desert: ['sapling', 'young', 'ancient', 'flowering', 'snow', 'clump'],
  fern: ['young', 'tall', 'ancient', 'unfurling', 'dry'],
  banana: ['young', 'fruiting', 'tattered', 'dry', 'clump'],
};
/** Trims per species (variant). */
export const TREE_TRIMS = Object.fromEntries(Object.entries(SPECIES).map(([k, s]) => [k, T[s.group]]));

const DRY = ['#9a7a3a', '#8a6a32', '#a88a48', '#7a6a3a'];
const DYING = ['#8a6a3a', '#a0783e', '#6e5a2e', '#2f4a2a', '#3a5230'];
const lighten = (cols, k = 0.35) => cols.map((c) => `#${new THREE.Color(c).lerp(new THREE.Color('#c8e88a'), k).getHexString()}`);

/** Turn species + trim into a build config + flags. */
function resolve(sp, trim) {
  const c = { ...sp };
  const f = { leaves: !sp.noLeaves, snow: false, litter: false, stake: false, ivy: false, fruit: !!sp.fruit, flowers: sp.treeFlowers ?? null, dens: sp.dense ? 1.3 : sp.sparse === true ? 0.6 : 1, wind: null, falling: !!sp.falling, stubs: false, pruned: false, broken: false, hollow: false };
  const scale = (h, r, len, depthDrop, fol) => {
    c.trunkH = (c.trunkH ?? 3) * h;
    c.trunkR = (c.trunkR ?? 0.2) * r;
    if (c.firstLen) c.firstLen *= len;
    if (c.depth) c.depth = Math.max(2, c.depth - depthDrop);
    if (c.foliageR) c.foliageR *= fol;
    if (c.size) c.size *= Math.max(0.6, fol);
  };
  switch (trim) {
    case 'sapling':
      // a nursery whip: thin straight stem, a few short twiggy branches, sparse leaves, staked
      scale(0.55, 0.16, 0.22, 2, 0.35);
      c.depth = 2;
      c.children = 2;
      c.childVar = 1;
      c.gnarl = (c.gnarl ?? 0.3) * 0.5;
      c.up = (c.up ?? 0.4) + 0.4;
      c.crownT = 0.45;
      c.layered = false;
      c.umbrella = 0;
      if (c.size) c.size *= 0.55;
      f.dens = 0.4;
      c.stems = 1;
      c.forks = 0;
      f.stake = true;
      f.fruit = false;
      f.flowers = null;
      f.falling = false;
      break;
    case 'young':
      // narrower and more upright than a mature crown
      scale(0.7, 0.4, 0.55, 1, 0.65);
      c.spread = (c.spread ?? 0.6) * 0.7;
      c.up = (c.up ?? 0.4) + 0.35;
      c.forks = 0;
      if (sp.group === 'fruit') f.fruit = false;
      break;
    case 'ancient':
      scale(1.12, 1.75, 1.25, 0, 1.1);
      c.gnarl = (c.gnarl ?? 0.3) * 1.4;
      c.ridges = (c.ridges ?? 0.03) * 1.8 + 0.03;
      c.flare = 1.2;
      c.spread = (c.spread ?? 0.6) * 1.2;
      c.up = (c.up ?? 0.4) * 0.6;
      f.stubs = true;
      f.dens *= 0.8;
      break;
    case 'spring':
      c.colors = sp.spring ?? lighten(sp.colors);
      if (c.foliageR) c.foliageR *= 0.82;
      f.dens *= 0.75;
      if (sp.springFlowers) f.flowers = sp.springFlowers;
      break;
    case 'summer':
      c.colors = sp.summer ?? sp.colors;
      c.leaf = sp.summerLeaf ?? 'broad';
      f.flowers = null;
      f.falling = false;
      break;
    case 'blossom':
      c.colors = sp.blossom ?? ['#fbe8ee', '#ffffff'];
      c.leaf = 'blossom';
      f.fruit = false;
      f.falling = true;
      break;
    case 'autumn':
      c.colors = sp.autumn ?? ['#c0862a', '#b0702a', '#d09a3a'];
      if (sp.summerLeaf) c.leaf = sp.summerLeaf;
      f.flowers = null;
      f.dens *= 0.5;
      f.litter = true;
      f.falling = true;
      break;
    case 'winter':
      f.leaves = false;
      f.flowers = null;
      f.falling = false;
      if (sp.group !== 'fruit' || !sp.fruit?.cluster) f.fruit = false;
      break;
    case 'snow':
      if (sp.group !== 'evergreen' && sp.group !== 'conifer' && sp.group !== 'desert' && sp.group !== 'bamboo') f.leaves = false;
      f.flowers = null;
      f.falling = false;
      f.snow = true;
      if (sp.group !== 'fruit' || !sp.fruit?.cluster) f.fruit = false;
      break;
    case 'windswept':
      f.wind = new V3(1, 0, 0.25).normalize();
      if (c.gnarl) c.gnarl *= 1.15;
      break;
    case 'pollarded':
      c.firstLen = (c.firstLen ?? 2) * 0.42;
      c.depth = Math.max(2, (c.depth ?? 4) - 1);
      c.children = (c.children ?? 3) + 2;
      c.spread = (c.spread ?? 0.6) * 0.45;
      c.up = 1.3;
      c.forks = 4;
      c.forkSpread = 0.35;
      c.trunkR = (c.trunkR ?? 0.3) * 1.25;
      c.ridges = (c.ridges ?? 0.03) + 0.04;
      if (c.foliageR) c.foliageR *= 0.7;
      break;
    case 'ivy':
      f.ivy = true;
      f.dens *= 0.8;
      break;
    case 'pruned':
      f.pruned = true;
      c.firstLen = (c.firstLen ?? 1.4) * 0.75;
      f.dens *= 1.25;
      break;
    case 'harvested':
      f.fruit = false;
      break;
    case 'flowering':
      f.flowers = 'small';
      break;
    case 'dry':
      if (sp.kind === 'palm' || sp.kind === 'treefern' || sp.kind === 'banana') break; // these add dead fronds instead
      c.colors = DRY;
      f.dens *= 0.5;
      f.litter = true;
      f.fruit = false;
      break;
    case 'snag':
      // standing dead trunk: weathered silver-grey, snapped top, a few broken limbs
      c.depth = 2;
      c.firstLen = (c.firstLen ?? 1.8) * 0.5;
      c.children = 1;
      c.bark = '#9a958c';
      c.barkStyle = 'fibrous';
      f.broken = true;
      f.stubs = true;
      break;
    case 'burnt':
      c.bark = '#1f1c1a';
      c.barkStyle = 'plates';
      c.depth = Math.max(2, (c.depth ?? 5) - 1);
      break;
    case 'mossy':
      f.moss = true;
      break;
    case 'hollow':
      f.hollow = true;
      c.trunkR = (c.trunkR ?? 0.3) * 1.3;
      break;
    case 'dying':
      c.colors = DYING;
      f.dens = 0.55;
      break;
    case 'broken':
      f.broken = true;
      break;
    case 'tall':
      c.trunkH = (c.trunkH ?? 6) * 1.5;
      break;
    case 'fruiting':
      f.fruit = true;
      break;
    case 'twin':
    case 'clump':
      c.twin = true;
      break;
    case 'leafy':
      f.dens = 1.4;
      break;
    case 'grove':
    case 'thin':
    case 'giant':
    case 'golden':
    case 'unfurling':
    case 'tattered':
      break;
    default:
      break;
  }
  f.trim = trim;
  return { c, f };
}

function perpendicular(d) {
  const a = Math.abs(d.y) < 0.9 ? UP : new V3(1, 0, 0);
  return new V3().crossVectors(d, a).normalize();
}

/** Grow a branching skeleton. Returns { geos (bark), tips:[{p,dir,r}], mids, top }. */
function grow(cfg, rand, { origin = new V3(), tilt = new V3(0, 1, 0), wind = null, hollow = false, broken = false, stubs = false } = {}) {
  const geos = [];
  const tips = [];
  const mids = [];
  const radial = [14, 8, 5, 4, 3, 3];
  const droop = cfg.droop ?? 0;
  const ridges = cfg.ridges ?? 0;
  function branch(start, dir, len, r0, depth, level) {
    const n = Math.max(3, Math.round(len * 2.5) + 2);
    const pts = [start.clone()];
    let p = start.clone();
    const d = dir.clone();
    for (let i = 1; i <= n; i++) {
      d.x += (rand() - 0.5) * cfg.gnarl;
      d.z += (rand() - 0.5) * cfg.gnarl;
      d.y += (rand() - 0.5) * cfg.gnarl * 0.5 + cfg.up * 0.12 * (level > 0 ? 1 : 0.3);
      if (droop && level >= 2) d.y -= droop * 0.14 * (i / n);
      if (wind) d.addScaledVector(wind, 0.07 * level);
      if (p.y < cfg.trunkH * 0.6 && d.y < 0.15) d.y += 0.25;
      d.normalize();
      p = p.clone().addScaledVector(d, len / n);
      pts.push(p);
    }
    const r1 = Math.max(0.006, r0 * (depth === 0 ? 0.35 : 0.62));
    const g = sweep(pts, (t) => r0 + (r1 - r0) * Math.pow(t, 0.8), { radial: radial[level] ?? 3, segments: level >= 2 ? n : n * 2, closeEnd: level >= 2, uvScale: Math.max(1, len / (Math.PI * 2 * Math.max(r0, 0.03)) / 2) });
    geos.push(g);
    if (level >= 1) mids.push(pts[Math.floor(pts.length * 0.6)]);
    if (depth === 0) {
      tips.push({ p, dir: d.clone(), r: r1 });
      return;
    }
    const kids = cfg.children + Math.floor(rand() * (cfg.childVar + 1));
    const curve = new THREE.CatmullRomCurve3(pts);
    let az = rand() * Math.PI * 2;
    for (let k = 0; k < kids; k++) {
      const t = 0.3 + 0.7 * ((k + rand() * 0.6) / kids);
      const at = curve.getPointAt(Math.min(1, t));
      const tan = curve.getTangentAt(Math.min(1, t));
      az += 2.39996; // golden angle phyllotaxis
      const perp = perpendicular(tan).applyAxisAngle(tan, az);
      const spread = cfg.spread * (0.75 + rand() * 0.5);
      const cd = tan.clone().applyAxisAngle(perp, spread).normalize();
      const rAt = r0 + (r1 - r0) * t;
      branch(at, cd, len * cfg.lenRatio * (0.8 + rand() * 0.4), rAt * cfg.radiusRatio, depth - 1, level + 1);
    }
    if (level < 2) branch(p, d.clone().lerp(UP, 0.3).normalize(), len * cfg.lenRatio * 0.9, r1, depth - 1, level + 1);
  }
  // trunk
  const trunkDir = tilt.clone().add(new V3((rand() - 0.5) * 0.12, 0, (rand() - 0.5) * 0.12)).normalize();
  const trunkLen = cfg.trunkH * (0.85 + rand() * 0.3) * (broken ? 1.25 : 1);
  const trunkPts = [origin.clone().add(new V3(0, -0.08, 0))];
  const d = trunkDir.clone();
  let p = trunkPts[0].clone();
  for (let i = 1; i <= 6; i++) {
    d.x += (rand() - 0.5) * cfg.gnarl * 0.4;
    d.z += (rand() - 0.5) * cfg.gnarl * 0.4;
    if (wind) d.addScaledVector(wind, 0.05 * i);
    d.normalize();
    p = p.clone().addScaledVector(d, trunkLen / 6);
    trunkPts.push(p);
  }
  const r0 = cfg.trunkR;
  const rTop = r0 * (cfg.bottle ? 0.55 : 0.7);
  const flare = cfg.flare ?? 0.6;
  const twist = cfg.twist ?? 0;
  const trunk = sweep(trunkPts, (t, a) => {
    let r = r0 + (rTop - r0) * t;
    if (cfg.bottle) r = r0 * (1 - 0.12 * t - 0.35 * Math.pow(t, 3));
    r *= 1 + flare * Math.pow(Math.max(0, 1 - t * 4), 2) * (1 + 0.45 * Math.cos(a * 5 + twist * t * 6));
    if (ridges) r *= 1 + ridges * (Math.cos(a * 9 + twist * t * 10 + fbm(t * 4, a, 0, 3, 2) * 2) * 0.5 + 0.5) - ridges * 0.5;
    if (hollow && t > 0.02 && t < 0.42 && Math.cos(a) > 0.45) r *= 0.45;
    return r;
  }, { radial: 18, segments: 22, uvScale: trunkLen / (Math.PI * 2 * r0) });
  trunk.userData.trunk = { len: trunkLen };
  geos.push(trunk);
  const curve = new THREE.CatmullRomCurve3(trunkPts);
  const top = trunkPts.at(-1);
  if (broken) {
    // jagged splintered top
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const s = new THREE.ConeGeometry(rTop * 0.35, 0.25 + rand() * 0.45, 4);
      s.translate(0, 0.12, 0);
      s.rotateZ((rand() - 0.5) * 0.3);
      s.translate(top.x + Math.cos(a) * rTop * 0.6, top.y - 0.05, top.z + Math.sin(a) * rTop * 0.6);
      geos.push(s);
    }
  }
  if (stubs) {
    for (let k = 0; k < 3; k++) {
      const t = 0.3 + rand() * 0.4;
      const at = curve.getPointAt(t);
      const a = rand() * Math.PI * 2;
      const out = new V3(Math.cos(a), 0.35, Math.sin(a)).normalize();
      geos.push(sweep([at.clone().addScaledVector(out, -r0 * 0.3), at.clone().addScaledVector(out, r0 * 1.3 + 0.25)], (tt) => r0 * 0.3 * (1 - tt * 0.3), { radial: 7, segments: 3 }));
    }
  }
  if (cfg.forks) {
    let az = rand() * 6.28;
    for (let k = 0; k < cfg.forks; k++) {
      az += (Math.PI * 2) / cfg.forks + (rand() - 0.5) * 0.5;
      const tan = curve.getTangentAt(1);
      const perp = perpendicular(tan).applyAxisAngle(tan, az);
      const fd = tan.clone().applyAxisAngle(perp, (cfg.forkSpread ?? 0.5) * (0.8 + rand() * 0.4)).normalize();
      branch(top.clone().addScaledVector(tan, -rTop * 0.5), fd, cfg.firstLen * (0.85 + rand() * 0.3), rTop * 0.72, cfg.depth - 1, 1);
    }
  } else if (!broken || cfg.depth > 3) {
    const crown = 2 + Math.floor(rand() * 2) + cfg.children;
    const t0 = cfg.crownT ?? (cfg.columnar ? 0.12 : 0.62);
    let az = rand() * 6.28;
    for (let k = 0; k < crown; k++) {
      const t = t0 + (1 - t0) * (k / crown);
      if (broken && t > 0.85) continue;
      const at = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      az += 2.39996;
      const perp = perpendicular(tan).applyAxisAngle(tan, az);
      const cd = tan.clone().applyAxisAngle(perp, cfg.spread * (0.8 + rand() * 0.5)).normalize();
      branch(at, cd, cfg.firstLen * (0.8 + rand() * 0.4) * (cfg.columnar ? 0.6 + 0.6 * (1 - t) : 1), rTop * 0.75 * (1 - (t - t0) * 0.4), cfg.depth - 1, 1);
    }
    if (!broken) branch(top, d, cfg.firstLen * 0.8, rTop * 0.8, cfg.depth - 1, 1);
  }
  return { geos, tips, mids, top, trunkPts };
}

/* ------------------------------ extras ------------------------------ */

function instanced(geo, mat, items, name) {
  const im = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
  im.name = name;
  const m = new THREE.Matrix4();
  items.forEach((it, i) => {
    m.compose(it.p, it.q ?? new THREE.Quaternion(), it.s ?? new V3(1, 1, 1));
    im.setMatrixAt(i, m);
    if (it.c) im.setColorAt(i, new THREE.Color(it.c));
  });
  if (!items.length) im.count = 0;
  return im;
}

function addFruit(parent, tips, fr, rand) {
  const items = [];
  const q = new THREE.Quaternion();
  for (const c of tips) {
    const n = fr.cluster ? (rand() < 0.35 ? 1 : 0) : rand() < 0.4 ? 1 : 0;
    for (let i = 0; i < n; i++) {
      // fruit hangs just below a twig tip
      const base = c.p.clone().add(new V3((rand() - 0.5) * 0.08, -fr.r * 1.1 - rand() * 0.04, (rand() - 0.5) * 0.08));
      if (fr.cluster) {
        for (let k = 0; k < fr.cluster; k++) items.push({ p: base.clone().add(new V3((rand() - 0.5) * 0.05, -rand() * 0.04, (rand() - 0.5) * 0.05)), c: fr.color });
      } else {
        items.push({ p: base, q, s: new V3(1, fr.elong ?? 1, 1), c: fr.alt && rand() < 0.3 ? fr.alt : fr.color });
      }
    }
  }
  for (let i = items.length - 1; i >= 0; i--) if (items[i].p.y < 0.3) items.splice(i, 1); // never lying on the ground
  const g = fr.r < 0.02 ? new THREE.IcosahedronGeometry(fr.r, 0) : new THREE.SphereGeometry(fr.r, 9, 7);
  parent.add(instanced(g, new THREE.MeshStandardMaterial({ roughness: 0.45, color: '#ffffff', name: 'fruit' }), items, 'fruit'));
}

function addTreeFlowers(parent, centers, kind, rand, color = '#fbf8ee') {
  const items = [];
  let geo;
  let mat;
  if (kind === 'candles') {
    geo = new THREE.ConeGeometry(0.05, 0.2, 8);
    geo.translate(0, 0.1, 0);
    mat = new THREE.MeshStandardMaterial({ color: '#f6efe6', roughness: 0.7 });
    for (const c of centers) for (let i = 0; i < 1; i++) {
      if (rand() < 0.4) continue;
      const dir = new V3(rand() * 2 - 1, 0.3 + rand() * 0.3, rand() * 2 - 1).normalize();
      items.push({ p: c.p.clone().addScaledVector(dir, c.r * 0.4), q: new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().lerp(UP, 0.6).normalize()) });
    }
  } else if (kind === 'magnolia') {
    // tulip-shaped cup of 6 tepals, white flushed pink at the base
    geo = new THREE.LatheGeometry([[0.001, 0], [0.03, 0.01], [0.055, 0.05], [0.06, 0.09], [0.045, 0.12]].map(([x, y]) => new THREE.Vector2(x, y)), 6);
    geo.computeVertexNormals();
    paintVertices(geo, (v) => new THREE.Color('#d06a9a').lerp(new THREE.Color('#fbf3f5'), Math.min(1, v.y / 0.08)));
    mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide });
    for (const c of centers) for (let i = 0; i < 1; i++) {
      if (rand() < 0.45) continue;
      const dir = new V3(rand() * 2 - 1, 0.2 + rand() * 0.3, rand() * 2 - 1).normalize();
      items.push({ p: c.p.clone().addScaledVector(dir, c.r * 0.5), q: new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().lerp(UP, 0.5).normalize()) });
    }
  } else {
    geo = new THREE.IcosahedronGeometry(0.022, 0);
    mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    for (const c of centers) for (let i = 0; i < 2; i++) {
      if (rand() < 0.4) continue;
      // flowers open at the shoot tips
      items.push({ p: c.p.clone().add(new V3((rand() - 0.5) * 0.02, -0.01 - rand() * 0.02, (rand() - 0.5) * 0.02)) });
    }
  }
  const maxY = Math.max(...centers.map((c) => c.p.y));
  parent.add(instanced(geo, mat, items.filter((it) => it.p.y <= maxY), 'tree_flowers'));
}

/** Ivy climbing the trunk: a spiralling vine with ivy leaves. */
function addIvy(parent, trunkPts, r0, rand, height) {
  const curve = new THREE.CatmullRomCurve3(trunkPts);
  const vine = [];
  const leaves = [];
  const q = new THREE.Quaternion();
  for (const phase of [0, 1.3, 2.6, 3.9, 5.2]) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = (i / 24) * height;
      const c = curve.getPointAt(Math.min(1, t));
      const r = r0 * (1 - t * 0.3) * (1 + 0.6 * Math.pow(Math.max(0, 1 - t * 4), 2)) + 0.012;
      const a = phase + t * 5 + Math.sin(i) * 0.2;
      pts.push(new V3(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r));
      if (i > 0) {
        for (let k = 0; k < 6; k++) {
          const aa = a + (rand() - 0.5) * 1.6;
          const out = new V3(Math.cos(aa), 0, Math.sin(aa));
          const pp = new V3(c.x + Math.cos(aa) * (r + 0.015), c.y + (rand() - 0.5) * 0.06, c.z + Math.sin(aa) * (r + 0.015));
          q.setFromUnitVectors(new V3(0, 0, 1), out.clone().add(new V3(0, 0.3, 0)).normalize());
          leaves.push({ p: pp, q: q.clone(), s: new V3(1, 1, 1).multiplyScalar(0.7 + rand() * 0.6), c: rand() < 0.5 ? '#2f4f24' : '#3b5e2c' });
        }
      }
    }
    vine.push(paintVertices(sweep(pts, () => 0.008, { radial: 4, segments: 40 }), () => new THREE.Color('#4a3a2a')));
  }
  mesh(merge(vine), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), { parent, name: 'ivy_vine' });
  // ivy also carpets the ground around the trunk
  for (let i = 0; i < 260; i++) {
    const a = rand() * Math.PI * 2;
    const r = r0 * 1.1 + Math.pow(rand(), 0.8) * 1.4;
    const q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + (rand() - 0.5) * 0.25, rand() * 6.28, 0, 'YXZ'));
    leaves.push({ p: new V3(Math.cos(a) * r, 0.014 + rand() * 0.008, Math.sin(a) * r), q: q2, s: new V3(1, 1, 1).multiplyScalar(0.8 + rand() * 0.5), c: rand() < 0.5 ? '#2f4f24' : '#3b5e2c' });
  }
  const tex = leafTexture('ivy');
  const lg = new THREE.PlaneGeometry(0.13, 0.13);
  parent.add(instanced(lg, new THREE.MeshStandardMaterial({ map: tex, alphaTest: tex ? 0.45 : 0, side: THREE.DoubleSide, roughness: 0.6, color: '#ffffff' }), leaves, 'ivy_leaves'));
}

/** Nursery stake + rubber tie for saplings. */
function addStake(parent, h, trunkR) {
  const wood = new THREE.MeshStandardMaterial({ color: '#a07a50', roughness: 0.9, name: 'stake' });
  const x = trunkR + 0.045;
  const st = mesh(new THREE.CylinderGeometry(0.022, 0.025, h, 8), wood, { parent, name: 'stake', at: [x, h / 2 - 0.02, 0] });
  void st;
  mesh(new THREE.ConeGeometry(0.022, 0.04, 8), wood, { parent, at: [x, h - 0.0, 0] });
  for (const y of [h * 0.45, h * 0.85]) {
    const tie = new THREE.TorusGeometry(0.035, 0.008, 6, 16);
    tie.rotateX(Math.PI / 2);
    tie.scale(1 + (x / 0.035 - 1) * 0.5, 1, 1);
    mesh(tie, new THREE.MeshStandardMaterial({ color: '#2a2a28', roughness: 0.7 }), { parent, name: 'stake_tie', at: [x / 2, y, 0] });
  }
}

function mossify(geo, seed) {
  const col = geo.attributes.color;
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  const moss = new THREE.Color('#4c6a2a');
  const c = new THREE.Color();
  for (let i = 0; i < col.count; i++) {
    const k = THREE.MathUtils.smoothstep(n.getX(i) * 0.5 + n.getY(i) * 0.6 + 0.6 * fbm(p.getX(i) * 5, p.getY(i) * 5, p.getZ(i) * 5, seed, 3), -0.1, 0.25);
    if (k <= 0) continue;
    c.fromBufferAttribute(col, i).lerp(moss.clone().multiplyScalar(0.8 + 0.3 * fbm(p.getX(i) * 15, p.getY(i) * 15, p.getZ(i) * 15, seed + 1, 2)), k);
    col.setXYZ(i, c.r, c.g, c.b);
  }
  return geo;
}

/* ------------------------------ broadleaf ------------------------------ */

function buildBroad(c, f, rand, seed, root) {
  const stems = c.twin ? 2 : c.stems ?? 1;
  let tips = [];
  let mids = [];
  const geos = [];
  let first = null;
  for (let s = 0; s < stems; s++) {
    const a = (s / stems) * Math.PI * 2 + rand();
    const off = stems > 1 ? 0.12 + c.trunkR : 0;
    const tilt = stems > 1 ? new V3(Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3).normalize() : UP.clone();
    const sc = stems > 1 ? { ...c, trunkR: c.trunkR * 0.8 } : c;
    const res = grow(sc, rand, { origin: new V3(Math.cos(a) * off, 0, Math.sin(a) * off), tilt, wind: f.wind, hollow: f.hollow, broken: f.broken, stubs: f.stubs });
    tips = tips.concat(res.tips);
    mids = mids.concat(res.mids);
    geos.push(...res.geos);
    first ??= res;
  }
  const barkGeo = merge(geos.map((g) => barkColor(g, c.bark, { seed, birch: c.birch, style: c.barkStyle })));
  if (f.hollow) {
    // dark cavity inside the dent
    const col = barkGeo.attributes.color;
    const p = barkGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      if (y > 0.03 && y < c.trunkH * 0.42 && x > 0 && Math.abs(z) < c.trunkR * 0.8 && x < c.trunkR * 0.7) col.setXYZ(i, 0.05, 0.035, 0.03);
    }
  }
  if (f.moss) mossify(barkGeo, seed);
  if (f.snow) snowify(barkGeo, 0.95, { seed });
  mesh(barkGeo, barkMaterial(c.barkStyle ?? (c.birch ? null : 'furrowed')), { parent: root, name: 'bark' });
  if (f.ivy) addIvy(root, first.trunkPts, c.trunkR, rand, 0.9);
  if (f.stake) addStake(root, Math.max(0.9, c.trunkH * 0.75), c.trunkR);
  const crownR = Math.max(...tips.map((t) => Math.hypot(t.p.x, t.p.z)), 0.5);
  if (f.litter) root.add(leafLitter(crownR * 0.9 + 0.3, { rand, colors: c.colors, kind: c.litter ?? c.leaf, count: 260, size: Math.max(0.08, (c.size ?? 0.5) * 0.18) }));
  if (f.snow) mesh(snowMound(Math.max(0.5, c.trunkR * 4), seed), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), { parent: root, name: 'snow' });
  if (!f.leaves) return { tips, crownR };
  let centers = tips.map((t) => ({ p: t.p.clone().addScaledVector(t.dir, c.foliageR * 0.3), r: c.foliageR * (0.7 + rand() * 0.6) }));
  for (const m of mids) if (rand() < 0.5) centers.push({ p: m.clone(), r: c.foliageR * 0.6 });
  for (let i = centers.length - 1; i >= 0; i--) if (centers[i].p.y < c.trunkH * 0.7 && !c.layered) centers.splice(i, 1);
  if (!centers.length) centers = tips.map((t) => ({ p: t.p.clone(), r: c.foliageR }));
  if (c.umbrella) {
    const maxY = Math.max(...centers.map((x) => x.p.y));
    for (const x of centers) {
      x.p.y = maxY - (maxY - x.p.y) * c.umbrella;
      x.r *= 1.1;
    }
  }
  if (f.pruned) {
    // orchard pruning: crown clipped to a tidy ellipsoid
    const cen = centers.reduce((a, x) => a.add(x.p), new V3()).multiplyScalar(1 / centers.length);
    const R = Math.max(...centers.map((x) => x.p.distanceTo(cen))) * 0.8;
    for (const x of centers) {
      const d = x.p.clone().sub(cen);
      if (d.length() > R) x.p.copy(cen).addScaledVector(d.normalize(), R);
    }
  }
  if (f.wind) for (const x of centers) x.p.addScaledVector(f.wind, x.p.y * 0.05);
  // Every foliage cluster hangs on a branch: drop any that drifted away from all tips/mids.
  const anchors = tips.map((t) => t.p).concat(mids);
  centers = centers.filter((x) => anchors.some((a) => a.distanceTo(x.p) < x.r * 1.6 + 0.2));
  if (centers.length > 110) centers = centers.filter((_, i) => i % Math.ceil(centers.length / 110) === 0 || i < 20);
  const cards = leafCards(centers, { rand, kind: c.leaf, size: c.size, perCenter: Math.round(22 * f.dens), colors: f.snow ? c.colors.concat(['#eef2f6', '#e6ecf2']) : c.colors, droop: c.droop ? c.droop * 0.3 : 0, shell: [0.3, 1.1] });
  if (cards) root.add(cards);
  else {
    // no DOM (Node / headless export): solid foliage masses instead of alpha cards
    const inner = clumps(centers.map((x) => ({ p: x.p, r: x.r * 0.6 })), { rand, colors: c.colors, seed, detail: centers.length > 60 ? 1 : 2 });
    inner.name = 'foliage';
    if (f.snow) snowify(inner.geometry, 0.9, { seed, threshold: 0.2 });
    root.add(inner);
  }
  if (f.fruit && c.fruit) addFruit(root, tips, c.fruit, rand);
  if (f.flowers) addTreeFlowers(root, tips.map((t) => ({ p: t.p, r: 0.12 })), f.flowers, rand, c.flowersColor);
  return { tips, centers, crownR };
}

/* ------------------------------ conifers ------------------------------ */

function buildConifer(c, f, rand, seed, root, kindPine) {
  let H = c.trunkH * (0.85 + rand() * 0.3);
  if (f.trim === 'sapling') H = Math.max(0.9, c.trunkH * 0.14);
  else if (f.trim === 'young') H *= 0.45;
  else if (f.trim === 'ancient') H *= 1.2;
  const r0 = c.trunkR * (f.trim === 'sapling' ? 0.18 : f.trim === 'young' ? 0.45 : f.trim === 'ancient' ? 1.7 : 1);
  const cut = f.broken ? 0.64 : 1;
  const lean = new V3((rand() - 0.5) * 0.1, 1, (rand() - 0.5) * 0.1).normalize();
  if (f.wind) lean.addScaledVector(f.wind, 0.08).normalize();
  const trunkPts = [];
  for (let i = 0; i <= 8; i++) {
    const t = (i / 8) * cut;
    let x = lean.x * H * t + (kindPine ? Math.sin(i * 1.3 + seed) * 0.08 : 0);
    if (c.nod && t > 0.85) x += (t - 0.85) * H * 0.35;
    trunkPts.push(new V3(x, H * t - 0.05, lean.z * H * t));
  }
  const trunk = sweep(trunkPts, (t, a) => r0 * (1 - t * cut * 0.9) * (1 + 0.5 * Math.pow(Math.max(0, 1 - t * 9), 2) * (1 + 0.3 * Math.cos(a * 6))), { radial: 14, segments: 24, uvScale: (H * cut) / (Math.PI * 2 * r0) });
  barkColor(trunk, c.bark, { seed, style: c.barkStyle });
  if (kindPine) {
    // Scots/stone pine: orange "fox" bark higher up
    const col = trunk.attributes.color;
    const p = trunk.attributes.position;
    const fox = new THREE.Color('#c0703c');
    const cc = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const k = Math.max(0, p.getY(i) / H - 0.4) * 1.7;
      cc.fromBufferAttribute(col, i).lerp(fox, Math.min(1, k));
      col.setXYZ(i, cc.r, cc.g, cc.b);
    }
  }
  const curve = new THREE.CatmullRomCurve3(trunkPts);
  const bark = [trunk];
  const sprays = [];
  const berries = [];
  const colors = c.colors;
  const pick = () => new THREE.Color(colors[Math.floor(rand() * colors.length)]);
  const twig = (pts, r) => bark.push(paintVertices(sweep(pts, (t) => r * (1 - t * 0.85), { radial: 4, segments: 6 }), () => new THREE.Color(c.bark).multiplyScalar(0.85)));
  const keep = () => f.leaves && rand() < (f.dens < 1 ? f.dens : 1) * (c.sparse && typeof c.sparse === 'number' ? 1 : 1);
  const spray = (at, dir, len, w, opts = {}) => {
    if (!keep()) return;
    const base = pick();
    let tip = base.clone().multiplyScalar(1.05);
    if (f.snow && rand() < 0.8) tip = new THREE.Color('#f2f5f8');
    const g = sprayGeometry(len, w, dir, { color: base.clone().multiplyScalar(0.55), colorTip: tip, ...opts });
    g.translate(at.x, at.y, at.z);
    sprays.push(g);
    if (c.berries && rand() < 0.25) berries.push(at.clone().addScaledVector(dir, len * 0.6));
  };
  const windK = (dir) => (f.wind ? 0.35 + 0.65 * Math.max(0, new V3(dir.x, 0, dir.z).normalize().dot(f.wind)) : 1);
  if (!kindPine) {
    const maxL = c.maxL * H;
    const y0 = H * (c.y0 ?? 0) + 0.25 + maxL * (Math.max(0, -c.dirY) + c.droop) * 1.15 + (f.trim === 'ancient' ? H * 0.12 : 0);
    const top = H * cut - 0.35 * Math.min(1, H / 6);
    if (c.tiers) {
      // cedar of Lebanon: flat horizontal tiers of foliage plates
      for (let k = 0; k < c.tiers; k++) {
        const tk = k / c.tiers;
        const y = y0 + (top - y0) * tk;
        if (y > top) break;
        const L = maxL * Math.pow(1 - tk, 0.6) + 0.3;
        const at = curve.getPointAt(Math.min(1, (y + 0.05) / (H * cut)));
        const n = 6 + Math.floor(rand() * 3);
        for (let i = 0; i < n; i++) {
          const az = (i / n) * Math.PI * 2 + rand() * 0.6 + k;
          const dir = new V3(Math.cos(az), 0.08, Math.sin(az)).normalize();
          const Lw = L * windK(dir);
          const end = at.clone().addScaledVector(dir, Lw).add(new V3(0, Lw * 0.1, 0));
          bark.push(barkColor(sweep([at, at.clone().addScaledVector(dir, Lw * 0.5).add(new V3(0, Lw * 0.08, 0)), end], (t) => (0.03 + L * 0.02) * (1 - t * 0.8), { radial: 6, segments: 8 }), c.bark, { seed, style: c.barkStyle }));
          // foliage plate on the outer part of the limb
          // dense flat-topped pads (tufts radiating in a flattened dome)
          for (let q = 0; q < 6; q++) {
            const tt = 0.4 + (q / 5) * 0.6;
            const p = at.clone().addScaledVector(dir, Lw * tt).add(new V3(0, Lw * 0.1 * tt + 0.03, 0));
            for (let b = 0; b < 9; b++) {
              const ang = (b / 9) * Math.PI * 2 + rand() * 0.5;
              const d2 = new V3(Math.cos(ang), 0.15 + rand() * 0.45, Math.sin(ang)).normalize();
              const ps = Math.max(0.3, Math.min(1, H / 6));
              spray(p, d2, (0.8 + rand() * 0.4) * ps, 0.55 * ps, { droop: 0.08, curl: 0.25 });
            }
          }
        }
      }
    } else {
      const step = (0.26 / (c.dense ?? 1)) * Math.max(0.25, Math.min(1, H / 6));
      for (let y = y0; y < top; y += step * (0.85 + rand() * 0.3)) {
        const t = (y - y0) / (top - y0);
        const hs = Math.min(1, H / 6);
        let L = c.column ? maxL * (1 - Math.pow(t, 3)) * (0.7 + 0.3 * Math.sin(t * Math.PI)) + 0.25 * hs : maxL * Math.pow(1 - t, c.profile) + 0.22 * hs;
        if (f.broken) L = maxL * Math.pow(1 - t * cut, c.profile) + 0.22 * hs;
        // old giants have shed their lower limbs: dead bare stubs on the lower trunk
        const deadLimb = f.trim === 'ancient' && t < 0.3;
        const at = curve.getPointAt(Math.min(1, (y + 0.05) / (H * cut)));
        const n = c.column ? 10 : 7 + Math.floor(rand() * 3);
        for (let k = 0; k < n; k++) {
          const az = (k / n) * Math.PI * 2 + rand() * 0.5 + y * 2.1;
          const dir = new V3(Math.cos(az), c.dirY - rand() * 0.12, Math.sin(az)).normalize();
          const Lw = L * windK(dir);
          const w = THREE.MathUtils.clamp(Lw * 0.42, c.column ? 0.32 : 0.16, 0.75);
          if (deadLimb) {
            twig([at, at.clone().addScaledVector(dir, Lw * 0.35)], 0.02 + Lw * 0.01);
            continue;
          }
          spray(at, dir, Lw, w, { droop: Lw * c.droop, tipUp: Lw * (c.dirY < 0 ? 0.14 : 0), curl: 0.35 });
          twig([at, at.clone().addScaledVector(dir, Lw * 0.5).add(new V3(0, -Lw * c.droop * 0.25, 0)), at.clone().addScaledVector(dir, Lw * 0.9).add(new V3(0, -Lw * c.droop * 0.4, 0))], 0.012 + Lw * 0.008);
          if (!c.column) {
            for (const fr of [0.35, 0.62]) {
              for (const sgn of [1, -1]) {
                const p = at.clone().addScaledVector(dir, Lw * fr).add(new V3(0, -Lw * c.droop * fr * fr, 0));
                const d2 = dir.clone().applyAxisAngle(UP, sgn * (0.75 + rand() * 0.25));
                d2.y -= 0.12;
                spray(p, d2.normalize(), Lw * 0.45 * (1 - fr * 0.4), w * 0.7, { droop: Lw * c.droop * 0.5, tipUp: Lw * 0.05, curl: 0.3 });
              }
            }
          }
        }
      }
    }
    if (!f.broken) {
      const tp = curve.getPointAt(1);
      const hs = Math.min(1, H / 6);
      for (let k = 0; k < 5; k++) {
        const az = (k / 5) * Math.PI * 2;
        spray(tp.clone().add(new V3(0, -0.25 * hs, 0)), new V3(Math.cos(az) * 0.35, 1, Math.sin(az) * 0.35).normalize(), 0.5 * hs, 0.18 * hs, { droop: 0.0, curl: 0.25 });
      }
      spray(tp.clone().add(new V3(0, -0.3 * hs, 0)), UP.clone(), 0.75 * hs, 0.16 * hs, { droop: 0, curl: 0.2 });
    }
    if (f.leaves && !c.tiers) {
      // dark core so you don't see the sky straight through the middle
      const coreH = Math.max(0.3, top - y0);
      const core = new THREE.ConeGeometry(Math.max(0.1, (c.column ? maxL : maxL * 0.32)), coreH, 12, 1, true);
      core.translate(curve.getPointAt(0.5).x, coreH / 2 + y0, curve.getPointAt(0.5).z);
      sprays.push(paintVertices(core, () => new THREE.Color(colors[0]).multiplyScalar(0.3)));
    }
  } else {
    // Scots pine: bare lower trunk, long limbs curving up, needle tufts; stone pine: flat umbrella
    const limbs = (c.umbrella ? 10 : 13) + Math.floor(rand() * 6);
    for (let k = 0; k < limbs; k++) {
      const t = c.umbrella ? 0.55 + 0.32 * (k / limbs) : 0.5 + 0.47 * (k / limbs) + rand() * 0.03;
      if (t > cut - 0.02) continue;
      const at = curve.getPointAt(Math.min(1, t / cut));
      const az = k * 2.39996 + rand() * 0.5;
      const out = new V3(Math.cos(az), 0, Math.sin(az));
      let L = c.umbrella ? (2.4 + rand() * 1.0) * (H / 6.5) * (1.15 - (t - 0.55)) : (1.0 + rand() * 1.2) * (1.15 - (t - 0.5) * 1.2) * (H / 8);
      L *= windK(out);
      const rise = c.umbrella ? (H * 0.97 - at.y) / L : 0.55;
      const pts = [at.clone(), at.clone().addScaledVector(out, L * 0.4).add(new V3(0, L * rise * 0.3, 0)), at.clone().addScaledVector(out, L * 0.8).add(new V3(0, L * rise * 0.7, 0)), at.clone().addScaledVector(out, L).add(new V3(0, L * rise, 0))];
      bark.push(paintVertices(sweep(pts, (tt) => r0 * 0.32 * (1 - tt * 0.75), { radial: 6, segments: 10 }), (v) => new THREE.Color('#9c5a33').multiplyScalar(0.85 + fbm(v.x * 9, v.y * 9, v.z * 9, seed, 2) * 0.3)));
      const lc = new THREE.CatmullRomCurve3(pts);
      const tuftAt = (cc, tan, size) => {
        const perp0 = new V3().crossVectors(tan, UP);
        if (perp0.lengthSq() < 1e-4) perp0.set(1, 0, 0);
        perp0.normalize();
        for (let b = 0; b < 14; b++) {
          const ang = (b / 14) * Math.PI * 2 + rand() * 0.4;
          const dd = tan.clone().multiplyScalar(0.5).addScaledVector(perp0.clone().applyAxisAngle(tan, ang), 1).add(new V3(0, c.umbrella ? 0.6 : 0.3, 0)).normalize();
          spray(cc, dd, size * (0.8 + rand() * 0.4), size * 0.45, { droop: size * 0.12, curl: 0.2 });
        }
        spray(cc, tan.clone().add(new V3(0, 0.5, 0)).normalize(), size, size * 0.45, { droop: 0.02, curl: 0.2 });
      };
      const tufts = 4 + Math.floor(rand() * 3);
      const ts = Math.max(0.3, Math.min(1, H / 7));
      for (let q = 0; q < tufts; q++) {
        const tt = (c.umbrella ? 0.55 : 0.3) + (c.umbrella ? 0.45 : 0.7) * (q / (tufts - 1));
        tuftAt(lc.getPointAt(tt), lc.getTangentAt(tt), (0.75 + 0.25 * tt) * ts);
      }
      for (let sb = 0; sb < 2; sb++) {
        const tt = 0.45 + sb * 0.25;
        const p0 = lc.getPointAt(tt);
        const tan = lc.getTangentAt(tt);
        const sd = tan.clone().applyAxisAngle(UP, (sb ? 1 : -1) * (0.8 + rand() * 0.4)).add(new V3(0, 0.25, 0)).normalize();
        const sl = L * 0.4;
        const sp = [p0, p0.clone().addScaledVector(sd, sl * 0.5), p0.clone().addScaledVector(sd, sl).add(new V3(0, sl * 0.2, 0))];
        bark.push(paintVertices(sweep(sp, (u) => r0 * 0.14 * (1 - u * 0.7), { radial: 5, segments: 6 }), () => new THREE.Color('#9c5a33')));
        const sc = new THREE.CatmullRomCurve3(sp);
        const ts2 = Math.max(0.3, Math.min(1, H / 7));
        tuftAt(sc.getPointAt(0.6), sc.getTangentAt(0.6), 0.6 * ts2);
        tuftAt(sc.getPointAt(1), sc.getTangentAt(1), 0.7 * ts2);
      }
    }
  }
  if (f.broken) {
    const tp = trunkPts.at(-1);
    const rt = r0 * (1 - cut * 0.9);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const s = new THREE.ConeGeometry(rt * 0.45, 0.2 + rand() * 0.4, 4);
      s.translate(tp.x + Math.cos(a) * rt * 0.5, tp.y + 0.08, tp.z + Math.sin(a) * rt * 0.5);
      bark.push(paintVertices(s, () => new THREE.Color('#c8a878')));
    }
  }
  const barkGeo = merge(bark);
  if (f.snow) snowify(barkGeo, 0.9, { seed });
  mesh(barkGeo, barkMaterial(c.barkStyle), { parent: root, name: 'bark' });
  if (sprays.length) mesh(merge(sprays), cardMaterial(sprigTexture(c.sprig === 'pine' || kindPine ? 'pine' : 'fir')), { parent: root, name: 'foliage' });
  if (berries.length) root.add(instanced(new THREE.SphereGeometry(0.012, 6, 5), new THREE.MeshStandardMaterial({ color: c.berries, roughness: 0.5 }), berries.map((p) => ({ p })), 'berries'));
  if (f.stake) addStake(root, Math.min(1.1, H * 0.55), r0);
  if (f.snow) mesh(snowMound(Math.max(0.6, c.maxL ? c.maxL * H * 0.7 : 1.5), seed), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), { parent: root, name: 'snow' });
  if (f.litter || (c.group === 'larch' && (f.trim === 'autumn' || f.trim === 'winter'))) root.add(leafLitter(Math.max(1, c.maxL * H * 0.8), { rand, colors: c.autumn ?? DRY, kind: 'needle', count: 200, size: 0.1 }));
}

/* ------------------------------ willow ------------------------------ */

function buildWillow(c, f, rand, seed, root) {
  const s = f.trim === 'sapling' ? 0.3 : f.trim === 'young' ? 0.6 : f.trim === 'ancient' ? 1.2 : 1;
  const H = c.trunkH * s * (0.9 + rand() * 0.2);
  const R = c.trunkR * (f.trim === 'ancient' ? 1.6 : s);
  const trunkPts = [];
  for (let i = 0; i <= 5; i++) trunkPts.push(new V3(Math.sin(i + seed) * 0.08 * s, (i / 5) * H - 0.05, Math.cos(i * 1.3 + seed) * 0.08 * s));
  const bark = [barkColor(sweep(trunkPts, (t, a) => R * (1 - t * 0.35) * (1 + 0.6 * Math.pow(Math.max(0, 1 - t * 4), 2) * (1 + 0.35 * Math.cos(a * 5))) * (1 + (c.ridges ?? 0.05) * Math.cos(a * 9)), { radial: 16, segments: 14, uvScale: H / (Math.PI * 2 * R) }), c.bark, { seed, style: 'furrowed' })];
  const top = trunkPts.at(-1);
  const strands = group('strands', { parent: root });
  const ribbons = [];
  const cardCenters = [];
  const limbs = 5 + Math.floor(rand() * 3) + (f.trim === 'ancient' ? 2 : 0);
  const leafy = f.leaves && f.trim !== 'winter';
  const colors = f.trim === 'autumn' ? c.autumn : f.trim === 'spring' ? lighten(c.colors, 0.25) : c.colors;
  for (let k = 0; k < limbs; k++) {
    const az = (k / limbs) * Math.PI * 2 + rand() * 0.6;
    const out = new V3(Math.cos(az), 0, Math.sin(az));
    const reach = (1.3 + rand() * 0.7) * s;
    const end = top.clone().addScaledVector(out, reach).add(new V3(0, (1.6 + rand() * 0.8) * s, 0));
    const limbPts = [top.clone().add(new V3(0, -0.3 * s, 0)), top.clone().addScaledVector(out, reach * 0.35).add(new V3(0, 0.7 * s, 0)), end];
    bark.push(barkColor(sweep(limbPts, (t) => R * 0.5 * (1 - t * 0.6), { radial: 8, segments: 10 }), c.bark, { seed: seed + k }));
    const twigs = 7;
    for (let j = 0; j < twigs; j++) {
      const a2 = az + (j / (twigs - 1) - 0.5) * 2.0 + (rand() - 0.5) * 0.3;
      const o2 = new V3(Math.cos(a2), 0, Math.sin(a2));
      const len = (1.6 + rand() * 1.0) * s;
      const tw = [end.clone(), end.clone().addScaledVector(o2, len * 0.35).add(new V3(0, 0.55 * s, 0)), end.clone().addScaledVector(o2, len * 0.75).add(new V3(0, 0.35 * s, 0)), end.clone().addScaledVector(o2, len).add(new V3(0, -0.25 * s, 0))];
      bark.push(paintVertices(sweep(tw, (t) => 0.03 * s * (1 - t * 0.8), { radial: 4, segments: 10 }), () => new THREE.Color('#6b5a3a')));
      const tc = new THREE.CatmullRomCurve3(tw);
      for (let q = 0; q < 9; q++) {
        const tt = 0.12 + (q / 8) * 0.88;
        const anchor = tc.getPointAt(tt);
        cardCenters.push({ p: anchor.clone(), r: 0.28 * s });
        const hang = Math.min(anchor.y - 0.04, Math.max(0.4 * s, anchor.y - (0.25 + rand() * 1.1) * s));
        const base = new THREE.Color(leafy ? colors[Math.floor(rand() * colors.length)] : '#c8a83a');
        for (const cross of [0, Math.PI / 2]) {
          const segs = 10;
          const pos = [];
          const uv = [];
          const col = [];
          const idx = [];
          // bare winter strands are golden twigs, not leafy curtains
          const w0 = leafy ? 0.15 : 0.012;
          const sideDir = o2.clone().applyAxisAngle(UP, Math.PI / 2 + cross);
          const sway = (rand() - 0.5) * 0.25;
          for (let i = 0; i <= segs; i++) {
            const t = i / segs;
            const cc = anchor.clone().addScaledVector(o2, 0.18 * Math.sin(t * Math.PI * 0.5) + sway * t * t).add(new V3(0, -hang * t, 0));
            if (f.wind) cc.addScaledVector(f.wind, hang * 0.45 * t * t);
            const w = w0 * (1 - 0.55 * t);
            for (const sgn of [-1, 1]) {
              const p = cc.clone().addScaledVector(sideDir, sgn * w * 0.5);
              pos.push(p.x, p.y, p.z);
              uv.push(sgn < 0 ? 0 : 1, 1 - t);
              const ccol = base.clone().multiplyScalar(0.7 + 0.35 * t);
              if (f.snow && i < 3) ccol.lerp(new THREE.Color('#f2f5f8'), 0.6);
              col.push(ccol.r, ccol.g, ccol.b);
            }
          }
          for (let i = 0; i < segs; i++) {
            const a = i * 2;
            idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
          }
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
          g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
          g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
          g.setIndex(idx);
          g.computeVertexNormals();
          ribbons.push(g);
        }
      }
    }
  }
  const barkGeo = merge(bark);
  if (f.snow) snowify(barkGeo, 0.9, { seed });
  mesh(barkGeo, barkMaterial('furrowed'), { parent: root, name: 'bark' });
  mesh(merge(ribbons), leafy ? cardMaterial(strandTexture()) : new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 }), { parent: strands, name: 'strand_ribbons' });
  if (leafy) {
    const cards = leafCards(cardCenters.filter((_, i) => i % 2 === 0), { rand, kind: 'long', size: 0.45 * s, perCenter: 4, colors, name: 'crown_leaves', shell: [0.3, 1.0] });
    if (cards) root.add(cards);
  }
  if (f.trim === 'autumn') root.add(leafLitter(2.5 * s, { rand, colors, kind: 'long', count: 240, size: 0.1 }));
  if (f.snow) mesh(snowMound(1.2 * s, seed), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), { parent: root, name: 'snow' });
  if (f.trim === 'sapling') addStake(root, 0.9, R);
  return strands;
}

/* ------------------------------ palms ------------------------------ */

function featherFrond(rand, len, colors, { stiff = false, dead = false } = {}) {
  const pos = [];
  const col = [];
  const base = new THREE.Color(dead ? DRY[Math.floor(rand() * DRY.length)] : colors[Math.floor(rand() * colors.length)]);
  const rib = [];
  const N = 26;
  const up = stiff ? 0.9 + rand() * 0.3 : 0.55 + rand() * 0.4;
  const sag = dead ? 1.6 : stiff ? 0.32 : 0.55;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    rib.push(new V3(t * len, Math.sin(t * Math.PI * 0.9) * len * 0.28 * up - t * t * len * sag, 0));
  }
  const push = (v, c) => { pos.push(v.x, v.y, v.z); col.push(c.r, c.g, c.b); };
  for (let i = 1; i < N; i++) {
    const t = i / N;
    const p0 = rib[i];
    const p1 = rib[i + 1];
    const ll = Math.sin(Math.PI * Math.min(1, t * 1.1)) * len * (stiff ? 0.22 : 0.32) + 0.05;
    const shade = base.clone().multiplyScalar(0.75 + 0.35 * t);
    for (const s of [1, -1]) {
      const tip = p0.clone().add(new V3(ll * 0.35, (stiff ? -ll * 0.2 : -ll * 0.55) * (dead ? 2 : 1), s * ll * (dead ? 0.4 : 1)));
      push(p0, shade); push(p1, shade); push(tip, shade.clone().multiplyScalar(0.85));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const ribGeo = sweep(rib, (t) => 0.028 * (1 - t), { radial: 4, segments: N });
  paintVertices(ribGeo, () => new THREE.Color(dead ? '#7a6a48' : '#6b7a3a'));
  return merge([g, ribGeo]);
}

/** Fan (palmate) frond: petiole + pleated circular blade with drooping segment tips. */
function fanFrond(rand, len, colors, { dead = false } = {}) {
  const base = new THREE.Color(dead ? DRY[Math.floor(rand() * DRY.length)] : colors[Math.floor(rand() * colors.length)]);
  const pet = len * 0.55;
  const petPts = [new V3(0, 0, 0), new V3(pet * 0.5, pet * 0.15, 0), new V3(pet, dead ? -pet * 0.6 : pet * 0.12, 0)];
  const parts = [paintVertices(sweep(petPts, (t) => 0.025 * (1 - t * 0.5), { radial: 5, segments: 8 }), () => new THREE.Color(dead ? '#7a6a48' : '#6b7a3a'))];
  const c0 = petPts[2];
  const R = len * 0.5;
  const segs = 34;
  const pos = [];
  const col = [];
  const idx = [];
  const ring = 6;
  for (let j = 0; j <= segs; j++) {
    const a = -Math.PI * 0.72 + (j / segs) * Math.PI * 1.44;
    const pleat = j % 2 ? 0.03 : -0.03;
    for (let i = 0; i <= ring; i++) {
      const t = i / ring;
      const r = R * t;
      const droop = t > 0.6 ? -(t - 0.6) * R * (dead ? 1.6 : 0.7) : 0;
      const x = c0.x + Math.cos(a) * r * 0.9 + 0.02;
      const y = c0.y + (dead ? -r * 0.9 : r * 0.25) + droop + pleat * t;
      const z = Math.sin(a) * r;
      pos.push(x, y, z);
      const cc = base.clone().multiplyScalar(0.7 + 0.35 * t + (j % 2 ? 0.06 : 0));
      col.push(cc.r, cc.g, cc.b);
    }
  }
  for (let j = 0; j < segs; j++) {
    for (let i = 0; i < ring; i++) {
      const a = j * (ring + 1) + i;
      const b = a + ring + 1;
      if (i > ring - 2 && j % 2 === 0) continue; // split segment tips
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  parts.push(g);
  return merge(parts);
}

function buildPalm(c, f, rand, seed, root, origin = new V3(), leanDirIn) {
  const trimH = f.trim === 'sapling' ? 0.04 : f.trim === 'young' ? 0.4 : 1;
  const H = c.trunkH * trimH * (0.8 + rand() * 0.4);
  const leanDir = leanDirIn ?? (f.wind ? 0 : rand() * Math.PI * 2);
  const leanAmt = f.wind ? H * 0.35 : (c.lean ?? 0.4 + rand() * 0.5) * H * 0.15;
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const off = leanAmt * t * t;
    pts.push(new V3(origin.x + Math.cos(leanDir) * off, t * H - 0.05, origin.z + Math.sin(leanDir) * off));
  }
  const R = c.trunkR * (f.trim === 'young' ? 1.1 : f.trim === 'sapling' ? 0.8 : 1);
  const rings = Math.max(4, Math.round(H / 0.11));
  const crownshaftT = c.crownshaft ? 0.86 : 2;
  const trunk = sweep(pts, (t, a) => {
    let r = R * (1.35 - 0.45 * t + 0.4 * Math.pow(Math.max(0, 1 - t * 6), 2));
    if (c.smooth) r = R * (1.25 - 0.3 * t + 0.25 * Math.sin(t * Math.PI) - 0.1);
    else if (c.diamond) r *= 1 + 0.1 * Math.abs(Math.sin(t * rings * Math.PI + (a * 3) / 2)) * Math.abs(Math.sin(a * 6 + t * rings * 0.5));
    else r *= 1 + 0.06 * Math.cos(t * rings * Math.PI * 2);
    if (t > crownshaftT) r *= 1.05;
    return r;
  }, { radial: 14, segments: Math.max(12, rings * 3), uvScale: H / (Math.PI * 2 * R) });
  const barkC = new THREE.Color(c.bark);
  paintVertices(trunk, (v) => {
    const t = (v.y + 0.05) / H;
    if (t > crownshaftT) return new THREE.Color('#5f8a3a').multiplyScalar(0.9 + 0.1 * fbm(v.x * 6, v.y * 6, v.z * 6, seed, 2));
    if (c.smooth) return barkC.clone().multiplyScalar(0.92 + 0.06 * Math.cos(v.y * (rings / H) * Math.PI * 2) + fbm(v.x * 5, v.y, v.z * 5, seed, 2) * 0.08);
    return barkC.clone().multiplyScalar(0.8 + 0.25 * Math.cos(v.y * (rings / H) * Math.PI * 2) + fbm(v.x * 5, v.y, v.z * 5, seed, 2) * 0.15);
  });
  const parts = [trunk];
  const top = pts.at(-1);
  const crown = group('crown', { parent: root, at: [top.x, top.y, top.z] });
  const fronds = [];
  const n = (c.fronds ?? 12) + Math.floor(rand() * 4);
  const len = (c.frond === 'fan' ? 2.8 : 2.6) * (f.trim === 'sapling' ? 0.55 : f.trim === 'young' ? 0.8 : 1);
  const mk = (dead) => (c.frond === 'fan' ? fanFrond(rand, len * (0.85 + rand() * 0.3), c.colors, { dead }) : featherFrond(rand, len * (0.9 + rand() * 0.45), c.colors, { stiff: c.stiff, dead }));
  for (let i = 0; i < n; i++) {
    const g = mk(false);
    g.rotateZ(-0.1 + rand() * 0.25 - (i % 3 === 0 ? 0.5 : 0) + (f.trim === 'sapling' ? 0.6 : 0));
    let yaw = (i / n) * Math.PI * 2 + rand() * 0.3;
    if (f.wind) {
      // fronds blown downwind, drooping harder
      yaw = Math.atan2(-f.wind.z, f.wind.x) + (rand() - 0.5) * 2.4;
      g.rotateZ(-0.35);
    }
    g.rotateY(yaw);
    fronds.push(g);
  }
  // dead fronds: fan palms keep a hanging skirt; 'dry' palms get several
  const deadN = c.frond === 'fan' ? 0 : f.trim === 'dry' ? 10 : 0;
  for (let i = 0; i < deadN; i++) {
    const g = mk(true);
    g.rotateZ(-1.2 - rand() * 0.25);
    g.rotateY(rand() * Math.PI * 2);
    g.translate(0, -0.15 - rand() * 0.3, 0);
    fronds.push(g);
  }
  if (c.skirt || f.trim === 'dry') {
    const skL = f.trim === 'dry' ? 2.4 : 1.1;
    const sk = sweep([new V3(0, -skL, 0), new V3(0, -skL / 2, 0), new V3(0, 0.05, 0)], (t) => R * (1.5 + t * 0.6), { radial: 14, segments: 6, closeEnd: false });
    paintVertices(sk, (v) => new THREE.Color('#8a7448').multiplyScalar(0.7 + 0.4 * fbm(v.x * 8, v.y * 3, v.z * 8, seed, 2)));
    fronds.push(sk);
  }
  // boots / frond bases hug the trunk top so the crown is attached
  const boots = new THREE.SphereGeometry(R * 1.6, 12, 8);
  boots.scale(1, 1.3, 1);
  paintVertices(boots, (v) => new THREE.Color(c.crownshaft ? '#5f8a3a' : '#7a6a48').multiplyScalar(0.8 + 0.3 * fbm(v.x * 9, v.y * 9, v.z * 9, seed, 2)));
  fronds.push(boots);
  mesh(merge(fronds), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75, name: 'fronds' }), { parent: crown, name: 'fronds' });
  if (c.nuts && (f.trim === 'fruiting' || (c.nuts === 'coconut' && f.trim !== 'sapling' && f.trim !== 'young'))) {
    const cnt = f.trim === 'fruiting' ? 16 : 5;
    if (c.nuts === 'coconut') {
      // ripe king coconuts (fruiting) are orange-yellow; ordinary ones brown-green
      const nut = new THREE.MeshStandardMaterial({ color: f.trim === 'fruiting' ? '#d8962a' : '#6a5a2a', roughness: 0.6 });
      for (let i = 0; i < cnt; i++) {
        const a = rand() * 6.28;
        mesh(new THREE.SphereGeometry(0.11, 12, 10).scale(1, 1.1, 1), nut, { parent: crown, name: 'coconut', at: [Math.cos(a) * R * 1.3, -0.15 - rand() * 0.12, Math.sin(a) * R * 1.3] });
      }
    } else {
      // dates: orange strands hanging in bunches
      for (let b = 0; b < Math.ceil(cnt / 2); b++) {
        const a = rand() * 6.28;
        const items = [];
        for (let i = 0; i < 70; i++) items.push({ p: new V3(Math.cos(a) * R * 1.4 + (rand() - 0.5) * 0.25, -0.2 - rand() * 0.55, Math.sin(a) * R * 1.4 + (rand() - 0.5) * 0.25), c: rand() < 0.5 ? '#d8862a' : '#b8601e' });
        const stalk = sweep([new V3(Math.cos(a) * R, 0, Math.sin(a) * R), new V3(Math.cos(a) * R * 1.45, -0.25, Math.sin(a) * R * 1.45), new V3(Math.cos(a) * R * 1.4, -0.7, Math.sin(a) * R * 1.4)], () => 0.015, { radial: 4, segments: 6 });
        mesh(paintVertices(stalk, () => new THREE.Color('#c8962a')), new THREE.MeshStandardMaterial({ vertexColors: true }), { parent: crown, name: 'date_stalk' });
        const im = instanced(new THREE.SphereGeometry(0.018, 6, 5).scale(1, 1.5, 1), new THREE.MeshStandardMaterial({ roughness: 0.5, color: '#ffffff' }), items, 'dates');
        crown.add(im);
      }
    }
  }
  mesh(merge(parts), barkMaterial(c.smooth ? 'smooth' : 'palm'), { parent: root, name: c.twin ? `bark_${origin.x.toFixed(1)}` : 'bark' });
  return crown;
}

/* ------------------------------ bamboo ------------------------------ */

function buildBamboo(c, f, rand, seed, root) {
  const geos = [];
  const centers = [];
  const t = f.trim;
  const n = (t === 'grove' ? 22 : t === 'young' ? 6 : t === 'giant' ? 7 : 11) + Math.floor(rand() * 5);
  const spread = t === 'grove' ? 1.3 : t === 'giant' ? 0.8 : 0.55;
  const colors = t === 'golden' ? ['#d8c050', '#e0c85a', '#c8b040'] : c.colors;
  for (let i = 0; i < n; i++) {
    const a = rand() * 6.28;
    const rr = Math.sqrt(rand()) * spread;
    const x0 = Math.cos(a) * rr;
    const z0 = Math.sin(a) * rr;
    const H = (t === 'young' ? 1.8 : t === 'giant' ? 10 : t === 'thin' ? 3.5 : 4.5) + rand() * (t === 'giant' ? 4 : 3.5);
    const R = (t === 'giant' ? 0.07 : t === 'thin' ? 0.016 : t === 'young' ? 0.02 : 0.035) + rand() * (t === 'giant' ? 0.03 : 0.02);
    const lean = new V3(x0 * 0.25 + (rand() - 0.5) * 0.15, 1, z0 * 0.25 + (rand() - 0.5) * 0.15).normalize();
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const tt = k / 6;
      pts.push(new V3(x0 + lean.x * H * tt + lean.x * tt * tt * 0.6, H * tt - 0.03, z0 + lean.z * H * tt + lean.z * tt * tt * 0.6));
    }
    const nodes = Math.round(H / (t === 'giant' ? 0.4 : 0.32));
    const g = sweep(pts, (tt) => {
      const fr = (tt * nodes) % 1;
      return R * (1 - 0.35 * tt) * (1 + 0.14 * Math.exp(-Math.pow((fr - 0.02) * 22, 2)));
    }, { radial: 8, segments: nodes * 4 });
    const base = new THREE.Color(colors[i % colors.length]);
    paintVertices(g, (v) => {
      const tt = v.y / H;
      const fr = (tt * nodes) % 1;
      const cc = base.clone().multiplyScalar(fr < 0.04 ? 0.7 : 0.92 + fbm(v.x * 20, v.y * 3, v.z * 20, seed, 2) * 0.12);
      if (t === 'golden' && fbm(v.x * 30, v.y * 2, v.z * 30, seed, 1) > 0.3) cc.lerp(new THREE.Color('#5a8a3a'), 0.6);
      return cc;
    });
    geos.push(g);
    const curve = new THREE.CatmullRomCurve3(pts);
    for (let k = 0; k < 5; k++) centers.push({ p: curve.getPointAt(0.55 + k * 0.1).add(new V3((rand() - 0.5) * 0.3, 0, (rand() - 0.5) * 0.3)), r: 0.35 * (t === 'giant' ? 1.4 : 1) });
  }
  mesh(merge(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, name: 'culm' }), { parent: root, name: 'culms' });
  const leafCols = c.colors.map((col) => new THREE.Color(col).multiplyScalar(0.85));
  const cl = clumps(centers.map((x) => ({ p: x.p, r: 0.14 })), { rand, colors: leafCols.map((x) => x.clone().multiplyScalar(0.5)), seed, detail: 1 });
  cl.name = 'foliage';
  if (f.snow) snowify(cl.geometry, 1, { seed, threshold: 0.1 });
  root.add(cl);
  const cards = leafCards(centers, { rand, kind: 'long', size: c.size, perCenter: 8, colors: f.snow ? leafCols.concat([new THREE.Color('#eef2f6')]) : leafCols });
  if (cards) root.add(cards);
  if (f.snow) mesh(snowMound(spread + 0.5, seed), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), { parent: root, name: 'snow' });
}

/* ------------------------------ baobab ------------------------------ */

function buildBaobab(c, f, rand, seed, root) {
  const cfg = { ...c, bottle: true, flare: 0.25, ridges: 0.04, depth: 3, children: 2, childVar: 1, spread: 0.55, lenRatio: 0.6, firstLen: 2.0 * (c.trunkH / 4.2), radiusRatio: 0.5, gnarl: 0.45, up: 0.35, forks: 7, forkSpread: 1.15, foliageR: 0.45 };
  if (f.trim === 'sapling') Object.assign(cfg, { trunkH: 1.0, trunkR: 0.12, firstLen: 0.5, forks: 3, depth: 2 });
  if (f.trim === 'young') Object.assign(cfg, { trunkH: 2.2, trunkR: 0.4, firstLen: 1.1, forks: 5 });
  if (f.trim === 'ancient') Object.assign(cfg, { trunkH: 5.2, trunkR: 1.6, firstLen: 2.6, forks: 9, ridges: 0.08 });
  const res = grow(cfg, rand, {});
  const barkGeo = merge(res.geos.map((g) => barkColor(g, c.bark, { seed, style: 'smooth' })));
  mesh(barkGeo, barkMaterial('smooth'), { parent: root, name: 'bark' });
  if (f.stake === true && f.trim === 'sapling') addStake(root, 0.9, cfg.trunkR);
  const centers = res.tips.map((t) => ({ p: t.p.clone(), r: cfg.foliageR * (0.6 + rand() * 0.5) }));
  const leafy = f.trim === 'leafy' || f.trim === 'flowering' || f.trim === 'fruiting' || f.trim === 'young' || f.trim === 'sapling';
  const dens = f.trim === 'leafy' ? 18 : leafy ? 10 : 2;
  const inner = clumps(centers.map((x) => ({ p: x.p, r: x.r * (leafy ? 0.4 : 0.22) })), { rand, colors: c.colors.map((col) => new THREE.Color(col).multiplyScalar(0.45)), seed, detail: 2 });
  inner.name = 'foliage';
  root.add(inner);
  const cards = leafCards(centers, { rand, kind: 'pinnate', size: 0.45, perCenter: dens, colors: c.colors });
  if (cards) root.add(cards);
  if (f.trim === 'flowering') addTreeFlowers(root, res.tips.map((t) => ({ p: t.p, r: 0.1 })), 'small', rand, '#f8f4ea');
  if (f.trim === 'fruiting') {
    // velvety pods hanging on long stalks
    const pods = [];
    const stalks = [];
    for (const t of res.tips) {
      if (rand() < 0.5) continue;
      const end = t.p.clone().add(new V3(0, -0.35 - rand() * 0.25, 0));
      stalks.push(paintVertices(sweep([t.p, t.p.clone().lerp(end, 0.5).add(new V3(0.02, 0, 0)), end], () => 0.006, { radial: 3, segments: 4 }), () => new THREE.Color('#6a5a40')));
      pods.push({ p: end.clone().add(new V3(0, -0.1, 0)), s: new V3(1, 1.8, 1) });
    }
    if (stalks.length) mesh(merge(stalks), new THREE.MeshStandardMaterial({ vertexColors: true }), { parent: root, name: 'pod_stalks' });
    root.add(instanced(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: '#8a8a5a', roughness: 0.95 }), pods, 'pods'));
  }
}

/* ------------------------------ joshua tree ------------------------------ */

function spikeRosette(at, rand, colors, size, { snow = false } = {}) {
  const pos = [];
  const col = [];
  const n = 70;
  const push = (v, c) => { pos.push(v.x, v.y, v.z); col.push(c.r, c.g, c.b); };
  for (let i = 0; i < n; i++) {
    const phi = Math.acos(1 - (i + 0.5) / n * 1.6);
    const th = i * 2.39996;
    const d = new V3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
    const len = size * (0.7 + rand() * 0.5);
    const side = new V3().crossVectors(d, UP).normalize().multiplyScalar(0.012);
    if (side.lengthSq() < 1e-8) side.set(0.012, 0, 0);
    const base = new THREE.Color(colors[Math.floor(rand() * colors.length)]);
    const tipC = snow && d.y > 0.3 ? new THREE.Color('#f2f5f8') : base.clone().multiplyScalar(1.2);
    const tip = at.clone().addScaledVector(d, len);
    push(at.clone().add(side), base); push(at.clone().sub(side), base); push(tip, tipC);
    push(at.clone().sub(side), base); push(at.clone().add(side), base); push(tip, tipC);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function buildJoshua(c, f, rand, seed, root) {
  const bark = [];
  const leaves = [];
  const flowers = [];
  const maxDepth = f.trim === 'sapling' ? 0 : f.trim === 'young' ? 1 : f.trim === 'ancient' ? 4 : 3;
  const scale = f.trim === 'sapling' ? 0.45 : f.trim === 'young' ? 0.75 : f.trim === 'ancient' ? 1.3 : 1;
  function seg(start, dir, len, r, depth) {
    const pts = [start.clone()];
    const d = dir.clone();
    let p = start.clone();
    for (let i = 1; i <= 4; i++) {
      d.x += (rand() - 0.5) * 0.25;
      d.z += (rand() - 0.5) * 0.25;
      d.y += 0.08;
      d.normalize();
      p = p.clone().addScaledVector(d, len / 4);
      pts.push(p);
    }
    const g = sweep(pts, (t, a) => r * (1 - t * 0.15) * (1 + 0.08 * fbm(Math.cos(a) * 3, t * 8, Math.sin(a) * 3, seed, 2)), { radial: 10, segments: 10 });
    // shaggy skirt of dead leaves: straw-grey, darker low down
    paintVertices(g, (v) => new THREE.Color(depth === maxDepth ? '#5a4a3a' : '#8a7a62').multiplyScalar(0.7 + 0.45 * fbm(v.x * 18, v.y * 9, v.z * 18, seed, 3)));
    bark.push(g);
    if (depth === 0) {
      leaves.push(spikeRosette(p, rand, c.colors, 0.55 * scale, { snow: f.snow }));
      if (f.trim === 'flowering' && rand() < 0.7) flowers.push(p.clone().add(new V3(0, 0.35 * scale, 0)));
      return;
    }
    const kids = 2 + (rand() < 0.35 ? 1 : 0);
    for (let k = 0; k < kids; k++) {
      const a = rand() * Math.PI * 2;
      const cd = new V3(Math.cos(a) * 0.9, 0.55 + rand() * 0.5, Math.sin(a) * 0.9).normalize();
      seg(p, cd, len * (0.75 + rand() * 0.3), r * 0.78, depth - 1);
    }
  }
  const trunks = c.twin ? 3 : 1;
  for (let i = 0; i < trunks; i++) {
    const a = rand() * 6.28;
    const off = trunks > 1 ? 0.5 : 0;
    seg(new V3(Math.cos(a) * off, -0.05, Math.sin(a) * off), new V3((rand() - 0.5) * 0.15, 1, (rand() - 0.5) * 0.15).normalize(), (maxDepth === 0 ? 0.6 : 1.6) * scale, 0.21 * scale, maxDepth);
  }
  const bg = merge(bark);
  if (f.snow) snowify(bg, 0.9, { seed });
  mesh(bg, barkMaterial('fibrous'), { parent: root, name: 'bark' });
  mesh(merge(leaves), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.6, name: 'leaves' }), { parent: root, name: 'rosettes' });
  if (flowers.length) {
    const fg = flowers.map((p) => {
      const g = blob(0.13 * scale, { detail: 2, seed: p.x * 10, amount: 0.3, scale: [1, 1.5, 1] });
      g.translate(p.x, p.y, p.z);
      return paintVertices(g, (v) => new THREE.Color('#ece6c4').multiplyScalar(0.85 + 0.25 * fbm(v.x * 30, v.y * 30, v.z * 30, seed, 2)));
    });
    mesh(merge(fg), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }), { parent: root, name: 'flowers' });
  }
  if (f.snow) mesh(snowMound(1.2 * scale, seed), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), { parent: root, name: 'snow' });
}

/* ------------------------------ tree fern ------------------------------ */

function fernFrond(rand, len, colors, { dead = false, droopy = 1 } = {}) {
  const N = 22;
  const rib = [];
  const lift = (0.7 + rand() * 0.4) / droopy;
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    rib.push(new V3(t * len * 0.85, Math.sin(t * Math.PI * 0.7) * len * 0.45 * lift - t * t * len * 0.4 * droopy * (dead ? 2.2 : 1), 0));
  }
  const parts = [paintVertices(sweep(rib, (t) => 0.014 * (1 - t), { radial: 3, segments: N }), () => new THREE.Color(dead ? '#6a5236' : '#3d5f25'))];
  const pos = [];
  const col = [];
  for (let k = 1; k < N; k++) {
    const t = k / N;
    const ll = Math.sin(Math.PI * Math.min(1, t * 1.05)) * len * 0.2 + 0.03;
    const cc = new THREE.Color(dead ? DRY[k % DRY.length] : colors[k % colors.length]).multiplyScalar(0.8 + 0.3 * t);
    for (const s of [1, -1]) {
      const p0 = rib[k];
      const p1 = rib[k + 1];
      const tip = p0.clone().lerp(p1, 0.5).add(new V3(ll * 0.3, -ll * (dead ? 0.8 : 0.25), s * ll));
      pos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, tip.x, tip.y, tip.z);
      for (let q = 0; q < 3; q++) col.push(cc.r, cc.g, cc.b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  parts.push(g);
  return merge(parts);
}

function buildTreeFern(c, f, rand, seed, root) {
  const H = c.trunkH * ({ young: 0.3, tall: 1.6, ancient: 2.2 }[f.trim] ?? 1) * (0.85 + rand() * 0.3);
  const R = f.trim === 'ancient' ? 0.2 : f.trim === 'young' ? 0.1 : 0.14;
  const pts = [];
  for (let i = 0; i <= 6; i++) pts.push(new V3(Math.sin(i * 0.8 + seed) * 0.06, (i / 6) * H - 0.03, Math.cos(i * 0.6) * 0.05));
  const trunk = sweep(pts, (t, a) => R * (1.25 - 0.3 * t) * (1 + 0.5 * Math.pow(Math.max(0, 1 - t * 5), 2)) * (1 + 0.06 * Math.cos(a * 7 + t * 40)), { radial: 12, segments: 20, uvScale: H / (Math.PI * 2 * R) });
  paintVertices(trunk, (v) => new THREE.Color(c.bark).multiplyScalar(0.7 + 0.5 * Math.abs(fbm(v.x * 20, v.y * 12, v.z * 20, seed, 3))));
  mesh(trunk, barkMaterial('fibrous'), { parent: root, name: 'bark' });
  const top = pts.at(-1);
  const crown = group('crown', { parent: root, at: [top.x, top.y, top.z] });
  const fr = [];
  const n = f.trim === 'unfurling' ? 9 : 14 + Math.floor(rand() * 4);
  const len = 2.0 * (f.trim === 'young' ? 0.7 : 1);
  for (let i = 0; i < n; i++) {
    const g = fernFrond(rand, len * (0.85 + rand() * 0.3), c.colors, { droopy: f.trim === 'dry' ? 1.3 : 1 });
    g.rotateY((i / n) * Math.PI * 2 + rand() * 0.3);
    fr.push(g);
  }
  if (f.trim === 'dry' || f.trim === 'ancient') {
    for (let i = 0; i < 10; i++) {
      const g = fernFrond(rand, len * 0.8, c.colors, { dead: true });
      g.rotateZ(-1.0);
      g.rotateY(rand() * 6.28);
      fr.push(g);
    }
  }
  if (f.trim === 'unfurling') {
    // fiddleheads: tight coils on short stalks
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const st = sweep([new V3(0, 0, 0), new V3(Math.cos(a) * 0.08, 0.2, Math.sin(a) * 0.08), new V3(Math.cos(a) * 0.12, 0.38, Math.sin(a) * 0.12)], () => 0.014, { radial: 5, segments: 6 });
      fr.push(paintVertices(st, () => new THREE.Color('#7a6a3a')));
      const coil = new THREE.TorusGeometry(0.045, 0.018, 6, 12, Math.PI * 1.7);
      coil.rotateY(a);
      coil.translate(Math.cos(a) * 0.15, 0.42, Math.sin(a) * 0.15);
      fr.push(paintVertices(coil, () => new THREE.Color('#8a7a3a')));
    }
  }
  const cap = new THREE.SphereGeometry(R * 1.3, 10, 8);
  fr.push(paintVertices(cap, () => new THREE.Color('#4a3a28')));
  mesh(merge(fr), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75 }), { parent: crown, name: 'fronds' });
  return crown;
}

/* ------------------------------ banana ------------------------------ */

function bananaLeaf(rand, len, colors, { tattered = false, dead = false } = {}) {
  const base = new THREE.Color(dead ? DRY[Math.floor(rand() * DRY.length)] : colors[Math.floor(rand() * colors.length)]);
  const pet = len * 0.25;
  const parts = [paintVertices(sweep([new V3(0, 0, 0), new V3(pet * 0.6, pet * 0.5, 0), new V3(pet, pet * 0.6, 0)], (t) => 0.03 * (1 - t * 0.4), { radial: 5, segments: 6 }), () => new THREE.Color('#6a8a3a'))];
  const N = 24;
  const W = len * 0.2;
  const pos = [];
  const col = [];
  const idx = [];
  const strips = tattered ? 12 : 4;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = pet + t * len;
    const yMid = pet * 0.6 + Math.sin(t * Math.PI * 0.6) * len * 0.12 - t * t * len * (dead ? 0.9 : 0.35);
    const w = Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.04)) * W;
    for (let j = 0; j <= 4; j++) {
      const v = j / 4 - 0.5;
      pos.push(x, yMid - Math.abs(v) * W * 0.25 - (dead ? Math.abs(v) * W : 0), v * 2 * w);
      const cc = base.clone().multiplyScalar(0.8 + 0.25 * (1 - Math.abs(v)) + (j === 2 ? 0.1 : 0));
      col.push(cc.r, cc.g, cc.b);
    }
  }
  for (let i = 0; i < N; i++) {
    // tears between strips of the blade (wind-shredded leaves)
    if (i > 2 && i % Math.max(2, Math.round(N / strips)) === 0) continue;
    for (let j = 0; j < 4; j++) {
      const a = i * 5 + j;
      idx.push(a, a + 5, a + 1, a + 1, a + 5, a + 6);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  parts.push(g);
  return merge(parts);
}

function buildBanana(c, f, rand, seed, root) {
  const stems = c.twin ? 3 : 1;
  let crownRef = null;
  for (let s = 0; s < stems; s++) {
    const a = rand() * 6.28;
    const off = s === 0 ? 0 : 0.35 + rand() * 0.2;
    const sc = s === 0 ? (f.trim === 'young' ? 0.55 : 1) : 0.45 + rand() * 0.3;
    const H = c.trunkH * sc;
    const ox = Math.cos(a) * off;
    const oz = Math.sin(a) * off;
    const pts = [new V3(ox, -0.03, oz), new V3(ox + 0.02, H * 0.5, oz), new V3(ox + 0.04, H, oz)];
    const R = 0.13 * sc;
    const stem = sweep(pts, (t, an) => R * (1.2 - 0.45 * t) * (1 + 0.04 * Math.cos(an * 4)), { radial: 12, segments: 12 });
    paintVertices(stem, (v) => new THREE.Color('#7a8a4a').lerp(new THREE.Color('#6a5038'), 0.5 + 0.5 * fbm(v.x * 10, v.y * 4, v.z * 10, seed, 2)));
    mesh(stem, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }), { parent: root, name: s ? `pseudostem_${s}` : 'pseudostem' });
    const crown = group(s ? `crown_${s}` : 'crown', { parent: root, at: [pts[2].x, pts[2].y, pts[2].z] });
    crownRef ??= crown;
    const leaves = [];
    const n = 7 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const g = bananaLeaf(rand, 2.6 * sc * (0.8 + rand() * 0.4), c.colors, { tattered: f.trim === 'tattered' || rand() < 0.3 });
      g.rotateZ(0.35 - rand() * 0.3);
      g.rotateY((i / n) * Math.PI * 2 + rand() * 0.4);
      leaves.push(g);
    }
    if (f.trim === 'dry') {
      for (let i = 0; i < 5; i++) {
        const g = bananaLeaf(rand, 1.6 * sc, c.colors, { dead: true });
        g.rotateZ(-1.1);
        g.rotateY(rand() * 6.28);
        g.translate(0, -0.2, 0);
        leaves.push(g);
      }
    }
    const cap = new THREE.SphereGeometry(R * 1.1, 10, 8);
    leaves.push(paintVertices(cap, () => new THREE.Color('#6a8a3a')));
    mesh(merge(leaves), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.6, name: 'leaves' }), { parent: crown, name: 'leaves' });
    if (s === 0 && f.trim === 'fruiting') {
      // stalk arching down, hands of bananas, purple male bud at the end
      const stalkPts = [new V3(0, 0, 0), new V3(0.3, 0.05, 0), new V3(0.45, -0.4, 0), new V3(0.42, -1.0, 0)];
      const parts = [paintVertices(sweep(stalkPts, () => 0.025, { radial: 6, segments: 12 }), () => new THREE.Color('#7a8a3a'))];
      const sc2 = new THREE.CatmullRomCurve3(stalkPts);
      for (let h = 0; h < 6; h++) {
        const at = sc2.getPointAt(0.4 + h * 0.08);
        for (let b = 0; b < 9; b++) {
          const aa = (b / 9) * Math.PI * 1.6 - 0.8;
          const bp = [at.clone(), at.clone().add(new V3(Math.cos(aa) * 0.06, 0.03, Math.sin(aa) * 0.06)), at.clone().add(new V3(Math.cos(aa) * 0.1, 0.14, Math.sin(aa) * 0.1))];
          parts.push(paintVertices(sweep(bp, (t) => 0.016 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)), { radial: 6, segments: 6 }), () => new THREE.Color('#8aa83a')));
        }
      }
      const bud = new THREE.SphereGeometry(0.07, 10, 8);
      bud.scale(1, 1.8, 1);
      bud.translate(0.42, -1.1, 0);
      parts.push(paintVertices(bud, () => new THREE.Color('#5a2240')));
      mesh(merge(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }), { parent: crown, name: 'fruit' });
    }
  }
  return crownRef;
}

/* ------------------------------ falling leaves ------------------------------ */

function fallingLeaves(root, rand, colors, height, spread) {
  const tracks = [];
  const period = 6;
  for (let i = 0; i < 6; i++) {
    const leaf = mesh(new THREE.PlaneGeometry(0.07, 0.05), new THREE.MeshStandardMaterial({ color: colors[i % colors.length], side: THREE.DoubleSide }), { parent: root, name: `falling_leaf_${i}`, at: [(rand() - 0.5) * spread, height * (0.6 + rand() * 0.3), (rand() - 0.5) * spread] });
    leaf.userData.detached = true; // intentionally airborne
    const h0 = leaf.position.y;
    const ph = rand();
    tracks.push(moveTrack(leaf, period, (t) => {
      const tt = (t + ph) % 1;
      return [Math.sin(tt * 12) * 0.25, -tt * (h0 - 0.02), Math.cos(tt * 9) * 0.2];
    }, 48));
    tracks.push(rotateTrack(leaf, new V3(1, 0.4, 0.2), period, (t) => ((t + ph) % 1) * Math.PI * 6, 48));
  }
  return clip('falling', period, tracks);
}

/* ------------------------------ createTree ------------------------------ */

export function createTree(options = {}) {
  const o = normalizeOptions(options);
  const variant = o.variant ?? 'oak';
  const sp = SPECIES[variant];
  if (!sp) throw new Error(`[three-premade] Unknown tree variant "${variant}". Available: ${Object.keys(SPECIES).join(', ')}`);
  const trim = o.trim ?? null;
  if (trim && !TREE_TRIMS[variant].includes(trim)) throw new Error(`[three-premade] Unknown tree trim "${trim}" for ${variant}. Available: ${TREE_TRIMS[variant].join(', ')}`);
  const { c, f } = resolve(sp, trim);
  if (o.leafColor || o.color) c.colors = [o.leafColor ?? o.color];
  if (o.barkColor) c.bark = o.barkColor;
  if (o.height && c.trunkH) c.trunkH *= o.height / 8;
  const seed = typeof o.seed === 'number' ? o.seed : o.seed ? [...String(o.seed)].reduce((a, ch) => a + ch.charCodeAt(0), 0) : [...variant].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 97 + 7;
  const rand = rng(seed * 7919 + 1);
  const root = group(`tree-${variant}${trim ? `-${trim}` : ''}`);
  const sway = group('sway', { parent: root });
  const animations = [];
  let swayAmp = 0.025;
  switch (sp.kind) {
    case 'conifer':
    case 'pine':
      buildConifer(c, f, rand, seed, sway, sp.kind === 'pine');
      swayAmp = 0.015;
      break;
    case 'palm': {
      const crown = buildPalm(c, f, rand, seed, sway);
      if (c.twin) {
        const a = rand() * 6.28;
        buildPalm({ ...c, trunkH: c.trunkH * 0.75 }, f, rand, seed + 1, sway, new V3(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45), a);
      }
      animations.push(clip('fronds', 3, [rotateTrack(crown, new V3(0.3, 1, 0.2), 3, (t) => wave(t) * 0.05)]));
      swayAmp = 0.02;
      break;
    }
    case 'willow': {
      const strands = buildWillow(c, f, rand, seed, sway);
      animations.push(clip('strands', 3.5, [rotateTrack(strands, new V3(1, 0, 0.6), 3.5, (t) => wave(t) * 0.025)]));
      swayAmp = 0.012;
      break;
    }
    case 'bamboo':
      buildBamboo(c, f, rand, seed, sway);
      swayAmp = 0.035;
      break;
    case 'baobab':
      buildBaobab(c, f, rand, seed, sway);
      swayAmp = 0.006;
      break;
    case 'joshua':
      buildJoshua(c, f, rand, seed, sway);
      swayAmp = 0.008;
      break;
    case 'treefern': {
      const crown = buildTreeFern(c, f, rand, seed, sway);
      animations.push(clip('fronds', 3, [rotateTrack(crown, new V3(0.3, 1, 0.2), 3, (t) => wave(t) * 0.04)]));
      break;
    }
    case 'banana': {
      const crown = buildBanana(c, f, rand, seed, sway);
      animations.push(clip('leaves', 2.6, [rotateTrack(crown, new V3(0.3, 1, 0.2), 2.6, (t) => wave(t) * 0.05)]));
      break;
    }
    default:
      buildBroad(c, f, rand, seed, sway);
  }
  // nothing may sink more than 8 cm into the ground (fronds/strands rest on it instead)
  root.updateMatrixWorld(true);
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh) return;
    const p = m.geometry.attributes.position;
    const e = m.matrixWorld.elements;
    const oy = e[13];
    if (Math.abs(e[1]) + Math.abs(e[9]) > 1e-6 || Math.abs(e[5] - 1) > 1e-6) return; // only translated meshes
    let changed = false;
    for (let i = 0; i < p.count; i++) if (p.getY(i) + oy < -0.08) { p.setY(i, -0.08 - oy); changed = true; }
    if (changed) m.geometry.computeVertexNormals();
  });
  animations.unshift(clip('sway', 4, [rotateTrack(sway, new V3(1, 0, 0.55), 4, (t) => wave(t) * swayAmp + wave(t, 3) * swayAmp * 0.2)]));
  if (f.falling && f.leaves) {
    const b = new THREE.Box3().setFromObject(sway);
    animations.push(fallingLeaves(root, rand, c.colors, b.max.y, Math.max(1, b.max.x - b.min.x)));
  }
  return finalize(root, { type: 'tree', variant, options: o, animations });
}
