// Medieval pieces: castle walls, towers, gates, wells, carts, banners, thrones and treasure chests.
import { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, setup, done, ruinCut, rubble, instanced, moveTrack, rotateTrack, spinTrack, scaleTrack, numberTrack, clip, pingPong, noise3, rockGeo } from './common.js';
import { taperBlock } from './monuments.js';

/* ------------------------------ masonry helpers ------------------------------ */

/** Ashlar facing blocks on a vertical face: face plane z = zf (outward sign sz), x0..x1, y0..y1. */
function ashlarItems(items, T, x0, x1, y0, y1, zf, sz, { course = 0.42, len = 0.78, rotY = 0, ox = 0, oz = 0 } = {}) {
  const r = T.r;
  const c = Math.cos(rotY), s = Math.sin(rotY);
  let row = 0;
  for (let y = y0 + course / 2; y < y1 - course * 0.3; y += course, row++) {
    let x = x0 + (row % 2 ? len * 0.5 : 0);
    if (row % 2) x0 && 0;
    let first = true;
    while (x < x1 - 0.05) {
      const w = Math.min(len * (0.75 + r() * 0.5), x1 - x);
      const xa = first && row % 2 ? x0 : x;
      const ww = first && row % 2 ? x + w - x0 : w;
      first = false;
      const cx = xa + ww / 2, lz = zf + sz * 0.015;
      const k = 0.88 + r() * 0.2;
      items.push({ p: [ox + cx * c + lz * s, y, oz - cx * s + lz * c], r: [0, rotY, 0], s: [ww - 0.03, course - 0.03, 0.08], c: new THREE.Color(k, k, k * 0.98) });
      x = xa + ww;
    }
  }
}

/** Ring of ashlar blocks on a cylinder of radius R from y0..y1. */
function ashlarRing(items, T, R, y0, y1, { course = 0.42, len = 0.8, x = 0, z = 0, a0 = 0, a1 = Math.PI * 2 } = {}) {
  const r = T.r;
  let row = 0;
  for (let y = y0 + course / 2; y < y1 - course * 0.3; y += course, row++) {
    const n = Math.max(3, Math.round(((a1 - a0) * R) / len));
    for (let i = 0; i < n; i++) {
      const a = a0 + ((i + (row % 2) * 0.5) / n) * (a1 - a0);
      const k = 0.88 + r() * 0.2;
      items.push({ p: [x + Math.cos(a) * (R + 0.01), y, z + Math.sin(a) * (R + 0.01)], r: [0, -a + Math.PI / 2, 0], s: [((a1 - a0) * R) / n - 0.03, course - 0.03, 0.08], c: new THREE.Color(k, k, k * 0.98) });
    }
  }
}

/** Crenellated parapet along x (length L) at height y, on face z (thickness t). */
function merlons(items, L, y, z, { w = 0.75, gap = 0.55, h = 1.0, t = 0.5, rotY = 0, ox = 0, oz = 0 } = {}) {
  const n = Math.max(1, Math.floor((L + gap) / (w + gap)));
  const span = n * w + (n - 1) * gap;
  const c = Math.cos(rotY), s = Math.sin(rotY);
  for (let i = 0; i < n; i++) {
    const x = -span / 2 + w / 2 + i * (w + gap);
    items.push({ p: [ox + x * c + z * s, y + h / 2, oz - x * s + z * c], r: [0, rotY, 0], s: [w, h, t] });
  }
}

const merlonGeo = () => roundedBox(1, 1, 1, 0.06, 1);

/** Straight curtain wall segment along x centred at origin (local), returns group. */
function wallSeg(parent, T, L, H, Th, { at = [0, 0, 0], rotY = 0, slits = false, crenel = true, name = 'wall' } = {}) {
  const m = T.mats;
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  mesh(taperBlock(L, Th + 0.6, L, Th, 1.2), m.stone2, { parent: g, name: 'batter' });
  mesh(roundedBox(L, H, Th, 0.05), m.stone, { parent: g, at: [0, H / 2, 0], name: 'curtain' });
  const blocks = [];
  ashlarItems(blocks, T, -L / 2 + 0.02, L / 2 - 0.02, 1.2, H, Th / 2, 1);
  ashlarItems(blocks, T, -L / 2 + 0.02, L / 2 - 0.02, 1.2, H, -Th / 2, -1);
  instanced(blockGeoUnit(), m.stone, blocks, g, 'ashlar');
  // wall walk + parapets
  mesh(roundedBox(L, 0.14, Th + 0.1, 0.03), m.stone2, { parent: g, at: [0, H + 0.05, 0], name: 'wall-walk' });
  mesh(roundedBox(L, 1.0, 0.5, 0.04), m.stone, { parent: g, at: [0, H + 0.6, Th / 2 - 0.25], name: 'parapet' });
  mesh(roundedBox(L, 0.55, 0.4, 0.04), m.stone, { parent: g, at: [0, H + 0.35, -Th / 2 + 0.2], name: 'parapet-inner' });
  if (crenel) {
    const it = [];
    merlons(it, L, H + 1.08, Th / 2 - 0.25);
    instanced(merlonGeo(), m.stone, it, g, 'merlons');
    if (slits) {
      const sl = [];
      for (const p of it) sl.push({ p: [p.p[0], p.p[1], p.p[2] + 0.23], s: [0.09, 0.6, 0.06] });
      const n = Math.floor(L / 2);
      for (let i = 0; i < n; i++) {
        const x = -L / 2 + (L / n) * (i + 0.5);
        sl.push({ p: [x, H * 0.55, Th / 2 + 0.05], s: [0.12, 1.3, 0.1] }, { p: [x, H * 0.55 + 0.25, Th / 2 + 0.05], s: [0.5, 0.1, 0.1] });
      }
      instanced(new THREE.BoxGeometry(1, 1, 1), m.dark, sl, g, 'arrow-slits');
    }
  }
  return g;
}
let _bg;
const blockGeoUnit = () => (_bg ??= new THREE.BoxGeometry(1, 1, 1));

/* -------------------------------- castle wall -------------------------------- */

const CASTLE = ['weathered', 'ruined', 'sandstone', 'granite', 'basalt', 'whitewashed', 'overgrown', 'snowy', 'night', 'desert'];
const WALL_VARIANTS = { straight: {}, corner: {}, 'arrow-slits': {}, hoarding: {}, buttressed: {}, postern: {} };

export function createCastleWall(options = {}) {
  const { variant, T } = setup(options, WALL_VARIANTS, 'castle-wall', { stone: '#b9b2a4' });
  const root = group(`castle-wall-${variant}`);
  const m = T.mats;
  const L = 7, H = 6, Th = 2.4;
  if (variant === 'corner') {
    wallSeg(root, T, L, H, Th, { at: [-L / 2 + Th / 2, 0, 0] });
    wallSeg(root, T, L, H, Th, { at: [Th / 2 - 0.01, 0, -L / 2 + Th / 2 + 0.01 - 0.0], rotY: Math.PI / 2 + Math.PI });
    // corner pier
    mesh(roundedBox(Th + 0.6, H + 1.6, Th + 0.6, 0.06), m.stone2, { parent: root, at: [0.6, (H + 1.6) / 2, 0], name: 'corner-pier' });
    const it = [];
    merlons(it, Th + 0.6, H + 1.6, 0, { t: Th + 0.6, w: 0.8, gap: 0.6 });
    instanced(merlonGeo(), m.stone, it, root, 'merlons').position.x = 0.6;
  } else {
    wallSeg(root, T, L, H, Th, { slits: variant === 'arrow-slits' });
  }
  if (variant === 'hoarding') {
    // timber gallery overhanging the outer face
    const wood = m.wood;
    const hz = Th / 2;
    for (let i = 0; i < 6; i++) {
      const x = -L / 2 + 0.5 + (i * (L - 1)) / 5;
      mesh(roundedBox(0.22, 0.22, 2.2, 0.03), wood, { parent: root, at: [x, H + 0.0, hz + 0.6], name: 'putlog' });
      mesh(roundedBox(0.18, 2.2, 0.18, 0.03), wood, { parent: root, at: [x, H + 1.15, hz + 1.55], name: 'post' });
      curveTube([[x, H - 1.2, hz + 0.02], [x, H - 0.4, hz + 0.9], [x, H - 0.05, hz + 1.5]], 0.07, wood, { parent: root, segments: 8, radialSegments: 6, name: 'brace' });
    }
    mesh(roundedBox(L, 0.08, 1.4, 0.02), m.wood2, { parent: root, at: [0, H + 0.14, hz + 1.0], name: 'gallery-floor' });
    const boards = [];
    for (let i = 0; i < 26; i++) boards.push({ p: [-L / 2 + 0.14 + (i * (L - 0.28)) / 25, H + 1.0, hz + 1.66], s: [0.25, 1.7, 0.05] });
    instanced(roundedBox(1, 1, 1, 0.08, 1), m.wood2, boards, root, 'hoarding-boards');
    mesh(roundedBox(L + 0.3, 0.1, 2.3, 0.02), T.snow ? m.wood2 : (m.shingle ??= M.matte(T.roof ?? '#5b4a3a', 0.85)), { parent: root, at: [0, H + 2.55, hz + 0.75], rot: [0.35, 0, 0], name: 'gallery-roof' });
  } else if (variant === 'buttressed') {
    for (const x of [-2.4, 0, 2.4]) mesh(taperBlock(1.3, 1.8, 0.9, 0.5, H * 0.85), m.stone2, { parent: root, at: [x, 0, Th / 2 + 0.6], name: 'buttress' });
  } else if (variant === 'postern') {
    mesh(roundedBox(1.6, 2.6, 0.3, 0.04), m.stone2, { parent: root, at: [0, 1.3, Th / 2 + 0.12], name: 'door-frame' });
    mesh(lathe([[0, 0], [0.8, 0], [0.8, 0.3], [0, 0.3]], 24, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(0), m.stone2, { parent: root, at: [0, 2.6, Th / 2 - 0.02], name: 'door-arch' });
    mesh(roundedBox(1.1, 2.3, 0.12, 0.02), m.wood, { parent: root, at: [0, 1.15, Th / 2 + 0.3], name: 'door' });
    for (const y of [0.5, 1.8]) mesh(roundedBox(1.1, 0.06, 0.03, 0.01), m.iron, { parent: root, at: [0, y, Th / 2 + 0.37], name: 'strap' });
  }
  if (variant === 'arrow-slits' || variant === 'straight') {
    // a banner hanging from the parapet
    const ban = mesh(new THREE.PlaneGeometry(1.0, 2.6, 1, 6), Object.assign(m.cloth.clone(), { side: THREE.DoubleSide }), { parent: root, at: [0, H - 0.2, Th / 2 + 0.02], name: 'wall-banner' });
    void ban;
    mesh(roundedBox(1.2, 0.06, 0.06, 0.02), m.wood, { parent: root, at: [0, H + 1.1, Th / 2 + 0.03], name: 'banner-rod' });
    root.getObjectByName('wall-banner').position.y = H + 1.1 - 1.3;
  }
  if (T.ruin) {
    ruinCut(root, T, H * 0.6, { jag: 1.4, slope: 0.25, topple: false });
    rubble(root, T, new THREE.Box3().setFromObject(root), 14, 0.5, { kind: 'block' });
  }
  return done(root, T);
}

/* -------------------------------- castle tower -------------------------------- */

const TOWER_VARIANTS = { round: {}, square: {}, conical: {}, watchtower: {}, keep: {} };

function roundCrown(parent, T, R, y, { machicolation = true } = {}) {
  const m = T.mats;
  // corbelled parapet ring
  if (machicolation) {
    const cor = [];
    const n = Math.round(R * 4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      cor.push({ p: [Math.cos(a) * (R + 0.2), y - 0.4, Math.sin(a) * (R + 0.2)], r: [0, -a + Math.PI / 2, 0], s: [0.35, 0.8, 0.5] });
    }
    instanced(roundedBox(1, 1, 1, 0.1, 1), m.stone2, cor, parent, 'corbels');
  }
  mesh(lathe([[R - 0.05, 0], [R + 0.45, 0], [R + 0.45, 1.1], [R - 0.05, 1.1]], 48), m.stone, { parent, at: [0, y - 0.01, 0], name: 'parapet' });
  const it = [];
  const n = Math.round(R * 2.6);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    it.push({ p: [Math.cos(a) * (R + 0.2), y + 1.6, Math.sin(a) * (R + 0.2)], r: [0, -a + Math.PI / 2, 0], s: [0.8, 1.0, 0.5] });
  }
  instanced(merlonGeo(), m.stone, it, parent, 'merlons');
  mesh(new THREE.CylinderGeometry(R, R, 0.15, 40), m.stone2, { parent, at: [0, y + 0.06, 0], name: 'roof-deck' });
}

function windows(parent, T, list) {
  const items = list.map(([x, y, z, ry]) => ({ p: [x, y, z], r: [0, ry, 0], s: [0.45, 1.1, 0.3] }));
  instanced(roundedBox(1, 1, 1, 0.2, 2), T.night ? (T.mats.litWin ??= M.emissive('#ffb347', 1.2)) : T.mats.dark, items, parent, 'windows');
}

export function createCastleTower(options = {}) {
  const { variant, T } = setup(options, TOWER_VARIANTS, 'castle-tower', { stone: '#b9b2a4' });
  const root = group(`castle-tower-${variant}`);
  const m = T.mats;
  const roofMat = T.snow ? m.snow : (m.slate ??= M.matte(T.roof ?? '#3d4450', 0.7));
  if (variant === 'round' || variant === 'conical') {
    const R = variant === 'round' ? 4 : 3.4, H = variant === 'round' ? 14 : 12;
    mesh(lathe([[0, 0], [R + 0.7, 0], [R + 0.05, 1.8], [R, H], [0, H]], 48), m.stone, { parent: root, name: 'drum' });
    const bl = [];
    ashlarRing(bl, T, R, 1.8, H, { len: 0.9 });
    instanced(blockGeoUnit(), m.stone, bl, root, 'ashlar');
    const w = [];
    for (const [y, a] of [[4, 0.4], [7.5, 1.6], [10.5, 0.9], [7.5, -0.8]]) w.push([Math.cos(a) * (R + 0.02), y, Math.sin(a) * (R + 0.02), -a + Math.PI / 2]);
    windows(root, T, w);
    if (variant === 'round') roundCrown(root, T, R, H);
    else {
      mesh(lathe([[R - 0.1, 0], [R + 0.35, 0], [R + 0.35, 0.5], [R - 0.1, 0.5]], 48), m.stone2, { parent: root, at: [0, H - 0.01, 0], name: 'eaves-band' });
      mesh(lathe([[0, 0], [R + 0.7, 0], [R + 0.55, 0.3], [R * 0.45, 4.6], [0.25, 6.6], [0, 6.8]], 48), roofMat, { parent: root, at: [0, H + 0.45, 0], name: 'cone-roof' });
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), m.iron, { parent: root, at: [0, H + 7.6, 0], name: 'spike' });
      const flag = mesh(new THREE.PlaneGeometry(0.9, 0.55), Object.assign(m.cloth.clone(), { side: THREE.DoubleSide }), { parent: root, at: [0.45, H + 8.0, 0], name: 'pennant' });
      void flag;
      // dormer
      mesh(roundedBox(0.9, 1.1, 0.9, 0.05), roofMat, { parent: root, at: [0, H + 1.6, R * 0.75], name: 'dormer' });
      mesh(roundedBox(0.4, 0.6, 0.1, 0.05), m.dark, { parent: root, at: [0, H + 1.5, R * 0.75 + 0.45], name: 'dormer-window' });
    }
    mesh(roundedBox(1.6, 2.6, 0.5, 0.06), m.stone2, { parent: root, at: [0, 1.3, R + 0.45], name: 'door-frame' });
    mesh(roundedBox(1.1, 2.2, 0.12, 0.03), m.wood, { parent: root, at: [0, 1.1, R + 0.72], name: 'door' });
  } else if (variant === 'square' || variant === 'keep') {
    const W = variant === 'keep' ? 12 : 6.5, H = variant === 'keep' ? 20 : 16;
    mesh(taperBlock(W + 1.2, W + 1.2, W, W, 2.2), m.stone2, { parent: root, name: 'plinth' });
    mesh(roundedBox(W, H, W, 0.06), m.stone, { parent: root, at: [0, H / 2, 0], name: 'body' });
    const bl = [];
    for (let f = 0; f < 4; f++) ashlarItems(bl, T, -W / 2 + 0.02, W / 2 - 0.02, 2.2, H, W / 2, 1, { rotY: (f * Math.PI) / 2 });
    instanced(blockGeoUnit(), m.stone, bl, root, 'ashlar');
    if (variant === 'keep') {
      // pilaster buttresses
      for (let f = 0; f < 4; f++) for (const u of [-W / 2 + 0.4, 0, W / 2 - 0.4]) {
        const a = (f * Math.PI) / 2;
        const x = u * Math.cos(a) + (W / 2 + 0.25) * Math.sin(a), z = -u * Math.sin(a) + (W / 2 + 0.25) * Math.cos(a);
        mesh(roundedBox(0.9, H - 1.5, 0.6, 0.05), m.stone2, { parent: root, at: [x, (H - 1.5) / 2 + 1.0, z], rot: [0, a, 0], name: 'pilaster' });
      }
    }
    const w = [];
    for (let f = 0; f < 4; f++) {
      const a = (f * Math.PI) / 2;
      for (const y of variant === 'keep' ? [6, 10, 14] : [6, 10.5]) for (const u of variant === 'keep' ? [-2.6, 2.6] : [0]) w.push([u * Math.cos(a) + (W / 2 + 0.03) * Math.sin(a), y, -u * Math.sin(a) + (W / 2 + 0.03) * Math.cos(a), a]);
    }
    windows(root, T, w);
    mesh(roundedBox(W + 0.7, 0.3, W + 0.7, 0.05), m.stone2, { parent: root, at: [0, H + 0.1, 0], name: 'string-course' });
    for (let f = 0; f < 4; f++) {
      const a = (f * Math.PI) / 2;
      mesh(roundedBox(W + 0.7, 1.0, 0.45, 0.04), m.stone, { parent: root, at: [Math.sin(a) * (W / 2 + 0.12), H + 0.7, Math.cos(a) * (W / 2 + 0.12)], rot: [0, a, 0], name: 'parapet' });
      const it = [];
      merlons(it, W + 0.5, H + 1.18, W / 2 + 0.12, { rotY: a });
      instanced(merlonGeo(), m.stone, it, root, 'merlons');
    }
    // corner bartizans (square tower) / stair turret (keep)
    if (variant === 'square') for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const bg = group('bartizan', { parent: root, at: [sx * (W / 2 + 0.2), H - 1.2, sz * (W / 2 + 0.2)] });
      mesh(lathe([[0, -1.0], [0.3, -0.9], [0.8, 0], [0.8, 2.2], [0, 2.2]], 24), m.stone2, { parent: bg, name: 'turret' });
      mesh(lathe([[0, 0], [1.0, 0], [0.9, 0.2], [0.2, 1.8], [0, 1.9]], 24), roofMat, { parent: bg, at: [0, 2.18, 0], name: 'turret-roof' });
    } else {
      const sg = group('stair-turret', { parent: root, at: [W / 2 + 0.6, 0, W / 2 + 0.6] });
      mesh(lathe([[0, 0], [1.9, 0], [1.6, 1.5], [1.6, H + 3.5], [0, H + 3.5]], 32), m.stone, { parent: sg, name: 'turret' });
      roundCrown(sg, T, 1.6, H + 3.5, { machicolation: false });
    }
    mesh(roundedBox(1.6, 2.6, 0.5, 0.06), m.stone2, { parent: root, at: [0, 3.3, W / 2 + 0.2], name: 'door-frame' });
    mesh(roundedBox(1.1, 2.2, 0.12, 0.03), m.wood, { parent: root, at: [0, 3.1, W / 2 + 0.47], name: 'door' });
    // timber forebuilding stair
    for (let i = 0; i < 9; i++) mesh(roundedBox(1.4, 0.24, 0.5, 0.04), m.stone2, { parent: root, at: [0, 0.12 + i * 0.24, W / 2 + 4.6 - i * 0.45], name: 'stair' });
    mesh(roundedBox(1.4, 2.1, 0.6, 0.04), m.stone2, { parent: root, at: [0, 1.05, W / 2 + 0.6], name: 'landing' });
    mesh(roundedBox(1.4, 2.3, 4.4, 0.04), m.stone2, { parent: root, at: [0, 1.0, W / 2 + 2.6], scale: [1, 0.5, 1], name: 'stair-base' });
  } else if (variant === 'watchtower') {
    const wood = m.wood;
    mesh(taperBlock(4.2, 4.2, 3.6, 3.6, 2.4), m.stone, { parent: root, name: 'stone-base' });
    const legs = [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]];
    for (const [x, z] of legs) mesh(roundedBox(0.3, 8.2, 0.3, 0.04), wood, { parent: root, at: [x * 0.92, 2.4 + 4.0, z * 0.92], rot: [z * -0.02, 0, x * 0.02], name: 'post' });
    for (const y of [4.4, 7.0]) for (let f = 0; f < 4; f++) {
      const a = (f * Math.PI) / 2;
      const gx = group('brace', { parent: root, at: [Math.sin(a) * 1.4, y, Math.cos(a) * 1.4], rot: [0, a, 0] });
      mesh(roundedBox(3.9, 0.18, 0.16, 0.03), wood, { parent: gx, at: [0, 1.0, 0], rot: [0, 0, 0.55], name: 'cross' });
      mesh(roundedBox(3.9, 0.18, 0.16, 0.03), wood, { parent: gx, at: [0, 1.0, 0.05], rot: [0, 0, -0.55], name: 'cross' });
    }
    mesh(roundedBox(4.6, 0.25, 4.6, 0.04), m.wood2, { parent: root, at: [0, 10.4, 0], name: 'platform' });
    const pal = [];
    for (let f = 0; f < 4; f++) for (let i = 0; i < 14; i++) {
      const a = (f * Math.PI) / 2, u = -2.15 + (i * 4.3) / 13;
      pal.push({ p: [u * Math.cos(a) + 2.2 * Math.sin(a), 11.1, -u * Math.sin(a) + 2.2 * Math.cos(a)], r: [0, a, 0], s: [0.28, 1.2, 0.08] });
    }
    instanced(roundedBox(1, 1, 1, 0.1, 1), m.wood2, pal, root, 'palisade');
    for (const [x, z] of legs) mesh(roundedBox(0.2, 2.6, 0.2, 0.03), wood, { parent: root, at: [x * 1.42, 11.8, z * 1.42], name: 'roof-post' });
    mesh(new THREE.ConeGeometry(3.7, 2.4, 4, 1).rotateY(Math.PI / 4), T.snow ? m.snow : (m.thatch ??= M.matte(T.roof ?? '#6a5236', 0.95)), { parent: root, at: [0, 14.25, 0], name: 'roof' });
    // ladder
    curveTube([[0.5, 2.38, 2.1], [0.5, 10.4, 2.25]], 0.05, wood, { parent: root, name: 'ladder-rail' });
    curveTube([[-0.5, 2.38, 2.1], [-0.5, 10.4, 2.25]], 0.05, wood, { parent: root, name: 'ladder-rail' });
    for (let i = 0; i < 24; i++) mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6).rotateZ(Math.PI / 2), wood, { parent: root, at: [0, 2.6 + i * 0.33, 2.1 + (i * 0.15) / 24], name: 'rung' });
    mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.25, 12), m.bronze, { parent: root, at: [0, 12.94, 0], name: 'alarm-bell' });
  }
  if (T.ruin) {
    const b = new THREE.Box3().setFromObject(root);
    ruinCut(root, T, b.max.y * 0.5, { jag: b.max.y * 0.08, slope: 0.18, topple: false });
    rubble(root, T, b, 16, 0.55, { kind: 'block' });
  }
  return done(root, T);
}

/* -------------------------------- castle gate -------------------------------- */

/** Wall with an arched opening to the ground (pointed arch when pointed=true). */
function gateWallGeo(W, H, D, s, hs, pointed = false) {
  const pts = [[-W / 2, 0], [-s / 2, 0], [-s / 2, hs]];
  for (let i = 1; i < 20; i++) {
    const t = i / 20;
    if (pointed) {
      const a = Math.PI * t;
      const side = t < 0.5 ? -1 : 1;
      const cx = side * -s * 0.3;
      const rr = s * 0.8;
      const ang = t < 0.5 ? Math.PI - (Math.PI / 2.6) * (t / 0.5) : (Math.PI / 2.6) * ((1 - t) / 0.5);
      void a;
      pts.push([cx + Math.cos(ang) * rr - (side < 0 ? -0.0 : 0), hs + Math.sin(ang) * rr]);
    } else {
      const a = Math.PI - t * Math.PI;
      pts.push([Math.cos(a) * s / 2, hs + Math.sin(a) * s / 2]);
    }
  }
  pts.push([s / 2, hs], [s / 2, 0], [W / 2, 0], [W / 2, H], [-W / 2, H]);
  return extrudeOutline(pts, D, { bevel: 0.04, segments: 1 }).translate(0, 0.04, 0);
}

const GATE_VARIANTS = { portcullis: {}, drawbridge: {}, palisade: {}, barbican: {} };

export function createCastleGate(options = {}) {
  const { variant, T } = setup(options, GATE_VARIANTS, 'castle-gate', { stone: '#b9b2a4' });
  const root = group(`castle-gate-${variant}`);
  const m = T.mats;
  const anims = [];
  if (variant === 'palisade') {
    const wood = m.wood;
    const logs = [];
    const logGeo = lathe([[0, 0], [0.16, 0], [0.16, 3.6], [0.06, 4.0], [0, 4.1]], 10);
    for (const s of [-1, 1]) for (let i = 0; i < 14; i++) logs.push({ p: [s * (2.0 + i * 0.31), 0, Math.sin(i * 1.3) * 0.04], r: [0, i, 0], s: [1, 0.92 + ((i * 37) % 10) / 60, 1] });
    instanced(logGeo, wood, logs, root, 'palisade');
    mesh(roundedBox(13, 0.2, 0.14, 0.03), m.wood2, { parent: root, at: [0, 2.6, 0.2], name: 'rail' });
    // two wooden towers
    for (const s of [-1, 1]) {
      const tg = group('tower', { parent: root, at: [s * 2.3, 0, -0.2] });
      for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) mesh(roundedBox(0.28, 6.4, 0.28, 0.04), wood, { parent: tg, at: [x, 3.2, z], name: 'post' });
      mesh(roundedBox(2.3, 0.2, 2.3, 0.03), m.wood2, { parent: tg, at: [0, 5.0, 0], name: 'platform' });
      for (let f = 0; f < 4; f++) mesh(roundedBox(2.2, 1.0, 0.08, 0.02), m.wood2, { parent: tg, at: [Math.sin((f * Math.PI) / 2) * 1.08, 5.6, Math.cos((f * Math.PI) / 2) * 1.08], rot: [0, (f * Math.PI) / 2, 0], name: 'breastwork' });
      mesh(new THREE.ConeGeometry(1.9, 1.4, 4).rotateY(Math.PI / 4), T.snow ? m.snow : (m.thatch ??= M.matte('#6a5236', 0.95)), { parent: tg, at: [0, 7.05, 0], name: 'roof' });
    }
    mesh(roundedBox(4.6, 0.3, 0.3, 0.04), wood, { parent: root, at: [0, 4.3, 0.3], name: 'lintel' });
    for (const s of [-1, 1]) {
      const hinge = group(s < 0 ? 'door_L' : 'door_R', { parent: root, at: [s * 1.5, 0, 0.35] });
      const planks = [];
      for (let i = 0; i < 6; i++) planks.push({ p: [-s * (0.13 + i * 0.25), 1.9, 0], s: [0.24, 3.7, 0.1] });
      instanced(roundedBox(1, 1, 1, 0.08, 1), m.wood2, planks, hinge, 'door-planks');
      for (const y of [0.7, 3.0]) mesh(roundedBox(1.5, 0.16, 0.08, 0.02), wood, { parent: hinge, at: [-s * 0.75, y, 0.08], name: 'ledger' });
      mesh(roundedBox(0.2, 3.8, 0.2, 0.03), wood, { parent: root, at: [s * 1.58, 1.9, 0.35], name: 'gate-post' });
    }
    anims.push(() => clip('open', 5, ['door_L', 'door_R'].map((n, k) => rotateTrack(root.getObjectByName(n), 'y', 5, (t) => (k ? 1 : -1) * pingPong(t) * 1.4))));
  } else {
    const barb = variant === 'barbican';
    const W = 10, H = 9, D = 6, s = 3.6, hs = 2.8;
    mesh(gateWallGeo(W, H, D, s, hs, barb), m.stone, { parent: root, name: 'gatehouse' });
    const bl = [];
    ashlarItems(bl, T, -W / 2, -s / 2 - 0.05, 0.1, H, D / 2, 1);
    ashlarItems(bl, T, s / 2 + 0.05, W / 2, 0.1, H, D / 2, 1);
    ashlarItems(bl, T, -s / 2 - 0.1, s / 2 + 0.1, hs + s * 0.85, H, D / 2, 1);
    instanced(blockGeoUnit(), m.stone, bl, root, 'ashlar');
    // arch ring
    const ring = [];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI - (i / 12) * Math.PI;
      ring.push({ p: [Math.cos(a) * (s / 2 + 0.25), hs + Math.sin(a) * (s / 2 + 0.25) * (barb ? 1.2 : 1), D / 2 + 0.06], r: [0, 0, a - Math.PI / 2], s: [0.3, 0.55, 0.16] });
    }
    instanced(roundedBox(1, 1, 1, 0.1, 1), m.stone2, ring, root, 'arch-stones');
    // crenellated top
    mesh(roundedBox(W + 0.4, 0.3, D + 0.4, 0.05), m.stone2, { parent: root, at: [0, H + 0.1, 0], name: 'string-course' });
    const it = [];
    merlons(it, W + 0.2, H + 0.24, D / 2 - 0.05);
    merlons(it, W + 0.2, H + 0.24, -D / 2 + 0.05);
    instanced(merlonGeo(), m.stone, it, root, 'merlons');
    // towers
    for (const sx of [-1, 1]) {
      const tg = group('tower', { parent: root, at: [sx * (W / 2 + 1.6), 0, 0.8] });
      if (barb) {
        mesh(roundedBox(4.4, 12, 4.4, 0.06), m.stone, { parent: tg, at: [0, 6, 0], name: 'tower' });
        const bb = [];
        for (let f = 0; f < 4; f++) ashlarItems(bb, T, -2.18, 2.18, 0.1, 12, 2.2, 1, { rotY: (f * Math.PI) / 2 });
        instanced(blockGeoUnit(), m.stone, bb, tg, 'ashlar');
        mesh(roundedBox(4.9, 0.3, 4.9, 0.05), m.stone2, { parent: tg, at: [0, 12.1, 0], name: 'string-course' });
        const mt = [];
        for (let f = 0; f < 4; f++) merlons(mt, 4.6, 12.24, 2.2, { rotY: (f * Math.PI) / 2 });
        instanced(merlonGeo(), m.stone, mt, tg, 'merlons');
        windows(tg, T, [[0, 7, 2.23, 0], [0, 10, 2.23, 0]]);
      } else {
        mesh(lathe([[0, 0], [3.2, 0], [2.7, 1.6], [2.6, 12], [0, 12]], 40), m.stone, { parent: tg, name: 'tower' });
        const bb = [];
        ashlarRing(bb, T, 2.6, 1.6, 12, { len: 0.85 });
        instanced(blockGeoUnit(), m.stone, bb, tg, 'ashlar');
        roundCrown(tg, T, 2.6, 12);
        windows(tg, T, [[0, 6, 2.63, 0], [0, 9, 2.63, 0]]);
      }
    }
    // portcullis (all non-palisade gates have one)
    const pc = group('portcullis', { parent: root, at: [0, 0, D / 2 - 0.6] });
    const bars = [];
    const ph = hs + s * 0.5 + 0.3;
    for (let i = 0; i < 8; i++) bars.push({ p: [-s / 2 - 0.05 + (i * (s + 0.1)) / 7, ph / 2 + 0.12, 0], s: [0.09, ph, 0.09] });
    for (let j = 0; j < 7; j++) bars.push({ p: [0, 0.35 + j * (ph / 7), 0], s: [s + 0.3, 0.09, 0.09] });
    instanced(new THREE.BoxGeometry(1, 1, 1), T.wear ? m.iron : (m.gateIron ??= M.metal('#2c2b2a', 0.55)), bars, pc, 'grid');
    const spikes = [];
    for (let i = 0; i < 8; i++) spikes.push({ p: [-s / 2 - 0.05 + (i * (s + 0.1)) / 7, 0.06, 0], r: [Math.PI, 0, 0], s: [1, 1, 1] });
    instanced(new THREE.ConeGeometry(0.06, 0.14, 4), m.iron, spikes, pc, 'spikes');
    if (variant === 'drawbridge') {
      // pit apron, bridge deck hinged at the threshold, chains to the wall
      const hinge = group('bridge', { parent: root, at: [0, 0.18, D / 2 + 0.05] });
      mesh(roundedBox(s + 0.6, 0.18, 5.2, 0.03), m.wood2, { parent: hinge, at: [0, 0, 2.6], name: 'deck' });
      const pl = [];
      for (let i = 0; i < 16; i++) pl.push({ p: [0, 0.1, 0.18 + i * 0.32], s: [s + 0.5, 0.05, 0.28] });
      instanced(roundedBox(1, 1, 1, 0.1, 1), m.wood, pl, hinge, 'planks');
      for (const sx of [-1, 1]) curveTube([[sx * (s / 2 + 0.2), 0.12, 5.1], [sx * (s / 2 + 0.25), 3.5, 2.4], [sx * (s / 2 + 0.3), hs + s * 0.8, 0.0]], 0.05, m.iron, { parent: hinge, segments: 20, radialSegments: 6, name: 'chain' });
      mesh(roundedBox(s + 1.2, 0.18, 0.8, 0.03), m.stone2, { parent: root, at: [0, 0.09, D / 2 + 0.2], name: 'threshold' });
      anims.push(() => clip('raise', 6, [rotateTrack(root.getObjectByName('bridge'), 'x', 6, (t) => -pingPong(t) * 1.45)]));
    }
    if (barb) {
      // inner doors behind the portcullis
      for (const sx of [-1, 1]) mesh(roundedBox(s / 2 - 0.05, hs + 1.4, 0.15, 0.03), m.wood, { parent: root, at: [sx * (s / 4), (hs + 1.4) / 2, D / 2 - 1.6], name: 'inner-door' });
    }
    anims.push(() => clip('open', 6, [moveTrack(root.getObjectByName('portcullis'), 6, (t) => [0, pingPong(t) * (ph - 0.6), 0])]));
  }
  if (T.ruin) {
    const b = new THREE.Box3().setFromObject(root);
    ruinCut(root, T, b.max.y * 0.55, { jag: 1.2, slope: 0.15, topple: false });
    rubble(root, T, b, 14, 0.5, { kind: 'block' });
  }
  return done(root, T, () => anims.map((f) => f()));
}

/* ---------------------------------- well ---------------------------------- */

const WELL_VARIANTS = { 'stone-round': {}, square: {}, 'open-pulley': {}, covered: {} };

export function createWell(options = {}) {
  const { variant, T } = setup(options, WELL_VARIANTS, 'stone-well', { stone: '#a9a297' });
  const root = group(`stone-well-${variant}`);
  const m = T.mats;
  const wood = m.wood;
  const Rh = 0.82, Ri = 0.58, Hh = 0.85;
  if (variant === 'square') {
    // hollow square curb from four walls + coping
    const S = 1.8, t = 0.3;
    for (const s of [-1, 1]) {
      mesh(roundedBox(S, Hh, t, 0.04), m.stone, { parent: root, at: [0, Hh / 2, s * (S / 2 - t / 2)], name: 'curb' });
      mesh(roundedBox(t, Hh, S - 2 * t + 0.02, 0.04), m.stone, { parent: root, at: [s * (S / 2 - t / 2), Hh / 2, 0], name: 'curb' });
      mesh(roundedBox(S + 0.1, 0.12, t + 0.1, 0.03), m.stone2, { parent: root, at: [0, Hh + 0.05, s * (S / 2 - t / 2)], name: 'coping' });
      mesh(roundedBox(t + 0.1, 0.12, S - 2 * t, 0.03), m.stone2, { parent: root, at: [s * (S / 2 - t / 2), Hh + 0.05, 0], name: 'coping' });
    }
    mesh(roundedBox(S - 2 * t + 0.02, 0.04, S - 2 * t + 0.02, 0.01), m.water, { parent: root, at: [0, 0.12, 0], name: 'water' });
  } else {
    mesh(lathe([[Ri, 0.02], [Rh + 0.08, 0.02], [Rh + 0.04, 0.12], [Rh, Hh], [Rh + 0.08, Hh], [Rh + 0.08, Hh + 0.14], [Ri - 0.04, Hh + 0.14], [Ri - 0.04, Hh], [Ri, Hh], [Ri, 0.02]], 40), m.stone, { parent: root, name: 'curb' }).material.side = THREE.DoubleSide;
    const bl = [];
    ashlarRing(bl, T, Rh, 0.12, Hh, { course: 0.24, len: 0.42 });
    instanced(blockGeoUnit(), m.stone, bl, root, 'stones');
    mesh(new THREE.CylinderGeometry(Ri + 0.01, Ri + 0.01, 0.04, 32), m.water, { parent: root, at: [0, 0.12, 0], name: 'water' });
    mesh(new THREE.CylinderGeometry(Ri + 0.01, Ri + 0.01, 0.1, 32), m.dark, { parent: root, at: [0, 0.05, 0], name: 'shaft-bottom' });
  }
  // superstructure
  const postX = variant === 'square' ? 0.8 : Rh - 0.02;
  const topY = Hh + 1.7;
  let axleY = Hh + 1.1;
  if (variant !== 'open-pulley') {
    for (const s of [-1, 1]) mesh(roundedBox(0.16, topY - 0.1, 0.16, 0.03), wood, { parent: root, at: [s * postX, (topY - 0.1) / 2 + 0.05, 0], name: 'post' });
    if (variant === 'covered') for (const s of [-1, 1]) mesh(roundedBox(0.16, topY - 0.1, 0.16, 0.03), wood, { parent: root, at: [0, (topY - 0.1) / 2 + 0.05, s * postX], name: 'post' });
    mesh(roundedBox(postX * 2 + 0.4, 0.14, 0.18, 0.03), wood, { parent: root, at: [0, topY, 0], name: 'beam' });
    const roofMat = T.snow ? m.snow : (m.shingle ??= M.matte(T.roof ?? (variant === 'covered' ? '#6b5a44' : '#7a3a2a'), 0.85));
    if (variant === 'covered') mesh(new THREE.ConeGeometry(1.6, 1.2, 8), roofMat, { parent: root, at: [0, topY + 0.65, 0], name: 'roof' });
    else for (const s of [-1, 1]) mesh(roundedBox(postX * 2 + 0.7, 0.06, 1.1, 0.02), roofMat, { parent: root, at: [0, topY + 0.38, s * 0.42], rot: [s * 0.75, 0, 0], name: 'roof' });
  } else {
    // tripod with a pulley
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.3;
      curveTube([[Math.cos(a) * (Rh + 0.02), Hh + 0.13, Math.sin(a) * (Rh + 0.02)], [0, Hh + 2.0, 0]], 0.06, wood, { parent: root, segments: 2, radialSegments: 8, name: 'tripod-leg' });
    }
    axleY = Hh + 1.85;
    mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 20), m.iron, { parent: root, at: [0, axleY, 0], name: 'pulley' });
  }
  // windlass + crank
  const crank = group('crank', { parent: root, at: [0, axleY, 0] });
  if (variant !== 'open-pulley') {
    mesh(new THREE.CylinderGeometry(0.09, 0.09, postX * 2 + 0.3, 14).rotateZ(Math.PI / 2), m.wood2, { parent: crank, name: 'axle' });
    mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 14).rotateZ(Math.PI / 2), m.rope, { parent: crank, name: 'rope-coil' });
    mesh(roundedBox(0.05, 0.4, 0.05, 0.01), m.iron, { parent: crank, at: [postX + 0.17, -0.18, 0], name: 'crank-arm' });
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8).rotateZ(Math.PI / 2), m.iron, { parent: crank, at: [postX + 0.26, -0.36, 0], name: 'crank-handle' });
  }
  // rope and bucket
  const ropeTop = axleY - (variant === 'open-pulley' ? 0.12 : 0.1);
  const bucketY = Hh + 0.25;
  const rope = group('rope', { parent: root, at: [0.12 * (variant === 'open-pulley' ? 1 : 0), ropeTop, 0] });
  const rl = ropeTop - (bucketY + 0.38);
  mesh(new THREE.CylinderGeometry(0.012, 0.012, rl + 0.04, 6).translate(0, -(rl + 0.04) / 2 + 0.02, 0), m.rope, { parent: rope, name: 'rope-line' });
  const bucket = group('bucket', { parent: root, at: [rope.position.x, bucketY, 0] });
  mesh(lathe([[0, 0], [0.13, 0], [0.16, 0.3], [0.145, 0.3], [0.115, 0.025], [0, 0.025]], 20), m.wood2, { parent: bucket, name: 'bucket-body' }).material.side = THREE.DoubleSide;
  for (const y of [0.06, 0.24]) mesh(new THREE.TorusGeometry(0.135 + y * 0.09, 0.008, 4, 20).rotateX(Math.PI / 2), m.iron, { parent: bucket, at: [0, y, 0], name: 'hoop' });
  curveTube([[-0.155, 0.29, 0], [-0.1, 0.38, 0], [0, 0.4, 0], [0.1, 0.38, 0], [0.155, 0.29, 0]], 0.008, m.iron, { parent: bucket, segments: 12, radialSegments: 4, name: 'bail' });
  if (T.ruin) {
    root.updateMatrixWorld(true);
    ruinCut(root, T, Hh * 0.75, { jag: 0.15, slope: 0.1 });
    rubble(root, T, new THREE.Box3(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 1, 1)), 8, 0.22, { kind: 'block' });
  }
  return done(root, T, () => {
    const b = root.getObjectByName('bucket'), r = root.getObjectByName('rope'), c = root.getObjectByName('crank'), line = root.getObjectByName('rope-line');
    if (!b || !r || !line) return [];
    const drop = 0.6;
    return [clip('draw', 6, [
      moveTrack(b, 6, (t) => [0, -pingPong(t) * drop + pingPong(t) * 0.0, -pingPong(t) * (b.position.z - r.position.z) * 0]),
      scaleTrack(line, 6, (t) => [1, 1 + (pingPong(t) * drop) / Math.max(0.1, rl), 1]),
      c ? rotateTrack(c, 'x', 6, (t) => pingPong(t) * 6) : null,
    ])];
  });
}

/* ---------------------------------- carts ---------------------------------- */

/** Spoked wooden wheel with an iron tyre, axle along z, centre at origin. */
export function spokedWheel(parent, T, R, { spokes = 12, w = 0.09, name = 'wheel', at = [0, 0, 0] } = {}) {
  const g = group(name, { parent, at });
  const m = T.mats;
  mesh(new THREE.TorusGeometry(R - 0.045, 0.045, 6, 40).scale(1, 1, w / 0.09), m.wood, { parent: g, name: 'felloe' });
  mesh(new THREE.TorusGeometry(R - 0.012, 0.016, 4, 48).scale(1, 1, (w / 0.09) * 1.6), m.iron, { parent: g, name: 'tyre' });
  mesh(lathe([[0.03, -w * 1.6], [0.1, -w * 1.5], [0.12, -w * 0.5], [0.12, w * 0.5], [0.1, w * 1.5], [0.03, w * 1.6]], 16).rotateX(Math.PI / 2), m.wood2, { parent: g, name: 'hub' });
  const sp = [];
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    sp.push({ p: [Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, 0], r: [0, 0, a - Math.PI / 2], s: [1, 1, 1] });
  }
  instanced(new THREE.CylinderGeometry(0.02, 0.028, R - 0.1, 6), m.wood, sp, g, 'spokes');
  return g;
}

const CART_VARIANTS = { 'hand-cart': {}, 'ox-cart': {}, 'hay-wagon': {}, 'barrel-cart': {} };

export function createMedievalCart(options = {}) {
  const { variant, T } = setup(options, CART_VARIANTS, 'medieval-cart');
  const root = group(`medieval-cart-${variant}`);
  const m = T.mats;
  const wood = m.wood;
  const body = group('cart', { parent: root });
  const four = variant === 'hay-wagon';
  const R = variant === 'hand-cart' ? 0.5 : variant === 'ox-cart' ? 0.78 : 0.62;
  const L = variant === 'hand-cart' ? 1.3 : four ? 3.6 : 2.2;
  const Wd = variant === 'hand-cart' ? 0.9 : 1.4;
  const track = Wd / 2 + 0.16;
  const wheels = [];
  const axles = four ? [-L * 0.32, L * 0.32] : [0];
  for (const ax of axles) {
    mesh(new THREE.CylinderGeometry(0.05, 0.05, track * 2 + 0.3, 10).rotateX(Math.PI / 2), m.wood2, { parent: body, at: [ax, R, 0], name: 'axle' });
    for (const s of [-1, 1]) wheels.push(spokedWheel(body, T, four && ax < 0 ? R * 0.85 : R, { at: [ax, four && ax < 0 ? R * 0.85 : R, s * track], name: `wheel_${wheels.length}` }));
  }
  if (four) wheels[0].position.y = wheels[1].position.y = R * 0.85;
  const bedY = R + 0.1;
  // bed on bolsters
  for (const ax of axles) mesh(roundedBox(0.16, 0.14, Wd + 0.1, 0.02), m.wood2, { parent: body, at: [ax, R + 0.03, 0], name: 'bolster' });
  mesh(roundedBox(L, 0.07, Wd, 0.015), wood, { parent: body, at: [0, bedY, 0], name: 'bed' });
  const boards = [];
  const sideH = variant === 'barrel-cart' ? 0.25 : 0.45;
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) boards.push({ p: [0, bedY + 0.08 + k * (sideH / 3), s * (Wd / 2 - 0.02)], s: [L, sideH / 3 - 0.02, 0.04] });
    if (variant !== 'hand-cart') for (let k = 0; k < 3; k++) boards.push({ p: [s * (L / 2 - 0.02), bedY + 0.08 + k * (sideH / 3), 0], s: [0.04, sideH / 3 - 0.02, Wd] });
  }
  instanced(roundedBox(1, 1, 1, 0.1, 1), wood, boards, body, 'side-boards');
  const stakes = [];
  for (let i = 0; i < Math.round(L / 0.5) + 1; i++) for (const s of [-1, 1]) stakes.push({ p: [-L / 2 + 0.06 + (i * (L - 0.12)) / Math.round(L / 0.5), bedY + sideH / 2 + 0.06, s * (Wd / 2 + 0.01)], s: [0.06, sideH + 0.12, 0.05] });
  instanced(roundedBox(1, 1, 1, 0.15, 1), m.wood2, stakes, body, 'stakes');
  // shafts / handles / tongue (resting on a prop at the front)
  const front = L / 2;
  if (variant === 'hand-cart') {
    for (const s of [-1, 1]) curveTube([[-front + 0.1, bedY, s * 0.35], [front + 0.3, bedY - 0.05, s * 0.33], [front + 0.95, 0.75, s * 0.3]], 0.03, wood, { parent: body, segments: 12, radialSegments: 8, name: 'handle' });
    mesh(roundedBox(0.06, 0.82, 0.06, 0.01), m.wood2, { parent: body, at: [front + 0.3, 0.41, 0], name: 'prop-leg' });
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6).rotateX(Math.PI / 2), m.wood2, { parent: body, at: [front + 0.3, 0.75, 0], name: 'prop-bar' });
    curveTube([[front + 0.3, 0.8, 0], [front + 0.3, bedY - 0.02, 0.0]], 0.02, m.wood2, { parent: body, name: 'prop-link' });
  } else if (four) {
    curveTube([[front - 0.4, R * 0.9, 0], [front + 1.4, 0.45, 0], [front + 2.2, 0.06, 0]], 0.05, wood, { parent: body, segments: 12, radialSegments: 8, name: 'tongue' });
  } else {
    for (const s of [-1, 1]) curveTube([[-front + 0.1, bedY - 0.04, s * 0.45], [front + 0.6, bedY - 0.02, s * 0.45], [front + 1.8, 0.7, s * 0.42], [front + 2.4, 0.06, s * 0.4]], 0.045, wood, { parent: body, segments: 16, radialSegments: 8, name: 'shaft' });
    mesh(roundedBox(0.08, 0.08, 1.0, 0.02), m.wood2, { parent: body, at: [front + 1.8, 0.72, 0], name: 'swingletree' });
  }
  // loads
  if (four) {
    const hay = cushion(L - 0.2, 1.1, Wd + 0.3, { bulge: 0.35 });
    mesh(hay, m.straw, { parent: body, at: [0, bedY + 0.6, 0], name: 'hay' });
    const tufts = [];
    for (let i = 0; i < 40; i++) tufts.push({ p: [(T.r() - 0.5) * L * 0.9, bedY + 1.0 + T.r() * 0.15, (T.r() - 0.5) * Wd], r: [T.r(), T.r() * 6, T.r()], s: [0.2, 0.06, 0.08] });
    instanced(new THREE.SphereGeometry(1, 6, 4), m.straw, tufts, body, 'hay-tufts');
    curveTube([[-L / 2 + 0.2, bedY + 0.05, Wd / 2 + 0.02], [-L / 2 + 0.3, bedY + 1.17, 0], [-L / 2 + 0.2, bedY + 0.05, -Wd / 2 - 0.02]], 0.015, m.rope, { parent: body, segments: 16, radialSegments: 4, name: 'rope' });
    curveTube([[L / 2 - 0.2, bedY + 0.05, Wd / 2 + 0.02], [L / 2 - 0.3, bedY + 1.17, 0], [L / 2 - 0.2, bedY + 0.05, -Wd / 2 - 0.02]], 0.015, m.rope, { parent: body, segments: 16, radialSegments: 4, name: 'rope' });
  } else if (variant === 'barrel-cart') {
    for (const [x, z] of [[-0.5, -0.3], [0.1, 0.3], [0.65, -0.25]]) {
      const bg = group('barrel', { parent: body, at: [x, bedY + 0.035, z] });
      mesh(lathe([[0, 0], [0.24, 0], [0.29, 0.35], [0.24, 0.7], [0, 0.7]], 18), m.wood2, { parent: bg, name: 'barrel' });
      for (const y of [0.08, 0.25, 0.45, 0.62]) mesh(new THREE.TorusGeometry(0.255 + Math.sin((y / 0.7) * Math.PI) * 0.035, 0.012, 4, 24).rotateX(Math.PI / 2), m.iron, { parent: bg, at: [0, y, 0], name: 'hoop' });
    }
  } else if (variant === 'ox-cart') {
    for (let i = 0; i < 4; i++) mesh(cushion(0.6, 0.35, 0.45, { bulge: 0.2 }), (m.sack ??= M.fabric(T.night ? '#6c5f4c' : '#b49a6c')), { parent: body, at: [-0.6 + i * 0.4, bedY + 0.2, (i % 2 ? 1 : -1) * 0.25], rot: [0, i * 0.4, 0], name: 'sack' });
  } else {
    for (let i = 0; i < 6; i++) mesh(rockGeo(1, i + 9).scale(0.12, 0.1, 0.12), m.stone, { parent: body, at: [-0.4 + (i % 3) * 0.35, bedY + 0.1, (i < 3 ? -1 : 1) * 0.18], name: 'stones' });
  }
  if (T.ruin) {
    // a wheel off and lying flat; cart tipped onto its axle end
    const w = wheels[wheels.length - 1];
    w.removeFromParent();
    root.add(w);
    w.rotation.set(Math.PI / 2, 0, 0.3);
    w.position.set(0.3, 0.075, track + 1.4);
    const tilt = Math.atan2(R, track * 2);
    body.rotation.x = -tilt;
    body.position.set(0, 0, 0);
    root.updateMatrixWorld(true);
    body.position.y -= new THREE.Box3().setFromObject(body).min.y;
    w.position.y -= new THREE.Box3().setFromObject(w).min.y;
    root.updateMatrixWorld(true);
    rubble(root, T, new THREE.Box3().setFromObject(body), 5, 0.12, { mat: wood, kind: 'block' });
  }
  return done(root, T, () => {
    const ws = [];
    root.traverse((o) => { if (/^wheel_\d+$/.test(o.name) && o.parent === body) ws.push(o); });
    return ws.length ? [clip('roll', 2, ws.map((w) => spinTrack(w, 'z', 2, -1)))] : [];
  });
}

/* --------------------------------- banners --------------------------------- */

/** Heraldic colour at (u along fly 0..1, v height 0..1). */
function heraldry(T, kind, u, v, c1, c2) {
  const h = T.heraldry ?? kind;
  const A = c1, B = c2;
  switch (h) {
    case 'cross': return Math.abs(u - 0.4) < 0.08 || Math.abs(v - 0.55) < 0.07 ? B : A;
    case 'checky': return (Math.floor(u * 6) + Math.floor(v * 8)) % 2 ? A : B;
    case 'chevron': return Math.abs(v - (0.35 + Math.abs(u - 0.5) * -0.8 + 0.4)) < 0.1 ? B : A;
    case 'quarterly': return (u < 0.5) !== (v < 0.5) ? B : A;
    case 'saltire': return Math.abs(u - v) < 0.09 || Math.abs(u - (1 - v)) < 0.09 ? B : A;
    case 'royal': return (Math.floor(u * 5 + v * 5) + Math.floor(u * 5 - v * 5 + 10)) % 2 ? A : B;
    case 'bend': return Math.abs(u - v) < 0.14 ? B : A;
    case 'pale': return Math.abs(u - 0.5) < 0.17 ? B : A;
    case 'fess': return Math.abs(v - 0.5) < 0.14 ? B : A;
    default: return A;
  }
}

/**
 * Cloth sheet in the XY plane: attached along x=0 (pole) or y=top (crossbar).
 * Wave morph target (amplitude grows away from the attached edge). Vertex-coloured heraldry.
 */
function clothGeo(T, w, h, { attach = 'left', tail = 'none', kind = 'cross', nx = 24, ny = 30, amp = 0.12 }) {
  const g = new THREE.PlaneGeometry(w, h, nx, ny);
  g.translate(w / 2, -h / 2, 0); // attached corner at origin (top-left)
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c1 = M.toColor(T.cloth ?? T.o?.color ?? '#9a1f1f'), c2 = M.toColor(T.cloth2 ?? '#d9b04a');
  if (T.clothFade) { c1.lerp(new THREE.Color('#a39a88'), T.clothFade); c2.lerp(new THREE.Color('#a39a88'), T.clothFade); }
  const morph = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    let u = x / w, v = 1 + y / h;
    // tails
    if (tail === 'swallow' && u > 0.75) { const k = (u - 0.75) / 0.25; if (Math.abs(v - 0.5) < k * 0.5 * 0.9) pos.setY(i, y); }
    if (tail === 'point') pos.setY(i, -h * (1 - v) * (1 - u * 0.85) - h * u * 0.425 * 0);
    if (tail === 'point') pos.setY(i, -h / 2 + (v - 0.5) * h * (1 - u * 0.92));
    if (tail === 'hang-point') pos.setY(i, y - (1 - Math.abs(u - 0.5) * 2) * (v < 0.3 ? (0.3 - v) * h * 0.5 : 0));
    const c = heraldry(T, kind, attach === 'top' ? u : u, attach === 'top' ? v : v, c1, c2);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    const d = attach === 'top' ? 1 - v : u;
    const phase = attach === 'top' ? y * 3 : x * 3.2;
    const base = Math.sin(phase * 2.2) * amp * d;
    pos.setZ(i, base);
    morph[i * 3 + 2] = Math.cos(phase * 2.2) * amp * d * 1.2;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  // tattered / swallowtail: drop triangles
  if (tail === 'swallow' || tail === 'tri' || T.tattered) {
    const idx = g.index.array, keep = [];
    for (let t = 0; t < idx.length; t += 3) {
      let cx = 0, cy = 0;
      for (let k = 0; k < 3; k++) { cx += pos.getX(idx[t + k]) / 3; cy += pos.getY(idx[t + k]) / 3; }
      const u = cx / w, v = 1 + cy / h;
      let drop = false;
      if (tail === 'swallow' && u > 0.72 && Math.abs(v - 0.5) < ((u - 0.72) / 0.28) * 0.42) drop = true;
      if (tail === 'tri' && v < 0.25 && Math.abs(((u * 3) % 1) - 0.5) > (v / 0.25) * 0.5) drop = true;
      if (T.tattered) {
        const d = attach === 'top' ? 1 - v : u;
        if (d > 0.35 && noise3(u * 7, v * 7, 3) > 0.92 - d * 0.35) drop = true;
      }
      if (!drop) keep.push(idx[t], idx[t + 1], idx[t + 2]);
    }
    g.setIndex(keep);
  }
  g.morphAttributes.position = [new THREE.BufferAttribute(morph, 3)];
  g.morphTargetsRelative = true;
  g.computeVertexNormals();
  return g;
}

const BANNER_VARIANTS = {
  hanging: { kind: 'pale' },
  flag: { kind: 'quarterly' },
  pennant: { kind: 'fess' },
  gonfalon: { kind: 'cross' },
  tapestry: { kind: 'royal' },
};

export function createBanner(options = {}) {
  const { variant, T, V } = setup(options, BANNER_VARIANTS, 'heraldic-banner');
  const root = group(`heraldic-banner-${variant}`);
  const m = T.mats;
  const wood = m.wood;
  const clothMat = new THREE.MeshPhysicalMaterial({ name: 'cloth', vertexColors: true, color: T.night ? '#9aa0b8' : '#ffffff', roughness: 0.9, sheen: 0.8, sheenRoughness: 0.6, side: THREE.DoubleSide });
  const metal = T.gild ? m.gold : (m.finial ??= M.metal('#b8913f', 0.3));
  let cloth;
  const base = (h) => {
    mesh(roundedBox(0.6, 0.25, 0.6, 0.04), m.stone2, { parent: root, at: [0, 0.125, 0], name: 'base-stone' });
    mesh(lathe([[0, 0], [0.12, 0], [0.09, 0.1], [0.06, 0.18], [0, 0.18]], 16), metal, { parent: root, at: [0, 0.245, 0], name: 'socket' });
    mesh(new THREE.CylinderGeometry(0.035, 0.04, h, 12), wood, { parent: root, at: [0, 0.25 + h / 2, 0], name: 'pole' });
    mesh(lathe([[0, 0], [0.05, 0], [0.07, 0.06], [0.04, 0.14], [0, 0.22]], 14), metal, { parent: root, at: [0, 0.25 + h - 0.01, 0], name: 'finial' });
    return 0.25 + h;
  };
  if (variant === 'hanging' || variant === 'gonfalon') {
    const top = base(3.4);
    const bw = variant === 'gonfalon' ? 1.1 : 0.8, bh = variant === 'gonfalon' ? 1.6 : 2.0;
    mesh(new THREE.CylinderGeometry(0.025, 0.025, bw + 0.3, 10).rotateZ(Math.PI / 2), wood, { parent: root, at: [0.0, top - 0.3, 0.06], name: 'crossbar' });
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.04, 10, 8), metal, { parent: root, at: [s * (bw / 2 + 0.15), top - 0.3, 0.06], name: 'knob' });
    curveTube([[-bw / 2 - 0.1, top - 0.3, 0.06], [0, top - 0.02, 0.06], [bw / 2 + 0.1, top - 0.3, 0.06]], 0.008, m.rope, { parent: root, segments: 10, radialSegments: 4, name: 'cord' });
    cloth = mesh(clothGeo(T, bw, bh, { attach: 'top', tail: variant === 'gonfalon' ? 'tri' : 'none', kind: V.kind, nx: 16, ny: 28, amp: 0.06 }), clothMat, { parent: root, at: [-bw / 2, top - 0.3, 0.06], name: 'cloth' });
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 10), wood, { parent: root, at: [0, top - 0.3, 0.06], name: 'collar' }).scale.set(1, 3, 1);
  } else if (variant === 'flag' || variant === 'pennant') {
    const H = variant === 'pennant' ? 3.8 : 4.6;
    const top = base(H);
    const fw = variant === 'pennant' ? 2.2 : 1.5, fh = variant === 'pennant' ? 0.55 : 1.0;
    cloth = mesh(clothGeo(T, fw, fh, { attach: 'left', tail: variant === 'pennant' ? 'point' : T.tattered ? 'none' : 'none', kind: V.kind, nx: 30, ny: 12, amp: 0.1 }), clothMat, { parent: root, at: [0.02, top - 0.25, 0], name: 'cloth' });
    for (const y of [0.05, fh - 0.05]) mesh(new THREE.TorusGeometry(0.045, 0.008, 4, 12).rotateX(Math.PI / 2), m.rope, { parent: root, at: [0, top - 0.25 - y, 0], name: 'ring' });
  } else if (variant === 'tapestry') {
    const W = 2.4, Hh = 2.6;
    for (const s of [-1, 1]) {
      mesh(roundedBox(0.12, 3.3, 0.12, 0.02), wood, { parent: root, at: [s * (W / 2 + 0.15), 1.65, 0], name: 'post' });
      mesh(roundedBox(0.7, 0.1, 0.16, 0.02), wood, { parent: root, at: [s * (W / 2 + 0.15), 0.05, 0], name: 'foot' });
      mesh(roundedBox(0.16, 0.1, 0.7, 0.02), wood, { parent: root, at: [s * (W / 2 + 0.15), 0.05, 0], name: 'foot' });
    }
    mesh(new THREE.CylinderGeometry(0.035, 0.035, W + 0.5, 12).rotateZ(Math.PI / 2), wood, { parent: root, at: [0, 3.15, 0.08], name: 'rod' });
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.06, 10, 8), metal, { parent: root, at: [s * (W / 2 + 0.25), 3.15, 0.08], name: 'knob' });
    cloth = mesh(clothGeo(T, W, Hh, { attach: 'top', kind: V.kind, nx: 30, ny: 30, amp: 0.025 }), clothMat, { parent: root, at: [-W / 2, 3.15, 0.08], name: 'cloth' });
    // fringe
    const fr = [];
    for (let i = 0; i < 40; i++) fr.push({ p: [-W / 2 + 0.03 + (i * (W - 0.06)) / 39, 3.15 - Hh - 0.04, 0.08], s: [0.012, 0.1, 0.012] });
    if (!T.tattered) instanced(new THREE.BoxGeometry(1, 1, 1), m.cloth2, fr, root, 'fringe');
  }
  if (T.ruin) {
    // pole snapped: banner lying crumpled on the ground beside a broken stump
    ruinCut(root, T, 1.2, { jag: 0.05, topple: true });
  }
  return done(root, T, () => {
    const c = root.getObjectByName('cloth');
    if (!c || !c.morphTargetInfluences) return [];
    return [clip('wave', 2, [numberTrack('cloth.morphTargetInfluences[0]', 2, (t) => Math.sin(t * Math.PI * 2), 24)])];
  });
}

/* ---------------------------------- throne ---------------------------------- */

const THRONE_VARIANTS = { stone: { stone: '#a49c8f' }, 'carved-oak': {}, royal: {}, iron: {}, cathedra: {} };

export function createThrone(options = {}) {
  const { variant, T } = setup(options, THRONE_VARIANTS, 'throne');
  const root = group(`throne-${variant}`);
  const m = T.mats;
  const frame = variant === 'stone' ? m.stone : variant === 'iron' ? (T.wear ? m.iron : (m.forged ??= M.metal('#2d2e31', 0.45))) : variant === 'royal' ? (T.wood && !T.gild ? m.wood : m.gold) : m.wood;
  const trim = T.gild || variant === 'royal' ? m.gold : variant === 'iron' ? m.iron : m.wood2;
  const velvet = m.cloth;
  // dais
  mesh(roundedBox(2.2, 0.18, 1.9, 0.03), m.stone2, { parent: root, at: [0, 0.09, 0], name: 'dais' });
  mesh(roundedBox(1.7, 0.18, 1.5, 0.03), m.stone, { parent: root, at: [0, 0.27, -0.1], name: 'dais' });
  const y0 = 0.36 - 0.005;
  const W = variant === 'stone' ? 1.1 : 0.9, D = 0.75, seatH = 0.48;
  const backH = variant === 'cathedra' ? 2.4 : variant === 'royal' ? 2.0 : variant === 'stone' ? 1.7 : 1.6;
  const g = group('throne', { parent: root, at: [0, y0, -0.15] });
  if (variant === 'stone') {
    mesh(roundedBox(W, seatH, D, 0.05), frame, { parent: g, at: [0, seatH / 2, 0], name: 'seat-block' });
    mesh(roundedBox(W + 0.1, 0.12, D + 0.06, 0.04), m.accent, { parent: g, at: [0, seatH + 0.05, 0], name: 'seat' });
    const back = extrudeOutline([[-W / 2, 0], [W / 2, 0], [W / 2, backH * 0.75], [0, backH], [-W / 2, backH * 0.75]], 0.25, { bevel: 0.03 });
    mesh(back, frame, { parent: g, at: [0, seatH - 0.01, -D / 2 + 0.12], name: 'back' });
    mesh(new THREE.CircleGeometry(0.18, 24), m.detail, { parent: g, at: [0, seatH + backH * 0.68, -D / 2 + 0.251], name: 'sun-disc' });
    for (const s of [-1, 1]) mesh(roundedBox(0.2, 0.42, D, 0.05), frame, { parent: g, at: [s * (W / 2 + 0.08), seatH + 0.2, 0], name: 'arm' });
  } else {
    // legs, seat frame, arms, back
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const legH = sz < 0 ? seatH + backH : seatH + 0.3;
      if (variant === 'iron') mesh(new THREE.CylinderGeometry(0.03, 0.035, legH, 10), frame, { parent: g, at: [sx * (W / 2 - 0.04), legH / 2, sz * (D / 2 - 0.04)], name: 'leg' });
      else mesh(lathe([[0, 0], [0.05, 0], [0.045, 0.1], [0.035, 0.18], [0.045, 0.3], [0.04, legH - 0.05], [0.05, legH - 0.02], [0, legH]], 14), frame, { parent: g, at: [sx * (W / 2 - 0.05), 0, sz * (D / 2 - 0.05)], name: 'leg' });
      const fy = legH;
      if (variant === 'cathedra' && sz < 0) {
        mesh(new THREE.ConeGeometry(0.07, 0.45, 4), trim, { parent: g, at: [sx * (W / 2 - 0.05), fy + 0.22, sz * (D / 2 - 0.05)], name: 'pinnacle' });
      } else mesh(new THREE.SphereGeometry(0.06, 12, 10), trim, { parent: g, at: [sx * (W / 2 - 0.05), fy + 0.03, sz * (D / 2 - 0.05)], name: 'finial' });
    }
    mesh(roundedBox(W, 0.08, D, 0.02), frame, { parent: g, at: [0, seatH - 0.04, 0], name: 'seat-frame' });
    mesh(roundedBox(W - 0.06, 0.32, 0.04, 0.01), frame, { parent: g, at: [0, seatH - 0.24, D / 2 - 0.05], name: 'apron' });
    mesh(cushion(W - 0.08, 0.12, D - 0.08, { bulge: 0.3 }), velvet, { parent: g, at: [0, seatH + 0.05, 0], name: 'seat-cushion' });
    for (const s of [-1, 1]) {
      mesh(roundedBox(0.08, 0.06, D, 0.02), frame, { parent: g, at: [s * (W / 2 - 0.05), seatH + 0.3, 0], name: 'arm' });
      if (variant !== 'iron') mesh(roundedBox(0.04, 0.26, D - 0.12, 0.01), trim, { parent: g, at: [s * (W / 2 - 0.05), seatH + 0.15, 0], name: 'arm-panel' });
      else for (let k = 0; k < 3; k++) curveTube([[s * (W / 2 - 0.05), seatH + 0.02, -0.2 + k * 0.2], [s * (W / 2 - 0.05), seatH + 0.18, -0.1 + k * 0.2], [s * (W / 2 - 0.05), seatH + 0.3, -0.2 + k * 0.2]], 0.012, frame, { parent: g, segments: 8, radialSegments: 5, name: 'scroll' });
    }
    // back panel
    const bp = variant === 'cathedra'
      ? extrudeOutline([[-W / 2 + 0.05, 0], [W / 2 - 0.05, 0], [W / 2 - 0.05, backH * 0.7], [0, backH], [-W / 2 + 0.05, backH * 0.7]], 0.05, { bevel: 0.01 })
      : extrudeOutline([[-W / 2 + 0.05, 0], [W / 2 - 0.05, 0], [W / 2 - 0.05, backH * 0.82], [W * 0.25, backH * 0.9], [0, backH], [-W * 0.25, backH * 0.9], [-W / 2 + 0.05, backH * 0.82]], 0.05, { bevel: 0.01 });
    if (variant === 'iron') {
      for (let k = 0; k < 7; k++) mesh(new THREE.CylinderGeometry(0.012, 0.012, backH * 0.8, 6), frame, { parent: g, at: [-W / 2 + 0.1 + (k * (W - 0.2)) / 6, seatH + backH * 0.4, -D / 2 + 0.05], name: 'bar' });
      mesh(roundedBox(W, 0.05, 0.05, 0.01), frame, { parent: g, at: [0, seatH + backH * 0.8, -D / 2 + 0.05], name: 'top-rail' });
      curveTube(Array.from({ length: 9 }, (_, i) => { const a = (i / 8) * Math.PI; return [Math.cos(a) * W * 0.42, seatH + backH * 0.8 + Math.sin(a) * 0.35, -D / 2 + 0.05]; }), 0.02, frame, { parent: g, segments: 24, radialSegments: 6, name: 'crest' });
    } else {
      mesh(bp, frame, { parent: g, at: [0, seatH, -D / 2 + 0.05], name: 'back' });
      mesh(cushion(W * 0.66, backH * 0.55, 0.08, { bulge: 0.2 }), velvet, { parent: g, at: [0, seatH + backH * 0.38, -D / 2 + 0.1], name: 'back-cushion' });
      if (variant === 'royal') {
        // crown crest
        const cr = group('crest', { parent: g, at: [0, seatH + backH - 0.02, -D / 2 + 0.05] });
        mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.12, 20, 1, true), m.gold, { parent: cr, at: [0, 0.06, 0], name: 'crown-band' }).material.side = THREE.DoubleSide;
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; mesh(new THREE.ConeGeometry(0.03, 0.1, 6), m.gold, { parent: cr, at: [Math.cos(a) * 0.15, 0.16, Math.sin(a) * 0.15], name: 'crown-point' }); }
        for (let i = 0; i < 5; i++) mesh(new THREE.OctahedronGeometry(0.025), (m.gem ??= new THREE.MeshPhysicalMaterial({ name: 'gem', color: '#b0102a', roughness: 0.05, clearcoat: 1 })), { parent: g, at: [-W * 0.3 + i * W * 0.15, seatH + backH * 0.8, -D / 2 + 0.105], name: 'gem' });
      }
      if (variant === 'cathedra') for (const s of [-1, 0, 1]) mesh(roundedBox(0.04, backH * 0.4, 0.03, 0.01), trim, { parent: g, at: [s * W * 0.22, seatH + backH * 0.68, -D / 2 + 0.085], name: 'tracery' });
    }
  }
  // footstool
  mesh(roundedBox(0.6, 0.14, 0.3, 0.03), variant === 'stone' ? m.stone : frame, { parent: root, at: [0, y0 + 0.07, 0.55], name: 'footstool' });
  if (variant !== 'stone' && variant !== 'iron') mesh(cushion(0.54, 0.06, 0.26, { bulge: 0.3 }), velvet, { parent: root, at: [0, y0 + 0.16, 0.55], name: 'footstool-cushion' });
  if (T.ruin) {
    ruinCut(root, T, y0 + seatH + 0.25, { jag: 0.12, slope: 0.1 });
    rubble(root, T, new THREE.Box3(new THREE.Vector3(-1.1, 0, -1), new THREE.Vector3(1.1, 1, 1)), 5, 0.14);
  }
  return done(root, T);
}

/* ------------------------------- treasure chest ------------------------------- */

const CHEST_VARIANTS = {
  banded: { L: 0.9, W: 0.55, H: 0.45 },
  domed: { L: 0.85, W: 0.52, H: 0.42 },
  strongbox: { L: 0.7, W: 0.45, H: 0.4 },
  casket: { L: 0.36, W: 0.24, H: 0.16 },
  'sea-chest': { L: 1.0, W: 0.5, H: 0.5 },
};

export function createTreasureChest(options = {}) {
  const { variant, T, V } = setup(options, CHEST_VARIANTS, 'treasure-chest');
  const root = group(`treasure-chest-${variant}`);
  const m = T.mats;
  const { L, W, H } = V;
  const k = L / 0.9;
  const t = 0.03 * Math.max(0.6, k);
  const iron = variant === 'strongbox';
  const shell = iron ? (m.boxIron ??= M.metal(T.wear ? '#4a3a2e' : '#3a3b3e', 0.5)) : m.wood;
  const band = T.gild || variant === 'casket' ? m.gold : m.iron;
  const feet = variant === 'casket' ? 0.03 : 0;
  const g = group('chest', { parent: root, at: [0, feet, 0] });
  if (feet) for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.SphereGeometry(0.022, 10, 8), m.gold, { parent: root, at: [sx * (L / 2 - 0.03), 0.02, sz * (W / 2 - 0.03)], name: 'foot' });
  // hollow box
  mesh(roundedBox(L, t, W, t * 0.3), shell, { parent: g, at: [0, t / 2, 0], name: 'floor' });
  for (const s of [-1, 1]) {
    mesh(roundedBox(L, H, t, t * 0.3), shell, { parent: g, at: [0, H / 2, s * (W / 2 - t / 2)], name: 'side' });
    mesh(roundedBox(t, H, W - 2 * t + 0.004, t * 0.3), shell, { parent: g, at: [s * (L / 2 - t / 2), H / 2, 0], name: 'end' });
  }
  // bands and corner plates
  const nb = variant === 'casket' ? 2 : 3 + (T.ironHeavy ? 2 : 0);
  for (let i = 0; i < nb; i++) {
    const x = -L / 2 + L * 0.15 + (i * L * 0.7) / Math.max(1, nb - 1);
    for (const s of [-1, 1]) mesh(roundedBox(0.04 * k, H, 0.008, 0.003), band, { parent: g, at: [x, H / 2, s * (W / 2 + 0.003)], name: 'band' });
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(roundedBox(0.07 * k, 0.07 * k, 0.07 * k, 0.01 * k), band, { parent: g, at: [sx * (L / 2 - 0.03 * k), 0.035 * k, sz * (W / 2 - 0.03 * k)], name: 'corner' });
  // handles
  for (const s of [-1, 1]) {
    if (variant === 'sea-chest') curveTube([[s * (L / 2 + 0.005), H * 0.7, -0.08], [s * (L / 2 + 0.05), H * 0.55, 0], [s * (L / 2 + 0.005), H * 0.7, 0.08]], 0.012, m.rope, { parent: g, segments: 10, radialSegments: 5, name: 'rope-handle' });
    else mesh(new THREE.TorusGeometry(0.04 * k, 0.007 * k, 6, 16, Math.PI).rotateY(Math.PI / 2).rotateX(Math.PI), m.iron, { parent: g, at: [s * (L / 2 + 0.008 * k), H * 0.72, 0], name: 'handle' });
  }
  // treasure inside: coins heaped, gems, a goblet
  const coins = [];
  const r = T.r;
  const heap = H * 0.7;
  for (let i = 0; i < 160; i++) {
    const x = (r() - 0.5) * (L - 2 * t - 0.04), z = (r() - 0.5) * (W - 2 * t - 0.04);
    const hgt = heap * 0.75 * (1 - Math.min(1, (Math.abs(x) / (L / 2)) ** 2 * 0.5 + (Math.abs(z) / (W / 2)) ** 2 * 0.5)) * (0.5 + r() * 0.5);
    coins.push({ p: [x, t + 0.004 + hgt, z], r: [(r() - 0.5) * 0.8, r() * 6, (r() - 0.5) * 0.8], s: [k, 1, k] });
  }
  const coinGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.003, 12);
  const gold = M.metal(T.coin === 'silver' ? '#c9ccd2' : '#e0b445', 0.25);
  // a solid heap of coins under the loose ones (so every coin rests on something)
  mesh(cushion(L - 2 * t - 0.01, heap, W - 2 * t - 0.01, { bulge: 0.45 }), gold, { parent: g, at: [0, t + heap * 0.3, 0], scale: [1, 0.85, 1], name: 'coin-heap' });
  instanced(coinGeo, gold, coins, g, 'coins');
  const gems = [];
  for (let i = 0; i < 10; i++) gems.push({ p: [(r() - 0.5) * L * 0.6, t + heap * 0.6 + r() * 0.03, (r() - 0.5) * W * 0.5], r: [r(), r(), r()], s: 0.015 * k + r() * 0.01, c: ['#c0102a', '#1f6fd0', '#18a050', '#9b30c8'][i % 4] });
  instanced(new THREE.OctahedronGeometry(1), new THREE.MeshPhysicalMaterial({ name: 'gem', color: 0xffffff, roughness: 0.05, clearcoat: 1 }), gems, g, 'gems');
  mesh(lathe([[0, 0], [0.03, 0], [0.01, 0.01], [0.008, 0.05], [0.035, 0.07], [0.04, 0.11], [0.036, 0.11], [0.03, 0.075], [0, 0.07]], 16).scale(k, k, k), m.gold, { parent: g, at: [L * 0.22, t + heap * 0.62, 0], rot: [0, 0, -0.3], name: 'goblet' });
  // lid, hinged at the back top edge
  const hinge = group('lid', { parent: g, at: [0, H - 0.004, -W / 2] });
  const lidW = W + 0.01;
  if (variant === 'domed' || variant === 'casket') {
    const dome = new THREE.CylinderGeometry(lidW / 2, lidW / 2, L, 24, 1, false, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2).rotateY(0);
    dome.rotateX(Math.PI / 2).rotateX(-Math.PI / 2);
    mesh(new THREE.CylinderGeometry(lidW / 2, lidW / 2, L + 0.004, 24, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.55, 1), shell, { parent: hinge, at: [0, 0, lidW / 2], name: 'lid-dome' });
    for (let i = 0; i < nb; i++) {
      const x = -L / 2 + L * 0.15 + (i * L * 0.7) / Math.max(1, nb - 1);
      mesh(new THREE.TorusGeometry(lidW / 2 + 0.003, 0.004 * Math.max(1, k * 1.5), 4, 20, Math.PI).rotateY(Math.PI / 2).scale(1, 0.55, 1), band, { parent: hinge, at: [x, 0, lidW / 2], name: 'lid-band' });
    }
  } else {
    mesh(roundedBox(L + 0.01, 0.05 * k + 0.01, lidW, 0.01), shell, { parent: hinge, at: [0, 0.025 * k + 0.005, lidW / 2], name: 'lid-top' });
    for (let i = 0; i < nb; i++) {
      const x = -L / 2 + L * 0.15 + (i * L * 0.7) / Math.max(1, nb - 1);
      mesh(roundedBox(0.04 * k, 0.008, lidW + 0.006, 0.003), band, { parent: hinge, at: [x, 0.05 * k + 0.012, lidW / 2], name: 'lid-band' });
    }
  }
  mesh(roundedBox(0.07 * k, 0.09 * k, 0.012, 0.004), band, { parent: hinge, at: [0, -0.03 * k, lidW + 0.004], name: 'hasp' });
  mesh(roundedBox(0.08 * k, 0.07 * k, 0.012, 0.004), band, { parent: g, at: [0, H - 0.07 * k, W / 2 + 0.004], name: 'lock-plate' });
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.008 * Math.max(1, k), 0.008 * Math.max(1, k), 0.06 * k, 8).rotateZ(Math.PI / 2), band, { parent: g, at: [s * L * 0.3, H, -W / 2 - 0.002], name: 'hinge-pin' });
  const openA = -1.15;
  hinge.rotation.x = openA;
  if (T.ruin) {
    // lid torn off, coins spilled on the ground
    hinge.rotation.x = 0;
    hinge.removeFromParent();
    root.add(hinge);
    hinge.rotation.set(0.15, 0.6, Math.PI / 2 * 0);
    hinge.position.set(L * 0.9, 0.0, W * 0.4);
    root.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(hinge);
    hinge.position.y -= b.min.y;
    const sp = [];
    for (let i = 0; i < 40; i++) sp.push({ p: [(r() - 0.5) * L * 1.6, 0.0015, W / 2 + 0.05 + r() * W * 0.8], r: [0, r() * 6, 0], s: [k, 1, k] });
    instanced(coinGeo, gold, sp, root, 'spilled-coins');
    g.rotation.z = 0;
  }
  return done(root, T, () => {
    const l = root.getObjectByName('lid');
    if (!l || T.ruin) return [];
    return [clip('open', 4, [rotateTrack(l, 'x', 4, (tt) => (1 - pingPong(tt)) * -openA)])];
  });
}
