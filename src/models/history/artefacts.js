// Small artefacts: coins, scrolls, oil lamps, hourglasses, sundials and map tables.
import { THREE, M, mesh, group, roundedBox, extrudeOutline, curveTube, cushion, lathe, setup, done, ruinCut, rubble, instanced, rotateTrack, scaleTrack, moveTrack, spinTrack, clip, pingPong, lampGroup, lampTracks, flameGeo, lightUp, flickerTracks, candle, solidBox, paintedPlane, vcMat, noise3, fbm } from './common.js';
import { vesselGeo } from './vessels.js';
import { shaftGeo } from './columns.js';

/* ---------------------------------- coins ---------------------------------- */

const COIN_METALS = {
  gold: ['#e0b445', 0.22], silver: ['#c9ccd2', 0.22], bronze: ['#a8703c', 0.35], patina: ['#5f9c84', 0.6, true],
  electrum: ['#d8c27a', 0.25], worn: ['#b8964e', 0.5], tarnished: ['#6f6a62', 0.45], iron: ['#4a4744', 0.7, true],
};
function coinMat(T) {
  const [c, r, matte] = COIN_METALS[T.coin ?? 'gold'] ?? COIN_METALS.gold;
  return matte ? M.matte(c, r) : M.metal(c, r);
}
/** One coin (diameter d, thickness h) lying flat, centred at origin, base at y=0. */
function coinGeo(d, h, holed = false, worn = false) {
  if (holed) {
    const s = new THREE.Shape();
    s.absarc(0, 0, d / 2, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    const q = d * 0.14;
    hole.moveTo(-q, -q); hole.lineTo(-q, q); hole.lineTo(q, q); hole.lineTo(q, -q); hole.lineTo(-q, -q);
    s.holes.push(hole);
    return extrudeOutline(s, h, { bevel: h * 0.2, segments: 1 }).rotateX(-Math.PI / 2).translate(0, h / 2, 0);
  }
  const r = d / 2, rim = worn ? h * 0.8 : h;
  return lathe([[0, 0], [r * 0.98, 0], [r, h * 0.2], [r, rim * 0.85], [r * 0.95, rim], [r * 0.88, rim * 0.93], [r * 0.85, h * 0.72], [r * 0.5, h * 0.75], [r * 0.3, h * (worn ? 0.8 : 1.05)], [0, h * (worn ? 0.82 : 1.1)]], 28);
}

const COIN_VARIANTS = { single: {}, stack: {}, scattered: {}, hoard: {}, purse: {}, tray: {} };

export function createCoin(options = {}) {
  const { variant, T, o } = setup(options, COIN_VARIANTS, 'ancient-coin');
  const root = group(`ancient-coin-${variant}`);
  const m = T.mats;
  const cm = coinMat(T);
  const d = 0.024, h = 0.0022;
  const g1 = coinGeo(d, h, !!T.holed, T.coin === 'worn');
  const r = T.r;
  const relief = (parent, x, y, z, s = 1, rot = [0, 0, 0]) => {
    // embossed rosette + beaded border on a coin face
    const gg = group('relief', { parent, at: [x, y, z], rot });
    if (!T.holed) mesh(extrudeOutline(starShape(d * 0.2 * s, 6), h * 0.35, { bevel: h * 0.1, segments: 1 }).rotateX(-Math.PI / 2), cm, { parent: gg, at: [0, h * 0.85 * s, 0], name: 'emblem' });
    return gg;
  };
  if (variant === 'single') {
    // a large display coin standing in a wooden block
    const k = 4;
    // (o.stand: standing in a wooden block; otherwise lying flat, obverse up)
    if (o?.stand) mesh(roundedBox(0.12, 0.03, 0.06, 0.006), m.wood, { parent: root, at: [0, 0.015, 0], name: 'stand' });
    const c = o?.stand ? group('coin', { parent: root, at: [0, 0.016 + (d * k) / 2, 0], rot: [Math.PI / 2, 0, 0] }) : group('coin', { parent: root, at: [0, h * k, 0] });
    mesh(coinGeo(d * k, h * k, !!T.holed, T.coin === 'worn').translate(0, -h * k / 2, 0), cm, { parent: c, name: 'coin-face' });
    relief(c, 0, -h * k / 2, 0, k);
    const beads = [];
    if (!T.holed) for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; beads.push({ p: [Math.cos(a) * d * k * 0.4, h * k * 0.32, Math.sin(a) * d * k * 0.4], s: d * k * 0.012 }); }
    instanced(new THREE.SphereGeometry(1, 6, 4), cm, beads, c, 'beads');
  } else if (variant === 'stack') {
    const items = [];
    [[-0.04, 0.0, 9], [0.0, 0.015, 14], [0.045, -0.01, 6]].forEach(([x, z, n]) => { for (let i = 0; i < n; i++) items.push({ p: [x + (r() - 0.5) * 0.002, i * h * 0.98, z + (r() - 0.5) * 0.002], r: [0, r() * 6, 0] }); });
    instanced(g1, cm, items, root, 'coins');
    for (let i = 0; i < 4; i++) items.push();
  } else if (variant === 'scattered') {
    const items = [];
    for (let i = 0; i < 26; i++) items.push({ p: [(r() - 0.5) * 0.24, 0, (r() - 0.5) * 0.17], r: [0, r() * 6, 0] });
    instanced(g1, cm, items, root, 'coins');
    for (let i = 0; i < 3; i++) relief(root, -0.06 + i * 0.06, 0.0115, 0.03);
  } else if (variant === 'hoard' || variant === 'purse') {
    if (variant === 'hoard') {
      const { geo } = vesselGeo([[0, 0], [0.04, 0], [0.07, 0.04], [0.075, 0.08], [0.05, 0.12], [0.045, 0.14]], 0.005, { n: 30, seg: 32 });
      const pot = mesh(geo, T.mats.clay, { parent: root, at: [0.02, 0.06, 0], rot: [0, 0, 1.25], name: 'pot' });
      pot.material.side = THREE.DoubleSide;
    } else {
      mesh(lathe([[0, 0], [0.05, 0.004], [0.065, 0.03], [0.055, 0.07], [0.03, 0.085], [0.035, 0.1], [0, 0.1]], 20), m.leather, { parent: root, at: [-0.03, 0, 0], scale: [1, 0.9, 1.1], name: 'purse' });
      curveTube([[-0.06, 0.085, 0], [-0.03, 0.08, 0.035], [0.0, 0.085, 0], [-0.03, 0.09, -0.035], [-0.06, 0.085, 0]], 0.0025, m.rope, { parent: root, segments: 24, radialSegments: 4, closed: true, name: 'drawstring' });
    }
    // heap of coins spilling out
    mesh(cushion(0.16, 0.03, 0.12, { bulge: 0.6 }), cm, { parent: root, at: [0.11, 0.0, 0.0], name: 'coin-heap' });
    const items = [];
    for (let i = 0; i < 60; i++) {
      const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 0.09;
      const x = 0.11 + Math.cos(a) * rr * 1.1, z = Math.sin(a) * rr * 0.9;
      const hh = Math.max(0, 0.03 * (1 - (rr / 0.09) ** 2)) * 0.95;
      items.push({ p: [x, hh + 0.0005, z], r: [(r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5] });
    }
    instanced(g1, cm, items, root, 'coins');
  } else if (variant === 'tray') {
    const W = 0.3, D = 0.2;
    mesh(roundedBox(W, 0.015, D, 0.004), m.wood, { parent: root, at: [0, 0.0075, 0], name: 'tray' });
    for (const s of [-1, 1]) {
      mesh(roundedBox(W, 0.03, 0.01, 0.003), m.wood, { parent: root, at: [0, 0.03, s * (D / 2 - 0.005)], name: 'rim' });
      mesh(roundedBox(0.01, 0.03, D, 0.003), m.wood, { parent: root, at: [s * (W / 2 - 0.005), 0.03, 0], name: 'rim' });
    }
    for (let i = 1; i < 5; i++) mesh(roundedBox(0.006, 0.02, D - 0.02, 0.002), m.wood2, { parent: root, at: [-W / 2 + (i * W) / 5, 0.025, 0], name: 'divider' });
    mesh(roundedBox(W - 0.02, 0.003, D - 0.02, 0.001), m.cloth, { parent: root, at: [0, 0.0165, 0], name: 'velvet' });
    const items = [];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) items.push({ p: [-W / 2 + (i + 0.5) * (W / 5), 0.018, (j - 1) * 0.055], r: [0, r() * 6, 0] });
    instanced(g1, cm, items, root, 'coins');
  }
  if (T.night) {
    // handled by done(): candle beside
  }
  return done(root, T);
}
function starShape(R, n) {
  const s = new THREE.Shape();
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? R * 0.45 : R;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
}

/* --------------------------------- scrolls --------------------------------- */

/** Rolled scroll along x: length L, radius r, with rod knobs. */
function rolledScroll(parent, T, L, r, at, rotY = 0, name = 'scroll') {
  const g = group(name, { parent, at, rot: [0, rotY, 0] });
  const m = T.mats;
  const paper = m.paper;
  mesh(new THREE.CylinderGeometry(r, r, L, 20).rotateZ(Math.PI / 2), paper, { parent: g, name: 'roll' });
  // spiral edge lines on the ends
  for (const s of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(r * 0.25, r * 0.25, 0.03, 10).rotateZ(Math.PI / 2), T.gild ? m.gold : m.wood2, { parent: g, at: [s * (L / 2 + 0.015), 0, 0], name: 'rod' });
    mesh(new THREE.SphereGeometry(r * 0.38, 12, 8), T.gild ? m.gold : m.wood2, { parent: g, at: [s * (L / 2 + 0.035), 0, 0], name: 'knob' });
    if (T.burnt) mesh(new THREE.TorusGeometry(r * 0.9, r * 0.15, 6, 16).rotateY(Math.PI / 2), (m.char ??= M.matte('#2a1d14', 0.9)), { parent: g, at: [s * L / 2, 0, 0], name: 'char' });
  }
  if (T.seals || T.cloth) {
    mesh(new THREE.TorusGeometry(r * 1.02, r * 0.12, 6, 20).rotateY(Math.PI / 2), T.cloth ? m.cloth : m.wax, { parent: g, name: 'ribbon' });
    mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.5, r * 0.2, 14).rotateX(Math.PI / 2), m.wax, { parent: g, at: [0, 0, r * 1.1], name: 'seal' });
  }
  return g;
}

/** Flat parchment sheet with text lines (instanced) on XZ, top surface at y. */
function textSheet(parent, T, w, d, y, at = [0, 0, 0], { cols = 1 } = {}) {
  const m = T.mats;
  const g = group('sheet', { parent, at });
  mesh(roundedBox(w, 0.002, d, 0.0008), m.paper, { parent: g, at: [0, y - 0.001, 0], name: 'parchment' });
  const lines = [];
  const r = T.r;
  for (let c = 0; c < cols; c++) {
    const cw = (w * 0.8) / cols;
    const x0 = -w * 0.4 + c * cw + cw * 0.05;
    for (let i = 0; i < 18; i++) {
      const len = cw * (0.6 + r() * 0.3);
      lines.push({ p: [x0 + len / 2, y + 0.0002, -d * 0.4 + (i * d * 0.8) / 17], s: [len, 0.0006, d * 0.012] });
    }
  }
  instanced(new THREE.BoxGeometry(1, 1, 1), T.burnt ? (m.ink ??= M.matte('#3a2a1c')) : (m.ink ??= M.matte('#2a221c')), lines, g, 'text');
  if (T.gild) mesh(roundedBox(w * 0.12, 0.0008, w * 0.12, 0.0003), m.gold, { parent: g, at: [-w * 0.38, y + 0.0004, -d * 0.38], name: 'illumination' });
  return g;
}

const SCROLL_VARIANTS = { rolled: {}, open: {}, capsa: {}, rack: {}, 'wax-tablet': {} };

export function createScroll(options = {}) {
  const { variant, T } = setup(options, SCROLL_VARIANTS, 'scroll');
  const root = group(`scroll-${variant}`);
  const m = T.mats;
  const r = T.r;
  if (variant === 'rolled') {
    rolledScroll(root, T, 0.3, 0.028, [0, 0.028, 0], 0.2);
    rolledScroll(root, T, 0.24, 0.022, [0.04, 0.022, 0.09], -0.5, 'scroll-2');
  } else if (variant === 'open') {
    const W = 0.42, D = 0.28;
    // lies straight on the ground (no display board under it)
    textSheet(root, T, W, D, 0.002, [0, 0, 0], { cols: 2 });
    for (const s of [-1, 1]) rolledScroll(root, T, D + 0.02, 0.022, [s * (W / 2 + 0.018), 0.022, 0], Math.PI / 2, s < 0 ? 'roll-L' : 'roll-R');
    // weights holding it flat
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.018, 12, 10), T.gild ? m.gold : m.stone, { parent: root, at: [s * 0.1, 0.019, D / 2 - 0.02], name: 'weight' });
  } else if (variant === 'capsa') {
    // cylindrical leather scroll case holding several scrolls
    const { geo } = vesselGeo([[0, 0], [0.12, 0], [0.125, 0.02], [0.125, 0.3]], 0.006, { n: 12, seg: 32 });
    mesh(geo, m.leather, { parent: root, name: 'case' }).material.side = THREE.DoubleSide;
    for (const y of [0.04, 0.27]) mesh(new THREE.TorusGeometry(0.127, 0.006, 6, 32).rotateX(Math.PI / 2), T.gild ? m.gold : m.bronze, { parent: root, at: [0, y, 0], name: 'band' });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2, rr = i ? 0.07 : 0;
      const sg = group('upright', { parent: root, at: [Math.cos(a) * rr, 0.006, Math.sin(a) * rr], rot: [0, 0, Math.PI / 2 + (r() - 0.5) * 0.15] });
      rolledScroll(sg, T, 0.33 + r() * 0.06, 0.024, [0.18, 0, 0], 0, 'scroll');
    }
    const lid = mesh(lathe([[0, 0], [0.135, 0], [0.135, 0.05], [0, 0.05]], 32), m.leather, { parent: root, at: [0.25, 0, 0.1], rot: [0, 0, 0], name: 'lid' });
    void lid;
    mesh(curveTubeStrap(), m.leather, { parent: root, name: 'strap' });
  } else if (variant === 'rack') {
    const W = 0.9, H = 0.9, D = 0.32, cols = 4, rows = 4;
    for (const s of [-1, 1]) mesh(roundedBox(0.03, H, D, 0.006), m.wood, { parent: root, at: [s * (W / 2 - 0.015), H / 2, 0], name: 'side' });
    for (let j = 0; j <= rows; j++) mesh(roundedBox(W, 0.02, D, 0.005), m.wood, { parent: root, at: [0, 0.01 + (j * (H - 0.02)) / rows, 0], name: 'shelf' });
    for (let i = 1; i < cols; i++) mesh(roundedBox(0.015, H - 0.02, D, 0.004), m.wood2, { parent: root, at: [-W / 2 + (i * W) / cols, H / 2, 0], name: 'divider' });
    mesh(roundedBox(W, H, 0.015, 0.004), m.wood2, { parent: root, at: [0, H / 2, -D / 2 + 0.0075], name: 'back' });
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const n = 2 + Math.floor(r() * 3);
      const cw = W / cols, x0 = -W / 2 + i * cw;
      const y0 = 0.02 + (j * (H - 0.02)) / rows;
      for (let k = 0; k < n; k++) {
        const rr = 0.022 + r() * 0.008;
        const x = x0 + 0.03 + rr + k * (rr * 2.05);
        if (x + rr > x0 + cw - 0.015) break;
        rolledScroll(root, T, D - 0.06, rr, [x, y0 + rr, 0.01], Math.PI / 2, 'scroll');
      }
    }
  } else if (variant === 'wax-tablet') {
    // hinged diptych: two wooden frames with dark wax, a stylus
    for (const s of [-1, 1]) {
      const g = group(s < 0 ? 'leaf-L' : 'leaf-R', { parent: root, at: [s * 0.08, 0, 0], rot: [0, 0, 0] });
      mesh(roundedBox(0.15, 0.012, 0.2, 0.003), m.wood, { parent: g, at: [0, 0.006, 0], name: 'frame' });
      mesh(roundedBox(0.125, 0.002, 0.175, 0.0006), (m.waxDark ??= M.matte(T.night ? '#2b2018' : '#3b2b1c', 0.5)), { parent: g, at: [0, 0.0125, 0], name: 'wax' });
      const lines = [];
      for (let i = 0; i < 9; i++) lines.push({ p: [0, 0.0136, -0.07 + i * 0.017], s: [0.09 * (0.7 + r() * 0.3), 0.0005, 0.002] });
      instanced(new THREE.BoxGeometry(1, 1, 1), (m.scratch ??= M.matte('#c9b38a', 0.6)), lines, g, 'writing');
    }
    for (const z of [-0.06, 0.06]) mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.02, 6).rotateZ(Math.PI / 2), m.leather, { parent: root, at: [0, 0.008, z], name: 'tie' });
    curveTube([[0.05, 0.016, 0.12], [0.2, 0.016, 0.05]], 0.003, T.gild ? m.gold : m.bronze, { parent: root, name: 'stylus' });
    mesh(new THREE.ConeGeometry(0.003, 0.012, 6).rotateZ(-Math.PI / 2 + 0.43), T.gild ? m.gold : m.bronze, { parent: root, at: [0.205, 0.016, 0.0478], name: 'stylus-tip' });
  }
  return done(root, T);
}
function curveTubeStrap() {
  const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.126, 0.05, 0), new THREE.Vector3(-0.15, 0.2, 0), new THREE.Vector3(-0.126, 0.26, 0)]);
  return new THREE.TubeGeometry(c, 12, 0.008, 5, false);
}

/* -------------------------------- oil lamps -------------------------------- */

const LAMP_VARIANTS = { clay: {}, bronze: { lampMetal: true }, 'multi-nozzle': {}, hanging: { lampMetal: true }, lampstand: { lampMetal: true } };

/** Roman oil lamp body; nozzles: count; returns nozzle tip positions (local). */
function lampBody(parent, T, mat, k, nozzles = 1, at = [0, 0, 0]) {
  const g = group('lamp', { parent, at });
  const R = 0.04 * k, h = 0.03 * k;
  mesh(lathe([[0, 0], [R * 0.55, 0], [R * 0.6, h * 0.12], [R * 0.95, h * 0.35], [R, h * 0.6], [R * 0.9, h * 0.9], [R * 0.7, h], [R * 0.6, h * 0.9], [R * 0.2, h * 0.82], [R * 0.12, h * 0.95], [0, h * 0.95]], 32), mat, { parent: g, name: 'lamp-body' });
  mesh(new THREE.TorusGeometry(R * 0.62, R * 0.04, 4, 32).rotateX(Math.PI / 2), mat, { parent: g, at: [0, h * 0.93, 0], name: 'discus-ring' });
  const tips = [];
  for (let i = 0; i < nozzles; i++) {
    const a = nozzles === 1 ? 0 : (i / nozzles) * Math.PI * 2;
    const L = R * 1.0;
    const noz = lathe([[0, 0], [R * 0.32, 0], [R * 0.3, L * 0.5], [R * 0.24, L], [R * 0.16, L], [0, L * 0.98]], 16).rotateZ(-Math.PI / 2);
    noz.scale(1, 0.62, 1);
    mesh(noz, mat, { parent: g, at: [Math.cos(a) * R * 0.75, h * 0.42, -Math.sin(a) * R * 0.75], rot: [0, a, 0], name: 'nozzle' });
    tips.push([Math.cos(a) * (R * 0.75 + L * 0.92), h * 0.62, -Math.sin(a) * (R * 0.75 + L * 0.92)]);
  }
  if (nozzles === 1) {
    mesh(new THREE.TorusGeometry(R * 0.32, R * 0.09, 8, 20, Math.PI * 1.4).rotateY(Math.PI / 2).rotateX(-0.6), mat, { parent: g, at: [-R * 1.05, h * 0.75, 0], name: 'handle' });
  }
  return { g, tips, h, R };
}

export function createOilLamp(options = {}) {
  const { variant, T, V } = setup(options, LAMP_VARIANTS, 'oil-lamp');
  const root = group(`oil-lamp-${variant}`);
  const m = T.mats;
  const metalK = T.gild ? 'gold' : T.coin === 'silver' || T.metalVase === 'silver' ? 'silver' : null;
  const mat = metalK === 'gold' ? M.metal('#d6a93c', 0.22) : metalK === 'silver' ? M.metal('#c9ccd2', 0.2)
    : T.vase === 'glazed' ? new THREE.MeshPhysicalMaterial({ name: 'glaze', color: T.glaze ?? '#2f9aa0', roughness: 0.25, clearcoat: 0.7 })
      : V.lampMetal || T.metalVase === 'bronze' ? (T.wear ? M.matte('#5f8f78', 0.7) : M.metal('#a8703c', 0.32))
        : T.paint ? M.matte('#b04a2a', 0.6) : T.wear ? M.matte('#9c7a5a', 0.9) : M.matte('#b8643a', 0.7);
  const fire = lampGroup('flame', 'amber');
  const k = variant === 'multi-nozzle' ? 1.6 : 1.2;
  let lamp;
  if (variant === 'hanging') {
    // tripod stand with an arm, lamp on chains
    const iron = m.bronze;
    mesh(lathe([[0, 0], [0.12, 0], [0.11, 0.02], [0.03, 0.04], [0, 0.04]], 24), iron, { parent: root, name: 'stand-base' });
    mesh(new THREE.CylinderGeometry(0.012, 0.015, 1.1, 10), iron, { parent: root, at: [0, 0.59, 0], name: 'stand-pole' });
    curveTube([[0, 1.1, 0], [0.12, 1.16, 0], [0.24, 1.12, 0], [0.26, 1.06, 0]], 0.008, iron, { parent: root, segments: 16, radialSegments: 6, name: 'arm' });
    lamp = lampBody(root, T, mat, k, 1, [0.26, 0.82, 0]);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      curveTube([[0.26, 1.06, 0], [0.26 + Math.cos(a) * lamp.R * 0.7, 0.82 + lamp.h * 0.9, Math.sin(a) * lamp.R * 0.7]], 0.0025, iron, { parent: root, segments: 2, radialSegments: 4, name: 'chain' });
    }
  } else if (variant === 'lampstand') {
    const b = m.bronze;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      curveTube([[Math.cos(a) * 0.16, 0.008, Math.sin(a) * 0.16], [Math.cos(a) * 0.1, 0.08, Math.sin(a) * 0.1], [0, 0.12, 0]], 0.012, b, { parent: root, segments: 12, radialSegments: 6, name: 'claw-leg' });
      mesh(new THREE.SphereGeometry(0.018, 10, 8), b, { parent: root, at: [Math.cos(a) * 0.16, 0.015, Math.sin(a) * 0.16], name: 'foot' });
    }
    mesh(shaftGeo(0.014, 1.0, { kind: 'doric', flutes: 12, depth: 0.1, taper: 0.8 }), b, { parent: root, at: [0, 0.11, 0], name: 'stem' });
    mesh(lathe([[0, 0], [0.02, 0], [0.09, 0.02], [0.1, 0.03], [0.02, 0.035], [0, 0.035]], 24), b, { parent: root, at: [0, 1.1, 0], name: 'platter' });
    lamp = lampBody(root, T, mat, k, 1, [0, 1.13, 0]);
  } else {
    lamp = lampBody(root, T, mat, k, variant === 'multi-nozzle' ? 5 : 1);
    if (variant === 'bronze') {
      mesh(lathe([[0, 0], [0.03, 0], [0.025, 0.008], [0.015, 0.012], [0, 0.012]], 20), mat, { parent: root, name: 'foot' });
      lamp.g.position.y = 0.011;
      curveTube([[-lamp.R * 0.9, lamp.h * 0.8 + 0.011, 0], [-lamp.R * 1.6, lamp.h * 1.8 + 0.011, 0], [-lamp.R * 1.1, lamp.h * 2.4 + 0.011, 0], [-lamp.R * 0.8, lamp.h * 2.0 + 0.011, 0]], 0.004, mat, { parent: root, segments: 16, radialSegments: 6, name: 'scroll-handle' });
      mesh(new THREE.SphereGeometry(0.006, 8, 6), mat, { parent: root, at: [-lamp.R * 0.8, lamp.h * 2.0 + 0.011, 0], name: 'handle-knob' });
    }
    if (variant === 'multi-nozzle') {
      mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 16), mat, { parent: lamp.g, at: [0, lamp.h + 0.016, 0], name: 'suspension-ring' });
    }
  }
  // wicks and flames
  const lit = !T.unlit && !T.broken;
  for (const tp of lamp.tips) {
    mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.01, 6), m.dark, { parent: lamp.g, at: [tp[0], tp[1] + 0.003, tp[2]], name: 'wick' });
    if (lit) fire.add(lamp.g, { geometry: flameGeo(0.03 * k, tp[0], tp[1] + 0.006, tp[2]), normal: [0, 0.2, 1], depth: 0.006, glowSize: 0.14 * k });
  }
  if (lit) lightUp(fire, 2.4, 0.8);
  if (T.broken) {
    // cracked lamp: nozzle snapped off, lying beside
    const noz = lamp.g.getObjectByName('nozzle');
    // the wick sat in the nozzle; with the nozzle snapped off it would hang in the air
    for (const w of [...lamp.g.children].filter((c) => c.name === 'wick')) w.removeFromParent();
    if (noz) {
      noz.removeFromParent();
      root.add(noz);
      noz.position.set(lamp.R * 2.6, 0.012 * k, lamp.R * 1.2);
      noz.rotation.set(0, 0.8, 0);
      root.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(noz);
      noz.position.y -= b.min.y;
    }
  }
  T.noNightFire = true;
  return done(root, T, () => (lit ? [clip('on', 1, lampTracks('flame', 2.4, { glow: 0.8 })), clip('flicker', 1.2, flickerTracks('flame', 2.4, 0.8))] : []));
}

/* -------------------------------- hourglass -------------------------------- */

const HOURGLASS_VARIANTS = { tabletop: { H: 0.22, R: 0.05, posts: 3 }, tall: { H: 0.4, R: 0.085, posts: 4 }, triple: { H: 0.2, R: 0.04, posts: 2 }, ornate: { H: 0.3, R: 0.065, posts: 3, ornate: true } };

/** Glass bulbs + sand between two plates (height h, bulb radius r) at (x, y0). */
function glassBulb(parent, T, r, h, x, y0, name) {
  const m = T.mats;
  const g = group(name, { parent, at: [x, y0, 0] });
  const prof = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const y = t * h;
    const s = Math.abs(t - 0.5) * 2;
    const rr = Math.max(r * 0.07, r * Math.sin(Math.PI * Math.min(1, 0.25 + 0.75 * s)) * (s > 0.05 ? 1 : 0.3));
    prof.push([t === 0 || t === 1 ? r * 0.55 : rr, y]);
  }
  mesh(lathe(prof, 28), m.glass, { parent: g, name: 'glass' });
  const sandM = (m.hgSand ??= M.matte(T.night ? '#a08a60' : '#e2c48a', 0.9));
  // sand: bottom heap and top remaining cone
  const bottom = group('sand-bottom', { parent: g, at: [0, h * 0.04, 0] });
  mesh(lathe([[0, 0], [r * 0.8, 0], [r * 0.6, h * 0.12], [0, h * 0.2]], 20), sandM, { parent: bottom, name: 'sand-heap' });
  const top = group('sand-top', { parent: g, at: [0, h * 0.53, 0] });
  mesh(lathe([[0, 0], [r * 0.12, 0.002], [r * 0.7, h * 0.16], [r * 0.82, h * 0.2], [0, h * 0.2]], 20), sandM, { parent: top, name: 'sand-cone' });
  mesh(new THREE.CylinderGeometry(0.0008, 0.0008, h * 0.42, 4), sandM, { parent: g, at: [0, h * 0.28, 0], name: 'sand-stream' });
  return g;
}

export function createHourglass(options = {}) {
  const { variant, T, V } = setup(options, HOURGLASS_VARIANTS, 'hourglass');
  const root = group(`hourglass-${variant}`);
  const m = T.mats;
  const frameMat = T.brassFrame ? M.metal('#b8913f', 0.3) : T.gild ? m.gold : T.coin === 'silver' ? M.metal('#c9ccd2', 0.2) : m.wood;
  const { H, R, posts } = V;
  const n = variant === 'triple' ? 3 : 1;
  const W = variant === 'triple' ? R * 2.4 * 3 + 0.04 : R * 2.6;
  const pt = 0.016;
  const frame = group('frame', { parent: root, at: [0, 0, 0] });
  const plate = (y) => (variant === 'triple' ? mesh(roundedBox(W, pt, R * 2.6, 0.004), frameMat, { parent: frame, at: [0, y, 0], name: 'plate' }) : mesh(lathe([[0, 0], [W / 2, 0], [W / 2 * 1.02, pt * 0.5], [W / 2, pt], [0, pt]], 32), frameMat, { parent: frame, at: [0, y - pt / 2, 0], name: 'plate' }));
  plate(pt / 2);
  plate(H + pt * 1.5);
  const pr = R * 0.12;
  const postPos = [];
  if (variant === 'triple') for (const sx of [-1, 1]) for (const sz of [-1, 1]) postPos.push([sx * (W / 2 - 0.012), sz * (R * 1.3 - 0.012)]);
  else for (let i = 0; i < posts; i++) { const a = (i / posts) * Math.PI * 2 + Math.PI / 2; postPos.push([Math.cos(a) * (W / 2 - pr * 1.5), Math.sin(a) * (W / 2 - pr * 1.5)]); }
  for (const [x, z] of postPos) {
    const prof = V.ornate
      ? [[0, 0], [pr * 1.4, 0], [pr * 1.2, H * 0.08], [pr * 0.7, H * 0.15], [pr * 1.3, H * 0.3], [pr * 0.6, H * 0.5], [pr * 1.3, H * 0.7], [pr * 0.7, H * 0.85], [pr * 1.2, H * 0.92], [pr * 1.4, H], [0, H]]
      : [[0, 0], [pr * 1.2, 0], [pr, H * 0.1], [pr * 0.9, H * 0.5], [pr, H * 0.9], [pr * 1.2, H], [0, H]];
    mesh(lathe(prof, 12), frameMat, { parent: frame, at: [x, pt, z], name: 'post' });
  }
  if (V.ornate) for (const y of [0, H + pt * 2]) for (const [x, z] of postPos) mesh(new THREE.SphereGeometry(pr * 1.6, 10, 8), frameMat, { parent: frame, at: [x, y === 0 ? -0.0 + pr * 1.6 - 0.002 : y + pr * 1.4, z], name: 'finial' });
  if (V.ornate) frame.position.y = pr * 3.2 - 0.004;
  const bulbs = [];
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : (i - 1) * R * 2.4;
    bulbs.push(glassBulb(frame, T, R, H, x, pt - 0.001, `bulb_${i}`));
  }
  if (T.broken) {
    // shattered: top plate and posts knocked over, glass cracked (darker) and sand spilled
    const top = frame.children.filter((c) => c.name === 'plate')[1];
    top.removeFromParent(); root.add(top); top.position.set(W * 1.4, pt / 2, 0.02); top.rotation.set(0, 0.4, 0);
    // finials stood on that top plate: remove them (they'd float where the plate was)
    for (const f of [...frame.children].filter((c) => c.name === 'finial')) f.removeFromParent();
    mesh(cushion(W * 1.2, 0.012, W * 0.9, { bulge: 0.5 }), (m.hgSand ??= M.matte('#e2c48a', 0.9)), { parent: root, at: [W * 0.4, 0.0, W * 0.7], name: 'spilled-sand' });
  }
  return done(root, T, () => {
    const out = [];
    const tops = [], bots = [];
    root.traverse((o) => { if (o.name === 'sand-top') tops.push(o); if (o.name === 'sand-bottom') bots.push(o); });
    if (tops.length) out.push(clip('run', 8, [...tops.map((o) => scaleTrack(o, 8, (t) => [1, 1 - t * 0.9, 1])), ...bots.map((o) => scaleTrack(o, 8, (t) => [1, 0.2 + t * 0.8, 1]))]));
    const f = root.getObjectByName('frame');
    if (f && !T.broken) out.push(clip('flip', 3, [rotateTrack(f, 'z', 3, (t) => Math.min(1, t * 1.5) * Math.PI)]));
    return out;
  });
}

/* --------------------------------- sundial --------------------------------- */

const SUNDIAL_VARIANTS = { pedestal: {}, hemispherical: {}, armillary: {}, wall: {}, garden: {} };

function hourLines(parent, T, r0, r1, y, n, a0, a1, mat) {
  const items = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const rm = (r0 + r1) / 2;
    items.push({ p: [Math.cos(a) * rm, y, -Math.sin(a) * rm], r: [0, a, 0], s: [r1 - r0, 0.003, i % 3 === 0 ? 0.006 : 0.003] });
  }
  return instanced(new THREE.BoxGeometry(1, 1, 1), mat, items, parent, 'hour-lines');
}

export function createSundial(options = {}) {
  const { variant, T } = setup(options, SUNDIAL_VARIANTS, 'ancient-sundial');
  const root = group(`ancient-sundial-${variant}`);
  const m = T.mats;
  const plateMat = T.gild ? m.gold : T.trim === 'weathered' || T.trim === 'ruined' || T.ivy ? m.bronze : (m.dialBronze ??= M.metal('#a8703c', 0.35));
  const lineMat = T.gild ? (m.ink ??= M.matte('#3a2a18')) : (m.ink ??= M.matte('#2b241c'));
  if (variant === 'pedestal' || variant === 'garden' || variant === 'armillary') {
    const tall = variant !== 'garden';
    let y = 0;
    mesh(roundedBox(0.6, 0.1, 0.6, 0.02), m.stone2, { parent: root, at: [0, 0.05, 0], name: 'plinth' });
    y = 0.1;
    if (tall) {
      mesh(lathe([[0, 0], [0.2, 0], [0.2, 0.05], [0.14, 0.1], [0.1, 0.25], [0.13, 0.45], [0.08, 0.7], [0.12, 0.8], [0.18, 0.86], [0.18, 0.9], [0, 0.9]], 32), m.stone, { parent: root, at: [0, y - 0.004, 0], name: 'baluster' });
      y += 0.9 - 0.004;
    } else {
      mesh(lathe([[0, 0], [0.28, 0], [0.26, 0.2], [0.3, 0.26], [0, 0.26]], 40), m.stone, { parent: root, at: [0, y - 0.004, 0], name: 'drum' });
      y += 0.26 - 0.004;
    }
    if (variant === 'armillary') {
      const g = group('armillary', { parent: root, at: [0, y + 0.25, 0] });
      mesh(lathe([[0, 0], [0.04, 0], [0.02, 0.1], [0, 0.12]], 16), plateMat, { parent: root, at: [0, y - 0.004, 0], name: 'mount' });
      const rr = 0.22;
      mesh(new THREE.TorusGeometry(rr, 0.008, 6, 48), plateMat, { parent: g, name: 'meridian' });
      mesh(new THREE.TorusGeometry(rr, 0.008, 6, 48).rotateX(Math.PI / 2), plateMat, { parent: g, name: 'equator' });
      mesh(new THREE.TorusGeometry(rr * 0.98, 0.006, 6, 48).rotateY(Math.PI / 2), plateMat, { parent: g, name: 'colure' });
      mesh(new THREE.TorusGeometry(rr * 0.97, 0.012, 6, 48).rotateX(Math.PI / 2 - 0.41), plateMat, { parent: g, name: 'ecliptic' });
      mesh(new THREE.CylinderGeometry(0.005, 0.005, rr * 2.3, 8).rotateZ(0.7), plateMat, { parent: g, name: 'axis' });
      mesh(new THREE.ConeGeometry(0.014, 0.04, 8).rotateZ(0.7 + Math.PI), plateMat, { parent: g, at: [Math.sin(0.7) * rr * 1.15, -Math.cos(0.7) * rr * 1.15 + 0.0, 0], name: 'arrow-tail' });
      g.position.y = y + 0.12 + rr - 0.01;
    } else {
      const R = tall ? 0.2 : 0.27;
      mesh(new THREE.CylinderGeometry(R, R, 0.012, 48), plateMat, { parent: root, at: [0, y + 0.006 - 0.002, 0], name: 'dial' });
      hourLines(root, T, R * 0.55, R * 0.9, y + 0.0115, 12, 0, Math.PI, lineMat);
      mesh(new THREE.TorusGeometry(R * 0.95, 0.004, 4, 48).rotateX(Math.PI / 2), plateMat, { parent: root, at: [0, y + 0.012, 0], name: 'dial-rim' });
      const gh = R * 0.7;
      mesh(extrudeOutline([[0, 0], [R * 0.8, 0], [0, gh]], 0.008, { bevel: 0.0015, segments: 1 }).rotateY(-Math.PI / 2), plateMat, { parent: root, at: [0, y + 0.009, -R * 0.4], name: 'gnomon' });
    }
  } else if (variant === 'hemispherical') {
    // stone block carved with a concave bowl, lion-paw-free plain feet
    mesh(roundedBox(0.7, 0.12, 0.5, 0.02), m.stone2, { parent: root, at: [0, 0.06, 0], name: 'plinth' });
    mesh(roundedBox(0.55, 0.65, 0.4, 0.02), m.stone, { parent: root, at: [0, 0.12 + 0.325 - 0.004, 0], name: 'pillar' });
    const by = 0.765;
    // block with a quarter-sphere cut-out facing south (+z)
    const blk = new THREE.Group();
    blk.name = 'hemicycle';
    root.add(blk);
    blk.position.set(0, by, 0);
    mesh(roundedBox(0.6, 0.06, 0.5, 0.015), m.stone, { parent: blk, at: [0, 0.03, 0], name: 'base-slab' });
    const bowl = new THREE.SphereGeometry(0.22, 32, 16, 0, Math.PI, 0, Math.PI / 2);
    bowl.rotateX(-Math.PI / 2).rotateY(0);
    mesh(new THREE.SphereGeometry(0.22, 32, 12, Math.PI, Math.PI, 0, Math.PI / 2).rotateX(Math.PI), (m.bowlStone ??= Object.assign(m.stone.clone(), { side: THREE.DoubleSide })), { parent: blk, at: [0, 0.3, 0], name: 'bowl' });
    for (const s of [-1, 1]) mesh(roundedBox(0.08, 0.26, 0.5, 0.012), m.stone, { parent: blk, at: [s * 0.26, 0.19, 0], name: 'cheek' });
    mesh(roundedBox(0.6, 0.26, 0.08, 0.012), m.stone, { parent: blk, at: [0, 0.19, -0.21], name: 'back' });
    mesh(roundedBox(0.6, 0.04, 0.3, 0.01), m.stone, { parent: blk, at: [0, 0.3, -0.12], name: 'top' });
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * Math.PI;
      curveTube(Array.from({ length: 6 }, (_, k) => { const p = (k / 5) * Math.PI / 2 * 0.9; return [Math.cos(a) * 0.218 * Math.sin(p), 0.3 - 0.218 * Math.cos(p) + 0.002, Math.sin(a) * 0.218 * Math.sin(p)]; }), 0.0025, lineMat, { parent: blk, segments: 10, radialSegments: 3, name: 'hour-line' });
    }
    mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 6).rotateX(Math.PI / 2), plateMat, { parent: blk, at: [0, 0.3, -0.09], name: 'gnomon' });
  } else if (variant === 'wall') {
    mesh(roundedBox(0.7, 0.12, 0.4, 0.02), m.stone2, { parent: root, at: [0, 0.06, 0], name: 'plinth' });
    mesh(roundedBox(0.6, 1.9, 0.28, 0.03), m.stone, { parent: root, at: [0, 0.12 + 0.95 - 0.004, 0], name: 'pillar' });
    mesh(extrudeOutline([[-0.34, 0], [0.34, 0], [0, 0.22]], 0.34, { bevel: 0.01 }), m.stone2, { parent: root, at: [0, 2.02, 0], name: 'cap' });
    const fz = 0.14;
    mesh(new THREE.CircleGeometry(0.26, 40, Math.PI, Math.PI), T.paint ? (m.dialPaint ??= M.matte('#efe4c8')) : plateMat, { parent: root, at: [0, 1.75, fz + 0.002], name: 'dial-face' });
    const items = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; items.push({ p: [Math.cos(a) * 0.17, 1.75 + Math.sin(a) * 0.17, fz + 0.004], r: [0, 0, a], s: [0.16, i % 3 ? 0.003 : 0.006, 0.003] }); }
    instanced(new THREE.BoxGeometry(1, 1, 1), lineMat, items, root, 'hour-lines');
    mesh(extrudeOutline([[0, 0], [0, -0.0], [0.18, 0], [0, 0.14]], 0.008, { bevel: 0.002, segments: 1 }).rotateY(-Math.PI / 2).rotateX(Math.PI), plateMat, { parent: root, at: [0, 1.75, fz], name: 'gnomon' });
  }
  if (T.ruin) {
    const b = new THREE.Box3().setFromObject(root);
    ruinCut(root, T, b.max.y * 0.55, { jag: 0.08, slope: 0.1 });
    rubble(root, T, b, 5, 0.1);
  }
  return done(root, T);
}

/* -------------------------------- map table -------------------------------- */

const MAP_VARIANTS = { 'war-table': { W: 1.8, D: 1.1 }, 'chart-table': { W: 1.4, D: 0.9 }, 'scholar-desk': { W: 1.2, D: 0.7 }, 'round-table': { W: 1.4, D: 1.4, round: true } };

function mapColors(T, u, v) {
  const n = fbm(u * 3.2 + 7, v * 3.2, 1.3) + (fbm(u * 9, v * 9, 4) - 0.5) * 0.2;
  const grid = Math.abs(((u * 8) % 1) - 0.5) > 0.485 || Math.abs(((v * 6) % 1) - 0.5) > 0.485;
  const parch = T.trim === 'weathered' ? '#c8b48a' : '#e6d4a6';
  if (n > 0.58) return grid ? '#6b5236' : n > 0.66 ? '#9b8a5c' : '#b9a46c';
  if (n > 0.55) return '#5a4128';
  return grid ? '#8a7a5c' : parch;
}

export function createMapTable(options = {}) {
  const { variant, T, V } = setup(options, MAP_VARIANTS, 'map-table');
  const root = group(`map-table-${variant}`);
  const m = T.mats;
  const { W, D } = V;
  const H = 0.78, tt = 0.05;
  const wood = m.wood;
  if (V.round) {
    mesh(lathe([[0, 0], [W / 2, 0], [W / 2, tt], [0, tt]], 48), wood, { parent: root, at: [0, H - tt, 0], name: 'top' });
    mesh(lathe([[0, 0], [0.32, 0], [0.3, 0.06], [0.1, 0.12], [0.08, 0.3], [0.12, 0.45], [0.07, 0.62], [0.14, 0.73], [0, 0.73]], 32), m.wood2, { parent: root, name: 'pedestal' });
  } else {
    mesh(roundedBox(W, tt, D, 0.012), wood, { parent: root, at: [0, H - tt / 2, 0], name: 'top' });
    mesh(roundedBox(W - 0.12, 0.1, D - 0.12, 0.01), m.wood2, { parent: root, at: [0, H - tt - 0.05 + 0.004, 0], name: 'apron' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const lx = sx * (W / 2 - 0.09), lz = sz * (D / 2 - 0.09);
      mesh(lathe([[0, 0], [0.045, 0], [0.04, 0.05], [0.05, 0.2], [0.035, 0.32], [0.05, 0.45], [0.035, 0.6], [0.045, H - tt], [0, H - tt]], 14), m.wood2, { parent: root, at: [lx, 0, lz], name: 'leg' });
    }
    mesh(roundedBox(W - 0.18, 0.05, 0.05, 0.01), m.wood2, { parent: root, at: [0, 0.14, 0], name: 'stretcher' });
    for (const sx of [-1, 1]) mesh(roundedBox(0.05, 0.05, D - 0.18, 0.01), m.wood2, { parent: root, at: [sx * (W / 2 - 0.09), 0.14, 0], name: 'stretcher' });
  }
  const ty = H;
  // the map: vertex-coloured parchment slightly curled
  const mw = V.round ? W * 0.68 : W * 0.78, md = V.round ? W * 0.68 : D * 0.78;
  const mapGeo = paintedPlane(mw, md, 48, 32, (u, v) => mapColors(T, u, v));
  const mp = mapGeo.attributes.position;
  for (let i = 0; i < mp.count; i++) { const x = mp.getX(i) / (mw / 2); mp.setY(i, Math.max(0, Math.abs(x) - 0.92) * 0.12); }
  mapGeo.computeVertexNormals();
  mesh(mapGeo, vcMat(0.85), { parent: root, at: [0, ty + 0.0015, 0], name: 'map' });
  if (!V.round) for (const s of [-1, 1]) {
    const rg = group(s < 0 ? 'map-roll-L' : 'map-roll-R', { parent: root, at: [s * (mw / 2 + 0.006), ty + 0.016, 0] });
    mesh(new THREE.CylinderGeometry(0.016, 0.016, md, 14).rotateX(Math.PI / 2), m.paper, { parent: rg, name: 'curl' });
  }
  const r = T.r;
  if (variant === 'war-table' || variant === 'round-table') {
    // army markers: pawns and little flags
    const pawn = lathe([[0, 0], [0.018, 0], [0.016, 0.006], [0.008, 0.012], [0.006, 0.03], [0.012, 0.038], [0, 0.046]], 12);
    const items = [], items2 = [];
    for (let i = 0; i < 14; i++) (i % 2 ? items : items2).push({ p: [(r() - 0.5) * mw * 0.8, ty + 0.0015, (r() - 0.5) * md * 0.8] });
    instanced(pawn, T.gild ? m.gold : (m.pawnA ??= M.matte('#8a1a1a', 0.5)), items, root, 'markers-red');
    instanced(pawn, (m.pawnB ??= M.matte('#1a3a8a', 0.5)), items2, root, 'markers-blue');
    for (let i = 0; i < 3; i++) {
      const x = (r() - 0.5) * mw * 0.6, z = (r() - 0.5) * md * 0.6;
      mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.09, 4), m.wood2, { parent: root, at: [x, ty + 0.046, z], name: 'flag-pin' });
      mesh(new THREE.PlaneGeometry(0.04, 0.025), Object.assign(m.cloth.clone(), { side: THREE.DoubleSide }), { parent: root, at: [x + 0.02, ty + 0.078, z], name: 'flag' });
    }
    mesh(roundedBox(0.1, 0.01, 0.06, 0.003), m.wood2, { parent: root, at: [mw / 2 - 0.06, ty + 0.0065, md / 2 - 0.05], name: 'tally-board' });
  }
  if (variant === 'chart-table') {
    // dividers, compass rose disc, rolled charts and a brass compass
    curveTube([[0.1, ty + 0.003, 0.05], [0.18, ty + 0.06, 0.08], [0.26, ty + 0.003, 0.11]], 0.003, (m.brass ??= M.metal('#b8913f', 0.3)), { parent: root, segments: 10, radialSegments: 4, name: 'dividers' });
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.004, 32), (m.brass ??= M.metal('#b8913f', 0.3)), { parent: root, at: [-0.25, ty + 0.0035, -0.1], name: 'compass' });
    mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.002, 32), m.paper, { parent: root, at: [-0.25, ty + 0.006, -0.1], name: 'compass-card' });
    mesh(new THREE.ConeGeometry(0.008, 0.08, 4).rotateZ(Math.PI / 2), m.wax, { parent: root, at: [-0.25, ty + 0.009, -0.1], name: 'needle' });
    for (let i = 0; i < 3; i++) mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.5, 14).rotateZ(Math.PI / 2), m.paper, { parent: root, at: [-0.15 + i * 0.05, ty + 0.0235 + (i === 1 ? 0.0 : 0), D / 2 - 0.08], rot: [0, 0.05 * i, 0], name: 'chart-roll' });
  }
  if (variant === 'scholar-desk') {
    // open book, inkwell with quill, candle stub
    const bk = group('book', { parent: root, at: [-0.15, ty + 0.0015, 0.0] });
    for (const s of [-1, 1]) mesh(roundedBox(0.2, 0.025, 0.28, 0.004), m.leather, { parent: bk, at: [s * 0.1, 0.0125, 0], rot: [0, 0, s * 0.04], name: 'cover' });
    for (const s of [-1, 1]) mesh(cushion(0.19, 0.02, 0.26, { bulge: 0.4 }), m.paper, { parent: bk, at: [s * 0.098, 0.035, 0], rot: [0, 0, s * 0.06], name: 'pages' });
    mesh(lathe([[0, 0], [0.03, 0], [0.032, 0.03], [0.015, 0.045], [0, 0.045]], 16), m.dark, { parent: root, at: [0.2, ty + 0.0015, -0.1], name: 'inkwell' });
    curveTube([[0.2, ty + 0.03, -0.1], [0.24, ty + 0.12, -0.08], [0.27, ty + 0.2, -0.07]], 0.0025, m.paper, { parent: root, segments: 8, radialSegments: 4, name: 'quill' });
    mesh(new THREE.SphereGeometry(0.02, 8, 6).scale(0.4, 2.2, 1), m.paper, { parent: root, at: [0.263, ty + 0.17, -0.072], rot: [0, 0, -0.4], name: 'feather' });
  }
  if (T.ruin) {
    // one leg broken: table top tilted onto the floor
    const top = root.getObjectByName('top');
    void top;
    const tip = group('tipped', { parent: root });
    for (const c of [...root.children]) if (c !== tip) tip.attach(c);
    tip.rotation.z = Math.atan2(H * 0.6, W);
    root.updateMatrixWorld(true);
    const b = solidBox(tip); // ignore glow cards etc. when resting the tipped table on the floor
    tip.position.y -= b.min.y;
    rubble(root, T, b, 4, 0.08, { mat: m.wood2, kind: 'block' });
  }
  return done(root, T);
}

void noise3; void moveTrack; void spinTrack; void candle; void pingPong;
