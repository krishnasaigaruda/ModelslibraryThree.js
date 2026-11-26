import * as THREE from 'three';
import * as M from '../../core/materials.js';
import { mesh, group, roundedBox, cushion, curveTube, tube, lathe, finalize, normalizeOptions, pickVariant } from '../../core/utils.js';
import { spinTrack, rotateTrack, moveTrack, clip, pingPong } from '../../core/animation.js';
import { createLoft, smoothKeys } from '../../core/loft.js';
import { brandEmblem } from '../../core/brand.js';
import { lampGroup, lampTracks, LAMP_ON } from '../../core/lamps.js';
import { applyTrim, textMaterial, decal, canvasTex, sculpt, smoothShape } from './misc-kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { splitLong } from './heavy-kit.js';

/** Weld a panel and the parts fixed to it (ribs, ladders, pockets) into one multi-material mesh. */
function fuse(parent, meshes, name) {
  const byMat = new Map();
  for (const m of meshes) {
    m.updateMatrix();
    let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.clearGroups();
    g.applyMatrix4(m.matrix);
    if (!byMat.has(m.material)) byMat.set(m.material, []);
    byMat.get(m.material).push(g);
    m.removeFromParent();
  }
  const mats = [...byMat.keys()];
  const geo = mergeGeometries(mats.map((k) => mergeGeometries(byMat.get(k), false)), true);
  const out = new THREE.Mesh(geo, mats.length === 1 ? mats[0] : mats);
  out.name = name;
  parent.add(out);
  return out;
}

/*
 * Rail vehicles on standard gauge (1.435 m). Front = +X. Wheels sit on y = 0
 * (rail head). Real proportions: car width ≈ 2.9–3.1 m, roof ≈ 3.6–4.3 m,
 * coaches ≈ 23 m, wagons ≈ 14–18 m, bogie wheels ≈ 0.46 m radius.
 */

const GAUGE = 1.435;

export const TRAIN_VARIANTS = {
  diesel:     { kind: 'hood', L: 20, W: 3.0, H: 4.3, color: '#e65100', accent: '#212121', axles: 3, wr: 0.52 },
  electric:   { kind: 'box', L: 19, W: 3.0, H: 4.1, color: '#c62828', accent: '#eceff1', axles: 2, wr: 0.6, cabs: 2, pantograph: true, windows: 'grilles' },
  steam:      { kind: 'steam', L: 12.5, W: 3.0, H: 4.3, color: '#1b1b1b', accent: '#b71c1c' },
  passenger:  { kind: 'box', L: 23, W: 2.95, H: 4.0, color: '#1565c0', accent: '#eceff1', axles: 2, wr: 0.46, windows: 'coach', doors: 'ends', gangway: true },
  sleeper:    { kind: 'box', L: 23, W: 2.95, H: 4.0, color: '#4a148c', accent: '#d4af37', axles: 2, wr: 0.46, windows: 'sleeper', doors: 'ends', gangway: true },
  'high-speed': { kind: 'box', L: 21, W: 2.95, H: 3.9, color: '#eceff1', accent: '#c62828', axles: 2, wr: 0.46, cabs: 1, nose: 6.5, pantograph: true, windows: 'coach-rear' },
  subway:     { kind: 'box', L: 18, W: 2.9, H: 3.7, color: '#b0bec5', accent: '#1565c0', axles: 2, wr: 0.42, cabs: 1, windows: 'metro', doors: 'metro', flatFront: true },
  tram:       { kind: 'box', L: 15, W: 2.65, H: 3.55, color: '#fdd835', accent: '#263238', axles: 2, wr: 0.34, cabs: 2, nose: 1.4, pantograph: true, windows: 'tram', doors: 'tram', lowFloor: true },
  'light-rail': { kind: 'box', L: 28, W: 2.65, H: 3.6, color: '#eceff1', accent: '#2e7d32', axles: 2, wr: 0.34, cabs: 2, nose: 1.6, pantograph: true, windows: 'tram', doors: 'tram', lowFloor: true, joint: 0 },
  monorail:   { kind: 'monorail', L: 14, W: 2.9, H: 3.4, color: '#00acc1', accent: '#eceff1', cabs: 1, nose: 2.6 },
  boxcar:     { kind: 'boxcar', L: 15.5, W: 3.1, H: 4.4, color: '#8d3b1e', accent: '#f5f5f5', axles: 2, wr: 0.46 },
  tanker:     { kind: 'tanker', L: 16, W: 3.0, H: 4.3, color: '#212121', accent: '#f5f5f5', axles: 2, wr: 0.46 },
  hopper:     { kind: 'hopper', L: 16, W: 3.1, H: 4.1, color: '#5d6d7e', accent: '#f5f5f5', axles: 2, wr: 0.46 },
  flatcar:    { kind: 'flatcar', L: 18.5, W: 2.9, H: 1.3, color: '#37474f', accent: '#f5f5f5', axles: 2, wr: 0.46 },
  caboose:    { kind: 'caboose', L: 10, W: 3.0, H: 4.4, color: '#c62828', accent: '#fdd835', axles: 2, wr: 0.46 },
};

/** Trims per variant (all change parts). */
export const TRAIN_TRIMS = {
  plow: { plow: true },
  vintage: { vintage: true },
  modern: { modern: true },
  branded: { branded: true },
  'roof-gear': { roofGear: true },
  loaded: { loaded: true },
  'double-pan': { pantograph: true, doublePan: true },
  'dual-cab': { cabs: 2 },
  'snow-shield': { plow: true, roofGear: true },
};
export const TRAIN_TRIM_NAMES = {
  diesel: ['plow', 'vintage', 'modern', 'branded', 'dual-cab'],
  electric: ['plow', 'vintage', 'modern', 'branded', 'double-pan'],
  steam: ['plow', 'vintage', 'modern', 'branded', 'loaded'],
  passenger: ['vintage', 'modern', 'branded', 'roof-gear', 'loaded'],
  sleeper: ['vintage', 'modern', 'branded', 'roof-gear', 'loaded'],
  'high-speed': ['plow', 'modern', 'branded', 'roof-gear', 'double-pan'],
  subway: ['vintage', 'modern', 'branded', 'roof-gear', 'loaded'],
  tram: ['vintage', 'modern', 'branded', 'roof-gear', 'snow-shield'],
  'light-rail': ['vintage', 'modern', 'branded', 'roof-gear', 'snow-shield'],
  monorail: ['vintage', 'modern', 'branded', 'roof-gear', 'loaded'],
  boxcar: ['vintage', 'modern', 'branded', 'roof-gear', 'loaded'],
  tanker: ['vintage', 'modern', 'branded', 'roof-gear', 'loaded'],
  hopper: ['vintage', 'modern', 'branded', 'roof-gear', 'loaded'],
  flatcar: ['vintage', 'modern', 'branded', 'roof-gear', 'loaded'],
  caboose: ['vintage', 'modern', 'branded', 'roof-gear', 'plow'],
};

/* ---------------- shared parts ---------------- */

function railMats() {
  return {
    steel: M.metal('#3a3d41', 0.5),
    dark: M.metal('#1d1f22', 0.55),
    wheel: M.metal('#5c6066', 0.35),
    tread: M.metal('#c9ccd0', 0.2),
    rubber: M.matte('#151515', 0.85),
    rail: M.metal('#9aa0a6', 0.3),
    yellow: M.paint('#f9a825', { metallic: 0.2 }),
    glass: new THREE.MeshPhysicalMaterial({ name: 'glass', color: '#0e1418', roughness: 0.04, transparent: true, opacity: 0.55, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }),
    interior: new THREE.MeshStandardMaterial({ name: 'interior', color: '#6d7276', roughness: 0.85, side: THREE.BackSide }),
  };
}

/** Flanged railway wheel (axle along Z) centred on its axle. */
function railWheel(r, mats) {
  const g = new THREE.Group();
  const prof = [[0.06, -0.07], [r * 0.55, -0.065], [r * 0.6, -0.035], [r - 0.01, -0.07], [r, -0.06], [r, 0.02], [r + 0.03, 0.04], [r + 0.03, 0.065], [r - 0.02, 0.07], [r * 0.6, 0.04], [0.06, 0.06]];
  mesh(lathe(prof, 40).rotateX(Math.PI / 2), mats.wheel, { parent: g });
  mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 16).rotateX(Math.PI / 2), mats.steel, { parent: g });
  return g;
}

/** Bogie: frame, springs, axles with wheels. Returns spin groups. Wheels touch y = 0. */
function bogie(parent, x, { wr = 0.46, axles = 2, wb, mats, name = 'bogie', powered = false }) {
  const b = group(name, { parent, at: [x, 0, 0] });
  wb ??= axles === 3 ? 1.9 : 2.5;
  const spins = [];
  const half = GAUGE / 2 + 0.035;
  for (let i = 0; i < axles; i++) {
    const ax = (i - (axles - 1) / 2) * wb / (axles > 1 ? (axles - 1) : 1) * (axles === 3 ? 1 : 1);
    const ax2 = axles === 1 ? 0 : ax * (axles === 3 ? 1 : 1);
    const spin = group(`${name}_axle${i}`, { parent: b, at: [ax2, wr, 0] });
    for (const s of [1, -1]) {
      const w = railWheel(wr, mats);
      w.position.z = s * half;
      if (s < 0) w.rotation.y = Math.PI;
      spin.add(w);
    }
    mesh(new THREE.CylinderGeometry(0.07, 0.07, GAUGE + 0.3, 12).rotateX(Math.PI / 2), mats.steel, { parent: spin });
    spins.push(spin);
    // axle boxes
    for (const s of [1, -1]) mesh(roundedBox(0.34, 0.3, 0.2, 0.04), mats.dark, { parent: b, at: [ax2, wr, s * (half + 0.17)] });
  }
  const span = axles === 1 ? 0.8 : wb + 0.9;
  for (const s of [1, -1]) {
    // side frame with a gentle hump
    mesh(sculpt(smoothShape([[-span / 2, wr + 0.12], [-span / 2 + 0.2, wr + 0.3], [span / 2 - 0.2, wr + 0.3], [span / 2, wr + 0.12], [span / 2 - 0.2, wr - 0.05], [-span / 2 + 0.2, wr - 0.05]]), 0.14, { bevel: 0.03 }), mats.dark, { parent: b, at: [0, 0, s * (half + 0.2)] });
    // coil springs
    for (const k of [-0.25, 0.25]) mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.26, 12), mats.yellow, { parent: b, at: [k * (axles === 3 ? 1.6 : 1), wr + 0.42, s * (half + 0.12)] });
  }
  // bolster across, reaching up to the car body
  mesh(roundedBox(0.5, 0.26, GAUGE + 0.65, 0.05), mats.dark, { parent: b, at: [0, wr + 0.5, 0] });
  if (powered) mesh(roundedBox(0.7, 0.4, 0.9, 0.08), mats.steel, { parent: b, at: [0, wr + 0.22, 0] });
  return spins;
}

/** Knuckle coupler (+ optional buffers) at an end, facing `dir` (±1). */
function coupler(parent, x, y, dir, mats, { buffers = false } = {}) {
  const c = group(null, { parent, at: [x, y, 0] });
  mesh(roundedBox(0.7, 0.2, 0.26, 0.04), mats.dark, { parent: c, at: [dir * 0.3, 0, 0] });
  mesh(roundedBox(0.22, 0.32, 0.32, 0.06), mats.steel, { parent: c, at: [dir * 0.68, 0, 0] });
  if (buffers) mesh(roundedBox(0.16, 0.4, 2.3, 0.04), mats.dark, { parent: c, at: [dir * 0.06, 0, 0] });
  if (buffers) for (const s of [1, -1]) {
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.42, 16).rotateZ(Math.PI / 2), mats.dark, { parent: c, at: [dir * 0.2, 0, s * 0.88] });
    mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24).rotateZ(Math.PI / 2), mats.steel, { parent: c, at: [dir * 0.43, 0, s * 0.88] });
  }
  return c;
}

/** Pantograph (raise/lower track returned). */
function pantograph(parent, x, y, name, mats) {
  const base = group(name, { parent, at: [x, y, 0] });
  mesh(roundedBox(1.4, 0.12, 1.3, 0.04), mats.dark, { parent: base, at: [0, 0.06, 0] });
  for (const z of [0.5, -0.5]) mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 10), M.matte('#d7ccc8', 0.5), { parent: base, at: [0.55, -0.02, z] });
  const lower = group(`${name}_lower`, { parent: base, at: [-0.55, 0.14, 0], rot: [0, 0, 0.25] });
  for (const z of [0.38, -0.38]) tube([0, 0, z], [1.5, 0, z * 0.4], 0.035, mats.steel, { parent: lower });
  const upper = group(`${name}_upper`, { parent: lower, at: [1.5, 0, 0], rot: [0, 0, 2.6] });
  for (const z of [0.15, -0.15]) tube([0, 0, z], [1.5, 0, z * 0.5], 0.025, mats.steel, { parent: upper });
  const head = group(`${name}_head`, { parent: upper, at: [1.5, 0, 0], rot: [0, 0, -2.85] });
  mesh(roundedBox(0.12, 0.06, 1.6, 0.025), mats.dark, { parent: head });
  for (const s of [1, -1]) curveTube([[0, 0, s * 0.8], [0.05, -0.08, s * 0.95]], 0.02, mats.dark, { parent: head });
  const T = 4;
  const raise = (t) => Math.min(1, pingPong(t) * 1.5);
  const tracks = [
    rotateTrack(lower, 'z', T, (t) => 0.25 + raise(t) * 0.5),
    rotateTrack(upper, 'z', T, (t) => 2.6 - raise(t) * 1.0),
    rotateTrack(head, 'z', T, (t) => -2.85 + raise(t) * 0.5),
  ];
  return tracks;
}

/* ---------------- builder ---------------- */

export function createTrain(options = {}) {
  const o = normalizeOptions(options);
  const variant = pickVariant(TRAIN_VARIANTS, o.variant, 'train');
  const v = applyTrim(TRAIN_VARIANTS[variant], TRAIN_TRIMS, o.trim, 'train');
  const mats = railMats();
  const root = group(`train-${variant}`);
  const body = group('body', { parent: root });
  const paint = M.paint(o.color ?? v.color, { metallic: 0.3, roughness: 0.35 });
  const accent = M.paint(o.accentColor ?? v.accent, { metallic: 0.3, roughness: 0.35 });
  for (const m of [accent]) Object.assign(m, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const { L, W, H } = v;
  const h = L / 2;
  const spins = [];
  const extra = [];
  const head = lampGroup('headlights', v.modern ? 'drl' : 'head');
  const tail = lampGroup('taillights', 'tail');
  const marker = lampGroup('markers', 'white');
  let floorTop = 1.25;

  const addBogies = (xs, opts = {}) => xs.forEach((x, i) => spins.push(...bogie(root, x, { wr: v.wr, axles: v.axles, mats, name: `bogie${i}`, ...opts })));
  const endFrame = (y) => {
    // underframe sill + couplers at both ends
    mesh(roundedBox(L - 0.4, 0.32, W - 0.5, 0.06), mats.dark, { parent: body, at: [0, y, 0], name: 'underframe' });
    coupler(body, h - 0.2, y, 1, mats, { buffers: v.vintage });
    coupler(body, -h + 0.2, y, -1, mats, { buffers: v.vintage });
  };
  const lightsAt = (x, dir, y, spread, { big = false } = {}) => {
    for (const s of [1, -1]) {
      head.add(body, { at: [x, y, s * spread], normal: [dir, 0, 0], w: big ? 0.3 : 0.22, h: big ? 0.3 : 0.16, shape: v.vintage ? 'round' : 'rect', depth: 0.02 });
      tail.add(body, { at: [x, y - 0.3, s * spread], normal: [dir, 0, 0], w: 0.16, h: 0.12, shape: 'round', depth: 0.02 });
    }
  };
  const emblem = (x, y, z, ry, size = 0.4) => {
    const e = brandEmblem(size, { name: 'emblem' });
    e.scale.z = 0.25;
    e.position.set(x, y, z);
    e.rotation.y = ry;
    body.add(e);
  };
  const branding = (y, len) => {
    if (!v.branded) return;
    const t = textMaterial('ORBIX RAIL', { color: '#ffffff', font: 'bold 80px Arial', stroke: '#00000055' });
    for (const s of [1, -1]) decal(body, t, { at: [0, y, s * (W / 2 + 0.012)], normal: [0, 0, s], w: Math.min(len * 0.5, 7), h: 0.7, name: 'branding' });
  };

  /* ----- loft carbody (passenger, sleeper, electric, high-speed, subway, tram, light-rail, caboose) ----- */
  const carbody = ({ y0, cabs = 0, nose = 1.0, flatFront = false, windows, doors, roofR = 0.55 }) => {
    const front = cabs >= 1;
    const rear = cabs >= 2;
    const noseLen = flatFront ? 0.35 : nose;
    const topKeys = [[-h, H - (rear ? 0.25 : 0.12)], [-h + (rear ? noseLen : 0.2), H], [h - (front ? noseLen : 0.2), H], [h, H - (front ? (flatFront ? 0.25 : 0.95) : 0.12)]];
    const top = smoothKeys(topKeys);
    const section = (x) => ({ y0, yb: y0 + (H - y0) * 0.36, yt: top(x), w: W, wt: W * 0.9, r1: 0.12, r2: roofR, crown: 0.06, bulge: 0.0, sideBulge: 0.03 });
    const breaks = [];
    const winList = [];
    const doorList = [];
    const usable = [-h + (rear ? noseLen + 0.6 : 0.9), h - (front ? noseLen + 1.2 : 0.9)];
    if (doors === 'ends') doorList.push([h - 1.9, h - 1.0], [-h + 1.0, -h + 1.9]);
    if (doors === 'metro') for (const c of [-0.6, -0.2, 0.2, 0.6]) doorList.push([c * (usable[1] - usable[0]) / 1.2 + (usable[0] + usable[1]) / 2 - 0.65, c * (usable[1] - usable[0]) / 1.2 + (usable[0] + usable[1]) / 2 + 0.65]);
    if (doors === 'tram') for (const c of [-0.55, 0, 0.55]) doorList.push([c * (usable[1] - usable[0]) / 1.2 - 0.65, c * (usable[1] - usable[0]) / 1.2 + 0.65]);
    if (v.joint != null) doorList.push([v.joint - 0.5, v.joint + 0.5]); // no windows at the joint (bellows there)
    const inDoor = (a, b) => doorList.some(([d0, d1]) => b > d0 - 0.15 && a < d1 + 0.15);
    const pitch = windows === 'sleeper' ? 2.1 : windows === 'metro' ? 1.5 : windows === 'tram' ? 1.4 : windows === 'grilles' ? 3 : 1.9;
    const wlen = windows === 'sleeper' ? 1.0 : windows === 'metro' ? 1.25 : windows === 'tram' ? 1.2 : windows === 'grilles' ? 1.0 : 1.4;
    if (windows) for (let x = usable[0]; x + wlen < usable[1]; x += pitch) if (!inDoor(x, x + wlen)) winList.push([x, x + wlen]);
    if (windows === 'coach-rear') { winList.length = 0; }
    for (const [a, b] of [...winList, ...doorList]) breaks.push(a, b);
    if (front) breaks.push(h - noseLen, h - noseLen * 0.55);
    if (rear) breaks.push(-h + noseLen, -h + noseLen * 0.55);
    const loft = createLoft({ length: L, nose: { len: noseLen, p: flatFront ? 6 : 2.4 }, tail: { len: rear ? noseLen : 0.3, p: rear ? (flatFront ? 6 : 2.4) : 6 }, rake: { front: front && !flatFront ? 0.6 : 0, rear: rear && !flatFront ? 0.6 : 0 }, breaks, section, segments: { bottom: 3, corner: 3, lower: 6, side: 8, roofCorner: 5, roof: 6 }, stations: 160 });
    const I = loft.idx;
    const glassGeos = [];
    const wb0 = windows === 'grilles' ? 0.1 : 0.12;
    const wb1 = windows === 'grilles' ? 0.5 : 0.82;
    for (const [a, b] of winList) glassGeos.push(loft.patch({ x: [a, b], from: I('side', wb0), to: I('side', wb1), side: 'both', hole: windows !== 'grilles', offset: windows === 'grilles' ? 0.004 : 0 }));
    for (const [d0, d1] of doorList) if (!(v.joint != null && Math.abs((d0 + d1) / 2 - v.joint) < 0.1)) {
      // door: glass upper half (hole) + door leaves drawn as panel gaps
      glassGeos.push(loft.patch({ x: [d0 + 0.08, d1 - 0.08], from: I('side', 0.12), to: I('side', 0.82), side: 'both', hole: true, offset: 0 }));
      mesh(loft.patch({ x: [d0, d1], from: I('lower', 0.02), to: I('side', 0.9), side: 'both', skipHoles: true, offset: 0.006 }), M.paint(v.doorColor ?? '#9e9e9e', { metallic: 0.4 }), { parent: body, name: 'door' });
    }
    if (front) glassGeos.push(loft.patch({ x: [h - noseLen * (flatFront ? 1 : 0.62), h - noseLen * (flatFront ? 0.01 : 0.25)], from: I('side', 0.15), to: I('roofCorner', flatFront ? 0.3 : 0.6), side: 'across', hole: true, offset: 0 }));
    if (rear) glassGeos.push(loft.patch({ x: [-h + noseLen * (flatFront ? 0.01 : 0.25), -h + noseLen * (flatFront ? 1 : 0.62)], from: I('side', 0.15), to: I('roofCorner', flatFront ? 0.3 : 0.6), side: 'across', hole: true, offset: 0 }));
    for (const g of glassGeos) mesh(g, windows === 'grilles' ? mats.dark : mats.glass, { parent: body, name: 'glass' });
    // livery: accent band under the windows + roof
    mesh(loft.patch({ x: [-h + 0.1, h - 0.1], from: I('lower', 0.55), to: I('lower', 0.75), side: 'both', skipHoles: true, offset: 0.003 }), accent, { parent: body, name: 'stripe' });
    mesh(loft.patch({ x: [-h, h], from: I('roofCorner', 0.6), side: 'across', skipHoles: true, offset: 0.002 }), Object.assign(M.matte('#9ea4a8', 0.6), { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), { parent: body, name: 'roof' });
    const shell = loft.bodyGeometry();
    mesh(shell, paint, { parent: body, name: 'shell' });
    mesh(shell, mats.interior, { parent: body, name: 'cabin' });
    // interior floor + seats seen through the windows
    const fy = y0 + 0.12;
    mesh(roundedBox(L - 1.0, 0.06, W - 0.2, 0.02), M.matte('#455a64'), { parent: body, at: [0, fy, 0], name: 'floor' });
    const seatXs = [];
    for (let x = usable[0] + 0.3; x < usable[1] - 0.3; x += windows === 'metro' || windows === 'tram' ? 1.0 : 0.95) if (!inDoor(x - 0.3, x + 0.3)) seatXs.push(x);
    const seatGeo = cushion(0.45, 0.5, 0.95, { radius: 0.06 });
    const seats = new THREE.InstancedMesh(seatGeo, M.fabric(v.seatColor ?? '#37474f'), seatXs.length * 2);
    const m4 = new THREE.Matrix4();
    seatXs.forEach((x, i) => {
      for (const [k, s] of [[0, 1], [1, -1]]) seats.setMatrixAt(i * 2 + k, m4.makeTranslation(x, fy + 0.28, s * (W / 2 - 0.62)));
    });
    seats.name = 'seats';
    body.add(seats);
    return { loft, I, front, rear, noseLen, doorList };
  };

  /* ----- per kind ----- */
  const kind = v.kind;
  if (kind === 'box') {
    const y0 = v.lowFloor ? 0.32 : 1.15;
    floorTop = y0;
    const cb = carbody({ y0, cabs: v.cabs ?? 0, nose: v.nose ?? 1.2, flatFront: v.flatFront, windows: v.windows, doors: v.doors });
    const bx = h - (v.lowFloor ? 2.6 : 3.2);
    if (v.lowFloor) {
      // low-floor: bogies sit under the cab ends inside skirts
      addBogies(v.joint != null ? [bx, 0, -bx] : [bx, -bx], { wb: 1.8 });
      for (const s of [1, -1]) mesh(cb.loft.patch({ x: [-h + 0.3, h - 0.3], from: 0, to: cb.I('lower', 0.12), side: s > 0 ? 'pos' : 'neg', skipHoles: true, offset: 0.004 }), mats.dark, { parent: body, name: 'skirt' });
    } else {
      addBogies([bx, -bx], { powered: !!v.cabs });
      endFrame(y0 + 0.05);
    }
    if (v.joint != null) {
      const rub = M.matte('#1c1c1c', 0.85);
      mesh(cb.loft.patch({ x: [v.joint - 0.45, v.joint + 0.45], from: cb.I('corner', 0.3), side: 'across', offset: 0.006 }), rub, { parent: body, name: 'bellows' });
    }
    // cab lights
    if (cb.front) lightsAt(h - (v.flatFront ? 0.02 : 0.25), 1, y0 + 0.7, W / 2 - 0.45, { big: v.vintage });
    if (cb.rear) lightsAt(-h + (v.flatFront ? 0.02 : 0.25), -1, y0 + 0.7, W / 2 - 0.45, { big: v.vintage });
    if (!cb.rear) for (const s of [1, -1]) tail.add(body, { at: [-h - 0.01, y0 + 0.5, s * (W / 2 - 0.35)], normal: [-1, 0, 0], w: 0.14, h: 0.14, shape: 'round', depth: 0.02 });
    if (cb.front) {
      {
        // marker lamp on the real cab skin (nose top), its housing sunk into the panel
        let mp = null;
        if (cb.loft) {
          const mx = h - (v.flatFront ? 0.08 : 0.9);
          for (const seg of ['side', 'roofCorner', 'roof']) for (let t = 0; t <= 1.0001; t += 0.1) {
            const q = cb.loft.pointAt(mx, seg, t, 1);
            if (!mp || Math.abs(q.point.y - (H - 0.12)) + Math.abs(q.point.z) < Math.abs(mp.point.y - (H - 0.12)) + Math.abs(mp.point.z)) mp = q;
          }
        }
        const at = mp ? new THREE.Vector3(mp.point.x, mp.point.y, 0) : new THREE.Vector3(h - (v.flatFront ? 0.08 : 0.9), H - 0.12, 0);
        const n = mp ? new THREE.Vector3(Math.max(0.3, mp.normal.x), Math.max(0, mp.normal.y), 0).normalize() : new THREE.Vector3(1, 0.3, 0).normalize();
        marker.add(body, { at: at.toArray(), normal: n.toArray(), w: 0.2, h: 0.08, depth: 0.015 });
        const hb = mesh(roundedBox(0.3, 0.14, 0.3, 0.03), mats.dark, { parent: body, name: 'marker_housing' });
        hb.position.copy(at).addScaledVector(n, -0.14);
      }
      emblem(h + 0.005, y0 + 0.4, 0, Math.PI / 2, 0.32);
      // wipers resting at the bottom of the windscreen
      const wp = cb.loft.pointAt(h - cb.noseLen * (v.flatFront ? 0.5 : 0.6), 'side', 0.18, 1);
      for (const z of [0.55, -0.55]) mesh(roundedBox(0.03, 0.02, 0.8, 0.008), mats.dark, { parent: body, at: [wp.point.x + 0.03, wp.point.y + 0.03, z], rot: [0, 0, 0.6] });
    }
    if (cb.rear) emblem(-h - 0.005, y0 + 0.4, 0, -Math.PI / 2, 0.32);
    if (v.gangway) for (const s of [1, -1]) mesh(roundedBox(0.4, 2.2, 1.3, 0.12), M.matte('#2b2b2b', 0.9), { parent: body, at: [s * (h + 0.05), y0 + 1.25, 0], name: 'gangway' });
    // pantograph(s)
    if (v.pantograph) {
      const pans = v.doublePan ? [h * 0.45, -h * 0.45] : [v.cabs === 1 ? -h * 0.2 : h * 0.3];
      pans.forEach((x, i) => {
        const tr = pantograph(body, x, H - 0.02, `pantograph${i}`, mats);
        extra.push(...tr);
      });
      for (const s of [1, -1]) mesh(roundedBox(2.0, 0.22, 0.5, 0.06), M.matte('#b0bec5', 0.5), { parent: body, at: [h * 0.05, H + 0.08, s * 0.7], name: 'roof_equipment' });
    }
    branding(y0 + 1.7, L);
  } else if (kind === 'hood') {
    // diesel road-switcher: walkway deck, long hood, cab (+ optional second cab)
    const deckY = 1.45;
    floorTop = deckY;
    addBogies([h - 3.6, -h + 3.6], { powered: true, wb: 1.9 });
    mesh(roundedBox(L - 0.5, 0.3, W, 0.05), mats.dark, { parent: body, at: [0, deckY - 0.15, 0], name: 'deck' });
    // fuel tank between the bogies
    mesh(new THREE.CapsuleGeometry(0.55, L * 0.32, 6, 20).rotateZ(Math.PI / 2), mats.dark, { parent: body, at: [0, deckY - 0.85, 0], name: 'fuel_tank' });
    for (const s of [1, -1]) mesh(roundedBox(0.2, 0.55, 0.3, 0.04), mats.dark, { parent: body, at: [s * L * 0.2, deckY - 0.45, 0] });
    const cabX = h - 3.2;
    const hoodW = W - 0.9;
    const cabs = v.cabs === 2 ? [cabX, -cabX] : [cabX];
    // long hood
    const hoodFrom = v.cabs === 2 ? -cabX + 1.3 : -h + 0.6;
    const hoodTo = cabX - 1.3;
    mesh(roundedBox(hoodTo - hoodFrom, 2.2, hoodW, 0.18), paint, { parent: body, at: [(hoodFrom + hoodTo) / 2, deckY + 1.1, 0], name: 'hood' });
    for (let x = hoodFrom + 0.6; x < hoodTo - 0.4; x += 1.2) for (const s of [1, -1]) mesh(roundedBox(0.7, 0.9, 0.02, 0.01), M.metal('#4a4e54', 0.5), { parent: body, at: [x, deckY + 1.25, s * (hoodW / 2 + 0.005)], name: 'louvre' });
    // radiator fans + exhaust on the hood roof
    for (const x of [hoodFrom + 1.2, hoodFrom + 2.6]) mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), mats.dark, { parent: body, at: [x, deckY + 2.25, 0] });
    mesh(roundedBox(0.6, 0.35, 0.4, 0.06), mats.dark, { parent: body, at: [hoodTo - 2, deckY + 2.35, 0] });
    for (const cx of cabs) {
      const dir = Math.sign(cx);
      const cab = group(null, { parent: body, at: [cx, deckY, 0] });
      mesh(roundedBox(2.6, H - deckY, W - 0.2, 0.22), paint, { parent: cab, at: [0, (H - deckY) / 2, 0], name: 'cab' });
      for (const s of [1, -1]) mesh(roundedBox(1.0, 0.75, 0.03, 0.06), mats.glass, { parent: cab, at: [-dir * 0.3, H - deckY - 0.75, s * (W / 2 - 0.1)] });
      mesh(roundedBox(0.03, 0.75, W - 0.7, 0.06), mats.glass, { parent: cab, at: [dir * 1.3, H - deckY - 0.75, 0] });
      // short hood / nose
      mesh(roundedBox(1.2, 1.5, hoodW, 0.15), paint, { parent: cab, at: [dir * 1.9, 0.75, 0] });
      const nx = cx + dir * 2.5;
      for (const s of [1, -1]) head.add(body, { at: [nx, deckY + 1.15, s * 0.3], normal: [dir, 0, 0], w: 0.2, h: 0.2, shape: 'round', depth: 0.02 });
      // ditch lights on the deck ends
      for (const s of [1, -1]) {
        head.add(body, { at: [dir * (h - 0.25), deckY - 0.15, s * (W / 2 - 0.25)], normal: [dir, 0, 0], w: 0.18, h: 0.18, shape: 'round', depth: 0.02 });
        tail.add(body, { at: [dir * (h - 0.25), deckY - 0.15, s * (W / 2 - 0.55)], normal: [dir, 0, 0], w: 0.12, h: 0.12, shape: 'round', depth: 0.02 });
      }
      emblem(nx + dir * 0.005, deckY + 0.6, 0, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0.36);
      marker.add(body, { at: [cx + dir * 1.32, H - 0.1, 0], normal: [dir, 0.2, 0], w: 0.3, h: 0.1, depth: 0.015 });
    }
    if (v.cabs !== 2) for (const s of [1, -1]) tail.add(body, { at: [-h + 0.25, deckY - 0.15, s * (W / 2 - 0.25)], normal: [-1, 0, 0], w: 0.14, h: 0.14, shape: 'round', depth: 0.02 });
    // walkway handrails
    const railMat = mats.yellow;
    for (const s of [1, -1]) {
      tube([-h + 0.4, deckY + 1.0, s * (W / 2 - 0.08)], [h - 0.4, deckY + 1.0, s * (W / 2 - 0.08)], 0.025, railMat, { parent: body });
      for (let x = -h + 0.4; x <= h - 0.39; x += 2.0) tube([x, deckY, s * (W / 2 - 0.08)], [x, deckY + 1.0, s * (W / 2 - 0.08)], 0.022, railMat, { parent: body });
    }
    coupler(body, h - 0.2, deckY - 0.3, 1, mats, { buffers: v.vintage });
    coupler(body, -h + 0.2, deckY - 0.3, -1, mats, { buffers: v.vintage });
    branding(deckY + 1.2, L * 0.6);
  } else if (kind === 'steam') {
    // boiler on frames, smokebox, chimney, domes, cab; driving wheels with side rods
    const dr = 0.78;
    const deckY = 1.25;
    floorTop = deckY;
    const bx0 = -h + 3.2;
    const bx1 = h - 0.4;
    const by = 2.45;
    const br = 0.85;
    mesh(roundedBox(L - 0.6, 0.35, 2.0, 0.05), mats.dark, { parent: body, at: [0, deckY - 0.1, 0], name: 'frame' });
    const boiler = new THREE.CylinderGeometry(br, br, bx1 - bx0 - 1.2, 40).rotateZ(Math.PI / 2);
    mesh(boiler, paint, { parent: body, at: [(bx0 + bx1 - 1.2) / 2, by, 0], name: 'boiler' });
    for (let x = bx0 + 0.4; x < bx1 - 1.3; x += 1.1) mesh(new THREE.TorusGeometry(br + 0.005, 0.025, 8, 40).rotateY(Math.PI / 2), v.vintage ? M.metal('#c9a227', 0.25) : mats.steel, { parent: body, at: [x, by, 0] });
    mesh(new THREE.CylinderGeometry(br + 0.06, br + 0.06, 1.2, 40).rotateZ(Math.PI / 2), mats.dark, { parent: body, at: [bx1 - 0.6, by, 0], name: 'smokebox' });
    mesh(new THREE.CylinderGeometry(br * 0.9, br * 0.9, 0.08, 40).rotateZ(Math.PI / 2), mats.steel, { parent: body, at: [bx1 + 0.02, by, 0] });
    mesh(lathe([[0.001, 0], [0.3, 0], [0.26, 0.15], [0.24, 0.6], [0.32, 0.75], [0.001, 0.75]], 28), mats.dark, { parent: body, at: [bx1 - 0.6, by + br - 0.08, 0], name: 'chimney' });
    for (const [x, r] of [[bx0 + 2.6, 0.35], [bx0 + 1.2, 0.3]]) mesh(lathe([[0.001, 0.45], [r * 0.7, 0.45], [r, 0.3], [r * 1.15, 0]], 28), v.vintage ? M.metal('#c9a227', 0.25) : paint, { parent: body, at: [x, by + br - 0.1, 0], name: 'dome' });
    // cab
    const cab = group(null, { parent: body, at: [bx0 - 1.1, deckY, 0] });
    mesh(roundedBox(2.2, 2.0, W - 0.1, 0.08), paint, { parent: cab, at: [0, 1.0, 0], name: 'cab' });
    for (const s of [1, -1]) mesh(roundedBox(0.7, 0.6, 0.03, 0.08), mats.glass, { parent: cab, at: [0.2, 1.4, s * (W / 2 - 0.05)] });
    mesh(cushion(2.5, 0.16, W + 0.15, { radius: 0.06, bulge: 0.2 }), mats.dark, { parent: cab, at: [0, 2.48 - deckY + 1.25 - 1.25 + 0.0 + 0.82, 0], name: 'cab_roof' });
    // running boards
    for (const s of [1, -1]) mesh(roundedBox(bx1 - bx0, 0.05, 0.35, 0.015), mats.dark, { parent: body, at: [(bx0 + bx1) / 2 - 0.2, deckY + 0.35, s * 1.25] });
    // drivers
    const drivers = [];
    const axX = [bx0 + 0.6, bx0 + 2.3, bx0 + 4.0];
    for (const [i, x] of axX.entries()) {
      const spin = group(`driver${i}`, { parent: root, at: [x, dr, 0] });
      for (const s of [1, -1]) {
        const w = group(null, { parent: spin, at: [0, 0, s * (GAUGE / 2 + 0.04)] });
        mesh(new THREE.CylinderGeometry(dr, dr, 0.14, 40).rotateX(Math.PI / 2), mats.wheel, { parent: w });
        mesh(new THREE.TorusGeometry(dr - 0.04, 0.04, 8, 40), M.paint('#b71c1c'), { parent: w, at: [0, 0, s * 0.072] });
        for (let k = 0; k < 14; k++) tube([0, 0, s * 0.07], [Math.cos(k / 14 * Math.PI * 2) * (dr - 0.06), Math.sin(k / 14 * Math.PI * 2) * (dr - 0.06), s * 0.07], 0.025, M.paint('#b71c1c'), { parent: w, radialSegments: 5 });
        mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12).rotateX(Math.PI / 2), mats.steel, { parent: w, at: [0, -0.32, s * 0.1] });
      }
      mesh(new THREE.CylinderGeometry(0.08, 0.08, GAUGE + 0.3, 12).rotateX(Math.PI / 2), mats.steel, { parent: spin });
      drivers.push(spin);
      spins.push(spin);
    }
    // side rods: translate on a circle with the crank pins (always horizontal)
    for (const s of [1, -1]) {
      const rod = group(`side_rod_${s > 0 ? 'R' : 'L'}`, { parent: root, at: [0, dr - 0.32, s * (GAUGE / 2 + 0.2)] });
      mesh(roundedBox(axX[2] - axX[0] + 0.3, 0.1, 0.05, 0.03), mats.steel, { parent: rod, at: [(axX[0] + axX[2]) / 2, 0, 0] });
      extra.rods ??= [];
      extra.rods.push(rod);
      // cylinder + piston rod at the front
      mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 24).rotateZ(Math.PI / 2), mats.dark, { parent: body, at: [bx1 - 0.9, dr + 0.15, s * 1.12] });
    }
    // pony truck wheels
    spins.push(...bogie(root, bx1 - 0.6, { wr: 0.42, axles: 1, mats, name: 'pony' }));
    spins.push(...bogie(root, bx0 - 1.3, { wr: 0.42, axles: 1, mats, name: 'trailing' }));
    // headlamp + pilot (cowcatcher)
    head.add(body, { at: [bx1 + 0.08, by + br + 0.12, 0], normal: [1, 0, 0], w: 0.32, h: 0.32, shape: 'round', depth: 0.05 });
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 20).rotateZ(Math.PI / 2), mats.dark, { parent: body, at: [bx1 - 0.08, by + br + 0.12, 0] });
    mesh(roundedBox(0.2, 0.14, 0.18, 0.03), mats.dark, { parent: body, at: [bx1 - 0.3, by + br - 0.02, 0] });
    const pilot = sculpt(smoothShape([[0, 0.12], [0.85, 0.12], [0.1, 0.95], [0, 0.95]]), 2.2, { bevel: 0.03, taper: (x) => 1 - 0.55 * Math.min(1, x / 0.85) });
    mesh(pilot, v.plow ? M.paint('#f9a825') : mats.dark, { parent: body, at: [h - 0.35, 0.0, 0], name: 'pilot' });
    for (const s of [1, -1]) tail.add(body, { at: [-h + 0.3, deckY - 0.1, s * 0.75], normal: [-1, 0, 0], w: 0.14, h: 0.14, shape: 'round', depth: 0.02 });
    emblem(bx1 + 0.065, by, 0, Math.PI / 2, 0.45);
    coupler(body, -h + 0.45, deckY - 0.1, -1, mats, { buffers: true });
    if (v.loaded) {
      // tender coupled behind (coal heap)
      const tx = -h - 3.6;
      const tnd = group('tender', { parent: body, at: [tx, 0, 0] });
      mesh(roundedBox(6.4, 2.3, W - 0.1, 0.1), paint, { parent: tnd, at: [0, deckY + 1.0, 0] });
      mesh(sculpt(smoothShape([[-2.8, 0], [2.8, 0], [2.0, 0.7], [-2.2, 0.55]]), W - 0.5, { bevel: 0.2 }), M.matte('#111', 0.95), { parent: tnd, at: [0, deckY + 2.1, 0], name: 'coal' });
      mesh(roundedBox(6.4, 0.3, 2.0, 0.05), mats.dark, { parent: tnd, at: [0, deckY - 0.15, 0] });
      spins.push(...bogie(tnd, 1.9, { wr: 0.46, axles: 2, mats, name: 'tender_b0', wb: 1.8 }), ...bogie(tnd, -1.9, { wr: 0.46, axles: 2, mats, name: 'tender_b1', wb: 1.8 }));
    }
    branding(deckY + 1.0, 4);
  } else if (kind === 'monorail') {
    // straddle-beam monorail on a short guideway section with two columns
    const beamTop = 2.4;
    const beam = group('guideway', { parent: root });
    mesh(roundedBox(L + 4, 1.5, 0.85, 0.06), M.matte('#bdbdbd', 0.8), { parent: beam, at: [0, beamTop - 0.75, 0] });
    for (const x of [-L / 2, L / 2]) mesh(new THREE.CylinderGeometry(0.55, 0.7, beamTop - 1.5, 20), M.matte('#bdbdbd', 0.8), { parent: beam, at: [x, (beamTop - 1.5) / 2, 0] });
    const y0 = beamTop - 1.0;
    floorTop = y0;
    const cb = carbody({ y0, cabs: v.cabs, nose: v.nose, windows: 'metro', doors: 'tram' });
    // load-wheel bogies on the beam
    for (const [i, x] of [h - 3, -h + 3].entries()) {
      const b = group(`bogie${i}`, { parent: body, at: [x, beamTop, 0] });
      mesh(roundedBox(2.4, 0.5, 1.4, 0.1), mats.dark, { parent: b, at: [0, 0.32, 0] });
      for (const dx of [-0.7, 0.7]) {
        const spin = group(`bogie${i}_tyre${dx > 0 ? 0 : 1}`, { parent: b, at: [dx, 0.5, 0] });
        mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 28).rotateX(Math.PI / 2), mats.rubber, { parent: spin });
        spins.push(spin);
      }
      for (const s of [1, -1]) mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 20), mats.rubber, { parent: b, at: [0, -0.4, s * 0.56] });
    }
    // cut-out skirt hugging the beam
    lightsAt(h - 0.5, 1, y0 + 0.9, W / 2 - 0.55);
    for (const s of [1, -1]) tail.add(body, { at: [-h - 0.01, y0 + 0.7, s * (W / 2 - 0.4)], normal: [-1, 0, 0], w: 0.14, h: 0.14, shape: 'round', depth: 0.02 });
    emblem(h + 0.005, y0 + 0.5, 0, Math.PI / 2, 0.3);
    branding(y0 + 1.5, L);
  } else if (kind === 'boxcar' || kind === 'caboose') {
    const y0 = 1.15;
    floorTop = y0;
    const bx = h - 2.1;
    addBogies([bx, -bx], { wb: 1.75 });
    endFrame(y0 + 0.05);
    if (kind === 'boxcar') {
      const shell = [mesh(roundedBox(L - 0.3, H - y0 - 0.2, W, 0.08), paint, { parent: body, at: [0, (H + y0 - 0.2) / 2 + 0.1, 0] })];
      // ribs
      for (let x = -h + 0.6; x < h - 0.5; x += 0.9) for (const s of [1, -1]) shell.push(mesh(roundedBox(0.09, H - y0 - 0.35, 0.04, 0.02), paint, { parent: body, at: [x, (H + y0) / 2, s * (W / 2 + 0.015)] }));
      mesh(cushion(L - 0.2, 0.18, W + 0.08, { radius: 0.06, bulge: 0.2 }), paint, { parent: body, at: [0, H - 0.05, 0], name: 'roof' });
      // sliding doors + track (animated open)
      const dTracks = [];
      for (const s of [1, -1]) {
        mesh(roundedBox(6, 0.12, 0.08, 0.02), mats.dark, { parent: body, at: [-1.0, H - 0.45, s * (W / 2 + 0.05)] });
        const door = group(`door_${s > 0 ? 'R' : 'L'}`, { parent: body, at: [0, (H + y0) / 2, s * (W / 2 + 0.06)] });
        mesh(roundedBox(3.0, H - y0 - 0.5, 0.06, 0.02), M.paint(v.loaded ? '#6d4c41' : '#7b341a', { metallic: 0.2 }), { parent: door });
        for (const dx of [-1.2, 0, 1.2]) mesh(roundedBox(0.08, H - y0 - 0.6, 0.05, 0.02), mats.dark, { parent: door, at: [dx, 0, s * 0.04] });
        dTracks.push(moveTrack(door, 5, (t) => [-Math.min(1, pingPong(t) * 1.5) * 2.8, (H + y0) / 2, s * (W / 2 + 0.06)]));
      }
      extra.doors = clip('doors', 5, dTracks);
      // ladders + roof walk
      for (const sx of [1, -1]) for (const s of [1, -1]) for (let y = y0 + 0.3; y < H - 0.3; y += 0.4) shell.push(tube([sx * (h - 0.5), y, s * (W / 2 + 0.035)], [sx * (h - 0.9), y, s * (W / 2 + 0.035)], 0.018, mats.yellow, { parent: body }));
      for (const sx of [1, -1]) for (const s of [1, -1]) for (const dx of [0.5, 0.9]) {
        shell.push(tube([sx * (h - dx), y0 + 0.2, s * (W / 2 + 0.03)], [sx * (h - dx), H - 0.2, s * (W / 2 + 0.03)], 0.02, mats.yellow, { parent: body }));
        for (const y of [y0 + 0.25, H - 0.25]) shell.push(mesh(roundedBox(0.05, 0.05, 0.05, 0.01), mats.yellow, { parent: body, at: [sx * (h - dx), y, s * (W / 2 + 0.012)] })); // stand-off brackets
      }
      fuse(body, shell, 'box');
      if (v.loaded) for (const [x, z] of [[-0.6, 0.6], [0.6, 0.6], [0, -0.5]]) mesh(roundedBox(1.0, 1.0, 1.0, 0.04), M.wood('oak'), { parent: body, at: [x, y0 + 0.75, z], name: 'crate' });
      const rep = textMaterial(v.vintage ? 'ORBIX  1923' : 'ORBX 40112', { color: v.accent, font: 'bold 70px Arial' });
      for (const s of [1, -1]) decal(body, rep, { at: [h * 0.55, y0 + 1.6, s * (W / 2 + 0.04)], normal: [0, 0, s], w: 3.2, h: 0.75 });
    } else {
      // caboose: body, cupola, end platforms with railings, marker lamps
      const cbL = L - 2.6;
      mesh(roundedBox(cbL, H - y0 - 0.9, W, 0.08), paint, { parent: body, at: [0, y0 + (H - y0 - 0.9) / 2 + 0.15, 0], name: 'box' });
      mesh(cushion(cbL + 0.2, 0.16, W + 0.1, { radius: 0.06 }), mats.dark, { parent: body, at: [0, H - 0.75, 0] });
      mesh(roundedBox(2.2, 0.8, W - 0.5, 0.06), paint, { parent: body, at: [0, H - 0.3, 0], name: 'cupola' });
      mesh(cushion(2.4, 0.12, W - 0.3, { radius: 0.05 }), mats.dark, { parent: body, at: [0, H + 0.12, 0] });
      for (const s of [1, -1]) {
        mesh(roundedBox(1.6, 0.4, 0.03, 0.05), mats.glass, { parent: body, at: [0, H - 0.3, s * ((W - 0.5) / 2 + 0.005)] });
        for (const x of [-2.4, -0.9, 0.9, 2.4]) mesh(roundedBox(0.7, 0.75, 0.03, 0.05), mats.glass, { parent: body, at: [x, y0 + 1.5, s * (W / 2 + 0.005)] });
      }
      for (const sx of [1, -1]) {
        mesh(roundedBox(1.25, 0.1, W, 0.03), mats.dark, { parent: body, at: [sx * (cbL / 2 + 0.62), y0 + 0.2, 0] });
        const rx = sx * (cbL / 2 + 1.2);
        tube([rx, y0 + 1.2, -W / 2 + 0.1], [rx, y0 + 1.2, W / 2 - 0.1], 0.03, mats.yellow, { parent: body });
        for (const z of [-W / 2 + 0.1, 0, W / 2 - 0.1]) tube([rx, y0 + 0.25, z], [rx, y0 + 1.2, z], 0.025, mats.yellow, { parent: body });
        for (const s of [1, -1]) tube([rx, y0 + 1.2, s * (W / 2 - 0.1)], [sx * cbL / 2, y0 + 1.2, s * (W / 2 - 0.1)], 0.025, mats.yellow, { parent: body });
        mesh(roundedBox(0.04, H - y0 - 1.2, 0.9, 0.02), M.paint('#5d4037'), { parent: body, at: [sx * (cbL / 2 + 0.02), y0 + (H - y0 - 1.2) / 2 + 0.2, 0], name: 'end_door' });
      }
      for (const s of [1, -1]) tail.add(body, { at: [-cbL / 2 - 0.02, H - 1.3, s * (W / 2 - 0.25)], normal: [-1, 0, 0], w: 0.18, h: 0.18, shape: 'round', depth: 0.03 });
      for (const s of [1, -1]) head.add(body, { at: [cbL / 2 + 0.02, H - 1.3, s * (W / 2 - 0.25)], normal: [1, 0, 0], w: 0.16, h: 0.16, shape: 'round', depth: 0.03 });
      if (v.plow) mesh(sculpt(smoothShape([[0, 0.1], [0.7, 0.1], [0.1, 0.8], [0, 0.8]]), 2.6, { bevel: 0.03 }), mats.yellow, { parent: body, at: [h - 0.25, 0, 0], name: 'plow' });
      emblem(0, y0 + 1.0, W / 2 + 0.006, 0, 0.45);
      emblem(0, y0 + 1.0, -W / 2 - 0.006, Math.PI, 0.45);
    }
  } else if (kind === 'tanker') {
    const y0 = 1.15;
    floorTop = y0;
    const bx = h - 2.0;
    addBogies([bx, -bx], { wb: 1.75 });
    endFrame(y0 + 0.05);
    const tr = 1.35;
    const ty = y0 + tr + 0.15;
    const prof = [];
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI / 2; prof.push([Math.sin(a) * tr, -(L / 2 - 0.4) - Math.cos(a) * 0.5 + 0.5]); }
    for (let i = 10; i >= 0; i--) { const a = (i / 10) * Math.PI / 2; prof.push([Math.sin(a) * tr, (L / 2 - 0.4) + Math.cos(a) * 0.5 - 0.5]); }
    mesh(lathe(prof, 48).rotateZ(Math.PI / 2), paint, { parent: body, at: [0, ty, 0], name: 'tank' });
    // saddles to the underframe
    for (const x of [bx, -bx]) mesh(roundedBox(0.8, 0.5, 2.0, 0.08), mats.dark, { parent: body, at: [x, y0 + 0.35, 0] });
    for (const x of [-L * 0.3, 0, L * 0.3]) mesh(new THREE.TorusGeometry(tr + 0.01, 0.04, 8, 48).rotateY(Math.PI / 2), mats.dark, { parent: body, at: [x, ty, 0] });
    mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.35, 24), mats.dark, { parent: body, at: [0, ty + tr + 0.1, 0], name: 'dome' });
    // walkway + rails on top
    mesh(roundedBox(3.0, 0.05, 1.0, 0.02), mats.steel, { parent: body, at: [0, ty + tr - 0.02, 0] });
    for (const s of [1, -1]) tube([-1.4, ty + tr + 0.9, s * 0.5], [1.4, ty + tr + 0.9, s * 0.5], 0.025, mats.yellow, { parent: body });
    for (const s of [1, -1]) for (const x of [-1.4, 0, 1.4]) tube([x, ty + tr - 0.05, s * 0.5], [x, ty + tr + 0.9, s * 0.5], 0.022, mats.yellow, { parent: body });
    for (const s of [1, -1]) for (let y = y0 + 0.4; y < ty + tr - 0.1; y += 0.35) tube([0.9, y, s * (tr + 0.025)], [1.3, y, s * (tr + 0.025)], 0.018, mats.yellow, { parent: body });
    for (const s of [1, -1]) for (const dx of [0.9, 1.3]) tube([dx, y0 + 0.3, s * (tr + 0.025)], [dx, ty + tr * 0.4, s * (tr + 0.025)], 0.02, mats.yellow, { parent: body });
    if (v.loaded) {
      // hazmat placards
      const hz = canvasTex(128, 128, (g) => { g.translate(64, 64); g.rotate(Math.PI / 4); g.fillStyle = '#f57c00'; g.fillRect(-42, -42, 84, 84); g.rotate(-Math.PI / 4); g.fillStyle = '#111'; g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1203', 0, 0); });
      if (hz) for (const s of [1, -1]) decal(body, new THREE.MeshStandardMaterial({ map: hz, transparent: true }), { at: [-3, ty, s * (tr + 0.012)], normal: [0, 0, s], w: 0.8, h: 0.8 });
    }
    const rep = textMaterial(v.vintage ? 'ORBIX OIL' : 'ORBX 77305', { color: v.accent, font: 'bold 70px Arial' });
    for (const s of [1, -1]) decal(body, rep, { at: [L * 0.18, ty - 0.3, s * (tr + 0.012)], normal: [0, 0, s], w: 3.4, h: 0.8 });
  } else if (kind === 'hopper') {
    const y0 = 1.15;
    floorTop = y0;
    const bx = h - 2.0;
    addBogies([bx, -bx], { wb: 1.75 });
    endFrame(y0 + 0.05);
    // slope-sheet body (side profile with three hopper bays)
    const pts = [[-h + 0.3, H], [h - 0.3, H], [h - 0.3, y0 + 1.1], [h - 1.6, y0 + 0.2], [3.4, y0 + 0.2], [2.0, y0 + 1.0], [0.7, y0 + 0.2], [-0.7, y0 + 0.2], [-2.0, y0 + 1.0], [-3.4, y0 + 0.2], [-h + 1.6, y0 + 0.2], [-h + 0.3, y0 + 1.1]];
    const hop = [mesh(sculpt(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), W, { bevel: 0.05, curveSegments: 4 }), paint, { parent: body })];
    for (let x = -h + 0.8; x < h - 0.6; x += 1.0) for (const s of [1, -1]) hop.push(mesh(roundedBox(0.08, H - y0 - 1.3, 0.05, 0.02), paint, { parent: body, at: [x, H - (H - y0 - 1.3) / 2 - 0.05, s * (W / 2 + 0.01)] })); // side stakes
    fuse(body, hop, 'hopper');
    // hopper gates
    for (const x of [-h + 2.4, 0, h - 2.4]) mesh(roundedBox(0.8, 0.3, 1.2, 0.05), mats.dark, { parent: body, at: [x, y0 + 0.15, 0] });
    if (v.loaded) mesh(sculpt(smoothShape([[-h + 0.4, 0], [h - 0.4, 0], [h - 1.5, 0.45], [-h + 1.5, 0.45]]), W - 0.2, { bevel: 0.25 }), M.matte('#121212', 0.95), { parent: body, at: [0, H - 0.25, 0], name: 'coal' });
    else for (let x = -h + 1.5; x < h - 1.4; x += 1.6) mesh(roundedBox(1.4, 0.06, W - 0.4, 0.02), mats.dark, { parent: body, at: [x, H + 0.02, 0], name: 'hatch' });
    const rep = textMaterial('ORBX 21518', { color: v.accent, font: 'bold 70px Arial' });
    for (const s of [1, -1]) decal(body, rep, { at: [0, H - 0.6, s * (W / 2 + 0.04)], normal: [0, 0, s], w: 3.2, h: 0.7 });
  } else if (kind === 'flatcar') {
    const y0 = 1.15;
    floorTop = y0;
    const bx = h - 2.0;
    addBogies([bx, -bx], { wb: 1.75 });
    endFrame(y0 + 0.05);
    const deck = [mesh(roundedBox(L - 0.3, 0.2, W, 0.04), paint, { parent: body, at: [0, y0 + 0.3, 0] })];
    mesh(sculpt(smoothShape([[-h + 1, 0], [h - 1, 0], [h - 3, -0.45], [-h + 3, -0.45]]), 0.5, { bevel: 0.08 }), mats.dark, { parent: body, at: [0, y0 + 0.2, 0], name: 'centre_sill' });
    for (let x = -h + 0.8; x < h - 0.5; x += 1.2) for (const s of [1, -1]) deck.push(mesh(roundedBox(0.12, 0.08, 0.08, 0.02), mats.dark, { parent: body, at: [x, y0 + 0.44, s * (W / 2 - 0.08)] })); // stake pockets
    fuse(body, deck, 'deck');
    // containers (corrugated) with doors and lettering
    const colors = ['#1565c0', '#c62828', '#2e7d32', '#f9a825'];
    const box = (x, y, len, ci) => {
      const g = group('container', { parent: body, at: [x, y, 0] });
      mesh(roundedBox(len, 2.59, 2.44, 0.03), M.paint(colors[ci % 4], { metallic: 0.2, roughness: 0.6 }), { parent: g, at: [0, 1.295, 0] });
      for (let k = -len / 2 + 0.15; k < len / 2 - 0.1; k += 0.3) for (const s of [1, -1]) mesh(roundedBox(0.12, 2.3, 0.03, 0.01), M.paint(colors[ci % 4], { metallic: 0.2, roughness: 0.6 }), { parent: g, at: [k, 1.295, s * 1.23] });
      for (const s of [1, -1]) decal(g, textMaterial('ORBX', { color: '#ffffff', font: 'bold 90px Arial' }), { at: [0, 1.8, s * 1.255], normal: [0, 0, s], w: 2.2, h: 0.55 });
      mesh(roundedBox(0.04, 2.4, 2.3, 0.01), mats.dark, { parent: g, at: [-len / 2 - 0.01, 1.295, 0] });
      return g;
    };
    const deckTop = y0 + 0.4;
    if (v.loaded) {
      box(0, deckTop, 12.19, 0);
      box(0, deckTop + 2.6, 12.19, 1);
    } else {
      box(h / 2 - 0.2, deckTop, 6.06, 0);
      box(-h / 2 + 0.2, deckTop, 6.06, 2);
    }
  }

  // ---------------- trims shared across kinds ----------------
  if (v.plow && (kind === 'box' || kind === 'hood') && (v.cabs ?? 0) >= 1) {
    const plow = sculpt(smoothShape([[0, 0.08], [0.7, 0.08], [0.1, 0.85], [0, 0.85]]), W - 0.3, { bevel: 0.03, taper: (x) => 1 - 0.5 * Math.min(1, x / 0.7) });
    mesh(plow, mats.yellow, { parent: body, at: [h - 0.15, 0, 0], name: 'plow' });
  }
  if (v.roofGear && kind !== 'flatcar' && kind !== 'steam') {
    const roofY = kind === 'hood' ? H : kind === 'tanker' ? floorTop + 2.95 + 0.05 : kind === 'hopper' ? H : H;
    if (kind === 'tanker') mesh(roundedBox(1.2, 0.3, 0.7, 0.06), mats.dark, { parent: body, at: [-2, roofY, 0], name: 'roof_unit' });
    else for (const x of [-h * 0.5, h * 0.5]) mesh(cushion(2.6, 0.32, W * 0.62, { radius: 0.1, bulge: 0.15 }), M.matte('#cfd8dc', 0.5), { parent: body, at: [x, roofY + 0.12, 0], name: 'roof_unit' });
  }
  if (v.modern && (kind === 'box' || kind === 'monorail')) for (const s of [1, -1]) {
    // LED strip along the cant rail
    lampGroup('cant_led', 'white').add(body, { at: [0, H - 0.55, s * (W / 2 - 0.02)], normal: [0, 0, s], w: L - 3, h: 0.04, shape: 'strip', depth: 0.008, bezel: false, glowSize: 0.3 });
  }
  if (v.vintage && kind === 'box' && !v.cabs) {
    // clerestory roof strip
    mesh(roundedBox(L - 3, 0.35, 1.1, 0.06), paint, { parent: body, at: [0, H + 0.12, 0], name: 'clerestory' });
  }

  // ---------------- animations ----------------
  const wr = kind === 'steam' ? 0.78 : kind === 'monorail' ? 0.5 : v.wr;
  const speed = o.speed ?? 8;
  const period = (Math.PI * 2 * wr) / speed;
  const animations = [clip('drive', period, spins.map((s) => spinTrack(s, 'z', period, -1))), clip('reverse', period * 2, spins.map((s) => spinTrack(s, 'z', period * 2, 1)))];
  if (extra.rods) {
    const r = 0.32;
    animations[0].tracks.push(...extra.rods.map((rod) => moveTrack(rod, period, (t) => [-Math.sin(t * Math.PI * 2) * r, wr - Math.cos(t * Math.PI * 2) * r, rod.position.z], 24)));
  }
  const lightTracks = [...(head.meshes.length ? lampTracks('headlights', v.modern ? LAMP_ON.drl * 2 : LAMP_ON.head) : []), ...(tail.meshes.length ? lampTracks('taillights', LAMP_ON.tail, { glow: 0.7 }) : []), ...(marker.meshes.length ? lampTracks('markers', 3) : [])];
  if (v.modern && body.getObjectByName('cant_led')) lightTracks.push(...lampTracks('cant_led', 2, { glow: 0.5 }));
  if (lightTracks.length) animations.push(clip('lights', 1, lightTracks));
  if (extra.length) animations.push(clip('pantograph', 4, extra.filter((t) => t.times)));
  if (extra.doors) animations.push(extra.doors);
  // densify big flat panels (long sliver triangles) so roof gear, lamps and fittings bed into real surface
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh || Array.isArray(m.material) || Object.keys(m.geometry.morphAttributes || {}).length) return;
    const g = m.geometry;
    const before = (g.index ? g.index.count : g.attributes.position.count) / 3;
    const out = splitLong(g, 0.4);
    if (out.attributes.position.count / 3 > before) m.geometry = out;
  });
  finalize(root, { type: 'train', variant, options: o, animations });
  root.userData.premade.exclusive = [['drive', 'reverse']];
  return root;
}
