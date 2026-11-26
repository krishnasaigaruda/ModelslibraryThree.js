import * as THREE from 'three';
import { group, mesh, rng, finalize, normalizeOptions } from '../../core/utils.js';
import { rotateTrack, clip, wave } from '../../core/animation.js';
import { sweep, merge, paintVertices, leafCards, blob, fbm, noise3, clumps, snowify, snowMound, leafLitter, bladeGeometry, place, instanced, seedOf, vcMat, checkVariant, fadeColors, potGeometry, surfaceCards, groundGuard, sprayGeometry, sprigTexture, cardMaterial, barkMaterial } from './common.js';

const V3 = THREE.Vector3;
const UP = new V3(0, 1, 0);

/* ================================ Bush ================================ */

/*
 * Shrubs grow from a woody base: several stems branch from the ground up into
 * the foliage clusters (so nothing floats). form = silhouette from references:
 * mound, upright, spreading, arching (forsythia), canes (rose), low (heather),
 * topiary-ball / -cone / -spiral / -tiered, fern, conifer (juniper).
 */
export const BUSH_VARIANTS = {
  round: { form: 'mound', h: 1.1, w: 1.2, leaf: 'glossy', size: 0.3, colors: ['#3e6b2c', '#4a7a33', '#567f38', '#36612a'], group: 'deciduous' },
  flowering: { form: 'mound', h: 1.0, w: 1.1, leaf: 'broad', size: 0.28, colors: ['#3b6a2e', '#477532', '#53803a'], flowers: { kind: 'small', colors: ['#e84a7f', '#f27aa3', '#c2185b'] }, group: 'deciduous' },
  fern: { form: 'fern', h: 0.8, w: 1.4, colors: ['#4e8a34', '#5c9a3c', '#447d2d'], group: 'fern' },
  boxwood: { form: 'topiary-ball', h: 0.9, w: 0.9, leaf: 'small', size: 0.16, colors: ['#2f5a29', '#356530', '#2a5226'], group: 'topiary' },
  hydrangea: { form: 'mound', h: 1.2, w: 1.4, leaf: 'broad', size: 0.36, colors: ['#3f6e2e', '#4a7a34'], flowers: { kind: 'mophead', colors: ['#6f8ad8', '#8aa0e0', '#9a8ad6', '#7c9ae6'] }, group: 'deciduous' },
  rhododendron: { form: 'mound', h: 1.6, w: 1.8, leaf: 'glossy', size: 0.4, colors: ['#2f5726', '#386230', '#2a4f24'], flowers: { kind: 'truss', colors: ['#c2378a', '#d24a9a', '#b02a7a'] }, group: 'evergreen' },
  azalea: { form: 'mound', h: 0.8, w: 1.1, leaf: 'small', size: 0.22, colors: ['#3a632a', '#447030'], flowers: { kind: 'small', colors: ['#f04a6a', '#ff6a80', '#e83a5a'], dense: 2.2 }, group: 'evergreen' },
  'rose-bush': { form: 'canes', h: 1.2, w: 1.1, leaf: 'broad', size: 0.24, colors: ['#335e28', '#3c6a2e'], flowers: { kind: 'rose', colors: ['#b3122e', '#c81e3a', '#9a0f28'] }, group: 'deciduous' },
  holly: { form: 'upright', h: 1.8, w: 1.2, leaf: 'glossy', size: 0.26, colors: ['#1f4220', '#264a26', '#1c3c1e'], berries: '#c8141c', group: 'evergreen' },
  'juniper-shrub': { form: 'conifer', h: 0.6, w: 2.0, colors: ['#3e5e4a', '#486a52', '#365444'], group: 'conifer' },
  blueberry: { form: 'upright', h: 1.2, w: 1.0, leaf: 'small', size: 0.22, colors: ['#4a7a3a', '#567f40'], berries: '#3a4a8a', group: 'deciduous' },
  forsythia: { form: 'arching', h: 1.8, w: 2.0, leaf: 'blossom', size: 0.26, colors: ['#f2c41e', '#f6d030', '#e8b818'], green: ['#4a7a33', '#568538'], group: 'blossom' },
  hibiscus: { form: 'upright', h: 1.6, w: 1.2, leaf: 'glossy', size: 0.3, colors: ['#2f5a28', '#386630'], flowers: { kind: 'hibiscus', colors: ['#d81e2a', '#e8303c', '#c8102a'] }, group: 'evergreen' },
  heather: { form: 'low', h: 0.4, w: 0.9, leaf: 'needle', size: 0.18, colors: ['#4a6a3a', '#546f40'], flowers: { kind: 'tiny', colors: ['#a24a9a', '#b85aa8', '#8e3a8a'], dense: 3 }, group: 'evergreen' },
  barberry: { form: 'mound', h: 0.9, w: 1.0, leaf: 'small', size: 0.2, colors: ['#7a1e24', '#8e2a2a', '#6a1820'], berries: '#c8202a', group: 'deciduous' },
  lilac: { form: 'upright', h: 2.2, w: 1.6, leaf: 'heart', size: 0.34, colors: ['#3f6e2e', '#4a7a34'], flowers: { kind: 'panicle', colors: ['#a88ad8', '#b89ae0', '#9a7acc'] }, group: 'deciduous' },
  camellia: { form: 'upright', h: 1.8, w: 1.3, leaf: 'glossy', size: 0.3, colors: ['#1f4a22', '#265426'], flowers: { kind: 'camellia', colors: ['#e0506a', '#f0708a', '#ffffff'] }, group: 'evergreen' },
  'topiary-cone': { form: 'topiary-cone', h: 1.6, w: 0.8, leaf: 'small', size: 0.16, colors: ['#2a5226', '#305a2a'], group: 'topiary' },
  'topiary-spiral': { form: 'topiary-spiral', h: 1.7, w: 0.8, leaf: 'small', size: 0.15, colors: ['#2a5226', '#305a2a'], group: 'topiary' },
  'topiary-tiered': { form: 'topiary-tiered', h: 1.6, w: 0.7, leaf: 'small', size: 0.15, colors: ['#2a5226', '#305a2a'], group: 'topiary' },
};

const BT = {
  deciduous: ['small', 'large', 'autumn', 'winter', 'snow', 'overgrown', 'pruned', 'dry'],
  blossom: ['small', 'large', 'summer', 'autumn', 'winter', 'snow', 'overgrown', 'pruned'],
  evergreen: ['small', 'large', 'snow', 'overgrown', 'pruned', 'dry', 'bud'],
  topiary: ['small', 'large', 'snow', 'overgrown', 'potted', 'dry'],
  conifer: ['small', 'large', 'snow', 'overgrown', 'dry'],
  fern: ['small', 'large', 'autumn', 'young', 'dry', 'potted'],
};
export const BUSH_TRIMS = Object.fromEntries(Object.entries(BUSH_VARIANTS).map(([k, v]) => [k, BT[v.group]]));

const AUTUMN_SHRUB = ['#c0502a', '#d06a2a', '#b84028', '#d89a3a'];
const DRY = ['#8a7a42', '#9a8448', '#7a6a3a', '#5e6a34'];

/** Envelope point inside a shrub form (relative 0..1 height `t`). */
function formRadius(form, t) {
  switch (form) {
    case 'upright': return 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1));
    case 'low': return Math.sqrt(Math.max(0, 1 - t * t));
    case 'arching': return 0.5 + 0.5 * t;
    case 'canes': return 0.6 + 0.4 * t;
    default: return Math.sqrt(Math.max(0, 1 - Math.pow(t * 2 - 1, 2))) * 0.9 + 0.1;
  }
}

function shrubStems(v, rand, H, W, nStems, { arching = false, wind = null } = {}) {
  const geos = [];
  const tips = [];
  const centers = [];
  for (let s = 0; s < nStems; s++) {
    const a = (s / nStems) * Math.PI * 2 + rand() * 0.7;
    const out = new V3(Math.cos(a), 0, Math.sin(a));
    const base = out.clone().multiplyScalar(0.04 + rand() * 0.06);
    base.y = -0.02;
    const lean = arching ? 0.8 + rand() * 0.3 : 0.25 + rand() * 0.45;
    const reach = W * 0.5 * lean;
    const top = arching ? base.clone().addScaledVector(out, reach * 1.1).add(new V3(0, H * (0.55 + rand() * 0.25), 0)) : base.clone().addScaledVector(out, reach * 0.7).add(new V3(0, H * (0.7 + rand() * 0.3), 0));
    const pts = arching
      ? [base, base.clone().addScaledVector(out, reach * 0.25).add(new V3(0, H * 0.7, 0)), base.clone().addScaledVector(out, reach * 0.75).add(new V3(0, H * 0.9, 0)), top.clone().addScaledVector(out, reach * 0.3).add(new V3(0, -H * 0.25, 0))]
      : [base, base.clone().addScaledVector(out, reach * 0.2).add(new V3(0, H * 0.35, 0)), top];
    if (wind) for (const p of pts) p.addScaledVector(wind, p.y * 0.25);
    const r0 = 0.008 + H * 0.009;
    geos.push(sweep(pts, (t) => r0 * (1 - t * 0.7), { radial: 5, segments: 8 }));
    const curve = new THREE.CatmullRomCurve3(pts);
    // side shoots carry most foliage clusters
    const shoots = 2 + Math.floor(rand() * 3);
    for (let k = 0; k < shoots; k++) {
      const t = 0.4 + (k / shoots) * 0.55 + rand() * 0.05;
      const at = curve.getPointAt(Math.min(1, t));
      const ang = a + (rand() - 0.5) * 2.2;
      const d = new V3(Math.cos(ang), 0.4 + rand() * 0.6, Math.sin(ang)).normalize();
      const len = H * (0.18 + rand() * 0.2);
      const end = at.clone().addScaledVector(d, len);
      if (wind) end.addScaledVector(wind, len * 0.4);
      geos.push(sweep([at, at.clone().lerp(end, 0.5).add(new V3(0, len * 0.08, 0)), end], (tt) => r0 * 0.55 * (1 - tt * 0.7), { radial: 4, segments: 5 }));
      tips.push(end);
    }
    tips.push(arching ? pts.at(-1) : top);
    // foliage reaches down the stems too (shrubs are leafy to the ground, not lollipops)
    for (const t of arching ? [0.35, 0.6] : [0.22, 0.45]) tips.push(curve.getPointAt(t));
  }
  for (const p of tips) centers.push({ p: p.clone(), r: 0 });
  return { geos, tips, centers };
}

function addFoliage(root, v, f, rand, seed, centers, colors, leafKind, size, { shell = [0.25, 1.1], per = 22 } = {}) {
  const cards = leafCards(centers, { rand, kind: leafKind, size, perCenter: Math.round(per * f.dens), colors: f.snow ? colors.concat(['#eef2f6', '#e8eef4']) : colors, shell });
  if (cards) root.add(cards);
  else {
    const cl = clumps(centers.map((c) => ({ p: c.p, r: c.r * 0.9 })), { rand, colors, seed, detail: 2 });
    cl.name = 'foliage';
    if (f.snow) snowify(cl.geometry, 0.9, { seed, threshold: 0.2 });
    root.add(cl);
  }
}

/** Flower/berry decorations on the foliage surface. */
function addShrubFlowers(root, centers, fl, rand, colorOverride) {
  const cols = colorOverride ? [colorOverride] : fl.colors;
  const items = [];
  let geo;
  let mat = new THREE.MeshStandardMaterial({ roughness: 0.55, color: '#ffffff', side: THREE.DoubleSide });
  const onShell = (c, k = 0.85, upBias = 0.2) => {
    const d = new V3(rand() * 2 - 1, rand() * 1.4 - 0.4 + upBias, rand() * 2 - 1).normalize();
    return { p: c.p.clone().addScaledVector(d, c.r * k), d };
  };
  const per = Math.round((fl.dense ?? 1) * 5);
  const qUp = (d) => new THREE.Quaternion().setFromUnitVectors(UP, d);
  switch (fl.kind) {
    case 'mophead': // hydrangea: big domed heads of 4-sepal florets
      geo = blob(0.13, { detail: 3, seed: 4, amount: 0.3, freq: 9, scale: [1, 0.8, 1] });
      mat = new THREE.MeshStandardMaterial({ roughness: 0.9, color: '#ffffff' });
      for (const c of centers) { const { p, d } = onShell(c, 0.8, 0.5); items.push({ p, q: qUp(d), c: cols[Math.floor(rand() * cols.length)] }); }
      break;
    case 'truss': // rhododendron: rounded trusses of trumpet flowers
      geo = blob(0.09, { detail: 2, seed: 7, amount: 0.3, freq: 5 });
      for (const c of centers) for (let i = 0; i < 2; i++) { const { p, d } = onShell(c, 0.85, 0.4); items.push({ p, q: qUp(d), c: cols[Math.floor(rand() * cols.length)] }); }
      break;
    case 'panicle': // lilac: upright cones
      geo = blob(0.06, { detail: 2, seed: 9, amount: 0.3, freq: 6, scale: [1, 2.6, 1] });
      for (const c of centers) for (let i = 0; i < 2; i++) { const { p, d } = onShell(c, 0.8, 0.8); items.push({ p, q: qUp(d.clone().lerp(UP, 0.6).normalize()), c: cols[Math.floor(rand() * cols.length)] }); }
      break;
    case 'rose':
    case 'camellia': {
      // layered cupped bloom
      const layers = [];
      for (let li = 0; li < 3; li++) {
        for (let i = 0; i < 5; i++) {
          const b = bladeGeometry(0.045 - li * 0.008, 0.04 - li * 0.006, { curl: -0.25, cup: 0.6, color: '#ffffff', tip: 0.3 });
          b.rotateX(fl.kind === 'camellia' ? 1.2 - li * 0.35 : 0.85 - li * 0.3);
          b.rotateY((i / 5) * Math.PI * 2 + li * 0.6);
          layers.push(b);
        }
      }
      geo = merge(layers);
      for (const c of centers) for (let i = 0; i < 2; i++) { const { p, d } = onShell(c, 0.85, 0.4); items.push({ p, q: qUp(d), c: cols[Math.floor(rand() * cols.length)] }); }
      break;
    }
    case 'hibiscus': {
      const pet = [];
      for (let i = 0; i < 5; i++) {
        const b = bladeGeometry(0.075, 0.06, { curl: 0.1, cup: 0.2, color: '#ffffff', tip: 0.4 });
        b.rotateX(1.15);
        b.rotateY((i / 5) * Math.PI * 2);
        pet.push(b);
      }
      const st = new THREE.CylinderGeometry(0.004, 0.004, 0.09, 5);
      st.translate(0, 0.045, 0);
      pet.push(paintVertices(st, () => new THREE.Color('#f2d040')));
      geo = merge(pet);
      for (const c of centers) { const { p, d } = onShell(c, 0.88, 0.3); items.push({ p, q: qUp(d), c: cols[Math.floor(rand() * cols.length)] }); }
      break;
    }
    case 'tiny':
      geo = new THREE.IcosahedronGeometry(0.012, 0);
      for (const c of centers) for (let i = 0; i < per * 3; i++) { const { p } = onShell(c, 0.6 + rand() * 0.35, 0.3); items.push({ p, c: cols[Math.floor(rand() * cols.length)] }); }
      break;
    case 'berries':
      geo = new THREE.IcosahedronGeometry(0.011, 1);
      mat = new THREE.MeshStandardMaterial({ roughness: 0.35, color: '#ffffff' });
      for (const c of centers) for (let i = 0; i < 7; i++) { const { p } = onShell(c, 0.6 + rand() * 0.25, -0.2); items.push({ p, c: cols[0] }); }
      break;
    default: { // small 5-petal flowers
      const pet = [];
      for (let i = 0; i < 5; i++) {
        const b = bladeGeometry(0.03, 0.022, { curl: 0.05, cup: 0.2, color: '#ffffff', tip: 0.4 });
        b.rotateX(1.3);
        b.rotateY((i / 5) * Math.PI * 2);
        pet.push(b);
      }
      geo = merge(pet);
      for (const c of centers) for (let i = 0; i < per; i++) { const { p, d } = onShell(c, 0.85, 0.3); items.push({ p, q: qUp(d), c: cols[Math.floor(rand() * cols.length)] }); }
    }
  }
  root.add(instanced(geo, mat, items, fl.kind === 'berries' ? 'berries' : 'flowers'));
}

/** Clipped topiary body: dense smooth leaf shell on a short trunk. */
function topiaryShapes(form, H, W) {
  // returns [{ c: V3, sx, sy, sz }] ellipsoids (or spiral) from the ground up
  if (form === 'topiary-ball') return [{ c: new V3(0, W * 0.47, 0), sx: W / 2, sy: W / 2, sz: W / 2 }];
  if (form === 'topiary-tiered') return [0.3, 0.62, 0.9].map((t, i) => ({ c: new V3(0, H * t, 0), sx: W * (0.5 - i * 0.1), sy: W * (0.36 - i * 0.06), sz: W * (0.5 - i * 0.1) }));
  return null;
}

function buildTopiary(root, v, f, rand, seed, H, W, colors) {
  const geos = [];
  const centers = [];
  const shapes = topiaryShapes(v.form, H, W);
  const amount = f.trim === 'overgrown' ? 0.16 : 0.035;
  const potH = f.trim === 'potted' ? 0.4 : 0;
  const lift = potH;
  // trunk from the soil to the top
  const trunkTop = H * (v.form === 'topiary-ball' ? 0.5 : 0.95) + lift;
  geos.push(paintVertices(sweep([new V3(0, lift - 0.02, 0), new V3(0, trunkTop, 0)], () => 0.025, { radial: 6, segments: 4 }), () => new THREE.Color('#5a4636')));
  const leaf = [];
  const addBody = (g) => {
    const c0 = colors.map((c) => new THREE.Color(c));
    paintVertices(g, (p, n) => c0[Math.floor((noise3(p.x * 9, p.y * 9, p.z * 9, seed) * 0.5 + 0.5) * c0.length) % c0.length].clone().multiplyScalar(0.4 + 0.3 * Math.max(0, n.y) + 0.3 * fbm(p.x * 40, p.y * 40, p.z * 40, seed, 2)));
    leaf.push(g);
  };
  if (shapes) {
    for (const s of shapes) {
      const g = blob(1, { detail: 4, seed: seed + s.c.y, amount, freq: 5 });
      g.scale(s.sx, s.sy, s.sz);
      g.translate(s.c.x, s.c.y + lift, s.c.z);
      if (v.form === 'topiary-ball' && !potH) {
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, 0);
        g.computeVertexNormals();
      }
      addBody(g);
      centers.push({ p: s.c.clone().add(new V3(0, lift, 0)), r: Math.max(s.sx, s.sy) });
    }
  } else if (v.form === 'topiary-cone') {
    const g = new THREE.ConeGeometry(W / 2, H * 0.92, 40, 16);
    g.translate(0, H * 0.46 + 0.08 + lift, 0);
    const gg = blob(1, { detail: 1 }); void gg;
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const n = 1 + amount * fbm(x * 5, y * 5, z * 5, seed, 3);
      p.setXYZ(i, x * n, y, z * n);
    }
    g.computeVertexNormals();
    addBody(g);
    for (let t = 0.15; t < 0.9; t += 0.2) centers.push({ p: new V3(0, H * t + lift, 0), r: (W / 2) * (1 - t) });
  } else {
    // spiral: a thick tube coiling up around the trunk
    const pts = [];
    const turns = 3.2;
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      const r = (W / 2) * (1 - t * 0.75) * 0.6;
      pts.push(new V3(Math.cos(t * turns * Math.PI * 2) * r, 0.12 + t * (H - 0.25) + lift, Math.sin(t * turns * Math.PI * 2) * r));
    }
    const g = sweep(pts, (t, a) => (W / 2) * (1 - t * 0.7) * 0.42 * (1 + amount * fbm(Math.cos(a) * 3, t * 20, Math.sin(a) * 3, seed, 2)), { radial: 14, segments: 160 });
    addBody(g);
    // the coil's base rests on a low clipped dome so it's grounded
    const base = blob(1, { detail: 3, seed, amount });
    base.scale(W * 0.32, 0.14, W * 0.32);
    base.translate(0, 0.12 + lift, 0);
    addBody(base);
    for (let i = 0; i < 64; i += 8) centers.push({ p: pts[i].clone(), r: (W / 2) * 0.4 });
  }
  const body = merge(leaf);
  if (f.snow) snowify(body, 1, { seed, threshold: 0.25 });
  mesh(body, vcMat(1), { parent: root, name: 'topiary' });
  mesh(merge(geos), vcMat(0.9), { parent: root, name: 'trunk' });
  const cards = surfaceCards(body, { rand, kind: v.leaf, density: 420, size: v.size * 0.9, colors, offset: f.trim === 'overgrown' ? 0.05 : 0.012, minY: lift + 0.02 });
  if (cards) root.add(cards);
  if (cards && f.snow) root.add(surfaceCards(body, { rand, kind: 'small', density: 600, size: 0.14, colors: ['#f4f6f9', '#eef2f6'], offset: 0.03, minNy: 0.5, name: 'snow_cover' }));
  if (potH) mesh(potGeometry(Math.max(0.2, W * 0.32), potH), vcMat(0.7), { parent: root, name: 'pot' });
}

function buildFernBush(root, v, f, rand, seed, size, colors) {
  const fronds = [];
  const young = f.trim === 'young';
  const n = (young ? 9 : 16) + Math.floor(rand() * 8);
  const lift = f.trim === 'potted' ? 0.32 : 0;
  for (let i = 0; i < n; i++) {
    const len = (0.7 + rand() * 0.5) * size * (young ? 0.6 : 1);
    const N = 18;
    const rib = [];
    const liftK = (0.9 + rand() * 0.5) * (f.trim === 'dry' ? 0.6 : 1);
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      rib.push(new V3(t * len * 0.85, Math.sin(t * Math.PI * 0.75) * len * 0.55 * liftK - t * t * len * (f.trim === 'dry' ? 0.6 : 0.3), 0));
    }
    const parts = [paintVertices(sweep(rib, (t) => 0.008 * (1 - t), { radial: 3, segments: N }), () => new THREE.Color('#3d5f25'))];
    for (let k = 1; k < N; k++) {
      const t = k / N;
      const ll = Math.sin(Math.PI * t) * len * 0.22 + 0.02;
      for (const s of [1, -1]) {
        const lf = bladeGeometry(ll, ll * 0.22, { curl: -0.2, color: colors[k % colors.length] });
        lf.rotateZ(-s * (Math.PI / 2 - 0.35));
        lf.rotateX(s * 0.25);
        lf.translate(rib[k].x, rib[k].y, rib[k].z);
        parts.push(lf);
      }
    }
    fronds.push(place(merge(parts), new V3(0, 0.02 + lift, 0), (i / n) * Math.PI * 2 + rand() * 0.3, 0, 0));
  }
  if (young) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const st = sweep([new V3(0, lift, 0), new V3(Math.cos(a) * 0.05, 0.15 + lift, Math.sin(a) * 0.05), new V3(Math.cos(a) * 0.08, 0.3 + lift, Math.sin(a) * 0.08)], () => 0.008, { radial: 4, segments: 5 });
      fronds.push(paintVertices(st, () => new THREE.Color('#6a7a3a')));
      const coil = new THREE.TorusGeometry(0.03, 0.011, 6, 12, Math.PI * 1.7);
      coil.rotateY(a);
      coil.translate(Math.cos(a) * 0.1, 0.32 + lift, Math.sin(a) * 0.1);
      fronds.push(paintVertices(coil, () => new THREE.Color('#7a8a3a')));
    }
  }
  const crownBase = new THREE.SphereGeometry(0.06, 8, 6);
  crownBase.scale(1, 0.6, 1);
  crownBase.translate(0, lift + 0.02, 0);
  fronds.push(paintVertices(crownBase, () => new THREE.Color('#4a3a28')));
  const fg = merge(fronds);
  const fp = fg.attributes.position;
  for (let i = 0; i < fp.count; i++) if (fp.getY(i) < 0.005) fp.setY(i, 0.005); // drooping tips rest on the ground
  fg.computeVertexNormals();
  mesh(fg, vcMat(0.7, THREE.DoubleSide), { parent: root, name: 'fronds' });
  if (lift) mesh(potGeometry(0.22, lift), vcMat(0.7), { parent: root, name: 'pot' });
}

function buildJuniperShrub(root, v, f, rand, seed, H, W, colors) {
  const bark = [];
  const sprays = [];
  const n = 9 + Math.floor(rand() * 4);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.4;
    const out = new V3(Math.cos(a), 0, Math.sin(a));
    const L = W * (0.35 + rand() * 0.2);
    const pts = [new V3(0, 0.02, 0), out.clone().multiplyScalar(L * 0.4).add(new V3(0, H * 0.6, 0)), out.clone().multiplyScalar(L).add(new V3(0, H * 0.35, 0))];
    bark.push(paintVertices(sweep(pts, (t) => 0.03 * (1 - t * 0.7), { radial: 5, segments: 8 }), () => new THREE.Color('#6a4e3c')));
    const curve = new THREE.CatmullRomCurve3(pts);
    for (let k = 0; k < 8; k++) {
      const t = 0.3 + (k / 8) * 0.7;
      const at = curve.getPointAt(t);
      for (const sgn of [1, -1]) {
        const d = out.clone().applyAxisAngle(UP, sgn * (0.5 + rand() * 0.5));
        d.y = 0.25;
        const base = new THREE.Color(colors[Math.floor(rand() * colors.length)]);
        const g = sprayGeometry(0.35 + rand() * 0.2, 0.22, d.normalize(), { color: base.clone().multiplyScalar(0.6), colorTip: f.snow && rand() < 0.7 ? new THREE.Color('#f2f5f8') : base, droop: 0.05, curl: 0.3 });
        g.translate(at.x, at.y, at.z);
        sprays.push(g);
      }
    }
  }
  mesh(merge(bark), barkMaterial('fibrous'), { parent: root, name: 'stems' });
  mesh(merge(sprays), cardMaterial(sprigTexture('fir')), { parent: root, name: 'foliage' });
}

export function createBush(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('bush', BUSH_VARIANTS, BUSH_TRIMS, o.variant, o.trim);
  const v = BUSH_VARIANTS[variant];
  const trim = o.trim ?? null;
  const seed = seedOf(o, 21 + variant.length);
  const rand = rng(seed * 31 + 5);
  const root = group(`bush-${variant}${trim ? `-${trim}` : ''}`);
  const sway = group('sway', { parent: root });
  const k = (o.size ?? 1) * (trim === 'small' ? 0.55 : trim === 'large' ? 1.5 : 1);
  // small = young open shrub (narrow, few stems); large = old, sprawling and wide
  const H = v.h * k * (trim === 'pruned' ? 0.85 : 1);
  const W = v.w * k * (trim === 'overgrown' ? 1.3 : trim === 'pruned' ? 0.85 : trim === 'large' ? 1.45 : trim === 'small' ? 0.7 : 1);
  const f = { dens: 1, snow: trim === 'snow', trim };
  // forsythia-style shrubs bloom on bare wood (colors = blossom); `green` = their summer leaves
  let colors = o.color ? [o.color] : v.colors;
  let leaves = true;
  let flowers = v.flowers;
  if (trim === 'autumn') { colors = AUTUMN_SHRUB; flowers = null; f.dens = 0.7; }
  if (trim === 'winter' || (trim === 'snow' && v.group !== 'evergreen' && v.group !== 'topiary' && v.group !== 'conifer')) { leaves = false; flowers = null; }
  if (trim === 'snow') flowers = null;
  if (trim === 'dry') { colors = DRY; flowers = null; f.dens = 0.55; }
  if (trim === 'bud') flowers = flowers ? { ...flowers, kind: 'tiny', colors: fadeColors(flowers.colors, 0.35, '#5a8a3a') } : null;
  if (trim === 'overgrown') f.dens = 1.35;
  if (trim === 'summer') { colors = v.green ?? colors; }

  if (v.form.startsWith('topiary')) buildTopiary(sway, v, f, rand, seed, H, W, colors);
  else if (v.form === 'fern') buildFernBush(sway, v, f, rand, seed, k, trim === 'autumn' ? ['#a87a3a', '#b88a42', '#987032'] : trim === 'dry' ? DRY : colors);
  else if (v.form === 'conifer') buildJuniperShrub(sway, v, f, rand, seed, H, W, trim === 'dry' ? DRY : colors);
  else {
    const nStems = trim === 'small' ? 3 : Math.max(3, Math.round(4 + W * 2 + (trim === 'overgrown' ? 3 : 0)));
    if (trim === 'small') f.dens = 0.6;
    const wind = trim === 'windswept' ? new V3(1, 0, 0) : null;
    const { geos, tips } = shrubStems(v, rand, H, W, nStems, { arching: v.form === 'arching' || v.form === 'canes', wind });
    // clusters around each shoot tip, shaped by the form envelope
    const centers = [];
    for (const p of tips) {
      const t = THREE.MathUtils.clamp(p.y / H, 0, 1);
      const r = Math.max(0.12, W * 0.26 * formRadius(v.form, t) * (v.form === 'low' ? 0.7 : 1));
      centers.push({ p: p.clone(), r });
    }
    if (trim === 'pruned') {
      // clipped: pull clusters onto a neat dome
      for (const c of centers) {
        const d = new V3(c.p.x / (W * 0.5), (c.p.y - H * 0.45) / (H * 0.55), c.p.z / (W * 0.5));
        if (d.length() > 0.85) c.p.set((c.p.x * 0.85) / d.length(), H * 0.45 + ((c.p.y - H * 0.45) * 0.85) / d.length(), (c.p.z * 0.85) / d.length());
      }
    }
    if (!leaves && f.snow) {
      // snow lumps caught in the twig forks
      for (const c of centers) {
        const lump = blob(0.05 + c.r * 0.25, { detail: 2, seed: c.p.x * 100, amount: 0.3, scale: [1, 0.45, 1] });
        lump.translate(c.p.x, c.p.y + 0.01, c.p.z);
        geos.push(paintVertices(lump, () => new THREE.Color('#f3f6fa')));
      }
    }
    if (!leaves) {
      // bare winter shrubs: a fine twiggy mesh at every shoot
      for (const c of centers) for (let k = 0; k < 5; k++) {
        const d = new V3(rand() * 2 - 1, 0.5 + rand(), rand() * 2 - 1).normalize();
        const e = c.p.clone().addScaledVector(d, c.r * (0.6 + rand() * 0.5));
        geos.push(sweep([c.p, c.p.clone().lerp(e, 0.5).add(new V3((rand() - 0.5) * 0.03, 0, (rand() - 0.5) * 0.03)), e], (t) => 0.004 * (1 - t * 0.7), { radial: 3, segments: 4 }));
      }
    }
    const stemGeo = merge(geos.map((g) => (g.attributes.color ? g : paintVertices(g, (p) => new THREE.Color('#5a4636').multiplyScalar(0.8 + 0.3 * fbm(p.x * 20, p.y * 20, p.z * 20, seed, 2))))));
    if (f.snow) snowify(stemGeo, 0.9, { seed });
    mesh(stemGeo, vcMat(0.9), { parent: sway, name: 'stems' });
    if (leaves) addFoliage(sway, v, f, rand, seed, centers, colors, v.leaf, v.size * Math.max(0.7, k));
    if (leaves && flowers) addShrubFlowers(sway, centers, flowers, rand, o.flowerColor);
    if (leaves && v.berries && trim !== 'small' && trim !== 'dry') addShrubFlowers(sway, centers, { kind: 'berries', colors: [v.berries] }, rand);
    if (trim === 'autumn') sway.add(leafLitter(W * 0.75, { rand, colors, kind: v.leaf === 'needle' ? 'small' : v.leaf, count: 120, size: v.size * 0.4 }));
  }
  if (f.snow) mesh(snowMound(Math.max(0.4, W * 0.6), seed), vcMat(0.85), { parent: root, name: 'snow' });
  groundGuard(root);
  const animations = [clip('sway', 3, [rotateTrack(sway, new V3(1, 0, 0.6), 3, (t) => wave(t) * (v.form.startsWith('topiary') ? 0.004 : 0.022))])];
  return finalize(root, { type: 'bush', variant, options: o, animations });
}

/* ================================ Hedge ================================ */

export const HEDGE_VARIANTS = {
  trimmed: { colors: ['#2f5a29', '#376431', '#2b5226'], amount: 0.025, leaf: 'small', L: 2, H: 1.1, D: 0.7 },
  wild: { colors: ['#3e6b2c', '#4a7a33', '#567f38'], amount: 0.09, leaf: 'broad', L: 2, H: 1.3, D: 0.9 },
  flowering: { colors: ['#35612c', '#3e6b31'], amount: 0.04, leaf: 'small', flowers: ['#f4f1ea', '#f7d6e0', '#ffffff'], L: 2, H: 1.2, D: 0.75 },
  boxwood: { colors: ['#2a5226', '#305a2a', '#264a22'], amount: 0.02, leaf: 'small', L: 2, H: 0.5, D: 0.45 },
  privet: { colors: ['#3a6a2e', '#447434', '#386028'], amount: 0.03, leaf: 'small', L: 2.5, H: 1.9, D: 0.8 },
  yew: { colors: ['#1c3a20', '#224424', '#1a341c'], amount: 0.02, leaf: 'needle', L: 2.5, H: 1.7, D: 0.9 },
  beech: { colors: ['#4a7a33', '#568538', '#3f6e2c'], amount: 0.04, leaf: 'broad', L: 2.5, H: 1.6, D: 0.7, deciduous: true },
  laurel: { colors: ['#2a5a24', '#336628', '#285020'], amount: 0.06, leaf: 'glossy', L: 2.5, H: 1.8, D: 1.0 },
  corner: { colors: ['#2f5a29', '#376431', '#2b5226'], amount: 0.025, leaf: 'small', L: 2, H: 1.1, D: 0.7, shape: 'corner' },
  arch: { colors: ['#2f5a29', '#376431', '#2b5226'], amount: 0.03, leaf: 'small', L: 2.2, H: 2.6, D: 0.7, shape: 'arch' },
};
export const HEDGE_TRIMS = Object.fromEntries(Object.keys(HEDGE_VARIANTS).map((k) => [k, ['short', 'long', 'tall', 'autumn', 'snow', 'overgrown', 'gappy', 'dry']]));

function hedgeBlock(L, H, D, amount, seed, { gaps = false } = {}) {
  const g = new THREE.BoxGeometry(L, H, D, Math.max(4, Math.round(L * 20)), Math.max(4, Math.round(H * 20)), Math.max(4, Math.round(D * 20)));
  const p = g.attributes.position;
  const vv = new V3();
  for (let i = 0; i < p.count; i++) {
    vv.fromBufferAttribute(p, i);
    const nx = vv.x / (L / 2);
    const ny = vv.y / (H / 2);
    const nz = vv.z / (D / 2);
    const k = 0.12;
    vv.x = Math.sign(nx) * (1 - k * Math.max(Math.abs(ny), Math.abs(nz)) ** 6) * Math.abs(nx) * (L / 2);
    vv.y = (vv.y + H / 2) * (1 - k * 0.5 * Math.max(Math.abs(nx) ** 8, Math.abs(nz) ** 8));
    vv.z = vv.z * (1 - k * Math.abs(ny) ** 6);
    const n = fbm(vv.x * 3, vv.y * 3, vv.z * 3, seed, 4);
    let out = 1 + amount * n * (vv.y > 0.02 ? 1 : 0);
    if (gaps && vv.y > 0.15) {
      const hole = fbm(vv.x * 1.6, vv.y * 1.6, vv.z * 1.6, seed + 11, 2);
      if (hole > 0.22) out -= (hole - 0.22) * 2.2;
    }
    vv.x *= Math.max(0.5, out);
    vv.z *= Math.max(0.3, out);
    if (vv.y > H * 0.9) vv.y += amount * n * 0.6;
    p.setXYZ(i, vv.x, Math.max(0, vv.y), vv.z);
  }
  g.computeVertexNormals();
  return g;
}

export function createHedge(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('hedge', HEDGE_VARIANTS, HEDGE_TRIMS, o.variant, o.trim);
  const v = HEDGE_VARIANTS[variant];
  const trim = o.trim ?? null;
  let colors = o.color ? [o.color] : v.colors;
  if (trim === 'autumn') colors = v.deciduous ? ['#b8702a', '#a85e24', '#c88a3a'] : colors.map((c) => `#${new THREE.Color(c).lerp(new THREE.Color('#8a6a2a'), 0.25).getHexString()}`);
  if (trim === 'dry') colors = ['#7a7a3a', '#8a7a42', '#5e6a32', '#9a8448'];
  const seed = seedOf(o, 9);
  const rand = rng(seed * 13 + 1);
  const L = (o.length ?? v.L) * (trim === 'long' ? 2 : trim === 'short' ? 0.5 : 1);
  const H = (o.height ?? v.H) * (trim === 'tall' ? 1.6 : trim === 'short' ? 0.9 : 1);
  const D = o.depth ?? v.D;
  const amount = v.amount * (trim === 'overgrown' ? 3.2 : 1);
  const root = group(`hedge-${variant}${trim ? `-${trim}` : ''}`);
  const blocks = [];
  const centers = [];
  const addBlock = (l, h, d, x, z, rotY = 0, y = 0) => {
    const g = hedgeBlock(l, h, d, amount, seed + blocks.length * 7, { gaps: trim === 'gappy' });
    g.rotateY(rotY);
    g.translate(x, y, z);
    blocks.push(g);
    const n = Math.max(2, Math.round(l * 8));
    for (let i = 0; i < n; i++) {
      const along = (rand() - 0.5) * l * 0.92;
      const across = (rand() - 0.5) * d * 0.55;
      const p = new V3(along, y + 0.15 + rand() * (h - 0.2), across).applyAxisAngle(UP, rotY).add(new V3(x, 0, z));
      centers.push({ p, r: d * 0.45 });
    }
  };
  if (v.shape === 'corner') {
    addBlock(L, H, D, 0, 0);
    addBlock(L, H, D, L / 2 - D / 2, L / 2 - D / 2 + D / 2, Math.PI / 2);
  } else if (v.shape === 'arch') {
    const pw = D;
    const gap = Math.max(1.0, L - 2 * pw);
    addBlock(pw, H * 0.72, D, -(gap / 2 + pw / 2), 0);
    addBlock(pw, H * 0.72, D, gap / 2 + pw / 2, 0);
    // arched top: a thick half-ring resting on both pillars
    const R = gap / 2 + pw / 2;
    const ring = new THREE.TorusGeometry(R, pw * 0.55, 14, 28, Math.PI);
    ring.scale(1, 0.75, D / (pw * 1.1));
    const p = ring.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const n = 1 + amount * fbm(x * 3, y * 3, z * 3, seed, 3);
      p.setXYZ(i, x * n, y * n, z * n);
    }
    ring.computeVertexNormals();
    ring.translate(0, H * 0.7, 0);
    blocks.push(ring);
    for (let i = 0; i < 12; i++) {
      const a = (i / 11) * Math.PI;
      centers.push({ p: new V3(Math.cos(a) * R, H * 0.7 + Math.sin(a) * R * 0.75, 0), r: pw * 0.45 });
    }
  } else addBlock(L, H, D, 0, 0);
  const g = merge(blocks);
  const cols = colors.map((c) => new THREE.Color(c));
  paintVertices(g, (pp, n) => cols[Math.floor((noise3(pp.x * 2, pp.y * 2, pp.z * 2, seed) * 0.5 + 0.5) * cols.length) % cols.length].clone().multiplyScalar(0.42 + 0.25 * Math.max(0, n.y) + 0.3 * fbm(pp.x * 30, pp.y * 30, pp.z * 30, seed, 2)));
  if (trim === 'gappy') {
    // twiggy dark interior shows through the holes
    const col = g.attributes.color;
    const nrm = g.attributes.normal;
    void nrm;
    for (let i = 0; i < col.count; i++) {
      const x = g.attributes.position.getX(i);
      const y = g.attributes.position.getY(i);
      const z = g.attributes.position.getZ(i);
      if (y > 0.15 && fbm(x * 1.6, y * 1.6, z * 1.6, seed + 11, 2) > 0.3) col.setXYZ(i, 0.16, 0.12, 0.08);
    }
  }
  if (trim === 'snow') snowify(g, 1, { seed, threshold: 0.3 });
  mesh(g, vcMat(1), { parent: root, name: 'hedge' });
  const sc0 = surfaceCards(g, { rand, kind: v.leaf, density: trim === 'gappy' ? 160 : 260, size: v.leaf === 'glossy' ? 0.2 : 0.15, colors, offset: 0.012 + amount * 0.2 });
  if (sc0) root.add(sc0);
  if (sc0 && trim === 'snow') root.add(surfaceCards(g, { rand, kind: 'small', density: 500, size: 0.16, colors: ['#f4f6f9', '#eef2f6', '#e6ecf2'], offset: 0.03, minNy: 0.55, name: 'snow_cover' }));
  if (trim === 'overgrown') {
    // long unclipped shoots sticking out of the top
    const shoots = [];
    for (let i = 0; i < Math.round(L * 6); i++) {
      const x = (rand() - 0.5) * L * 0.9;
      const z = (rand() - 0.5) * D * 0.5;
      const top = v.shape === 'arch' ? H * 0.7 : H;
      const p0 = new V3(x, top - 0.1, z);
      const p1 = p0.clone().add(new V3((rand() - 0.5) * 0.3, 0.3 + rand() * 0.35, (rand() - 0.5) * 0.3));
      shoots.push(paintVertices(sweep([p0, p0.clone().lerp(p1, 0.5).add(new V3(0.03, 0, 0)), p1], (t) => 0.007 * (1 - t * 0.6), { radial: 4, segments: 5 }), () => new THREE.Color('#5a4a32')));
      for (let k = 0; k < 4; k++) centers.push({ p: p0.clone().lerp(p1, 0.4 + k * 0.2), r: 0.08 });
    }
    mesh(merge(shoots), vcMat(0.9), { parent: root, name: 'shoots' });
    const sc = leafCards(centers.slice(-Math.round(L * 24)), { rand, kind: v.leaf, size: 0.2, perCenter: 4, colors });
    if (sc) root.add(sc);
  }
  if (v.flowers && trim !== 'snow' && trim !== 'dry' && trim !== 'autumn') {
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshStandardMaterial({ roughness: 0.6 }), Math.round(L * 40));
    im.name = 'flowers';
    const m = new THREE.Matrix4();
    for (let i = 0; i < im.count; i++) {
      const side = rand() < 0.5 ? 1 : -1;
      im.setMatrixAt(i, m.makeTranslation((rand() - 0.5) * L * 0.9, 0.15 + rand() * (H - 0.2), side * D * 0.5 * (1 + amount * 0.5)));
      im.setColorAt(i, new THREE.Color(v.flowers[i % v.flowers.length]));
    }
    root.add(im);
  }
  if (trim === 'autumn' && v.deciduous) root.add(leafLitter(Math.max(L, D) * 0.6, { rand, colors, kind: 'broad', count: 120, size: 0.07 }));
  return finalize(root, { type: 'hedge', variant, options: o, animations: [] });
}

/* ================================ Vines ================================ */

/*
 * Climbers on their supports: ivy on a timber trellis, climbing rose on a
 * fan trellis, wisteria over a pergola arch, grapevine on posts & wires,
 * morning glory up a bamboo teepee.
 */
export const VINE_VARIANTS = {
  'ivy-trellis': { support: 'trellis', leaf: 'ivy', colors: ['#2f4f24', '#3b5e2c', '#284620'] },
  'climbing-rose': { support: 'fan', leaf: 'broad', colors: ['#335e28', '#3c6a2e'], flowers: ['#c81e3a', '#e04a5a', '#f7c6d0'] },
  wisteria: { support: 'arch', leaf: 'pinnate', colors: ['#4a7a33', '#568538'], racemes: ['#9a7ad6', '#a88ae0', '#8a6acc'] },
  grapevine: { support: 'wires', leaf: 'maple', colors: ['#4a7a33', '#568538', '#3f6e2c'], grapes: ['#4a2a5a', '#5a3068', '#3a2048'] },
  'morning-glory': { support: 'teepee', leaf: 'heart', colors: ['#3f7a2e', '#4a8634'], flowers: ['#3a6ad8', '#5a8ae8', '#8a5ad0'] },
};
export const VINE_TRIMS = Object.fromEntries(Object.keys(VINE_VARIANTS).map((k) => [k, ['young', 'autumn', 'winter', 'snow', 'overgrown']]));

export function createVine(options = {}) {
  const o = normalizeOptions(options);
  const variant = checkVariant('vine', VINE_VARIANTS, VINE_TRIMS, o.variant, o.trim);
  const v = VINE_VARIANTS[variant];
  const trim = o.trim ?? null;
  const seed = seedOf(o, 31);
  const rand = rng(seed * 17 + 3);
  const root = group(`vine-${variant}${trim ? `-${trim}` : ''}`);
  const wood = new THREE.MeshStandardMaterial({ color: '#8a6a48', roughness: 0.85, name: 'timber' });
  const sup = [];
  const paths = []; // climbing paths (arrays of V3) the vine follows
  const box = (w, h, d, x, y, z, ry = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.rotateY(ry); g.translate(x, y, z); sup.push(g); };
  const cyl = (a, b, r) => { sup.push(sweep([a, b], () => r, { radial: 8, segments: 1 })); };
  if (v.support === 'trellis') {
    const W = 1.4;
    const H = 2.0;
    for (const x of [-W / 2, W / 2]) box(0.06, H, 0.06, x, H / 2, 0);
    for (let i = -3; i <= 3; i++) {
      // diagonal lattice slats
      const l = Math.hypot(W, H) * 0.9;
      for (const s of [1, -1]) { const g = new THREE.BoxGeometry(0.03, l, 0.015); g.rotateZ(s * Math.atan2(W, H)); g.translate(i * 0.2 * 0.9, H / 2, 0.035 * s); sup.push(g); }
    }
    box(W + 0.12, 0.06, 0.06, 0, H, 0);
    for (let k = 0; k < 5; k++) {
      const x0 = (rand() - 0.5) * W * 0.5;
      const pts = [];
      for (let i = 0; i <= 10; i++) pts.push(new V3(THREE.MathUtils.clamp(x0 + Math.sin(i * 0.8 + k) * W * 0.3, -W / 2, W / 2), (i / 10) * H * (0.75 + rand() * 0.2), 0.06));
      pts[0].y = 0;
      paths.push(pts);
    }
  } else if (v.support === 'fan') {
    const H = 2.2;
    for (let i = 0; i < 7; i++) {
      const a = -0.55 + (i / 6) * 1.1;
      const top = new V3(Math.sin(a) * H, Math.cos(a) * H, 0);
      cyl(new V3(0, 0, 0), top, 0.014);
      if (i % 2 === 0) paths.push([new V3(0, 0, 0.03), top.clone().multiplyScalar(0.5).setZ(0.03), top.clone().multiplyScalar(0.92).setZ(0.03)]);
    }
    for (const r of [0.8, 1.5]) { const arc = []; for (let i = 0; i <= 12; i++) { const a = -0.55 + (i / 12) * 1.1; arc.push(new V3(Math.sin(a) * r * 1.0, Math.cos(a) * r, 0)); } sup.push(sweep(arc, () => 0.01, { radial: 6, segments: 24 })); }
  } else if (v.support === 'arch') {
    const W = 1.6;
    const H = 2.3;
    for (const x of [-W / 2, W / 2]) for (const z of [-0.4, 0.4]) box(0.1, H, 0.1, x, H / 2, z);
    for (const z of [-0.4, 0.4]) box(W + 0.5, 0.12, 0.08, 0, H + 0.06, z);
    for (let i = -4; i <= 4; i++) box(0.06, 0.08, 1.1, i * 0.2, H + 0.16, 0);
    for (const x of [-W / 2, W / 2]) {
      const sx = Math.sign(x);
      paths.push([new V3(x + sx * 0.07, 0, 0.4), new V3(x + sx * 0.06, H * 0.5, 0.42), new V3(x + sx * 0.06, H + 0.05, 0.3), new V3(x * 0.4, H + 0.24, 0.1), new V3(-x * 0.2, H + 0.24, -0.2)]);
      paths.push([new V3(x + sx * 0.07, 0, -0.4), new V3(x + sx * 0.08, H * 0.5, -0.38), new V3(x + sx * 0.05, H + 0.05, -0.3), new V3(x * 0.3, H + 0.24, -0.05)]);
    }
  } else if (v.support === 'wires') {
    const L = 3;
    for (const x of [-L / 2, L / 2]) box(0.08, 1.6, 0.08, x, 0.8, 0);
    for (const y of [0.7, 1.05, 1.4]) cyl(new V3(-L / 2, y, 0), new V3(L / 2, y, 0), 0.004);
    for (const x of [-0.8, 0.6]) {
      // gnarled trunk up to the first wire then cordon arms along it
      paths.push([new V3(x, 0, 0), new V3(x + 0.05, 0.4, 0.02), new V3(x, 0.7, 0), new V3(x + 0.5, 0.72, 0), new V3(x + 0.85, 0.7, 0)]);
      paths.push([new V3(x, 0.68, 0), new V3(x - 0.4, 0.72, 0), new V3(x - 0.6, 0.7, 0)]);
      for (const dx of [-0.4, 0, 0.4, 0.8]) paths.push([new V3(x + dx, 0.7, 0), new V3(x + dx + 0.05, 1.05, 0.02), new V3(x + dx, 1.45, 0)]);
    }
  } else {
    const H = 2.1;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      cyl(new V3(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55), new V3(0, H, 0), 0.012);
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const r = 0.55 * (1 - t) + 0.02;
        const aa = a + t * 3;
        pts.push(new V3(Math.cos(aa) * r, t * H * 0.92, Math.sin(aa) * r));
      }
      paths.push(pts);
    }
  }
  const supGeo = merge(sup);
  mesh(supGeo, v.support === 'teepee' ? new THREE.MeshStandardMaterial({ color: '#c8b07a', roughness: 0.7 }) : v.support === 'fan' ? new THREE.MeshStandardMaterial({ color: '#3a3a38', roughness: 0.5, metalness: 0.6 }) : wood, { parent: root, name: 'support' });
  // vine stems along the paths
  const reach = trim === 'young' ? 0.45 : 1;
  const stems = [];
  const centers = [];
  for (const pts of paths) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const pp = curve.getSpacedPoints(30).slice(0, Math.max(3, Math.round(31 * reach)));
    const r0 = variant === 'grapevine' || variant === 'wisteria' ? 0.03 : 0.012;
    stems.push(paintVertices(sweep(pp, (t) => r0 * (1 - t * 0.6), { radial: 5, segments: pp.length * 2 }), () => new THREE.Color('#5a4632')));
    for (let i = 2; i < pp.length; i += 2) centers.push({ p: pp[i].clone(), r: 0.16 * (trim === 'overgrown' ? 1.5 : 1) });
  }
  const stemGeo = merge(stems);
  if (trim === 'snow') snowify(stemGeo, 0.9, { seed });
  mesh(stemGeo, vcMat(0.9), { parent: root, name: 'vine' });
  const leafy = trim !== 'winter' && trim !== 'snow';
  const colors = trim === 'autumn' ? ['#c0402a', '#d8602a', '#b8302a', '#e09a32'] : o.color ? [o.color] : v.colors;
  if (leafy) {
    const cards = leafCards(centers, { rand, kind: v.leaf, size: 0.22, perCenter: trim === 'overgrown' ? 16 : 9, colors });
    if (cards) root.add(cards);
    else {
      const cl = clumps(centers.map((c) => ({ p: c.p, r: c.r * 0.7 })), { rand, colors, seed, detail: 1 });
      cl.name = 'foliage';
      root.add(cl);
    }
    const fcol = o.flowerColor ? [o.flowerColor] : null;
    if (v.flowers && trim !== 'autumn' && trim !== 'young') {
      const items = centers.filter(() => rand() < 0.6).map((c) => ({ p: c.p.clone().add(new V3((rand() - 0.5) * 0.1, (rand() - 0.5) * 0.1, 0.05)), c: (fcol ?? v.flowers)[Math.floor(rand() * (fcol ?? v.flowers).length)] }));
      root.add(instanced(new THREE.IcosahedronGeometry(0.04, 1), new THREE.MeshStandardMaterial({ roughness: 0.5, color: '#ffffff' }), items, 'flowers'));
    }
    if (v.racemes && trim !== 'autumn' && trim !== 'young') {
      const g = new THREE.ConeGeometry(0.06, 0.32, 8);
      g.rotateX(Math.PI);
      g.translate(0, -0.16, 0);
      const items = centers.filter((c) => c.p.y > 1.8 && rand() < 0.8).map((c) => ({ p: c.p.clone(), c: (fcol ?? v.racemes)[Math.floor(rand() * v.racemes.length)] }));
      root.add(instanced(g, new THREE.MeshStandardMaterial({ roughness: 0.6, color: '#ffffff' }), items, 'racemes'));
    }
    if (v.grapes && trim !== 'young') {
      const items = [];
      for (const c of centers) {
        if (rand() > 0.35 || c.p.y < 0.75) continue;
        for (let k = 0; k < 18; k++) {
          const t = k / 18;
          items.push({ p: c.p.clone().add(new V3((rand() - 0.5) * 0.07 * (1 - t), -t * 0.16, (rand() - 0.5) * 0.07 * (1 - t) + 0.04)), c: v.grapes[k % 3] });
        }
      }
      root.add(instanced(new THREE.SphereGeometry(0.014, 7, 6), new THREE.MeshStandardMaterial({ roughness: 0.3, color: '#ffffff' }), items, 'grapes'));
    }
  }
  if (trim === 'autumn') root.add(leafLitter(1.0, { rand, colors, kind: v.leaf, count: 80, size: 0.08 }));
  if (trim === 'snow') {
    const top = new THREE.Box3().setFromBufferAttribute(supGeo.attributes.position);
    void top;
    mesh(snowMound(1.0, seed), vcMat(0.85), { parent: root, name: 'snow' });
  }
  return finalize(root, { type: 'vine', variant, options: o, animations: [] });
}
