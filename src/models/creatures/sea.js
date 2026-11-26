// Sea monsters rising out of a pool disc: kraken (mantle + tentacles) and sea serpent (humps + head).
import { THREE, M, group, mesh, loft, taper, skinMat, skinColor, hornMat, glowMat, crystalMat, plainMat, darkMat, keys, setup, done, animKit, swing, breathe, rock, rockMat, merge, orient, eyes, crystalCluster, spikeRow, TAU, lampTracks, rotateTrack, blob, lathe, plateRow, ribs, zigzag } from './common.js';
import { reptileHead, decorate } from './parts.js';

const SEA_TRIMS = {
  abyssal: { p: '#141a2e', b: '#2a3a5a', h: '#c8d8ff', w: '#1a2a4a', eye: '#40f0ff', glow: '#40f0ff', rough: 0.3, clear: 0.9, pattern: 'spots', spot: '#30c0ff', spikes: 'fin', lure: true, pool: 'abyss' },
  coral: { p: '#e86a5a', b: '#ffd0b0', h: '#fff0e0', w: '#f08a70', eye: '#ffe060', glow: '#ff9a7a', rough: 0.6, pattern: 'spots', spot: '#ffb030', spikes: 'leaf', coral: true, pool: 'reef' },
};

/** Pool disc per trim: water, lava, ice, swamp, abyss... Returns surface height. */
function pool(parent, T, R, rand) {
  const kind = T.pool ?? { fire: 'lava', ice: 'ice', poison: 'swamp', shadow: 'abyss', undead: 'murk', gold: 'gold', crystal: 'crystal', stone: 'stone' }[T.trim] ?? 'water';
  const h = 0.07;
  const C = { water: ['#1f5f7a', 0.86], lava: ['#ff5a10', 1], ice: ['#cfeaf6', 1], swamp: ['#3a5a20', 0.92], abyss: ['#0a1020', 0.9], murk: ['#3a4038', 0.95], gold: ['#d8a838', 1], crystal: ['#7a5ac8', 0.8], stone: ['#6a665e', 1], reef: ['#2a9ab0', 0.8] }[kind];
  let mat;
  if (kind === 'lava') mat = glowMat('#ff5a10', 0.9);
  else if (kind === 'gold') mat = M.metal('#d8a838', 0.3);
  else if (kind === 'ice') mat = new THREE.MeshPhysicalMaterial({ name: 'ice', color: C[0], roughness: 0.15, clearcoat: 1, transmission: 0, flatShading: true });
  else if (kind === 'stone') mat = rockMat('#6a665e');
  else mat = new THREE.MeshPhysicalMaterial({ name: 'water', color: C[0], roughness: 0.06, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04, transparent: C[1] < 1, opacity: C[1], emissive: kind === 'crystal' ? '#4a2a9a' : kind === 'abyss' ? '#06203a' : '#000000', emissiveIntensity: 0.4 });
  const prof = [[0, 0], [R * 0.985, 0], [R, h * 0.45], [R * 0.99, h], [R * 0.93, h * 1.03]];
  for (let i = 1; i <= 8; i++) prof.push([R * 0.93 * (1 - i / 8), h * (1.03 + 0.08 * Math.sin(i * 1.7))]);
  mesh(lathe(prof, 56), mat, { parent, name: 'pool' });
  if (kind === 'water' || kind === 'reef' || kind === 'swamp' || kind === 'murk') {
    // foam rings / ripples
    const fg = [];
    for (let i = 0; i < 3; i++) fg.push(new THREE.TorusGeometry(R * (0.35 + i * 0.22), 0.012 + 0.006 * i, 5, 48).rotateX(Math.PI / 2).translate(0, h * 1.06, 0));
    mesh(merge(fg), plainMat(kind === 'swamp' ? '#7a9a3a' : '#e8f4f6', 0.9), { parent, name: 'ripples' });
  }
  if (kind === 'ice') {
    const g = [];
    for (let i = 0; i < 9; i++) { const a = rand() * TAU, d = R * (0.5 + rand() * 0.4); g.push(new THREE.CylinderGeometry(0, 0.06 + rand() * 0.08, 0.2 + rand() * 0.35, 6).translate(Math.cos(a) * d, h + 0.08, Math.sin(a) * d)); }
    mesh(merge(g), crystalMat('#bfefff', 0.15), { parent, name: 'ice_spikes' });
  }
  if (kind === 'lava') {
    const g = [];
    for (let i = 0; i < 10; i++) { const a = rand() * TAU, d = R * (0.4 + rand() * 0.5); g.push(new THREE.DodecahedronGeometry(0.08 + rand() * 0.12, 0).scale(1, 0.5, 1).translate(Math.cos(a) * d, h, Math.sin(a) * d)); }
    mesh(merge(g), rockMat('#2a1a14'), { parent, name: 'lava_crust' });
  }
  if (kind === 'reef' || kind === 'crystal') {
    const g = [];
    for (let i = 0; i < 6; i++) { const a = rand() * TAU, d = R * (0.6 + rand() * 0.3); g.push(new THREE.DodecahedronGeometry(0.1 + rand() * 0.1, 0).translate(Math.cos(a) * d, h + 0.02, Math.sin(a) * d)); }
    mesh(merge(g), kind === 'reef' ? plainMat('#ff7a6a', 0.7) : crystalMat('#c08cff', 0.5), { parent, name: 'reef' });
  }
  return h;
}

/** Apply trim parts on a lofted body segment. */
function seaDeco(lm, T, h, name) {
  if (T.coral) spikeRow(lm, { from: 0.15, to: 0.85, n: 5, h, T, style: 'leaf', mat: plainMat('#ff8a5a', 0.7), lean: 0.2, name: `${name}_coral` });
  else decorate(lm, T, { from: 0.15, to: 0.85, n: 5, h, rib: false, plates: false, crystalT: [0.5], name });
}

/* ---------------------------------- kraken ---------------------------------- */

export const KRAKEN_VARIANTS = {
  classic: { p: '#8a2a2a', b: '#e8a090', h: '#f0d8c8', eye: '#ffd040', pattern: 'spots', spot: '#5a1818', shape: 'squid', arms: 8 },
  'giant-squid': { p: '#c8665a', b: '#f2c0b0', h: '#fff0e8', eye: '#ffe080', pattern: 'spots', spot: '#9a3a3a', shape: 'longsquid', arms: 8, longArms: true },
  octopus: { p: '#6a3a7a', b: '#c8a0d0', h: '#f0e0f0', eye: '#ffcc40', pattern: 'spots', spot: '#4a2058', shape: 'octopus', arms: 8 },
  colossal: { p: '#4a5a4a', b: '#a8b8a0', h: '#e0e8d8', eye: '#ff5030', pattern: 'cracks', shape: 'squid', arms: 10, big: true },
  'ship-wrecker': { p: '#2a4a5a', b: '#8ab0b8', h: '#e0f0f0', eye: '#ffb030', pattern: 'spots', spot: '#183040', shape: 'octopus', arms: 8, wreck: true },
};

export function createKraken(options = {}) {
  const { o, variant, T, r } = setup(options, KRAKEN_VARIANTS, 'kraken', SEA_TRIMS);
  if (T.pattern === 'scales' || T.pattern === 'bands') T.pattern = 'spots';
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const skin = skinMat(T, { clear: 0.8, rough: Math.min(T.rough, 0.4) });
  const col = skinColor(T, { freq: 2.5 });
  const big = T.big ? 1.3 : 1;
  const R = 2.6 * big;
  const wy = pool(rig, T, R, r);
  // mantle (vertical loft; a = 0 faces +X = front)
  const mantle = group('body', { parent: rig, at: [-0.35 * big, wy + 0.2 * big, 0] });
  const shape = T.shape;
  const mh = (shape === 'longsquid' ? 2.6 : shape === 'octopus' ? 1.45 : 2.0) * big;
  const lean = shape === 'octopus' ? -0.35 : -0.55;
  const prof = shape === 'octopus' ? [[0, 0.72], [0.25, 0.8], [0.55, 0.95], [0.85, 0.75], [1, 0.25]] : shape === 'longsquid' ? [[0, 0.62], [0.2, 0.66], [0.6, 0.48], [0.9, 0.25], [1, 0.06]] : [[0, 0.75], [0.25, 0.82], [0.6, 0.66], [0.9, 0.3], [1, 0.08]];
  const ml = loft([[0, 0, 0], [0, mh * 0.35, 0], [lean * mh * 0.25, mh * 0.75, 0], [lean * mh * 0.45, mh, 0]], (t) => keys(t, prof) * big, skin, { seg: 30, rad: 24, color: col, up: [1, 0, 0], bump: T.bump, parent: mantle, name: 'chest', capStart: 0.3, capEnd: shape === 'octopus' ? 0.8 : 0.5 });
  if (shape !== 'octopus') {
    // squid fins near the tip
    for (const sg of [1, -1]) {
      const s = ml.userData.surf(0.85, sg * Math.PI / 2);
      const g = new THREE.SphereGeometry(1, 14, 8).scale(0.55 * big, 0.3 * big, 0.04);
      g.rotateY(Math.PI / 2);
      g.translate(0, 0, sg * 0.42 * big);
      mesh(g, skin, { parent: mantle, at: s.c.toArray(), name: 'fin' });
    }
  }
  const lamps = eyes(ml, T, { t: shape === 'octopus' ? 0.32 : 0.2, a: 1.15, r: 0.15 * big * (T.baby ? 1.3 : 1), parent: mantle, slit: true });
  void lamps;
  if (T.lure) {
    const s = ml.userData.surf(0.7, 0);
    taper([s.p.toArray(), s.p.clone().add(new THREE.Vector3(0.5, 0.4, 0)).toArray(), s.p.clone().add(new THREE.Vector3(0.9, 0.1, 0)).toArray()], 0.04, 0.015, skin, { parent: mantle, name: 'lure_stalk', color: col });
    mesh(new THREE.SphereGeometry(0.1, 12, 8), glowMat('#40f0ff', 2), { parent: mantle, at: s.p.clone().add(new THREE.Vector3(0.9, 0.05, 0)).toArray(), name: 'lure' });
  }
  if (T.crystals) for (const t of [0.5, 0.75]) { const s = ml.userData.surf(t, Math.PI); crystalCluster(s.p, s.n, 0.35, crystalMat(T.glow, 0.4), r, { parent: mantle, count: 5 }); }
  if (T.plates) plateRow(ml, { from: 0.35, to: 0.85, n: 4, w: 0.7, l: 0.4, th: 0.06, a: Math.PI, mat: M.metal('#8d939a', 0.35), name: 'plates' });
  if (T.spikes && !T.coral && T.trim) spikeRow(ml, { from: 0.4, to: 0.95, n: 6, h: 0.3, T, a: Math.PI, lean: -0.3, name: 'mantle_spikes' });
  if (T.coral) for (const t of [0.45, 0.7]) { const s = ml.userData.surf(t, Math.PI * 0.8); crystalCluster(s.p, s.n, 0.3, plainMat('#ff8a5a', 0.7), r, { parent: mantle, count: 5, name: 'coral' }); }
  if (T.ribs) ribs(ml, { from: 0.3, to: 0.7, n: 4, a0: 0.4, a1: 2.6, r: 0.03, mat: hornMat(T, '#e3d8bb') });
  // tentacles
  const arms = T.arms;
  const suckM = plainMat(T.trim ? T.b : '#f2d0c0', 0.5);
  const tentM = skin;
  const tentacles = [];
  for (let i = 0; i < arms; i++) {
    const th = (i / arms) * TAU + 0.2;
    const pv = group(`tentacle_${i}`, { parent: rig, at: [Math.cos(th) * 0.45 * big - 0.35 * big, wy + 0.1 * big, Math.sin(th) * 0.45 * big], rot: [0, -th, 0] });
    const L = (T.longArms && i < 2 ? 3.2 : 1.8 + r() * 0.5) * big;
    const H = (0.9 + r() * 0.8) * big * (T.wreck && i < 3 ? 1.4 : 1);
    const dive = i % 3 === 2;
    const pts = dive
      ? [[0, -0.05, 0], [L * 0.2, H * 0.5, 0], [L * 0.5, H * 0.75, 0.1], [L * 0.8, H * 0.4, 0.2], [L * 0.95, -0.02, 0.15], [L * 1.05, -0.1 * big, 0.1]]
      : [[0, -0.05, 0], [L * 0.15, H * 0.55, 0], [L * 0.4, H, 0.08], [L * 0.62, H * 0.85, 0.2], [L * 0.7, H * 0.62, 0.15], [L * 0.6, H * 0.5, 0.05], [L * 0.52, H * 0.6, 0.0]];
    const rad0 = 0.16 * big;
    const tl = loft(pts, (t) => keys(t, [[0, rad0], [0.4, rad0 * 0.6], [1, rad0 * 0.12]]), tentM, { seg: 44, rad: 12, color: col, up: [0, 0, 1], parent: pv, name: `tentacle_${i}_loft`, capEnd: 1 });
    // suckers along the inside (the side facing +z of the frame = local "down" of the curl)
    const sg = [];
    for (let k = 1; k < 16; k++) {
      const t = 0.08 + k * 0.055;
      if (t > 0.95) break;
      const s = tl.userData.surf(t, Math.PI / 2);
      const rr = keys(t, [[0, rad0], [0.4, rad0 * 0.6], [1, rad0 * 0.12]]) * 0.45;
      sg.push(orient(new THREE.CylinderGeometry(rr, rr * 0.8, rr * 0.5, 10).translate(0, rr * 0.1, 0), s.p, s.n));
    }
    if (sg.length) mesh(merge(sg), suckM, { parent: pv, name: `tentacle_${i}_suckers` });
    tentacles.push(pv);
  }
  if (T.wreck) {
    // broken mast and spar gripped by the tentacles
    const wood = M.wood('walnut');
    const mast = group('wreck', { parent: rig, at: [1.6, wy - 0.1, 0.9], rot: [0.3, 0, -0.35] });
    mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 12).translate(0, 1.3, 0), wood, { parent: mast, name: 'mast' });
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 10).rotateX(Math.PI / 2).translate(0, 2.0, 0), wood, { parent: mast, name: 'spar' });
    const sail = new THREE.PlaneGeometry(1.4, 0.9, 6, 4);
    const sp = sail.attributes.position;
    for (let k = 0; k < sp.count; k++) sp.setZ(k, 0.12 * Math.sin((sp.getX(k) + 0.7) * 2.2) - (sp.getX(k) > 0.4 && sp.getY(k) < -0.1 ? 0.1 : 0));
    sail.computeVertexNormals();
    mesh(sail.rotateY(Math.PI / 2).translate(0.05, 1.52, 0), new THREE.MeshStandardMaterial({ name: 'sail', color: '#d8cfb4', roughness: 0.95, side: THREE.DoubleSide }), { parent: mast, name: 'sail' });
  }
  if (T.lightning) zigzag(ml.userData.surf(0.9, 0.5).p.add(mantle.position), ml.userData.surf(0.2, 0.7).p.add(mantle.position), 0.02, glowMat('#8fe6ff', 1.6), r, { parent: rig, name: 'bolt' });
  if (T.scale !== 1) rig.scale.setScalar(T.trim === 'baby' ? 0.5 : T.scale);
  A.add('idle', 4, breathe(ml, 4, 0.04));
  tentacles.forEach((t, i) => A.add('idle', 4, swing(t, 'z', 4, 0.06, i / arms)));
  tentacles.forEach((t, i) => A.add('wave', 2, swing(t, 'z', 2, 0.2, i / arms), swing(t, 'y', 2, 0.15, i / arms + 0.25)));
  A.add('glow', 1, lampTracks('eyes', 3));
  void blob; void darkMat; void taper; void rock; void rotateTrack; void orient;
  return done(root, 'kraken', variant, o, T, A.list());
}

/* -------------------------------- sea serpent -------------------------------- */

export const SERPENT_VARIANTS = {
  arches: { p: '#2a6a5a', b: '#c8e0b0', h: '#e8f0d8', w: '#3a8a7a', eye: '#ffd040', pattern: 'scales', pose: 'arches', humps: 3 },
  rearing: { p: '#1f4a7a', b: '#a8c8e0', h: '#e0e8f0', w: '#2a6aa0', eye: '#ffe060', pattern: 'scales', pose: 'rear', humps: 2 },
  coiled: { p: '#5a6a2a', b: '#d8d8a0', h: '#f0e8c8', w: '#7a8a3a', eye: '#ff8030', pattern: 'bands', pose: 'coil', humps: 0 },
  finned: { p: '#1a5a7a', b: '#e0f0f0', h: '#f0f8ff', w: '#2a8ab0', eye: '#80f0ff', pattern: 'scales', pose: 'arches', humps: 3, finned: true },
  horned: { p: '#6a2a3a', b: '#e0b0a0', h: '#2a1a14', w: '#8a3a4a', eye: '#ffb020', pattern: 'scales', pose: 'rear', humps: 2, horns: 4, spikes: 'cone' },
};

export function createSeaSerpent(options = {}) {
  const { o, variant, T, r } = setup(options, SERPENT_VARIANTS, 'sea-serpent', SEA_TRIMS);
  const root = new THREE.Group();
  const rig = group('rig', { parent: root });
  const A = animKit();
  const skin = skinMat(T, { clear: 0.8 });
  const col = skinColor(T);
  const R = 2.7;
  const wy = pool(rig, T, R, r);
  const rad = 0.26;
  const finStyle = T.finned || !T.trim ? 'fin' : T.spikes;
  const deco = (lm, name, h = 0.16) => { if (T.trim) seaDeco(lm, T, h, name); else spikeRow(lm, { from: 0.15, to: 0.85, n: 6, h, T, style: finStyle, lean: 0.6, name: `${name}_fin` }); };
  const body = group('body', { parent: rig });
  const segs = [];
  const pose = T.pose;
  let headBase, headDir;
  if (pose === 'coil') {
    const rk = rock(rig, 1.1, 1.0, 1.1, rockMat('#5a5650'), { at: [0, wy - 0.05, 0], seed: 7 });
    const pts = [];
    for (let i = 0; i <= 26; i++) { const t = i / 26; const a = t * TAU * 1.6; const rr = 0.72 - t * 0.12; pts.push([Math.cos(a) * rr, wy + 0.05 + t * (rk.userData.top + 0.25), Math.sin(a) * rr]); }
    pts.push([0.15, wy + rk.userData.top + 0.75, 0.3], [0.35, wy + rk.userData.top + 1.35, 0.2]);
    const lm = loft(pts, (t) => keys(t, [[0, 0.06], [0.1, rad * 0.9], [0.8, rad], [1, rad * 0.8]]), skin, { seg: 120, rad: 16, color: col, parent: body, name: 'chest' });
    deco(lm, 'coil', 0.14);
    segs.push(lm);
    headBase = new THREE.Vector3(...pts[pts.length - 1]);
    headDir = [0, 0.4, 0];
  } else {
    // humps from back (-x) to front
    const n = T.humps;
    for (let i = 0; i < n; i++) {
      const x0 = -2.0 + i * 1.15, w = 0.95, hgt = 0.55 + 0.1 * i;
      const z = Math.sin(i * 1.3) * 0.3;
      const lm = loft([[x0, wy - 0.25, z], [x0 + w * 0.25, wy + hgt * 0.8, z], [x0 + w * 0.5, wy + hgt, z], [x0 + w * 0.75, wy + hgt * 0.8, z], [x0 + w, wy - 0.25, z]], rad * (0.75 + 0.1 * i), skin, { seg: 30, rad: 16, color: col, parent: body, name: i === n - 1 ? 'chest' : `hump_${i}` });
      deco(lm, `hump_${i}`);
      segs.push(lm);
    }
    // tail tip
    const tl = loft([[-2.6, wy - 0.2, -0.2], [-2.75, wy + 0.25, -0.25], [-3.05, wy + 0.5, -0.3]], (t) => keys(t, [[0, 0.16], [1, 0.03]]), skin, { seg: 16, rad: 12, color: col, parent: body, name: 'tail_loft', capEnd: 1 });
    const ts = tl.userData.surf(1, 0);
    mesh(orient(new THREE.ConeGeometry(0.28, 0.5, 3).scale(1, 1, 0.1).translate(0, 0.15, 0), ts.c, ts.t), T.coral ? plainMat('#ff8a5a', 0.7) : new THREE.MeshPhysicalMaterial({ color: T.w, roughness: 0.5, side: THREE.DoubleSide }), { parent: body, name: 'tail_fin' });
    // neck rising
    const nx = -2.0 + n * 1.15 + 0.15;
    const tall = pose === 'rear' ? 2.6 : 1.5;
    const npts = [[nx, wy - 0.25, 0], [nx + 0.25, wy + tall * 0.4, 0], [nx + 0.15, wy + tall * 0.8, 0], [nx + 0.35, wy + tall, 0]];
    const nl = loft(npts, (t) => keys(t, [[0, rad * 1.05], [1, rad * 0.8]]), skin, { seg: 30, rad: 16, color: col, parent: body, name: 'neck_loft' });
    deco(nl, 'neck', 0.18);
    segs.push(nl);
    headBase = new THREE.Vector3(...npts[3]);
    headDir = [0, 0, 0];
  }
  const neck = group('neck', { parent: body, at: headBase.toArray() });
  const hd = reptileHead(neck, T, { at: [-0.12, 0, 0], rot: [0, 0, -0.25], len: 0.8, w: 0.44, h: 0.36, mat: skin, color: col, jawOpen: pose === 'rear' ? 0.5 : 0.2, horns: T.horns ?? (T.finned ? 0 : 2), frill: T.frill || T.finned, whiskers: T.trim === 'storm' });
  void headDir;
  if (T.finned) for (const sg of [1, -1]) spikeRow(hd.skull, { from: 0.05, to: 0.3, n: 3, h: 0.25, T, style: 'fin', a: sg * 1.5, lean: 1.2, name: 'ear_fin' });
  if (T.lure) { const s = hd.skull.userData.surf(0.3, 0); taper([s.p.toArray(), s.p.clone().add(new THREE.Vector3(0.3, 0.4, 0)).toArray(), s.p.clone().add(new THREE.Vector3(0.65, 0.3, 0)).toArray()], 0.03, 0.012, skin, { parent: hd.head, name: 'lure_stalk', color: col }); mesh(new THREE.SphereGeometry(0.07, 12, 8), glowMat('#40f0ff', 2), { parent: hd.head, at: s.p.clone().add(new THREE.Vector3(0.65, 0.25, 0)).toArray(), name: 'lure' }); }
  if (T.scale !== 1) rig.scale.setScalar(T.trim === 'baby' ? 0.5 : T.scale);
  A.add('idle', 4, breathe(segs[segs.length - 1], 4, 0.03), swing(neck, 'z', 4, 0.06), swing(hd.head, 'y', 4, 0.18));
  A.add('roar', 2, rotateTrack(hd.jaw, 'z', 2, (t) => -0.5 * Math.sin(Math.PI * t) ** 2), rotateTrack(neck, 'z', 2, (t) => 0.15 * Math.sin(Math.PI * t)));
  A.add('glow', 1, lampTracks('eyes', 3));
  void blob; void darkMat; void ribs; void plateRow; void zigzag; void hornMat; void crystalCluster; void breathe;
  return done(root, 'sea-serpent', variant, o, T, A.list());
}
